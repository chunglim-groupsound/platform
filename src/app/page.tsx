'use client'

import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const supabase = createClient()

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        queryParams: { prompt: 'login' },
      },
    })
  }

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#111827',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* 헤더 */}
      <header style={{
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Image
            src="/icon.svg"
            alt="청림그룹사운드 로고"
            width={28}
            height={28}
            style={{ filter: 'invert(1)', opacity: 0.9 }}
          />
          <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.3px' }}>
            청림그룹사운드
          </span>
        </div>
        <button
          onClick={handleKakaoLogin}
          style={{
            padding: '8px 20px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
            color: '#ffffff',
            cursor: 'pointer',
            letterSpacing: '-0.1px',
          }}
        >
          로그인
        </button>
      </header>

      {/* 히어로 섹션 */}
      <section style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px 60px',
        gap: '32px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <Image
            src="/icon.svg"
            alt="청림그룹사운드 로고"
            width={64}
            height={64}
            style={{ filter: 'invert(1)', opacity: 0.85 }}
          />
          <div>
            <h1 style={{
              fontSize: '38px',
              fontWeight: 700,
              letterSpacing: '-0.8px',
              margin: 0,
              lineHeight: 1.2,
            }}>
              청림그룹사운드
            </h1>
            <p style={{
              fontSize: '15px',
              color: 'rgba(255,255,255,0.45)',
              marginTop: '10px',
              letterSpacing: '-0.1px',
            }}>
              한남대학교 밴드 동아리
            </p>
          </div>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.65)',
            maxWidth: '360px',
            lineHeight: 1.7,
            letterSpacing: '-0.1px',
            margin: 0,
          }}>
            음악으로 하나되는 공간.<br />
            함께 연주하고, 함께 성장합니다.
          </p>
        </div>

        <button
          onClick={handleKakaoLogin}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 32px',
            backgroundColor: '#FEE500',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#191600',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '-0.2px',
          }}
        >
          <KakaoIcon />
          카카오로 시작하기
        </button>
      </section>

      {/* 활동 소개 섹션 */}
      <section style={{
        padding: '60px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        maxWidth: '720px',
        width: '100%',
        margin: '0 auto',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '-0.4px',
          textAlign: 'center',
          marginBottom: '36px',
          color: 'rgba(255,255,255,0.85)',
        }}>
          동아리 활동
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}>
          {ACTIVITIES.map(({ title, desc }) => (
            <div
              key={title}
              style={{
                padding: '24px 20px',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.2px' }}>
                {title}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, letterSpacing: '-0.1px' }}>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 푸터 */}
      <footer style={{
        padding: '24px',
        textAlign: 'center',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.2)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        © 청림그룹사운드 · 한남대학교
      </footer>

    </main>
  )
}

const ACTIVITIES = [
  { title: '정기 합주', desc: '매주 정기적으로 함께 모여 연습합니다.' },
  { title: '정기 공연', desc: '학기마다 무대에 올라 실력을 선보입니다.' },
  { title: '신입 교육', desc: '악기를 처음 잡는 분도 환영합니다.' },
]

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2C5.582 2 2 4.910 2 8.500c0 2.284 1.437 4.294 3.610 5.487L4.790 17.18a.25.25 0 00.373.274L9.35 14.93c.216.018.434.028.65.028 4.418 0 8-2.910 8-6.5S14.418 2 10 2z"
        fill="#191600"
      />
    </svg>
  )
}
