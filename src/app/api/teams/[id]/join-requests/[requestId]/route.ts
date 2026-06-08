import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PATCH /api/teams/[id]/join-requests/[requestId] — 수락/거절 (팀장/운영진)
// DELETE /api/teams/[id]/join-requests/[requestId] — 신청 취소 (본인)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const { id: teamId, requestId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('users')
    .select('id, role')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(callerProfile?.role ?? '')

  const { data: team } = await supabase
    .from('teams')
    .select('leader_id')
    .eq('id', teamId)
    .single()

  const isLeader = team?.leader_id === callerProfile?.id
  if (!isAdmin && !isLeader) {
    return NextResponse.json({ error: '수락/거절 권한이 없습니다' }, { status: 403 })
  }

  let body: { status?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }

  if (!['ACCEPTED', 'REJECTED'].includes(body.status ?? '')) {
    return NextResponse.json({ error: 'status는 ACCEPTED 또는 REJECTED여야 합니다' }, { status: 400 })
  }

  const { data: joinRequest } = await supabase
    .from('team_join_requests')
    .select('id, applicant_id, status')
    .eq('id', requestId)
    .eq('team_id', teamId)
    .single()

  if (!joinRequest) return NextResponse.json({ error: '신청을 찾을 수 없습니다' }, { status: 404 })
  if (joinRequest.status !== 'PENDING') return NextResponse.json({ error: '이미 처리된 신청입니다' }, { status: 409 })

  const { error: updateError } = await supabase
    .from('team_join_requests')
    .update({ status: body.status })
    .eq('id', requestId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // 수락 시 team_members에 추가
  if (body.status === 'ACCEPTED') {
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, user_id: joinRequest.applicant_id })

    if (memberError && memberError.code !== '23505') {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const { id: teamId, requestId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  const { data: joinRequest } = await supabase
    .from('team_join_requests')
    .select('id, applicant_id')
    .eq('id', requestId)
    .eq('team_id', teamId)
    .single()

  if (!joinRequest) return NextResponse.json({ error: '신청을 찾을 수 없습니다' }, { status: 404 })
  if (joinRequest.applicant_id !== callerProfile?.id) {
    return NextResponse.json({ error: '취소 권한이 없습니다' }, { status: 403 })
  }

  const { error } = await supabase
    .from('team_join_requests')
    .delete()
    .eq('id', requestId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
