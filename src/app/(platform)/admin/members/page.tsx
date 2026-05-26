// Server Component — 데이터 fetch
import { createClient } from '@/lib/supabase/server'
import MemberListClient from '@/components/admin/MemberListClient'

export default async function AdminMembersPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('users')
    .select(`
      id, name, generation, session, status, role,
      is_whitelist, probation_started_at, created_at,
      join_applications (interview_result, created_at)
    `)
    .order('created_at', { ascending: false })

  return <MemberListClient members={members ?? []} />
}