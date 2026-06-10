// src/app/(platform)/layout.tsx

import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/LogoutButton'
import { NavLinks } from '@/components/layout/NavLinks'
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher'
import { isAdminRole } from '@/lib/constants'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('name, role, status')
    .or(`id.eq.${user?.id},linked_auth_id.eq.${user?.id}`)
    .maybeSingle()

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN:      '개발 담당',
    ADMIN:            '운영진',
    MEMBER:           '정식 부원',
    PROBATION_MEMBER: '유예 부원',
  }

  const isAdmin = isAdminRole(profile?.role)

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-[100] bg-surface border-b border-[var(--border-subtle)]">
        <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center gap-8">

          {/* 로고 */}
          <Link href="/home" className="flex items-center gap-2.5 no-underline shrink-0">
            <Image
              src="/icon.svg"
              alt="청림그룹사운드 로고"
              width={28}
              height={28}
              className="w-7 h-auto invert shrink-0"
            />
            <span className="text-[15px] font-bold text-white tracking-[-0.3px]">청림그룹사운드</span>
          </Link>

          {/* 네비게이션 */}
          <NavLinks isAdmin={isAdmin} />

          {/* 유저 + 테마 + 로그아웃 */}
          <div className="flex items-center gap-3 ml-auto shrink-0">
            {profile && (
              <span className="flex items-center gap-[7px]">
                <span className="text-sm text-white/85 font-medium">{profile.name}</span>
                <span className="text-[11px] py-[2px] px-2 rounded-[10px] bg-white/10 text-white/60 font-medium border border-white/12">
                  {roleLabel[profile.role] ?? profile.role}
                </span>
              </span>
            )}
            <ThemeSwitcher />
            <LogoutButton />
          </div>

        </div>
      </header>

      {/* ── 본문 ── */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-8 px-6">
        {children}
      </main>

    </div>
  )
}
