'use client'

import { useEffect, useRef, useState } from 'react'
import { ThemePicker } from '@/components/ui/ThemePicker'
import { Avatar } from '@/components/ui/Avatar'

interface ProfileMenuProps {
  name: string
  roleLabel: string
  onLogout: () => void
  onReport?: () => void
}

export function ProfileMenu({ name, roleLabel, onLogout, onReport }: ProfileMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-surface-elevated transition-colors"
      >
        <Avatar name={name} size={28} />
        <span className="text-sm font-medium text-foreground hidden min-[860px]:block">{name}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-56 bg-surface-elevated border border-[var(--border)] rounded-xl shadow-xl z-[200] p-1">
          {/* 사용자 정보 */}
          <div className="px-3 py-2.5 border-b border-[var(--border-subtle)] mb-1">
            <p className="text-[13px] font-semibold text-foreground">{name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{roleLabel}</p>
          </div>

          {/* 테마 선택 */}
          <div className="px-3 py-2 flex items-center justify-between border-b border-[var(--border-subtle)] mb-1">
            <span className="text-[12px] text-muted-foreground">테마</span>
            <ThemePicker />
          </div>

          {/* 신고·제보 */}
          {onReport && (
            <button
              onClick={() => { setOpen(false); onReport() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg transition-colors cursor-pointer"
            >
              <FlagIcon />
              신고·제보
            </button>
          )}

          {/* 로그아웃 */}
          <button
            onClick={() => { setOpen(false); onLogout() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-bad hover:bg-bad/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogoutIcon />
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
      className={`text-muted-foreground transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M3 2v11M3 2h8l-2 3.5 2 3.5H3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M6 2H3a1 1 0 00-1 1v9a1 1 0 001 1h3M10 10l3-3-3-3M13 7H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
