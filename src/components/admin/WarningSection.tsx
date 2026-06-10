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
    <section className="mb-8 pb-8 border-b border-[#f0f0f0]">
      <div className="flex items-center gap-2.5 mb-4">
        <h2 className="text-[15px] font-medium text-[#333] m-0">경고 이력</h2>
        <span
          className="py-[2px] px-2.5 rounded-full text-xs font-bold"
          style={{
            backgroundColor: warningCount >= 3 ? '#fee2e2' : warningCount >= 2 ? '#fef9c3' : '#f3f4f6',
            color: warningCount >= 3 ? '#991b1b' : warningCount >= 2 ? '#854d0e' : '#6b7280',
          }}
        >
          {warningCount}회
        </span>
        {warningCount >= 3 && (
          <span className="text-xs text-red-600 font-semibold">제적 기준 도달</span>
        )}
      </div>

      {/* 경고 목록 */}
      {loading ? (
        <p className="text-[13px] text-gray-400">불러오는 중...</p>
      ) : warnings.length === 0 ? (
        <p className="text-[13px] text-gray-400 mb-4">경고 이력이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2 mb-5">
          {warnings.map((w, i) => (
            <div key={w.id} className="py-3 px-3.5 bg-red-50 border border-[#fecaca] rounded-lg">
              <div className="flex justify-between mb-1">
                <span className="text-[13px] font-semibold text-red-600">
                  경고 {warningCount - i}회차
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(w.created_at).toLocaleDateString('ko-KR')}
                  {w.issuer?.name && ` · ${w.issuer.name}`}
                </span>
              </div>
              <p className="text-[13px] text-gray-700 m-0">{w.reason}</p>
            </div>
          ))}
        </div>
      )}

      {/* 경고 추가 폼 */}
      <div className="flex flex-col gap-2">
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="경고 사유를 입력하세요"
          rows={2}
          className="w-full py-2.5 px-3 text-[13px] border border-gray-200 rounded-md outline-none leading-[1.6] resize-y"
          style={{ boxSizing: 'border-box' }}
        />
        {message && (
          <p
            className="text-[13px] py-2 px-3 rounded-md m-0"
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
          onClick={handleAdd}
          disabled={saving || !reason.trim()}
          className="py-2 px-4 text-[13px] font-semibold bg-red-600 text-white border-none rounded-md self-start"
          style={{
            cursor: saving || !reason.trim() ? 'not-allowed' : 'pointer',
            opacity: saving || !reason.trim() ? 0.6 : 1,
          }}
        >
          {saving ? '처리 중...' : '경고 추가'}
        </button>
      </div>
    </section>
  )
}
