import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRole } from '@/lib/constants'
import { calcProbationDday, calcProbationEndDate } from '@/lib/member/probation'
import { Kicker } from '@/components/ui/Kicker'
import { Badge, BadgeAccent } from '@/components/ui/Badge'
import { DashboardCards } from '@/components/layout/DashboardCards'

const ACCESSIBLE_STATUSES = ['INTERVIEWING', 'PROBATION', 'ACTIVE', 'INACTIVE'] as const
type AccessibleStatus = typeof ACCESSIBLE_STATUSES[number]

const STATUS_LABELS: Record<string, string> = {
  INTERVIEWING: '면접 중',
  PROBATION:    '수습',
  ACTIVE:       '정식',
  INACTIVE:     '비활동',
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:      '개발 담당',
  ADMIN:            '운영진',
  MEMBER:           '정식 부원',
  PROBATION_MEMBER: '수습 부원',
}

interface MyTeam {
  id: string
  name: string
  current_song: string | null
  is_active: boolean
}

function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('ko-KR', opts)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, nickname, role, status, generation, probation_started_at')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!profile) redirect('/')

  const status = profile.status as string
  if (!ACCESSIBLE_STATUSES.includes(status as AccessibleStatus)) redirect('/')

  const isAdmin = isAdminRole(profile.role)
  const displayName = profile.nickname ?? profile.name ?? '부원'

  // 모집 현황
  const { data: recruitment } = await supabase
    .from('recruitment_periods')
    .select('is_open, open_at, close_at')
    .maybeSingle()

  // 면접 일정 (INTERVIEWING)
  let interviewSlot: { slot_at: string } | null = null
  if (status === 'INTERVIEWING') {
    const { data: app } = await supabase
      .from('join_applications')
      .select('confirmed_slot_id, interview_slots!confirmed_slot_id(slot_at)')
      .eq('user_id', profile.id)
      .maybeSingle()

    if (app?.confirmed_slot_id && app.interview_slots) {
      interviewSlot = app.interview_slots as unknown as { slot_at: string }
    }
  }

  // 내 팀 (ACTIVE / INACTIVE)
  let myTeams: MyTeam[] = []
  if (status === 'ACTIVE' || status === 'INACTIVE') {
    const { data: memberships } = await createAdminClient()
      .from('team_members')
      .select('teams!team_id(id, name, current_song, is_active)')
      .eq('user_id', profile.id)

    myTeams = ((memberships ?? []) as { teams: MyTeam | null }[])
      .map(m => m.teams)
      .filter((t): t is MyTeam => t !== null)
  }

  // 빠른 이동 카드
  const baseCards = [
    { href: '/members',   emoji: '👥', title: '부원 명단',  desc: '전체 부원 검색 · 프로필 조회',  color: 'var(--surface-elevated)' },
    { href: '/teams',     emoji: '🎸', title: '팀 목록',    desc: '합주 팀 구성 및 연습 곡 확인',  color: 'var(--surface-elevated)' },
    { href: '/notices',   emoji: '📢', title: '공지사항',   desc: '동아리 공지 및 일정 안내',       color: 'var(--surface-elevated)' },
    { href: '/timetable', emoji: '🗓', title: '타임테이블', desc: '합주실 예약 · 시간표 확인',      color: 'var(--surface-elevated)' },
  ]
  const adminCards = isAdmin ? [
    { href: '/admin/applications', emoji: '⚙️', title: '운영 관리', desc: '신청서 처리 · 부원 상태 관리', color: 'var(--accent-muted)' },
    { href: '/admin/members',      emoji: '👤', title: '부원 관리', desc: '기수 · 역할 · 화이트리스트',   color: 'var(--accent-muted)' },
  ] : []

  // INTERVIEWING은 /members, /teams, /admin에 접근 불가
  const navCards = status === 'INTERVIEWING'
    ? baseCards.filter(c => c.href === '/notices' || c.href === '/timetable')
    : [...baseCards, ...adminCards]

  return (
    <main className="max-w-[840px] mx-auto py-8 px-5 flex flex-col gap-6 animate-screen-in">

      {/* 모집 배너 */}
      {recruitment?.is_open && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-accent-muted border border-accent/20 text-[0.82rem]">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shrink-0" />
          <span className="text-accent font-semibold">모집 중</span>
          <span className="text-muted-foreground">
            신규 부원을 모집하고 있어요
            {recruitment.close_at && (
              <>
                {' · '}
                <span className="text-foreground">
                  {formatDate(recruitment.close_at, { month: 'long', day: 'numeric' })} 마감
                </span>
              </>
            )}
          </span>
        </div>
      )}

      {/* 인사말 */}
      <section className="flex flex-col gap-2">
        <Kicker>청림그룹사운드</Kicker>
        <h1 className="text-[1.6rem] font-extrabold tracking-[-0.3px] text-foreground m-0 leading-tight">
          {displayName}님, 안녕하세요
        </h1>
        <div className="flex gap-1.5 flex-wrap mt-0.5">
          <Badge>{ROLE_LABELS[profile.role] ?? profile.role}</Badge>
          {profile.generation != null && <Badge>{profile.generation}기</Badge>}
          <Badge>{STATUS_LABELS[status] ?? status}</Badge>
        </div>
      </section>

      {/* INTERVIEWING — 면접 일정 */}
      {status === 'INTERVIEWING' && (
        <section className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-[1.1rem]">🎤</span>
              <span className="font-semibold text-foreground text-[0.95rem]">면접 일정</span>
              <BadgeAccent className="ml-auto">면접 중</BadgeAccent>
            </div>

            {interviewSlot ? (
              <div className="flex flex-col gap-1.5">
                <div className="text-[0.7rem] text-subtle-foreground uppercase tracking-[0.12em] font-mono">
                  확정된 면접 일정
                </div>
                <div className="text-[1.05rem] font-bold text-foreground">
                  {formatDate(interviewSlot.slot_at, {
                    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
                  })}
                </div>
                <div className="text-accent font-semibold text-[0.95rem]">
                  {formatTime(interviewSlot.slot_at)}
                </div>
              </div>
            ) : (
              <p className="text-[0.85rem] text-muted-foreground leading-relaxed m-0">
                면접 일정을 배정 중이에요. 배정이 완료되면 이 화면에서 확인할 수 있어요.
              </p>
            )}
          </div>

          <p className="text-[0.78rem] text-muted-foreground px-1 m-0">
            면접 일정 변경이 필요하다면{' '}
            <Link href="/apply" className="text-accent underline underline-offset-2">
              지원 현황 페이지
            </Link>
            에서 요청할 수 있어요.
          </p>
        </section>
      )}

      {/* PROBATION — 수습 현황 */}
      {status === 'PROBATION' && profile.probation_started_at && (
        <section>
          <div className="rounded-xl border border-border bg-surface p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-[1.1rem]">🌱</span>
                <span className="font-semibold text-foreground text-[0.95rem]">수습 현황</span>
              </div>
              <span className="font-mono text-[1.3rem] font-bold text-accent leading-none">
                {calcProbationDday(profile.probation_started_at)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5">
                <div className="text-[0.7rem] text-subtle-foreground uppercase tracking-[0.12em] font-mono">
                  수습 시작일
                </div>
                <div className="text-[0.88rem] font-medium text-foreground">
                  {formatDate(profile.probation_started_at, { month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="text-[0.7rem] text-subtle-foreground uppercase tracking-[0.12em] font-mono">
                  수습 만료일
                </div>
                <div className="text-[0.88rem] font-medium text-foreground">
                  {calcProbationEndDate(profile.probation_started_at).toLocaleDateString('ko-KR', {
                    month: 'long', day: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <p className="text-[0.8rem] text-muted-foreground leading-relaxed m-0">
              수습 기간(30일)이 지나면 운영진의 검토 후 정식 부원으로 전환돼요.
              이 기간 동안 동아리 활동에 적극적으로 참여해 주세요.
            </p>
          </div>
        </section>
      )}

      {/* ACTIVE / INACTIVE — 내 팀 */}
      {(status === 'ACTIVE' || status === 'INACTIVE') && (
        <>
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[0.78rem] font-semibold text-subtle-foreground tracking-[0.1em] uppercase font-mono m-0">
                내 팀
              </h2>
              <Link href="/teams" className="text-[0.78rem] text-accent no-underline font-medium">
                전체 보기 →
              </Link>
            </div>

            {myTeams.length > 0 ? (
              <div className="flex flex-col gap-2">
                {myTeams.map(team => (
                  <Link
                    key={team.id}
                    href={`/teams/${team.id}`}
                    className="flex items-center gap-3 py-3.5 px-4 rounded-xl border border-border bg-surface no-underline group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[0.92rem] text-foreground">{team.name}</div>
                      {team.current_song && (
                        <div className="text-[0.78rem] text-muted-foreground mt-0.5">♪ {team.current_song}</div>
                      )}
                    </div>
                    {!team.is_active && <Badge>비활성</Badge>}
                    <span className="text-subtle-foreground text-[0.85rem] shrink-0 group-hover:text-accent transition-colors">→</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border py-8 px-5 text-center flex flex-col items-center gap-2">
                <span className="text-[1.5rem]">🎸</span>
                <p className="text-[0.85rem] text-muted-foreground m-0">아직 팀에 속해 있지 않아요.</p>
                <Link href="/teams" className="text-[0.8rem] text-accent font-medium no-underline mt-1">
                  팀 목록 보기 →
                </Link>
              </div>
            )}
          </section>

          {/* 다음 합주 일정 — API 미구현 */}
          <section>
            <h2 className="text-[0.78rem] font-semibold text-subtle-foreground tracking-[0.1em] uppercase font-mono mb-3 m-0">
              다음 합주 일정
            </h2>
            <div className="rounded-xl border border-dashed border-border py-6 px-5 text-center flex flex-col items-center gap-1.5">
              <span className="text-[1.3rem]">🗓</span>
              <p className="text-[0.83rem] text-muted-foreground m-0">
                합주실 예약 시스템을 준비 중이에요.
              </p>
              <Link href="/timetable" className="text-[0.78rem] text-accent font-medium no-underline mt-0.5">
                타임테이블 →
              </Link>
            </div>
          </section>

          {/* 공지 미리보기 — API 미구현 */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[0.78rem] font-semibold text-subtle-foreground tracking-[0.1em] uppercase font-mono m-0">
                최근 공지
              </h2>
              <Link href="/notices" className="text-[0.78rem] text-accent no-underline font-medium">
                전체 보기 →
              </Link>
            </div>
            <div className="rounded-xl border border-dashed border-border py-6 px-5 text-center flex flex-col items-center gap-1.5">
              <span className="text-[1.3rem]">📢</span>
              <p className="text-[0.83rem] text-muted-foreground m-0">
                공지사항 시스템을 준비 중이에요.
              </p>
            </div>
          </section>
        </>
      )}

      {/* 빠른 이동 */}
      {navCards.length > 0 && (
        <section>
          <h2 className="text-[0.78rem] font-semibold text-subtle-foreground tracking-[0.1em] uppercase font-mono mb-3 m-0">
            메뉴
          </h2>
          <DashboardCards cards={navCards} />
        </section>
      )}

    </main>
  )
}
