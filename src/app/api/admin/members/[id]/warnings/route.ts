// GET  /api/admin/members/[id]/warnings — 경고 목록
// POST /api/admin/members/[id]/warnings — 경고 추가 (3회 누적 시 자동 WITHDRAWN)

import { createClient } from '@/lib/supabase/server'
import { transitionMemberStatus } from '@/lib/member/transitions'
import { NextResponse } from 'next/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('id, role').eq('id', user.id).single()
  if (!['ADMIN', 'SUPER_ADMIN'].includes(data?.role ?? '')) return null
  return data
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('member_warnings')
    .select('id, reason, created_at, issuer:issued_by(name)')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params
  const supabase = await createClient()
  const caller = await requireAdmin(supabase)
  if (!caller) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { reason } = await request.json()
  if (!reason?.trim()) {
    return NextResponse.json({ error: '경고 사유를 입력해주세요.' }, { status: 400 })
  }

  // 경고 추가
  const { error: insertError } = await supabase
    .from('member_warnings')
    .insert({ user_id: targetUserId, reason: reason.trim(), issued_by: caller.id })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // 누적 경고 수 확인
  const { count } = await supabase
    .from('member_warnings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', targetUserId)

  const total = count ?? 0
  let withdrawn = false

  if (total >= 3) {
    // 현재 상태 확인 — 이미 WITHDRAWN이면 전이 불필요
    const { data: target } = await supabase
      .from('users')
      .select('status')
      .eq('id', targetUserId)
      .single()

    if (target?.status !== 'WITHDRAWN') {
      try {
        await transitionMemberStatus({
          userId:    targetUserId,
          toStatus:  'WITHDRAWN',
          changedBy: caller.id,
          reason:    `경고 ${total}회 누적으로 인한 자동 제적`,
        })
        withdrawn = true
      } catch {
        // 전이 실패 시 경고는 이미 추가됐으므로 무시하지 않고 에러 반환
        return NextResponse.json({ error: '상태 전이 실패' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ success: true, totalWarnings: total, withdrawn })
}
