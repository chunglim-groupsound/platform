import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TeamMemberList } from '@/components/members/TeamMemberList'
import type { MemberCardData } from '@/types/app'

interface LeaderRow extends MemberCardData { privacy_settings: Record<string, string> }
interface TeamMemberRow {
  id: string
  session_in_team: string[] | null
  user: MemberCardData
}
interface TeamRow {
  id: string; name: string; current_song: string | null; description: string | null
  is_active: boolean; leader_id: string | null
  leader: LeaderRow | null
  team_members: TeamMemberRow[]
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('id, status, role')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  const allowed = ['PROBATION', 'ACTIVE', 'INACTIVE']
  if (!allowed.includes(profile?.status ?? '')) redirect('/timetable')

  const { data: rawTeam } = await supabase
    .from('teams')
    .select(`
      id, name, current_song, description, is_active, leader_id,
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

  const team = rawTeam as unknown as TeamRow

  const isAdmin  = ['ADMIN', 'SUPER_ADMIN'].includes(profile?.role ?? '')
  const isLeader = team.leader_id === profile?.id
  const canEdit  = isAdmin || isLeader

  // team_members에 이미 팀장이 포함됐는지 확인
  const memberUserIds = new Set(team.team_members.map(tm => tm.user.id))
  const leaderInList  = team.leader && memberUserIds.has(team.leader.id)

  // 팀장을 맨 앞에 prepend (중복 방지)
  const members = [
    ...(team.leader && !leaderInList
      ? [{
          id:              `leader-${team.leader.id}`,
          session_in_team: team.leader.session ?? [],
          user:            team.leader as MemberCardData,
          isLeader:        true,
        }]
      : []),
    ...team.team_members.map(tm => ({
      id:              tm.id,
      session_in_team: tm.session_in_team ?? [],
      user:            tm.user,
      isLeader:        tm.user.id === team.leader_id,
    })),
  ]

  return (
    <main style={{ padding: '24px 20px', maxWidth: '680px', margin: '0 auto' }}>
      <Link href="/members/teams" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>
        ← 팀 목록
      </Link>

      <div style={{
        marginTop: '20px', background: '#f9fafb', borderRadius: '16px', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{team.name}</h1>
          {canEdit && (
            <Link
              href={`/members/teams/${id}/edit`}
              style={{
                padding: '5px 12px', borderRadius: '7px', fontSize: '0.82rem',
                border: '1px solid #d1d5db', background: '#fff', textDecoration: 'none', color: '#374151',
              }}
            >
              수정
            </Link>
          )}
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
      </div>

      <div style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
          팀원 ({members.length}명)
        </h2>
        <TeamMemberList members={members} myId={profile?.id ?? ''} />
      </div>

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
