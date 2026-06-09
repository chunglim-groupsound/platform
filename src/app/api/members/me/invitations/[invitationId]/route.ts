import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// PATCH /api/members/me/invitations/[invitationId] — 초대 수락/거절 (본인)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!callerProfile) return NextResponse.json({ error: '프로필 없음' }, { status: 404 })

  let body: { status?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }

  if (!['ACCEPTED', 'REJECTED'].includes(body.status ?? '')) {
    return NextResponse.json({ error: 'status는 ACCEPTED 또는 REJECTED여야 합니다' }, { status: 400 })
  }

  const { data: invitation } = await supabaseAdmin
    .from('team_invitations')
    .select('id, team_id, invitee_id, status')
    .eq('id', invitationId)
    .single()

  if (!invitation) return NextResponse.json({ error: '초대를 찾을 수 없습니다' }, { status: 404 })
  if (invitation.invitee_id !== callerProfile.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  if (invitation.status !== 'PENDING') return NextResponse.json({ error: '이미 처리된 초대입니다' }, { status: 409 })

  const { error: updateError } = await supabaseAdmin
    .from('team_invitations')
    .update({ status: body.status })
    .eq('id', invitationId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // 수락 시 team_members에 추가
  if (body.status === 'ACCEPTED') {
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert({ team_id: invitation.team_id, user_id: callerProfile.id })

    if (memberError && memberError.code !== '23505') {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
