import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { members } = await request.json()

  // session 필드를 배열로 변환 (CSV에서 "기타,보컬" → ['기타', '보컬'])
  const formatted = members.map((m: any) => ({
    ...m,
    generation: Number(m.generation),
    session: m.session ? m.session.split(',').map((s: string) => s.trim()) : [],
    is_whitelist: m.is_whitelist === 'true',
    kakao_id: `imported_${m.name}_${Date.now()}`, // 임시 kakao_id
    status: m.status || 'ACTIVE',
    role: m.status === 'ACTIVE' ? 'MEMBER' : 'PROBATION_MEMBER',
  }))

  const { error } = await supabaseAdmin
    .from('users')
    .upsert(formatted, { onConflict: 'kakao_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ imported: formatted.length })
}