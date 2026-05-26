// src/app/api/admin/applications/schedule/route.ts
// 면접 일정 입력 → join_applications 업데이트 + 상태 INTERVIEWING 전환

import { createClient } from '@/lib/supabase/server'
import { transitionMemberStatus } from '@/lib/member/transitions'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. 호출자 인증 + 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['ADMIN', 'SUPER_ADMIN'].includes(caller?.role ?? '')) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { applicationId, userId, interviewScheduledAt } = await request.json()

  // 2. join_applications 테이블에 면접 일정 저장
  const { error: appError } = await supabase
    .from('join_applications')
    .update({ interview_scheduled_at: interviewScheduledAt })
    .eq('id', applicationId)

  if (appError) {
    return NextResponse.json({ error: appError.message }, { status: 500 })
  }

  // 3. 회원 상태 PENDING → INTERVIEWING 전환
  //    이미 INTERVIEWING이면 전이 불필요 (에러 무시)
  try {
    await transitionMemberStatus({
      userId,
      toStatus: 'INTERVIEWING',
      changedBy: user.id,
      reason: `면접 일정 확정: ${interviewScheduledAt}`,
    })
  } catch (e: any) {
    // 이미 INTERVIEWING인 경우 — 일정만 업데이트하고 계속 진행
    if (!e.message.includes('허용되지 않습니다')) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
  }

  // 4. (Phase 2) 여기에 신청자에게 면접 일정 알림 발송 추가
  // await sendInterviewScheduleNotification(userId, interviewScheduledAt)

  return NextResponse.json({ success: true })
}
