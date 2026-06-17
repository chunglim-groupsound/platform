// src/app/api/admin/import/route.ts
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, apiSuccess } from '@/lib/api/response'
import { randomUUID } from 'crypto'
import type { Database } from '@/types/database'

type MemberRole      = Database['public']['Enums']['member_role']
type MemberStatus    = Database['public']['Enums']['member_status']
type SchoolYearStatus = Database['public']['Enums']['school_year_status']

const SCHOOL_YEAR_MAP: Record<string, SchoolYearStatus> = {
  '1': 'YEAR_1', '2': 'YEAR_2', '3': 'YEAR_3',
  '4': 'YEAR_4', '5': 'YEAR_5',
}

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
    return apiError('데이터가 없습니다.', 400)
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
      school_year:    m.school_year ? (SCHOOL_YEAR_MAP[m.school_year.trim()] ?? null) : null,
      phone:          m.phone?.trim()        || null,
      is_whitelist:   m.is_whitelist === 'true',
      status,
      role,
      linked_auth_id: null,
    }
  })

  const { data, error } = await createAdminClient()
    .from('users')
    .insert(formatted)
    .select('id, name, generation')

  if (error) {
    return apiError('서버 오류가 발생했습니다', 500)
  }

  return apiSuccess({
    imported: data?.length ?? formatted.length,
    members:  data,
  })
}
