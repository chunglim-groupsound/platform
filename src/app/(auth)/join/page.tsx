// src/app/(auth)/join/page.tsx
// 카카오 OAuth 완료 후 — 기존 부원 / 신규 부원 선택 화면

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { Avatar } from '@/components/ui/Avatar'
import { Kicker } from '@/components/ui/Kicker'
import { LogoutLink } from '@/components/ui/LogoutLink'

export default async function JoinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('users')
    .select('id, status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  // PENDING이 아닌 기존 유저가 직접 접근한 경우
  if (profile && profile.status !== 'PENDING') {
    redirect('/home')
  }

  // PENDING 유저가 이미 신청서를 냈다면 apply로
  if (profile?.status === 'PENDING') {
    const { data: application } = await adminClient
      .from('join_applications')
      .select('id')
      .eq('user_id', profile.id)
      .maybeSingle()

    if (application) redirect('/apply')
  }

  const name = (
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    '사용자'
  )
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-12">
      <AmbientBackground />

      <div className="w-full max-w-[460px]">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <Kicker className="justify-center mb-5">청림그룹사운드</Kicker>
          <h1 className="font-sans font-bold text-[26px] tracking-tight text-foreground m-0">
            어떻게 합류하시나요?
          </h1>
        </div>

        {/* 카카오 계정 칩 */}
        <div className="flex items-center gap-3 bg-surface border border-border-subtle rounded-xl px-4 py-3 mb-7">
          <Avatar name={name} src={avatarUrl} size={36} />
          <div className="min-w-0">
            <div className="text-foreground font-semibold text-[14px] truncate">{name}</div>
            <div className="text-muted-foreground text-[12px]">카카오 계정으로 로그인됨</div>
          </div>
        </div>

        {/* 선택 카드 */}
        <div className="flex flex-col gap-3 mb-7">
          {/* 기존 부원 — accent 강조 */}
          <a
            href="/link"
            className="block bg-surface border border-accent rounded-xl p-[22px] no-underline
              hover:bg-surface-elevated hover:-translate-y-[2px] transition-all duration-150"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center text-accent">
                <UserCheckIcon />
              </div>
              <span className="font-mono text-[10.5px] text-accent tracking-[0.1em] uppercase">기존</span>
            </div>
            <h2 className="font-sans font-bold text-[17px] tracking-tight text-foreground m-0 mb-1.5">
              기존 부원
            </h2>
            <p className="text-[13px] text-muted-foreground leading-[1.65] m-0 mb-4">
              이전에 청림그룹사운드에서 활동한 적 있으신가요?
              인증키로 기존 계정과 연동해요.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['인증키 입력', '기존 기록 유지', '즉시 입장'].map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-accent-muted text-accent text-[11.5px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="text-right text-accent text-[13px] font-semibold">
              연동하기 →
            </div>
          </a>

          {/* 신규 부원 */}
          <a
            href="/apply"
            className="block bg-surface border border-border rounded-xl p-[22px] no-underline
              hover:bg-surface-elevated hover:-translate-y-[2px] transition-all duration-150"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center text-muted-foreground">
                <UserPlusIcon />
              </div>
              <span className="font-mono text-[10.5px] text-subtle-foreground tracking-[0.1em] uppercase">
                신규
              </span>
            </div>
            <h2 className="font-sans font-bold text-[17px] tracking-tight text-foreground m-0 mb-1.5">
              신규 부원
            </h2>
            <p className="text-[13px] text-muted-foreground leading-[1.65] m-0 mb-4">
              처음 지원하시나요? 지원서를 작성하고 면접을 통해 합류할 수 있어요.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['지원서 작성', '면접 일정 선택', '합격 후 입장'].map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-surface-elevated text-muted-foreground text-[11.5px] font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="text-right text-muted-foreground text-[13px] font-semibold">
              지원하기 →
            </div>
          </a>
        </div>

        {/* 하단 안내 */}
        <div className="text-center">
          <p className="text-[13px] text-muted-foreground m-0 mb-3">
            잘 모르겠다면{' '}
            <span className="text-foreground font-semibold">기존 부원으로 먼저 확인</span>해 보세요
          </p>
          <LogoutLink />
        </div>
      </div>
    </div>
  )
}

function UserCheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  )
}

function UserPlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  )
}
