import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api/response'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('인증 필요', 401)

  const { data: profile } = await supabase
    .from('users')
    .select('status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (profile?.status !== 'PENDING') {
    return apiError('접근 권한 없음', 403)
  }

  const { data, error } = await supabase
    .from('interview_slots')
    .select('id, slot_at, capacity')
    .order('slot_at', { ascending: true })

  if (error) return apiError('서버 오류가 발생했습니다', 500)
  return apiSuccess(data)
}
