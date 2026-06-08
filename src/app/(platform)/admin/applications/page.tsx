import ApplicationCard from '@/components/admin/ApplicationCard'
import { createClient } from '@/lib/supabase/server'

export default async function ApplicationsPage() {
  const supabase = await createClient()

  // PENDING, INTERVIEWING 상태의 신청서 + 신청자 정보 조인
  const { data: applications } = await supabase
    .from('join_applications')
    .select(`
      id, motivation, self_intro,
      confirmed_slot_id, interview_result,
      admin_note, created_at,
      users (id, name, generation, session, status)
    `)
    .in('interview_result', ['PENDING'])
    .order('created_at', { ascending: true })

  return (
    <div>
      <h1>가입 신청 처리</h1>
      <p>대기 중: {applications?.length}건</p>

      {applications?.map(app => {
        const formattedApplication = {
          ...app,
          interview_result: app.interview_result as 'PENDING' | 'PASS' | 'FAIL',
          confirmed_slot_id: app.confirmed_slot_id ?? null,
          users: Array.isArray(app.users)
            ? app.users[0]
            : (app.users ? app.users : null),
        }

        return (
          <ApplicationCard 
            key={app.id} 
            application={formattedApplication} 
          />
        )
      })}
    </div>
  )
}