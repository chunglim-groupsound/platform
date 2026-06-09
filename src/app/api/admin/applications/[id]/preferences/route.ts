import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAdminRole } from '@/lib/constants'

// GET /api/admin/applications/[id]/preferences — 신청자 희망 슬롯 목록 조회
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: caller } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!isAdminRole(caller?.role)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('interview_preferences')
    .select('slot_id')
    .eq('application_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.map(d => d.slot_id) ?? [])
}
