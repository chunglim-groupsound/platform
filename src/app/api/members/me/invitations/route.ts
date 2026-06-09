import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { apiError, apiSuccess } from '@/lib/api/response'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('인증 필요', 401)

  const { data: callerProfile } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!callerProfile) return apiError('프로필 없음', 404)

  const { data: invitations, error } = await supabaseAdmin
    .from('team_invitations')
    .select(`
      id, message, status, created_at, updated_at,
      team:teams!team_id ( id, name, leader_id ),
      inviter:users!invited_by ( id, name, nickname )
    `)
    .eq('invitee_id', callerProfile.id)
    .order('created_at', { ascending: false })

  if (error) return apiError('서버 오류가 발생했습니다', 500)

  return apiSuccess({ invitations: invitations ?? [] })
}
