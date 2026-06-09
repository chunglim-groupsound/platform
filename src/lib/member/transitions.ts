import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type UsersUpdate = Database['public']['Tables']['users']['Update']
type MemberStatus = Database['public']['Enums']['member_status']

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING:      ['INTERVIEWING', 'WITHDRAWN'],
  INTERVIEWING: ['PROBATION', 'WITHDRAWN'],
  PROBATION:    ['ACTIVE', 'WITHDRAWN'],
  ACTIVE:       ['INACTIVE', 'WITHDRAWN'],
  INACTIVE:     ['ACTIVE', 'WITHDRAWN'],
  WITHDRAWN:    [],
}

export async function transitionMemberStatus({
  userId,
  toStatus,
  changedBy,      // 운영진 user_id. 시스템 자동이면 null
  reason,
}: {
  userId: string
  toStatus: MemberStatus
  changedBy: string | null
  reason?: string
}) {
  const supabase = await createClient()

  // 1. 현재 상태 조회
  const { data: current, error: fetchError } = await supabase
    .from('users')
    .select('status')
    .eq('id', userId)
    .single()

  if (fetchError || !current) throw new Error('유저를 찾을 수 없습니다.')

  const fromStatus = current.status

  // 2. 허용 여부 검증
  if (!ALLOWED_TRANSITIONS[fromStatus]?.includes(toStatus)) {
    throw new Error(`${fromStatus} → ${toStatus} 전이는 허용되지 않습니다.`)
  }

  // 3. users 테이블 업데이트
  const updateData: Record<string, unknown> = { status: toStatus }

  if (toStatus === 'PROBATION') {
    updateData.probation_started_at = new Date().toISOString()
  }
  if (toStatus === 'ACTIVE') {
    updateData.activated_at = new Date().toISOString()
    // ACTIVE 전환 시 역할을 MEMBER로 승급 (PROBATION_MEMBER에서)
    updateData.role = 'MEMBER'
  }

  const { error: updateError } = await supabase
    .from('users')
    .update(updateData as UsersUpdate)
    .eq('id', userId)

  if (updateError) throw new Error('상태 업데이트 실패: ' + updateError.message)

  // 4. member_history 이력 기록 (SECURITY DEFINER 함수 또는 service role 사용)
  await supabase
    .from('member_history')
    .insert({
      user_id:    userId,
      from_status: fromStatus,
      to_status:  toStatus,
      changed_by: changedBy,
      reason:     reason ?? null,
    })

  // 5. (Phase 2) 여기에 알림 발송 로직 추가
  // await sendKakaoNotification(userId, toStatus)

  return { success: true, fromStatus, toStatus }
}