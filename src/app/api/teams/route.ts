import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('users')
    .select('role, status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(callerProfile?.role ?? '')
  const allowed = ['PROBATION', 'ACTIVE', 'INACTIVE']
  if (!allowed.includes(callerProfile?.status ?? '')) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const includeInactive = request.nextUrl.searchParams.get('include_inactive') === 'true' && isAdmin
  const recruitingFilter = request.nextUrl.searchParams.get('recruiting') // 'true' | 'false' | null

  let query = supabase
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
    const members   = t.team_members ?? []
    const leader    = t.leader
    const memberIds = new Set(members.map(m => m.user_id))

    const sessionCounts: Record<string, number> = {}

    if (leader && !memberIds.has(leader.id)) {
      for (const s of leader.session ?? []) {
        sessionCounts[s] = (sessionCounts[s] ?? 0) + 1
      }
    }
    for (const m of members) {
      for (const s of m.session_in_team ?? []) {
        sessionCounts[s] = (sessionCounts[s] ?? 0) + 1
      }
    }

    const memberCount = members.length + (leader && !memberIds.has(leader.id) ? 1 : 0)

    return {
      id:              t.id,
      name:            t.name,
      current_song:    t.current_song,
      description:     t.description,
      is_active:       t.is_active,
      is_recruiting:   t.is_recruiting,
      leader,
      member_count:    memberCount,
      session_summary: sessionCounts,
    }
  })

  return NextResponse.json({ teams: result })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('users')
    .select('id, role, status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  // ACTIVE, INACTIVE 부원만 팀 생성 가능
  const canCreate = ['ACTIVE', 'INACTIVE'].includes(callerProfile?.status ?? '')
  if (!canCreate) {
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

  const userId = callerProfile!.id

  // 팀 생성
  const { data: newTeam, error: insertError } = await supabase
    .from('teams')
    .insert({
      name,
      description:   body.description?.trim() || null,
      current_song:  body.current_song?.trim() || null,
      leader_id:     userId,
      is_active:     true,
      is_recruiting: true,
    })
    .select('id')
    .single()

  if (insertError || !newTeam) {
    return NextResponse.json({ error: insertError?.message ?? '팀 생성 실패' }, { status: 500 })
  }

  // 팀장을 team_members에 추가
  await supabase.from('team_members').insert({
    team_id: newTeam.id,
    user_id: userId,
  })

  return NextResponse.json({ team: { id: newTeam.id } }, { status: 201 })
}
