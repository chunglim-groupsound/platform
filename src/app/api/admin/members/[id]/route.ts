import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isAdminRole } from '@/lib/constants'
import { apiError, apiSuccess } from '@/lib/api/response'
import { getCurrentSession } from '@/lib/auth/session'
import type { Database } from '@/types/database'

type UsersUpdate = Database['public']['Tables']['users']['Update']

const VALID_SESSIONS = new Set(['보컬', '기타', '베이스', '드럼', '건반', '기타(악기)'])

const ADMIN_ALLOWED_FIELDS = [
  'name', 'generation', 'role', 'status', 'is_whitelist', 'session_years',
] as const

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return apiError('인증 필요', 401)
  if (!isAdminRole(session.profile?.role)) return apiError('권한이 없습니다', 403)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError('잘못된 요청입니다', 400)
  }

  const patch: Record<string, unknown> = {}
  for (const key of ADMIN_ALLOWED_FIELDS) {
    if (key in body) patch[key] = body[key] ?? null
  }

  if (Object.keys(patch).length === 0) {
    return apiError('변경할 항목이 없습니다', 400)
  }

  const errors: Record<string, string> = {}

  if ('session_years' in patch) {
    const sy = patch.session_years
    if (sy !== null) {
      if (typeof sy !== 'object' || Array.isArray(sy)) {
        errors.session_years = '세션 연차는 객체여야 합니다'
      } else {
        for (const [k, v] of Object.entries(sy as Record<string, unknown>)) {
          if (!VALID_SESSIONS.has(k)) {
            errors.session_years = `허용되지 않은 세션: ${k}`
            break
          }
          const n = Number(v)
          if (!Number.isInteger(n) || n < 0 || n > 99) {
            errors.session_years = `연차는 0~99 사이의 정수여야 합니다 (${k})`
            break
          }
        }
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return apiError('유효하지 않은 입력값', 400, { details: errors })
  }

  const { error } = await createAdminClient()
    .from('users')
    .update(patch as UsersUpdate)
    .eq('id', id)

  if (error) return apiError('서버 오류가 발생했습니다', 500)

  return apiSuccess({ success: true })
}
