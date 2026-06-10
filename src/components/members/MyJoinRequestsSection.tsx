'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface JoinRequest {
  id: string
  message: string | null
  status: string
  created_at: string
  team: { id: string; name: string } | null
}

interface Props {
  requests: JoinRequest[]
}

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  PENDING:  { text: '검토 중',    color: '#d97706' },
  REJECTED: { text: '거절됨',    color: '#dc2626' },
  ACCEPTED: { text: '수락됨',    color: '#16a34a' },
}

export function MyJoinRequestsSection({ requests }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function cancel(requestId: string, teamId: string) {
    setLoading(requestId)
    try {
      await fetch(`/api/teams/${teamId}/join-requests/${requestId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-7">
      <h2 className="text-base font-bold mb-3">
        내 가입 신청 ({requests.length}건)
      </h2>
      <div className="flex flex-col gap-2.5">
        {requests.map(req => {
          const statusInfo = STATUS_LABEL[req.status] ?? { text: req.status, color: '#6b7280' }
          return (
            <div
              key={req.id}
              className="py-3 px-3.5 rounded-[10px] border border-gray-200 bg-white flex justify-between items-center gap-2"
            >
              <div>
                {req.team && (
                  <Link
                    href={`/teams/${req.team.id}`}
                    className="font-semibold text-[0.9rem] text-indigo-600 no-underline"
                  >
                    {req.team.name}
                  </Link>
                )}
                <p className="text-[0.8rem] mt-0.5 mb-0 font-semibold" style={{ color: statusInfo.color }}>
                  {statusInfo.text}
                </p>
              </div>
              {req.status === 'PENDING' && req.team && (
                <button
                  onClick={() => cancel(req.id, req.team!.id)}
                  disabled={loading === req.id}
                  className="py-1 px-3 rounded-[7px] text-[0.8rem] border border-red-300 bg-white text-red-600 shrink-0"
                  style={{
                    cursor: loading === req.id ? 'not-allowed' : 'pointer',
                    opacity: loading === req.id ? 0.6 : 1,
                  }}
                >
                  취소
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
