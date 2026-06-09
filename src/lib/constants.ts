export const STATUS_LABELS: Record<string, string> = {
  PENDING:      '신청 대기',
  INTERVIEWING: '면접 중',
  PROBATION:    '유예',
  ACTIVE:       '정식',
  INACTIVE:     '휴면',
  WITHDRAWN:    '탈퇴',
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:      '개발 담당',
  ADMIN:            '운영진',
  TEAM_LEADER:      '팀장',
  MEMBER:           '정식 부원',
  PROBATION_MEMBER: '유예 부원',
}

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
