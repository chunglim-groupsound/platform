import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { TeamCard } from '@/components/teams/TeamCard'
import Link from 'next/link'
import { isAdminRole, hasActiveMemberAccess, canCreateTeam } from '@/lib/constants'
import { calcSessionSummary, calcMemberCount } from '@/lib/team/utils'

interface Props {
  searchParams: Promise<{ recruiting?: string; inactive?: string; myteam?: string }>
}

export default async function TeamsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { recruiting, inactive, myteam } = await searchParams

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('id, status, role')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!hasActiveMemberAccess(profile?.status)) redirect('/timetable')

  const isAdmin   = isAdminRole(profile?.role)
  const canCreate = canCreateTeam(profile?.status)

  interface LeaderData { id: string; name: string; nickname: string | null; session: string[] | null }
  interface MemberData { user_id: string; session_in_team: string[] }
  interface TeamData {
    id: string; name: string; current_song: string | null; description: string | null
    is_active: boolean; is_recruiting: boolean; leader_id: string | null
    leader: LeaderData | null
    team_members: MemberData[]
  }

  let query = supabaseAdmin
    .from('teams')
    .select(`
      id, name, current_song, description, is_active, is_recruiting,
      leader_id,
      leader:users!leader_id ( id, name, nickname, session ),
      team_members ( id, user_id, session_in_team )
    `)
    .order('created_at', { ascending: true })

  if (isAdmin && inactive === 'true') {
    query = query.eq('is_active', false)
  }
  if (recruiting === 'true')  query = query.eq('is_recruiting', true)
  if (recruiting === 'false') query = query.eq('is_recruiting', false)

  const { data: rawTeams } = await query
  let teams = (rawTeams ?? []) as unknown as TeamData[]

  // "내 팀" 필터: DB 조회 후 클라이언트에서 직접 비교
  // profile.id 와 auth uid 둘 다 확인 (linked_auth_id 유저 호환)
  if (myteam === 'true') {
    const meIds = new Set([profile?.id, user.id].filter(Boolean))
    teams = teams.filter(t =>
      meIds.has(t.leader_id ?? '') ||
      t.team_members.some(m => meIds.has(m.user_id))
    )
  }

  const teamList = teams.map(t => {
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

  const tabStyle = (active: boolean) => ({
    padding: '5px 14px', borderRadius: '9999px', fontSize: '0.83rem',
    fontWeight: active ? 700 : 400, border: '1px solid',
    borderColor: active ? '#6366f1' : '#e5e7eb',
    background: active ? '#6366f1' : '#fff',
    color: active ? '#fff' : '#374151',
    textDecoration: 'none',
  })

  return (
    <main style={{ padding: '24px 20px', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, flex: 1 }}>팀 목록</h1>
        {canCreate && (
          <Link href="/teams/new" style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem',
            fontWeight: 600, background: '#6366f1', color: '#fff',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            + 팀 만들기
          </Link>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {isAdmin ? (
          <>
            <Link href="/teams" style={tabStyle(!recruiting && inactive !== 'true' && myteam !== 'true')}>전체</Link>
            <Link href="/teams?recruiting=true"  style={tabStyle(recruiting === 'true' && myteam !== 'true')}>모집 중</Link>
            <Link href="/teams?recruiting=false" style={tabStyle(recruiting === 'false' && myteam !== 'true')}>모집 완료</Link>
            <Link href="/teams?inactive=true" style={tabStyle(inactive === 'true' && myteam !== 'true')}>비활성 팀</Link>
            <Link href="/teams?myteam=true" style={tabStyle(myteam === 'true')}>내 팀</Link>
          </>
        ) : (
          <>
            <Link href="/teams" style={tabStyle(!recruiting && myteam !== 'true')}>전체</Link>
            <Link href="/teams?recruiting=true"  style={tabStyle(recruiting === 'true' && myteam !== 'true')}>모집 중</Link>
            <Link href="/teams?recruiting=false" style={tabStyle(recruiting === 'false' && myteam !== 'true')}>모집 완료</Link>
            <Link href="/teams?myteam=true" style={tabStyle(myteam === 'true')}>내 팀</Link>
          </>
        )}
      </div>

      {teamList.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 0' }}>
          {myteam === 'true' ? '소속된 팀이 없습니다.' :
           inactive === 'true' ? '비활성 팀이 없습니다.' :
           recruiting === 'true' ? '모집 중인 팀이 없습니다.' :
           recruiting === 'false' ? '모집 완료된 팀이 없습니다.' :
           '등록된 팀이 없습니다.'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {teamList.map(team => (
            <TeamCard key={team.id} team={team} baseUrl="/teams" />
          ))}
        </div>
      )}
    </main>
  )
}
