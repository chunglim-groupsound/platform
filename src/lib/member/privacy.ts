import type { MemberCardData } from '@/types/app'

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
  raw: Record<string, unknown>,
  isSelf: boolean,
  isMember: boolean,
  isAdmin: boolean
): MemberCardData {
  const privacy = (raw.privacy_settings ?? {}) as Record<string, string>
  return {
    id:                raw.id as string,
    name: canView(privacy.name, 'member', isSelf, isMember, isAdmin)
      ? (raw.name as string) : null,
    nickname:          raw.nickname as string | null,
    profile_image_url: raw.profile_image_url as string | null,
    status:            raw.status as MemberCardData['status'],
    role:              raw.role as MemberCardData['role'],
    is_whitelist:      raw.is_whitelist as boolean,
    session:           (raw.session as string[] | null) ?? [],
    generation: canView(privacy.generation, 'member', isSelf, isMember, isAdmin)
      ? (raw.generation as number | null) : null,
    phone: canView(privacy.phone, 'admin', isSelf, isMember, isAdmin)
      ? (raw.phone as string | null) : null,
    department: canView(privacy.department, 'member', isSelf, isMember, isAdmin)
      ? (raw.department as string | null) : null,
    school_year: canView(privacy.school_year, 'member', isSelf, isMember, isAdmin)
      ? (raw.school_year as number | null) : null,
    isLeader: (raw.isLeader as boolean | undefined) ?? false,
  }
}
