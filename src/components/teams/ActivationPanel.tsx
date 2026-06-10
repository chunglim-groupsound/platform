'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ActivationPanelProps {
  teamId: string
  isActive: boolean
  activationRequested: boolean
  canRequest: boolean  // isLeader || isViceLeader
  isAdmin: boolean
}

export function ActivationPanel({
  teamId, isActive, activationRequested, canRequest, isAdmin,
}: ActivationPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (isActive) return null

  async function requestActivation() {
    setLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/activate`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { alert(data.error ?? '오류가 발생했습니다'); return }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function cancelRequest() {
    setLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/activate`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { alert(data.error ?? '오류가 발생했습니다'); return }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function approveActivation() {
    setLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { alert(data.error ?? '오류가 발생했습니다'); return }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`mt-4 py-3.5 px-4 rounded-xl flex flex-col gap-2.5 border ${
      activationRequested ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-[0.78rem] font-bold py-0.5 px-2 rounded-full bg-amber-100 text-amber-800 border border-yellow-300">
          비활성
        </span>
        <span className="text-[0.88rem] text-gray-700">
          {activationRequested
            ? '활성화 신청이 접수되었습니다. 관리자 승인을 기다려주세요.'
            : '이 팀은 아직 활성화되지 않았습니다.'}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {isAdmin && activationRequested && (
          <button
            onClick={approveActivation}
            disabled={loading}
            className={`py-[7px] px-4 rounded-lg text-[0.85rem] font-bold border-none bg-green-600 text-white ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
          >
            {loading ? '처리 중...' : '활성화 승인'}
          </button>
        )}

        {canRequest && !activationRequested && (
          <button
            onClick={requestActivation}
            disabled={loading}
            className={`py-[7px] px-4 rounded-lg text-[0.85rem] font-semibold border border-indigo-500 bg-white text-indigo-500 ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
          >
            {loading ? '신청 중...' : '팀 활성화 신청'}
          </button>
        )}

        {canRequest && activationRequested && (
          <button
            onClick={cancelRequest}
            disabled={loading}
            className={`py-[7px] px-4 rounded-lg text-[0.85rem] border border-gray-300 bg-white text-gray-500 ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
          >
            신청 취소
          </button>
        )}
      </div>
    </div>
  )
}
