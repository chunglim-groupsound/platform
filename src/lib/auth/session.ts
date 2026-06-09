import type { SupabaseClient } from '@supabase/supabase-js'

export interface SessionResult {
  user: { id: string }
  profile: { id: string; role: string; status: string } | null
  myId: string
}

/**
 * Route Handler / Server Component에서 현재 인증 세션을 가져옵니다.
 * linked_auth_id 유저의 경우 users.id(profile.id)와 auth uid가 다를 수 있으므로
 * myId는 항상 users.id를 기준으로 반환합니다.
 *
 * 미인증 시 null 반환.
 */
export async function getCurrentSession(
  supabase: SupabaseClient
): Promise<SessionResult | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, role, status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  return {
    user,
    profile: profile ?? null,
    myId: profile?.id ?? user.id,
  }
}
