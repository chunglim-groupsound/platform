import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api/response'
import { isAdminRole } from '@/lib/constants'

// GET /api/admin/applications/[id]/preferences — 신청자 희망 슬롯 목록 조회
export async function GET(
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

  const { data, error } = await supabase
    .from('interview_preferences')
    .select('slot_id')
    .eq('application_id', id)

  if (error) return apiError('서버 오류가 발생했습니다', 500)
  return apiSuccess(data?.map(d => d.slot_id) ?? [])
}
