// src/app/auth/callback/route.ts
// 카카오 로그인 완료 시 last_active_at 갱신 + 카카오 모드 프로필 사진 동기화

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

type UsersUpdate = Database['public']['Tables']['users']['Update']

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

  // exchangeCodeForSession 직후 getUser()는 카카오에서 받아온 최신 user_metadata를 포함
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const kakaoAvatarUrl = user.user_metadata?.avatar_url as string | undefined

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, profile_image_url')
      .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
      .maybeSingle()

    if (profile) {
      const update: Record<string, unknown> = { last_active_at: new Date().toISOString() }

      // 카카오 프로필 모드인데 URL이 바뀐 경우 자동 동기화
      const isKakaoUrl = (url: string | null) => !!url && url.includes('kakaocdn.net')
      if (kakaoAvatarUrl && isKakaoUrl(profile.profile_image_url) && profile.profile_image_url !== kakaoAvatarUrl) {
        update.profile_image_url = kakaoAvatarUrl
      }

      await supabaseAdmin
        .from('users')
        .update(update as UsersUpdate)
        .eq('id', profile.id)
    }
  }

  return NextResponse.redirect(`${origin}/home`)
}
