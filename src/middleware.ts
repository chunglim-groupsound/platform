import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // 비로그인 → 로그인 페이지로
    if (!user && !request.nextUrl.pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user) {
        // DB에서 회원 상태·역할 조회
        const { data: profile } = await supabase
            .from('users')
            .select('status, role')
            .eq('id', user.id)
            .single()

        const status = profile?.status
        const role = profile?.role

        // PENDING·WITHDRAWN → 상태 안내 페이지로 강제 이동
        if (['PENDING', 'WITHDRAWN'].includes(status ?? '') &&
                !request.nextUrl.pathname.startsWith('/status')) {
            return NextResponse.redirect(new URL('/status', request.url))
        }

        // 운영진 전용 경로 접근 제어
        if (request.nextUrl.pathname.startsWith('/admin') &&
                !['ADMIN', 'SUPER_ADMIN'].includes(role ?? '')) {
            return NextResponse.redirect(new URL('/timetable', request.url))
        }
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|auth).*)'],
}