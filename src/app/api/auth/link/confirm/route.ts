// src/app/api/auth/link/confirm/route.ts
// 선택한 임포트 레코드에 linked_auth_id를 기록하고
// 트리거가 생성한 PENDING 레코드를 삭제

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. 로그인 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  // 2. 요청 파싱
  const { targetUserId } = await request.json()
  if (!targetUserId) {
    return NextResponse.json({ error: 'targetUserId가 필요합니다.' }, { status: 400 })
  }

  // 3. 대상 레코드 검증
  //    - 임포트 레코드인지 (kakao_id가 imported_ 접두사)
  //    - 이미 다른 계정과 연동되지 않았는지
  const { data: target, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('id, kakao_id, linked_auth_id, status')
    .eq('id', targetUserId)
    .single()

  if (fetchError || !target) {
    return NextResponse.json({ error: '대상 레코드를 찾을 수 없습니다.' }, { status: 404 })
  }

  if (!target.kakao_id.startsWith('imported_')) {
    return NextResponse.json({ error: '임포트 레코드가 아닙니다.' }, { status: 400 })
  }

  if (target.linked_auth_id !== null) {
    return NextResponse.json({ error: '이미 다른 계정과 연동된 레코드입니다.' }, { status: 409 })
  }

  // 4. 현재 유저의 실제 kakao_id 추출
  const realKakaoId: string =
    user.user_metadata?.provider_id ?? user.id

  // 5. 임포트 레코드에 linked_auth_id와 실제 kakao_id 업데이트
  //    id는 건드리지 않음 (FK 제약 안전)
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      linked_auth_id: user.id,   // 실제 로그인 auth 계정 연결
      kakao_id: realKakaoId,     // 임시값 → 실제 카카오 ID 교체
    })
    .eq('id', targetUserId)

  if (updateError) {
    return NextResponse.json({ error: '연동 업데이트 실패: ' + updateError.message }, { status: 500 })
  }

  // 6. 트리거가 만든 PENDING 레코드 삭제
  //    현재 user.id로 생성된 PENDING 레코드 (연동과 무관한 임시 레코드)
  const { error: deleteError } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', user.id)       // 트리거가 만든 레코드의 id = auth user id
    .eq('status', 'PENDING') // 안전 조건: PENDING 상태인 것만 삭제

  if (deleteError) {
    // 삭제 실패해도 연동 자체는 성공이므로 경고만 로그
    console.warn('PENDING 레코드 삭제 실패 (무시 가능):', deleteError.message)
  }

  // 7. member_history에 연동 이력 기록
  await supabaseAdmin
    .from('member_history')
    .insert({
      user_id:    targetUserId,
      from_status: target.status,
      to_status:  target.status,  // 상태 변경 없음
      changed_by: null,           // 시스템 처리
      reason:     `카카오 계정 연동 완료 (auth_id: ${user.id})`,
    })

  return NextResponse.json({ success: true })
}