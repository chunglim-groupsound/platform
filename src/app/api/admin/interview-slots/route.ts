import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAdminRole } from '@/lib/constants'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: '인증 필요' }, { status: 401 }), supabase: null, user: null }

  const { data: caller } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!isAdminRole(caller?.role)) {
    return { error: NextResponse.json({ error: '권한 없음' }, { status: 403 }), supabase: null, user: null }
  }

  return { error: null, supabase, user }
}

// GET /api/admin/interview-slots — 생성된 슬롯 목록 조회 (선택자 수 포함)
export async function GET() {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  const { data, error: dbError } = await supabase!
    .from('interview_slots')
    .select(`
      id, slot_at, capacity, created_at,
      interview_preferences (count)
    `)
    .order('slot_at', { ascending: true })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/interview-slots — 슬롯 생성 (복수)
// body: { slots: [{ slot_at: string, capacity?: number }] }
export async function POST(request: Request) {
  const { error, supabase, user } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const slots: { slot_at: string; capacity?: number }[] = body.slots ?? []

  if (!slots.length) {
    return NextResponse.json({ error: '슬롯이 없습니다.' }, { status: 400 })
  }

  const rows = slots.map(s => ({
    slot_at:    s.slot_at,
    capacity:   s.capacity ?? 5,
    created_by: user!.id,
  }))

  const { error: dbError } = await supabase!.from('interview_slots').insert(rows)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
