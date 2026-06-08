'use client'

import { useRouter } from 'next/navigation'
import { MemberCard } from './MemberCard'
import type { MemberCardData } from '@/types/app'

interface TeamMemberEntry {
  id: string
  session_in_team: string[]
  user: MemberCardData
  isLeader?: boolean
}

interface TeamMemberListProps {
  members: TeamMemberEntry[]
  myId: string
}

export function TeamMemberList({ members, myId }: TeamMemberListProps) {
  const router = useRouter()

  if (members.length === 0) {
    return <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>팀원이 없습니다.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {members.map(entry => (
        <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <MemberCard
              member={{
                ...entry.user,
                session: entry.session_in_team.length > 0 ? entry.session_in_team : entry.user.session,
              }}
              isMe={entry.user.id === myId}
              onClick={(id) => {
                if (id === myId) router.push('/members/me')
                else router.push(`/members/${id}`)
              }}
              variant="compact"
            />
          </div>
          {entry.isLeader && (
            <span style={{
              flexShrink: 0,
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fcd34d',
              whiteSpace: 'nowrap',
            }}>
              팀장
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
