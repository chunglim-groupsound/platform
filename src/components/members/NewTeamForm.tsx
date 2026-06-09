'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function NewTeamForm({ redirectBase = '/teams' }: { redirectBase?: string }) {
  const router = useRouter()
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [currentSong, setCurrentSong] = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) { setError('팀명을 입력해주세요'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         name.trim(),
          description:  description.trim() || undefined,
          current_song: currentSong.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다'); return }
      router.push(`${redirectBase}/${data.team.id}`)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' as const,
  }

  const labelStyle = { fontSize: '0.85rem', fontWeight: 600, color: '#374151' }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={labelStyle}>팀명 <span style={{ color: '#ef4444' }}>*</span></label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="팀명을 입력하세요"
          maxLength={50}
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={labelStyle}>팀 소개 (선택)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="팀을 소개하는 문구를 입력하세요"
          rows={3}
          maxLength={200}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={labelStyle}>연습 곡명 (선택)</label>
        <input
          value={currentSong}
          onChange={e => setCurrentSong(e.target.value)}
          placeholder="현재 연습 중인 곡을 입력하세요"
          maxLength={100}
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: 0 }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => router.push(redirectBase)}
          style={{
            padding: '8px 18px', borderRadius: '8px', fontSize: '0.88rem',
            border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer',
          }}
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 18px', borderRadius: '8px', fontSize: '0.88rem',
            fontWeight: 600, border: 'none', background: '#6366f1', color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '생성 중...' : '팀 만들기'}
        </button>
      </div>
    </form>
  )
}
