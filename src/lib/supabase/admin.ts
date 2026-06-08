import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = ['/', '/auth', '/status']

// 운영진 전용 경로
const ADMIN_PATHS = ['/admin']

// PROBATION 유저가 접근 가능한 경로 (읽기 전용)
const PROBATION_ALLOWED = ['/timetable', '/members', '/notices']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // 1. 비로그인 처리
  if (!user) {
    const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
    if (!isPublic) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // 2. 로그인 상태 — DB에서 status, role 조회
  const { data: profile } = await supabase
    .from('users')
    .select('status, role')
    .eq('id', user.id)
    .single()

  const status = profile?.status ?? 'PENDING'
  const role   = profile?.role   ?? 'PROBATION_MEMBER'

  // 3. PENDING / WITHDRAWN → /status 강제 이동 (신청서 미제출이면 /apply)
  if (['PENDING', 'WITHDRAWN'].includes(status)) {
    if (!pathname.startsWith('/status') && !pathname.startsWith('/apply') && !pathname.startsWith('/auth')) {
      // 신청서 제출 여부 확인
      const { data: application } = await supabase
        .from('join_applications')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      const target = application ? '/status' : '/apply'
      return NextResponse.redirect(new URL(target, request.url))
    }
    return response
  }

  // 4. INTERVIEWING → 공지·타임테이블만 허용
  if (status === 'INTERVIEWING') {
    const allowed = ['/notices', '/timetable', '/status', '/auth']
    if (!allowed.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/timetable', request.url))
    }
    return response
  }

  // 5. 운영진 전용 경로 접근 제어
  if (ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL('/timetable', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}