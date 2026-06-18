'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Chip } from '@/components/ui/Chip'
import { Badge, BadgeAccent } from '@/components/ui/Badge'
import { ButtonPrimary } from '@/components/ui/Button'
import { PrivacySettings } from './PrivacySettings'
import type { SchoolYearStatus } from '@/types/app'

const SESSION_OPTIONS = ['보컬', '기타', '베이스', '드럼', '건반', '기타(악기)']
const GENRE_OPTIONS   = ['록', '팝', '인디', '재즈', 'R&B', '메탈', '힙합', '발라드', '펑크', '포크']

// 수정 화면: 휴학·졸업 숨김 (체크리스트 명세)
const SCHOOL_YEAR_OPTIONS: { value: SchoolYearStatus; label: string }[] = [
  { value: 'YEAR_1',    label: '1학년' },
  { value: 'YEAR_2',    label: '2학년' },
  { value: 'YEAR_3',    label: '3학년' },
  { value: 'YEAR_4',    label: '4학년' },
  { value: 'YEAR_5',    label: '5학년' },
  { value: 'COMPLETED', label: '수료' },
]

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:      '개발 담당',
  ADMIN:            '운영진',
  MEMBER:           '정식 부원',
  PROBATION_MEMBER: '유예 부원',
}

interface ProfileData {
  id: string
  name: string
  nickname: string | null
  profile_image_url: string | null
  status: string
  role: string
  generation: number | null
  is_whitelist: boolean
  session: string[] | null
  session_years: Record<string, number> | null
  genre_preference: string[] | null
  phone: string | null
  department: string | null
  student_id: string | null
  school_year: SchoolYearStatus | null
  privacy_settings: Record<string, string>
}

interface FormState {
  nickname: string
  profile_image_url: string | null
  session: string[]
  session_years: Record<string, string>
  genre_preference: string[]
  phone: string
  department: string
  student_id: string
  school_year: SchoolYearStatus | ''
  privacy_settings: Record<string, string>
}

function toFormState(p: ProfileData): FormState {
  const sy: Record<string, string> = {}
  for (const s of (p.session ?? [])) {
    sy[s] = p.session_years?.[s]?.toString() ?? ''
  }
  return {
    nickname:          p.nickname ?? '',
    profile_image_url: p.profile_image_url ?? null,
    session:           p.session ?? [],
    session_years:     sy,
    genre_preference:  p.genre_preference ?? [],
    phone:             p.phone ?? '',
    department:        p.department ?? '',
    student_id:        p.student_id ?? '',
    school_year:       (p.school_year ?? '') as SchoolYearStatus | '',
    privacy_settings:  p.privacy_settings ?? {},
  }
}

export function ProfileForm({ profile, kakaoAvatarUrl, redirectAfterSave }: {
  profile: ProfileData
  kakaoAvatarUrl: string | null
  redirectAfterSave?: string
}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(() => toFormState(profile))
  const [original] = useState<FormState>(() => toFormState(profile))
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isDirty = JSON.stringify(form) !== JSON.stringify(original)

  const toggleSession = (s: string) => {
    setForm(f => {
      const next = f.session.includes(s) ? f.session.filter(x => x !== s) : [...f.session, s]
      const sy = { ...f.session_years }
      if (!next.includes(s)) delete sy[s]
      else if (!(s in sy)) sy[s] = ''
      return { ...f, session: next, session_years: sy }
    })
  }

  const toggleGenre = (g: string) => {
    setForm(f => ({
      ...f,
      genre_preference: f.genre_preference.includes(g)
        ? f.genre_preference.filter(x => x !== g)
        : [...f.genre_preference, g],
    }))
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (form.nickname.trim().length > 0 && form.nickname.trim().length > 20)
      e.nickname = '닉네임은 최대 20자입니다'
    if (form.session.length === 0)
      e.session = '세션은 최소 1개 이상 선택해야 합니다'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const syPayload: Record<string, number> = {}
      for (const [k, v] of Object.entries(form.session_years)) {
        if (v !== '') syPayload[k] = Number(v)
      }
      const payload: Record<string, unknown> = {
        nickname:          form.nickname.trim() || null,
        profile_image_url: form.profile_image_url,
        session:           form.session,
        session_years:     Object.keys(syPayload).length > 0 ? syPayload : null,
        genre_preference:  form.genre_preference,
        phone:             form.phone.trim() || null,
        department:        form.department.trim() || null,
        student_id:        form.student_id.trim() || null,
        school_year:       form.school_year || null,
        privacy_settings:  form.privacy_settings,
      }
      const res = await fetch('/api/members/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setToast({ msg: '저장되었습니다', type: 'ok' })
        if (redirectAfterSave) setTimeout(() => router.push(redirectAfterSave), 800)
      } else {
        const data = await res.json()
        setToast({ msg: data.error ?? '저장에 실패했습니다', type: 'err' })
      }
    } catch {
      setToast({ msg: '네트워크 오류가 발생했습니다', type: 'err' })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="max-w-[600px] mx-auto py-6 px-5 flex flex-col gap-6">
      {/* 프로필 헤더 */}
      <div className="rounded-2xl border border-[var(--border)] bg-surface p-5 flex items-center gap-4">
        <div className="flex flex-col items-center gap-2.5 shrink-0">
          <Avatar
            name={profile.name}
            src={form.profile_image_url}
            size={68}
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={!kakaoAvatarUrl}
              onClick={() => setForm(f => ({ ...f, profile_image_url: kakaoAvatarUrl }))}
              className="py-1 px-2.5 rounded-md text-[0.72rem] font-semibold border-none cursor-pointer disabled:cursor-not-allowed transition-colors"
              style={{
                background: form.profile_image_url === kakaoAvatarUrl && kakaoAvatarUrl
                  ? 'var(--accent)' : 'var(--surface-elevated)',
                color: form.profile_image_url === kakaoAvatarUrl && kakaoAvatarUrl
                  ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
              }}
            >
              카카오
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, profile_image_url: null }))}
              className="py-1 px-2.5 rounded-md text-[0.72rem] font-semibold border-none cursor-pointer transition-colors"
              style={{
                background: !form.profile_image_url ? 'var(--accent)' : 'var(--surface-elevated)',
                color: !form.profile_image_url ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
              }}
            >
              기본
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="font-bold text-[1.05rem] text-foreground">{profile.name}</div>
          {profile.generation && (
            <div className="text-[0.82rem] text-muted-foreground">{profile.generation}기</div>
          )}
          <div className="flex gap-1.5 flex-wrap">
            <Badge>{ROLE_LABELS[profile.role] ?? profile.role}</Badge>
            {profile.is_whitelist && (
              <BadgeAccent>★ WL</BadgeAccent>
            )}
          </div>
          <div className="text-[0.75rem] text-subtle-foreground">이름 · 기수는 운영진만 수정 가능합니다</div>
        </div>
      </div>

      {/* 기본 정보 */}
      <section className="flex flex-col gap-4">
        <SectionTitle>기본 정보</SectionTitle>

        <Field label="활동명 (닉네임)" error={errors.nickname}>
          <input
            type="text"
            placeholder="미입력 시 실명으로 표시됩니다"
            maxLength={20}
            value={form.nickname}
            onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="세션 *" error={errors.session}>
          <div className="flex flex-wrap gap-1.5">
            {SESSION_OPTIONS.map(s => (
              <Chip
                key={s}
                selected={form.session.includes(s)}
                onToggle={() => toggleSession(s)}
              >
                {s}
              </Chip>
            ))}
          </div>
          {form.session.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5">
              <span className="text-[0.78rem] text-subtle-foreground">세션별 경력 연차 (선택)</span>
              <div className="flex flex-wrap gap-2">
                {form.session.map(s => (
                  <label key={s} className="flex items-center gap-1.5 text-[0.82rem] text-foreground">
                    <span className="min-w-[52px]">{s}</span>
                    <input
                      type="number"
                      min={0}
                      max={99}
                      placeholder="0"
                      value={form.session_years[s] ?? ''}
                      onChange={e => setForm(f => ({
                        ...f,
                        session_years: { ...f.session_years, [s]: e.target.value },
                      }))}
                      className="w-[52px] py-1 px-1.5 border border-[var(--border)] rounded-md text-[0.82rem] text-center bg-surface-elevated text-foreground outline-none focus:border-accent/50"
                    />
                    <span className="text-muted-foreground">년</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </Field>

        <Field label="선호 장르">
          <div className="flex flex-wrap gap-1.5">
            {GENRE_OPTIONS.map(g => (
              <Chip
                key={g}
                selected={form.genre_preference.includes(g)}
                onToggle={() => toggleGenre(g)}
              >
                {g}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="연락처">
          <input
            type="tel"
            placeholder="010-0000-0000"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="학과" error={errors.department}>
          <input
            type="text"
            placeholder="학과명"
            maxLength={50}
            value={form.department}
            onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="학번" error={errors.student_id}>
          <input
            type="text"
            placeholder="학번"
            maxLength={20}
            value={form.student_id}
            onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
            className={inputClass}
          />
        </Field>

        <Field label="학년" error={errors.school_year}>
          <select
            value={form.school_year}
            onChange={e => setForm(f => ({ ...f, school_year: e.target.value as SchoolYearStatus | '' }))}
            className={`${inputClass} w-auto`}
          >
            <option value="">선택 안 함</option>
            {SCHOOL_YEAR_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
      </section>

      {/* 공개 범위 설정 */}
      <section className="flex flex-col gap-4">
        <SectionTitle>공개 범위 설정</SectionTitle>
        <PrivacySettings
          value={form.privacy_settings}
          onChange={ps => setForm(f => ({ ...f, privacy_settings: ps }))}
        />
      </section>

      {/* 저장 버튼 */}
      <ButtonPrimary
        onClick={handleSave}
        disabled={!isDirty || saving}
        size="lg"
        className="w-full"
      >
        {saving ? '저장 중...' : '저장하기'}
      </ButtonPrimary>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 py-2.5 px-5 rounded-xl text-[0.88rem] font-medium text-white z-[9999] whitespace-nowrap ${
            toast.type === 'ok' ? 'bg-ok' : 'bg-bad'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[0.78rem] font-semibold text-muted-foreground uppercase tracking-[0.12em] font-mono m-0">
      {children}
    </h3>
  )
}

function Field({ label, children, error }: {
  label: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.85rem] font-semibold text-foreground">{label}</label>
      {children}
      {error && <span className="text-[0.78rem] text-bad">{error}</span>}
    </div>
  )
}

const inputClass = 'py-2.5 px-3.5 border border-[var(--border)] rounded-xl text-sm outline-none w-full bg-surface-elevated text-foreground placeholder:text-subtle-foreground focus:border-accent/50 transition-colors'
