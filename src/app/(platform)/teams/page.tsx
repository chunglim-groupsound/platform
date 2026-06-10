import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TeamCard } from '@/components/teams/TeamCard'
import Link from 'next/link'
import { isAdminRole, hasActiveMemberAccess, canCreateTeam } from '@/lib/constants'
import { filterMyTeams, toTeamCardData } from '@/lib/team/utils'
import type { TeamListItem } from '@/types/team'

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

  let query = createAdminClient()
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
  let teams = (rawTeams ?? []) as TeamListItem[]

  if (myteam === 'true') {
    teams = filterMyTeams(teams, [profile?.id, user.id])
  }

  const teamList = teams.map(toTeamCardData)

  const tabClass = (active: boolean) =>
    `py-[5px] px-3.5 rounded-full text-[0.83rem] border no-underline ${
      active
        ? 'font-bold border-indigo-500 bg-indigo-500 text-white'
        : 'font-normal border-gray-200 bg-white text-gray-700'
    }`

  return (
    <main className="py-6 px-5 max-w-[960px] mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-[1.4rem] font-extrabold m-0 flex-1">팀 목록</h1>
        {canCreate && (
          <Link href="/teams/new" className="py-1.5 px-3.5 rounded-lg text-[0.85rem] font-semibold bg-indigo-500 text-white no-underline whitespace-nowrap">
            + 팀 만들기
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {isAdmin ? (
          <>
            <Link href="/teams" className={tabClass(!recruiting && inactive !== 'true' && myteam !== 'true')}>전체</Link>
            <Link href="/teams?recruiting=true"  className={tabClass(recruiting === 'true' && myteam !== 'true')}>모집 중</Link>
            <Link href="/teams?recruiting=false" className={tabClass(recruiting === 'false' && myteam !== 'true')}>모집 완료</Link>
            <Link href="/teams?inactive=true" className={tabClass(inactive === 'true' && myteam !== 'true')}>비활성 팀</Link>
            <Link href="/teams?myteam=true" className={tabClass(myteam === 'true')}>내 팀</Link>
          </>
        ) : (
          <>
            <Link href="/teams" className={tabClass(!recruiting && myteam !== 'true')}>전체</Link>
            <Link href="/teams?recruiting=true"  className={tabClass(recruiting === 'true' && myteam !== 'true')}>모집 중</Link>
            <Link href="/teams?recruiting=false" className={tabClass(recruiting === 'false' && myteam !== 'true')}>모집 완료</Link>
            <Link href="/teams?myteam=true" className={tabClass(myteam === 'true')}>내 팀</Link>
          </>
        )}
      </div>

      {teamList.length === 0 ? (
        <div className="text-center text-gray-400 py-[60px]">
          {myteam === 'true' ? '소속된 팀이 없습니다.' :
           inactive === 'true' ? '비활성 팀이 없습니다.' :
           recruiting === 'true' ? '모집 중인 팀이 없습니다.' :
           recruiting === 'false' ? '모집 완료된 팀이 없습니다.' :
           '등록된 팀이 없습니다.'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {teamList.map(team => (
            <TeamCard key={team.id} team={team} baseUrl="/teams" />
          ))}
        </div>
      )}
    </main>
  )
}
