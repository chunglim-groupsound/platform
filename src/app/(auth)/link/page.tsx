'use client'
// src/app/(auth)/link/page.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { Kicker } from '@/components/ui/Kicker'
import { Chip } from '@/components/ui/Chip'
import { ButtonPrimary, ButtonGhost } from '@/components/ui/Button'

// ─── 상수 ──────────────────────────────────────────────────────────────────
const SESSION_OPTIONS = ['보컬', '기타', '베이스', '드럼', '건반']

const GENRE_OPTIONS = ['록', '팝', '인디', '재즈', 'R&B', '메탈', '힙합', '발라드', '펑크', '포크']

const SCHOOL_YEAR_OPTIONS = [
  { value: 'YEAR_1',    label: '1학년' },
  { value: 'YEAR_2',    label: '2학년' },
  { value: 'YEAR_3',    label: '3학년' },
  { value: 'YEAR_4',    label: '4학년' },
  { value: 'YEAR_5',    label: '5학년' },
  { value: 'COMPLETED', label: '수료' },
]

// ─── 유틸 ──────────────────────────────────────────────────────────────────
function formatAuthKey(raw: string): string {
  const s = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12)
  const p: string[] = []
  if (s.length > 0) p.push(s.slice(0, 4))
  if (s.length > 4) p.push(s.slice(4, 8))
  if (s.length > 8) p.push(s.slice(8, 12))
  return p.join('-')
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────
export default function LinkPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState<'key' | 'profile'>('key')

  // step 1
  const [authKey,    setAuthKey]    = useState('')
  const [shake,      setShake]      = useState(false)
  const [step1Error, setStep1Error] = useState<string | null>(null)
  const [searching,  setSearching]  = useState(false)
  const [foundUser,  setFoundUser]  = useState<{ id: string; name: string; generation: number | null } | null>(null)

  // step 2
  const [kakaoAvatarUrl, setKakaoAvatarUrl] = useState<string | null>(null)
  const [useKakaoPhoto,  setUseKakaoPhoto]  = useState(true)
  const [nickname,       setNickname]       = useState('')
  const [sessions,       setSessions]       = useState<string[]>([])
  const [sessionYears,   setSessionYears]   = useState<Record<string, string>>({})
  const [genres,         setGenres]         = useState<string[]>([])
  const [department,     setDepartment]     = useState('')
  const [studentId,      setStudentId]      = useState('')
  const [schoolYear,     setSchoolYear]     = useState('')
  const [phone,          setPhone]          = useState('')
  const [phonePrivate,   setPhonePrivate]   = useState(false)
  const [fieldErrors,    setFieldErrors]    = useState<Record<string, string>>({})
  const [submitting,     setSubmitting]     = useState(false)
  const [submitError,    setSubmitError]    = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/'); return }
      setKakaoAvatarUrl((user.user_metadata?.avatar_url as string | undefined) ?? null)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Step 1 핸들러 ──────────────────────────────────────────────────────
  const rawKey     = authKey.replace(/-/g, '')
  const isKeyReady = rawKey.length >= 6

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 600)
  }

  const handleAuthKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuthKey(formatAuthKey(e.target.value))
    setStep1Error(null)
  }

  const handleSearch = async () => {
    if (!isKeyReady || searching) return
    setSearching(true)
    setStep1Error(null)

    const res  = await fetch('/api/auth/link/search', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ auth_key: authKey }),
    })
    const data = await res.json()
    setSearching(false)

    if (res.status === 409) {
      setStep1Error('이미 연동된 인증키입니다.')
      triggerShake(); return
    }
    if (!res.ok) {
      setStep1Error(data.error ?? '인증키를 확인할 수 없습니다.')
      triggerShake(); return
    }

    setFoundUser(data.user)
    setStep('profile')
  }

  // ── Step 2 핸들러 ──────────────────────────────────────────────────────
  const toggleSession = (s: string) =>
    setSessions(prev => {
      if (prev.includes(s)) {
        setSessionYears(y => { const n = { ...y }; delete n[s]; return n })
        return prev.filter(x => x !== s)
      }
      return [...prev, s]
    })

  const clearErr = (key: string) =>
    setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n })

  const handleConfirm = async () => {
    const errs: Record<string, string> = {}
    if (sessions.length === 0) errs.sessions   = '세션을 1개 이상 선택해주세요.'
    if (!department.trim())    errs.department  = '학과를 입력해주세요.'
    if (!studentId.trim())     errs.studentId   = '학번을 입력해주세요.'
    if (!schoolYear)           errs.schoolYear  = '학년을 선택해주세요.'
    if (!phone.trim())         errs.phone       = '연락처를 입력해주세요.'

    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    if (!foundUser) return

    setSubmitting(true)
    setSubmitError(null)

    // 1. 계정 연동 확정
    const linkRes  = await fetch('/api/auth/link/confirm', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ targetUserId: foundUser.id }),
    })
    const linkData = await linkRes.json()

    if (!linkRes.ok) {
      setSubmitError(linkData.error ?? '연동에 실패했습니다.')
      setSubmitting(false)
      return
    }

    // 2. 프로필 정보 저장
    const patch: Record<string, unknown> = {
      session:          sessions,
      department:       department.trim(),
      student_id:       studentId.trim(),
      school_year:      schoolYear,
      phone:            phone.trim(),
      privacy_settings: { phone: phonePrivate ? 'admin' : 'member' },
    }

    if (nickname.trim()) patch.nickname = nickname.trim()

    const yearsObj: Record<string, number> = {}
    for (const [s, v] of Object.entries(sessionYears)) {
      const n = parseInt(v, 10)
      if (!isNaN(n) && n >= 0) yearsObj[s] = n
    }
    if (Object.keys(yearsObj).length > 0) patch.session_years = yearsObj

    if (kakaoAvatarUrl !== null) {
      patch.profile_image_url = useKakaoPhoto ? kakaoAvatarUrl : null
    }

    const patchRes = await fetch('/api/members/me', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(patch),
    })

    if (!patchRes.ok) {
      const pd = await patchRes.json()
      console.warn('프로필 저장 실패 (연동은 완료됨):', pd)
    }

    router.replace('/home')
  }

  // ── 렌더링 ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-12">
      <AmbientBackground />

      <div className="w-full max-w-[500px]">
        {/* 헤더 */}
        <div className="text-center mb-7">
          <Kicker className="justify-center mb-4">청림그룹사운드</Kicker>
          <h1 className="font-sans font-bold text-[24px] tracking-tight text-foreground m-0">
            기존 부원 계정 연동
          </h1>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center gap-2 mb-6">
          <StepDot
            number={1}
            label="인증키 확인"
            active={true}
            done={step === 'profile'}
          />
          <div className="flex-1 h-px bg-border" />
          <StepDot
            number={2}
            label="부원 정보 등록"
            active={step === 'profile'}
            done={false}
          />
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden">

          {/* ──────────────────── STEP 1: 인증키 입력 ──────────────────── */}
          {step === 'key' && (
            <div className="p-7">
              <p className="text-muted-foreground text-[13.5px] leading-[1.7] mb-6">
                운영진(회장·총무)에게 발급받은 인증키를 입력해주세요.
              </p>

              <label className="block text-[13px] font-semibold text-foreground mb-1.5">
                인증키
              </label>

              <input
                value={authKey}
                onChange={handleAuthKeyChange}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="CL00-XXXX-XXXX"
                maxLength={14}
                autoComplete="off"
                spellCheck={false}
                className={[
                  'w-full font-mono text-[15px] uppercase tracking-widest',
                  'bg-surface-elevated rounded-xl px-4 py-3 outline-none border',
                  'text-foreground placeholder:text-subtle-foreground',
                  'transition-colors',
                  step1Error
                    ? 'border-bad'
                    : 'border-border focus:border-accent',
                  shake ? 'animate-shake' : '',
                ].join(' ')}
              />

              {step1Error ? (
                <p className="text-bad text-[13px] mt-2">{step1Error}</p>
              ) : (
                <p className="text-subtle-foreground text-[12.5px] mt-2">
                  인증키는 회장·총무에게 발급받을 수 있어요
                </p>
              )}

              <div className="flex flex-col gap-2.5 mt-6">
                <ButtonPrimary
                  size="lg"
                  className="w-full"
                  onClick={handleSearch}
                  disabled={!isKeyReady || searching}
                >
                  {searching ? '확인 중...' : '인증키 확인'}
                </ButtonPrimary>
                <ButtonGhost
                  size="lg"
                  className="w-full"
                  onClick={() => router.push('/join')}
                >
                  뒤로
                </ButtonGhost>
              </div>
            </div>
          )}

          {/* ──────────────────── STEP 2: 부원 정보 등록 ──────────────────── */}
          {step === 'profile' && foundUser && (
            <div className="p-7">

              {/* 명단 확인 배너 */}
              <div className="flex items-center gap-2.5 bg-ok/10 border border-ok/25 rounded-xl px-4 py-3 mb-6">
                <CheckIcon />
                <span className="text-ok-bright font-semibold text-[14px]">
                  {foundUser.name} · {foundUser.generation != null ? `${foundUser.generation}기` : ''}
                </span>
              </div>

              {/* 잠긴 필드 그리드 */}
              <div className="grid grid-cols-2 gap-3 mb-7">
                <LockedField label="이름" value={foundUser.name} />
                <LockedField
                  label="기수"
                  value={foundUser.generation != null ? `${foundUser.generation}기` : '-'}
                />
              </div>

              {/* ── 프로필 ── */}
              <SectionLabel>프로필</SectionLabel>

              {/* 프로필 사진 */}
              {kakaoAvatarUrl && (
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-foreground mb-2">
                    프로필 사진
                  </label>
                  <div className="flex gap-2">
                    {(['카카오 프로필', '기본 이미지'] as const).map((opt, i) => {
                      const selected = i === 0 ? useKakaoPhoto : !useKakaoPhoto
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setUseKakaoPhoto(i === 0)}
                          className={[
                            'flex-1 py-2 rounded-lg text-[13px] font-medium border transition-colors',
                            selected
                              ? 'bg-accent-muted border-accent/40 text-accent'
                              : 'bg-surface-elevated border-border text-muted-foreground hover:text-foreground',
                          ].join(' ')}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 닉네임 */}
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-foreground mb-1.5">
                  닉네임
                  <span className="text-subtle-foreground font-normal ml-1.5">선택 · 최대 20자</span>
                </label>
                <input
                  value={nickname}
                  onChange={e => setNickname(e.target.value.slice(0, 20))}
                  placeholder="플랫폼에서 사용할 닉네임"
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-[14px] text-foreground placeholder:text-subtle-foreground outline-none focus:border-accent transition-colors"
                />
              </div>

              {/* ── 음악 활동 ── */}
              <SectionLabel className="mt-6">음악 활동</SectionLabel>

              {/* 세션 */}
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-foreground mb-2">
                  세션
                  <span className="text-bad ml-0.5">*</span>
                  <span className="text-subtle-foreground font-normal ml-1.5">복수 선택 가능</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SESSION_OPTIONS.map(s => (
                    <Chip
                      key={s}
                      selected={sessions.includes(s)}
                      onToggle={() => { toggleSession(s); clearErr('sessions') }}
                    >
                      {s}
                    </Chip>
                  ))}
                </div>
                {fieldErrors.sessions && (
                  <p className="text-bad text-[12.5px] mt-1.5">{fieldErrors.sessions}</p>
                )}
              </div>

              {/* 경력 연차 */}
              {sessions.length > 0 && (
                <div className="mb-4 bg-surface-elevated border border-border-subtle rounded-xl p-4">
                  <p className="text-[12.5px] text-muted-foreground mb-3">경력 연차 (선택)</p>
                  <div className="flex flex-col gap-2.5">
                    {sessions.map(s => (
                      <div key={s} className="flex items-center gap-3">
                        <span className="text-[13px] text-foreground w-14 shrink-0">{s}</span>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          placeholder="0"
                          value={sessionYears[s] ?? ''}
                          onChange={e => setSessionYears(y => ({ ...y, [s]: e.target.value }))}
                          className="w-20 bg-surface border border-border rounded-lg px-3 py-1.5 text-[13px] text-foreground text-center outline-none focus:border-accent transition-colors"
                        />
                        <span className="text-[13px] text-muted-foreground">년</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 선호 장르 */}
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-foreground mb-2">
                  선호 장르
                  <span className="text-subtle-foreground font-normal ml-1.5">선택 · 복수 가능</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map(g => (
                    <Chip
                      key={g}
                      selected={genres.includes(g)}
                      onToggle={() =>
                        setGenres(prev =>
                          prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
                        )
                      }
                    >
                      {g}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* ── 학적·연락처 ── */}
              <SectionLabel className="mt-6">학적 · 연락처</SectionLabel>

              {/* 학과 */}
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-foreground mb-1.5">
                  학과 <span className="text-bad">*</span>
                </label>
                <input
                  value={department}
                  onChange={e => { setDepartment(e.target.value); clearErr('department') }}
                  placeholder="예) 컴퓨터공학과"
                  className={[
                    'w-full bg-surface-elevated rounded-xl px-4 py-2.5 text-[14px]',
                    'text-foreground placeholder:text-subtle-foreground outline-none transition-colors border',
                    fieldErrors.department ? 'border-bad' : 'border-border focus:border-accent',
                  ].join(' ')}
                />
                {fieldErrors.department && (
                  <p className="text-bad text-[12.5px] mt-1.5">{fieldErrors.department}</p>
                )}
              </div>

              {/* 학번 + 학년 */}
              <div className="grid grid-cols-[1fr_148px] gap-3 mb-4">
                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-1.5">
                    학번 <span className="text-bad">*</span>
                  </label>
                  <input
                    value={studentId}
                    onChange={e => { setStudentId(e.target.value.replace(/\D/g, '')); clearErr('studentId') }}
                    placeholder="예) 20210001"
                    className={[
                      'w-full bg-surface-elevated rounded-xl px-4 py-2.5 text-[14px]',
                      'text-foreground placeholder:text-subtle-foreground outline-none transition-colors border',
                      fieldErrors.studentId ? 'border-bad' : 'border-border focus:border-accent',
                    ].join(' ')}
                  />
                  {fieldErrors.studentId && (
                    <p className="text-bad text-[12.5px] mt-1.5">{fieldErrors.studentId}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-foreground mb-1.5">
                    학년 <span className="text-bad">*</span>
                  </label>
                  <select
                    value={schoolYear}
                    onChange={e => { setSchoolYear(e.target.value); clearErr('schoolYear') }}
                    className={[
                      'w-full bg-surface-elevated rounded-xl px-4 py-2.5 text-[14px]',
                      'text-foreground outline-none transition-colors border appearance-none',
                      fieldErrors.schoolYear ? 'border-bad' : 'border-border focus:border-accent',
                    ].join(' ')}
                  >
                    <option value="">선택</option>
                    {SCHOOL_YEAR_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {fieldErrors.schoolYear && (
                    <p className="text-bad text-[12.5px] mt-1.5">{fieldErrors.schoolYear}</p>
                  )}
                </div>
              </div>

              {/* 연락처 */}
              <div className="mb-4">
                <label className="block text-[13px] font-semibold text-foreground mb-1.5">
                  연락처 <span className="text-bad">*</span>
                </label>
                <input
                  value={phone}
                  onChange={e => { setPhone(formatPhone(e.target.value)); clearErr('phone') }}
                  placeholder="010-0000-0000"
                  className={[
                    'w-full bg-surface-elevated rounded-xl px-4 py-2.5 text-[14px]',
                    'text-foreground placeholder:text-subtle-foreground outline-none transition-colors border',
                    fieldErrors.phone ? 'border-bad' : 'border-border focus:border-accent',
                  ].join(' ')}
                />
                {fieldErrors.phone && (
                  <p className="text-bad text-[12.5px] mt-1.5">{fieldErrors.phone}</p>
                )}

                {/* 연락처 비공개 토글 */}
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[13px] text-foreground font-medium">연락처 비공개</span>
                    <p className="text-subtle-foreground text-[12px] mt-0.5">
                      {phonePrivate ? '운영진에게만 공개됩니다' : '부원들에게 공개됩니다'}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={phonePrivate}
                    onClick={() => setPhonePrivate(v => !v)}
                    className={[
                      'relative w-[40px] h-[24px] rounded-full transition-colors shrink-0',
                      phonePrivate ? 'bg-accent' : 'bg-border',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute top-[4px] w-[16px] h-[16px] rounded-full bg-white transition-transform',
                        phonePrivate ? 'translate-x-[20px]' : 'translate-x-[4px]',
                      ].join(' ')}
                    />
                  </button>
                </div>
              </div>

              {/* 제출 오류 */}
              {submitError && (
                <div className="bg-bad/10 border border-bad/25 rounded-xl px-4 py-3 mb-4">
                  <p className="text-bad text-[13.5px] m-0">{submitError}</p>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex flex-col gap-2.5 mt-6">
                <ButtonPrimary
                  size="lg"
                  className="w-full"
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {submitting ? '처리 중...' : '연동하고 입장하기'}
                </ButtonPrimary>
                <ButtonGhost
                  size="lg"
                  className="w-full"
                  onClick={() => setStep('key')}
                  disabled={submitting}
                >
                  뒤로
                </ButtonGhost>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── 소형 헬퍼 컴포넌트 ───────────────────────────────────────────────────

function StepDot({
  number,
  label,
  active,
  done,
}: {
  number: number
  label: string
  active: boolean
  done: boolean
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        className={[
          'w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors',
          done
            ? 'bg-ok text-white'
            : active
            ? 'bg-accent text-accent-foreground'
            : 'bg-surface-elevated border border-border text-subtle-foreground',
        ].join(' ')}
      >
        {done ? '✓' : number}
      </div>
      <span
        className={[
          'text-[12.5px] font-medium',
          active ? 'text-foreground' : 'text-muted-foreground',
        ].join(' ')}
      >
        {label}
      </span>
    </div>
  )
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-muted-foreground mb-1">{label}</label>
      <div className="flex items-center gap-2 bg-surface-elevated border border-border rounded-xl px-4 py-2.5">
        <span className="text-[14px] text-foreground flex-1 truncate">{value}</span>
        <svg
          width="13" height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-subtle-foreground shrink-0"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
    </div>
  )
}

function SectionLabel({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-center gap-3 mb-4 ${className}`}>
      <span className="font-mono text-[11px] text-accent uppercase tracking-[0.12em] shrink-0">
        {children}
      </span>
      <div className="flex-1 h-px bg-border-subtle" />
    </div>
  )
}

function CheckIcon() {
  return (
    <svg
      width="16" height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-ok-bright shrink-0"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
