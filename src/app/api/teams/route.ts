import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface TeamLeader { id: string; name: string; nickname: string | null; session: string[] | null }
interface TeamMemberRow { user_id: string; session_in_team: string[] | null }
interface TeamRow {
  id: string; name: string; current_song: string | null; description: string | null
  is_active: boolean; created_at: string; updated_at: string; leader_id: string | null
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

  let query = supabase
    .from('teams')
    .select(`
      id, name, current_song, description, is_active, created_at, updated_at,
      leader_id,
      leader:users!leader_id ( id, name, nickname, session ),
      team_members ( id, user_id, session_in_team )
    `)
    .order('created_at', { ascending: true })

  if (!includeInactive) query = query.eq('is_active', true)

  const { data: rawTeams, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Supabase FK join을 단일 객체로 올바르게 타입 지정
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
      leader,
      member_count:    memberCount,
      session_summary: sessionCounts,
    }
  })

  return NextResponse.json({ teams: result })
}
