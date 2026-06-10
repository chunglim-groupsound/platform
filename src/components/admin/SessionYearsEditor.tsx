'use client'

import { useState } from 'react'

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
    return <p className="text-[13px] text-gray-400">등록된 세션이 없습니다.</p>
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
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2.5">
        {sessions.map(s => (
          <label key={s} className="flex items-center gap-1.5 text-[13px] text-gray-700">
            <span className="min-w-[60px]">{s}</span>
            <input
              type="number"
              min={0}
              max={99}
              placeholder="0"
              value={values[s] ?? ''}
              onChange={e => setValues(v => ({ ...v, [s]: e.target.value }))}
              className="w-[56px] py-1 px-2 text-[13px] border border-gray-300 rounded-md text-center"
            />
            <span>년</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`py-1.5 px-4 rounded-md text-[13px] font-semibold border-none ${
            saving ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-700 text-white cursor-pointer'
          }`}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        {msg && (
          <span className={`text-xs ${msg.ok ? 'text-green-800' : 'text-red-800'}`}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  )
}
