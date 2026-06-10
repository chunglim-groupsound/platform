'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LeaveTeamButtonProps {
  teamId: string
}

export function LeaveTeamButton({ teamId }: LeaveTeamButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading]       = useState(false)

  async function leave() {
    setLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/leave`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { alert(data.error ?? '오류가 발생했습니다'); return }
      router.push('/teams')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-2 items-center">
        <span className="text-[0.85rem] text-gray-500">정말 나가시겠습니까?</span>
        <button
          onClick={leave}
          disabled={loading}
          className={`py-[5px] px-3 rounded-[7px] text-[0.82rem] font-bold border-none bg-red-600 text-white ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
        >
          {loading ? '처리 중...' : '나가기'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="py-[5px] px-3 rounded-[7px] text-[0.82rem] border border-gray-300 bg-white text-gray-700 cursor-pointer"
        >
          취소
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="py-[5px] px-3 rounded-[7px] text-[0.82rem] border border-red-300 bg-white text-red-600 cursor-pointer"
    >
      팀 나가기
    </button>
  )
}
