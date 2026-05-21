import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const supabase = await createClient()
        await supabase.auth.exchangeCodeForSession(code)
    }

    // 로그인 후 상태에 따라 분기 (미들웨어에서 처리)
    return NextResponse.redirect(new URL('/timetable', request.url))
}