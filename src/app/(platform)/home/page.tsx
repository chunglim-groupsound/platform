import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DashboardCards } from '@/components/layout/DashboardCards'
import Link from 'next/link'
import { isAdminRole, ACTIVE_STATUSES } from '@/lib/constants'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: '최고관리자',
  ADMIN: '운영진',
  MEMBER: '정식 부원',
  PROBATION_MEMBER: '수습 부원',
}

const STATUS_LABEL: Record<string, string> = {
  PROBATION: '수습 중',
  ACTIVE: '정식',
  INACTIVE: '비활동',
}

interface TeamLeader { name: string; nickname: string | null }
interface TeamMemberRow { user_id: string }
interface ActiveTeam {
  id: string
  name: string
  current_song: string | null
  is_recruiting: boolean
  leader: TeamLeader | null
  team_members: TeamMemberRow[]
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, nickname, role, status, generation, profile_image_url')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!profile) redirect('/')

  const isAdmin = isAdminRole(profile.role)

  // 부원 수
  const { count: memberCount } = await createAdminClient()
    .from('users')
    .select('*', { count: 'exact', head: true })
    .in('status', [...ACTIVE_STATUSES])

  // 활성 팀 + 팀원 목록 (팀원 있는 팀만 카운트/표시)
  const { data: rawTeams } = await createAdminClient()
    .from('teams')
    .select(`
      id, name, current_song, is_recruiting,
      leader:users!leader_id ( name, nickname ),
      team_members ( user_id )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const activeTeams = ((rawTeams ?? []) as ActiveTeam[])
    .filter(t => t.team_members.length > 0)

  const teamCount = activeTeams.length

  const displayName = profile.nickname ?? profile.name

  const cards: {
    href: string
    emoji: string
    title: string
    desc: string
    adminOnly?: boolean
    color: string
  }[] = [
    { href: '/members',   emoji: '👥', title: '부원 명단',  desc: '전체 부원 검색 · 필터 · 프로필 조회', color: '#eff6ff' },
    { href: '/members/me', emoji: '✏️', title: '내 프로필', desc: '세션, 학과, 연락처 등 프로필 수정',    color: '#f0fdf4' },
    { href: '/teams',     emoji: '🎸', title: '팀 목록',    desc: '합주 팀 구성 및 현재 연습 곡 확인',   color: '#fff7ed' },
    { href: '/notices',   emoji: '📢', title: '공지사항',   desc: '동아리 공지 및 일정 안내',             color: '#fdf4ff' },
    { href: '/admin/applications', emoji: '⚙️', title: '운영 관리', desc: '가입 신청 처리 · 부원 상태 관리', adminOnly: true, color: '#fff1f2' },
    { href: '/admin/members',      emoji: '👤', title: '부원 관리', desc: '기수 · 역할 · 화이트리스트 설정', adminOnly: true, color: '#fff1f2' },
  ]

  const visibleCards = cards.filter(c => !c.adminOnly || isAdmin)

  return (
    <main className="max-w-[800px] mx-auto py-8 px-5 flex flex-col gap-8">

      {/* 환영 배너 */}
      <section
        className="rounded-2xl p-7 text-white flex justify-between items-center gap-4 flex-wrap"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #111827 100%)' }}
      >
        <div className="flex flex-col gap-1.5">
          <div className="text-[0.85rem] text-white/55 font-medium">
            청림그룹사운드
          </div>
          <div className="text-[1.4rem] font-extrabold tracking-[-0.3px]">
            안녕하세요, {displayName}님 👋
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className="py-[3px] px-2.5 rounded-full bg-white/12 text-[0.78rem] text-white/80">
              {ROLE_LABEL[profile.role] ?? profile.role}
            </span>
            {profile.generation != null && (
              <span className="py-[3px] px-2.5 rounded-full bg-white/12 text-[0.78rem] text-white/80">
                {profile.generation}기
              </span>
            )}
            <span className="py-[3px] px-2.5 rounded-full bg-white/12 text-[0.78rem] text-white/80">
              {STATUS_LABEL[profile.status] ?? profile.status}
            </span>
          </div>
        </div>

        <div className="flex gap-5">
          <div className="text-center">
            <div className="text-[1.8rem] font-extrabold leading-none">{memberCount ?? '-'}</div>
            <div className="text-[0.75rem] text-white/55 mt-1">총 부원</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <div className="text-[1.8rem] font-extrabold leading-none">{teamCount}</div>
            <div className="text-[0.75rem] text-white/55 mt-1">활성 팀</div>
          </div>
        </div>
      </section>

      {/* 활성 팀 목록 */}
      {activeTeams.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-[0.9rem] font-bold text-gray-500 m-0 tracking-[0.05em] uppercase">
              활성 팀
            </h2>
            <Link href="/teams" className="text-[0.8rem] text-indigo-500 no-underline font-medium">
              전체 보기 →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {activeTeams.map(team => {
              const leaderName = team.leader
                ? (team.leader.nickname ?? team.leader.name)
                : null
              return (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="flex items-center gap-3 py-3 px-4 rounded-xl border border-gray-200 bg-white no-underline text-gray-900"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-[0.92rem]">{team.name}</span>
                      <span className={`py-[1px] px-[7px] rounded-full text-[0.7rem] font-semibold shrink-0 border ${
                        team.is_recruiting
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        {team.is_recruiting ? '모집 중' : '모집 완료'}
                      </span>
                    </div>
                    <div className="text-[0.78rem] text-gray-400">
                      {team.current_song ? `♪ ${team.current_song}` : (leaderName ? `팀장: ${leaderName}` : '')}
                    </div>
                  </div>
                  <div className="text-[0.8rem] text-gray-500 shrink-0">
                    {team.team_members.length}명
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* 빠른 이동 */}
      <section>
        <h2 className="text-[0.9rem] font-bold text-gray-500 mb-3.5 tracking-[0.05em] uppercase">
          메뉴
        </h2>
        <DashboardCards cards={visibleCards} />
      </section>

      {/* 타임테이블 예고 */}
      <section className="border border-dashed border-gray-300 rounded-2xl p-7 text-center text-gray-400">
        <div className="text-[1.8rem] mb-2">🗓</div>
        <div className="font-semibold text-[0.95rem] text-gray-500 mb-1">합주실 타임테이블</div>
        <div className="text-[0.82rem]">예약 시스템 개발 중입니다.</div>
      </section>

    </main>
  )
}
