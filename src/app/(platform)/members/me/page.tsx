import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/members/ProfileForm'
import { MyInvitationsSection } from '@/components/members/MyInvitationsSection'
import { MyJoinRequestsSection } from '@/components/members/MyJoinRequestsSection'

function isKakaoUrl(url: string | null): boolean {
  return !!url && url.includes('kakaocdn.net')
}

interface TeamRef { id: string; name: string; leader_id: string | null }
interface InviterRef { id: string; name: string; nickname: string | null }

interface RawInvitation {
  id: string
  message: string | null
  status: string
  created_at: string
  team: TeamRef | null
  inviter: InviterRef | null
}

interface RawJoinRequest {
  id: string
  message: string | null
  status: string
  created_at: string
  team: TeamRef | null
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

  // ACTIVE/INACTIVE 부원만 초대/신청 표시
  const isFullMember = ['ACTIVE', 'INACTIVE'].includes(profile.status)

  let invitations: RawInvitation[] = []
  let joinRequests: RawJoinRequest[] = []

  if (isFullMember) {
    const [invRes, reqRes] = await Promise.all([
      supabase
        .from('team_invitations')
        .select(`
          id, message, status, created_at,
          team:teams!team_id ( id, name, leader_id ),
          inviter:users!invited_by ( id, name, nickname )
        `)
        .eq('invitee_id', profile.id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false }),

      supabase
        .from('team_join_requests')
        .select(`
          id, message, status, created_at,
          team:teams!team_id ( id, name, leader_id )
        `)
        .eq('applicant_id', profile.id)
        .in('status', ['PENDING', 'REJECTED'])
        .order('created_at', { ascending: false }),
    ])

    invitations  = (invRes.data  ?? []) as unknown as RawInvitation[]
    joinRequests = (reqRes.data ?? []) as unknown as RawJoinRequest[]
  }

  return (
    <main>
      <div style={{ padding: '20px 20px 0', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>내 프로필</h1>
      </div>
      <ProfileForm profile={typedProfile} kakaoAvatarUrl={kakaoAvatarUrl} />

      {isFullMember && (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px 40px' }}>
          {invitations.length > 0 && (
            <MyInvitationsSection invitations={invitations} />
          )}
          {joinRequests.length > 0 && (
            <MyJoinRequestsSection requests={joinRequests} />
          )}
        </div>
      )}
    </main>
  )
}
