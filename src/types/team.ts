import type { Database } from './database'
import type { MemberCardData, RequestStatus } from './app'

type TeamsRow       = Database['public']['Tables']['teams']['Row']
type UsersRow       = Database['public']['Tables']['users']['Row']
type TeamMembersRow = Database['public']['Tables']['team_members']['Row']
type JoinReqRow     = Database['public']['Tables']['team_join_requests']['Row']

// --- 팀 목록 조회용 (teams/page.tsx, api/teams/route.ts) ---

export type TeamListLeader = Pick<UsersRow, 'id' | 'name' | 'nickname' | 'session'>

export type TeamListMemberEntry = Pick<TeamMembersRow, 'id' | 'user_id' | 'session_in_team'>

export type TeamListItem = Pick<
  TeamsRow,
  'id' | 'name' | 'current_song' | 'description' | 'is_active' | 'is_recruiting' | 'leader_id'
> & {
  leader: TeamListLeader | null
  team_members: TeamListMemberEntry[]
}

export type TeamCardData = {
  id: string
  name: string
  current_song: string | null
  description: string | null
  is_active: boolean
  is_recruiting: boolean
  leader: { id: string; name: string; nickname: string | null } | null
  member_count: number
  session_summary: Record<string, number>
}

// --- 팀 상세 조회용 (teams/[id]/page.tsx) ---

export type TeamDetailLeaderRow = MemberCardData & {
  privacy_settings: Record<string, string>
}

export interface TeamDetailMemberRow {
  id: string
  session_in_team: TeamMembersRow['session_in_team']
  user: MemberCardData
}

export type TeamDetailJoinRequestRow = Pick<JoinReqRow, 'id' | 'message' | 'created_at'> & {
  status: RequestStatus
  applicant: MemberCardData
}

export type TeamDetailRow = Pick<
  TeamsRow,
  | 'id' | 'name' | 'current_song' | 'description'
  | 'is_active' | 'is_recruiting' | 'leader_id'
  | 'vice_leader_id' | 'activation_requested'
> & {
  leader: TeamDetailLeaderRow | null
  team_members: TeamDetailMemberRow[]
}
