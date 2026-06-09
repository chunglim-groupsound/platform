import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewTeamForm } from '@/components/teams/NewTeamForm'
import Link from 'next/link'

export default async function NewTeamPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!['ACTIVE', 'INACTIVE'].includes(profile?.status ?? '')) redirect('/teams')

  return (
    <main style={{ padding: '24px 20px', maxWidth: '520px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/teams" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>
          ← 팀 목록
        </Link>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>팀 만들기</h1>
      </div>
      <NewTeamForm redirectBase="/teams" />
    </main>
  )
}
