// src/app/api/admin/applications/result/route.ts
// 합격 → PROBATION 전환 / 불합격 → WITHDRAWN 전환

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
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

  const { applicationId, userId, result, adminNote } = await request.json()

  if (!['PASS', 'FAIL'].includes(result)) {
    return NextResponse.json({ error: '올바르지 않은 결과값' }, { status: 400 })
  }

  // 2. join_applications 결과 저장
  //    admin_note는 민감 정보이므로 service role key 사용
  const { error: appError } = await supabaseAdmin
    .from('join_applications')
    .update({
      interview_result: result,
      admin_note: adminNote ?? null,
    })
    .eq('id', applicationId)

  if (appError) {
    return NextResponse.json({ error: appError.message }, { status: 500 })
  }

  // 3. 상태 전이
  //    합격: INTERVIEWING → PROBATION
  //    불합격: INTERVIEWING → WITHDRAWN
  const toStatus = result === 'PASS' ? 'PROBATION' : 'WITHDRAWN'

  try {
    await transitionMemberStatus({
      userId,
      toStatus,
      changedBy: user.id,
      reason: result === 'PASS' ? '면접 합격' : '면접 불합격',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }

  // 4. (Phase 2) 합격 시 합격 알림 발송
  // if (result === 'PASS') {
  //   await sendPassNotification(userId)
  // }

  return NextResponse.json({ success: true, toStatus })
}
