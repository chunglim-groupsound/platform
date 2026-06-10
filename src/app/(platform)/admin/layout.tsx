import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/constants'

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

  if (!isAdminRole(profile?.role)) redirect('/home')

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* 사이드바 */}
      <aside className="w-[200px] shrink-0 bg-gray-900 flex flex-col py-6 sticky top-0 h-screen">
        <div className="px-5 pb-5 border-b border-white/8">
          <Link href="/admin/applications" className="no-underline">
            <span className="text-[13px] font-bold text-white/90 tracking-[-0.2px]">
              운영 관리
            </span>
          </Link>
        </div>

        <nav className="flex-1 py-3">
          {NAV_ITEMS.map(item => (
            <NavItem key={item.href} href={item.href} emoji={item.emoji} label={item.label} />
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/8">
          <Link href="/home" className="flex items-center gap-2 text-xs text-white/40 no-underline">
            ← 홈으로
          </Link>
        </div>
      </aside>

      {/* 본문 */}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        {children}
      </main>

    </div>
  )
}

function NavItem({ href, emoji, label }: { href: string; emoji: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 py-2.5 px-5 text-[13px] text-white/65 no-underline transition-[background] duration-100"
    >
      <span className="text-[15px]">{emoji}</span>
      {label}
    </Link>
  )
}
