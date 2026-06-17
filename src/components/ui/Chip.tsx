'use client'

import type { ReactNode } from 'react'

interface ChipProps {
  children: ReactNode
  selected?: boolean
  onToggle?: () => void
  disabled?: boolean
  className?: string
}

export function Chip({ children, selected = false, onToggle, disabled = false, className = '' }: ChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-pressed={selected}
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed ${
        selected
          ? 'bg-accent-muted text-accent border-accent/40'
          : 'bg-surface text-muted-foreground border-[var(--border)] hover:text-foreground hover:border-[var(--border)]'
      } ${className}`}
    >
      {children}
    </button>
  )
}
