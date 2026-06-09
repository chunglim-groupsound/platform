import type { TeamListItem, TeamCardData } from '@/types/team'

interface LeaderLike {
  id: string
  session?: string[] | null
}

interface MemberLike {
  user_id: string
  session_in_team?: string[] | null
}

export function calcSessionSummary(
  leader: LeaderLike | null,
  members: MemberLike[]
): Record<string, number> {
  const memberIds = new Set(members.map(m => m.user_id))
  const counts: Record<string, number> = {}

  if (leader && !memberIds.has(leader.id)) {
    for (const s of leader.session ?? []) {
      counts[s] = (counts[s] ?? 0) + 1
    }
  }

  for (const m of members) {
    for (const s of m.session_in_team ?? []) {
      counts[s] = (counts[s] ?? 0) + 1
    }
  }

  return counts
}

export function calcMemberCount(
  leader: LeaderLike | null,
  members: MemberLike[]
): number {
  const memberIds = new Set(members.map(m => m.user_id))
  return members.length + (leader && !memberIds.has(leader.id) ? 1 : 0)
}

export function filterMyTeams(
  teams: TeamListItem[],
  meIds: (string | undefined | null)[]
): TeamListItem[] {
  const idSet = new Set(meIds.filter(Boolean) as string[])
  return teams.filter(t =>
    idSet.has(t.leader_id ?? '') ||
    t.team_members.some(m => idSet.has(m.user_id))
  )
}

export function toTeamCardData(team: TeamListItem): TeamCardData {
  const members = team.team_members ?? []
  const leader  = team.leader
  return {
    id:              team.id,
    name:            team.name,
    current_song:    team.current_song,
    description:     team.description,
    is_active:       team.is_active,
    is_recruiting:   team.is_recruiting,
    leader,
    member_count:    calcMemberCount(leader, members),
    session_summary: calcSessionSummary(leader, members),
  }
}
