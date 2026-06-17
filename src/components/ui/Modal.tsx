'use client'

import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className = '' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* panel */}
      <div
        className={`relative w-full max-w-md bg-surface border border-[var(--border)] rounded-2xl shadow-2xl animate-screen-in ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              <CloseIcon />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  side?: 'right' | 'bottom'
  className?: string
}

export function Drawer({ open, onClose, title, children, side = 'right', className = '' }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const panelCls =
    side === 'bottom'
      ? 'fixed bottom-0 inset-x-0 max-h-[85vh] rounded-t-2xl overflow-y-auto'
      : 'fixed right-0 inset-y-0 w-full max-w-sm overflow-y-auto'

  return (
    <div className="fixed inset-0 z-[300]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-surface border-l border-[var(--border)] shadow-2xl ${panelCls} ${className}`}
        style={side === 'bottom' ? { borderLeft: 'none', borderTop: '1px solid var(--border)' } : {}}
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              <CloseIcon />
            </button>
          </div>
        )}
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
