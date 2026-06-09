interface LeaderLike {
  id: string
  session?: string[] | null
}

interface MemberLike {
  user_id: string
  session_in_team?: string[] | null
}

/**
 * 팀의 세션별 인원 수를 집계합니다.
 * 리더가 team_members에 포함된 경우 중복 집계를 방지합니다.
 */
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

/**
 * 팀의 실제 인원 수를 반환합니다.
 * 리더가 team_members에 포함되지 않은 경우 1을 추가합니다.
 */
export function calcMemberCount(
  leader: LeaderLike | null,
  members: MemberLike[]
): number {
  const memberIds = new Set(members.map(m => m.user_id))
  return members.length + (leader && !memberIds.has(leader.id) ? 1 : 0)
}
