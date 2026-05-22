import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  // 조회자 정보
  const { data: { user: caller } } = await supabase.auth.getUser()
  if (!caller) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('users')
    .select('role, status')
    .eq('id', caller.id)
    .single()

  // 대상 회원 조회
  const { data: target } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!target) return NextResponse.json({ error: '없는 유저' }, { status: 404 })

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(callerProfile?.role ?? '')
  const isMember = ['ACTIVE', 'INACTIVE'].includes(callerProfile?.status ?? '')
  const isSelf = caller.id === params.id

  // privacy_settings에 따라 필드 제거
  const privacy = target.privacy_settings as Record<string, string>

  const filtered = { ...target }

  // phone 처리
  if (!isSelf) {
    if (privacy.phone === 'admin' && !isAdmin) delete filtered.phone
    if (privacy.phone === 'member' && !isMember && !isAdmin) delete filtered.phone
  }

  // generation 처리
  if (!isSelf) {
    if (privacy.generation === 'admin' && !isAdmin) delete filtered.generation
    if (privacy.generation === 'member' && !isMember && !isAdmin) delete filtered.generation
  }

  // 항상 제거할 민감 필드
  delete filtered.kakao_id
  delete filtered.privacy_settings  // 본인·운영진 외 노출 불필요

  return NextResponse.json(filtered)
}