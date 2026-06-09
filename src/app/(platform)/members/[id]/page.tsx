import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { canView } from '@/lib/member/privacy'
import Image from 'next/image'
import Link from 'next/link'
import { WhitelistBadge } from '@/components/members/WhitelistBadge'
import { InviteButton } from '@/components/members/InviteButton'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: '최고관리자',
  ADMIN: '운영진',
  TEAM_LEADER: '팀장',
  MEMBER: '일반 부원',
  PROBATION_MEMBER: '수습 부원',
}

interface TeamMemberUser { id: string; name: string; nickname: string | null }
interface TeamMemberEntry { user_id: string; user: TeamMemberUser | null }
interface TeamRef {
  id: string
  name: string
  leader_id: string | null
  team_members: TeamMemberEntry[]
}
interface TeamMembership { team_id: string; team: TeamRef | null }

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: me } = await supabase
    .from('users')
    .select('id, role, status')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (me?.id === id) redirect('/members/me')

  const isAdmin  = ['ADMIN', 'SUPER_ADMIN'].includes(me?.role ?? '')
  const isMember = ['ACTIVE', 'INACTIVE', 'PROBATION'].includes(me?.status ?? '')

  const { data: target } = await supabase
    .from('users')
    .select(`
      id, name, nickname, generation, session, genre_preference,
      phone, profile_image_url, department, student_id, school_year,
      status, role, is_whitelist, privacy_settings
    `)
    .eq('id', id)
    .single()

  if (!target) notFound()

  const privacy = (target.privacy_settings ?? {}) as Record<string, string>
  const isSelf = false

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
    .eq('user_id', id)

  const memberTeams = (teamMemberships ?? []).map((tm: unknown) => {
    const row = tm as TeamMembership
    const t = row.team
    if (!t) return null
    return {
      id:        t.id,
      name:      t.name,
      is_leader: t.leader_id === id,
      members:   (t.team_members ?? []).map(m => ({
        id:   m.user_id,
        name: m.user?.nickname ?? m.user?.name ?? '알 수 없음',
        isTarget: m.user_id === id,
      })),
    }
  }).filter((t): t is NonNullable<typeof t> => t !== null)

  // 내가 팀장인 팀 목록 (초대 드롭다운용)
  const { data: myLedTeams } = await supabaseAdmin
    .from('teams')
    .select('id, name')
    .eq('leader_id', me?.id ?? '')
    .eq('is_active', true)

  const canInvite = !!myLedTeams && myLedTeams.length > 0 &&
    ['ACTIVE', 'INACTIVE'].includes(me?.status ?? '')

  return (
    <main style={{ padding: '24px 20px', maxWidth: '600px', margin: '0 auto' }}>
      <Link href="/members" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none' }}>
        ← 명단으로
      </Link>

      <div style={{
        marginTop: '20px', background: '#f9fafb', borderRadius: '16px',
        padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
      }}>
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          {target.profile_image_url ? (
            <Image
              src={target.profile_image_url}
              alt={target.name}
              fill
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', color: '#6b7280',
            }}>
              {target.name[0]}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          {canView(privacy.name ?? 'member', 'member', isSelf, isMember, isAdmin) ? (
            <>
              <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                {target.nickname ?? target.name}
              </div>
              {target.nickname && (
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>{target.name}</div>
              )}
            </>
          ) : (
            <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>
              {target.nickname ?? '(이름 비공개)'}
            </div>
          )}
          {canView(privacy.generation, 'member', isSelf, isMember, isAdmin) && target.generation != null && (
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>{target.generation}기</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{
            padding: '3px 10px', borderRadius: '9999px',
            background: '#e0f2fe', color: '#075985', fontSize: '0.78rem', fontWeight: 600,
          }}>
            {ROLE_LABEL[target.role] ?? target.role}
          </span>
          {target.is_whitelist && <WhitelistBadge />}
        </div>

        {(target.session ?? []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            {target.session!.map((s: string) => (
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

      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '0' }}>
        {canView(privacy.department, 'member', isSelf, isMember, isAdmin) && target.department && (
          <Row label="학과" value={target.department} />
        )}
        {canView(privacy.school_year, 'member', isSelf, isMember, isAdmin) && target.school_year != null && (
          <Row label="학년" value={`${target.school_year}학년`} />
        )}
        {canView(privacy.phone, 'admin', isSelf, isMember, isAdmin) && target.phone && (
          <div style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ width: '80px', fontSize: '0.85rem', color: '#6b7280', flexShrink: 0 }}>연락처</span>
            <a href={`tel:${target.phone}`} style={{ fontSize: '0.9rem', color: '#2563eb' }}>
              {target.phone}
            </a>
          </div>
        )}
        {(target.genre_preference ?? []).length > 0 && (
          <div style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ width: '80px', fontSize: '0.85rem', color: '#6b7280', flexShrink: 0 }}>선호 장르</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {target.genre_preference!.map((g: string) => (
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
                          background: m.isTarget ? '#eff6ff' : '#f3f4f6',
                          color: m.isTarget ? '#1d4ed8' : '#4b5563',
                          fontWeight: m.isTarget ? 600 : 400,
                          border: m.isTarget ? '1px solid #bfdbfe' : '1px solid transparent',
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

      {canInvite && (
        <div style={{ marginTop: '20px' }}>
          <InviteButton targetId={id} myTeams={myLedTeams!} />
        </div>
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
