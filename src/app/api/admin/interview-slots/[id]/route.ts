import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api/response'
import { isAdminRole } from '@/lib/constants'

// DELETE /api/admin/interview-slots/[id] — 슬롯 삭제 (선택자 없을 때만)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('인증 필요', 401)

  const { data: caller } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!isAdminRole(caller?.role)) {
    return apiError('권한 없음', 403)
  }

  // 이미 선택한 신청자가 있으면 삭제 불가
  const { count } = await supabase
    .from('interview_preferences')
    .select('id', { count: 'exact', head: true })
    .eq('slot_id', id)

  if ((count ?? 0) > 0) {
    return apiError('이미 선택한 신청자가 있어 삭제할 수 없습니다.', 409)
  }

  const { error } = await supabase.from('interview_slots').delete().eq('id', id)
  if (error) return apiError('서버 오류가 발생했습니다', 500)
  return apiSuccess({ success: true })
}
