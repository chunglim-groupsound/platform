// src/app/api/members/[id]/route.ts
// 프로필 조회 API — 학과·학번·학년 privacy_settings 반영

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// privacy_settings 공개 범위 판단
function canView(
  scope: string | undefined,
  isSelf: boolean,
  isMember: boolean,
  isAdmin: boolean
): boolean {
  if (isSelf || isAdmin) return true
  if (scope === 'all')    return true
  if (scope === 'member') return isMember
  // scope === 'admin' → 운영진만 (isAdmin은 위에서 이미 처리)
  return false
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // 1. 조회자 확인
  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!caller) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  // 2. 조회자 권한 조회 (linked_auth_id 포함)
  const { data: callerProfile } = await supabase
    .from('users')
    .select('role, status')
    .or(`id.eq.${caller.id},linked_auth_id.eq.${caller.id}`)
    .maybeSingle()

  const isAdmin  = ['ADMIN', 'SUPER_ADMIN'].includes(callerProfile?.role   ?? '')
  const isMember = ['ACTIVE', 'INACTIVE'].includes(callerProfile?.status ?? '')

  // 3. 대상 회원 조회
  const { data: target } = await supabase
    .from('users')
    .select(`
      id, name, nickname, generation, session, genre_preference,
      phone, profile_image_url,
      department, student_id, school_year,
      status, role, is_whitelist,
      privacy_settings,
      probation_started_at, activated_at, created_at
    `)
    .eq('id', id)
    .single()

  if (!target) {
    return NextResponse.json({ error: '없는 유저' }, { status: 404 })
  }

  const isSelf = (
    caller.id === id ||
    caller.id === target.id
  )

  const privacy = (target.privacy_settings ?? {}) as Record<string, string>

  // 4. privacy_settings 기반 필드 필터링
  //    민감 필드만 조건부 제거, 나머지는 항상 반환
  const filtered: Record<string, unknown> = {
    id:                target.id,
    name:              target.name,
    nickname:          target.nickname,
    profile_image_url: target.profile_image_url,
    session:           target.session,
    genre_preference:  target.genre_preference,
    status:            target.status,
    role:              target.role,
    is_whitelist:      target.is_whitelist,
    created_at:        target.created_at,
  }

  // generation
  if (canView(privacy.generation, isSelf, isMember, isAdmin)) {
    filtered.generation = target.generation
  }

  // phone
  if (canView(privacy.phone, isSelf, isMember, isAdmin)) {
    filtered.phone = target.phone
  }

  // department (학과)
  if (canView(privacy.department, isSelf, isMember, isAdmin)) {
    filtered.department = target.department
  }

  // student_id (학번) — 기본값 admin
  if (canView(privacy.student_id ?? 'admin', isSelf, isMember, isAdmin)) {
    filtered.student_id = target.student_id
  }

  // school_year (학년)
  if (canView(privacy.school_year, isSelf, isMember, isAdmin)) {
    filtered.school_year = target.school_year
  }

  // 운영진만 볼 수 있는 추가 필드
  if (isAdmin || isSelf) {
    filtered.probation_started_at = target.probation_started_at
    filtered.activated_at         = target.activated_at
  }

  return NextResponse.json(filtered)
}