import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api/response'

async function getPendingUser(supabase: Awaited<ReturnType<typeof createClient>>, authUserId: string) {
  const { data } = await supabase
    .from('users')
    .select('id, status')
    .or(`id.eq.${authUserId},linked_auth_id.eq.${authUserId}`)
    .maybeSingle()
  return data
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('인증 필요', 401)

  const profile = await getPendingUser(supabase, user.id)
  if (profile?.status !== 'PENDING') {
    return apiError('접근 권한 없음', 403)
  }

  const { slotIds }: { slotIds: string[] } = await request.json()
  if (!Array.isArray(slotIds)) {
    return apiError('slotIds 배열이 필요합니다.', 400)
  }

  const { data: application } = await supabase
    .from('join_applications')
    .select('id')
    .eq('user_id', profile!.id)
    .maybeSingle()

  if (!application) {
    return apiError('신청서가 없습니다.', 404)
  }

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
    if (error) return apiError('서버 오류가 발생했습니다', 500)
  }

  return apiSuccess({ success: true })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('인증 필요', 401)

  const profile = await getPendingUser(supabase, user.id)
  if (!profile) return apiSuccess([])

  const { data: application } = await supabase
    .from('join_applications')
    .select('id')
    .eq('user_id', profile.id)
    .maybeSingle()

  if (!application) return apiSuccess([])

  const { data, error } = await supabase
    .from('interview_preferences')
    .select('slot_id')
    .eq('application_id', application.id)

  if (error) return apiError('서버 오류가 발생했습니다', 500)
  return apiSuccess(data?.map(d => d.slot_id) ?? [])
}
