// src/app/auth/callback/route.ts
// 카카오 로그인 완료 시 last_active_at 갱신

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    await supabaseAdmin
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
  }

  return NextResponse.redirect(`${origin}/home`)
}
