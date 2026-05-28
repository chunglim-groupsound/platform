'use client'

import { useState } from 'react'

const SESSION_OPTIONS = ['보컬', '기타', '베이스', '드럼', '건반', '기타(악기)']
const ROLE_OPTIONS = [
  { value: '', label: '전체 역할' },
  { value: 'ADMIN', label: '운영진' },
  { value: 'TEAM_LEADER', label: '팀장' },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* 검색창 */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="이름, 활동명, 기수 검색..."
          value={value.q}
          onChange={e => onChange({ ...value, q: e.target.value })}
          style={{
            width: '100%', padding: '8px 36px 8px 12px',
            border: '1px solid #d1d5db', borderRadius: '8px',
            fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
          }}
        />
        {value.q && (
          <button
            onClick={() => onChange({ ...value, q: '' })}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '1rem',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* 필터 토글 버튼 */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem',
            border: '1px solid #d1d5db', background: open ? '#f3f4f6' : '#fff',
            cursor: 'pointer', fontWeight: 500,
          }}
        >
          필터 {open ? '▲' : '▼'}
        </button>
        {hasFilter && (
          <button
            onClick={reset}
            style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '0.82rem',
              border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626',
              cursor: 'pointer',
            }}
          >
            초기화
          </button>
        )}
      </div>

      {open && (
        <div style={{
          padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb',
          background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          {/* 세션 */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>세션</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SESSION_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSession(s)}
                  style={{
                    padding: '4px 12px', borderRadius: '9999px', fontSize: '0.8rem',
                    border: '1px solid',
                    borderColor: value.sessions.includes(s) ? '#3b82f6' : '#d1d5db',
                    background: value.sessions.includes(s) ? '#eff6ff' : '#fff',
                    color: value.sessions.includes(s) ? '#1d4ed8' : '#374151',
                    cursor: 'pointer', fontWeight: value.sessions.includes(s) ? 600 : 400,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 기수 */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
              기수
            </label>
            <input
              type="number"
              placeholder="전체"
              min={1}
              value={value.generation}
              onChange={e => onChange({ ...value, generation: e.target.value })}
              style={{
                width: '80px', padding: '4px 8px',
                border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.85rem',
              }}
            />
          </div>

          {/* 역할 */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>
              역할
            </label>
            <select
              value={value.role}
              onChange={e => onChange({ ...value, role: e.target.value })}
              style={{
                padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: '6px',
                fontSize: '0.85rem', background: '#fff',
              }}
            >
              {ROLE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* 화이트리스트 */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
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
