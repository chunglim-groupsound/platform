import { createClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api/response'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recruitment_periods')
    .select('is_open, open_at, close_at')
    .maybeSingle()

  if (error) return apiError('서버 오류가 발생했습니다', 500)
  return apiSuccess(data ?? { is_open: false, open_at: null, close_at: null })
}
