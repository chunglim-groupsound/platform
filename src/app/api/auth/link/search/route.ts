// src/app/api/auth/link/search/route.ts

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. 로그인 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증 필요' }, { status: 401 })
    }

    // 2. 요청 파싱
    const body = await request.json()
    const name: string       = (body.name ?? '').trim()
    const generation: number = Number(body.generation)

    if (!name) {
      return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 })
    }
    if (!generation || isNaN(generation) || generation < 1) {
      return NextResponse.json({ error: '기수를 올바르게 입력해주세요.' }, { status: 400 })
    }

    // 3. 임포트 레코드 검색
    //    - supabaseAdmin 사용: RLS 우회하여 확실하게 조회
    //    - kakao_id가 imported_ 로 시작 + linked_auth_id가 null(미연동)인 것만
    const { data: candidates, error: searchError } = await supabaseAdmin
      .from('users')
      .select('id, name, generation, session, status, department, student_id, school_year')
      .eq('name', name)
      .eq('generation', generation)
      .like('kakao_id', 'imported_%')
      .is('linked_auth_id', null)
      .in('status', ['ACTIVE', 'INACTIVE', 'PROBATION'])

    if (searchError) {
      console.error('search error:', searchError)
      return NextResponse.json({ error: searchError.message }, { status: 500 })
    }

    return NextResponse.json({ candidates: candidates ?? [] })

  } catch (err: any) {
    console.error('link/search unexpected error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}