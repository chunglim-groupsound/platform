// src/app/api/auth/link/confirm/route.ts
// 연동 확정 + 빈 필드 일괄 채우기

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, apiSuccess } from '@/lib/api/response'
import type { Database } from '@/types/database'

type UsersUpdate = Database['public']['Tables']['users']['Update']

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. 로그인 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('인증 필요', 401)
  }

  // 2. 요청 파싱
  const { targetUserId } = await request.json()
  if (!targetUserId) {
    return apiError('targetUserId가 필요합니다.', 400)
  }

  // 3. 대상 레코드 검증
  const { data: target, error: fetchError } = await createAdminClient()
    .from('users')
    .select('id, kakao_id, linked_auth_id, status, name')
    .eq('id', targetUserId)
    .single()

  if (fetchError || !target) {
    return apiError('대상 레코드를 찾을 수 없습니다.', 404)
  }
  if (!target.kakao_id.startsWith('imported_')) {
    return apiError('임포트 레코드가 아닙니다.', 400)
  }
  if (target.linked_auth_id !== null) {
    return apiError('이미 연동된 레코드입니다.', 409)
  }

  // 4. 카카오에서 가져올 수 있는 정보 추출
  const realKakaoId       = user.user_metadata?.provider_id ?? user.id
  const kakaoProfileImage = user.user_metadata?.avatar_url  ?? null
  const kakaoNickname     = user.user_metadata?.name
                         ?? user.user_metadata?.full_name
                         ?? null
  const now = new Date().toISOString()

  // 5. 임포트 레코드 업데이트
  //    - linked_auth_id: 실제 auth 계정 연결
  //    - kakao_id: 실제 카카오 ID로 교체
  //    - profile_image_url: 카카오 프로필 사진 (없으면 기존 값 유지)
  //    - activated_at: 이미 ACTIVE면 지금 시각으로 채움
  //    - privacy_agreed_at: 연동 시점에 동의한 것으로 처리
  //    - last_active_at: 연동 시점 기록
  const updatePayload: UsersUpdate = {
    linked_auth_id:    user.id,
    kakao_id:          realKakaoId,
    privacy_agreed_at: now,
    last_active_at:    now,
  }

  // 프로필 사진: 기존에 없으면 카카오 것으로 채움
  if (kakaoProfileImage) {
    updatePayload.profile_image_url = kakaoProfileImage
  }

  // activated_at: ACTIVE 상태인데 비어있으면 채움
  if (target.status === 'ACTIVE') {
    updatePayload.activated_at = now
  }

  // name: 카카오 이름이 있고 기존 이름이 '이름 미설정'이면 교체
  if (kakaoNickname && target.name === '이름 미설정') {
    updatePayload.name = kakaoNickname
  }

  const { error: updateError } = await createAdminClient()
    .from('users')
    .update(updatePayload)
    .eq('id', targetUserId)

  if (updateError) {
    return apiError('연동 업데이트 실패', 500)
  }

  // 6. 트리거가 만든 PENDING 레코드 삭제
  const { error: deleteError } = await createAdminClient()
    .from('users')
    .delete()
    .eq('kakao_id', realKakaoId)
    .eq('status', 'PENDING')
    .neq('id', targetUserId)

  if (deleteError) {
    console.warn('PENDING 레코드 삭제 실패 (무시 가능):', deleteError.message)
  }

  // 7. member_history 연동 이력 기록
  await createAdminClient()
    .from('member_history')
    .insert({
      user_id:     targetUserId,
      from_status: target.status,
      to_status:   target.status,
      changed_by:  null,
      reason:      `카카오 계정 연동 완료 (auth_id: ${user.id})`,
    })

  return apiSuccess({ success: true })
}
