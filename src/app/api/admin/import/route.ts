// src/app/api/admin/import/route.ts
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import type { Database } from '@/types/database'

type MemberRole   = Database['public']['Enums']['member_role']
type MemberStatus = Database['public']['Enums']['member_status']

interface CsvRow {
  name:         string
  generation:   string
  session:      string
  department?:  string
  student_id?:  string
  school_year?: string
  phone?:       string
  is_whitelist?: string
  status?:      string
}

export async function POST(request: Request) {
  const { members }: { members: CsvRow[] } = await request.json()

  if (!members || members.length === 0) {
    return NextResponse.json({ error: '데이터가 없습니다.' }, { status: 400 })
  }

  const formatted = members.map((m) => {
    const sessionArr = m.session
      ? m.session.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []

    const status = (m.status?.toUpperCase() ?? 'ACTIVE') as MemberStatus
    const role: MemberRole = status === 'PROBATION' ? 'PROBATION_MEMBER' : 'MEMBER'

    return {
      id:             randomUUID(),   // ← auth.users 참조 없이 직접 생성
      kakao_id:       `imported_${m.name.trim()}_${m.generation}_${Date.now()}`,
      name:           m.name.trim(),
      generation:     m.generation ? Number(m.generation) : null,
      session:        sessionArr,
      department:     m.department?.trim()  || null,
      student_id:     m.student_id?.trim()  || null,
      school_year:    m.school_year ? Number(m.school_year) : null,
      phone:          m.phone?.trim()        || null,
      is_whitelist:   m.is_whitelist === 'true',
      status,
      role,
      linked_auth_id: null,
    }
  })

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert(formatted)
    .select('id, name, generation')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    imported: data?.length ?? formatted.length,
    members:  data,
  })
}