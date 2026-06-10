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
    return <p className="text-sm text-gray-400">면접 일정 불러오는 중...</p>
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4">
        아직 면접 일정이 공개되지 않았습니다. 잠시 후 다시 확인해주세요.
      </p>
    )
  }

  return (
    <div>
      <p className="text-[13px] text-gray-500 mb-3">
        희망하는 면접 일정을 복수 선택할 수 있습니다.
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {slots.map(slot => {
          const isSelected = selected.includes(slot.id)
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => toggleSlot(slot.id)}
              className="flex items-center gap-2.5 py-3 px-4 rounded-lg cursor-pointer text-left text-sm text-gray-900 transition-[border-color,background-color] duration-150"
              style={{
                border: `1.5px solid ${isSelected ? '#4A90E2' : '#e5e7eb'}`,
                backgroundColor: isSelected ? '#eff6ff' : '#fff',
              }}
            >
              <span
                className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0"
                style={{
                  border: `2px solid ${isSelected ? '#4A90E2' : '#d1d5db'}`,
                  backgroundColor: isSelected ? '#4A90E2' : '#fff',
                }}
              >
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
        <p
          className="text-[13px] py-2.5 px-3.5 rounded-lg mb-3"
          style={{
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fff5f5',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {message.text}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="py-2.5 px-6 text-sm font-semibold bg-gray-900 text-white border-none rounded-lg"
        style={{
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? '저장 중...' : `희망 슬롯 제출 (${selected.length}개 선택)`}
      </button>
    </div>
  )
}
