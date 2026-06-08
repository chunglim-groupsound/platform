import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewTeamForm } from '@/components/members/NewTeamForm'

export default async function NewTeamPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  // PROBATION 이하는 팀 생성 불가
  if (!['ACTIVE', 'INACTIVE'].includes(profile?.status ?? '')) {
    redirect('/members/teams')
  }

  return (
    <main style={{ padding: '24px 20px', maxWidth: '520px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '24px' }}>팀 만들기</h1>
      <NewTeamForm />
    </main>
  )
}
