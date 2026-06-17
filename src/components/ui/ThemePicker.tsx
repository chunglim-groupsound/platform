'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/lib/useTheme'

export function ThemePicker() {
  const { theme, applyTheme, themes } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = themes.find(t => t.id === theme)!

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      {/* 트리거 */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors cursor-pointer text-sm"
      >
        <span
          className="w-4 h-4 rounded-full shrink-0"
          style={{
            background: `linear-gradient(135deg, ${current.bg} 50%, ${current.accent} 50%)`,
          }}
        />
        <span className="text-muted-foreground text-[13px]">{current.label}</span>
        <ChevronIcon open={open} />
      </button>

      {/* 드롭다운 */}
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-1.5 w-44 py-1 rounded-xl bg-surface-elevated border border-[var(--border)] shadow-xl z-[200] list-none m-0 p-1"
        >
          {themes.map(t => (
            <li
              key={t.id}
              role="option"
              aria-selected={theme === t.id}
              onClick={() => { applyTheme(t.id); setOpen(false) }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors text-[13px] ${
                theme === t.id
                  ? 'bg-accent/10 text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-surface hover:text-foreground'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)`,
                  outline: theme === t.id ? '2px solid var(--accent)' : 'none',
                  outlineOffset: '1px',
                }}
              />
              {t.label}
              {theme === t.id && <CheckIcon />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      className={`text-muted-foreground transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="ml-auto text-accent">
      <path d="M2.5 6.5l3 3 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
