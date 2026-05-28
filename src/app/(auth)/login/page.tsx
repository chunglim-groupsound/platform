'use client'

import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const handleKakaoLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        queryParams: { prompt: 'login' },
      },
    })
    if (error) console.error('카카오 로그인 오류:', error.message)
  }

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#111827',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
      }}>

        {/* 로고 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Image
            src="/icon.svg"
            alt="청림그룹사운드 로고"
            width={56}
            height={56}
            style={{ width: '56px', height: 'auto', filter: 'invert(1)' }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.4px' }}>
              청림그룹사운드
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '6px' }}>
              한남대학교 밴드 동아리
            </div>
          </div>
        </div>

        {/* 카카오 버튼 */}
        <button
          onClick={handleKakaoLogin}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '260px',
            padding: '13px 0',
            backgroundColor: '#FEE500',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
            color: '#191600',
            letterSpacing: '-0.2px',
          }}
        >
          <KakaoIcon />
          카카오로 시작하기
        </button>

      </div>
    </main>
  )
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2C5.582 2 2 4.910 2 8.500c0 2.284 1.437 4.294 3.610 5.487L4.790 17.18a.25.25 0 00.373.274L9.35 14.93c.216.018.434.028.65.028 4.418 0 8-2.910 8-6.5S14.418 2 10 2z"
        fill="#191600"
      />
    </svg>
  )
}
