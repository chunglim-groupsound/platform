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
    <div style={{
      marginTop: '16px',
      padding: '14px 16px',
      borderRadius: '12px',
      border: `1px solid ${activationRequested ? '#fcd34d' : '#e5e7eb'}`,
      background: activationRequested ? '#fffbeb' : '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          fontSize: '0.78rem', fontWeight: 700,
          padding: '2px 8px', borderRadius: '9999px',
          background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d',
        }}>
          비활성
        </span>
        <span style={{ fontSize: '0.88rem', color: '#374151' }}>
          {activationRequested
            ? '활성화 신청이 접수되었습니다. 관리자 승인을 기다려주세요.'
            : '이 팀은 아직 활성화되지 않았습니다.'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {isAdmin && activationRequested && (
          <button
            onClick={approveActivation}
            disabled={loading}
            style={{
              padding: '7px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700,
              border: 'none', background: '#16a34a', color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '처리 중...' : '활성화 승인'}
          </button>
        )}

        {canRequest && !activationRequested && (
          <button
            onClick={requestActivation}
            disabled={loading}
            style={{
              padding: '7px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
              border: '1px solid #6366f1', background: '#fff', color: '#6366f1',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '신청 중...' : '팀 활성화 신청'}
          </button>
        )}

        {canRequest && activationRequested && (
          <button
            onClick={cancelRequest}
            disabled={loading}
            style={{
              padding: '7px 16px', borderRadius: '8px', fontSize: '0.85rem',
              border: '1px solid #d1d5db', background: '#fff', color: '#6b7280',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            신청 취소
          </button>
        )}
      </div>
    </div>
  )
}
