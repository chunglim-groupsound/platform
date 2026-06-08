import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getPendingUser(supabase: Awaited<ReturnType<typeof createClient>>, authUserId: string) {
  const { data } = await supabase
    .from('users')
    .select('id, status')
    .or(`id.eq.${authUserId},linked_auth_id.eq.${authUserId}`)
    .maybeSingle()
  return data
}

// POST /api/interview-preferences — 희망 슬롯 제출/수정 (전체 교체)
// body: { slotIds: string[] }
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const profile = await getPendingUser(supabase, user.id)
  if (profile?.status !== 'PENDING') {
    return NextResponse.json({ error: '접근 권한 없음' }, { status: 403 })
  }

  const { slotIds }: { slotIds: string[] } = await request.json()
  if (!Array.isArray(slotIds)) {
    return NextResponse.json({ error: 'slotIds 배열이 필요합니다.' }, { status: 400 })
  }

  // 신청서 조회
  const { data: application } = await supabase
    .from('join_applications')
    .select('id')
    .eq('user_id', profile!.id)
    .maybeSingle()

  if (!application) {
    return NextResponse.json({ error: '신청서가 없습니다.' }, { status: 404 })
  }

  // 기존 희망 슬롯 삭제 후 새로 삽입 (전체 교체)
  await supabase
    .from('interview_preferences')
    .delete()
    .eq('application_id', application.id)

  if (slotIds.length > 0) {
    const rows = slotIds.map(slotId => ({
      application_id: application.id,
      user_id:        profile!.id,
      slot_id:        slotId,
    }))

    const { error } = await supabase.from('interview_preferences').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// GET /api/interview-preferences/me — 본인 희망 슬롯 조회
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const profile = await getPendingUser(supabase, user.id)
  if (!profile) return NextResponse.json([])

  const { data: application } = await supabase
    .from('join_applications')
    .select('id')
    .eq('user_id', profile.id)
    .maybeSingle()

  if (!application) return NextResponse.json([])

  const { data, error } = await supabase
    .from('interview_preferences')
    .select('slot_id')
    .eq('application_id', application.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.map(d => d.slot_id) ?? [])
}
