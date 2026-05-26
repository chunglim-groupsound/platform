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
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        padding: '6px 14px',
        fontSize: '13px',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        background: '#fff',
        color: '#666',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? '로그아웃 중...' : '로그아웃'}
    </button>
  )
}