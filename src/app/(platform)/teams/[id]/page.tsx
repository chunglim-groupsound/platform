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
    <main style={{ padding: '24px 20px', maxWidth: '680px', margin: '0 auto' }}>
      <Link href="/teams" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>
        ← 팀 목록
      </Link>

      <div style={{
        marginTop: '20px', background: '#f9fafb', borderRadius: '16px', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{team.name}</h1>
            <span style={{
              padding: '2px 8px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0,
              background: team.is_recruiting ? '#dcfce7' : '#f3f4f6',
              color:      team.is_recruiting ? '#15803d' : '#6b7280',
              border:     `1px solid ${team.is_recruiting ? '#bbf7d0' : '#e5e7eb'}`,
            }}>
              {team.is_recruiting ? '모집 중' : '모집 완료'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {isMember && !isLeader && <LeaveTeamButton teamId={id} />}
            {canEdit && (
              <Link href={`/teams/${id}/edit`} style={{
                padding: '5px 12px', borderRadius: '7px', fontSize: '0.82rem',
                border: '1px solid #d1d5db', background: '#fff', textDecoration: 'none', color: '#374151',
              }}>
                수정
              </Link>
            )}
          </div>
        </div>

        {team.current_song && (
          <div style={{
            display: 'inline-block', padding: '5px 12px', borderRadius: '8px',
            background: '#f0f9ff', color: '#0369a1', fontSize: '0.85rem', width: 'fit-content',
          }}>
            ♪ 현재 연습 곡: {team.current_song}
          </div>
        )}

        {team.description && (
          <p style={{ fontSize: '0.88rem', color: '#4b5563', margin: 0, lineHeight: '1.6' }}>
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

      <div style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>팀원 ({members.length}명)</h2>
        <TeamMemberList members={members} myId={myId} canEdit={canEdit} teamId={id} />
      </div>

      {canEdit && joinRequests.length > 0 && (
        <JoinRequestsPanel teamId={id} requests={joinRequests} />
      )}

      <div style={{ marginTop: '28px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>합주 예약 현황</h2>
        <div style={{
          padding: '24px', borderRadius: '12px', border: '1px dashed #d1d5db',
          textAlign: 'center', color: '#9ca3af', fontSize: '0.88rem',
        }}>
          예약 시스템 연동 후 표시됩니다.
        </div>
      </div>
    </main>
  )
}
