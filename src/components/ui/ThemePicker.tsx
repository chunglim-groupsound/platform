'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/lib/useTheme'

export function ThemePicker() {
  const { theme, applyTheme, themes } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = themes.find(t => t.id === theme)!

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div ref={ref} className="relative flex-none">
      {/* 트리거 */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 py-[5px] pl-[8px] pr-[11px] rounded-[22px] border border-border bg-transparent text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
      >
        <span
          className="w-[17px] h-[17px] rounded-full shrink-0"
          style={{
            background: `linear-gradient(135deg, ${current.bg} 50%, ${current.accent} 50%)`,
            border: '1px solid rgba(255,255,255,0.22)',
          }}
        />
        <span className="hidden sm:inline font-sans text-[12.5px] font-semibold text-muted-foreground whitespace-nowrap">
          {current.label}
        </span>
        <span className={`flex text-subtle-foreground transition-transform duration-[180ms] ${open ? 'rotate-180' : ''}`}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {/* 드롭다운 */}
      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+10px)] right-0 w-[214px] z-[200] bg-surface border border-border rounded-xl shadow-[0_18px_50px_rgba(0,0,0,0.45)] px-3 pt-[11px] pb-[13px]"
        >
          <div className="font-mono text-[9.5px] tracking-[0.12em] uppercase text-subtle-foreground mb-[9px]">
            테마 변경
          </div>
          <div className="flex flex-col gap-[5px]">
            {themes.map(t => (
              <button
                key={t.id}
                role="menuitemradio"
                aria-checked={theme === t.id}
                onClick={() => { applyTheme(t.id); setOpen(false) }}
                className={`flex items-center gap-[10px] px-[10px] py-2 rounded-lg w-full text-left border transition-colors cursor-pointer ${
                  theme === t.id
                    ? 'border-accent bg-accent-muted'
                    : 'border-border-subtle bg-transparent hover:bg-surface-elevated'
                }`}
              >
                <span
                  className="w-[18px] h-[18px] rounded-full shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)`,
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                />
                <span className={`font-sans text-[12.5px] whitespace-nowrap ${
                  theme === t.id ? 'font-semibold text-accent-hover' : 'font-normal text-muted-foreground'
                }`}>
                  {t.label}
                </span>
                {theme === t.id && (
                  <span className="ml-auto flex text-accent-hover">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5L20 7" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
