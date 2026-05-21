'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const supabase = createClient()

    const handleKakaoLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
            },
        })
    }

    return (
        <button onClick={handleKakaoLogin}>
            카카오로 시작하기
        </button>
    )
}