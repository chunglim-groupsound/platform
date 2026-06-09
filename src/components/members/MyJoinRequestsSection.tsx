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
    <div style={{ marginTop: '28px' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
        내 가입 신청 ({requests.length}건)
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {requests.map(req => {
          const statusInfo = STATUS_LABEL[req.status] ?? { text: req.status, color: '#6b7280' }
          return (
            <div key={req.id} style={{
              padding: '12px 14px', borderRadius: '10px',
              border: '1px solid #e5e7eb', background: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',
            }}>
              <div>
                {req.team && (
                  <Link
                    href={`/teams/${req.team.id}`}
                    style={{ fontWeight: 600, fontSize: '0.9rem', color: '#4f46e5', textDecoration: 'none' }}
                  >
                    {req.team.name}
                  </Link>
                )}
                <p style={{ fontSize: '0.8rem', margin: '2px 0 0', color: statusInfo.color, fontWeight: 600 }}>
                  {statusInfo.text}
                </p>
              </div>
              {req.status === 'PENDING' && req.team && (
                <button
                  onClick={() => cancel(req.id, req.team!.id)}
                  disabled={loading === req.id}
                  style={{
                    padding: '4px 12px', borderRadius: '7px', fontSize: '0.8rem',
                    border: '1px solid #fca5a5', background: '#fff', color: '#dc2626',
                    cursor: loading === req.id ? 'not-allowed' : 'pointer',
                    opacity: loading === req.id ? 0.6 : 1, flexShrink: 0,
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
