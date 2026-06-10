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
    <main className="min-h-screen bg-gray-900 text-white flex flex-col">

      {/* 헤더 */}
      <header className="py-6 px-8 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <Image
            src="/icon.svg"
            alt="청림그룹사운드 로고"
            width={28}
            height={28}
            style={{ filter: 'invert(1)', opacity: 0.9 }}
          />
          <span className="text-[15px] font-bold tracking-[-0.3px]">
            청림그룹사운드
          </span>
        </div>
        <button
          onClick={handleKakaoLogin}
          className="py-2 px-5 bg-white/8 border border-white/12 rounded-lg text-[13px] font-medium text-white cursor-pointer tracking-[-0.1px]"
        >
          로그인
        </button>
      </header>

      {/* 히어로 섹션 */}
      <section className="flex-1 flex flex-col items-center justify-center text-center py-20 px-6 pb-[60px] gap-8">
        <div className="flex flex-col items-center gap-5">
          <Image
            src="/icon.svg"
            alt="청림그룹사운드 로고"
            width={64}
            height={64}
            style={{ filter: 'invert(1)', opacity: 0.85 }}
          />
          <div>
            <h1 className="text-[38px] font-bold tracking-[-0.8px] m-0 leading-[1.2]">
              청림그룹사운드
            </h1>
            <p className="text-[15px] text-white/45 mt-2.5 tracking-[-0.1px]">
              한남대학교 밴드 동아리
            </p>
          </div>
          <p className="text-base text-white/[0.65] max-w-[360px] leading-[1.7] tracking-[-0.1px] m-0">
            음악으로 하나되는 공간.<br />
            함께 연주하고, 함께 성장합니다.
          </p>
        </div>

        <button
          onClick={handleKakaoLogin}
          className="inline-flex items-center gap-2 py-3.5 px-8 bg-[#FEE500] rounded-xl text-[15px] font-semibold text-[#191600] border-none cursor-pointer tracking-[-0.2px]"
        >
          <KakaoIcon />
          카카오로 시작하기
        </button>
      </section>

      {/* 활동 소개 섹션 */}
      <section className="py-[60px] px-6 border-t border-white/[0.06] max-w-[720px] w-full mx-auto">
        <h2 className="text-xl font-bold tracking-[-0.4px] text-center mb-9 text-white/85">
          동아리 활동
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
          }}
        >
          {ACTIVITIES.map(({ title, desc }) => (
            <div
              key={title}
              className="py-6 px-5 bg-white/[0.04] border border-white/8 rounded-xl"
            >
              <div className="text-sm font-semibold mb-2 tracking-[-0.2px]">
                {title}
              </div>
              <div className="text-[13px] text-white/45 leading-[1.6] tracking-[-0.1px]">
                {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-6 text-center text-xs text-white/20 border-t border-white/[0.06]">
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
