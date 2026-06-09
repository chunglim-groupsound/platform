import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, apiSuccess } from '@/lib/api/response'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('인증 필요', 401)

  const [{ data: callerProfile }, { data: team }] = await Promise.all([
    createAdminClient()
      .from('users')
      .select('id')
      .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
      .maybeSingle(),
    createAdminClient()
      .from('teams')
      .select('leader_id, vice_leader_id')
      .eq('id', teamId)
      .single(),
  ])

  if (!team) return apiError('팀을 찾을 수 없습니다', 404)

  const myIds = [...new Set([callerProfile?.id, user.id].filter(Boolean) as string[])]

  if (myIds.includes(team.leader_id ?? '')) {
    return apiError('팀장은 팀을 나갈 수 없습니다. 팀장 위임 후 나가주세요.', 400)
  }

  if (myIds.includes(team.vice_leader_id ?? '')) {
    await createAdminClient()
      .from('teams')
      .update({ vice_leader_id: null })
      .eq('id', teamId)
  }

  const { error } = await createAdminClient()
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .in('user_id', myIds)

  if (error) return apiError('서버 오류가 발생했습니다', 500)

  await createAdminClient()
    .from('team_join_requests')
    .delete()
    .eq('team_id', teamId)
    .in('applicant_id', myIds)

  return apiSuccess({ success: true })
}
