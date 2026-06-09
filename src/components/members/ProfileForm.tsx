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
  return {
    nickname:          p.nickname ?? '',
    profile_image_url: p.profile_image_url ?? null,
    session:           p.session ?? [],
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
    setForm(f => ({
      ...f,
      session: f.session.includes(s) ? f.session.filter(x => x !== s) : [...f.session, s],
    }))
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
      const payload: Record<string, unknown> = {
        nickname:          form.nickname.trim() || null,
        profile_image_url: form.profile_image_url,
        session:           form.session,
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
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 프로필 헤더 */}
      <div style={{
        background: '#f9fafb', borderRadius: '12px', padding: '20px',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        {/* 프로필 이미지 + 선택 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ position: 'relative', width: 72, height: 72 }}>
            {form.profile_image_url ? (
              <Image
                src={form.profile_image_url}
                alt={profile.name}
                fill
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', color: '#6b7280',
              }}>
                {profile.name[0]}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              disabled={!kakaoAvatarUrl}
              onClick={() => setForm(f => ({ ...f, profile_image_url: kakaoAvatarUrl }))}
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
                border: 'none', cursor: kakaoAvatarUrl ? 'pointer' : 'not-allowed',
                background: form.profile_image_url === kakaoAvatarUrl && kakaoAvatarUrl
                  ? '#4A90E2' : '#e5e7eb',
                color: form.profile_image_url === kakaoAvatarUrl && kakaoAvatarUrl
                  ? '#fff' : '#6b7280',
              }}
            >
              카카오
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, profile_image_url: null }))}
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: !form.profile_image_url ? '#4A90E2' : '#e5e7eb',
                color: !form.profile_image_url ? '#fff' : '#6b7280',
              }}
            >
              기본
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile.name}</div>
          {profile.generation && (
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{profile.generation}기</div>
          )}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '2px 8px', borderRadius: '9999px',
              background: '#e0f2fe', color: '#075985', fontSize: '0.75rem',
            }}>
              {ROLE_LABEL[profile.role] ?? profile.role}
            </span>
            {profile.is_whitelist && (
              <span style={{
                padding: '2px 8px', borderRadius: '9999px',
                background: '#fef9c3', color: '#854d0e', fontSize: '0.75rem',
              }}>
                ★ WL
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>이름 · 기수는 운영진만 수정 가능합니다</div>
        </div>
      </div>

      {/* 기본 정보 */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: 0 }}>기본 정보</h3>

        <Field label="닉네임 (활동명)" error={errors.nickname}>
          <input
            type="text"
            placeholder="미입력 시 실명으로 표시됩니다"
            maxLength={20}
            value={form.nickname}
            onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
            style={inputStyle}
          />
        </Field>

        <Field label="세션 *" error={errors.session}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {SESSION_OPTIONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSession(s)}
                style={tagStyle(form.session.includes(s))}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        <Field label="선호 장르">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {GENRE_OPTIONS.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                style={tagStyle(form.genre_preference.includes(g))}
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
            style={inputStyle}
          />
        </Field>

        <Field label="학과" error={errors.department}>
          <input
            type="text"
            placeholder="학과명"
            maxLength={50}
            value={form.department}
            onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
            style={inputStyle}
          />
        </Field>

        <Field label="학번" error={errors.student_id}>
          <input
            type="text"
            placeholder="학번"
            maxLength={20}
            value={form.student_id}
            onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
            style={inputStyle}
          />
        </Field>

        <Field label="학년" error={errors.school_year}>
          <select
            value={form.school_year}
            onChange={e => setForm(f => ({ ...f, school_year: e.target.value }))}
            style={{ ...inputStyle, width: 'auto' }}
          >
            <option value="">선택 안 함</option>
            {[1, 2, 3, 4, 5].map(y => (
              <option key={y} value={y}>{y}학년</option>
            ))}
          </select>
        </Field>
      </section>

      {/* 공개 범위 설정 */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827', margin: 0 }}>공개 범위 설정</h3>
        <PrivacySettings
          value={form.privacy_settings}
          onChange={ps => setForm(f => ({ ...f, privacy_settings: ps }))}
        />
      </section>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={!isDirty || saving}
        style={{
          padding: '12px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600,
          border: 'none', cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
          background: isDirty && !saving ? '#1d4ed8' : '#e5e7eb',
          color: isDirty && !saving ? '#fff' : '#9ca3af',
          transition: 'background 0.15s',
        }}
      >
        {saving ? '저장 중...' : '저장하기'}
      </button>

      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          padding: '10px 20px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500,
          background: toast.type === 'ok' ? '#166534' : '#991b1b',
          color: '#fff', zIndex: 9999, whiteSpace: 'nowrap',
        }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: '0.78rem', color: '#dc2626' }}>{error}</span>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const tagStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 14px',
  borderRadius: '9999px',
  fontSize: '0.82rem',
  border: '1px solid',
  borderColor: active ? '#3b82f6' : '#d1d5db',
  background: active ? '#eff6ff' : '#fff',
  color: active ? '#1d4ed8' : '#374151',
  cursor: 'pointer',
  fontWeight: active ? 600 : 400,
})
