'use client'

import { useState, useEffect } from 'react'

interface RecruitmentPeriod {
  is_open: boolean
  open_at: string | null
  close_at: string | null
}

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 16) // "YYYY-MM-DDTHH:MM"
}

function toISOString(local: string): string {
  if (!local) return ''
  return new Date(local).toISOString()
}

export default function AdminSettingsPage() {
  const [current, setCurrent] = useState<RecruitmentPeriod | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [openAt, setOpenAt] = useState('')
  const [closeAt, setCloseAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings/recruitment')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((d: RecruitmentPeriod) => {
        setCurrent(d)
        setIsOpen(d.is_open)
        setOpenAt(toLocalDatetimeValue(d.open_at))
        setCloseAt(toLocalDatetimeValue(d.close_at))
      })
      .catch(() => {
        setMessage({ type: 'error', text: '설정을 불러오지 못했습니다.' })
      })
  }, [])

  const handleSave = async () => {
    if (!openAt || !closeAt) {
      setMessage({ type: 'error', text: '시작일과 종료일을 모두 입력해주세요.' })
      return
    }
    if (new Date(openAt) >= new Date(closeAt)) {
      setMessage({ type: 'error', text: '종료일은 시작일 이후여야 합니다.' })
      return
    }

    setLoading(true)
    setMessage(null)

    const res = await fetch('/api/admin/settings/recruitment', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_open: isOpen,
        open_at: toISOString(openAt),
        close_at: toISOString(closeAt),
      }),
    })

    setLoading(false)

    if (res.ok) {
      setMessage({ type: 'success', text: '저장되었습니다.' })
      setCurrent({ is_open: isOpen, open_at: toISOString(openAt), close_at: toISOString(closeAt) })
    } else {
      const d = await res.json()
      setMessage({ type: 'error', text: d.error ?? '저장 실패' })
    }
  }

  return (
    <div>
      <h1 style={styles.pageTitle}>설정</h1>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>모집 기간 관리</h2>

        {/* 현재 상태 배지 */}
        <div style={styles.statusRow}>
          <span style={styles.statusLabel}>현재 상태</span>
          <span style={{
            ...styles.badge,
            backgroundColor: current?.is_open ? '#d1fae5' : '#fee2e2',
            color: current?.is_open ? '#065f46' : '#991b1b',
          }}>
            {current === null ? '불러오는 중...' : current.is_open ? '모집 중' : '모집 마감'}
          </span>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>모집 활성화</label>
          <div style={styles.toggleRow}>
            <button
              type="button"
              onClick={() => setIsOpen(v => !v)}
              style={{
                ...styles.toggle,
                backgroundColor: isOpen ? '#4A90E2' : '#d1d5db',
              }}
            >
              <span style={{
                ...styles.toggleKnob,
                transform: isOpen ? 'translateX(20px)' : 'translateX(2px)',
              }} />
            </button>
            <span style={styles.toggleText}>{isOpen ? '모집 중' : '모집 마감'}</span>
          </div>
        </div>

        <div style={styles.fieldRow}>
          <div style={styles.field}>
            <label style={styles.label}>모집 시작일시</label>
            <input
              type="datetime-local"
              value={openAt}
              onChange={e => setOpenAt(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>모집 종료일시</label>
            <input
              type="datetime-local"
              value={closeAt}
              onChange={e => setCloseAt(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        {message && (
          <p style={{
            ...styles.message,
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fff5f5',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}>
            {message.text}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          style={{ ...styles.saveBtn, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  pageTitle: {
    fontSize: '22px',
    fontWeight: 700,
    marginBottom: '24px',
    color: '#111827',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '560px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '24px',
    color: '#111827',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid #f3f4f6',
  },
  statusLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  badge: {
    fontSize: '12px',
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: '12px',
  },
  field: {
    marginBottom: '20px',
    flex: 1,
  },
  fieldRow: {
    display: 'flex',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  toggle: {
    position: 'relative' as const,
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    padding: 0,
  },
  toggleKnob: {
    position: 'absolute' as const,
    top: '2px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    transition: 'transform 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  toggleText: {
    fontSize: '14px',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxSizing: 'border-box' as const,
    outline: 'none',
    color: '#111827',
    backgroundColor: '#fff',
  },
  message: {
    fontSize: '13px',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  saveBtn: {
    padding: '10px 28px',
    fontSize: '14px',
    fontWeight: 600,
    backgroundColor: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
}
