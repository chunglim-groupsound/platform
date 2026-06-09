import { createClient } from '@/lib/supabase/server'
import { isAdminRole, canCreateTeam } from '@/lib/constants'
import { apiError, apiSuccess } from '@/lib/api/response'

function canView(
  scope: string | undefined,
  isSelf: boolean,
  isMember: boolean,
  isAdmin: boolean
): boolean {
  if (isSelf || isAdmin) return true
  if (scope === 'all')    return true
  if (scope === 'member') return isMember
  return false
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!caller) {
    return apiError('인증 필요', 401)
  }

  const { data: callerProfile } = await supabase
    .from('users')
    .select('role, status')
    .or(`id.eq.${caller.id},linked_auth_id.eq.${caller.id}`)
    .maybeSingle()

  const isAdmin  = isAdminRole(callerProfile?.role)
  const isMember = canCreateTeam(callerProfile?.status)

  const { data: target } = await supabase
    .from('users')
    .select(`
      id, name, nickname, generation, session, genre_preference,
      phone, profile_image_url,
      department, student_id, school_year,
      status, role, is_whitelist,
      privacy_settings,
      probation_started_at, activated_at, created_at
    `)
    .eq('id', id)
    .single()

  if (!target) {
    return apiError('없는 유저', 404)
  }

  const isSelf = (
    caller.id === id ||
    caller.id === target.id
  )

  const privacy = (target.privacy_settings ?? {}) as Record<string, string>

  const filtered: Record<string, unknown> = {
    id:                target.id,
    nickname:          target.nickname,
    profile_image_url: target.profile_image_url,
    session:           target.session,
    genre_preference:  target.genre_preference,
    status:            target.status,
    role:              target.role,
    is_whitelist:      target.is_whitelist,
    created_at:        target.created_at,
  }

  if (canView(privacy.name ?? 'member', isSelf, isMember, isAdmin)) {
    filtered.name = target.name
  }

  if (canView(privacy.generation, isSelf, isMember, isAdmin)) {
    filtered.generation = target.generation
  }

  if (canView(privacy.phone, isSelf, isMember, isAdmin)) {
    filtered.phone = target.phone
  }

  if (canView(privacy.department, isSelf, isMember, isAdmin)) {
    filtered.department = target.department
  }

  if (canView(privacy.student_id ?? 'admin', isSelf, isMember, isAdmin)) {
    filtered.student_id = target.student_id
  }

  if (canView(privacy.school_year, isSelf, isMember, isAdmin)) {
    filtered.school_year = target.school_year
  }

  if (isAdmin || isSelf) {
    filtered.probation_started_at = target.probation_started_at
    filtered.activated_at         = target.activated_at
  }

  const { data: teamMemberships } = await supabase
    .from('team_members')
    .select('team_id, teams!team_id ( id, name, leader_id )')
    .eq('user_id', id)

  const teams = (teamMemberships ?? []).map((tm: Record<string, unknown>) => {
    const t = tm.teams as { id: string; name: string; leader_id: string | null } | null
    return t ? { id: t.id, name: t.name, is_leader: t.leader_id === id } : null
  }).filter(Boolean)

  filtered.teams = teams

  return apiSuccess(filtered)
}
