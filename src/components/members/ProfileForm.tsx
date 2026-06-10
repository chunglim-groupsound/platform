'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PrivacySettings } from './PrivacySettings'

const SESSION_OPTIONS = ['보컬', '기타', '베이스', '드럼', '건반', '기타(악기)']
const GENRE_OPTIONS   = ['록', '팝', '인디', '재즈', 'R&B', '메탈', '힙합', '발라드', '펑크', '포크']

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
  school_year: number | null
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
  school_year: string
  privacy_settings: Record<string, string>
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: '최고관리자',
  ADMIN: '운영진',
  MEMBER: '일반 부원',
  PROBATION_MEMBER: '수습 부원',
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
    school_year:       p.school_year?.toString() ?? '',
    privacy_settings:  p.privacy_settings ?? {},
  }
}

export function ProfileForm({ profile, kakaoAvatarUrl, redirectAfterSave }: { profile: ProfileData; kakaoAvatarUrl: string | null; redirectAfterSave?: string }) {
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
    if (form.school_year && (Number(form.school_year) < 1 || Number(form.school_year) > 5))
      e.school_year = '학년은 1~5 사이 정수여야 합니다'
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
        school_year:       form.school_year ? Number(form.school_year) : null,
        privacy_settings:  form.privacy_settings,
      }
      const res = await fetch('/api/members/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setToast({ msg: '저장되었습니다', type: 'ok' })
        if (redirectAfterSave) {
          setTimeout(() => router.push(redirectAfterSave), 800)
        }
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
    <div className="max-w-[600px] mx-auto py-6 px-4 flex flex-col gap-6">
      {/* 프로필 헤더 */}
      <div className="bg-gray-50 rounded-xl p-5 flex items-center gap-4">
        {/* 프로필 이미지 + 선택 버튼 */}
        <div className="flex flex-col items-center gap-2.5 shrink-0">
          <div className="relative w-[72px] h-[72px]">
            {form.profile_image_url ? (
              <Image
                src={form.profile_image_url}
                alt={profile.name}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-gray-200 flex items-center justify-center text-[1.8rem] text-gray-500">
                {profile.name[0]}
              </div>
            )}
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={!kakaoAvatarUrl}
              onClick={() => setForm(f => ({ ...f, profile_image_url: kakaoAvatarUrl }))}
              className={`py-1 px-2.5 rounded-md text-[0.72rem] font-semibold border-none ${
                form.profile_image_url === kakaoAvatarUrl && kakaoAvatarUrl
                  ? 'bg-[#4A90E2] text-white cursor-pointer'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              카카오
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, profile_image_url: null }))}
              className={`py-1 px-2.5 rounded-md text-[0.72rem] font-semibold border-none cursor-pointer ${
                !form.profile_image_url
                  ? 'bg-[#4A90E2] text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              기본
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="font-bold text-[1.1rem]">{profile.name}</div>
          {profile.generation && (
            <div className="text-[0.85rem] text-gray-500">{profile.generation}기</div>
          )}
          <div className="flex gap-1.5 flex-wrap">
            <span className="py-[2px] px-2 rounded-full bg-[#e0f2fe] text-[#075985] text-xs">
              {ROLE_LABEL[profile.role] ?? profile.role}
            </span>
            {profile.is_whitelist && (
              <span className="py-[2px] px-2 rounded-full bg-[#fef9c3] text-[#854d0e] text-xs">
                ★ WL
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">이름 · 기수는 운영진만 수정 가능합니다</div>
        </div>
      </div>

      {/* 기본 정보 */}
      <section className="flex flex-col gap-3.5">
        <h3 className="text-[0.95rem] font-bold text-gray-900 m-0">기본 정보</h3>

        <Field label="닉네임 (활동명)" error={errors.nickname}>
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
              <button
                key={s}
                type="button"
                onClick={() => toggleSession(s)}
                className={`py-1 px-3.5 rounded-full text-[0.82rem] border cursor-pointer ${
                  form.session.includes(s)
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-300 bg-white text-gray-700 font-normal'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {form.session.length > 0 && (
            <div className="mt-2.5 flex flex-col gap-1.5">
              <span className="text-[0.78rem] text-gray-500">세션별 경력 연차 (선택)</span>
              <div className="flex flex-wrap gap-2">
                {form.session.map(s => (
                  <label key={s} className="flex items-center gap-1 text-[0.82rem] text-gray-700">
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
                      className="w-[52px] py-1 px-1.5 border border-gray-300 rounded-md text-[0.82rem] text-center"
                    />
                    <span>년</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </Field>

        <Field label="선호 장르">
          <div className="flex flex-wrap gap-1.5">
            {GENRE_OPTIONS.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                className={`py-1 px-3.5 rounded-full text-[0.82rem] border cursor-pointer ${
                  form.genre_preference.includes(g)
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-300 bg-white text-gray-700 font-normal'
                }`}
              >
                {g}
              </button>
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
            onChange={e => setForm(f => ({ ...f, school_year: e.target.value }))}
            className={`${inputClass} w-auto`}
          >
            <option value="">선택 안 함</option>
            {[1, 2, 3, 4, 5].map(y => (
              <option key={y} value={y}>{y}학년</option>
            ))}
          </select>
        </Field>
      </section>

      {/* 공개 범위 설정 */}
      <section className="flex flex-col gap-3.5">
        <h3 className="text-[0.95rem] font-bold text-gray-900 m-0">공개 범위 설정</h3>
        <PrivacySettings
          value={form.privacy_settings}
          onChange={ps => setForm(f => ({ ...f, privacy_settings: ps }))}
        />
      </section>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={!isDirty || saving}
        className={`p-3 rounded-[10px] text-[0.95rem] font-semibold border-none transition-[background] duration-150 ${
          isDirty && !saving
            ? 'bg-blue-700 text-white cursor-pointer'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {saving ? '저장 중...' : '저장하기'}
      </button>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 py-2.5 px-5 rounded-lg text-[0.9rem] font-medium text-white z-[9999] whitespace-nowrap ${toast.type === 'ok' ? 'bg-green-800' : 'bg-red-800'}`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function Field({
  label, children, error,
}: {
  label: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.85rem] font-semibold text-gray-700">{label}</label>
      {children}
      {error && <span className="text-[0.78rem] text-red-600">{error}</span>}
    </div>
  )
}

const inputClass = 'py-2 px-3 border border-gray-300 rounded-lg text-sm outline-none w-full'
