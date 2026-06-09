'use client'

import { useState } from 'react'

const SESSION_OPTIONS = ['보컬', '기타', '베이스', '드럼', '건반', '기타(악기)']

interface SessionYearsEditorProps {
  memberId: string
  initialSessionYears: Record<string, number> | null
  memberSession: string[] | null
}

export function SessionYearsEditor({ memberId, initialSessionYears, memberSession }: SessionYearsEditorProps) {
  const sessions = memberSession ?? []
  const toStrMap = (sy: Record<string, number> | null): Record<string, string> => {
    const m: Record<string, string> = {}
    for (const s of sessions) m[s] = sy?.[s]?.toString() ?? ''
    return m
  }

  const [values, setValues] = useState<Record<string, string>>(() => toStrMap(initialSessionYears))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  if (sessions.length === 0) {
    return <p style={{ fontSize: '13px', color: '#9ca3af' }}>등록된 세션이 없습니다.</p>
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    const payload: Record<string, number> = {}
    for (const [k, v] of Object.entries(values)) {
      if (v !== '') payload[k] = Number(v)
    }
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_years: Object.keys(payload).length > 0 ? payload : null }),
      })
      if (res.ok) {
        setMsg({ text: '저장되었습니다', ok: true })
      } else {
        const data = await res.json()
        setMsg({ text: data.error ?? '저장 실패', ok: false })
      }
    } catch {
      setMsg({ text: '네트워크 오류', ok: false })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {sessions.map(s => (
          <label key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
            <span style={{ minWidth: '60px' }}>{s}</span>
            <input
              type="number"
              min={0}
              max={99}
              placeholder="0"
              value={values[s] ?? ''}
              onChange={e => setValues(v => ({ ...v, [s]: e.target.value }))}
              style={{
                width: '56px', padding: '4px 8px', fontSize: '13px',
                border: '1px solid #d1d5db', borderRadius: '6px', textAlign: 'center',
              }}
            />
            <span>년</span>
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            background: saving ? '#e5e7eb' : '#1d4ed8', color: saving ? '#9ca3af' : '#fff',
          }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        {msg && (
          <span style={{ fontSize: '12px', color: msg.ok ? '#166534' : '#991b1b' }}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  )
}
