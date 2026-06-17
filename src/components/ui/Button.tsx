import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'px-3 py-1.5 text-[13px]',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-[15px]',
}

export function Button({ children, size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium border border-[var(--border)] bg-surface text-foreground hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizeMap[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function ButtonPrimary({ children, size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium bg-accent text-accent-foreground hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizeMap[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function ButtonGhost({ children, size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium bg-transparent text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizeMap[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
