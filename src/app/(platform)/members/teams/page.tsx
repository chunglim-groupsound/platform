import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeamCard } from '@/components/members/TeamCard'
import Link from 'next/link'

export default async function TeamsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('status, role')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  const allowed = ['PROBATION', 'ACTIVE', 'INACTIVE']
  if (!allowed.includes(profile?.status ?? '')) redirect('/timetable')

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(profile?.role ?? '')

  let query = supabase
    .from('teams')
    .select(`
      id, name, current_song, description, is_active,
      leader_id,
      leader:users!leader_id ( id, name, nickname, session ),
      team_members ( id, user_id, session_in_team )
    `)
    .order('created_at', { ascending: true })

  if (!isAdmin) query = query.eq('is_active', true)

  interface LeaderData { id: string; name: string; nickname: string | null; session: string[] | null }
  interface MemberData { user_id: string; session_in_team: string[] }
  interface TeamData {
    id: string; name: string; current_song: string | null; description: string | null
    is_active: boolean; leader_id: string | null
    leader: LeaderData | null
    team_members: MemberData[]
  }

  const { data: rawTeams } = await query
  const teams = (rawTeams ?? []) as unknown as TeamData[]

  const teamList = teams.map(t => {
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

  return (
    <main style={{ padding: '24px 20px', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/members" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>
          ← 명단
        </Link>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>팀 목록</h1>
      </div>

      {teamList.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 0' }}>
          등록된 팀이 없습니다.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {teamList.map(team => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </main>
  )
}
