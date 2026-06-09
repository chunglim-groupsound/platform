import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { maskMember } from '@/lib/member/privacy'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!caller) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  const { data: callerProfile } = await supabase
    .from('users')
    .select('id, role, status')
    .or(`id.eq.${caller.id},linked_auth_id.eq.${caller.id}`)
    .maybeSingle()

  const isAdmin  = ['ADMIN', 'SUPER_ADMIN'].includes(callerProfile?.role ?? '')
  const isMember = ['ACTIVE', 'INACTIVE', 'PROBATION'].includes(callerProfile?.status ?? '')
  const callerId = callerProfile?.id ?? caller.id

  const sp = request.nextUrl.searchParams
  const sessions    = sp.getAll('session')
  const generation  = sp.get('generation')
  const role        = sp.get('role')
  const isWhitelist = sp.get('is_whitelist')
  const statusParam = sp.get('status')
  const q           = sp.get('q')

  let query = supabase
    .from('users')
    .select(`
      id, name, nickname, profile_image_url,
      status, role, is_whitelist,
      session, generation, phone, department, school_year,
      privacy_settings
    `)

  // 상태 필터: 운영진은 지정 가능, 일반은 ACTIVE/INACTIVE/PROBATION 고정
  if (isAdmin && statusParam) {
    query = query.eq('status', statusParam)
  } else {
    query = query.in('status', ['ACTIVE', 'INACTIVE', 'PROBATION'])
  }

  if (generation) query = query.eq('generation', Number(generation))
  if (role)       query = query.eq('role', role)
  if (isWhitelist === 'true') query = query.eq('is_whitelist', true)

  // 세션 필터: OR 조건
  if (sessions.length > 0) {
    query = query.overlaps('session', sessions)
  }

  // 검색어: name, nickname, generation 부분 일치
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,nickname.ilike.%${q}%`
    )
  }

  const [{ data: rows, error }, { data: teamLeaders }] = await Promise.all([
    query.order('created_at', { ascending: true }),
    supabaseAdmin.from('teams').select('leader_id').eq('is_active', true),
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const leaderIds = new Set((teamLeaders ?? []).map(t => t.leader_id).filter(Boolean))

  const members = (rows ?? []).map((row) =>
    maskMember(
      { ...row, isLeader: leaderIds.has(row.id) } as Record<string, unknown>,
      row.id === callerId, isMember, isAdmin
    )
  )

  const admins = members.filter(m => ['ADMIN', 'SUPER_ADMIN'].includes(m.role) && m.status === 'ACTIVE')

  return NextResponse.json({ members, admins, total: members.length })
}
