import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { EditTeamForm } from '@/components/teams/EditTeamForm'
import Link from 'next/link'
import { isAdminRole, hasActiveMemberAccess } from '@/lib/constants'

interface TeamMemberUser { id: string; name: string; nickname: string | null }
interface TeamMemberRow  { user_id: string; user: TeamMemberUser | null }

export default async function EditTeamPage({
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
    .select('id, role, status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!hasActiveMemberAccess(profile?.status)) redirect('/timetable')

  const { data: team } = await supabaseAdmin
    .from('teams')
    .select(`
      id, name, description, current_song, is_recruiting, is_active, leader_id, vice_leader_id,
      team_members (
        user_id,
        user:users!user_id ( id, name, nickname )
      )
    `)
    .eq('id', id)
    .single()

  if (!team) notFound()

  const myId         = profile?.id ?? ''
  const isAdmin      = isAdminRole(profile?.role)
  const isLeader     = team.leader_id      === myId
  const isViceLeader = team.vice_leader_id === myId

  if (!isAdmin && !isLeader && !isViceLeader) redirect(`/teams/${id}`)

  // 팀원 목록 (드롭다운용)
  const rawMembers = (team.team_members ?? []) as unknown as TeamMemberRow[]
  const teamMembers = rawMembers
    .map(tm => {
      const u = tm.user
      if (!u) return null
      return { id: u.id, name: u.nickname ?? u.name }
    })
    .filter((m): m is { id: string; name: string } => m !== null)

  return (
    <main style={{ padding: '24px 20px', maxWidth: '520px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href={`/teams/${id}`} style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>
          ← 팀 상세
        </Link>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>팀 수정</h1>
      </div>
      <EditTeamForm
        teamId={id}
        initial={{
          name:           team.name,
          description:    team.description,
          current_song:   team.current_song,
          is_recruiting:  team.is_recruiting,
          is_active:      team.is_active,
          leader_id:      team.leader_id,
          vice_leader_id: team.vice_leader_id ?? null,
        }}
        isAdmin={isAdmin}
        isLeader={isLeader}
        teamMembers={teamMembers}
      />
    </main>
  )
}
