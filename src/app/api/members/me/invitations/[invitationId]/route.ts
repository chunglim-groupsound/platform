import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { apiError, apiSuccess } from '@/lib/api/response'
import type { RequestStatus } from '@/types/app'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('인증 필요', 401)

  const { data: callerProfile } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!callerProfile) return apiError('프로필 없음', 404)

  let body: { status?: string }
  try { body = await request.json() } catch {
    return apiError('잘못된 요청입니다', 400)
  }

  if (!['ACCEPTED', 'REJECTED'].includes(body.status ?? '')) {
    return apiError('status는 ACCEPTED 또는 REJECTED여야 합니다', 400)
  }

  const { data: invitation } = await supabaseAdmin
    .from('team_invitations')
    .select('id, team_id, invitee_id, status')
    .eq('id', invitationId)
    .single()

  if (!invitation) return apiError('초대를 찾을 수 없습니다', 404)
  if (invitation.invitee_id !== callerProfile.id) return apiError('권한이 없습니다', 403)
  if (invitation.status !== 'PENDING') return apiError('이미 처리된 초대입니다', 409)

  const { error: updateError } = await supabaseAdmin
    .from('team_invitations')
    .update({ status: body.status as RequestStatus })
    .eq('id', invitationId)

  if (updateError) return apiError('서버 오류가 발생했습니다', 500)

  if (body.status === 'ACCEPTED') {
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert({ team_id: invitation.team_id, user_id: callerProfile.id })

    if (memberError && memberError.code !== '23505') {
      return apiError('서버 오류가 발생했습니다', 500)
    }
  }

  return apiSuccess({ success: true })
}
