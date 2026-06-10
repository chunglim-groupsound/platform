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
  const [kakaoAvatarUrl, setKakaoAvatarUrl] = useState('')
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
      setKakaoAvatarUrl(kakaoAvatar)
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
      <main className="min-h-screen bg-[#f5f5f5] py-10 px-5">
        <div className="bg-white rounded-xl p-10 max-w-[600px] mx-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)] text-center text-gray-400 py-[60px]">
          로딩 중...
        </div>
      </main>
    )
  }

  if (!recruitOpen) {
    return (
      <main className="min-h-screen bg-[#f5f5f5] py-10 px-5">
        <div className="bg-white rounded-xl p-10 max-w-[600px] mx-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)] text-center">
          <p className="text-[32px] mb-4">🎸</p>
          <h2 className="text-[22px] font-medium mb-3">현재 모집 기간이 아닙니다</h2>
          <p className="text-sm text-gray-400 leading-[1.7]">
            신규 부원 모집 기간이 아닙니다.<br />
            모집 기간에 다시 방문해주세요.
          </p>
        </div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#f5f5f5] py-10 px-5">
        <div className="bg-white rounded-xl p-10 max-w-[600px] mx-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          <h2 className="text-[22px] font-medium mb-2">신청서가 제출되었습니다</h2>
          <p className="text-sm text-gray-400 mb-7">
            희망 면접 일정을 선택해주세요. 나중에 /status 페이지에서도 변경할 수 있습니다.
          </p>
          <InterviewSlotPicker onSubmitSuccess={() => router.push('/status')} />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] py-10 px-5">
      <div className="bg-white rounded-xl p-10 max-w-[600px] mx-auto shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <h2 className="text-[22px] font-medium mb-1.5">가입 신청서</h2>
        <p className="text-[13px] text-gray-400 mb-8">
          <span className="text-[#E74C3C]">*</span> 표시 항목은 필수입니다.
        </p>

        {/* ── 기본 정보 섹션 ── */}
        <Section title="기본 정보">

          <Field label="이름" required>
            <input
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              placeholder="실명을 입력해주세요"
              className="w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md outline-none"
              style={{ boxSizing: 'border-box' }}
            />
          </Field>

          <Field label="닉네임" required>
            <input
              value={form.nickname}
              onChange={e => setField('nickname', e.target.value)}
              placeholder="활동할 닉네임을 입력해주세요"
              className="w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md outline-none"
              style={{ boxSizing: 'border-box' }}
            />
          </Field>

          <Field label="연락처" hint="선택">
            <input
              type="tel"
              value={form.phone}
              onChange={e => setField('phone', e.target.value)}
              placeholder="예) 010-1234-5678"
              className="w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md outline-none"
              style={{ boxSizing: 'border-box' }}
            />
          </Field>

          <Field label="프로필 사진" hint="선택">
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setField('profile_image_url', kakaoAvatarUrl)}
                disabled={!kakaoAvatarUrl}
                className="flex flex-col items-center gap-1.5 py-3 px-4 border-2 border-solid rounded-[10px] cursor-pointer min-w-[96px]"
                style={{
                  borderColor: form.profile_image_url ? '#4A90E2' : '#e0e0e0',
                  background: form.profile_image_url ? '#f0f7ff' : '#fff',
                  color: form.profile_image_url ? '#4A90E2' : '#555',
                  opacity: kakaoAvatarUrl ? 1 : 0.4,
                  cursor: kakaoAvatarUrl ? 'pointer' : 'not-allowed',
                }}
              >
                {kakaoAvatarUrl
                  ? <img src={kakaoAvatarUrl} alt="카카오 프로필" className="w-8 h-8 rounded-full object-cover" />
                  : <DefaultAvatar size={32} />
                }
                <span className="text-[13px]">카카오 프로필</span>
              </button>
              <button
                type="button"
                onClick={() => setField('profile_image_url', '')}
                className="flex flex-col items-center gap-1.5 py-3 px-4 border-2 border-solid rounded-[10px] cursor-pointer min-w-[96px]"
                style={{
                  borderColor: !form.profile_image_url ? '#4A90E2' : '#e0e0e0',
                  background: !form.profile_image_url ? '#f0f7ff' : '#fff',
                  color: !form.profile_image_url ? '#4A90E2' : '#555',
                }}
              >
                <DefaultAvatar size={32} />
                <span className="text-[13px]">기본 프로필</span>
              </button>
            </div>
          </Field>

          <Field label="기수" required hint="현재 연도 기준 자동 계산">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form.generation}
                readOnly
                className="py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md outline-none w-20 bg-[#f5f5f5] text-[#555] cursor-default"
                style={{ boxSizing: 'border-box' }}
              />
              <span className="text-[13px] text-gray-400">{form.generation}기 ({new Date().getFullYear()}년 기준)</span>
            </div>
          </Field>

          <Field label="세션" required hint="복수 선택 가능">
            <div className="flex flex-wrap gap-2">
              {SESSION_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSession(s)}
                  className="py-1.5 px-3.5 text-[13px] border rounded-[20px] cursor-pointer"
                  style={{
                    borderColor: form.session.includes(s) ? '#4A90E2' : '#e0e0e0',
                    background: form.session.includes(s) ? '#4A90E2' : '#fff',
                    color: form.session.includes(s) ? '#fff' : '#555',
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
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className="py-1.5 px-3.5 text-[13px] border rounded-[20px] cursor-pointer"
                  style={{
                    borderColor: form.genre_preference.includes(g) ? '#4A90E2' : '#e0e0e0',
                    background: form.genre_preference.includes(g) ? '#4A90E2' : '#fff',
                    color: form.genre_preference.includes(g) ? '#fff' : '#555',
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
              className="w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md outline-none"
              style={{ boxSizing: 'border-box' }}
            />
          </Field>

          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <Field label="학번">
                <input
                  value={form.student_id}
                  onChange={e => setField('student_id', e.target.value)}
                  placeholder="예) 20210001"
                  className="w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md outline-none"
                  style={{ boxSizing: 'border-box' }}
                />
              </Field>
            </div>
            <div className="w-[140px]">
              <Field label="학년">
                <select
                  value={form.school_year}
                  onChange={e => setField('school_year', e.target.value)}
                  className="w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md outline-none bg-white"
                  style={{ boxSizing: 'border-box' }}
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
              className="w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md outline-none leading-[1.6] resize-y"
              style={{ boxSizing: 'border-box' }}
            />
          </Field>

          <Field label="자기소개" required>
            <textarea
              value={form.self_intro}
              onChange={e => setField('self_intro', e.target.value)}
              placeholder="본인을 자유롭게 소개해주세요."
              rows={4}
              className="w-full py-2.5 px-3 text-sm border border-[#e0e0e0] rounded-md outline-none leading-[1.6] resize-y"
              style={{ boxSizing: 'border-box' }}
            />
          </Field>

        </Section>

        {/* ── 개인정보 동의 ── */}
        <div className="bg-[#f9f9f9] border border-[#eee] rounded-lg p-5 mb-6">
          <p className="text-sm font-medium mb-3">
            개인정보 수집 및 이용 동의 <span className="text-[#E74C3C]">*</span>
          </p>
          <ul className="text-[13px] text-gray-500 leading-[1.8] pl-[18px] mb-3.5">
            <li>수집 항목: 이름, 기수, 세션 (필수) / 학과, 학번, 학년, 연락처 (선택)</li>
            <li>이용 목적: 동아리 운영 관리 및 부원 간 연락</li>
            <li>보관 기간: 탈퇴 후 30일 이내 식별 정보 삭제</li>
            <li>연락처·학번은 기본적으로 운영진에게만 공개됩니다.</li>
          </ul>
          <label className="flex items-center text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mr-2"
            />
            위 내용을 확인하였으며 동의합니다.
          </label>
        </div>

        {/* ── 에러 메시지 ── */}
        {error && (
          <p className="text-[#E74C3C] text-[13px] mb-3 py-2.5 px-3.5 bg-red-50 rounded-md border border-[#fecaca]">
            {error}
          </p>
        )}

        {/* ── 제출 버튼 ── */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="block w-full py-3.5 text-[15px] font-medium bg-[#4A90E2] text-white border-none rounded-lg"
          style={{
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
function DefaultAvatar({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="rounded-full shrink-0">
      <circle cx="16" cy="16" r="16" fill="#e5e7eb" />
      <circle cx="16" cy="13" r="5" fill="#9ca3af" />
      <path d="M6 26c0-5.523 4.477-10 10-10s10 4.477 10 10" fill="#9ca3af" />
    </svg>
  )
}

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
    <div className="mb-8 pb-8 border-b border-[#f0f0f0]">
      <div className="flex items-baseline gap-2 mb-4">
        <h3 className="text-[15px] font-medium m-0">{title}</h3>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
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
    <div className="mb-[18px]">
      <label className="block text-[13px] font-medium text-[#444] mb-1.5">
        {label}
        {required && <span className="text-[#E74C3C]"> *</span>}
        {hint && <span className="font-normal text-gray-400"> — {hint}</span>}
      </label>
      {children}
    </div>
  )
}
