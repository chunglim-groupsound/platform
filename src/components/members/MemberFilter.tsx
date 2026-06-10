'use client'

import { useState } from 'react'

const SESSION_OPTIONS = ['보컬', '기타', '베이스', '드럼', '건반', '기타(악기)']
const ROLE_OPTIONS = [
  { value: '', label: '전체 역할' },
  { value: 'ADMIN', label: '운영진' },
  { value: 'IS_LEADER', label: '팀장' },
  { value: 'MEMBER', label: '일반 부원' },
]

export interface FilterState {
  q: string
  sessions: string[]
  generation: string
  role: string
  isWhitelist: boolean
}

interface MemberFilterProps {
  value: FilterState
  onChange: (next: FilterState) => void
  isAdmin?: boolean
}

export function MemberFilter({ value, onChange, isAdmin = false }: MemberFilterProps) {
  const [open, setOpen] = useState(false)

  const toggleSession = (s: string) => {
    const next = value.sessions.includes(s)
      ? value.sessions.filter(x => x !== s)
      : [...value.sessions, s]
    onChange({ ...value, sessions: next })
  }

  const reset = () => onChange({ q: '', sessions: [], generation: '', role: '', isWhitelist: false })

  const hasFilter =
    value.q || value.sessions.length > 0 || value.generation || value.role || value.isWhitelist

  return (
    <div className="flex flex-col gap-2">
      {/* 검색창 */}
      <div className="relative">
        <input
          type="text"
          placeholder="이름, 활동명, 기수 검색..."
          value={value.q}
          onChange={e => onChange({ ...value, q: e.target.value })}
          className="w-full py-2 pr-9 pl-3 border border-gray-300 rounded-lg text-[0.9rem] outline-none box-border"
        />
        {value.q && (
          <button
            onClick={() => onChange({ ...value, q: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 text-base"
          >
            ×
          </button>
        )}
      </div>

      {/* 필터 토글 버튼 */}
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setOpen(o => !o)}
          className={`py-1.5 px-3.5 rounded-lg text-[0.85rem] border border-gray-300 cursor-pointer font-medium ${open ? 'bg-gray-100' : 'bg-white'}`}
        >
          필터 {open ? '▲' : '▼'}
        </button>
        {hasFilter && (
          <button
            onClick={reset}
            className="py-1.5 px-3 rounded-lg text-[0.82rem] border border-red-300 bg-[#fef2f2] text-red-600 cursor-pointer"
          >
            초기화
          </button>
        )}
      </div>

      {open && (
        <div className="p-3 rounded-[10px] border border-gray-200 bg-gray-50 flex flex-col gap-3">
          {/* 세션 */}
          <div>
            <div className="text-[0.8rem] font-semibold text-gray-700 mb-1.5">세션</div>
            <div className="flex flex-wrap gap-1.5">
              {SESSION_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSession(s)}
                  className={`py-1 px-3 rounded-full text-[0.8rem] border cursor-pointer ${
                    value.sessions.includes(s)
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-700 font-normal'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 기수 */}
          <div className="flex gap-2 items-center flex-wrap">
            <label className="text-[0.8rem] font-semibold text-gray-700 whitespace-nowrap">
              기수
            </label>
            <input
              type="number"
              placeholder="전체"
              min={1}
              value={value.generation}
              onChange={e => onChange({ ...value, generation: e.target.value })}
              className="w-20 py-1 px-2 border border-gray-300 rounded-md text-[0.85rem]"
            />
          </div>

          {/* 역할 */}
          <div className="flex gap-2 items-center flex-wrap">
            <label className="text-[0.8rem] font-semibold text-gray-700 whitespace-nowrap">
              역할
            </label>
            <select
              value={value.role}
              onChange={e => onChange({ ...value, role: e.target.value })}
              className="py-1 px-2 border border-gray-300 rounded-md text-[0.85rem] bg-white"
            >
              {ROLE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* 화이트리스트 */}
          <label className="flex items-center gap-2 cursor-pointer text-[0.85rem]">
            <input
              type="checkbox"
              checked={value.isWhitelist}
              onChange={e => onChange({ ...value, isWhitelist: e.target.checked })}
            />
            화이트리스트만 보기
          </label>
        </div>
      )}
    </div>
  )
}
