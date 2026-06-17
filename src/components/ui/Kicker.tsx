import type { ReactNode } from 'react'

interface KickerProps {
  children: ReactNode
  className?: string
}

export function Kicker({ children, className = '' }: KickerProps) {
  return (
    <span
      className={`inline-flex items-center gap-[9px] font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground ${className}`}
    >
      <span className="w-[22px] h-px bg-accent shrink-0" />
      {children}
    </span>
  )
}
