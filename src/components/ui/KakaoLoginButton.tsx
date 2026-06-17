'use client'

import { createClient } from '@/lib/supabase/client'

interface KakaoLoginButtonProps {
  children: React.ReactNode
  className?: string
}

export function KakaoLoginButton({ children, className }: KakaoLoginButtonProps) {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'login' },
      },
    })
  }

  return (
    <button onClick={handleLogin} className={className}>
      {children}
    </button>
  )
}
