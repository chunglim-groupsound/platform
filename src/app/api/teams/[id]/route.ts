import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('users')
    .select('id, role, status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  const allowed = ['PROBATION', 'ACTIVE', 'INACTIVE']
  if (!allowed.includes(callerProfile?.status ?? '')) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  }

  const { data: team, error } = await supabase
    .from('teams')
    .select(`
      id, name, current_song, description, is_active, created_at, updated_at,
      leader_id,
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('users')
    .select('id, role, status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(callerProfile?.role ?? '')

  const { data: team } = await supabase
    .from('teams')
    .select('leader_id')
    .eq('id', id)
    .single()

  const isLeader = team?.leader_id === callerProfile?.id
  if (!isAdmin && !isLeader) {
    return NextResponse.json({ error: '수정 권한이 없습니다' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }

  // 팀장은 current_song, description만 수정 가능
  // 운영진은 모든 항목 수정 가능
  const leaderFields = new Set(['current_song', 'description'])
  const adminFields  = new Set(['name', 'leader_id', 'is_active', 'current_song', 'description'])

  const patch: Record<string, unknown> = {}
  const fieldSet = isAdmin ? adminFields : leaderFields
  for (const key of fieldSet) {
    if (key in body) patch[key] = body[key]
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: '변경할 항목이 없습니다' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('teams')
    .update(patch)
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
