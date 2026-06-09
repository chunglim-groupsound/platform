import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api/response'
import { isAdminRole } from '@/lib/constants'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: apiError('인증 필요', 401), supabase: null, user: null }

  const { data: caller } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!isAdminRole(caller?.role)) {
    return { error: apiError('권한 없음', 403), supabase: null, user: null }
  }

  return { error: null, supabase, user }
}

export async function GET() {
  const { error, supabase } = await requireAdmin()
  if (error) return error

  const { data, error: dbError } = await supabase!
    .from('recruitment_periods')
    .select('is_open, open_at, close_at')
    .maybeSingle()

  if (dbError) return apiError('서버 오류가 발생했습니다', 500)
  return apiSuccess(data ?? { is_open: false, open_at: null, close_at: null })
}

export async function PATCH(request: Request) {
  const { error, supabase, user } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { is_open, open_at, close_at } = body

  if (typeof is_open !== 'boolean' || !open_at || !close_at) {
    return apiError('is_open, open_at, close_at 필드가 필요합니다', 400)
  }

  const { data: existing } = await supabase!
    .from('recruitment_periods')
    .select('id')
    .maybeSingle()

  const payload = { is_open, open_at, close_at, created_by: user!.id }

  const { error: dbError } = existing
    ? await supabase!.from('recruitment_periods').update(payload).eq('id', existing.id)
    : await supabase!.from('recruitment_periods').insert(payload)

  if (dbError) return apiError('서버 오류가 발생했습니다', 500)
  return apiSuccess({ success: true })
}
