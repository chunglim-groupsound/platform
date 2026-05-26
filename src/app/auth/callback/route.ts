// src/app/auth/callback/route.ts
// 카카오 로그인 완료 시 last_active_at 갱신

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // 로그인 성공 — 현재 유저 확인
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // last_active_at 갱신
    // linked_auth_id 또는 id 기준으로 레코드 찾아서 업데이트
    await supabaseAdmin
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
  }

  return NextResponse.redirect(`${origin}/timetable`)
}