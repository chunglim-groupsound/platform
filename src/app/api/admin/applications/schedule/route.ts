// src/app/api/admin/applications/schedule/route.ts
// 면접 슬롯 확정 → join_applications 업데이트 + 상태 INTERVIEWING 전환

import { createClient } from '@/lib/supabase/server'
import { transitionMemberStatus } from '@/lib/member/transitions'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

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

  const { applicationId, userId, slotId } = await request.json()

  if (!applicationId || !userId || !slotId) {
    return NextResponse.json({ error: 'applicationId, userId, slotId가 필요합니다.' }, { status: 400 })
  }

  // confirmed_slot_id 업데이트
  const { error: appError } = await supabase
    .from('join_applications')
    .update({ confirmed_slot_id: slotId })
    .eq('id', applicationId)

  if (appError) {
    return NextResponse.json({ error: appError.message }, { status: 500 })
  }

  // 회원 상태 PENDING → INTERVIEWING 전환
  // 이미 INTERVIEWING이면 슬롯 업데이트만 하고 계속 진행
  try {
    const { data: slot } = await supabase
      .from('interview_slots')
      .select('slot_at')
      .eq('id', slotId)
      .single()

    await transitionMemberStatus({
      userId,
      toStatus: 'INTERVIEWING',
      changedBy: user.id,
      reason: `면접 슬롯 확정: ${slot?.slot_at ?? slotId}`,
    })
  } catch (e: any) {
    if (!e.message.includes('허용되지 않습니다')) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
  }

  return NextResponse.json({ success: true })
}
