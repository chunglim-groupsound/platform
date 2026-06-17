import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { ThemePicker } from '@/components/ui/ThemePicker'
import { Kicker } from '@/components/ui/Kicker'
import { KakaoLoginButton } from '@/components/ui/KakaoLoginButton'

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/home')

  const { data: rec } = await supabase
    .from('recruitment_periods')
    .select('is_open, open_at, close_at')
    .maybeSingle()

  const recruitment = rec ?? { is_open: false, open_at: null as string | null, close_at: null as string | null }

  return (
    <>
      <AmbientBackground />

      {/* HEADER */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b border-border-subtle"
        style={{ background: 'color-mix(in oklab, var(--background) 80%, transparent)' }}
      >
        <div className="max-w-[1100px] mx-auto px-7 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-accent-hover shrink-0"
              style={{ border: '1.5px solid var(--accent)' }}
            >
              <GuitarIcon />
            </span>
            <span className="font-sans font-bold text-[15.5px] tracking-tight text-foreground whitespace-nowrap">
              청림그룹사운드
            </span>
          </div>

          <div className="flex items-center gap-[18px]">
            <ThemePicker />
            <KakaoLoginButton className="inline-flex items-center gap-2 px-[18px] py-2 rounded-md border border-border text-foreground text-[13px] font-semibold font-sans hover:border-accent hover:text-accent-hover transition-colors cursor-pointer">
              로그인
            </KakaoLoginButton>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="max-w-[1100px] mx-auto px-7 pt-[74px] pb-[60px] max-md:pt-[50px] max-md:pb-11">
          <Kicker>한남대학교 밴드 동아리 · SINCE 1985</Kicker>
          <h1
            className="font-display font-normal leading-none mt-6 mb-0 text-foreground"
            style={{ fontSize: 'clamp(50px, 13vw, 132px)', letterSpacing: '0.005em' }}
          >
            청림<br />그룹사운드
          </h1>
          <p
            className="mt-7 text-muted-foreground max-w-[440px] leading-[1.75] max-md:mt-6"
            style={{ fontSize: 'clamp(15px, 1.6vw, 18px)' }}
          >
            음악으로 하나되는 공간.<br />
            <strong className="text-foreground font-semibold">함께 연주하고, 함께 성장합니다.</strong>
          </p>

          {/* CTA */}
          <div className="flex items-center gap-4 mt-10 flex-wrap max-md:mt-8 max-md:gap-3">
            <KakaoLoginButton className="inline-flex items-center gap-[10px] px-[26px] py-[14px] rounded-[9px] bg-[#FEE500] text-[#191600] font-sans font-bold text-[15px] tracking-[-0.01em] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(254,229,0,0.16)] transition-all duration-150 cursor-pointer whitespace-nowrap">
              <KakaoIcon />
              카카오로 시작하기
            </KakaoLoginButton>
            <span className="text-[13px] text-subtle-foreground">기존 부원은 계정 연동으로 바로 입장</span>
          </div>

          {/* Stat rail */}
          <div className="flex gap-10 mt-14 flex-wrap max-md:gap-7 max-md:mt-11">
            {STATS.map(({ n, accent, label }) => (
              <div key={label}>
                <div
                  className={`font-display leading-none ${accent ? 'text-accent-hover' : 'text-foreground'}`}
                  style={{ fontSize: '46px', lineHeight: '0.85' }}
                >
                  {n}
                </div>
                <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-muted-foreground mt-[9px]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ACTIVITIES */}
        <section className="border-t border-border-subtle py-16 max-md:py-[46px]">
          <div className="max-w-[1100px] mx-auto px-7">
            <div className="flex items-end justify-between gap-4 flex-wrap mb-[34px]">
              <div>
                <Kicker>우리가 하는 일</Kicker>
                <h2 className="font-sans font-bold text-[30px] tracking-tight mt-3 mb-0 whitespace-nowrap max-md:text-[25px]">
                  동아리 활동
                </h2>
              </div>
              <a
                href="/home"
                className="inline-flex items-center gap-2 px-[18px] py-[9px] rounded-md border border-border text-foreground font-sans font-semibold text-[13.5px] hover:border-accent hover:text-accent-hover transition-all duration-150 whitespace-nowrap"
              >
                합주 일정 보기
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
              {ACTIVITIES.map(({ idx, icon, title, desc }) => (
                <div
                  key={idx}
                  className="bg-surface border border-border-subtle rounded-[10px] p-7 flex flex-col gap-4
                    hover:border-border hover:bg-surface-elevated hover:-translate-y-[3px] transition-all duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-accent-hover">{icon}</span>
                    <span className="font-mono text-[11px] text-subtle-foreground">{idx}</span>
                  </div>
                  <h3 className="font-sans font-bold text-[19px] tracking-tight m-0">{title}</h3>
                  <p className="m-0 text-[13.5px] text-muted-foreground leading-[1.65]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RECRUITMENT */}
        <section className="pb-16 max-md:pb-[46px]">
          <div className="max-w-[1100px] mx-auto px-7">
            <div
              className={`relative overflow-hidden bg-surface border border-border-subtle rounded-xl
                flex items-center justify-between gap-7 flex-wrap px-[38px] py-[34px]
                max-md:px-6 max-md:py-[26px] max-md:gap-6
                ${!recruitment.is_open ? 'opacity-75' : ''}`}
            >
              {/* 왼쪽 액센트 선 */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-[3px] ${recruitment.is_open ? 'bg-accent' : 'bg-border'}`}
              />

              <div className="pl-2">
                <Kicker>{recruitment.is_open ? '신입 모집' : '모집 마감'}</Kicker>
                <div className="font-sans font-bold text-[26px] tracking-tight mt-3 max-md:text-[21px]">
                  {recruitment.is_open ? '새 부원을 기다립니다' : '다음 모집을 기다려주세요'}
                </div>
                <div className="text-[14px] text-muted-foreground mt-2">
                  {recruitment.is_open
                    ? '카카오 로그인 후 지원서를 작성하면 면접 일정을 안내드립니다.'
                    : '이번 학기 신입 부원 모집은 마감되었습니다. 다음 모집 일정은 공지를 통해 안내드릴게요.'}
                </div>
                {recruitment.is_open && recruitment.open_at && recruitment.close_at && (
                  <div className="font-mono text-[11.5px] text-subtle-foreground mt-4 tracking-[0.04em]">
                    모집 기간 {fmtDate(recruitment.open_at)} – {fmtDate(recruitment.close_at)}
                  </div>
                )}
              </div>

              {recruitment.is_open ? (
                <KakaoLoginButton className="inline-flex items-center gap-[10px] px-[24px] py-[13px] rounded-[9px] bg-[#FEE500] text-[#191600] font-sans font-bold text-[15px] tracking-[-0.01em] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(254,229,0,0.16)] transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0">
                  <KakaoIcon />
                  지원하기
                </KakaoLoginButton>
              ) : (
                <div className="inline-flex items-center gap-2 px-6 py-[13px] rounded-[9px] border border-border text-subtle-foreground font-sans font-semibold text-[14px] whitespace-nowrap shrink-0">
                  <LockIcon />
                  모집 마감
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border-subtle py-8">
        <div className="max-w-[1100px] mx-auto px-7 flex items-center justify-between gap-4 flex-wrap">
          <span className="font-mono text-[11.5px] text-subtle-foreground tracking-[0.04em]">
            © 청림그룹사운드 · 한남대학교
          </span>
          <span className="font-mono text-[11.5px] text-subtle-foreground tracking-[0.04em]">
            CHEONGNIM GROUP SOUND
          </span>
        </div>
      </footer>
    </>
  )
}

const STATS = [
  { n: '48', accent: true, label: '활동 부원' },
  { n: '6', accent: false, label: '합주 팀' },
  { n: '21', accent: false, label: '기수' },
  { n: '40+', accent: false, label: '정기 공연' },
]

const ACTIVITIES = [
  {
    idx: '01',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l11-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="17" cy="16" r="3" />
      </svg>
    ),
    title: '정기 합주',
    desc: '매주 합주실에 모여 팀별로 연습합니다. 온라인 타임테이블로 합주실을 예약해요.',
  },
  {
    idx: '02',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
      </svg>
    ),
    title: '정기 공연',
    desc: '학기마다 무대에 올라 한 학기의 연습을 관객 앞에서 선보입니다.',
  },
  {
    idx: '03',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.5 5.3 5.8.8-4.2 4 1 5.7L12 20l-5.1 2.6 1-5.7-4.2-4 5.8-.8z" />
      </svg>
    ),
    title: '신입 교육',
    desc: '악기를 처음 잡는 분도 환영합니다. 세션별 선배가 기초부터 함께합니다.',
  },
]

function GuitarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.5" cy="15.5" r="4" />
      <circle cx="8.5" cy="15.5" r="1" />
      <path d="m11.3 12.6 6-6M15.2 4.7l1.7-1.7 2.1 2.1-1.7 1.7M16.9 6.4l1.4 1.4" />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2C5.582 2 2 4.91 2 8.5c0 2.284 1.437 4.294 3.61 5.487L4.79 17.18a.25.25 0 0 0 .373.274L9.35 14.93c.216.018.434.028.65.028 4.418 0 8-2.91 8-6.5S14.418 2 10 2z"
        fill="#191600"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  )
}
