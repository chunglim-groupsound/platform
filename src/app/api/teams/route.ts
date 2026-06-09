import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAdminRole, hasActiveMemberAccess, canCreateTeam } from '@/lib/constants'
import { getCurrentSession } from '@/lib/auth/session'
import { calcSessionSummary, calcMemberCount } from '@/lib/team/utils'

interface TeamLeader { id: string; name: string; nickname: string | null; session: string[] | null }
interface TeamMemberRow { user_id: string; session_in_team: string[] | null }
interface TeamRow {
  id: string; name: string; current_song: string | null; description: string | null
  is_active: boolean; is_recruiting: boolean; created_at: string; updated_at: string; leader_id: string | null
  leader: TeamLeader | null
  team_members: TeamMemberRow[]
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { profile: callerProfile } = session
  const isAdmin = isAdminRole(callerProfile?.role)
  if (!hasActiveMemberAccess(callerProfile?.status)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const teams = (rawTeams ?? []) as unknown as TeamRow[]

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

  return NextResponse.json({ teams: result })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { profile: callerProfile, myId: userId } = session

  // ACTIVE, INACTIVE 부원만 팀 생성 가능
  if (!canCreateTeam(callerProfile?.status)) {
    return NextResponse.json({ error: '정식 부원(ACTIVE/INACTIVE)만 팀을 만들 수 있습니다' }, { status: 403 })
  }

  let body: { name?: string; description?: string; current_song?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }

  const name = (body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: '팀명은 필수입니다' }, { status: 400 })

  // 팀명 중복 검증
  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('name', name)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: '이미 존재하는 팀명입니다' }, { status: 409 })

  // 팀 생성 (RLS 정책 없이 서버에서 직접 처리 — 권한 검증은 위에서 완료)
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
    return NextResponse.json({ error: insertError?.message ?? '팀 생성 실패' }, { status: 500 })
  }

  // 팀장을 team_members에 추가
  await supabaseAdmin.from('team_members').insert({
    team_id: newTeam.id,
    user_id: userId,
  })

  return NextResponse.json({ team: { id: newTeam.id } }, { status: 201 })
}
