import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/members/ProfileForm'

export default async function MyProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, name, nickname, profile_image_url,
      status, role, generation, is_whitelist,
      session, genre_preference, phone,
      department, student_id, school_year,
      privacy_settings
    `)
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!profile) redirect('/')

  const allowed = ['PROBATION', 'ACTIVE', 'INACTIVE']
  if (!allowed.includes(profile.status)) redirect('/status')

  const typedProfile = {
    ...profile,
    privacy_settings: (profile.privacy_settings ?? {}) as Record<string, string>,
    session: profile.session ?? [],
    genre_preference: profile.genre_preference ?? [],
  }

  return (
    <main>
      <div style={{ padding: '20px 20px 0', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>내 프로필</h1>
      </div>
      <ProfileForm profile={typedProfile} />
    </main>
  )
}
