import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAdminRole } from '@/lib/constants'

// DELETE /api/admin/interview-slots/[id] — 슬롯 삭제 (선택자 없을 때만)
export async function DELETE(
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

  // 이미 선택한 신청자가 있으면 삭제 불가
  const { count } = await supabase
    .from('interview_preferences')
    .select('id', { count: 'exact', head: true })
    .eq('slot_id', id)

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: '이미 선택한 신청자가 있어 삭제할 수 없습니다.' }, { status: 409 })
  }

  const { error } = await supabase.from('interview_slots').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
