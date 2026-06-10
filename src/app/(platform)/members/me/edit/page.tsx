import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/members/ProfileForm'
import Link from 'next/link'
import { hasActiveMemberAccess } from '@/lib/constants'

function isKakaoUrl(url: string | null): boolean {
  return !!url && url.includes('kakaocdn.net')
}

export default async function MyProfileEditPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const kakaoAvatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null

  const { data: profile } = await supabase
    .from('users')
    .select(`
      id, name, nickname, profile_image_url,
      status, role, generation, is_whitelist,
      session, session_years, genre_preference, phone,
      department, student_id, school_year,
      privacy_settings
    `)
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!profile) redirect('/')

  if (!hasActiveMemberAccess(profile.status)) redirect('/status')

  let profileImageUrl = profile.profile_image_url
  if (kakaoAvatarUrl && isKakaoUrl(profile.profile_image_url) && profile.profile_image_url !== kakaoAvatarUrl) {
    const { error } = await supabase
      .from('users')
      .update({ profile_image_url: kakaoAvatarUrl })
      .eq('id', profile.id)
    if (!error) profileImageUrl = kakaoAvatarUrl
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { session_years: _sy, privacy_settings: _ps, ...restProfile } = profile
  const typedProfile = {
    ...restProfile,
    profile_image_url: profileImageUrl,
    privacy_settings: (profile.privacy_settings ?? {}) as Record<string, string>,
    session: profile.session ?? [],
    session_years: (profile.session_years ?? null) as Record<string, number> | null,
    genre_preference: profile.genre_preference ?? [],
  }

  return (
    <main>
      <div className="pt-5 px-5 pb-0 max-w-[600px] mx-auto flex items-center gap-3">
        <Link href="/members/me" className="text-[0.85rem] text-gray-500 no-underline">
          ← 내 프로필
        </Link>
        <h1 className="text-[1.3rem] font-extrabold m-0">프로필 수정</h1>
      </div>
      <ProfileForm profile={typedProfile} kakaoAvatarUrl={kakaoAvatarUrl} redirectAfterSave="/members/me" />
    </main>
  )
}
