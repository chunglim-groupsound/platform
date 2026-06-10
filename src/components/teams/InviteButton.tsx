'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  targetId: string
  myTeams: { id: string; name: string }[]
}

export function InviteButton({ targetId, myTeams }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState(myTeams[0]?.id ?? '')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function send() {
    if (!selectedTeamId) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/teams/${selectedTeamId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteeId: targetId, message: message.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다'); return }
      setSent(true)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <p className="text-[0.88rem] text-green-600">초대를 보냈습니다.</p>
  )

  return (
    <div className="border-t border-gray-100 pt-4">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="py-[7px] px-4 rounded-lg text-[0.85rem] font-semibold border border-indigo-500 bg-violet-50 text-indigo-600 cursor-pointer"
        >
          이 팀으로 초대하기
        </button>
      ) : (
        <div className="flex flex-col gap-2.5">
          <p className="text-[0.88rem] font-semibold m-0">팀 초대 보내기</p>

          {myTeams.length > 1 && (
            <select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              className="py-[7px] px-2.5 rounded-[7px] border border-gray-300 text-[0.88rem] bg-white"
            >
              {myTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          {myTeams.length === 1 && (
            <p className="text-[0.85rem] text-gray-500 m-0">팀: {myTeams[0].name}</p>
          )}

          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="초대 메시지 (선택)"
            rows={2}
            className="w-full py-2 px-2.5 rounded-[7px] border border-gray-300 text-[0.85rem] resize-y box-border"
          />

          {error && <p className="text-red-600 text-[0.82rem] m-0">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="py-1.5 px-3.5 rounded-[7px] text-[0.83rem] border border-gray-300 bg-white text-gray-700 cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={send}
              disabled={loading}
              className={`py-1.5 px-3.5 rounded-[7px] text-[0.83rem] font-semibold border-none bg-indigo-500 text-white ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
            >
              {loading ? '보내는 중...' : '초대 보내기'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
