'use client'

import { useState, useEffect } from 'react'

interface Slot {
  id: string
  slot_at: string
  capacity: number
  interview_preferences: { count: number }[]
}

function formatSlot(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    weekday: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminInterviewSlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [newSlots, setNewSlots] = useState<string[]>([''])
  const [capacity, setCapacity] = useState(5)
  const [saving, setSaving] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchSlots = () => {
    fetch('/api/admin/interview-slots')
      .then(r => r.json())
      .then(d => setSlots(Array.isArray(d) ? d : []))
  }

  useEffect(() => { fetchSlots() }, [])

  const addSlotInput = () => setNewSlots(prev => [...prev, ''])
  const removeSlotInput = (i: number) => setNewSlots(prev => prev.filter((_, idx) => idx !== i))
  const updateSlotInput = (i: number, value: string) =>
    setNewSlots(prev => prev.map((v, idx) => (idx === i ? value : v)))

  const handleCreate = async () => {
    const validSlots = newSlots.filter(Boolean)
    if (validSlots.length === 0) {
      setMessage({ type: 'error', text: '슬롯 날짜/시간을 입력해주세요.' })
      return
    }

    setSaving(true)
    setMessage(null)

    const res = await fetch('/api/admin/interview-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slots: validSlots.map(s => ({ slot_at: new Date(s).toISOString(), capacity })),
      }),
    })

    setSaving(false)

    if (res.ok) {
      setMessage({ type: 'success', text: `${validSlots.length}개 슬롯이 생성되었습니다.` })
      setNewSlots([''])
      fetchSlots()
    } else {
      const d = await res.json()
      setMessage({ type: 'error', text: d.error ?? '생성 실패' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('이 슬롯을 삭제하시겠습니까?')) return
    setDeleteLoading(id)

    const res = await fetch(`/api/admin/interview-slots/${id}`, { method: 'DELETE' })
    setDeleteLoading(null)

    if (res.ok) {
      fetchSlots()
    } else {
      const d = await res.json()
      alert(d.error ?? '삭제 실패')
    }
  }

  return (
    <div>
      <h1 style={pageTitleStyle}>면접 슬롯 관리</h1>

      {/* ── 슬롯 생성 ── */}
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>슬롯 추가</h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>슬롯당 최대 인원</label>
          <input
            type="number"
            value={capacity}
            onChange={e => setCapacity(Number(e.target.value))}
            min={1}
            style={{ ...inputStyle, width: '100px' }}
          />
        </div>

        <label style={labelStyle}>면접 일시 (복수 추가 가능)</label>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px', marginBottom: '12px' }}>
          {newSlots.map((val, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="datetime-local"
                value={val}
                onChange={e => updateSlotInput(i, e.target.value)}
                style={inputStyle}
              />
              {newSlots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlotInput(i)}
                  style={ghostBtnStyle}
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={addSlotInput} style={{ ...ghostBtnStyle, marginBottom: '16px' }}>
          + 슬롯 추가
        </button>

        {message && (
          <p style={{
            fontSize: '13px', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fff5f5',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}>
            {message.text}
          </p>
        )}

        <button
          onClick={handleCreate}
          disabled={saving}
          style={{ ...primaryBtnStyle, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? '생성 중...' : '슬롯 생성'}
        </button>
      </div>

      {/* ── 슬롯 목록 ── */}
      <div style={{ marginTop: '28px' }}>
        <h2 style={sectionTitleStyle}>생성된 슬롯 ({slots.length}개)</h2>

        {slots.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9ca3af' }}>생성된 슬롯이 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
            {slots.map(slot => {
              const prefCount = slot.interview_preferences?.[0]?.count ?? 0
              return (
                <div key={slot.id} style={slotRowStyle}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>
                      {formatSlot(slot.slot_at)}
                    </p>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
                      최대 {slot.capacity}명 · 희망자 {prefCount}명
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    disabled={deleteLoading === slot.id || prefCount > 0}
                    title={prefCount > 0 ? '희망자가 있어 삭제 불가' : '삭제'}
                    style={{
                      padding: '6px 14px', borderRadius: '6px', fontSize: '13px',
                      border: '1px solid #e5e7eb',
                      background: (prefCount > 0 || deleteLoading === slot.id) ? '#f9fafb' : '#fff',
                      color: prefCount > 0 ? '#d1d5db' : '#dc2626',
                      cursor: (prefCount > 0 || deleteLoading === slot.id) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {deleteLoading === slot.id ? '...' : '삭제'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const pageTitleStyle: React.CSSProperties = {
  fontSize: '22px', fontWeight: 700, marginBottom: '24px', color: '#111827',
}
const cardStyle: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', padding: '28px 32px',
  maxWidth: '600px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
}
const sectionTitleStyle: React.CSSProperties = {
  fontSize: '15px', fontWeight: 600, marginBottom: '18px', color: '#111827',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px',
}
const inputStyle: React.CSSProperties = {
  padding: '8px 12px', fontSize: '14px', border: '1px solid #e5e7eb',
  borderRadius: '7px', color: '#111827', outline: 'none', boxSizing: 'border-box' as const,
}
const primaryBtnStyle: React.CSSProperties = {
  padding: '10px 24px', fontSize: '14px', fontWeight: 600,
  backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
}
const ghostBtnStyle: React.CSSProperties = {
  padding: '7px 14px', fontSize: '13px', border: '1px solid #e5e7eb',
  borderRadius: '7px', backgroundColor: '#fff', color: '#374151', cursor: 'pointer',
}
const slotRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 18px', background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: '10px',
}
