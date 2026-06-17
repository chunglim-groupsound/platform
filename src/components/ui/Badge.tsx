import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  className?: string
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-elevated text-muted-foreground border border-[var(--border-subtle)] ${className}`}
    >
      {children}
    </span>
  )
}

export function BadgeAccent({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-accent-muted text-accent border border-accent/20 ${className}`}
    >
      {children}
    </span>
  )
}

export function BadgeLive({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-bad/10 text-bad border border-bad/20 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-bad animate-pulse" />
      {children}
    </span>
  )
}
