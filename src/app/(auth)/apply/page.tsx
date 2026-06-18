'use client'
// src/app/(auth)/apply/page.tsx
// 신규 부원 지원서 폼 + 가입 진행 상황 (같은 URL /apply)

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { Kicker } from '@/components/ui/Kicker'
import { Chip } from '@/components/ui/Chip'
import { ButtonPrimary, ButtonGhost } from '@/components/ui/Button'

// ─────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────
const SESSION_OPTIONS = ['보컬', '기타', '베이스', '드럼', '건반']
const GENRE_OPTIONS   = ['록', '팝', '인디', '재즈', 'R&B', '메탈', '발라드', '포크']
const SCHOOL_YEAR_OPTIONS = [
  { value: 'YEAR_1',    label: '1학년' },
  { value: 'YEAR_2',    label: '2학년' },
  { value: 'YEAR_3',    label: '3학년' },
  { value: 'YEAR_4',    label: '4학년' },
  { value: 'YEAR_5',    label: '5학년' },
  { value: 'COMPLETED', label: '수료' },
  { value: 'ON_LEAVE',  label: '휴학' },
  { value: 'GRADUATED', label: '졸업' },
]

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
interface Slot {
  id: string
  slot_at: string
  capacity: number
}

interface ApplicationData {
  id: string
  interview_result: 'PENDING' | 'PASS' | 'FAIL'
  confirmed_slot_id: string | null
  created_at: string
  confirmed_slot?: { slot_at: string } | null
}

interface UserProfile {
  id: string
  name: string
  session: string[] | null
  department: string | null
}

type Step = 'doc' | 'interview' | 'await' | 'result_pass' | 'result_fail'

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function groupSlotsByDate(slots: Slot[]): Record<string, Slot[]> {
  const groups: Record<string, Slot[]> = {}
  for (const slot of slots) {
    const d = new Date(slot.slot_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(slot)
  }
  return groups
}

function determinStep(app: ApplicationData): Step {
  if (app.interview_result === 'PASS') return 'result_pass'
  if (app.interview_result === 'FAIL') return 'result_fail'
  if (!app.confirmed_slot_id) return 'doc'
  const slotAt = app.confirmed_slot?.slot_at
  if (slotAt && new Date(slotAt) < new Date()) return 'await'
  return 'interview'
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function ApplyPage() {
  const router  = useRouter()
  const supabase = createClient()

  type View = 'loading' | 'unauthorized' | 'closed' | 'form' | 'status'
  const [view, setView] = useState<View>('loading')

  // 폼 상태
  const [name,         setName]         = useState('')
  const [nickname,     setNickname]     = useState('')
  const [sessions,     setSessions]     = useState<string[]>([])
  const [sessionYears, setSessionYears] = useState<Record<string, string>>({})
  const [genres,       setGenres]       = useState<string[]>([])
  const [department,   setDepartment]   = useState('')
  const [studentId,    setStudentId]    = useState('')
  const [schoolYear,   setSchoolYear]   = useState('')
  const [phone,        setPhone]        = useState('')
  const [motivation,   setMotivation]   = useState('')
  const [selfIntro,    setSelfIntro]    = useState('')
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [slots,        setSlots]        = useState<Slot[]>([])
  const [fieldErrors,  setFieldErrors]  = useState<Record<string, string>>({})
  const [submitting,   setSubmitting]   = useState(false)
  const [submitError,  setSubmitError]  = useState<string | null>(null)

  // 상태 화면 데이터
  const [application, setApplication]  = useState<ApplicationData | null>(null)
  const [userProfile, setUserProfile]  = useState<UserProfile | null>(null)
  const [prefSlots,   setPrefSlots]    = useState<string[]>([])
  const [allSlots,    setAllSlots]     = useState<Slot[]>([])

  // 면접 시간대 변경 모달
  const [showSlotEdit, setShowSlotEdit] = useState(false)
  const [editSlots,    setEditSlots]    = useState<string[]>([])
  const [savingSlots,  setSavingSlots]  = useState(false)

  // ── 초기 로드 ───────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/'); return }

      // 프로필 조회
      const { data: profile } = await supabase
        .from('users')
        .select('id, name, nickname, session, department, status')
        .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
        .maybeSingle()

      // 이미 PENDING이 아닌 유저
      if (profile && profile.status !== 'PENDING') {
        router.replace('/home'); return
      }

      // 기존 신청서 확인
      if (profile) {
        const { data: app } = await supabase
          .from('join_applications')
          .select('id, interview_result, confirmed_slot_id, created_at')
          .eq('user_id', profile.id)
          .maybeSingle()

        if (app) {
          // 전체 슬롯 조회 (API 경유)
          const slotsRes = await fetch('/api/interview-slots')
          const slotsData: Slot[] = slotsRes.ok ? await slotsRes.json() : []
          setAllSlots(slotsData)

          // 확정 슬롯
          const confirmedSlot = app.confirmed_slot_id
            ? (slotsData.find(s => s.id === app.confirmed_slot_id) ?? null)
            : null

          // 희망 슬롯 (API 경유)
          const prefsRes = await fetch('/api/interview-preferences')
          const prefsData: string[] = prefsRes.ok ? await prefsRes.json() : []
          setPrefSlots(prefsData)

          setApplication({
            ...app,
            confirmed_slot: confirmedSlot ? { slot_at: confirmedSlot.slot_at } : null,
          })
          setUserProfile(profile as UserProfile)
          setView('status')
          return
        }
      }

      // 신규 — 모집 기간 확인
      const recRes = await fetch('/api/settings/recruitment')
      const recData = await recRes.json()
      if (!recData.is_open) { setView('closed'); return }

      // 슬롯 목록 (API 경유)
      const slotsRes = await fetch('/api/interview-slots')
      if (slotsRes.ok) {
        const slotsData: Slot[] = await slotsRes.json()
        setSlots(slotsData)
      }

      // 카카오 정보 pre-fill
      const kakaoName = (user.user_metadata?.name as string | undefined) ?? ''
      if (kakaoName) setName(kakaoName)

      setView('form')
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 폼 유효성 검사 ──────────────────────────
  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (!name.trim())           errs.name       = '이름을 입력해주세요.'
    if (sessions.length === 0)  errs.sessions   = '세션을 하나 이상 선택해주세요.'
    if (!department.trim())     errs.department = '학과를 입력해주세요.'
    if (!studentId.trim())      errs.studentId  = '학번을 입력해주세요.'
    if (!schoolYear)            errs.schoolYear = '학년을 선택해주세요.'
    if (!phone.trim())          errs.phone      = '연락처를 입력해주세요.'
    if (!motivation.trim())     errs.motivation = '지원 동기를 입력해주세요.'
    if (!selfIntro.trim())      errs.selfIntro  = '자기소개를 입력해주세요.'
    if (selectedSlots.length === 0) errs.slots  = '면접 희망 시간을 1개 이상 선택해주세요.'
    return errs
  }

  // ── 폼 제출 ─────────────────────────────────
  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }

    setSubmitting(true)
    setSubmitError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitError('로그인이 필요합니다.'); setSubmitting(false); return }

    const kakaoId = user.user_metadata?.provider_id ?? user.id

    const yearsObj: Record<string, number> = {}
    for (const [s, v] of Object.entries(sessionYears)) {
      const n = parseInt(v, 10)
      if (!isNaN(n) && n >= 0) yearsObj[s] = n
    }

    // users upsert
    const { error: uErr } = await supabase
      .from('users')
      .upsert({
        id:               user.id,
        kakao_id:         kakaoId,
        name:             name.trim(),
        nickname:         nickname.trim() || null,
        session:          sessions,
        session_years:    Object.keys(yearsObj).length > 0 ? yearsObj : null,
        genre_preference: genres,
        department:       department.trim(),
        student_id:       studentId.trim(),
        school_year:      schoolYear as 'YEAR_1'|'YEAR_2'|'YEAR_3'|'YEAR_4'|'YEAR_5'|'COMPLETED'|'ON_LEAVE'|'GRADUATED',
        phone:            phone.trim() || null,
        privacy_agreed_at: new Date().toISOString(),
      })

    if (uErr) { setSubmitError('정보 저장 실패: ' + uErr.message); setSubmitting(false); return }

    // join_applications insert
    const { data: newApp, error: aErr } = await supabase
      .from('join_applications')
      .insert({ user_id: user.id, motivation: motivation.trim(), self_intro: selfIntro.trim() })
      .select('id')
      .single()

    if (aErr || !newApp) { setSubmitError('신청서 저장 실패: ' + (aErr?.message ?? '')); setSubmitting(false); return }

    // interview_preferences 등록 (API 경유)
    if (selectedSlots.length > 0) {
      await fetch('/api/interview-preferences', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slotIds: selectedSlots }),
      })
    }

    // 상태 화면으로 전환
    setApplication({
      id:                newApp.id,
      interview_result:  'PENDING',
      confirmed_slot_id: null,
      created_at:        new Date().toISOString(),
      confirmed_slot:    null,
    })
    setUserProfile({ id: user.id, name: name.trim(), session: sessions, department: department.trim() })
    setPrefSlots(selectedSlots)
    setAllSlots(slots)
    setView('status')
  }

  // ── 희망 슬롯 변경 저장 ──────────────────────
  const handleSaveSlots = async () => {
    if (!application) return
    setSavingSlots(true)
    const res = await fetch('/api/interview-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotIds: editSlots }),
    })
    setSavingSlots(false)
    if (res.ok) {
      setPrefSlots(editSlots)
      setShowSlotEdit(false)
    }
  }

  // ─────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (view === 'unauthorized') {
    return null
  }

  if (view === 'closed') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-12">
        <AmbientBackground />
        <div className="w-full max-w-[440px] text-center">
          <Kicker className="justify-center mb-5">청림그룹사운드</Kicker>
          <div className="text-[40px] mb-4">🔒</div>
          <h1 className="font-sans font-bold text-[22px] text-foreground mb-3">모집 기간이 아닙니다</h1>
          <p className="text-[14px] text-muted-foreground leading-[1.7]">
            신규 부원 모집 기간이 아닙니다.<br />다음 모집 공고를 기다려주세요.
          </p>
          <div className="mt-8">
            <ButtonGhost onClick={() => router.push('/')}>홈으로 돌아가기</ButtonGhost>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'status' && application && userProfile) {
    return <StatusView
      application={application}
      userProfile={userProfile}
      prefSlots={prefSlots}
      allSlots={allSlots}
      showSlotEdit={showSlotEdit}
      editSlots={editSlots}
      savingSlots={savingSlots}
      onOpenSlotEdit={() => { setEditSlots(prefSlots); setShowSlotEdit(true) }}
      onCloseSlotEdit={() => setShowSlotEdit(false)}
      onToggleEditSlot={(id) => setEditSlots(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
      onSaveSlots={handleSaveSlots}
    />
  }

  // ── 지원서 폼 ────────────────────────────────
  const clearErr = (key: string) => setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  const slotGroups = groupSlotsByDate(slots)

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-5 py-12">
      <AmbientBackground />

      <div className="w-full max-w-[540px]">
        {/* 헤더 */}
        <div className="mb-8">
          <Kicker className="mb-4">청림그룹사운드</Kicker>
          <h1 className="font-sans font-bold text-[26px] tracking-tight text-foreground m-0 mb-1.5">
            신규 부원 지원서
          </h1>
          <p className="text-[13.5px] text-muted-foreground m-0">
            <span className="text-bad">*</span> 표시 항목은 필수입니다.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">

          {/* ── 01 프로필 ── */}
          <FormSection label="01" title="프로필">
            <FieldRow>
              <FormField label="이름" required error={fieldErrors.name}>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); clearErr('name') }}
                  placeholder="실명을 입력해주세요"
                  className={inputCls(!!fieldErrors.name)}
                />
              </FormField>
              <FormField label="닉네임" hint="선택 · 최대 20자">
                <input
                  value={nickname}
                  onChange={e => setNickname(e.target.value.slice(0, 20))}
                  placeholder="활동 닉네임 (없으면 이름 사용)"
                  className={inputCls(false)}
                />
              </FormField>
            </FieldRow>
          </FormSection>

          {/* ── 02 음악 활동 ── */}
          <FormSection label="02" title="음악 활동">
            <FormField label="지원 세션" required error={fieldErrors.sessions}>
              <div className="flex flex-wrap gap-2">
                {SESSION_OPTIONS.map(s => (
                  <Chip
                    key={s}
                    selected={sessions.includes(s)}
                    onToggle={() => {
                      setSessions(prev => {
                        if (prev.includes(s)) {
                          setSessionYears(y => { const n = { ...y }; delete n[s]; return n })
                          return prev.filter(x => x !== s)
                        }
                        return [...prev, s]
                      })
                      clearErr('sessions')
                    }}
                  >
                    {s}
                  </Chip>
                ))}
              </div>
            </FormField>

            {sessions.length > 0 && (
              <div className="mt-3 bg-surface-elevated border border-border-subtle rounded-xl p-4">
                <p className="text-[12px] text-subtle-foreground mb-3">경력 연차 (선택)</p>
                <div className="flex flex-col gap-2.5">
                  {sessions.map(s => (
                    <div key={s} className="flex items-center gap-3">
                      <span className="text-[13px] text-foreground w-12 shrink-0">{s}</span>
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

            <FormField label="선호 장르" hint="선택 · 복수 가능" className="mt-4">
              <div className="flex flex-wrap gap-2">
                {GENRE_OPTIONS.map(g => (
                  <Chip
                    key={g}
                    selected={genres.includes(g)}
                    onToggle={() => setGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                  >
                    {g}
                  </Chip>
                ))}
              </div>
            </FormField>
          </FormSection>

          {/* ── 03 학적·연락처 ── */}
          <FormSection label="03" title="학적 · 연락처">
            <FormField label="학과" required error={fieldErrors.department}>
              <input
                value={department}
                onChange={e => { setDepartment(e.target.value); clearErr('department') }}
                placeholder="예) 컴퓨터공학과"
                className={inputCls(!!fieldErrors.department)}
              />
            </FormField>

            <FieldRow>
              <FormField label="학번" required error={fieldErrors.studentId}>
                <input
                  value={studentId}
                  onChange={e => { setStudentId(e.target.value.replace(/\D/g, '')); clearErr('studentId') }}
                  placeholder="예) 20210001"
                  className={inputCls(!!fieldErrors.studentId)}
                />
              </FormField>
              <FormField label="학년" required error={fieldErrors.schoolYear}>
                <select
                  value={schoolYear}
                  onChange={e => { setSchoolYear(e.target.value); clearErr('schoolYear') }}
                  className={`${inputCls(!!fieldErrors.schoolYear)} appearance-none`}
                >
                  <option value="">선택</option>
                  {SCHOOL_YEAR_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </FormField>
            </FieldRow>

            <FormField label="연락처" required error={fieldErrors.phone}>
              <input
                value={phone}
                onChange={e => { setPhone(formatPhone(e.target.value)); clearErr('phone') }}
                placeholder="010-0000-0000"
                className={inputCls(!!fieldErrors.phone)}
              />
            </FormField>
          </FormSection>

          {/* ── 04 지원 동기 ── */}
          <FormSection label="04" title="지원 내용">
            <FormField
              label="자기소개"
              required
              hint={`${selfIntro.length}/200`}
              error={fieldErrors.selfIntro}
            >
              <textarea
                value={selfIntro}
                onChange={e => { setSelfIntro(e.target.value.slice(0, 200)); clearErr('selfIntro') }}
                placeholder="본인을 자유롭게 소개해주세요."
                rows={4}
                className={`${inputCls(!!fieldErrors.selfIntro)} resize-y leading-[1.6]`}
              />
            </FormField>

            <FormField
              label="지원 동기"
              required
              hint={`${motivation.length}/200`}
              error={fieldErrors.motivation}
              className="mt-4"
            >
              <textarea
                value={motivation}
                onChange={e => { setMotivation(e.target.value.slice(0, 200)); clearErr('motivation') }}
                placeholder="청림그룹사운드에 지원하게 된 계기를 알려주세요."
                rows={4}
                className={`${inputCls(!!fieldErrors.motivation)} resize-y leading-[1.6]`}
              />
            </FormField>
          </FormSection>

          {/* ── 05 희망 면접 시간대 ── */}
          <FormSection label="05" title="희망 면접 시간대" last>
            <p className="text-[13px] text-muted-foreground mb-4">
              희망하는 면접 일시를 1개 이상 선택해주세요. 제출 후에도 변경 요청 가능합니다.
            </p>

            {slots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-[13.5px]">
                등록된 면접 일정이 없습니다. 운영진에게 문의해주세요.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {Object.entries(slotGroups).map(([date, dateSlots]) => {
                  const d = new Date(date)
                  const days = ['일', '월', '화', '수', '목', '금', '토']
                  const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
                  return (
                    <div key={date}>
                      <div className="text-[12px] font-semibold text-muted-foreground mb-2 font-mono uppercase tracking-[0.06em]">
                        {dateLabel}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {dateSlots.map(slot => {
                          const t = new Date(slot.slot_at)
                          const timeLabel = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
                          const isPast = t < new Date()
                          const selected = selectedSlots.includes(slot.id)
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={isPast}
                              onClick={() => {
                                setSelectedSlots(prev =>
                                  prev.includes(slot.id)
                                    ? prev.filter(x => x !== slot.id)
                                    : [...prev, slot.id]
                                )
                                clearErr('slots')
                              }}
                              className={[
                                'flex items-center justify-between px-4 py-3 rounded-xl border text-left',
                                'text-[13.5px] transition-colors',
                                isPast
                                  ? 'opacity-40 cursor-not-allowed bg-surface-elevated border-border text-muted-foreground'
                                  : selected
                                  ? 'bg-accent-muted border-accent/40 text-accent'
                                  : 'bg-surface-elevated border-border hover:border-border text-foreground hover:bg-surface',
                              ].join(' ')}
                            >
                              <span className="font-medium">{timeLabel}</span>
                              {isPast
                                ? <span className="text-[11.5px] text-subtle-foreground">마감</span>
                                : selected
                                ? <span className="text-[11.5px] text-accent font-semibold">선택됨 ✓</span>
                                : <span className="text-[11.5px] text-subtle-foreground">선택</span>
                              }
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {fieldErrors.slots && (
              <p className="text-bad text-[12.5px] mt-2">{fieldErrors.slots}</p>
            )}
          </FormSection>
        </div>

        {/* 에러 */}
        {submitError && (
          <div className="bg-bad/10 border border-bad/25 rounded-xl px-4 py-3 mb-4">
            <p className="text-bad text-[13.5px] m-0">{submitError}</p>
          </div>
        )}

        {/* 제출 */}
        <div className="flex flex-col gap-2.5">
          <ButtonPrimary
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '제출 중...' : '지원서 제출하기'}
          </ButtonPrimary>
          <ButtonGhost
            size="lg"
            className="w-full"
            onClick={() => router.push('/join')}
            disabled={submitting}
          >
            뒤로
          </ButtonGhost>
        </div>

        <p className="text-center text-[12.5px] text-subtle-foreground mt-5">
          제출 후에도 면접 시간대는 변경 요청 가능합니다
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// 진행 상황 화면 컴포넌트
// ─────────────────────────────────────────────
function StatusView({
  application,
  userProfile,
  prefSlots,
  allSlots,
  showSlotEdit,
  editSlots,
  savingSlots,
  onOpenSlotEdit,
  onCloseSlotEdit,
  onToggleEditSlot,
  onSaveSlots,
}: {
  application: ApplicationData
  userProfile: UserProfile
  prefSlots: string[]
  allSlots: Slot[]
  showSlotEdit: boolean
  editSlots: string[]
  savingSlots: boolean
  onOpenSlotEdit: () => void
  onCloseSlotEdit: () => void
  onToggleEditSlot: (id: string) => void
  onSaveSlots: () => void
}) {
  const step = determinStep(application)

  const stepConfig: Record<Step, {
    hero: string
    heroSub: string
    color: string
    bgColor: string
  }> = {
    doc:         { hero: '서류를 검토하고 있어요', heroSub: '면접 일정이 확정되면 알림을 드려요.', color: 'text-accent',     bgColor: 'bg-accent-muted border-accent/20' },
    interview:   { hero: '면접 일정이 확정됐어요', heroSub: '아래 일정에 맞춰 면접에 참여해주세요.', color: 'text-ok-bright',  bgColor: 'bg-ok/10 border-ok/25' },
    await:       { hero: '결과를 집계하고 있어요', heroSub: '합격 여부를 곧 알려드릴게요.', color: 'text-muted-foreground', bgColor: 'bg-surface-elevated border-border' },
    result_pass: { hero: '합격을 축하드립니다! 🎉', heroSub: '운영진이 입장을 승인하면 활동을 시작할 수 있어요.', color: 'text-ok-bright', bgColor: 'bg-ok/10 border-ok/25' },
    result_fail: { hero: '아쉽게도 불합격입니다', heroSub: '다음 모집 때 다시 도전해주세요.', color: 'text-bad', bgColor: 'bg-bad/10 border-bad/25' },
  }

  const cfg = stepConfig[step]
  const slotGroups = groupSlotsByDate(allSlots)

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-5 py-12">
      <AmbientBackground />

      <div className="w-full max-w-[540px]">
        {/* 헤더 */}
        <div className="mb-7">
          <Kicker className="mb-4">신규 부원 · 가입 현황</Kicker>
          <h1 className="font-sans font-bold text-[26px] tracking-tight text-foreground m-0">
            지원 현황
          </h1>
        </div>

        {/* 스테퍼 */}
        {(() => {
          const labels = ['서류 확인', '면접', '결과']
          const stepKeys = ['doc', 'interview', 'result_pass'] as const
          return (
            <div className="flex items-center gap-1.5 mb-7">
              {stepKeys.map((s, i) => {
                const isDone =
                  (i === 0 && (step === 'interview' || step === 'await' || step === 'result_pass' || step === 'result_fail')) ||
                  (i === 1 && (step === 'await' || step === 'result_pass' || step === 'result_fail'))
                const isActive =
                  (i === 0 && step === 'doc') ||
                  (i === 1 && (step === 'interview' || step === 'await')) ||
                  (i === 2 && (step === 'result_pass' || step === 'result_fail'))
                return (
                  <div key={s} className="flex items-center gap-1.5 shrink-0">
                    {i > 0 && <div className={`w-8 h-px ${isDone ? 'bg-ok' : 'bg-border'}`} />}
                    <div className="flex items-center gap-2">
                      <div className={[
                        'w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors',
                        isDone ? 'bg-ok text-white' : isActive ? 'bg-accent text-accent-foreground' : 'bg-surface-elevated border border-border text-subtle-foreground',
                      ].join(' ')}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span className={`text-[12.5px] font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {labels[i]}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* Hero 배너 */}
        <div className={`rounded-2xl border px-6 py-5 mb-5 ${cfg.bgColor}`}>
          <h2 className={`font-sans font-bold text-[20px] tracking-tight m-0 mb-1 ${cfg.color}`}>
            {cfg.hero}
          </h2>
          <p className="text-[13.5px] text-muted-foreground m-0">{cfg.heroSub}</p>
        </div>

        {/* 단계별 본문 */}
        {step === 'doc' && (
          <div className="bg-surface border border-border rounded-2xl p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans font-semibold text-[15px] text-foreground m-0">
                희망 면접 시간대
              </h3>
              <button
                type="button"
                onClick={onOpenSlotEdit}
                className="text-[12.5px] text-accent font-semibold hover:text-accent-hover transition-colors"
              >
                변경하기
              </button>
            </div>

            {prefSlots.length === 0 ? (
              <p className="text-[13.5px] text-muted-foreground">선택된 희망 시간대가 없습니다.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {allSlots
                  .filter(s => prefSlots.includes(s.id))
                  .map(slot => (
                    <div
                      key={slot.id}
                      className="flex items-center gap-3 bg-surface-elevated border border-border-subtle rounded-xl px-4 py-3"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      <span className="text-[13.5px] text-foreground">{fmtDate(slot.slot_at)}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {(step === 'interview' || step === 'await') && application.confirmed_slot && (
          <div className="bg-surface border border-border rounded-2xl p-6 mb-5">
            <h3 className="font-sans font-semibold text-[15px] text-foreground m-0 mb-4">
              확정된 면접 일정
            </h3>
            <div className="flex items-center gap-4 bg-surface-elevated border border-border-subtle rounded-xl px-4 py-4">
              <div className="w-2 h-2 rounded-full bg-ok-bright shrink-0" />
              <div>
                <div className="text-[15px] font-semibold text-foreground">
                  {fmtDate(application.confirmed_slot.slot_at)}
                </div>
                {step === 'await' && (
                  <div className="text-[12.5px] text-muted-foreground mt-0.5">면접 완료 · 결과 대기 중</div>
                )}
              </div>
            </div>
          </div>
        )}

        {(step === 'result_pass' || step === 'result_fail') && (
          <div className={`rounded-2xl border px-6 py-5 mb-5 ${step === 'result_pass' ? 'bg-ok/10 border-ok/25' : 'bg-bad/10 border-bad/25'}`}>
            <p className={`text-[15px] font-semibold m-0 ${step === 'result_pass' ? 'text-ok-bright' : 'text-bad'}`}>
              {step === 'result_pass'
                ? '합격하셨습니다! 운영진의 최종 입장 승인을 기다려주세요.'
                : '이번 모집에서는 아쉽게도 함께하지 못했습니다. 다음 기회에 다시 도전해주세요.'}
            </p>
          </div>
        )}

        {/* 지원 정보 요약 */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="font-sans font-semibold text-[14px] text-muted-foreground m-0 mb-4 uppercase tracking-[0.08em] font-mono">
            지원 정보
          </h3>
          <div className="flex flex-col gap-3">
            <SummaryRow label="이름" value={userProfile.name} />
            <SummaryRow label="지원 세션" value={userProfile.session?.join(', ') ?? '-'} />
            <SummaryRow label="학과" value={userProfile.department ?? '-'} />
            <SummaryRow label="접수 일시" value={fmtDateTime(application.created_at)} />
          </div>
        </div>
      </div>

      {/* 면접 시간대 변경 모달 */}
      {showSlotEdit && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-5">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseSlotEdit} />
          <div className="relative z-10 w-full max-w-[480px] bg-surface border border-border rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="font-sans font-bold text-[18px] text-foreground m-0 mb-1.5">면접 일정 변경</h3>
            <p className="text-[13px] text-muted-foreground mb-5">희망하는 면접 시간대를 다시 선택해주세요.</p>

            <div className="flex flex-col gap-4 mb-6">
              {Object.entries(slotGroups).map(([date, dateSlots]) => {
                const d = new Date(date)
                const days = ['일', '월', '화', '수', '목', '금', '토']
                const dateLabel = `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
                return (
                  <div key={date}>
                    <div className="text-[12px] font-semibold text-muted-foreground mb-2 font-mono uppercase tracking-[0.06em]">
                      {dateLabel}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {dateSlots.map(slot => {
                        const t = new Date(slot.slot_at)
                        const timeLabel = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`
                        const isPast = t < new Date()
                        const selected = editSlots.includes(slot.id)
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isPast}
                            onClick={() => onToggleEditSlot(slot.id)}
                            className={[
                              'flex items-center justify-between px-4 py-3 rounded-xl border text-left text-[13.5px] transition-colors',
                              isPast ? 'opacity-40 cursor-not-allowed bg-surface-elevated border-border text-muted-foreground'
                              : selected ? 'bg-accent-muted border-accent/40 text-accent'
                              : 'bg-surface-elevated border-border text-foreground',
                            ].join(' ')}
                          >
                            <span className="font-medium">{timeLabel}</span>
                            {isPast ? <span className="text-[11.5px] text-subtle-foreground">마감</span>
                              : selected ? <span className="text-[11.5px] text-accent font-semibold">선택됨 ✓</span>
                              : <span className="text-[11.5px] text-subtle-foreground">선택</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-2">
              <ButtonPrimary
                size="lg"
                className="w-full"
                onClick={onSaveSlots}
                disabled={savingSlots || editSlots.length === 0}
              >
                {savingSlots ? '저장 중...' : '변경 저장하기'}
              </ButtonPrimary>
              <ButtonGhost size="lg" className="w-full" onClick={onCloseSlotEdit} disabled={savingSlots}>
                취소
              </ButtonGhost>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// 헬퍼 컴포넌트
// ─────────────────────────────────────────────
function inputCls(hasError: boolean) {
  return [
    'w-full bg-surface-elevated rounded-xl px-4 py-2.5 text-[14px]',
    'text-foreground placeholder:text-subtle-foreground outline-none transition-colors border',
    hasError ? 'border-bad' : 'border-border focus:border-accent',
  ].join(' ')
}

function FormSection({
  label,
  title,
  last = false,
  children,
}: {
  label: string
  title: string
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`p-6 ${!last ? 'border-b border-border-subtle' : ''}`}>
      <div className="flex items-center gap-3 mb-5">
        <span className="font-mono text-[11px] text-accent uppercase tracking-[0.12em]">{label}</span>
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="font-sans font-semibold text-[14px] text-foreground">{title}</span>
      </div>
      {children}
    </div>
  )
}

function FormField({
  label,
  required,
  hint,
  error,
  className = '',
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="block text-[13px] font-semibold text-foreground mb-1.5">
        {label}
        {required && <span className="text-bad ml-0.5">*</span>}
        {hint && <span className="text-subtle-foreground font-normal ml-1.5">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-bad text-[12.5px] mt-1.5">{error}</p>}
    </div>
  )
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[12.5px] text-subtle-foreground w-20 shrink-0">{label}</span>
      <span className="text-[13.5px] text-foreground">{value}</span>
    </div>
  )
}
