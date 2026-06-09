// src/app/api/auth/link/search/route.ts

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, apiSuccess } from '@/lib/api/response'
import { ACTIVE_STATUSES } from '@/lib/constants'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. 로그인 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError('인증 필요', 401)
    }

    // 2. 요청 파싱
    const body = await request.json()
    const name: string       = (body.name ?? '').trim()
    const generation: number = Number(body.generation)

    if (!name) {
      return apiError('이름을 입력해주세요.', 400)
    }
    if (!generation || isNaN(generation) || generation < 1) {
      return apiError('기수를 올바르게 입력해주세요.', 400)
    }

    // 3. 임포트 레코드 검색
    //    - createAdminClient() 사용: RLS 우회하여 확실하게 조회
    //    - kakao_id가 imported_ 로 시작 + linked_auth_id가 null(미연동)인 것만
    const { data: candidates, error: searchError } = await createAdminClient()
      .from('users')
      .select('id, name, generation, session, status, department, student_id, school_year')
      .eq('name', name)
      .eq('generation', generation)
      .like('kakao_id', 'imported_%')
      .is('linked_auth_id', null)
      .in('status', [...ACTIVE_STATUSES])

    if (searchError) {
      console.error('search error:', searchError)
      return apiError('서버 오류가 발생했습니다', 500)
    }

    return apiSuccess({ candidates: candidates ?? [] })

  } catch (err: unknown) {
    console.error('link/search unexpected error:', err)
    return apiError('서버 오류가 발생했습니다.', 500)
  }
}
