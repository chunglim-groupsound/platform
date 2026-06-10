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
      <h1 className="text-[22px] font-bold mb-6 text-gray-900">설정</h1>

      <div className="bg-white rounded-xl p-8 max-w-[560px] shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <h2 className="text-base font-semibold mb-6 text-gray-900">모집 기간 관리</h2>

        {/* 현재 상태 배지 */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
          <span className="text-sm text-gray-500">현재 상태</span>
          <span
            className="text-xs font-semibold py-[3px] px-2.5 rounded-xl"
            style={{
              backgroundColor: current?.is_open ? '#d1fae5' : '#fee2e2',
              color: current?.is_open ? '#065f46' : '#991b1b',
            }}
          >
            {current === null ? '불러오는 중...' : current.is_open ? '모집 중' : '모집 마감'}
          </span>
        </div>

        <div className="mb-5 flex-1">
          <label className="block text-[13px] font-medium text-gray-700 mb-2">모집 활성화</label>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsOpen(v => !v)}
              className="relative w-[44px] h-6 rounded-xl border-none cursor-pointer transition-[background-color] duration-200 p-0"
              style={{ backgroundColor: isOpen ? '#4A90E2' : '#d1d5db' }}
            >
              <span
                className="absolute top-[2px] w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                style={{ transform: isOpen ? 'translateX(20px)' : 'translateX(2px)' }}
              />
            </button>
            <span className="text-sm text-gray-700">{isOpen ? '모집 중' : '모집 마감'}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="mb-5 flex-1">
            <label className="block text-[13px] font-medium text-gray-700 mb-2">모집 시작일시</label>
            <input
              type="datetime-local"
              value={openAt}
              onChange={e => setOpenAt(e.target.value)}
              className="w-full py-[9px] px-3 text-sm border border-gray-200 rounded-lg outline-none text-gray-900 bg-white"
              style={{ boxSizing: 'border-box' }}
            />
          </div>
          <div className="mb-5 flex-1">
            <label className="block text-[13px] font-medium text-gray-700 mb-2">모집 종료일시</label>
            <input
              type="datetime-local"
              value={closeAt}
              onChange={e => setCloseAt(e.target.value)}
              className="w-full py-[9px] px-3 text-sm border border-gray-200 rounded-lg outline-none text-gray-900 bg-white"
              style={{ boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {message && (
          <p
            className="text-[13px] py-2.5 px-3.5 rounded-lg mb-4"
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
          onClick={handleSave}
          disabled={loading}
          className="py-2.5 px-7 text-sm font-semibold bg-gray-900 text-white border-none rounded-lg cursor-pointer"
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
