'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  targetId: string
  myTeams: { id: string; name: string }[]
}

export function InviteButton({ targetId, myTeams }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState(myTeams[0]?.id ?? '')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function send() {
    if (!selectedTeamId) return
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`/api/teams/${selectedTeamId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteeId: targetId, message: message.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다'); return }
      setSent(true)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <p style={{ fontSize: '0.88rem', color: '#16a34a' }}>초대를 보냈습니다.</p>
  )

  return (
    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '16px' }}>
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '7px 16px', borderRadius: '8px', fontSize: '0.85rem',
            fontWeight: 600, border: '1px solid #6366f1', background: '#f5f3ff',
            color: '#4f46e5', cursor: 'pointer',
          }}
        >
          이 팀으로 초대하기
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>팀 초대 보내기</p>

          {myTeams.length > 1 && (
            <select
              value={selectedTeamId}
              onChange={e => setSelectedTeamId(e.target.value)}
              style={{
                padding: '7px 10px', borderRadius: '7px', border: '1px solid #d1d5db',
                fontSize: '0.88rem', background: '#fff',
              }}
            >
              {myTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          {myTeams.length === 1 && (
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>팀: {myTeams[0].name}</p>
          )}

          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="초대 메시지 (선택)"
            rows={2}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: '7px',
              border: '1px solid #d1d5db', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box',
            }}
          />

          {error && <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: '8px' }}>
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
              onClick={send}
              disabled={loading}
              style={{
                padding: '6px 14px', borderRadius: '7px', fontSize: '0.83rem',
                fontWeight: 600, border: 'none', background: '#6366f1', color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '보내는 중...' : '초대 보내기'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
