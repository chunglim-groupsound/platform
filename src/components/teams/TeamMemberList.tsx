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
    return <p className="text-gray-400 text-[0.9rem]">팀원이 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {visible.map(entry => (
        <div key={entry.id} className="flex items-center gap-2">
          <div className="flex-1">
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
            <span className="shrink-0 py-0.5 px-2 rounded-full text-[0.72rem] font-bold whitespace-nowrap bg-amber-100 text-amber-800 border border-yellow-300">
              팀장
            </span>
          )}
          {!entry.isLeader && entry.isViceLeader && (
            <span className="shrink-0 py-0.5 px-2 rounded-full text-[0.72rem] font-bold whitespace-nowrap bg-sky-50 text-sky-700 border border-sky-200">
              부팀장
            </span>
          )}

          {canEdit && teamId && !entry.isLeader && (
            confirming === entry.user.id ? (
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => kickMember(entry.user.id)}
                  disabled={kicking === entry.user.id}
                  className={`py-[3px] px-[9px] rounded-md text-[0.72rem] font-bold border-none bg-red-600 text-white whitespace-nowrap ${kicking ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                >
                  {kicking === entry.user.id ? '…' : '확인'}
                </button>
                <button
                  onClick={() => setConfirming(null)}
                  className="py-[3px] px-[9px] rounded-md text-[0.72rem] border border-gray-300 bg-white text-gray-700 cursor-pointer whitespace-nowrap"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(entry.user.id)}
                className="shrink-0 py-[3px] px-[9px] rounded-md text-[0.72rem] border border-red-300 bg-white text-red-600 cursor-pointer whitespace-nowrap"
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
