import type { Database } from './database'

export type MemberStatus = Database['public']['Enums']['member_status']
export type MemberRole   = Database['public']['Enums']['member_role']

export interface Team {
  id: string
  name: string
  leader_id: string | null
  current_song: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  session_in_team: string[]
  joined_at: string
}

export interface MemberCardData {
  id: string
  name: string
  nickname: string | null
  profile_image_url: string | null
  status: MemberStatus
  role: MemberRole
  generation: number | null
  session: string[]
  is_whitelist: boolean
  phone: string | null
  department: string | null
  school_year: number | null
}
