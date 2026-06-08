'use client'

import { useState, useEffect } from 'react'

interface Slot {
  id: string
  slot_at: string
}

function formatSlotDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Props {
  onSubmitSuccess?: () => void
}

export default function InterviewSlotPicker({ onSubmitSuccess }: Props) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/interview-slots').then(r => r.json()),
      fetch('/api/interview-preferences').then(r => r.json()),
    ]).then(([slotsData, prefData]) => {
      setSlots(Array.isArray(slotsData) ? slotsData : [])
      setSelected(Array.isArray(prefData) ? prefData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const toggleSlot = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
    setMessage(null)
  }

  const handleSubmit = async () => {
    setSaving(true)
    setMessage(null)

    const res = await fetch('/api/interview-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotIds: selected }),
    })

    setSaving(false)

    if (res.ok) {
      setMessage({ type: 'success', text: '희망 슬롯이 저장되었습니다.' })
      onSubmitSuccess?.()
    } else {
      const d = await res.json()
      setMessage({ type: 'error', text: d.error ?? '저장 실패' })
    }
  }

  if (loading) {
    return <p style={{ fontSize: '14px', color: '#9ca3af' }}>면접 일정 불러오는 중...</p>
  }

  if (slots.length === 0) {
    return (
      <p style={{ fontSize: '14px', color: '#9ca3af', padding: '16px 0' }}>
        아직 면접 일정이 공개되지 않았습니다. 잠시 후 다시 확인해주세요.
      </p>
    )
  }

  return (
    <div>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
        희망하는 면접 일정을 복수 선택할 수 있습니다.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {slots.map(slot => {
          const isSelected = selected.includes(slot.id)
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => toggleSlot(slot.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                border: `1.5px solid ${isSelected ? '#4A90E2' : '#e5e7eb'}`,
                borderRadius: '8px',
                backgroundColor: isSelected ? '#eff6ff' : '#fff',
                cursor: 'pointer',
                textAlign: 'left' as const,
                fontSize: '14px',
                color: '#111827',
                transition: 'border-color 0.15s, background-color 0.15s',
              }}
            >
              <span style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: `2px solid ${isSelected ? '#4A90E2' : '#d1d5db'}`,
                backgroundColor: isSelected ? '#4A90E2' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {isSelected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              {formatSlotDate(slot.slot_at)}
            </button>
          )
        })}
      </div>

      {message && (
        <p style={{
          fontSize: '13px',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '12px',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fff5f5',
          color: message.type === 'success' ? '#166534' : '#991b1b',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {message.text}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving}
        style={{
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 600,
          backgroundColor: '#111827',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? '저장 중...' : `희망 슬롯 제출 (${selected.length}개 선택)`}
      </button>
    </div>
  )
}
