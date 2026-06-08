import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/members/ProfileForm'

function isKakaoUrl(url: string | null): boolean {
  return !!url && url.includes('kakaocdn.net')
}

export default async function MyProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const kakaoAvatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null

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

  // 카카오 모드로 설정된 경우, 로그인 시 갱신된 최신 URL로 자동 반영
  let profileImageUrl = profile.profile_image_url
  if (kakaoAvatarUrl && isKakaoUrl(profile.profile_image_url) && profile.profile_image_url !== kakaoAvatarUrl) {
    const { error } = await supabase
      .from('users')
      .update({ profile_image_url: kakaoAvatarUrl })
      .eq('id', profile.id)
    if (!error) profileImageUrl = kakaoAvatarUrl
  }

  const typedProfile = {
    ...profile,
    profile_image_url: profileImageUrl,
    privacy_settings: (profile.privacy_settings ?? {}) as Record<string, string>,
    session: profile.session ?? [],
    genre_preference: profile.genre_preference ?? [],
  }

  return (
    <main>
      <div style={{ padding: '20px 20px 0', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>내 프로필</h1>
      </div>
      <ProfileForm profile={typedProfile} kakaoAvatarUrl={kakaoAvatarUrl} />
    </main>
  )
}
