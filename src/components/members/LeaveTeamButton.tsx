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
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>정말 나가시겠습니까?</span>
        <button
          onClick={leave}
          disabled={loading}
          style={{
            padding: '5px 12px', borderRadius: '7px', fontSize: '0.82rem', fontWeight: 700,
            border: 'none', background: '#dc2626', color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '처리 중...' : '나가기'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{
            padding: '5px 12px', borderRadius: '7px', fontSize: '0.82rem',
            border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer',
          }}
        >
          취소
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{
        padding: '5px 12px', borderRadius: '7px', fontSize: '0.82rem',
        border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer',
      }}
    >
      팀 나가기
    </button>
  )
}
