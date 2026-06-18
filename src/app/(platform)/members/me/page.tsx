import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, BadgeAccent } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Kicker } from '@/components/ui/Kicker'
import { WhitelistBadge } from '@/components/members/WhitelistBadge'
import { MyInvitationsSection } from '@/components/members/MyInvitationsSection'
import { MyJoinRequestsSection } from '@/components/members/MyJoinRequestsSection'
import { hasActiveMemberAccess, ROLE_LABELS } from '@/lib/constants'

function isKakaoUrl(url: string | null): boolean {
  return !!url && url.includes('kakaocdn.net')
}

const SCHOOL_YEAR_LABELS: Record<string, string> = {
  YEAR_1: '1학년', YEAR_2: '2학년', YEAR_3: '3학년',
  YEAR_4: '4학년', YEAR_5: '5학년', COMPLETED: '수료',
  ON_LEAVE: '휴학', GRADUATED: '졸업',
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
        id:   m.user_id,
        name: m.user?.nickname ?? m.user?.name ?? '알 수 없음',
        isMe: m.user_id === profile.id,
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

  const displayName = profile.nickname ?? profile.name ?? '부원'

  return (
    <main className="py-8 px-5 max-w-[600px] mx-auto animate-screen-in">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col gap-1.5">
          <Kicker>내 프로필</Kicker>
          <h1 className="text-[1.5rem] font-extrabold tracking-[-0.3px] text-foreground m-0 leading-tight">
            {displayName}
          </h1>
        </div>
        <Link href="/members/me/edit">
          <Button size="sm">수정</Button>
        </Link>
      </div>

      {/* 프로필 카드 */}
      <div className="rounded-2xl border border-[var(--border)] bg-surface p-6 flex flex-col items-center gap-3">
        <Avatar
          name={profile.name ?? profile.nickname ?? '?'}
          src={profileImageUrl}
          size={72}
        />

        <div className="text-center">
          <div className="font-extrabold text-[1.2rem] text-foreground">
            {profile.nickname ?? profile.name}
          </div>
          {profile.nickname && (
            <div className="text-[0.82rem] text-muted-foreground">{profile.name}</div>
          )}
          {profile.generation != null && (
            <div className="text-[0.85rem] text-muted-foreground mt-0.5">{profile.generation}기</div>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap justify-center">
          <Badge>{ROLE_LABELS[profile.role] ?? profile.role}</Badge>
          {profile.is_whitelist && <WhitelistBadge />}
        </div>

        {(profile.session ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {profile.session!.map((s: string) => {
              const sy = (profile.session_years as Record<string, number> | null)?.[s]
              return (
                <BadgeAccent key={s}>
                  {s}{sy != null ? ` ${sy}년` : ''}
                </BadgeAccent>
              )
            })}
          </div>
        )}
      </div>

      {/* 상세 정보 */}
      <div className="mt-4 flex flex-col rounded-xl border border-[var(--border)] bg-surface overflow-hidden">
        {profile.department && <InfoRow label="학과" value={profile.department} />}
        {profile.school_year != null && (
          <InfoRow label="학년" value={SCHOOL_YEAR_LABELS[profile.school_year] ?? profile.school_year} />
        )}
        {profile.student_id && <InfoRow label="학번" value={profile.student_id} />}
        {profile.phone && (
          <div className="flex gap-3 py-3 px-4 border-b border-[var(--border-subtle)] last:border-0">
            <span className="w-20 text-[0.82rem] text-muted-foreground shrink-0">연락처</span>
            <a href={`tel:${profile.phone}`} className="text-[0.88rem] text-accent no-underline hover:underline">
              {profile.phone}
            </a>
          </div>
        )}
        {(profile.genre_preference ?? []).length > 0 && (
          <div className="flex gap-3 py-3 px-4 border-b border-[var(--border-subtle)] last:border-0">
            <span className="w-20 text-[0.82rem] text-muted-foreground shrink-0 pt-0.5">선호 장르</span>
            <div className="flex flex-wrap gap-1">
              {profile.genre_preference!.map((g: string) => (
                <Badge key={g}>{g}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 소속 팀 */}
      <div className="mt-6">
        <p className="text-[0.78rem] font-semibold text-muted-foreground uppercase tracking-[0.12em] font-mono mb-3">
          소속 팀
        </p>
        {memberTeams.length === 0 ? (
          <p className="text-[0.85rem] text-subtle-foreground">소속 팀 없음</p>
        ) : (
          <div className="flex flex-col gap-2">
            {memberTeams.map(t => (
              <Link
                key={t.id}
                href={`/teams/${t.id}`}
                className="flex flex-col gap-2 p-3.5 rounded-xl border border-[var(--border)] bg-surface hover:bg-surface-elevated no-underline transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-[0.9rem] font-semibold text-foreground">{t.name}</span>
                  {t.is_leader && <BadgeAccent>팀장</BadgeAccent>}
                </div>
                {t.members.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {t.members.map(m => (
                      <span
                        key={m.id}
                        className={`py-0.5 px-2 rounded-full text-[0.75rem] ${
                          m.isMe
                            ? 'bg-accent-muted text-accent font-semibold'
                            : 'bg-surface-elevated text-muted-foreground'
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-3 px-4 border-b border-[var(--border-subtle)] last:border-0">
      <span className="w-20 text-[0.82rem] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[0.88rem] text-foreground">{value}</span>
    </div>
  )
}
