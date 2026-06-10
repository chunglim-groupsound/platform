'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  teamId: string
  isRecruiting: boolean
}

export function RecruitingToggle({ teamId, isRecruiting }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(isRecruiting)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_recruiting: !current }),
      })
      if (res.ok) {
        setCurrent(prev => !prev)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2.5 mt-1">
      <span className="text-[0.83rem] text-gray-500">모집 상태</span>
      <button
        onClick={toggle}
        disabled={loading}
        className={`py-1 px-3 rounded-full text-[0.78rem] font-semibold border transition-opacity ${
          loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        } ${
          current
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-gray-100 text-gray-500 border-gray-200'
        }`}
      >
        {current ? '모집 중 → 완료로 변경' : '모집 완료 → 모집 중으로 변경'}
      </button>
    </div>
  )
}
