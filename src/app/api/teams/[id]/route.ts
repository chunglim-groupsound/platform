import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { isAdminRole, hasActiveMemberAccess } from '@/lib/constants'
import { getCurrentSession } from '@/lib/auth/session'

async function resolveTeamAccess(userId: string, teamId: string) {
  const [{ data: callerProfile }, { data: team }] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('id, role, status')
      .or(`id.eq.${userId},linked_auth_id.eq.${userId}`)
      .maybeSingle(),
    supabaseAdmin
      .from('teams')
      .select('leader_id, vice_leader_id')
      .eq('id', teamId)
      .single(),
  ])
  const myId       = callerProfile?.id ?? ''
  const isAdmin    = isAdminRole(callerProfile?.role)
  const isLeader   = team?.leader_id     === myId
  const isViceLeader = team?.vice_leader_id === myId
  return { callerProfile, team, isAdmin, isLeader, isViceLeader, myId }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  if (!hasActiveMemberAccess(session.profile?.status)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { data: team, error } = await supabaseAdmin
    .from('teams')
    .select(`
      id, name, current_song, description, is_active, is_recruiting, created_at, updated_at,
      leader_id, vice_leader_id,
      leader:users!leader_id ( id, name, nickname, phone, privacy_settings ),
      team_members (
        id, user_id, session_in_team, joined_at,
        user:users!user_id ( id, name, nickname, profile_image_url, session, role, status, is_whitelist )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !team) {
    return NextResponse.json({ error: '팀을 찾을 수 없습니다' }, { status: 404 })
  }

  return NextResponse.json({ team, reservations: [] })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { isAdmin, isLeader, isViceLeader } = await resolveTeamAccess(session.user.id, id)

  if (!isAdmin && !isLeader && !isViceLeader) {
    return NextResponse.json({ error: '수정 권한이 없습니다' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }

  // 팀장/부팀장: 팀 소개·곡·모집 상태·부팀장·팀장 위임 가능
  // 운영진: 이름·활성 여부 추가
  const leaderFields = new Set(['current_song', 'description', 'is_recruiting', 'vice_leader_id', 'leader_id'])
  const adminFields  = new Set(['name', 'is_active', 'current_song', 'description', 'is_recruiting', 'vice_leader_id', 'leader_id'])

  const patch: Record<string, unknown> = {}
  const fieldSet = isAdmin ? adminFields : leaderFields
  for (const key of fieldSet) {
    if (key in body) patch[key] = body[key] ?? null
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: '변경할 항목이 없습니다' }, { status: 400 })
  }

  // 활성 여부를 변경할 때 활성화 신청 상태도 초기화
  if ('is_active' in patch) {
    patch.activation_requested = false
  }

  const { error: updateError } = await supabaseAdmin
    .from('teams')
    .update(patch)
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { isAdmin, isLeader, isViceLeader } = await resolveTeamAccess(session.user.id, id)

  if (!isAdmin && !isLeader && !isViceLeader) {
    return NextResponse.json({ error: '삭제 권한이 없습니다' }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from('teams')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
