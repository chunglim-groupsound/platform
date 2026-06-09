import { createClient } from '@/lib/supabase/server'
import { transitionMemberStatus } from '@/lib/member/transitions'
import { apiError, apiSuccess } from '@/lib/api/response'
import { isAdminRole } from '@/lib/constants'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. 호출자 인증 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('인증 필요', 401)
  }

  // 2. 호출자 역할 확인 (ADMIN 이상만 허용)
  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAdminRole(caller?.role)) {
    return apiError('권한 없음', 403)
  }

  // 3. 상태 전이 실행
  const { userId, toStatus, reason } = await request.json()

  try {
    const result = await transitionMemberStatus({
      userId,
      toStatus,
      changedBy: user.id,
      reason,
    })
    return apiSuccess(result)
  } catch (err: unknown) {
    return apiError((err as Error).message, 400)
  }
}
