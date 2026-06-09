// src/app/api/admin/applications/result/route.ts
// 합격 → PROBATION 전환 / 불합격 → WITHDRAWN 전환

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { transitionMemberStatus } from '@/lib/member/transitions'
import { apiError, apiSuccess } from '@/lib/api/response'
import { isAdminRole } from '@/lib/constants'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. 호출자 인증 + 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('인증 필요', 401)

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(caller?.role)) {
    return apiError('권한 없음', 403)
  }

  const { applicationId, userId, result, adminNote, reason } = await request.json()

  if (!['PASS', 'FAIL'].includes(result)) {
    return apiError('올바르지 않은 결과값', 400)
  }

  // 2. join_applications 결과 저장
  //    admin_note는 민감 정보이므로 service role key 사용
  const { error: appError } = await createAdminClient()
    .from('join_applications')
    .update({
      interview_result: result,
      admin_note: adminNote ?? null,
    })
    .eq('id', applicationId)

  if (appError) {
    return apiError('서버 오류가 발생했습니다', 500)
  }

  // 3. 상태 전이
  //    합격: INTERVIEWING → PROBATION
  //    불합격: INTERVIEWING → WITHDRAWN
  const toStatus = result === 'PASS' ? 'PROBATION' : 'WITHDRAWN'
  const defaultReason = result === 'PASS' ? '면접 합격' : '면접 불합격'

  try {
    await transitionMemberStatus({
      userId,
      toStatus,
      changedBy: user.id,
      reason: reason?.trim() || defaultReason,
    })
  } catch (e: unknown) {
    return apiError((e as Error).message, 400)
  }

  // 4. (Phase 2) 합격 시 합격 알림 발송
  // if (result === 'PASS') {
  //   await sendPassNotification(userId)
  // }

  return apiSuccess({ success: true, toStatus })
}
