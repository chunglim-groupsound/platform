// src/app/api/admin/members/link-status/route.ts
// 운영진이 임포트 레코드 중 연동 완료/미완료 현황을 확인하는 API

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAdminRole } from '@/lib/constants'

export async function GET() {
  const supabase = await createClient()

  // 호출자 권한 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(caller?.role)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  // 임포트 레코드 전체 조회 (연동 여부 포함)
  const { data: allImported } = await supabase
    .from('users')
    .select('id, name, generation, session, status, linked_auth_id, kakao_id, created_at')
    .like('kakao_id', 'imported_%')
    .order('generation', { ascending: true })

  const linked    = allImported?.filter(m => m.linked_auth_id !== null) ?? []
  const notLinked = allImported?.filter(m => m.linked_auth_id === null)  ?? []

  return NextResponse.json({
    total:     allImported?.length ?? 0,
    linked:    linked.length,
    notLinked: notLinked.length,
    members: {
      linked:    linked.map(m => ({ id: m.id, name: m.name, generation: m.generation, session: m.session, status: m.status })),
      notLinked: notLinked.map(m => ({ id: m.id, name: m.name, generation: m.generation, session: m.session, status: m.status })),
    },
  })
}