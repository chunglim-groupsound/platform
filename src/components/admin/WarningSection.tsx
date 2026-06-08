'use client'

import { useState, useEffect, useCallback } from 'react'

interface Warning {
  id: string
  reason: string
  created_at: string
  issuer: { name: string } | null
}

export function WarningSection({ memberId }: { memberId: string }) {
  const [warnings, setWarnings] = useState<Warning[]>([])
  const [loading, setLoading]   = useState(true)
  const [reason, setReason]     = useState('')
  const [saving, setSaving]     = useState(false)
  const [message, setMessage]   = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/members/${memberId}/warnings`)
      .then(r => r.json())
      .then(d => setWarnings(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [memberId])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!reason.trim()) return
    setSaving(true)
    setMessage(null)
    const res = await fetch(`/api/admin/members/${memberId}/warnings`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reason }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setMessage({ type: 'error', text: data.error ?? '저장 실패' })
      return
    }
    setReason('')
    if (data.withdrawn) {
      setMessage({ type: 'success', text: `경고 ${data.totalWarnings}회 누적 — 자동 제적 처리되었습니다.` })
    } else {
      setMessage({ type: 'success', text: `경고 추가 완료 (누적 ${data.totalWarnings}회)` })
    }
    load()
  }

  const warningCount = warnings.length

  return (
    <section style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <h2 style={titleStyle}>경고 이력</h2>
        <span style={{
          padding: '2px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700,
          backgroundColor: warningCount >= 3 ? '#fee2e2' : warningCount >= 2 ? '#fef9c3' : '#f3f4f6',
          color: warningCount >= 3 ? '#991b1b' : warningCount >= 2 ? '#854d0e' : '#6b7280',
        }}>
          {warningCount}회
        </span>
        {warningCount >= 3 && (
          <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>제적 기준 도달</span>
        )}
      </div>

      {/* 경고 목록 */}
      {loading ? (
        <p style={{ fontSize: '13px', color: '#aaa' }}>불러오는 중...</p>
      ) : warnings.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '16px' }}>경고 이력이 없습니다.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {warnings.map((w, i) => (
            <div key={w.id} style={warningItemStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>
                  경고 {warningCount - i}회차
                </span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {new Date(w.created_at).toLocaleDateString('ko-KR')}
                  {w.issuer?.name && ` · ${w.issuer.name}`}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>{w.reason}</p>
            </div>
          ))}
        </div>
      )}

      {/* 경고 추가 폼 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="경고 사유를 입력하세요"
          rows={2}
          style={textareaStyle}
        />
        {message && (
          <p style={{
            fontSize: '13px', padding: '8px 12px', borderRadius: '6px',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fff5f5',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            margin: 0,
          }}>
            {message.text}
          </p>
        )}
        <button
          onClick={handleAdd}
          disabled={saving || !reason.trim()}
          style={{
            padding: '8px 16px', fontSize: '13px', fontWeight: 600,
            backgroundColor: '#dc2626', color: '#fff', border: 'none',
            borderRadius: '6px', cursor: saving || !reason.trim() ? 'not-allowed' : 'pointer',
            opacity: saving || !reason.trim() ? 0.6 : 1,
            alignSelf: 'flex-start',
          }}
        >
          {saving ? '처리 중...' : '경고 추가'}
        </button>
      </div>
    </section>
  )
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '32px',
  paddingBottom: '32px',
  borderBottom: '1px solid #f0f0f0',
}
const titleStyle: React.CSSProperties = {
  fontSize: '15px', fontWeight: 500, color: '#333', margin: 0,
}
const warningItemStyle: React.CSSProperties = {
  padding: '12px 14px',
  backgroundColor: '#fff5f5',
  border: '1px solid #fecaca',
  borderRadius: '8px',
}
const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '13px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
  lineHeight: 1.6,
}
