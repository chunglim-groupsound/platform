// src/app/api/auth/link/search/route.ts
// 이름 + 기수로 임포트된 레코드 검색
// imported_ 접두사가 있는 kakao_id만 대상으로 함

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. 로그인 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  }

  // 2. 이미 연동된 계정인지 확인 (중복 연동 방지)
  const { data: existing } = await supabase
    .from('users')
    .select('id, status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .neq('status', 'PENDING')  // PENDING이 아닌 레코드가 있으면 이미 연동됨
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: '이미 연동된 계정입니다.' }, { status: 400 })
  }

  // 3. 요청 파싱 및 유효성 검사
  const body = await request.json()
  const name: string = (body.name ?? '').trim()
  const generation: number = Number(body.generation)

  if (!name || !generation || isNaN(generation)) {
    return NextResponse.json({ error: '이름과 기수를 입력해주세요.' }, { status: 400 })
  }

  // 4. 임포트 레코드 검색
  //    조건: 이름 일치 + 기수 일치 + kakao_id가 imported_ 로 시작 + 아직 미연동
  const { data: candidates, error: searchError } = await supabase
    .from('users')
    .select('id, name, generation, session, status')
    .eq('name', name)
    .eq('generation', generation)
    .like('kakao_id', 'imported_%')   // 임포트 레코드만
    .is('linked_auth_id', null)        // 아직 연동 안 된 것만
    .in('status', ['ACTIVE', 'INACTIVE', 'PROBATION'])  // 유효한 상태만

  if (searchError) {
    return NextResponse.json({ error: searchError.message }, { status: 500 })
  }

  return NextResponse.json({ candidates: candidates ?? [] })
}