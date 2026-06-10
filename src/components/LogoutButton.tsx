'use client'
// src/components/LogoutButton.tsx

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router   = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut({ scope: 'local' })
    localStorage.clear()
    router.refresh()
    router.replace('/')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="py-1.5 px-3.5 text-[13px] border border-[#e0e0e0] rounded-md bg-white text-gray-500"
      style={{
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? '로그아웃 중...' : '로그아웃'}
    </button>
  )
}
