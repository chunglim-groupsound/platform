import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/interview-slots — PENDING 신청자용 슬롯 목록 조회
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (profile?.status !== 'PENDING') {
    return NextResponse.json({ error: '접근 권한 없음' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('interview_slots')
    .select('id, slot_at, capacity')
    .order('slot_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
