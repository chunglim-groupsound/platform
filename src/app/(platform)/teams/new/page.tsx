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
    <main className="py-6 px-5 max-w-[520px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/teams" className="text-[0.85rem] text-gray-500 no-underline">
          ← 팀 목록
        </Link>
        <h1 className="text-[1.3rem] font-extrabold m-0">팀 만들기</h1>
      </div>
      <NewTeamForm redirectBase="/teams" />
    </main>
  )
}
