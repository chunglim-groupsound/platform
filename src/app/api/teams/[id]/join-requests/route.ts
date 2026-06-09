import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { isAdminRole, canCreateTeam } from '@/lib/constants'
import { getCurrentSession } from '@/lib/auth/session'

// POST /api/teams/[id]/join-requests — 가입 신청
// GET  /api/teams/[id]/join-requests — 신청 목록 조회 (팀장/운영진)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { profile: callerProfile, myId } = session
  const isAdmin = isAdminRole(callerProfile?.role)

  const { data: team } = await supabaseAdmin
    .from('teams')
    .select('leader_id, vice_leader_id')
    .eq('id', teamId)
    .single()

  const isLeader     = team?.leader_id      === myId
  const isViceLeader = team?.vice_leader_id === myId
  if (!isAdmin && !isLeader && !isViceLeader) {
    return NextResponse.json({ error: '조회 권한이 없습니다' }, { status: 403 })
  }

  const { data: requests, error } = await supabaseAdmin
    .from('team_join_requests')
    .select(`
      id, message, status, created_at, updated_at,
      applicant:users!applicant_id ( id, name, nickname, profile_image_url, session, role, status, is_whitelist )
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ requests: requests ?? [] })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  // supabaseAdmin으로 조회해야 linked_auth_id 유저도 올바른 users.id를 얻을 수 있음
  const { data: callerProfile } = await supabaseAdmin
    .from('users')
    .select('id, status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  // ACTIVE, INACTIVE 부원만 가입 신청 가능
  if (!canCreateTeam(callerProfile?.status)) {
    return NextResponse.json({ error: '정식 부원만 가입 신청할 수 있습니다' }, { status: 403 })
  }

  // 이미 팀원인지 확인
  const { data: existing } = await supabaseAdmin
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', callerProfile!.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: '이미 팀원입니다' }, { status: 409 })

  // 기존 신청 이력 확인
  const { data: existingRequest } = await supabaseAdmin
    .from('team_join_requests')
    .select('id, status')
    .eq('team_id', teamId)
    .eq('applicant_id', callerProfile!.id)
    .maybeSingle()

  if (existingRequest) {
    if (existingRequest.status === 'PENDING') {
      return NextResponse.json({ error: '이미 신청한 팀입니다' }, { status: 409 })
    }
    // ACCEPTED(탈퇴 후 재신청) 또는 REJECTED: 기존 행 삭제 후 재신청 허용
    await supabaseAdmin.from('team_join_requests').delete().eq('id', existingRequest.id)
  }

  let body: { message?: string } = {}
  try { body = await request.json() } catch { /* optional body */ }

  const { data, error } = await supabaseAdmin
    .from('team_join_requests')
    .insert({
      team_id:      teamId,
      applicant_id: callerProfile!.id,
      message:      body.message?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ request: { id: data.id } }, { status: 201 })
}
