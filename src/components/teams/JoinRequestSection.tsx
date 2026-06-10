'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  teamId: string
  myRequest: { id: string; status: string } | null
}

export function JoinRequestSection({ teamId, myRequest }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const isPending   = myRequest?.status === 'PENDING'
  const isAccepted  = myRequest?.status === 'ACCEPTED'
  const isRejected  = myRequest?.status === 'REJECTED'

  async function submit() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/join-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다'); return }
      router.refresh()
      setShowForm(false)
    } finally {
      setLoading(false)
    }
  }

  async function cancel() {
    if (!myRequest) return
    setLoading(true)
    try {
      await fetch(`/api/teams/${teamId}/join-requests/${myRequest.id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (isAccepted) return null

  return (
    <div className="mt-4 py-3.5 px-4 rounded-xl border border-gray-200 bg-white">
      {isPending ? (
        <div className="flex justify-between items-center">
          <span className="text-[0.88rem] text-gray-500">가입 신청 중...</span>
          <button
            onClick={cancel}
            disabled={loading}
            className="py-1 px-3 rounded-[7px] text-[0.82rem] border border-red-300 bg-white text-red-600 cursor-pointer"
          >
            신청 취소
          </button>
        </div>
      ) : isRejected ? (
        <div className="flex justify-between items-center">
          <span className="text-[0.88rem] text-gray-400">가입 신청이 거절되었습니다.</span>
          <button
            onClick={cancel}
            disabled={loading}
            className="py-1 px-3 rounded-[7px] text-[0.82rem] border border-indigo-500 bg-violet-50 text-indigo-600 cursor-pointer"
          >
            다시 신청하기
          </button>
        </div>
      ) : showForm ? (
        <div className="flex flex-col gap-2.5">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="가입 신청 메시지 (선택)"
            rows={3}
            className="w-full rounded-lg border border-gray-300 py-2 px-2.5 text-[0.88rem] resize-y box-border"
          />
          {error && <p className="text-red-600 text-[0.82rem] m-0">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="py-1.5 px-3.5 rounded-[7px] text-[0.83rem] border border-gray-300 bg-white text-gray-700 cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={loading}
              className={`py-1.5 px-3.5 rounded-[7px] text-[0.83rem] border-none bg-indigo-500 text-white cursor-pointer ${loading ? 'opacity-60' : ''}`}
            >
              신청하기
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2 rounded-lg text-[0.88rem] font-semibold border border-indigo-500 bg-violet-50 text-indigo-600 cursor-pointer"
        >
          이 팀에 가입 신청하기
        </button>
      )}
    </div>
  )
}
