import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { NextRequest } from 'next/server'
import { isAdminRole, hasActiveMemberAccess, canCreateTeam } from '@/lib/constants'
import { getCurrentSession } from '@/lib/auth/session'
import { calcSessionSummary, calcMemberCount } from '@/lib/team/utils'
import { apiError, apiSuccess } from '@/lib/api/response'
import type { TeamListItem } from '@/types/team'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return apiError('인증 필요', 401)

  const { profile: callerProfile } = session
  const isAdmin = isAdminRole(callerProfile?.role)
  if (!hasActiveMemberAccess(callerProfile?.status)) {
    return apiError('접근 권한이 없습니다', 403)
  }

  const includeInactive = request.nextUrl.searchParams.get('include_inactive') === 'true' && isAdmin
  const recruitingFilter = request.nextUrl.searchParams.get('recruiting') // 'true' | 'false' | null

  let query = supabaseAdmin
    .from('teams')
    .select(`
      id, name, current_song, description, is_active, is_recruiting, created_at, updated_at,
      leader_id,
      leader:users!leader_id ( id, name, nickname, session ),
      team_members ( id, user_id, session_in_team )
    `)
    .order('created_at', { ascending: true })

  if (!includeInactive) query = query.eq('is_active', true)
  if (recruitingFilter === 'true')  query = query.eq('is_recruiting', true)
  if (recruitingFilter === 'false') query = query.eq('is_recruiting', false)

  const { data: rawTeams, error } = await query
  if (error) return apiError('서버 오류가 발생했습니다', 500)

  const teams = (rawTeams ?? []) as TeamListItem[]

  const result = teams.map(t => {
    const members = t.team_members ?? []
    const leader  = t.leader
    return {
      id:              t.id,
      name:            t.name,
      current_song:    t.current_song,
      description:     t.description,
      is_active:       t.is_active,
      is_recruiting:   t.is_recruiting,
      leader,
      member_count:    calcMemberCount(leader, members),
      session_summary: calcSessionSummary(leader, members),
    }
  })

  return apiSuccess({ teams: result })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return apiError('인증 필요', 401)

  const { profile: callerProfile, myId: userId } = session

  if (!canCreateTeam(callerProfile?.status)) {
    return apiError('정식 부원(ACTIVE/INACTIVE)만 팀을 만들 수 있습니다', 403)
  }

  let body: { name?: string; description?: string; current_song?: string }
  try {
    body = await request.json()
  } catch {
    return apiError('잘못된 요청입니다', 400)
  }

  const name = (body.name ?? '').trim()
  if (!name) return apiError('팀명은 필수입니다', 400)

  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('name', name)
    .maybeSingle()

  if (existing) return apiError('이미 존재하는 팀명입니다', 409)

  const { data: newTeam, error: insertError } = await supabaseAdmin
    .from('teams')
    .insert({
      name,
      description:   body.description?.trim() || null,
      current_song:  body.current_song?.trim() || null,
      leader_id:            userId,
      is_active:            false,
      is_recruiting:        true,
      activation_requested: false,
    })
    .select('id')
    .single()

  if (insertError || !newTeam) {
    return apiError('팀 생성 실패', 500)
  }

  await supabaseAdmin.from('team_members').insert({
    team_id: newTeam.id,
    user_id: userId,
  })

  return apiSuccess({ team: { id: newTeam.id } }, 201)
}
