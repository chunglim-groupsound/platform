// src/app/api/auth/link/search/route.ts
// auth_key로 기존 부원 레코드를 조회합니다.

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, apiSuccess } from '@/lib/api/response'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return apiError('인증 필요', 401)

    const body = await request.json()
    const authKey: string = (body.auth_key ?? '').trim().toUpperCase()

    if (!authKey) return apiError('인증키를 입력해주세요.', 400)

    // auth_key로 임포트 레코드 조회 (admin으로 RLS 우회)
    const { data: target, error: searchError } = await createAdminClient()
      .from('users')
      .select('id, name, generation, linked_auth_id')
      .eq('auth_key', authKey)
      .like('kakao_id', 'imported_%')
      .maybeSingle()

    if (searchError) {
      console.error('link/search error:', searchError)
      return apiError('서버 오류가 발생했습니다.', 500)
    }

    if (!target) return apiError('인증키를 확인할 수 없습니다.', 404)

    if (target.linked_auth_id !== null) return apiError('이미 연동된 인증키입니다.', 409)

    return apiSuccess({
      user: {
        id:         target.id,
        name:       target.name,
        generation: target.generation,
      },
    })
  } catch (err: unknown) {
    console.error('link/search unexpected error:', err)
    return apiError('서버 오류가 발생했습니다.', 500)
  }
}
