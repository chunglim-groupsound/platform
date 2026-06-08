'use client'

import { useState } from 'react'

interface Props {
  memberId: string
  memberName: string
  currentStatus: string
}

export function WithdrawSection({ memberId, memberName, currentStatus }: Props) {
  const [reason, setReason]       = useState('')
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState<string | null>(null)

  if (currentStatus === 'WITHDRAWN' || done) {
    return (
      <section style={sectionStyle}>
        <h2 style={titleStyle}>탈퇴 처리</h2>
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>이미 탈퇴 처리된 계정입니다.</p>
      </section>
    )
  }

  const handleWithdraw = async () => {
    if (!reason.trim()) { setError('탈퇴 사유를 입력해주세요.'); return }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/members/transition', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: memberId, toStatus: 'WITHDRAWN', reason: reason.trim() }),
    })

    setLoading(false)
    if (res.ok) {
      setDone(true)
      setConfirming(false)
    } else {
      const data = await res.json()
      setError(data.error ?? '처리 실패')
    }
  }

  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>탈퇴 처리</h2>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          style={{
            padding: '8px 18px', fontSize: '13px', fontWeight: 600,
            background: '#fff', color: '#dc2626',
            border: '1.5px solid #fca5a5', borderRadius: '6px', cursor: 'pointer',
          }}
        >
          탈퇴 처리하기
        </button>
      ) : (
        <div style={{
          padding: '16px', border: '1.5px solid #fca5a5',
          borderRadius: '8px', backgroundColor: '#fff5f5',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#b91c1c', margin: 0 }}>
            {memberName}님을 탈퇴 처리합니다
          </p>
          <textarea
            value={reason}
            onChange={e => { setReason(e.target.value); setError(null) }}
            placeholder="탈퇴 사유를 입력하세요 (필수)"
            rows={2}
            style={{
              width: '100%', padding: '8px 10px', fontSize: '13px',
              border: '1px solid #fca5a5', borderRadius: '6px',
              resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const,
              lineHeight: 1.5, backgroundColor: '#fff',
            }}
          />
          {error && (
            <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleWithdraw}
              disabled={loading}
              style={{
                padding: '7px 18px', fontSize: '13px', fontWeight: 600,
                background: '#dc2626', color: '#fff', border: 'none',
                borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '처리 중...' : '탈퇴 확정'}
            </button>
            <button
              onClick={() => { setConfirming(false); setReason(''); setError(null) }}
              disabled={loading}
              style={{
                padding: '7px 18px', fontSize: '13px',
                background: '#fff', color: '#6b7280',
                border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer',
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '32px',
  paddingBottom: '32px',
  borderBottom: '1px solid #f0f0f0',
}
const titleStyle: React.CSSProperties = {
  fontSize: '15px', fontWeight: 500, color: '#333', marginBottom: '14px',
}
