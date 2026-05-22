'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const handleKakaoLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })
    if (error) console.error('카카오 로그인 오류:', error.message)
  }

  return (
    <main>
      <h1>청림그룹사운드</h1>
      <button onClick={handleKakaoLogin}>
        카카오로 시작하기
      </button>
    </main>
  )
}