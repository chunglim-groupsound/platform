// src/app/api/admin/import/route.ts
// CSV 임포트 API — imported_ 접두사 형식 통일

import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

interface CsvRow {
  name: string
  generation: string
  session: string
  phone?: string
  is_whitelist?: string
  status?: string
  role?: string
}

export async function POST(request: Request) {
  const { members }: { members: CsvRow[] } = await request.json()

  if (!members || members.length === 0) {
    return NextResponse.json({ error: '데이터가 없습니다.' }, { status: 400 })
  }

  // CSV 데이터 정제
  const formatted = members.map((m) => {
    // session: "기타,보컬" → ['기타', '보컬']
    const sessionArr = m.session
      ? m.session.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []

    const status = (m.status?.toUpperCase() ?? 'ACTIVE') as string

    // role: status 기반 자동 결정
    const role = (() => {
      if (m.role) return m.role.toUpperCase()
      if (status === 'ACTIVE')   return 'MEMBER'
      if (status === 'PROBATION') return 'PROBATION_MEMBER'
      return 'MEMBER'
    })()

    return {
      // kakao_id: 검색 시 식별할 수 있도록 이름+기수+타임스탬프 조합
      // 나중에 /api/auth/link/search에서 like 'imported_%' 로 필터링
      kakao_id:         `imported_${m.name}_${m.generation}_${Date.now()}`,
      name:             m.name.trim(),
      generation:       Number(m.generation),
      session:          sessionArr,
      phone:            m.phone?.trim() ?? null,
      is_whitelist:     m.is_whitelist === 'true',
      status,
      role,
      linked_auth_id:   null,  // 연동 전이므로 null
    }
  })

  // upsert: 같은 name+generation 조합 있으면 건너뜀 (중복 방지)
  // kakao_id는 매번 달라지므로 name+generation으로 중복 판단
  // 단순 insert로 변경하고 중복은 무시
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert(formatted)
    .select('id, name, generation')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    imported: data?.length ?? formatted.length,
    members: data,
  })
}