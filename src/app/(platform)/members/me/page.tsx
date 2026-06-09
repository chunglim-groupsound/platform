import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
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
  TEAM_LEADER: '팀장',
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
      session, genre_preference, phone,
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
  const { data: teamMemberships } = await supabaseAdmin
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
      supabaseAdmin
        .from('team_invitations')
        .select(`
          id, message, status, created_at,
          team:teams!team_id ( id, name, leader_id ),
          inviter:users!invited_by ( id, name, nickname )
        `)
        .eq('invitee_id', profile.id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false }),

      supabaseAdmin
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
    <main style={{ padding: '24px 20px', maxWidth: '600px', margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>내 프로필</h1>
        <Link href="/members/me/edit" style={{
          padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
          border: '1px solid #d1d5db', background: '#fff', textDecoration: 'none', color: '#374151',
        }}>
          수정
        </Link>
      </div>

      {/* 프로필 카드 */}
      <div style={{
        background: '#f9fafb', borderRadius: '16px',
        padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
      }}>
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          {profileImageUrl ? (
            <Image
              src={profileImageUrl}
              alt={profile.name}
              fill
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', color: '#6b7280',
            }}>
              {profile.name[0]}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>
            {profile.nickname ?? profile.name}
          </div>
          {profile.nickname && (
            <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>{profile.name}</div>
          )}
          {profile.generation != null && (
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>{profile.generation}기</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{
            padding: '3px 10px', borderRadius: '9999px',
            background: '#e0f2fe', color: '#075985', fontSize: '0.78rem', fontWeight: 600,
          }}>
            {ROLE_LABEL[profile.role] ?? profile.role}
          </span>
          {profile.is_whitelist && <WhitelistBadge />}
        </div>

        {(profile.session ?? []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            {profile.session!.map((s: string) => (
              <span key={s} style={{
                padding: '3px 10px', borderRadius: '9999px',
                background: '#eff6ff', color: '#1d4ed8', fontSize: '0.78rem',
              }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 상세 정보 */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
        {profile.department && <Row label="학과" value={profile.department} />}
        {profile.school_year != null && <Row label="학년" value={`${profile.school_year}학년`} />}
        {profile.student_id && <Row label="학번" value={profile.student_id} />}
        {profile.phone && (
          <div style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ width: '80px', fontSize: '0.85rem', color: '#6b7280', flexShrink: 0 }}>연락처</span>
            <a href={`tel:${profile.phone}`} style={{ fontSize: '0.9rem', color: '#2563eb' }}>
              {profile.phone}
            </a>
          </div>
        )}
        {(profile.genre_preference ?? []).length > 0 && (
          <div style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ width: '80px', fontSize: '0.85rem', color: '#6b7280', flexShrink: 0 }}>선호 장르</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {profile.genre_preference!.map((g: string) => (
                <span key={g} style={{
                  padding: '2px 8px', borderRadius: '9999px',
                  background: '#f3f4f6', color: '#374151', fontSize: '0.78rem',
                }}>
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 소속 팀 */}
      <div style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>소속 팀</h2>
        {memberTeams.length === 0 ? (
          <p style={{ fontSize: '0.88rem', color: '#9ca3af' }}>소속 팀 없음</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {memberTeams.map(t => (
              <Link
                key={t.id}
                href={`/teams/${t.id}`}
                style={{
                  display: 'flex', flexDirection: 'column', gap: '8px',
                  padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb',
                  background: '#fff', textDecoration: 'none', color: '#111827',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}>{t.name}</span>
                  {t.is_leader && (
                    <span style={{
                      padding: '2px 8px', borderRadius: '9999px', fontSize: '0.72rem',
                      fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d',
                    }}>
                      팀장
                    </span>
                  )}
                </div>
                {t.members.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {t.members.map(m => (
                      <span
                        key={m.id}
                        style={{
                          padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem',
                          background: m.isMe ? '#eff6ff' : '#f3f4f6',
                          color: m.isMe ? '#1d4ed8' : '#4b5563',
                          fontWeight: m.isMe ? 600 : 400,
                          border: m.isMe ? '1px solid #bfdbfe' : '1px solid transparent',
                        }}
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
    <div style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ width: '80px', fontSize: '0.85rem', color: '#6b7280', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.9rem', color: '#111827' }}>{value}</span>
    </div>
  )
}
