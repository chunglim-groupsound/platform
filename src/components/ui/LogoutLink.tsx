'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LogoutLink() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-[12.5px] text-subtle-foreground hover:text-muted-foreground underline underline-offset-2 bg-transparent border-none cursor-pointer p-0 font-sans transition-colors"
    >
      다른 카카오 계정으로 로그인
    </button>
  )
}
