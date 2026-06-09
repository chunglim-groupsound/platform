import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// POST /api/teams/[id]/activate — 팀 활성화 신청 (팀장/부팀장)
// DELETE /api/teams/[id]/activate — 신청 취소 (팀장/부팀장)

async function resolveAccess(userId: string, teamId: string) {
  const [{ data: callerProfile }, { data: team }] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('id, role')
      .or(`id.eq.${userId},linked_auth_id.eq.${userId}`)
      .maybeSingle(),
    supabaseAdmin
      .from('teams')
      .select('leader_id, vice_leader_id, is_active, activation_requested')
      .eq('id', teamId)
      .single(),
  ])
  const myId         = callerProfile?.id ?? ''
  const isAdmin      = ['ADMIN', 'SUPER_ADMIN'].includes(callerProfile?.role ?? '')
  const isLeader     = team?.leader_id      === myId
  const isViceLeader = team?.vice_leader_id === myId
  return { callerProfile, team, isAdmin, isLeader, isViceLeader }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { team, isLeader, isViceLeader } = await resolveAccess(user.id, teamId)

  if (!team) return NextResponse.json({ error: '팀을 찾을 수 없습니다' }, { status: 404 })
  if (!isLeader && !isViceLeader) {
    return NextResponse.json({ error: '팀장 또는 부팀장만 신청할 수 있습니다' }, { status: 403 })
  }
  if (team.is_active) {
    return NextResponse.json({ error: '이미 활성화된 팀입니다' }, { status: 409 })
  }
  if (team.activation_requested) {
    return NextResponse.json({ error: '이미 신청 중입니다' }, { status: 409 })
  }

  const { error } = await supabaseAdmin
    .from('teams')
    .update({ activation_requested: true })
    .eq('id', teamId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { team, isLeader, isViceLeader } = await resolveAccess(user.id, teamId)

  if (!team) return NextResponse.json({ error: '팀을 찾을 수 없습니다' }, { status: 404 })
  if (!isLeader && !isViceLeader) {
    return NextResponse.json({ error: '취소 권한이 없습니다' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('teams')
    .update({ activation_requested: false })
    .eq('id', teamId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
