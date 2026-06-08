'use client'
// src/app/(auth)/apply/page.tsx
// 가입 신청서 — 학과·학번·학년 추가 (선택 항목)

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import InterviewSlotPicker from '@/components/InterviewSlotPicker'

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
const GENRE_OPTIONS = ['록', '팝', '인디', '재즈', 'R&B', '메탈', '힙합', '발라드', '펑크', '포크']

// ─────────────────────────────────────────────
// 폼 타입
// ─────────────────────────────────────────────
interface ApplyForm {
  name:              string
  nickname:          string
  generation:        string
  session:           string[]
  profile_image_url: string
  genre_preference:  string[]
  phone:             string
  department:        string
  student_id:        string
  school_year:       string
  motivation:        string
  self_intro:        string
}

// ─────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────
export default function ApplyPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [recruitOpen, setRecruitOpen] = useState<boolean | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/settings/recruitment')
      .then(r => r.json())
      .then(d => setRecruitOpen(d.is_open ?? false))
      .catch(() => setRecruitOpen(false))
  }, [])

  const currentGeneration = String(new Date().getFullYear() - 1982)

  const [form, setForm] = useState<ApplyForm>({
    name:              '',
    nickname:          '',
    generation:        currentGeneration,
    session:           [],
    profile_image_url: '',
    genre_preference:  [],
    phone:             '',
    department:        '',
    student_id:        '',
    school_year:       '',
    motivation:        '',
    self_intro:        '',
  })
  const [agreed,  setAgreed]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // 카카오에서 가져온 기본 정보 pre-fill
  useEffect(() => {
    const prefill = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const kakaoName     = user.user_metadata?.name      ?? ''
      const kakaoNickname = user.user_metadata?.nickname  ?? user.user_metadata?.name ?? ''
      const kakaoAvatar   = user.user_metadata?.avatar_url ?? ''
      setForm(prev => ({
        ...prev,
        ...(kakaoName     ? { name:              kakaoName }     : {}),
        ...(kakaoNickname ? { nickname:           kakaoNickname } : {}),
        ...(kakaoAvatar   ? { profile_image_url:  kakaoAvatar }   : {}),
      }))
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

  const toggleGenre = (g: string) =>
    setField('genre_preference', form.genre_preference.includes(g)
      ? form.genre_preference.filter(x => x !== g)
      : [...form.genre_preference, g]
    )

  // ── 유효성 검사 ──────────────────────────────
  const validate = (): string | null => {
    if (!form.name.trim())         return '이름을 입력해주세요.'
    if (!form.nickname.trim())     return '닉네임을 입력해주세요.'
    if (!form.generation)          return '기수를 입력해주세요.'
    if (form.session.length === 0) return '세션을 하나 이상 선택해주세요.'
    if (!form.motivation.trim())   return '지원 동기를 입력해주세요.'
    if (!form.self_intro.trim())   return '자기소개를 입력해주세요.'
    if (!agreed)                   return '개인정보 수집에 동의해주세요.'
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

    const kakaoId = user.user_metadata?.provider_id ?? user.id

    // users 테이블 upsert (행이 없으면 생성, 있으면 갱신)
    const { error: updateError } = await supabase
      .from('users')
      .upsert({
        id:                user.id,
        kakao_id:          kakaoId,
        name:              form.name.trim(),
        nickname:          form.nickname.trim()          || null,
        generation:        Number(form.generation),
        session:           form.session,
        profile_image_url: form.profile_image_url.trim() || null,
        genre_preference:  form.genre_preference,
        phone:             form.phone.trim()             || null,
        department:        form.department.trim()        || null,
        student_id:        form.student_id.trim()        || null,
        school_year:       form.school_year ? Number(form.school_year) : null,
        privacy_agreed_at: new Date().toISOString(),
      })

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

    setSubmitted(true)
  }

  // ─────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────
  if (recruitOpen === null) {
    return (
      <main style={styles.container}>
        <div style={{ ...styles.card, textAlign: 'center', color: '#999', padding: '60px 40px' }}>
          로딩 중...
        </div>
      </main>
    )
  }

  if (!recruitOpen) {
    return (
      <main style={styles.container}>
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <p style={{ fontSize: '32px', marginBottom: '16px' }}>🎸</p>
          <h2 style={{ ...styles.title, marginBottom: '12px' }}>현재 모집 기간이 아닙니다</h2>
          <p style={{ fontSize: '14px', color: '#999', lineHeight: 1.7 }}>
            신규 부원 모집 기간이 아닙니다.<br />
            모집 기간에 다시 방문해주세요.
          </p>
        </div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main style={styles.container}>
        <div style={styles.card}>
          <h2 style={{ ...styles.title, marginBottom: '8px' }}>신청서가 제출되었습니다</h2>
          <p style={{ fontSize: '14px', color: '#999', marginBottom: '28px' }}>
            희망 면접 일정을 선택해주세요. 나중에 /status 페이지에서도 변경할 수 있습니다.
          </p>
          <InterviewSlotPicker onSubmitSuccess={() => router.push('/status')} />
        </div>
      </main>
    )
  }

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

          <Field label="닉네임" required>
            <input
              value={form.nickname}
              onChange={e => setField('nickname', e.target.value)}
              placeholder="활동할 닉네임을 입력해주세요"
              style={styles.input}
            />
          </Field>

          <Field label="연락처" hint="선택">
            <input
              type="tel"
              value={form.phone}
              onChange={e => setField('phone', e.target.value)}
              placeholder="예) 010-1234-5678"
              style={styles.input}
            />
          </Field>

          <Field label="프로필 사진 URL" hint="선택 — 카카오 프로필이 자동으로 채워집니다">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {form.profile_image_url && (
                <img
                  src={form.profile_image_url}
                  alt="프로필 미리보기"
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e0e0e0', flexShrink: 0 }}
                />
              )}
              <input
                value={form.profile_image_url}
                onChange={e => setField('profile_image_url', e.target.value)}
                placeholder="이미지 URL"
                style={styles.input}
              />
            </div>
          </Field>

          <Field label="기수" required hint="현재 연도 기준 자동 계산">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                value={form.generation}
                readOnly
                style={{ ...styles.input, width: '80px', backgroundColor: '#f5f5f5', color: '#555', cursor: 'default' }}
              />
              <span style={{ fontSize: '13px', color: '#999' }}>{form.generation}기 ({new Date().getFullYear()}년 기준)</span>
            </div>
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

        {/* ── 선호 장르 섹션 (선택) ── */}
        <Section title="선호 장르" hint="선택 항목입니다">
          <Field label="장르" hint="복수 선택 가능">
            <div style={styles.tagGroup}>
              {GENRE_OPTIONS.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  style={{
                    ...styles.tag,
                    ...(form.genre_preference.includes(g) ? styles.tagActive : {}),
                  }}
                >
                  {g}
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

        {/* ── 지원 내용 섹션 (필수) ── */}
        <Section title="지원 내용">

          <Field label="지원 동기" required>
            <textarea
              value={form.motivation}
              onChange={e => setField('motivation', e.target.value)}
              placeholder="청림그룹사운드에 지원하게 된 계기를 알려주세요."
              rows={4}
              style={styles.textarea}
            />
          </Field>

          <Field label="자기소개" required>
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