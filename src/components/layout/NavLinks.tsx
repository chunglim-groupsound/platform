'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinksProps {
  isAdmin: boolean
}

const LINKS = [
  { href: '/home',      label: '홈' },
  { href: '/timetable', label: '타임테이블' },
  { href: '/members',   label: '부원' },
  { href: '/teams',     label: '팀' },
  { href: '/notices',   label: '공지' },
]

const ADMIN_LINK = { href: '/admin/applications', label: '운영' }

export function NavLinks({ isAdmin }: NavLinksProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/members') return pathname.startsWith('/members')
    if (href === '/home' || href === '/timetable') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex items-center gap-1 flex-1">
      {LINKS.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`py-1.5 px-3 text-[14px] no-underline rounded-md transition-[color,background] duration-150 ${
            isActive(link.href)
              ? 'font-semibold text-white bg-white/12'
              : 'font-medium text-white/55 bg-transparent'
          }`}
        >
          {link.label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          href={ADMIN_LINK.href}
          className={`py-1.5 px-3 text-[14px] no-underline rounded-md transition-[color,background] duration-150 ${
            isActive(ADMIN_LINK.href)
              ? 'font-semibold text-blue-200 bg-[rgba(147,197,253,0.15)]'
              : 'font-medium text-blue-300 bg-transparent'
          }`}
        >
          {ADMIN_LINK.label}
        </Link>
      )}
    </nav>
  )
}
