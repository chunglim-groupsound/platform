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
    <div style={{
      marginTop: '16px', padding: '14px 16px', borderRadius: '12px',
      border: '1px solid #e5e7eb', background: '#fff',
    }}>
      {isPending ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.88rem', color: '#6b7280' }}>가입 신청 중...</span>
          <button
            onClick={cancel}
            disabled={loading}
            style={{
              padding: '4px 12px', borderRadius: '7px', fontSize: '0.82rem',
              border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer',
            }}
          >
            신청 취소
          </button>
        </div>
      ) : isRejected ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.88rem', color: '#9ca3af' }}>가입 신청이 거절되었습니다.</span>
          <button
            onClick={cancel}
            disabled={loading}
            style={{
              padding: '4px 12px', borderRadius: '7px', fontSize: '0.82rem',
              border: '1px solid #6366f1', background: '#f5f3ff', color: '#4f46e5', cursor: 'pointer',
            }}
          >
            다시 신청하기
          </button>
        </div>
      ) : showForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="가입 신청 메시지 (선택)"
            rows={3}
            style={{
              width: '100%', borderRadius: '8px', border: '1px solid #d1d5db',
              padding: '8px 10px', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
          {error && <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowForm(false)}
              style={{
                padding: '6px 14px', borderRadius: '7px', fontSize: '0.83rem',
                border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={loading}
              style={{
                padding: '6px 14px', borderRadius: '7px', fontSize: '0.83rem',
                border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              신청하기
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            width: '100%', padding: '8px', borderRadius: '8px', fontSize: '0.88rem',
            fontWeight: 600, border: '1px solid #6366f1', background: '#f5f3ff',
            color: '#4f46e5', cursor: 'pointer',
          }}
        >
          이 팀에 가입 신청하기
        </button>
      )}
    </div>
  )
}
