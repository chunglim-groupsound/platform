import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { maskMember } from '@/lib/member/privacy'
import type { NextRequest } from 'next/server'
import { isAdminRole, hasActiveMemberAccess, ACTIVE_STATUSES } from '@/lib/constants'
import { getCurrentSession } from '@/lib/auth/session'
import { apiError, apiSuccess } from '@/lib/api/response'
import type { MemberStatus, MemberRole } from '@/types/app'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const session = await getCurrentSession(supabase)
  if (!session) return apiError('인증 필요', 401)

  const { profile: callerProfile, myId: callerId } = session
  const isAdmin  = isAdminRole(callerProfile?.role)
  const isMember = hasActiveMemberAccess(callerProfile?.status)

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

  if (isAdmin && statusParam) {
    query = query.eq('status', statusParam as MemberStatus)
  } else {
    query = query.in('status', [...ACTIVE_STATUSES])
  }

  if (generation) query = query.eq('generation', Number(generation))
  if (role)       query = query.eq('role', role as MemberRole)
  if (isWhitelist === 'true') query = query.eq('is_whitelist', true)

  if (sessions.length > 0) {
    query = query.overlaps('session', sessions)
  }

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,nickname.ilike.%${q}%`
    )
  }

  const [{ data: rows, error }, { data: teamLeaders }] = await Promise.all([
    query.order('created_at', { ascending: true }),
    createAdminClient().from('teams').select('leader_id').eq('is_active', true),
  ])

  if (error) {
    return apiError('서버 오류가 발생했습니다', 500)
  }

  const leaderIds = new Set((teamLeaders ?? []).map(t => t.leader_id).filter(Boolean))

  const members = (rows ?? []).map((row) =>
    maskMember(
      { ...row, is_leader: leaderIds.has(row.id) },
      row.id === callerId, isMember, isAdmin
    )
  )

  const admins = members.filter(m => isAdminRole(m.role) && m.status === 'ACTIVE')

  return apiSuccess({ members, admins, total: members.length })
}
