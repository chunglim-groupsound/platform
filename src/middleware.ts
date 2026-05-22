// src/middleware.ts
// linked_auth_id 조건 추가 + /link 경로 분기 포함

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = ['/login', '/auth']

// 로그인은 됐지만 미승인 상태에서도 접근 가능한 경로
const PENDING_ALLOWED_PATHS = ['/apply', '/link', '/status', '/auth']

// INTERVIEWING 상태에서 접근 가능한 경로
const INTERVIEWING_ALLOWED_PATHS = ['/notices', '/timetable', '/status', '/auth']

// 운영진 전용 경로
const ADMIN_PATHS = ['/admin']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

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

  // ── 1. 비로그인 처리 ──────────────────────────────────────────
  if (!user) {
    const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
    if (!isPublic) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // ── 2. 로그인 상태 — 프로필 조회 ─────────────────────────────
  // linked_auth_id도 함께 조건으로 조회
  const { data: profile } = await supabase
    .from('users')
    .select('id, status, role')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  const status = profile?.status ?? 'PENDING'
  const role   = profile?.role   ?? 'PROBATION_MEMBER'

  // ── 3. PENDING 상태 처리 ──────────────────────────────────────
  if (status === 'PENDING') {
    const isAllowed = PENDING_ALLOWED_PATHS.some(p => pathname.startsWith(p))
    if (isAllowed) return response

    // 신청서 제출 여부 확인
    const { data: application } = await supabase
      .from('join_applications')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (application) {
      // 신청서 제출 완료 → 승인 대기 안내
      return NextResponse.redirect(new URL('/status', request.url))
    }

    // 신청서 미제출 → 연동 확인 페이지로 (기존 부원 여부 확인)
    return NextResponse.redirect(new URL('/link', request.url))
  }

  // ── 4. WITHDRAWN 처리 ─────────────────────────────────────────
  if (status === 'WITHDRAWN') {
    if (!pathname.startsWith('/status') && !pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/status', request.url))
    }
    return response
  }

  // ── 5. INTERVIEWING 처리 ──────────────────────────────────────
  if (status === 'INTERVIEWING') {
    const isAllowed = INTERVIEWING_ALLOWED_PATHS.some(p => pathname.startsWith(p))
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/timetable', request.url))
    }
    return response
  }

  // ── 6. 운영진 전용 경로 접근 제어 ────────────────────────────
  if (ADMIN_PATHS.some(p => pathname.startsWith(p))) {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.redirect(new URL('/timetable', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
    //                                          ↑ api/ 추가
  ],
}