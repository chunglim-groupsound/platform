'use client'

import { useState } from 'react'
import { Chip } from '@/components/ui/Chip'
import { Button } from '@/components/ui/Button'

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
    <div className="flex flex-col gap-2.5">
      {/* 검색창 */}
      <div className="relative">
        <input
          type="text"
          placeholder="이름, 활동명 검색..."
          value={value.q}
          onChange={e => onChange({ ...value, q: e.target.value })}
          className="w-full py-2.5 pr-9 pl-3.5 rounded-xl border border-[var(--border)] bg-surface text-foreground text-[0.9rem] placeholder:text-subtle-foreground outline-none focus:border-accent/50 transition-colors"
        />
        {value.q && (
          <button
            onClick={() => onChange({ ...value, q: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* 필터 토글 */}
      <div className="flex gap-2 items-center">
        <Button size="sm" onClick={() => setOpen(o => !o)}>
          필터 {open ? '▲' : '▼'}
        </Button>
        {hasFilter && (
          <button
            onClick={reset}
            className="py-1.5 px-3 rounded-lg text-[0.82rem] font-medium text-bad border border-bad/30 bg-bad/10 cursor-pointer hover:bg-bad/20 transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      {open && (
        <div className="p-4 rounded-xl border border-[var(--border)] bg-surface flex flex-col gap-4">
          {/* 세션 */}
          <div>
            <div className="text-[0.78rem] font-semibold text-muted-foreground uppercase tracking-[0.12em] font-mono mb-2">
              세션
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SESSION_OPTIONS.map(s => (
                <Chip
                  key={s}
                  selected={value.sessions.includes(s)}
                  onToggle={() => toggleSession(s)}
                >
                  {s}
                </Chip>
              ))}
            </div>
          </div>

          {/* 기수 */}
          <div className="flex gap-3 items-center">
            <span className="text-[0.78rem] font-semibold text-muted-foreground uppercase tracking-[0.12em] font-mono whitespace-nowrap">
              기수
            </span>
            <input
              type="number"
              placeholder="전체"
              min={1}
              value={value.generation}
              onChange={e => onChange({ ...value, generation: e.target.value })}
              className="w-20 py-1.5 px-2.5 border border-[var(--border)] rounded-lg text-[0.85rem] bg-surface-elevated text-foreground outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* 역할 */}
          <div className="flex gap-3 items-center">
            <span className="text-[0.78rem] font-semibold text-muted-foreground uppercase tracking-[0.12em] font-mono whitespace-nowrap">
              역할
            </span>
            <select
              value={value.role}
              onChange={e => onChange({ ...value, role: e.target.value })}
              className="py-1.5 px-2.5 border border-[var(--border)] rounded-lg text-[0.85rem] bg-surface-elevated text-foreground outline-none cursor-pointer"
            >
              {ROLE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* 화이트리스트 */}
          {isAdmin && (
            <label className="flex items-center gap-2 cursor-pointer text-[0.85rem] text-foreground">
              <input
                type="checkbox"
                checked={value.isWhitelist}
                onChange={e => onChange({ ...value, isWhitelist: e.target.checked })}
                className="accent-[var(--accent)]"
              />
              화이트리스트만 보기
            </label>
          )}
        </div>
      )}
    </div>
  )
}
