'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/home',      label: '홈',         icon: HomeIcon },
  { href: '/timetable', label: '타임테이블', icon: CalendarIcon },
  { href: '/members',   label: '부원',        icon: UsersIcon },
  { href: '/teams',     label: '팀',          icon: TeamIcon },
  { href: '/notices',   label: '공지',        icon: BellIcon },
]

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/home' || href === '/timetable') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 z-[100] flex items-stretch bg-surface border-t border-[var(--border-subtle)] safe-area-bottom min-[860px]:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 no-underline transition-colors ${
              active ? 'text-accent' : 'text-subtle-foreground'
            }`}
          >
            <Icon active={active} />
            <span className={`text-[10px] font-medium ${active ? 'text-accent' : 'text-subtle-foreground'}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
        stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
      />
      <path d="M7.5 18v-5h5v5" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth={active ? 2 : 1.5}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.1 : 0} />
      <path d="M7 2v3M13 2v3M3 8h14" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
    </svg>
  )
}

function UsersIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth={active ? 2 : 1.5}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <path d="M2 17c0-3 2.686-5 6-5" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <circle cx="14" cy="9" r="2.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5} />
      <path d="M11 17c0-2 1.343-3 3-3s3 1 3 3" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
    </svg>
  )
}

function TeamIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <rect x="11" y="3" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <rect x="3" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      <rect x="11" y="11" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth={active ? 2 : 1.5}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
    </svg>
  )
}

function BellIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 3a5 5 0 00-5 5v3l-1.5 2.5h13L15 11V8a5 5 0 00-5-5z"
        stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinejoin="round"
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}
      />
      <path d="M8 15.5a2 2 0 004 0" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
    </svg>
  )
}
