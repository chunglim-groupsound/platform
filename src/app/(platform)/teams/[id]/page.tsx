import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { TeamMemberList } from '@/components/teams/TeamMemberList'
import { RecruitingToggle } from '@/components/teams/RecruitingToggle'
import { JoinRequestSection } from '@/components/teams/JoinRequestSection'
import { JoinRequestsPanel } from '@/components/teams/JoinRequestsPanel'
import { ActivationPanel } from '@/components/teams/ActivationPanel'
import { LeaveTeamButton } from '@/components/teams/LeaveTeamButton'
import { isAdminRole, hasActiveMemberAccess } from '@/lib/constants'
import type { MemberCardData } from '@/types/app'
import type { TeamDetailRow, TeamDetailJoinRequestRow } from '@/types/team'

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // createAdminClient()로 조회해야 linked_auth_id 유저도 올바른 users.id를 얻을 수 있음
  const { data: profile } = await createAdminClient()
    .from('users')
    .select('id, status, role')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!hasActiveMemberAccess(profile?.status)) redirect('/timetable')

  const { data: rawTeam } = await createAdminClient()
    .from('teams')
    .select(`
      id, name, current_song, description, is_active, is_recruiting, leader_id, vice_leader_id, activation_requested,
      leader:users!leader_id (
        id, name, nickname, profile_image_url,
        session, role, status, is_whitelist,
        generation, phone, department, school_year, privacy_settings
      ),
      team_members (
        id, session_in_team,
        user:users!user_id (
          id, name, nickname, profile_image_url,
          session, role, status, is_whitelist,
          generation, phone, department, school_year, privacy_settings
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!rawTeam) notFound()

  const team = rawTeam as TeamDetailRow
  // profile.id 와 auth.uid 모두 확인 (linked_auth_id 유저, 구버전 데이터 호환)
  const myIds        = [...new Set([profile?.id, user.id].filter(Boolean) as string[])]
  const myId         = profile?.id ?? user.id ?? ''
  const isAdmin      = isAdminRole(profile?.role)
  const isLeader     = myIds.some(id => team.leader_id      === id)
  const isViceLeader = myIds.some(id => team.vice_leader_id === id)
  const canEdit      = isAdmin || isLeader || isViceLeader

  const memberUserIds = new Set(team.team_members.map(tm => tm.user.id))
  const leaderInList  = team.leader && memberUserIds.has(team.leader.id)
  const isMemberByRoster = myIds.some(id => memberUserIds.has(id)) || myIds.some(id => team.leader_id === id)

  // 가입 신청 이력 조회 (ACCEPTED 제외: 실제 멤버십은 team_members로만 판단, 탈퇴 후 재신청 가능해야 함)
  let myJoinRequest: { id: string; status: string } | null = null
  const { data: joinReqRows } = await createAdminClient()
    .from('team_join_requests')
    .select('id, status')
    .eq('team_id', id)
    .in('applicant_id', myIds)
    .neq('status', 'ACCEPTED')
    .order('created_at', { ascending: false })
    .limit(1)
  myJoinRequest = joinReqRows?.[0] ?? null

  const isMember = isMemberByRoster
  const canApply = ['ACTIVE', 'INACTIVE'].includes(profile?.status ?? '') && !isMember

  let joinRequests: TeamDetailJoinRequestRow[] = []
  if (canEdit) {
    const { data: reqs } = await createAdminClient()
      .from('team_join_requests')
      .select(`
        id, message, status, created_at,
        applicant:users!applicant_id ( id, name, nickname, profile_image_url, session, role, status, is_whitelist )
      `)
      .eq('team_id', id)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
    joinRequests = (reqs ?? []) as TeamDetailJoinRequestRow[]
  }

  const members = [
    ...(team.leader && !leaderInList
      ? [{ id: `leader-${team.leader.id}`, session_in_team: team.leader.session ?? [], user: team.leader as MemberCardData, isLeader: true, isViceLeader: false }]
      : []),
    ...team.team_members.map(tm => ({
      id: tm.id, session_in_team: tm.session_in_team ?? [],
      user: tm.user,
      isLeader:     tm.user.id === team.leader_id,
      isViceLeader: tm.user.id === team.vice_leader_id,
    })),
  ]

  return (
    <main className="py-6 px-5 max-w-[680px] mx-auto">
      <Link href="/teams" className="text-[0.85rem] text-gray-500 no-underline">
        ← 팀 목록
      </Link>

      <div className="mt-5 bg-gray-50 rounded-2xl p-5 flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <h1 className="text-[1.4rem] font-extrabold m-0">{team.name}</h1>
            <span className={`py-0.5 px-2 rounded-full text-[0.72rem] font-semibold shrink-0 border ${
              team.is_recruiting
                ? 'bg-green-100 text-green-700 border-green-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}>
              {team.is_recruiting ? '모집 중' : '모집 완료'}
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            {isMember && !isLeader && <LeaveTeamButton teamId={id} />}
            {canEdit && (
              <Link href={`/teams/${id}/edit`} className="py-[5px] px-3 rounded-[7px] text-[0.82rem] border border-gray-300 bg-white no-underline text-gray-700">
                수정
              </Link>
            )}
          </div>
        </div>

        {team.current_song && (
          <div className="inline-block py-[5px] px-3 rounded-lg bg-sky-50 text-sky-700 text-[0.85rem] w-fit">
            ♪ 현재 연습 곡: {team.current_song}
          </div>
        )}

        {team.description && (
          <p className="text-[0.88rem] text-gray-600 m-0 leading-relaxed">
            {team.description}
          </p>
        )}

        {canEdit && <RecruitingToggle teamId={id} isRecruiting={team.is_recruiting} />}
      </div>

      <ActivationPanel
        teamId={id}
        isActive={team.is_active}
        activationRequested={team.activation_requested}
        canRequest={isLeader || isViceLeader}
        isAdmin={isAdmin}
      />

      {canApply && <JoinRequestSection teamId={id} myRequest={myJoinRequest} />}

      <div className="mt-6">
        <h2 className="text-base font-bold mb-3">팀원 ({members.length}명)</h2>
        <TeamMemberList members={members} myId={myId} canEdit={canEdit} teamId={id} />
      </div>

      {canEdit && joinRequests.length > 0 && (
        <JoinRequestsPanel teamId={id} requests={joinRequests} />
      )}

      <div className="mt-7">
        <h2 className="text-base font-bold mb-3">합주 예약 현황</h2>
        <div className="py-6 px-6 rounded-xl border border-dashed border-gray-300 text-center text-gray-400 text-[0.88rem]">
          예약 시스템 연동 후 표시됩니다.
        </div>
      </div>
    </main>
  )
}
