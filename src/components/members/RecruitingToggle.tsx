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
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
      <span style={{ fontSize: '0.83rem', color: '#6b7280' }}>모집 상태</span>
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          padding: '4px 12px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600,
          border: '1px solid', cursor: loading ? 'not-allowed' : 'pointer',
          background: current ? '#dcfce7' : '#f3f4f6',
          color:      current ? '#15803d' : '#6b7280',
          borderColor: current ? '#bbf7d0' : '#e5e7eb',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {current ? '모집 중 → 완료로 변경' : '모집 완료 → 모집 중으로 변경'}
      </button>
    </div>
  )
}
