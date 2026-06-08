'use client'

import { useRouter } from 'next/navigation'

interface TeamCardProps {
  team: {
    id: string
    name: string
    current_song: string | null
    description: string | null
    is_recruiting: boolean
    leader: { id: string; name: string; nickname: string | null } | null
    member_count: number
    session_summary: Record<string, number>
  }
}

export function TeamCard({ team }: TeamCardProps) {
  const router = useRouter()
  const leaderName = team.leader
    ? (team.leader.nickname ?? team.leader.name)
    : '미정'

  const sessionText = Object.entries(team.session_summary)
    .map(([s, n]) => `${s} ${n}`)
    .join(' · ')

  return (
    <div
      onClick={() => router.push(`/members/teams/${team.id}`)}
      style={{
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        background: '#fff',
        padding: '18px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{team.name}</div>
        <span style={{
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          fontWeight: 600,
          background: team.is_recruiting ? '#dcfce7' : '#f3f4f6',
          color:      team.is_recruiting ? '#15803d' : '#6b7280',
          border:     `1px solid ${team.is_recruiting ? '#bbf7d0' : '#e5e7eb'}`,
          whiteSpace: 'nowrap',
        }}>
          {team.is_recruiting ? '모집 중' : '모집 완료'}
        </span>
      </div>

      <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
        팀장: {leaderName} · {team.member_count}명
      </div>

      {sessionText && (
        <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>{sessionText}</div>
      )}

      {team.current_song && (
        <div style={{
          fontSize: '0.82rem',
          background: '#f0f9ff',
          color: '#0369a1',
          padding: '4px 10px',
          borderRadius: '6px',
          display: 'inline-block',
          width: 'fit-content',
        }}>
          ♪ {team.current_song}
        </div>
      )}

      {team.description && (
        <div style={{
          fontSize: '0.8rem', color: '#6b7280',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {team.description}
        </div>
      )}
    </div>
  )
}
