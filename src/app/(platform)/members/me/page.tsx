import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Image from 'next/image'
import Link from 'next/link'
import { WhitelistBadge } from '@/components/members/WhitelistBadge'
import { MyInvitationsSection } from '@/components/members/MyInvitationsSection'
import { MyJoinRequestsSection } from '@/components/members/MyJoinRequestsSection'
import { hasActiveMemberAccess } from '@/lib/constants'

function isKakaoUrl(url: string | null): boolean {
  return !!url && url.includes('kakaocdn.net')
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: '최고관리자',
  ADMIN: '운영진',
  MEMBER: '일반 부원',
  PROBATION_MEMBER: '수습 부원',
}

interface TeamRef { id: string; name: string; leader_id: string | null }
interface InviterRef { id: string; name: string; nickname: string | null }
interface RawInvitation {
  id: string; message: string | null; status: string; created_at: string
  team: TeamRef | null; inviter: InviterRef | null
}
interface RawJoinRequest {
  id: string; message: string | null; status: string; created_at: string
  team: TeamRef | null
}
interface TeamMemberUser { id: string; name: string; nickname: string | null }
interface TeamMemberEntry { user_id: string; user: TeamMemberUser | null }
interface TeamWithMembers {
  id: string; name: string; leader_id: string | null
  team_members: TeamMemberEntry[]
}
interface TeamMembership { team_id: string; team: TeamWithMembers | null }

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
      session, session_years, genre_preference, phone,
      department, student_id, school_year,
      privacy_settings
    `)
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!profile) redirect('/')

  if (!hasActiveMemberAccess(profile.status)) redirect('/status')

  // 카카오 URL 자동 동기화
  let profileImageUrl = profile.profile_image_url
  if (kakaoAvatarUrl && isKakaoUrl(profile.profile_image_url) && profile.profile_image_url !== kakaoAvatarUrl) {
    const { error } = await supabase
      .from('users')
      .update({ profile_image_url: kakaoAvatarUrl })
      .eq('id', profile.id)
    if (!error) profileImageUrl = kakaoAvatarUrl
  }

  const isFullMember = ['ACTIVE', 'INACTIVE'].includes(profile.status)

  // 소속 팀 + 팀원 조회
  const { data: teamMemberships } = await createAdminClient()
    .from('team_members')
    .select(`
      team_id,
      team:teams!team_id (
        id, name, leader_id,
        team_members (
          user_id,
          user:users!user_id ( id, name, nickname )
        )
      )
    `)
    .eq('user_id', profile.id)

  const memberTeams = (teamMemberships ?? []).map((tm: unknown) => {
    const row = tm as TeamMembership
    const t = row.team
    if (!t) return null
    return {
      id:        t.id,
      name:      t.name,
      is_leader: t.leader_id === profile.id,
      members:   (t.team_members ?? []).map(m => ({
        id:       m.user_id,
        name:     m.user?.nickname ?? m.user?.name ?? '알 수 없음',
        isMe:     m.user_id === profile.id,
      })),
    }
  }).filter((t): t is NonNullable<typeof t> => t !== null)

  let invitations: RawInvitation[] = []
  let joinRequests: RawJoinRequest[] = []

  if (isFullMember) {
    const [invRes, reqRes] = await Promise.all([
      createAdminClient()
        .from('team_invitations')
        .select(`
          id, message, status, created_at,
          team:teams!team_id ( id, name, leader_id ),
          inviter:users!invited_by ( id, name, nickname )
        `)
        .eq('invitee_id', profile.id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false }),

      createAdminClient()
        .from('team_join_requests')
        .select(`
          id, message, status, created_at,
          team:teams!team_id ( id, name, leader_id )
        `)
        .eq('applicant_id', profile.id)
        .in('status', ['PENDING', 'REJECTED'])
        .order('created_at', { ascending: false }),
    ])

    invitations  = (invRes.data  ?? []) as RawInvitation[]
    joinRequests = (reqRes.data ?? []) as RawJoinRequest[]
  }

  return (
    <main className="py-6 px-5 max-w-[600px] mx-auto">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-[1.3rem] font-extrabold m-0">내 프로필</h1>
        <Link href="/members/me/edit" className="py-1.5 px-3.5 rounded-lg text-[0.85rem] font-semibold border border-gray-300 bg-white no-underline text-gray-700">
          수정
        </Link>
      </div>

      {/* 프로필 카드 */}
      <div className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center gap-3">
        <div className="relative w-20 h-20">
          {profileImageUrl ? (
            <Image
              src={profileImageUrl}
              alt={profile.name}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-[2rem] text-gray-500">
              {profile.name[0]}
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="font-extrabold text-[1.2rem]">
            {profile.nickname ?? profile.name}
          </div>
          {profile.nickname && (
            <div className="text-[0.82rem] text-gray-500">{profile.name}</div>
          )}
          {profile.generation != null && (
            <div className="text-[0.85rem] text-gray-500 mt-0.5">{profile.generation}기</div>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap justify-center">
          <span className="py-[3px] px-2.5 rounded-full bg-[#e0f2fe] text-[#075985] text-[0.78rem] font-semibold">
            {ROLE_LABEL[profile.role] ?? profile.role}
          </span>
          {profile.is_whitelist && <WhitelistBadge />}
        </div>

        {(profile.session ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {profile.session!.map((s: string) => {
              const sy = (profile.session_years as Record<string, number> | null)?.[s]
              return (
                <span key={s} className="py-[3px] px-2.5 rounded-full bg-blue-50 text-blue-700 text-[0.78rem]">
                  {s}{sy != null ? ` ${sy}년` : ''}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* 상세 정보 */}
      <div className="mt-5 flex flex-col gap-0">
        {profile.department && <Row label="학과" value={profile.department} />}
        {profile.school_year != null && <Row label="학년" value={`${profile.school_year}학년`} />}
        {profile.student_id && <Row label="학번" value={profile.student_id} />}
        {profile.phone && (
          <div className="flex gap-3 py-2.5 border-b border-gray-100">
            <span className="w-20 text-[0.85rem] text-gray-500 shrink-0">연락처</span>
            <a href={`tel:${profile.phone}`} className="text-[0.9rem] text-blue-600">
              {profile.phone}
            </a>
          </div>
        )}
        {(profile.genre_preference ?? []).length > 0 && (
          <div className="flex gap-3 py-2.5 border-b border-gray-100">
            <span className="w-20 text-[0.85rem] text-gray-500 shrink-0">선호 장르</span>
            <div className="flex flex-wrap gap-1">
              {profile.genre_preference!.map((g: string) => (
                <span key={g} className="py-0.5 px-2 rounded-full bg-gray-100 text-gray-700 text-[0.78rem]">
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 소속 팀 */}
      <div className="mt-6">
        <h2 className="text-base font-bold mb-2.5">소속 팀</h2>
        {memberTeams.length === 0 ? (
          <p className="text-[0.88rem] text-gray-400">소속 팀 없음</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {memberTeams.map(t => (
              <Link
                key={t.id}
                href={`/teams/${t.id}`}
                className="flex flex-col gap-2 p-3 rounded-[10px] border border-gray-200 bg-white no-underline text-gray-900"
              >
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-[0.9rem] font-semibold">{t.name}</span>
                  {t.is_leader && (
                    <span className="py-0.5 px-2 rounded-full text-[0.72rem] font-bold bg-amber-100 text-amber-800 border border-yellow-300">
                      팀장
                    </span>
                  )}
                </div>
                {t.members.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.members.map(m => (
                      <span
                        key={m.id}
                        className={`py-0.5 px-2 rounded-full text-[0.75rem] ${
                          m.isMe
                            ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                            : 'bg-gray-100 text-gray-600 font-normal border border-transparent'
                        }`}
                      >
                        {m.name}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 받은 초대 / 내 신청 */}
      {isFullMember && (
        <>
          {invitations.length > 0 && <MyInvitationsSection invitations={invitations} />}
          {joinRequests.length > 0 && <MyJoinRequestsSection requests={joinRequests} />}
        </>
      )}
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-gray-100">
      <span className="w-20 text-[0.85rem] text-gray-500 shrink-0">{label}</span>
      <span className="text-[0.9rem] text-gray-900">{value}</span>
    </div>
  )
}
