export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'] as const
export const ACTIVE_STATUSES = ['ACTIVE', 'INACTIVE', 'PROBATION'] as const
export const TEAM_CREATABLE_STATUSES = ['ACTIVE', 'INACTIVE'] as const
export const INTERVIEWING_ALLOWED_PATHS = ['/notices', '/home', '/timetable', '/status', '/auth'] as const

export function isAdminRole(role: string | null | undefined): boolean {
  return ADMIN_ROLES.includes(role as typeof ADMIN_ROLES[number])
}

export function hasActiveMemberAccess(status: string | null | undefined): boolean {
  return ACTIVE_STATUSES.includes(status as typeof ACTIVE_STATUSES[number])
}

export function canCreateTeam(status: string | null | undefined): boolean {
  return TEAM_CREATABLE_STATUSES.includes(status as typeof TEAM_CREATABLE_STATUSES[number])
}
