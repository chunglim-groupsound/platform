import type { ReactNode } from 'react'

interface KickerProps {
  children: ReactNode
  className?: string
}

export function Kicker({ children, className = '' }: KickerProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-accent font-mono ${className}`}
    >
      <span className="w-0.5 h-[14px] rounded-full bg-accent shrink-0" />
      {children}
    </span>
  )
}
