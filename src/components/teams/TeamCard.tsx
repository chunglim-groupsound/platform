'use client'

import { useRouter } from 'next/navigation'

interface TeamCardProps {
  team: {
    id: string
    name: string
    current_song: string | null
    description: string | null
    is_active?: boolean
    is_recruiting: boolean
    leader: { id: string; name: string; nickname: string | null } | null
    member_count: number
    session_summary: Record<string, number>
  }
  baseUrl?: string
}

export function TeamCard({ team, baseUrl = '/teams' }: TeamCardProps) {
  const router = useRouter()
  const leaderName = team.leader
    ? (team.leader.nickname ?? team.leader.name)
    : '미정'

  const sessionText = Object.entries(team.session_summary)
    .map(([s, n]) => `${s} ${n}`)
    .join(' · ')

  return (
    <div
      onClick={() => router.push(`${baseUrl}/${team.id}`)}
      className="rounded-xl border border-gray-200 bg-white p-[18px] cursor-pointer flex flex-col gap-2 transition-shadow duration-150"
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div className="flex justify-between items-center gap-2">
        <div className="font-bold text-base min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{team.name}</div>
        <div className="flex gap-1 shrink-0 items-center">
          {team.is_active === false && (
            <span className="py-0.5 px-2 rounded-full text-[0.72rem] font-semibold bg-amber-100 text-amber-800 border border-yellow-300 whitespace-nowrap">
              비활성
            </span>
          )}
          <span className={`py-0.5 px-2 rounded-full text-[0.72rem] font-semibold whitespace-nowrap border ${
            team.is_recruiting
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            {team.is_recruiting ? '모집 중' : '모집 완료'}
          </span>
        </div>
      </div>

      <div className="text-[0.82rem] text-gray-500">
        팀장: {leaderName} · {team.member_count}명
      </div>

      {sessionText && (
        <div className="text-[0.8rem] text-gray-600">{sessionText}</div>
      )}

      {team.current_song && (
        <div className="text-[0.82rem] bg-sky-50 text-sky-700 py-1 px-2.5 rounded-md inline-block w-fit">
          ♪ {team.current_song}
        </div>
      )}

      {team.description && (
        <div className="text-[0.8rem] text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
          {team.description}
        </div>
      )}
    </div>
  )
}
