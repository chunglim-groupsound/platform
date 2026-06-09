import type { Database } from '@/types/database'
import type { MemberCardData } from '@/types/app'

type UsersRow = Database['public']['Tables']['users']['Row']

export type RawMemberRow = Pick<
  UsersRow,
  | 'id' | 'name' | 'nickname' | 'profile_image_url'
  | 'status' | 'role' | 'is_whitelist' | 'session'
  | 'generation' | 'phone' | 'department' | 'school_year'
  | 'privacy_settings'
> & { is_leader?: boolean }

type PrivacyScope = 'all' | 'member' | 'admin'

export function canView(
  scope: string | undefined,
  fallback: PrivacyScope,
  isSelf: boolean,
  isMember: boolean,
  isAdmin: boolean
): boolean {
  if (isSelf || isAdmin) return true
  const s = (scope ?? fallback) as PrivacyScope
  if (s === 'all') return true
  if (s === 'member') return isMember
  return false
}

export function maskMember(
  raw: RawMemberRow,
  isSelf: boolean,
  isMember: boolean,
  isAdmin: boolean
): MemberCardData {
  const privacy = (raw.privacy_settings as Record<string, string> | null) ?? {}
  return {
    id:                raw.id,
    name: canView(privacy.name, 'member', isSelf, isMember, isAdmin)
      ? raw.name : null,
    nickname:          raw.nickname,
    profile_image_url: raw.profile_image_url,
    status:            raw.status,
    role:              raw.role,
    is_whitelist:      raw.is_whitelist,
    session:           raw.session ?? [],
    generation: canView(privacy.generation, 'member', isSelf, isMember, isAdmin)
      ? raw.generation : null,
    phone: canView(privacy.phone, 'admin', isSelf, isMember, isAdmin)
      ? raw.phone : null,
    department: canView(privacy.department, 'member', isSelf, isMember, isAdmin)
      ? raw.department : null,
    school_year: canView(privacy.school_year, 'member', isSelf, isMember, isAdmin)
      ? raw.school_year : null,
    is_leader: raw.is_leader ?? false,
  }
}
