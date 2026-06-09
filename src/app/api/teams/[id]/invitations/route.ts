import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isAdminRole } from '@/lib/constants'
import { getCurrentSession } from '@/lib/auth/session'
import { apiError, apiSuccess } from '@/lib/api/response'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return apiError('인증 필요', 401)

  const { profile: callerProfile, myId } = session
  const isAdmin = isAdminRole(callerProfile?.role)

  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('leader_id, vice_leader_id')
    .eq('id', teamId)
    .single()

  const isLeader     = team?.leader_id      === myId
  const isViceLeader = team?.vice_leader_id === myId
  if (!isAdmin && !isLeader && !isViceLeader) {
    return apiError('초대 권한이 없습니다', 403)
  }

  let body: { inviteeId?: string; message?: string }
  try { body = await request.json() } catch {
    return apiError('잘못된 요청입니다', 400)
  }

  if (!body.inviteeId) return apiError('inviteeId는 필수입니다', 400)

  const { data: existing } = await supabaseAdmin
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', body.inviteeId)
    .maybeSingle()

  if (existing) return apiError('이미 팀원입니다', 409)

  const { data, error } = await supabaseAdmin
    .from('team_invitations')
    .insert({
      team_id:    teamId,
      invitee_id: body.inviteeId,
      invited_by: callerProfile!.id,
      message:    body.message?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return apiError('이미 초대한 부원입니다', 409)
    return apiError('서버 오류가 발생했습니다', 500)
  }

  return apiSuccess({ invitation: { id: data.id } }, 201)
}
