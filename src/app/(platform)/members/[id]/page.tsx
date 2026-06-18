import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canView } from '@/lib/member/privacy'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, BadgeAccent } from '@/components/ui/Badge'
import { WhitelistBadge } from '@/components/members/WhitelistBadge'
import { InviteButton } from '@/components/teams/InviteButton'
import { isAdminRole, hasActiveMemberAccess, ROLE_LABELS } from '@/lib/constants'

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

  const isAdmin  = isAdminRole(me?.role)
  const isMember = hasActiveMemberAccess(me?.status)

  const { data: target } = await supabase
    .from('users')
    .select(`
      id, name, nickname, generation, session, session_years, genre_preference,
      phone, profile_image_url, department, student_id, school_year,
      status, role, is_whitelist, privacy_settings
    `)
    .eq('id', id)
    .single()

  if (!target) notFound()

  const privacy = (target.privacy_settings ?? {}) as Record<string, string>
  const isSelf = false

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
        id:       m.user_id,
        name:     m.user?.nickname ?? m.user?.name ?? '알 수 없음',
        isTarget: m.user_id === id,
      })),
    }
  }).filter((t): t is NonNullable<typeof t> => t !== null)

  const { data: myLedTeams } = await createAdminClient()
    .from('teams')
    .select('id, name')
    .eq('leader_id', me?.id ?? '')
    .eq('is_active', true)

  const canInvite = !!myLedTeams && myLedTeams.length > 0 &&
    ['ACTIVE', 'INACTIVE'].includes(me?.status ?? '')

  const displayName = canView(privacy.name ?? 'member', 'member', isSelf, isMember, isAdmin)
    ? (target.nickname ?? target.name)
    : (target.nickname ?? '(이름 비공개)')

  return (
    <main className="py-8 px-5 max-w-[600px] mx-auto animate-screen-in">
      <Link
        href="/members"
        className="inline-flex items-center gap-1.5 text-[0.82rem] text-muted-foreground no-underline hover:text-foreground transition-colors mb-6"
      >
        ← 명단으로
      </Link>

      {/* 프로필 카드 */}
      <div className="rounded-2xl border border-[var(--border)] bg-surface p-6 flex flex-col items-center gap-3">
        <Avatar
          name={target.name ?? target.nickname ?? '?'}
          src={target.profile_image_url}
          size={72}
        />

        <div className="text-center">
          <div className="font-extrabold text-[1.2rem] text-foreground">{displayName}</div>
          {target.nickname && canView(privacy.name ?? 'member', 'member', isSelf, isMember, isAdmin) && (
            <div className="text-[0.82rem] text-muted-foreground">{target.name}</div>
          )}
          {canView(privacy.generation, 'member', isSelf, isMember, isAdmin) && target.generation != null && (
            <div className="text-[0.85rem] text-muted-foreground mt-0.5">{target.generation}기</div>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap justify-center">
          <Badge>{ROLE_LABELS[target.role] ?? target.role}</Badge>
          {target.is_whitelist && <WhitelistBadge />}
        </div>

        {(target.session ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {target.session!.map((s: string) => {
              const sy = (target.session_years as Record<string, number> | null)?.[s]
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
        {canView(privacy.department, 'member', isSelf, isMember, isAdmin) && target.department && (
          <InfoRow label="학과" value={target.department} />
        )}
        {canView(privacy.school_year, 'member', isSelf, isMember, isAdmin) && target.school_year != null && (
          <InfoRow label="학년" value={SCHOOL_YEAR_LABELS[target.school_year] ?? target.school_year} />
        )}
        {canView(privacy.phone, 'admin', isSelf, isMember, isAdmin) && target.phone && (
          <div className="flex gap-3 py-3 px-4 border-b border-[var(--border-subtle)] last:border-0">
            <span className="w-20 text-[0.82rem] text-muted-foreground shrink-0">연락처</span>
            <a href={`tel:${target.phone}`} className="text-[0.88rem] text-accent no-underline hover:underline">
              {target.phone}
            </a>
          </div>
        )}
        {(target.genre_preference ?? []).length > 0 && (
          <div className="flex gap-3 py-3 px-4 border-b border-[var(--border-subtle)] last:border-0">
            <span className="w-20 text-[0.82rem] text-muted-foreground shrink-0 pt-0.5">선호 장르</span>
            <div className="flex flex-wrap gap-1">
              {target.genre_preference!.map((g: string) => (
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
                          m.isTarget
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

      {canInvite && (
        <div className="mt-5">
          <InviteButton targetId={id} myTeams={myLedTeams!} />
        </div>
      )}
    </main>
  )
}

const SCHOOL_YEAR_LABELS: Record<string, string> = {
  YEAR_1: '1학년', YEAR_2: '2학년', YEAR_3: '3학년',
  YEAR_4: '4학년', YEAR_5: '5학년', COMPLETED: '수료',
  ON_LEAVE: '휴학', GRADUATED: '졸업',
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-3 px-4 border-b border-[var(--border-subtle)] last:border-0">
      <span className="w-20 text-[0.82rem] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[0.88rem] text-foreground">{value}</span>
    </div>
  )
}
