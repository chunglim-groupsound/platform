import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/teams/[id]/join-requests — 가입 신청
// GET  /api/teams/[id]/join-requests — 신청 목록 조회 (팀장/운영진)

export async function GET(
  _request: Request,
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

  const { data: team } = await supabase
    .from('teams')
    .select('leader_id')
    .eq('id', teamId)
    .single()

  const isLeader = team?.leader_id === callerProfile?.id
  if (!isAdmin && !isLeader) {
    return NextResponse.json({ error: '조회 권한이 없습니다' }, { status: 403 })
  }

  const { data: requests, error } = await supabase
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

  const { data: callerProfile } = await supabase
    .from('users')
    .select('id, status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  // ACTIVE, INACTIVE 부원만 가입 신청 가능
  if (!['ACTIVE', 'INACTIVE'].includes(callerProfile?.status ?? '')) {
    return NextResponse.json({ error: '정식 부원만 가입 신청할 수 있습니다' }, { status: 403 })
  }

  // 이미 팀원인지 확인
  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', callerProfile!.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: '이미 팀원입니다' }, { status: 409 })

  let body: { message?: string } = {}
  try { body = await request.json() } catch { /* optional body */ }

  const { data, error } = await supabase
    .from('team_join_requests')
    .insert({
      team_id:      teamId,
      applicant_id: callerProfile!.id,
      message:      body.message?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: '이미 신청한 팀입니다' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ request: { id: data.id } }, { status: 201 })
}
