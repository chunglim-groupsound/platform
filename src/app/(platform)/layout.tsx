// src/app/(platform)/layout.tsx

import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/LogoutButton'

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
    TEAM_LEADER:      '팀장',
    MEMBER:           '정식 부원',
    PROBATION_MEMBER: '유예 부원',
  }

  return (
    <div style={styles.wrapper}>

      {/* ── 헤더 ── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>

          {/* 로고 */}
          <span style={styles.logo}>청림그룹사운드</span>

          {/* 유저 정보 + 로그아웃 */}
          <div style={styles.userArea}>
            {profile && (
              <span style={styles.userInfo}>
                {profile.name}
                <span style={styles.roleBadge}>
                  {roleLabel[profile.role] ?? profile.role}
                </span>
              </span>
            )}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
    letterSpacing: '-0.3px',
  },
  userArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userInfo: {
    fontSize: '14px',
    color: '#444',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  roleBadge: {
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '10px',
    background: '#EFF6FF',
    color: '#1D4ED8',
    fontWeight: 500,
  },
  main: {
    flex: 1,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '32px 24px',
  },
}