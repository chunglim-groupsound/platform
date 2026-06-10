'use client'
// src/app/(auth)/link/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const SCHOOL_YEAR_OPTIONS = [
  { value: 1, label: '1학년' },
  { value: 2, label: '2학년' },
  { value: 3, label: '3학년' },
  { value: 4, label: '4학년' },
  { value: 5, label: '5학년 이상' },
]

const GENRE_OPTIONS = ['록', '팝', '인디', '재즈', 'R&B', '메탈', '힙합', '발라드', '펑크', '포크']

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
interface ImportedMember {
  id:         string
  name:       string
  generation: number | null
  session:    string[] | null
  status:     string
}

interface ExtraInfo {
  nickname:         string
  department:       string
  student_id:       string
  school_year:      string
  genre_preference: string[]
}

type Step = 'choice' | 'search' | 'found' | 'notfound' | 'extra' | 'linking'

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
export default function LinkPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [step,       setStep]       = useState<Step>('choice')
  const [name,       setName]       = useState('')
  const [generation, setGeneration] = useState('')
  const [candidates, setCandidates] = useState<ImportedMember[]>([])
  const [selected,   setSelected]   = useState<ImportedMember | null>(null)
  const [extraInfo,  setExtraInfo]  = useState<ExtraInfo>({
    nickname:         '',
    department:       '',
    student_id:       '',
    school_year:      '',
    genre_preference: [],
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const setExtra = <K extends keyof ExtraInfo>(key: K, value: ExtraInfo[K]) =>
    setExtraInfo(prev => ({ ...prev, [key]: value }))

  const toggleGenre = (genre: string) =>
    setExtra(
      'genre_preference',
      extraInfo.genre_preference.includes(genre)
        ? extraInfo.genre_preference.filter(g => g !== genre)
        : [...extraInfo.genre_preference, genre]
    )

  // ── 검색 ─────────────────────────────────────
  const handleSearch = async () => {
    if (!name.trim() || !generation) {
      setError('이름과 기수를 모두 입력해주세요.'); return
    }
    setError(null)
    setLoading(true)

    const res  = await fetch('/api/auth/link/search', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: name.trim(), generation: Number(generation) }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? '검색 오류'); return }

    if (data.candidates?.length > 0) {
      setCandidates(data.candidates)
      setStep('found')
    } else {
      setStep('notfound')
    }
  }

  // ── 후보 선택 ────────────────────────────────
  const handleSelect = (member: ImportedMember) => {
    setSelected(member)
    setStep('extra')
  }

  // ── 연동 + 추가 정보 저장 ────────────────────
  const handleConfirm = async () => {
    if (!selected) return
    setLoading(true)
    setStep('linking')
    setError(null)

    // 1. 연동 확정
    const linkRes  = await fetch('/api/auth/link/confirm', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ targetUserId: selected.id }),
    })
    const linkData = await linkRes.json()

    if (!linkRes.ok) {
      setError(linkData.error ?? '연동 실패')
      setStep('extra')
      setLoading(false)
      return
    }

    // 2. 추가 정보 저장 (입력된 항목만)
    const updatePayload: Record<string, unknown> = {}

    if (extraInfo.nickname.trim())
      updatePayload.nickname         = extraInfo.nickname.trim()
    if (extraInfo.department.trim())
      updatePayload.department       = extraInfo.department.trim()
    if (extraInfo.student_id.trim())
      updatePayload.student_id       = extraInfo.student_id.trim()
    if (extraInfo.school_year)
      updatePayload.school_year      = Number(extraInfo.school_year)
    if (extraInfo.genre_preference.length > 0)
      updatePayload.genre_preference = extraInfo.genre_preference

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', selected.id)

      if (updateError) {
        console.warn('추가 정보 저장 실패 (연동은 완료됨):', updateError.message)
      }
    }

    setLoading(false)
    router.replace('/home')
  }

  // ─────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center p-5 bg-[#f5f5f5]">
      <div className="bg-white rounded-xl p-10 w-full max-w-[480px] shadow-[0_2px_12px_rgba(0,0,0,0.08)]">

        {/* ── 선택 화면 ── */}
        {step === 'choice' && (
          <>
            <h2 className="text-[22px] font-medium mb-2.5">청림그룹사운드에 오신 것을 환영합니다</h2>
            <p className="text-sm text-gray-500 leading-[1.7] mb-6">
              이전에 활동하셨던 분인가요?<br />
              기존 부원이시라면 기존 정보와 연결해드립니다.
            </p>
            <button
              className="block w-full py-3 px-3 text-sm font-medium rounded-md border-none cursor-pointer mb-2.5 text-center bg-[#4A90E2] text-white"
              onClick={() => setStep('search')}
            >
              기존 부원입니다 — 정보 연동하기
            </button>
            <button
              className="block w-full py-3 px-3 text-sm font-medium rounded-md border-none cursor-pointer mb-2.5 text-center bg-[#f0f0f0] text-[#333]"
              onClick={() => router.push('/apply')}
            >
              처음 가입합니다 — 신규 신청하기
            </button>
          </>
        )}

        {/* ── 검색 화면 ── */}
        {step === 'search' && (
          <>
            <h2 className="text-[22px] font-medium mb-2.5">기존 정보 찾기</h2>
            <p className="text-sm text-gray-500 leading-[1.7] mb-6">운영진이 등록한 이름과 기수를 입력해주세요.</p>

            <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#444] mb-1.5">이름</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="홍길동"
              className="block w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md mb-4 outline-none"
              style={{ boxSizing: 'border-box' }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />

            <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#444] mb-1.5">기수</label>
            <input type="number" value={generation}
              onChange={e => setGeneration(e.target.value)}
              placeholder="예) 15"
              className="block w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md mb-4 outline-none"
              style={{ boxSizing: 'border-box' }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />

            {error && (
              <p className="text-[#E74C3C] text-[13px] mb-3 py-2.5 px-3.5 bg-red-50 rounded-md border border-[#fecaca]">
                {error}
              </p>
            )}

            <button
              className="block w-full py-3 text-sm font-medium rounded-md border-none cursor-pointer mb-2.5 text-center bg-[#4A90E2] text-white"
              onClick={handleSearch} disabled={loading}
            >
              {loading ? '검색 중...' : '검색'}
            </button>
            <button
              className="block w-full py-3 text-sm font-medium rounded-md cursor-pointer mb-2.5 text-center bg-transparent text-gray-400 border border-[#eee]"
              onClick={() => { setStep('choice'); setError(null) }}
            >
              뒤로
            </button>
          </>
        )}

        {/* ── 후보 목록 ── */}
        {step === 'found' && (
          <>
            <h2 className="text-[22px] font-medium mb-2.5">아래 정보가 맞으신가요?</h2>
            <p className="text-sm text-gray-500 leading-[1.7] mb-6">본인의 정보를 선택해주세요.</p>
            {error && (
              <p className="text-[#E74C3C] text-[13px] mb-3 py-2.5 px-3.5 bg-red-50 rounded-md border border-[#fecaca]">
                {error}
              </p>
            )}
            {candidates.map(c => (
              <div key={c.id} className="border border-[#eee] rounded-lg p-4 mb-3">
                <strong className="text-base">{c.name}</strong>
                <span className="ml-2 text-gray-500 text-sm">
                  {c.generation}기 · {c.session?.join(', ')}
                </span>
                <button
                  className="block w-full py-3 text-sm font-medium rounded-md border-none cursor-pointer mt-2.5 text-center bg-[#27AE60] text-white"
                  onClick={() => handleSelect(c)}
                >
                  네, 제 정보입니다
                </button>
              </div>
            ))}
            <button
              className="block w-full py-3 text-sm font-medium rounded-md cursor-pointer mb-2.5 text-center bg-transparent text-gray-400 border border-[#eee]"
              onClick={() => { setStep('search'); setError(null) }}
            >
              다시 검색하기
            </button>
          </>
        )}

        {/* ── 추가 정보 입력 ── */}
        {step === 'extra' && selected && (
          <>
            <h2 className="text-[22px] font-medium mb-2.5">추가 정보 입력</h2>
            <p className="text-sm text-gray-500 leading-[1.7] mb-6">
              모두 선택 사항입니다.<br />
              입력하지 않아도 연동을 완료할 수 있으며,<br />
              나중에 프로필 수정에서 변경할 수 있습니다.
            </p>

            <div className="bg-[#f0f7ff] border border-[#d0e8ff] rounded-md py-2.5 px-3.5 text-sm text-[#2c6fad] mb-5">
              ✅ {selected.name} · {selected.generation}기
            </div>

            {/* 닉네임 */}
            <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#444] mb-1.5">닉네임</label>
            <input
              value={extraInfo.nickname}
              onChange={e => setExtra('nickname', e.target.value)}
              placeholder="플랫폼에서 사용할 닉네임 (미입력 시 실명 사용)"
              className="block w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md mb-4 outline-none"
              style={{ boxSizing: 'border-box' }}
            />

            {/* 학과 */}
            <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#444] mb-1.5">학과</label>
            <input
              value={extraInfo.department}
              onChange={e => setExtra('department', e.target.value)}
              placeholder="예) 컴퓨터공학과"
              className="block w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md mb-4 outline-none"
              style={{ boxSizing: 'border-box' }}
            />

            {/* 학번 + 학년 */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#444] mb-1.5">학번</label>
                <input
                  value={extraInfo.student_id}
                  onChange={e => setExtra('student_id', e.target.value)}
                  placeholder="예) 20210001"
                  className="block w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md mb-4 outline-none"
                  style={{ boxSizing: 'border-box' }}
                />
              </div>
              <div className="w-[130px]">
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#444] mb-1.5">학년</label>
                <select
                  value={extraInfo.school_year}
                  onChange={e => setExtra('school_year', e.target.value)}
                  className="block w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md mb-4 bg-white outline-none"
                  style={{ boxSizing: 'border-box' }}
                >
                  <option value="">선택 안 함</option>
                  {SCHOOL_YEAR_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 선호 장르 */}
            <label className="flex items-center gap-1.5 text-[13px] font-medium text-[#444] mb-1.5">
              선호 장르
              <span className="text-[11px] text-gray-400 font-normal">복수 선택 가능</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {GENRE_OPTIONS.map(genre => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className="py-1.5 px-3.5 text-[13px] border rounded-[20px] cursor-pointer"
                  style={{
                    borderColor: extraInfo.genre_preference.includes(genre) ? '#4A90E2' : '#e0e0e0',
                    background: extraInfo.genre_preference.includes(genre) ? '#4A90E2' : '#fff',
                    color: extraInfo.genre_preference.includes(genre) ? '#fff' : '#555',
                  }}
                >
                  {genre}
                </button>
              ))}
            </div>

            {error && (
              <p className="text-[#E74C3C] text-[13px] mb-3 py-2.5 px-3.5 bg-red-50 rounded-md border border-[#fecaca]">
                {error}
              </p>
            )}

            <button
              className="block w-full py-3 text-sm font-medium rounded-md border-none cursor-pointer mb-2.5 mt-6 text-center bg-[#4A90E2] text-white"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? '처리 중...' : '연동 완료'}
            </button>
            <button
              className="block w-full py-3 text-sm font-medium rounded-md cursor-pointer mb-2.5 text-center bg-transparent text-gray-400 border border-[#eee]"
              onClick={() => setStep('found')}
              disabled={loading}
            >
              뒤로
            </button>
          </>
        )}

        {/* ── 검색 결과 없음 ── */}
        {step === 'notfound' && (
          <>
            <h2 className="text-[22px] font-medium mb-2.5">일치하는 정보가 없습니다</h2>
            <p className="text-sm text-gray-500 leading-[1.7] mb-6">
              이름과 기수를 다시 확인해 주세요.<br />
              운영진이 아직 정보를 등록하지 않았을 수 있습니다.
            </p>
            <button
              className="block w-full py-3 text-sm font-medium rounded-md border-none cursor-pointer mb-2.5 text-center bg-[#f0f0f0] text-[#333]"
              onClick={() => setStep('search')}
            >
              다시 검색하기
            </button>
            <button
              className="block w-full py-3 text-sm font-medium rounded-md border-none cursor-pointer mb-2.5 text-center bg-[#4A90E2] text-white"
              onClick={() => router.push('/apply')}
            >
              신규 가입 신청하기
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              문의: 운영진에게 카카오톡으로 연락해 주세요.
            </p>
          </>
        )}

        {/* ── 처리 중 ── */}
        {step === 'linking' && (
          <>
            <h2 className="text-[22px] font-medium mb-2.5">연동 중...</h2>
            <p className="text-sm text-gray-500 leading-[1.7] mb-6">잠시만 기다려주세요.</p>
          </>
        )}

      </div>
    </main>
  )
}
