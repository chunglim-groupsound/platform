import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin/applications',    label: '가입 신청',    emoji: '📋' },
  { href: '/admin/interview-slots', label: '면접 슬롯',    emoji: '🗓' },
  { href: '/admin/members',         label: '부원 관리',    emoji: '👥' },
  { href: '/admin/settings',        label: '모집 설정',    emoji: '⚙️' },
  { href: '/admin/import',          label: '기존 부원 임포트', emoji: '📥' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!['ADMIN', 'SUPER_ADMIN'].includes(profile?.role ?? '')) redirect('/home')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb' }}>

      {/* 사이드바 */}
      <aside style={{
        width: '200px',
        flexShrink: 0,
        backgroundColor: '#111827',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        <div style={{ padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/admin/applications" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.2px' }}>
              운영 관리
            </span>
          </Link>
        </div>

        <nav style={{ flex: 1, padding: '12px 0' }}>
          {NAV_ITEMS.map(item => (
            <NavItem key={item.href} href={item.href} emoji={item.emoji} label={item.label} />
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/home" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
          }}>
            ← 홈으로
          </Link>
        </div>
      </aside>

      {/* 본문 */}
      <main style={{ flex: 1, minWidth: 0, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>

    </div>
  )
}

function NavItem({ href, emoji, label }: { href: string; emoji: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 20px',
        fontSize: '13px',
        color: 'rgba(255,255,255,0.65)',
        textDecoration: 'none',
        transition: 'background 0.1s',
      }}
    >
      <span style={{ fontSize: '15px' }}>{emoji}</span>
      {label}
    </Link>
  )
}
