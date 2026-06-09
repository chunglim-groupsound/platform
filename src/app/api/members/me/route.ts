import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { hasActiveMemberAccess } from '@/lib/constants'
import type { Database } from '@/types/database'

type UsersUpdate = Database['public']['Tables']['users']['Update']

const ALLOWED_FIELDS = [
  'nickname', 'profile_image_url', 'session', 'genre_preference',
  'phone', 'department', 'student_id', 'school_year',
  'privacy_settings',
] as const

const BLOCKED_FIELDS = new Set([
  'id', 'kakao_id', 'linked_auth_id', 'name', 'generation',
  'status', 'role', 'is_whitelist', 'created_at', 'updated_at',
  'activated_at', 'probation_started_at', 'last_active_at',
  'privacy_agreed_at',
])

const VALID_SESSIONS = new Set(['보컬', '기타', '베이스', '드럼', '건반', '기타(악기)'])
const VALID_SCOPES   = new Set(['all', 'member', 'admin'])

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!profile) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  if (!hasActiveMemberAccess(profile.status)) {
    return NextResponse.json({ error: '수정 권한이 없습니다' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })
  }

  // 허용된 필드만 추출, 금지 필드 제거
  const patch: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) patch[key] = body[key]
  }
  for (const key of Object.keys(patch)) {
    if (BLOCKED_FIELDS.has(key)) delete patch[key]
  }

  // 유효성 검증
  const errors: Record<string, string> = {}

  const kakaoAvatarUrl = user.user_metadata?.avatar_url as string | undefined

  if ('profile_image_url' in patch) {
    const url = patch.profile_image_url
    if (url !== null && url !== kakaoAvatarUrl) {
      errors.profile_image_url = '카카오 프로필 또는 기본 프로필만 선택 가능합니다'
    }
  }

  if ('nickname' in patch && patch.nickname !== null) {
    const n = String(patch.nickname)
    if (n.trim().length === 0) errors.nickname = '닉네임은 공백만으로 구성할 수 없습니다'
    else if (n.length > 20)    errors.nickname = '닉네임은 최대 20자입니다'
  }

  if ('session' in patch) {
    const s = patch.session as unknown[]
    if (!Array.isArray(s) || s.length === 0) {
      errors.session = '세션은 최소 1개 이상 선택해야 합니다'
    } else {
      const invalid = s.filter(v => !VALID_SESSIONS.has(String(v)))
      if (invalid.length > 0) errors.session = `허용되지 않은 세션값: ${invalid.join(', ')}`
    }
  }

  if ('school_year' in patch && patch.school_year !== null) {
    const y = Number(patch.school_year)
    if (!Number.isInteger(y) || y < 1 || y > 5) {
      errors.school_year = '학년은 1~5 사이의 정수여야 합니다'
    }
  }

  if ('department' in patch && patch.department !== null) {
    if (String(patch.department).length > 50) errors.department = '학과는 최대 50자입니다'
  }

  if ('student_id' in patch && patch.student_id !== null) {
    if (String(patch.student_id).length > 20) errors.student_id = '학번은 최대 20자입니다'
  }

  if ('privacy_settings' in patch && typeof patch.privacy_settings === 'object' && patch.privacy_settings !== null) {
    const ps = patch.privacy_settings as Record<string, unknown>
    for (const [field, scope] of Object.entries(ps)) {
      if (!VALID_SCOPES.has(String(scope))) {
        errors[`privacy_settings.${field}`] = `허용되지 않은 scope: ${scope}`
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: '유효하지 않은 입력값', details: errors }, { status: 400 })
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: '변경할 항목이 없습니다' }, { status: 400 })
  }

  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update(patch as UsersUpdate)
    .eq('id', profile.id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, user: updated })
}
