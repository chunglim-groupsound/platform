import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// POST /api/teams/[id]/leave — 팀 나가기 (본인)
// 팀장은 위임 후 나가야 함

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const [{ data: callerProfile }, { data: team }] = await Promise.all([
    supabaseAdmin
      .from('users')
      .select('id')
      .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
      .maybeSingle(),
    supabaseAdmin
      .from('teams')
      .select('leader_id, vice_leader_id')
      .eq('id', teamId)
      .single(),
  ])

  if (!team) return NextResponse.json({ error: '팀을 찾을 수 없습니다' }, { status: 404 })

  // profile.id 와 auth.uid 모두 확인 (linked_auth_id 유저, 구버전 데이터 호환)
  const myIds = [...new Set([callerProfile?.id, user.id].filter(Boolean) as string[])]

  if (myIds.includes(team.leader_id ?? '')) {
    return NextResponse.json(
      { error: '팀장은 팀을 나갈 수 없습니다. 팀장 위임 후 나가주세요.' },
      { status: 400 }
    )
  }

  // 부팀장이 나가면 부팀장 지정도 해제
  if (myIds.includes(team.vice_leader_id ?? '')) {
    await supabaseAdmin
      .from('teams')
      .update({ vice_leader_id: null })
      .eq('id', teamId)
  }

  const { error } = await supabaseAdmin
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .in('user_id', myIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 가입 신청 이력도 삭제해야 탈퇴 후 재신청 가능 (ACCEPTED 행이 남으면 canApply=false가 됨)
  await supabaseAdmin
    .from('team_join_requests')
    .delete()
    .eq('team_id', teamId)
    .in('applicant_id', myIds)

  return NextResponse.json({ success: true })
}
