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
    <div style={styles.wrapper}>

      {/* ── 헤더 ── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>

          {/* 로고 */}
          <Link href="/home" style={styles.logoLink}>
            <Image
              src="/icon.svg"
              alt="청림그룹사운드 로고"
              width={28}
              height={28}
              style={{ width: '28px', height: 'auto', filter: 'invert(1)', flexShrink: 0 }}
            />
            <span style={styles.logoText}>청림그룹사운드</span>
          </Link>

          {/* 네비게이션 */}
          <NavLinks isAdmin={isAdmin} />

          {/* 유저 + 테마 + 로그아웃 */}
          <div style={styles.userArea}>
            {profile && (
              <span style={styles.userInfo}>
                <span style={styles.userName}>{profile.name}</span>
                <span style={styles.roleBadge}>
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
      <main style={styles.main}>
        {children}
      </main>

    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--background)',
  },
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    backgroundColor: 'var(--surface)',
    borderBottom: '1px solid var(--border-subtle)',
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.3px',
  },
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },
  userName: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.85)',
    fontWeight: 500,
  },
  roleBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 500,
    border: '1px solid rgba(255,255,255,0.12)',
  },
  main: {
    flex: 1,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '32px 24px',
  },
}
