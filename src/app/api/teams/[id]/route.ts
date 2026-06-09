import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRole, hasActiveMemberAccess } from '@/lib/constants'
import { getCurrentSession } from '@/lib/auth/session'
import { apiError, apiSuccess } from '@/lib/api/response'
import type { Database } from '@/types/database'

type TeamsUpdate = Database['public']['Tables']['teams']['Update']

async function resolveTeamAccess(userId: string, teamId: string) {
  const [{ data: callerProfile }, { data: team }] = await Promise.all([
    createAdminClient()
      .from('users')
      .select('id, role, status')
      .or(`id.eq.${userId},linked_auth_id.eq.${userId}`)
      .maybeSingle(),
    createAdminClient()
      .from('teams')
      .select('leader_id, vice_leader_id')
      .eq('id', teamId)
      .single(),
  ])
  const myId       = callerProfile?.id ?? ''
  const isAdmin    = isAdminRole(callerProfile?.role)
  const isLeader   = team?.leader_id     === myId
  const isViceLeader = team?.vice_leader_id === myId
  return { callerProfile, team, isAdmin, isLeader, isViceLeader, myId }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return apiError('인증 필요', 401)

  if (!hasActiveMemberAccess(session.profile?.status)) {
    return apiError('접근 권한이 없습니다', 403)
  }

  const { data: team, error } = await createAdminClient()
    .from('teams')
    .select(`
      id, name, current_song, description, is_active, is_recruiting, created_at, updated_at,
      leader_id, vice_leader_id,
      leader:users!leader_id ( id, name, nickname, phone, privacy_settings ),
      team_members (
        id, user_id, session_in_team, joined_at,
        user:users!user_id ( id, name, nickname, profile_image_url, session, role, status, is_whitelist )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !team) {
    return apiError('팀을 찾을 수 없습니다', 404)
  }

  return apiSuccess({ team, reservations: [] })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return apiError('인증 필요', 401)

  const { isAdmin, isLeader, isViceLeader } = await resolveTeamAccess(session.user.id, id)

  if (!isAdmin && !isLeader && !isViceLeader) {
    return apiError('수정 권한이 없습니다', 403)
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError('잘못된 요청입니다', 400)
  }

  const leaderFields = new Set(['current_song', 'description', 'is_recruiting', 'vice_leader_id', 'leader_id'])
  const adminFields  = new Set(['name', 'is_active', 'current_song', 'description', 'is_recruiting', 'vice_leader_id', 'leader_id'])

  const patch: Record<string, unknown> = {}
  const fieldSet = isAdmin ? adminFields : leaderFields
  for (const key of fieldSet) {
    if (key in body) patch[key] = body[key] ?? null
  }

  if (Object.keys(patch).length === 0) {
    return apiError('변경할 항목이 없습니다', 400)
  }

  if ('is_active' in patch) {
    patch.activation_requested = false
  }

  const { error: updateError } = await createAdminClient()
    .from('teams')
    .update(patch as TeamsUpdate)
    .eq('id', id)

  if (updateError) {
    return apiError('서버 오류가 발생했습니다', 500)
  }

  return apiSuccess({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return apiError('인증 필요', 401)

  const { isAdmin, isLeader, isViceLeader } = await resolveTeamAccess(session.user.id, id)

  if (!isAdmin && !isLeader && !isViceLeader) {
    return apiError('삭제 권한이 없습니다', 403)
  }

  const { error } = await createAdminClient()
    .from('teams')
    .delete()
    .eq('id', id)

  if (error) return apiError('서버 오류가 발생했습니다', 500)

  return apiSuccess({ success: true })
}
