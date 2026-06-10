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
      <h1 className="text-[22px] font-bold mb-6 text-gray-900">면접 슬롯 관리</h1>

      {/* ── 슬롯 생성 ── */}
      <div className="bg-white rounded-xl py-7 px-8 max-w-[600px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <h2 className="text-[15px] font-semibold mb-[18px] text-gray-900">슬롯 추가</h2>

        <div className="mb-4">
          <label className="block text-[13px] font-medium text-gray-700 mb-2">슬롯당 최대 인원</label>
          <input
            type="number"
            value={capacity}
            onChange={e => setCapacity(Number(e.target.value))}
            min={1}
            className="py-2 px-3 text-sm border border-gray-200 rounded-[7px] text-gray-900 outline-none w-[100px]"
            style={{ boxSizing: 'border-box' }}
          />
        </div>

        <label className="block text-[13px] font-medium text-gray-700 mb-2">면접 일시 (복수 추가 가능)</label>
        <div className="flex flex-col gap-2 mb-3">
          {newSlots.map((val, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="datetime-local"
                value={val}
                onChange={e => updateSlotInput(i, e.target.value)}
                className="py-2 px-3 text-sm border border-gray-200 rounded-[7px] text-gray-900 outline-none"
                style={{ boxSizing: 'border-box' }}
              />
              {newSlots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlotInput(i)}
                  className="py-[7px] px-3.5 text-[13px] border border-gray-200 rounded-[7px] bg-white text-gray-700 cursor-pointer"
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addSlotInput}
          className="py-[7px] px-3.5 text-[13px] border border-gray-200 rounded-[7px] bg-white text-gray-700 cursor-pointer mb-4"
        >
          + 슬롯 추가
        </button>

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
          onClick={handleCreate}
          disabled={saving}
          className="py-2.5 px-6 text-sm font-semibold bg-gray-900 text-white border-none rounded-lg cursor-pointer"
          style={{ opacity: saving ? 0.7 : 1 }}
        >
          {saving ? '생성 중...' : '슬롯 생성'}
        </button>
      </div>

      {/* ── 슬롯 목록 ── */}
      <div className="mt-7">
        <h2 className="text-[15px] font-semibold mb-[18px] text-gray-900">생성된 슬롯 ({slots.length}개)</h2>

        {slots.length === 0 ? (
          <p className="text-sm text-gray-400">생성된 슬롯이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {slots.map(slot => {
              const prefCount = slot.interview_preferences?.[0]?.count ?? 0
              return (
                <div
                  key={slot.id}
                  className="flex items-center justify-between py-3.5 px-[18px] bg-white border border-gray-200 rounded-[10px]"
                >
                  <div>
                    <p className="text-[15px] font-semibold text-gray-900 m-0">
                      {formatSlot(slot.slot_at)}
                    </p>
                    <p className="text-[13px] text-gray-500 mt-1 mb-0">
                      최대 {slot.capacity}명 · 희망자 {prefCount}명
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    disabled={deleteLoading === slot.id || prefCount > 0}
                    title={prefCount > 0 ? '희망자가 있어 삭제 불가' : '삭제'}
                    className="py-1.5 px-3.5 rounded-md text-[13px] border border-gray-200"
                    style={{
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
