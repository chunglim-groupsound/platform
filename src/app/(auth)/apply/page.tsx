'use client'
// src/app/(auth)/apply/page.tsx
// 가입 신청서 — 학과·학번·학년 추가 (선택 항목)

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const SESSION_OPTIONS = ['보컬', '기타', '베이스', '드럼', '건반', '기타(악기)']
const SCHOOL_YEAR_OPTIONS = [
  { value: 1, label: '1학년' },
  { value: 2, label: '2학년' },
  { value: 3, label: '3학년' },
  { value: 4, label: '4학년' },
  { value: 5, label: '5학년 이상' },
]

// ─────────────────────────────────────────────
// 폼 타입
// ─────────────────────────────────────────────
interface ApplyForm {
  name:        string
  generation:  string
  session:     string[]
  department:  string   // 학과 (선택)
  student_id:  string   // 학번 (선택)
  school_year: string   // 학년 (선택)
  motivation:  string
  self_intro:  string
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
export default function ApplyPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState<ApplyForm>({
    name:        '',
    generation:  '',
    session:     [],
    department:  '',
    student_id:  '',
    school_year: '',
    motivation:  '',
    self_intro:  '',
  })
  const [agreed,  setAgreed]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // 카카오에서 가져온 이름 pre-fill
  useEffect(() => {
    const prefill = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const kakaoName = user.user_metadata?.name ?? ''
      if (kakaoName) setForm(prev => ({ ...prev, name: kakaoName }))
    }
    prefill()
  }, [])

  const setField = <K extends keyof ApplyForm>(key: K, value: ApplyForm[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const toggleSession = (s: string) =>
    setField('session', form.session.includes(s)
      ? form.session.filter(x => x !== s)
      : [...form.session, s]
    )

  // ── 유효성 검사 ──────────────────────────────
  const validate = (): string | null => {
    if (!form.name.trim())       return '이름을 입력해주세요.'
    if (!form.generation)        return '기수를 입력해주세요.'
    if (form.session.length === 0) return '세션을 하나 이상 선택해주세요.'
    if (!agreed)                 return '개인정보 수집에 동의해주세요.'
    return null
  }

  // ── 제출 ─────────────────────────────────────
  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('로그인이 필요합니다.'); setLoading(false); return }

    // users 테이블 업데이트 (기본 정보 + 학과·학번·학년)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name:        form.name.trim(),
        generation:  Number(form.generation),
        session:     form.session,
        department:  form.department.trim()  || null,
        student_id:  form.student_id.trim()  || null,
        school_year: form.school_year ? Number(form.school_year) : null,
        privacy_agreed_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      setError('정보 저장 실패: ' + updateError.message)
      setLoading(false)
      return
    }

    // join_applications 신청서 저장
    const { error: appError } = await supabase
      .from('join_applications')
      .insert({
        user_id:    user.id,
        motivation: form.motivation.trim() || null,
        self_intro: form.self_intro.trim() || null,
      })

    if (appError) {
      setError('신청서 저장 실패: ' + appError.message)
      setLoading(false)
      return
    }

    router.push('/status')
  }

  // ─────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────
  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>가입 신청서</h2>
        <p style={styles.desc}>
          <span style={styles.required}>*</span> 표시 항목은 필수입니다.
        </p>

        {/* ── 기본 정보 섹션 ── */}
        <Section title="기본 정보">

          <Field label="이름" required>
            <input
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="실명을 입력해주세요"
              style={styles.input}
            />
          </Field>

          <Field label="기수" required>
            <input
              type="number"
              value={form.generation}
              onChange={e => setField('generation', e.target.value)}
              placeholder="예) 15"
              style={{ ...styles.input, width: '120px' }}
            />
          </Field>

          <Field label="세션" required hint="복수 선택 가능">
            <div style={styles.tagGroup}>
              {SESSION_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSession(s)}
                  style={{
                    ...styles.tag,
                    ...(form.session.includes(s) ? styles.tagActive : {}),
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>

        </Section>

        {/* ── 학교 정보 섹션 (선택) ── */}
        <Section title="학교 정보" hint="선택 항목입니다">

          <Field label="학과">
            <input
              value={form.department}
              onChange={e => setField('department', e.target.value)}
              placeholder="예) 컴퓨터공학과"
              style={styles.input}
            />
          </Field>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <Field label="학번">
                <input
                  value={form.student_id}
                  onChange={e => setField('student_id', e.target.value)}
                  placeholder="예) 20210001"
                  style={styles.input}
                />
              </Field>
            </div>
            <div style={{ width: '140px' }}>
              <Field label="학년">
                <select
                  value={form.school_year}
                  onChange={e => setField('school_year', e.target.value)}
                  style={styles.select}
                >
                  <option value="">선택</option>
                  {SCHOOL_YEAR_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

        </Section>

        {/* ── 지원 내용 섹션 (선택) ── */}
        <Section title="지원 내용" hint="선택 항목입니다">

          <Field label="지원 동기">
            <textarea
              value={form.motivation}
              onChange={e => setField('motivation', e.target.value)}
              placeholder="청림그룹사운드에 지원하게 된 계기를 알려주세요."
              rows={4}
              style={styles.textarea}
            />
          </Field>

          <Field label="자기소개">
            <textarea
              value={form.self_intro}
              onChange={e => setField('self_intro', e.target.value)}
              placeholder="본인을 자유롭게 소개해주세요."
              rows={4}
              style={styles.textarea}
            />
          </Field>

        </Section>

        {/* ── 개인정보 동의 ── */}
        <div style={styles.agreeBox}>
          <p style={styles.agreeTitle}>개인정보 수집 및 이용 동의 <span style={styles.required}>*</span></p>
          <ul style={styles.agreeList}>
            <li>수집 항목: 이름, 기수, 세션 (필수) / 학과, 학번, 학년, 연락처 (선택)</li>
            <li>이용 목적: 동아리 운영 관리 및 부원 간 연락</li>
            <li>보관 기간: 탈퇴 후 30일 이내 식별 정보 삭제</li>
            <li>연락처·학번은 기본적으로 운영진에게만 공개됩니다.</li>
          </ul>
          <label style={styles.agreeLabel}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            위 내용을 확인하였으며 동의합니다.
          </label>
        </div>

        {/* ── 에러 메시지 ── */}
        {error && <p style={styles.errorText}>{error}</p>}

        {/* ── 제출 버튼 ── */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            ...styles.submitBtn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '제출 중...' : '신청서 제출'}
        </button>

      </div>
    </main>
  )
}

// ─────────────────────────────────────────────
// 서브 컴포넌트
// ─────────────────────────────────────────────
function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>{title}</h3>
        {hint && <span style={styles.sectionHint}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
        {required && <span style={styles.required}> *</span>}
        {hint && <span style={styles.fieldHint}> — {hint}</span>}
      </label>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '40px 20px',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '40px',
    maxWidth: '600px',
    margin: '0 auto',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: '22px',
    fontWeight: 500,
    marginBottom: '6px',
  },
  desc: {
    fontSize: '13px',
    color: '#999',
    marginBottom: '32px',
  },
  required: {
    color: '#E74C3C',
  },
  section: {
    marginBottom: '32px',
    paddingBottom: '32px',
    borderBottom: '1px solid #f0f0f0',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 500,
    margin: 0,
  },
  sectionHint: {
    fontSize: '12px',
    color: '#aaa',
  },
  field: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#444',
    marginBottom: '6px',
  },
  fieldHint: {
    fontWeight: 400,
    color: '#aaa',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
    outline: 'none',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
    background: '#fff',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    outline: 'none',
    lineHeight: 1.6,
  },
  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  tagGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  tag: {
    padding: '6px 14px',
    fontSize: '13px',
    border: '1px solid #e0e0e0',
    borderRadius: '20px',
    background: '#fff',
    cursor: 'pointer',
    color: '#555',
  },
  tagActive: {
    background: '#4A90E2',
    borderColor: '#4A90E2',
    color: '#fff',
  },
  agreeBox: {
    background: '#f9f9f9',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
  },
  agreeTitle: {
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '12px',
  },
  agreeList: {
    fontSize: '13px',
    color: '#666',
    lineHeight: 1.8,
    paddingLeft: '18px',
    marginBottom: '14px',
  },
  agreeLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    cursor: 'pointer',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: '13px',
    marginBottom: '12px',
    padding: '10px 14px',
    background: '#fff5f5',
    borderRadius: '6px',
    border: '1px solid #fecaca',
  },
  submitBtn: {
    display: 'block',
    width: '100%',
    padding: '14px',
    fontSize: '15px',
    fontWeight: 500,
    background: '#4A90E2',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
  },
}