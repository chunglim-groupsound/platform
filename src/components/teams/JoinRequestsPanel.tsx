'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MemberCardData } from '@/types/app'

interface JoinRequestEntry {
  id: string
  message: string | null
  status: string
  created_at: string
  applicant: MemberCardData
}

interface Props {
  teamId: string
  requests: JoinRequestEntry[]
}

export function JoinRequestsPanel({ teamId, requests: initial }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function respond(requestId: string, status: 'ACCEPTED' | 'REJECTED') {
    setLoading(requestId)
    try {
      await fetch(`/api/teams/${teamId}/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-7">
      <h2 className="text-base font-bold mb-3">
        가입 신청 ({initial.length}건)
      </h2>
      <div className="flex flex-col gap-2.5">
        {initial.map(req => (
          <div key={req.id} className="py-3 px-3.5 rounded-[10px] border border-gray-200 bg-white flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span
                onClick={() => router.push(`/members/${req.applicant.id}`)}
                className="font-semibold text-[0.9rem] cursor-pointer underline decoration-gray-300"
              >
                {req.applicant.nickname ?? req.applicant.name}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => respond(req.id, 'ACCEPTED')}
                  disabled={loading === req.id}
                  className={`py-1 px-3 rounded-[7px] text-[0.8rem] border-none bg-green-600 text-white cursor-pointer ${loading === req.id ? 'opacity-60' : ''}`}
                >
                  수락
                </button>
                <button
                  onClick={() => respond(req.id, 'REJECTED')}
                  disabled={loading === req.id}
                  className={`py-1 px-3 rounded-[7px] text-[0.8rem] border border-red-300 bg-white text-red-600 cursor-pointer ${loading === req.id ? 'opacity-60' : ''}`}
                >
                  거절
                </button>
              </div>
            </div>
            {req.message && (
              <p className="text-[0.83rem] text-gray-500 m-0">{req.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
