import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 비로그인 포함 누구나 조회 가능 — 모집 중 여부만 반환
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recruitment_periods')
    .select('is_open, open_at, close_at')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? { is_open: false, open_at: null, close_at: null })
}
