import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRole } from '@/lib/constants'
import { getCurrentSession } from '@/lib/auth/session'
import { apiError, apiSuccess } from '@/lib/api/response'
import type { RequestStatus } from '@/types/app'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const { id: teamId, requestId } = await params
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return apiError('인증 필요', 401)

  const { profile: callerProfile, myId } = session
  const isAdmin = isAdminRole(callerProfile?.role)

  const { data: team } = await createAdminClient()
    .from('teams')
    .select('leader_id, vice_leader_id')
    .eq('id', teamId)
    .single()

  const isLeader     = team?.leader_id      === myId
  const isViceLeader = team?.vice_leader_id === myId
  if (!isAdmin && !isLeader && !isViceLeader) {
    return apiError('수락/거절 권한이 없습니다', 403)
  }

  let body: { status?: string }
  try { body = await request.json() } catch {
    return apiError('잘못된 요청입니다', 400)
  }

  if (!['ACCEPTED', 'REJECTED'].includes(body.status ?? '')) {
    return apiError('status는 ACCEPTED 또는 REJECTED여야 합니다', 400)
  }

  const { data: joinRequest } = await createAdminClient()
    .from('team_join_requests')
    .select('id, applicant_id, status')
    .eq('id', requestId)
    .eq('team_id', teamId)
    .single()

  if (!joinRequest) return apiError('신청을 찾을 수 없습니다', 404)
  if (joinRequest.status !== 'PENDING') return apiError('이미 처리된 신청입니다', 409)

  const { error: updateError } = await createAdminClient()
    .from('team_join_requests')
    .update({ status: body.status as RequestStatus })
    .eq('id', requestId)

  if (updateError) return apiError('서버 오류가 발생했습니다', 500)

  if (body.status === 'ACCEPTED') {
    const { error: memberError } = await createAdminClient()
      .from('team_members')
      .insert({ team_id: teamId, user_id: joinRequest.applicant_id })

    if (memberError && memberError.code !== '23505') {
      return apiError('서버 오류가 발생했습니다', 500)
    }
  }

  return apiSuccess({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const { id: teamId, requestId } = await params
  const supabase = await createClient()
  const delSession = await getCurrentSession(supabase)
  if (!delSession) return apiError('인증 필요', 401)

  const { data: joinRequest } = await createAdminClient()
    .from('team_join_requests')
    .select('id, applicant_id')
    .eq('id', requestId)
    .eq('team_id', teamId)
    .single()

  if (!joinRequest) return apiError('신청을 찾을 수 없습니다', 404)
  if (joinRequest.applicant_id !== delSession.myId) {
    return apiError('취소 권한이 없습니다', 403)
  }

  const { error } = await createAdminClient()
    .from('team_join_requests')
    .delete()
    .eq('id', requestId)

  if (error) return apiError('서버 오류가 발생했습니다', 500)

  return apiSuccess({ success: true })
}
