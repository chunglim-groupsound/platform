import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { transitionMemberStatus } from '@/lib/member/transitions'
import { NextResponse } from 'next/server'
import { isAdminRole } from '@/lib/constants'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. 호출자 인증 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  // 2. 호출자 역할 확인 (ADMIN 이상만 허용)
  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(caller?.role)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  // 3. 상태 전이 실행
  const { userId, toStatus, reason } = await request.json()

  try {
    const result = await transitionMemberStatus({
      userId,
      toStatus,
      changedBy: user.id,
      reason,
    })
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}