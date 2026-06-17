import type { ReactNode } from 'react'

interface AppMainProps {
  children: ReactNode
  className?: string
}

export function AppMain({ children, className = '' }: AppMainProps) {
  return (
    <main
      className={`flex-1 max-w-[1200px] w-full mx-auto px-6 py-8 pb-[calc(2rem+64px)] min-[860px]:pb-8 ${className}`}
    >
      {children}
    </main>
  )
}
