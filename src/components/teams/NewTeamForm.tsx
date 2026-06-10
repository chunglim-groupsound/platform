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

  return (
    <form onSubmit={submit} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-1.5">
        <label className="text-[0.85rem] font-semibold text-gray-700">팀명 <span className="text-red-500">*</span></label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="팀명을 입력하세요"
          maxLength={50}
          className="w-full py-[9px] px-3 rounded-lg border border-gray-300 text-[0.9rem] box-border"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[0.85rem] font-semibold text-gray-700">팀 소개 (선택)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="팀을 소개하는 문구를 입력하세요"
          rows={3}
          maxLength={200}
          className="w-full py-[9px] px-3 rounded-lg border border-gray-300 text-[0.9rem] box-border resize-y"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[0.85rem] font-semibold text-gray-700">연습 곡명 (선택)</label>
        <input
          value={currentSong}
          onChange={e => setCurrentSong(e.target.value)}
          placeholder="현재 연습 중인 곡을 입력하세요"
          maxLength={100}
          className="w-full py-[9px] px-3 rounded-lg border border-gray-300 text-[0.9rem] box-border"
        />
      </div>

      {error && (
        <p className="text-red-600 text-[0.85rem] m-0">{error}</p>
      )}

      <div className="flex gap-2.5 justify-end">
        <button
          type="button"
          onClick={() => router.push(redirectBase)}
          className="py-2 px-[18px] rounded-lg text-[0.88rem] border border-gray-300 bg-white text-gray-700 cursor-pointer"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`py-2 px-[18px] rounded-lg text-[0.88rem] font-semibold border-none bg-indigo-500 text-white ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
        >
          {loading ? '생성 중...' : '팀 만들기'}
        </button>
      </div>
    </form>
  )
}
