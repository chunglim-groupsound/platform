import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

// GET /api/members/me/join-requests — 내가 신청한 팀 가입 목록

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!callerProfile) return NextResponse.json({ error: '프로필 없음' }, { status: 404 })

  const { data: requests, error } = await supabaseAdmin
    .from('team_join_requests')
    .select(`
      id, message, status, created_at, updated_at,
      team:teams!team_id ( id, name, leader_id )
    `)
    .eq('applicant_id', callerProfile.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ requests: requests ?? [] })
}
