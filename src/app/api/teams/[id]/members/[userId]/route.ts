import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { isAdminRole } from '@/lib/constants'
import { getCurrentSession } from '@/lib/auth/session'

// DELETE /api/teams/[id]/members/[userId] — 팀원 추방 (팀장/부팀장/관리자)

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id: teamId, userId: targetUserId } = await params
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { profile: callerProfile, myId } = session

  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('leader_id, vice_leader_id')
    .eq('id', teamId)
    .single()

  if (!team) return NextResponse.json({ error: '팀을 찾을 수 없습니다' }, { status: 404 })

  const isAdmin      = isAdminRole(callerProfile?.role)
  const isLeader     = team.leader_id      === myId
  const isViceLeader = team.vice_leader_id === myId

  if (!isAdmin && !isLeader && !isViceLeader) {
    return NextResponse.json({ error: '추방 권한이 없습니다' }, { status: 403 })
  }

  if (targetUserId === team.leader_id) {
    return NextResponse.json({ error: '팀장은 추방할 수 없습니다' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', targetUserId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
