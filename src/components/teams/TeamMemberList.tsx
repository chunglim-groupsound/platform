'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MemberCard } from '@/components/members/MemberCard'
import type { MemberCardData } from '@/types/app'

interface TeamMemberEntry {
  id: string
  session_in_team: string[]
  user: MemberCardData
  isLeader?: boolean
  isViceLeader?: boolean
}

interface TeamMemberListProps {
  members: TeamMemberEntry[]
  myId: string
  canEdit?: boolean
  teamId?: string
}

export function TeamMemberList({ members, myId, canEdit, teamId }: TeamMemberListProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState<string | null>(null)
  const [kicking, setKicking]       = useState<string | null>(null)
  const [kicked, setKicked]         = useState<Set<string>>(new Set())

  async function kickMember(userId: string) {
    setKicking(userId)
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? '추방 중 오류가 발생했습니다')
        return
      }
      setKicked(prev => new Set([...prev, userId]))
      setConfirming(null)
      router.refresh()
    } finally {
      setKicking(null)
    }
  }

  const visible = members.filter(e => !kicked.has(e.user.id))

  if (visible.length === 0) {
    return <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>팀원이 없습니다.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {visible.map(entry => (
        <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <MemberCard
              member={{
                ...entry.user,
                session: entry.session_in_team.length > 0 ? entry.session_in_team : entry.user.session,
              }}
              isMe={entry.user.id === myId}
              onClick={(id: string) => {
                if (id === myId) router.push('/members/me')
                else router.push(`/members/${id}`)
              }}
              variant="compact"
            />
          </div>

          {entry.isLeader && (
            <span style={{
              flexShrink: 0, padding: '2px 8px', borderRadius: '9999px',
              fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
              background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d',
            }}>
              팀장
            </span>
          )}
          {!entry.isLeader && entry.isViceLeader && (
            <span style={{
              flexShrink: 0, padding: '2px 8px', borderRadius: '9999px',
              fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
              background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd',
            }}>
              부팀장
            </span>
          )}

          {canEdit && teamId && !entry.isLeader && (
            confirming === entry.user.id ? (
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button
                  onClick={() => kickMember(entry.user.id)}
                  disabled={kicking === entry.user.id}
                  style={{
                    padding: '3px 9px', borderRadius: '6px', fontSize: '0.72rem',
                    fontWeight: 700, border: 'none', background: '#dc2626', color: '#fff',
                    cursor: kicking ? 'not-allowed' : 'pointer', opacity: kicking ? 0.7 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {kicking === entry.user.id ? '…' : '확인'}
                </button>
                <button
                  onClick={() => setConfirming(null)}
                  style={{
                    padding: '3px 9px', borderRadius: '6px', fontSize: '0.72rem',
                    border: '1px solid #d1d5db', background: '#fff', color: '#374151',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(entry.user.id)}
                style={{
                  flexShrink: 0, padding: '3px 9px', borderRadius: '6px', fontSize: '0.72rem',
                  border: '1px solid #fca5a5', background: '#fff', color: '#dc2626',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                추방
              </button>
            )
          )}
        </div>
      ))}
    </div>
  )
}
