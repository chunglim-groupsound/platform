'use client'
// src/app/(auth)/link/page.tsx
// 기존 부원 카카오 연동 페이지 — 연동 후 학과·학번·학년 추가 입력

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
interface ImportedMember {
  id: string
  name: string
  generation: number | null
  session: string[] | null
  status: string
}

interface ExtraInfo {
  department:  string
  student_id:  string
  school_year: string
}

type Step = 'choice' | 'search' | 'found' | 'notfound' | 'extra' | 'linking'

const SCHOOL_YEAR_OPTIONS = [
  { value: 1, label: '1학년' },
  { value: 2, label: '2학년' },
  { value: 3, label: '3학년' },
  { value: 4, label: '4학년' },
  { value: 5, label: '5학년 이상' },
]

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
    department: '', student_id: '', school_year: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const setExtra = <K extends keyof ExtraInfo>(key: K, value: string) =>
    setExtraInfo(prev => ({ ...prev, [key]: value }))

  // ── 검색 ─────────────────────────────────────
  const handleSearch = async () => {
    if (!name.trim() || !generation) {
      setError('이름과 기수를 모두 입력해주세요.'); return
    }
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/link/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), generation: Number(generation) }),
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

  // ── 후보 선택 → 추가 정보 입력 단계로 ──────
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

    // 1. 연동 확정 API
    const linkRes = await fetch('/api/auth/link/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: selected.id }),
    })
    const linkData = await linkRes.json()

    if (!linkRes.ok) {
      setError(linkData.error ?? '연동 실패')
      setStep('extra')
      setLoading(false)
      return
    }

    // 2. 추가 정보(학과·학번·학년) 저장
    //    연동 후에는 linked_auth_id로 본인 확인이 되므로
    //    supabase 클라이언트로 직접 update 가능
    const hasExtra =
      extraInfo.department || extraInfo.student_id || extraInfo.school_year

    if (hasExtra) {
      await supabase
        .from('users')
        .update({
          department:  extraInfo.department.trim()  || null,
          student_id:  extraInfo.student_id.trim()  || null,
          school_year: extraInfo.school_year ? Number(extraInfo.school_year) : null,
        })
        .eq('id', selected.id)
    }

    setLoading(false)
    router.replace('/timetable')
  }

  // ─────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────
  return (
    <main style={styles.container}>
      <div style={styles.card}>

        {/* ── 선택 화면 ── */}
        {step === 'choice' && (
          <>
            <h2 style={styles.title}>청림그룹사운드에 오신 것을 환영합니다</h2>
            <p style={styles.desc}>
              이전에 활동하셨던 분인가요?<br />
              기존 부원이시라면 기존 정보와 연결해드립니다.
            </p>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={() => setStep('search')}
            >
              기존 부원입니다 — 정보 연동하기
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => router.push('/apply')}
            >
              처음 가입합니다 — 신규 신청하기
            </button>
          </>
        )}

        {/* ── 검색 화면 ── */}
        {step === 'search' && (
          <>
            <h2 style={styles.title}>기존 정보 찾기</h2>
            <p style={styles.desc}>운영진이 등록한 이름과 기수를 입력해주세요.</p>

            <label style={styles.label}>이름</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="홍길동"
              style={styles.input}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />

            <label style={styles.label}>기수</label>
            <input
              type="number"
              value={generation}
              onChange={e => setGeneration(e.target.value)}
              placeholder="예) 15"
              style={styles.input}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />

            {error && <p style={styles.error}>{error}</p>}

            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? '검색 중...' : '검색'}
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnGhost }}
              onClick={() => { setStep('choice'); setError(null) }}
            >
              뒤로
            </button>
          </>
        )}

        {/* ── 후보 목록 ── */}
        {step === 'found' && (
          <>
            <h2 style={styles.title}>아래 정보가 맞으신가요?</h2>
            <p style={styles.desc}>본인의 정보를 선택해주세요.</p>

            {error && <p style={styles.error}>{error}</p>}

            {candidates.map(c => (
              <div key={c.id} style={styles.candidateCard}>
                <strong style={{ fontSize: '16px' }}>{c.name}</strong>
                <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>
                  {c.generation}기 · {c.session?.join(', ')}
                </span>
                <button
                  style={{ ...styles.btn, ...styles.btnSuccess, marginTop: '10px' }}
                  onClick={() => handleSelect(c)}
                >
                  네, 제 정보입니다
                </button>
              </div>
            ))}

            <button
              style={{ ...styles.btn, ...styles.btnGhost }}
              onClick={() => { setStep('search'); setError(null) }}
            >
              다시 검색하기
            </button>
          </>
        )}

        {/* ── 추가 정보 입력 (선택) ── */}
        {step === 'extra' && selected && (
          <>
            <h2 style={styles.title}>추가 정보 입력</h2>
            <p style={styles.desc}>
              아래 항목은 선택 사항입니다.<br />
              입력하지 않아도 연동을 완료할 수 있습니다.
            </p>

            <div style={styles.selectedBadge}>
              ✅ {selected.name} · {selected.generation}기
            </div>

            <label style={styles.label}>학과</label>
            <input
              value={extraInfo.department}
              onChange={e => setExtra('department', e.target.value)}
              placeholder="예) 컴퓨터공학과"
              style={styles.input}
            />

            <label style={styles.label}>학번</label>
            <input
              value={extraInfo.student_id}
              onChange={e => setExtra('student_id', e.target.value)}
              placeholder="예) 20210001"
              style={styles.input}
            />

            <label style={styles.label}>학년</label>
            <select
              value={extraInfo.school_year}
              onChange={e => setExtra('school_year', e.target.value)}
              style={styles.select}
            >
              <option value="">선택 안 함</option>
              {SCHOOL_YEAR_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {error && <p style={styles.error}>{error}</p>}

            <button
              style={{ ...styles.btn, ...styles.btnPrimary, marginTop: '20px' }}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? '처리 중...' : '연동 완료'}
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnGhost }}
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
            <h2 style={styles.title}>일치하는 정보가 없습니다</h2>
            <p style={styles.desc}>
              이름과 기수를 다시 확인해 주세요.<br />
              운영진이 아직 정보를 등록하지 않았을 수 있습니다.
            </p>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => setStep('search')}
            >
              다시 검색하기
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={() => router.push('/apply')}
            >
              신규 가입 신청하기
            </button>
            <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', marginTop: '12px' }}>
              문의: 운영진에게 카카오톡으로 연락해 주세요.
            </p>
          </>
        )}

        {/* ── 처리 중 ── */}
        {step === 'linking' && (
          <>
            <h2 style={styles.title}>연동 중...</h2>
            <p style={styles.desc}>잠시만 기다려주세요.</p>
          </>
        )}

      </div>
    </main>
  )
}

// ─────────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#f5f5f5',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '40px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: '22px',
    fontWeight: 500,
    marginBottom: '10px',
  },
  desc: {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.7,
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#444',
    marginBottom: '6px',
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    marginBottom: '16px',
    boxSizing: 'border-box' as const,
    outline: 'none',
  },
  select: {
    display: 'block',
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    marginBottom: '16px',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  btn: {
    display: 'block',
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '10px',
    textAlign: 'center' as const,
  },
  btnPrimary:   { background: '#4A90E2', color: '#fff' },
  btnSecondary: { background: '#f0f0f0', color: '#333' },
  btnSuccess:   { background: '#27AE60', color: '#fff' },
  btnGhost:     { background: 'transparent', color: '#999', border: '1px solid #eee' },
  candidateCard: {
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
  },
  selectedBadge: {
    background: '#f0f7ff',
    border: '1px solid #d0e8ff',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#2c6fad',
    marginBottom: '20px',
  },
  error: {
    color: '#E74C3C',
    fontSize: '13px',
    marginBottom: '12px',
    padding: '10px 14px',
    background: '#fff5f5',
    borderRadius: '6px',
    border: '1px solid #fecaca',
  },
}