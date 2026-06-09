import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// POST /api/teams/[id]/invitations — 팀원 초대 발송 (팀장/운영진)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('users')
    .select('id, role')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(callerProfile?.role ?? '')

  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('leader_id, vice_leader_id')
    .eq('id', teamId)
    .single()

  const myId         = callerProfile?.id ?? ''
  const isLeader     = team?.leader_id      === myId
  const isViceLeader = team?.vice_leader_id === myId
  if (!isAdmin && !isLeader && !isViceLeader) {
    return NextResponse.json({ error: '초대 권한이 없습니다' }, { status: 403 })
  }

  let body: { inviteeId?: string; message?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }

  if (!body.inviteeId) return NextResponse.json({ error: 'inviteeId는 필수입니다' }, { status: 400 })

  // 이미 팀원인지 확인
  const { data: existing } = await supabaseAdmin
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', body.inviteeId)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: '이미 팀원입니다' }, { status: 409 })

  const { data, error } = await supabaseAdmin
    .from('team_invitations')
    .insert({
      team_id:    teamId,
      invitee_id: body.inviteeId,
      invited_by: callerProfile!.id,
      message:    body.message?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: '이미 초대한 부원입니다' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ invitation: { id: data.id } }, { status: 201 })
}
