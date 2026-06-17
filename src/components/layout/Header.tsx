import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isAdminRole } from '@/lib/constants'
import { NavLinks } from './NavLinks'
import { HeaderActions } from './HeaderActions'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('users')
        .select('name, role, status')
        .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
        .maybeSingle()
    : { data: null }

  const isAdmin = isAdminRole(profile?.role)

  return (
    <header className="sticky top-0 z-[100] bg-surface border-b border-[var(--border-subtle)]">
      <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center gap-6">

        {/* 로고 */}
        <Link href="/home" className="flex items-center gap-2.5 no-underline shrink-0">
          <Image
            src="/icon.svg"
            alt="청림그룹사운드 로고"
            width={28}
            height={28}
            className="w-7 h-auto invert shrink-0"
          />
          <span className="text-[15px] font-bold text-foreground tracking-[-0.3px]">
            청림그룹사운드
          </span>
        </Link>

        {/* 데스크톱 네비게이션 (860px 이하 숨김) */}
        <div className="hidden min-[860px]:flex flex-1">
          <NavLinks isAdmin={isAdmin} />
        </div>

        {/* 오른쪽 액션 영역 */}
        {profile && (
          <HeaderActions name={profile.name} role={profile.role} />
        )}

      </div>
    </header>
  )
}
