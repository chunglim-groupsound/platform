'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProfileMenu } from './ProfileMenu'

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:      '개발 담당',
  ADMIN:            '운영진',
  MEMBER:           '정식 부원',
  PROBATION_MEMBER: '수습 부원',
}

interface HeaderActionsProps {
  name: string
  role: string
}

export function HeaderActions({ name, role }: HeaderActionsProps) {
  const router = useRouter()
  const [unread] = useState(0)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut({ scope: 'local' })
    localStorage.clear()
    router.refresh()
    router.replace('/')
  }

  return (
    <div className="flex items-center gap-2 ml-auto shrink-0">
      {/* 알림 벨 */}
      <button
        aria-label="알림"
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors cursor-pointer"
      >
        <BellIcon />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-bad" />
        )}
      </button>

      {/* 프로필 메뉴 */}
      <ProfileMenu
        name={name}
        roleLabel={ROLE_LABELS[role] ?? role}
        onLogout={handleLogout}
      />
    </div>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 2a4.5 4.5 0 00-4.5 4.5v2.7L3 11.7h12l-1.5-2.5V6.5A4.5 4.5 0 009 2z"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"
      />
      <path d="M7.2 13.8a1.8 1.8 0 003.6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
