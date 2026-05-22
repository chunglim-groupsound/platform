'use client'
// src/app/(auth)/link/page.tsx
// 카카오 로그인 직후 PENDING 유저에게 표시되는 연동 확인 페이지
// 기존 부원 → 임포트 레코드와 연동
// 신규 부원 → /apply 로 이동

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

type Step = 'choice' | 'search' | 'found' | 'notfound' | 'linking'

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
export default function LinkPage() {
  const router = useRouter()

  const [step, setStep]             = useState<Step>('choice')
  const [name, setName]             = useState('')
  const [generation, setGeneration] = useState('')
  const [candidates, setCandidates] = useState<ImportedMember[]>([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // ── 이름 + 기수로 임포트 레코드 검색 ────────
  const handleSearch = async () => {
    if (!name.trim() || !generation) {
      setError('이름과 기수를 모두 입력해주세요.')
      return
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

    if (!res.ok) {
      setError(data.error ?? '검색 중 오류가 발생했습니다.')
      return
    }

    if (data.candidates?.length > 0) {
      setCandidates(data.candidates)
      setStep('found')
    } else {
      setStep('notfound')
    }
  }

  // ── 연동 확정 ────────────────────────────────
  const handleLink = async (targetUserId: string) => {
    setLoading(true)
    setStep('linking')

    const res = await fetch('/api/auth/link/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? '연동 중 오류가 발생했습니다.')
      setStep('found')
      return
    }

    // 연동 완료 → 플랫폼 메인으로
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
            <p style={styles.desc}>
              운영진이 등록한 이름과 기수를 입력해주세요.
            </p>

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

            {error && <p style={styles.errorText}>{error}</p>}

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

            {error && <p style={styles.errorText}>{error}</p>}

            {candidates.map(c => (
              <div key={c.id} style={styles.candidateCard}>
                <div>
                  <strong style={{ fontSize: '16px' }}>{c.name}</strong>
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '14px' }}>
                    {c.generation}기 · {c.session?.join(', ')}
                  </span>
                </div>
                <button
                  style={{ ...styles.btn, ...styles.btnSuccess, marginTop: '10px' }}
                  onClick={() => handleLink(c.id)}
                  disabled={loading}
                >
                  {loading ? '연동 중...' : '네, 제 정보입니다'}
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

            <p style={{ fontSize: '12px', color: '#999', marginTop: '16px', textAlign: 'center' }}>
              문의: 운영진에게 카카오톡으로 연락해 주세요.
            </p>
          </>
        )}

        {/* ── 연동 처리 중 ── */}
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
// 인라인 스타일
// ─────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#f9f9f9',
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
    color: '#1a1a1a',
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
    border: '1px solid #ddd',
    borderRadius: '6px',
    marginBottom: '16px',
    boxSizing: 'border-box' as const,
    outline: 'none',
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
  btnPrimary: {
    background: '#4A90E2',
    color: '#fff',
  },
  btnSecondary: {
    background: '#f0f0f0',
    color: '#333',
  },
  btnSuccess: {
    background: '#27AE60',
    color: '#fff',
  },
  btnGhost: {
    background: 'transparent',
    color: '#999',
    border: '1px solid #eee',
  },
  candidateCard: {
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: '13px',
    marginBottom: '12px',
  },
}