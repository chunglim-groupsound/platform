import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isAdminRole, canCreateTeam } from '@/lib/constants'
import { getCurrentSession } from '@/lib/auth/session'
import { apiError, apiSuccess } from '@/lib/api/response'

export async function GET(
  _request: Request,
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
    return apiError('조회 권한이 없습니다', 403)
  }

  const { data: requests, error } = await supabaseAdmin
    .from('team_join_requests')
    .select(`
      id, message, status, created_at, updated_at,
      applicant:users!applicant_id ( id, name, nickname, profile_image_url, session, role, status, is_whitelist )
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (error) return apiError('서버 오류가 발생했습니다', 500)

  return apiSuccess({ requests: requests ?? [] })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('인증 필요', 401)

  const { data: callerProfile } = await supabaseAdmin
    .from('users')
    .select('id, status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!canCreateTeam(callerProfile?.status)) {
    return apiError('정식 부원만 가입 신청할 수 있습니다', 403)
  }

  const { data: existing } = await supabaseAdmin
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', callerProfile!.id)
    .maybeSingle()

  if (existing) return apiError('이미 팀원입니다', 409)

  const { data: existingRequest } = await supabaseAdmin
    .from('team_join_requests')
    .select('id, status')
    .eq('team_id', teamId)
    .eq('applicant_id', callerProfile!.id)
    .maybeSingle()

  if (existingRequest) {
    if (existingRequest.status === 'PENDING') {
      return apiError('이미 신청한 팀입니다', 409)
    }
    await supabaseAdmin.from('team_join_requests').delete().eq('id', existingRequest.id)
  }

  let body: { message?: string } = {}
  try { body = await request.json() } catch { /* optional body */ }

  const { data, error } = await supabaseAdmin
    .from('team_join_requests')
    .insert({
      team_id:      teamId,
      applicant_id: callerProfile!.id,
      message:      body.message?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    return apiError('서버 오류가 발생했습니다', 500)
  }

  return apiSuccess({ request: { id: data.id } }, 201)
}
