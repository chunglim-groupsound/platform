'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinksProps {
  isAdmin: boolean
}

const LINKS = [
  { href: '/home',       label: '홈' },
  { href: '/timetable',  label: '타임테이블' },
  { href: '/members',    label: '부원' },
  { href: '/notices',    label: '공지' },
]

const ADMIN_LINK = { href: '/admin/applications', label: '운영' }

export function NavLinks({ isAdmin }: NavLinksProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/home' || href === '/timetable'
      ? pathname === href
      : pathname.startsWith(href)

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
      {LINKS.map(link => (
        <Link
          key={link.href}
          href={link.href}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            fontWeight: isActive(link.href) ? 600 : 500,
            color: isActive(link.href) ? '#fff' : 'rgba(255,255,255,0.55)',
            textDecoration: 'none',
            borderRadius: '6px',
            background: isActive(link.href) ? 'rgba(255,255,255,0.12)' : 'transparent',
            transition: 'color 0.15s, background 0.15s',
          }}
        >
          {link.label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          href={ADMIN_LINK.href}
          style={{
            padding: '6px 12px',
            fontSize: '14px',
            fontWeight: isActive(ADMIN_LINK.href) ? 600 : 500,
            color: isActive(ADMIN_LINK.href) ? '#bfdbfe' : '#93c5fd',
            textDecoration: 'none',
            borderRadius: '6px',
            background: isActive(ADMIN_LINK.href) ? 'rgba(147,197,253,0.15)' : 'transparent',
            transition: 'color 0.15s, background 0.15s',
          }}
        >
          {ADMIN_LINK.label}
        </Link>
      )}
    </nav>
  )
}
