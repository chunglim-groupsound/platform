import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRole } from '@/lib/constants'
import { getCurrentSession } from '@/lib/auth/session'
import { apiError, apiSuccess } from '@/lib/api/response'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: teamId, userId: targetUserId } = await params
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return apiError('인증 필요', 401)

  const { profile: callerProfile, myId } = session

  const { data: team } = await createAdminClient()
    .from('teams')
    .select('leader_id, vice_leader_id')
    .eq('id', teamId)
    .single()

  if (!team) return apiError('팀을 찾을 수 없습니다', 404)

  const isAdmin      = isAdminRole(callerProfile?.role)
  const isLeader     = team.leader_id      === myId
  const isViceLeader = team.vice_leader_id === myId

  if (!isAdmin && !isLeader && !isViceLeader) {
    return apiError('추방 권한이 없습니다', 403)
  }

  if (targetUserId === team.leader_id) {
    return apiError('팀장은 추방할 수 없습니다', 400)
  }

  const { error } = await createAdminClient()
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', targetUserId)

  if (error) return apiError('서버 오류가 발생했습니다', 500)

  return apiSuccess({ success: true })
}
