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
    <div style={{ marginTop: '28px' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
        가입 신청 ({initial.length}건)
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {initial.map(req => (
          <div key={req.id} style={{
            padding: '12px 14px', borderRadius: '10px',
            border: '1px solid #e5e7eb', background: '#fff',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {req.applicant.nickname ?? req.applicant.name}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => respond(req.id, 'ACCEPTED')}
                  disabled={loading === req.id}
                  style={{
                    padding: '4px 12px', borderRadius: '7px', fontSize: '0.8rem',
                    border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer',
                    opacity: loading === req.id ? 0.6 : 1,
                  }}
                >
                  수락
                </button>
                <button
                  onClick={() => respond(req.id, 'REJECTED')}
                  disabled={loading === req.id}
                  style={{
                    padding: '4px 12px', borderRadius: '7px', fontSize: '0.8rem',
                    border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer',
                    opacity: loading === req.id ? 0.6 : 1,
                  }}
                >
                  거절
                </button>
              </div>
            </div>
            {req.message && (
              <p style={{ fontSize: '0.83rem', color: '#6b7280', margin: 0 }}>{req.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
