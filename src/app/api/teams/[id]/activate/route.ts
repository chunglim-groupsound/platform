import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRole } from '@/lib/constants'
import { apiError, apiSuccess } from '@/lib/api/response'

async function resolveAccess(userId: string, teamId: string) {
  const [{ data: callerProfile }, { data: team }] = await Promise.all([
    createAdminClient()
      .from('users')
      .select('id, role')
      .or(`id.eq.${userId},linked_auth_id.eq.${userId}`)
      .maybeSingle(),
    createAdminClient()
      .from('teams')
      .select('leader_id, vice_leader_id, is_active, activation_requested')
      .eq('id', teamId)
      .single(),
  ])
  const myId         = callerProfile?.id ?? ''
  const isAdmin      = isAdminRole(callerProfile?.role)
  const isLeader     = team?.leader_id      === myId
  const isViceLeader = team?.vice_leader_id === myId
  return { callerProfile, team, isAdmin, isLeader, isViceLeader }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('인증 필요', 401)

  const { team, isLeader, isViceLeader } = await resolveAccess(user.id, teamId)

  if (!team) return apiError('팀을 찾을 수 없습니다', 404)
  if (!isLeader && !isViceLeader) {
    return apiError('팀장 또는 부팀장만 신청할 수 있습니다', 403)
  }
  if (team.is_active) {
    return apiError('이미 활성화된 팀입니다', 409)
  }
  if (team.activation_requested) {
    return apiError('이미 신청 중입니다', 409)
  }

  const { error } = await createAdminClient()
    .from('teams')
    .update({ activation_requested: true })
    .eq('id', teamId)

  if (error) return apiError('서버 오류가 발생했습니다', 500)

  return apiSuccess({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('인증 필요', 401)

  const { team, isLeader, isViceLeader } = await resolveAccess(user.id, teamId)

  if (!team) return apiError('팀을 찾을 수 없습니다', 404)
  if (!isLeader && !isViceLeader) {
    return apiError('취소 권한이 없습니다', 403)
  }

  const { error } = await createAdminClient()
    .from('teams')
    .update({ activation_requested: false })
    .eq('id', teamId)

  if (error) return apiError('서버 오류가 발생했습니다', 500)

  return apiSuccess({ success: true })
}
