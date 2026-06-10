import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canView } from '@/lib/member/privacy'
import Image from 'next/image'
import Link from 'next/link'
import { WhitelistBadge } from '@/components/members/WhitelistBadge'
import { InviteButton } from '@/components/teams/InviteButton'
import { isAdminRole, hasActiveMemberAccess } from '@/lib/constants'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: '최고관리자',
  ADMIN: '운영진',
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
  const { data: myLedTeams } = await createAdminClient()
    .from('teams')
    .select('id, name')
    .eq('leader_id', me?.id ?? '')
    .eq('is_active', true)

  const canInvite = !!myLedTeams && myLedTeams.length > 0 &&
    ['ACTIVE', 'INACTIVE'].includes(me?.status ?? '')

  return (
    <main className="py-6 px-5 max-w-[600px] mx-auto">
      <Link href="/members" className="text-[0.85rem] text-gray-500 no-underline">
        ← 명단으로
      </Link>

      <div className="mt-5 bg-gray-50 rounded-2xl p-6 flex flex-col items-center gap-3">
        <div className="relative w-20 h-20">
          {target.profile_image_url ? (
            <Image
              src={target.profile_image_url}
              alt={target.name}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-[2rem] text-gray-500">
              {target.name[0]}
            </div>
          )}
        </div>

        <div className="text-center">
          {canView(privacy.name ?? 'member', 'member', isSelf, isMember, isAdmin) ? (
            <>
              <div className="font-extrabold text-[1.2rem]">
                {target.nickname ?? target.name}
              </div>
              {target.nickname && (
                <div className="text-[0.82rem] text-gray-500">{target.name}</div>
              )}
            </>
          ) : (
            <div className="font-extrabold text-[1.2rem]">
              {target.nickname ?? '(이름 비공개)'}
            </div>
          )}
          {canView(privacy.generation, 'member', isSelf, isMember, isAdmin) && target.generation != null && (
            <div className="text-[0.85rem] text-gray-500 mt-0.5">{target.generation}기</div>
          )}
        </div>

        <div className="flex gap-1.5 flex-wrap justify-center">
          <span className="py-[3px] px-2.5 rounded-full bg-[#e0f2fe] text-[#075985] text-[0.78rem] font-semibold">
            {ROLE_LABEL[target.role] ?? target.role}
          </span>
          {target.is_whitelist && <WhitelistBadge />}
        </div>

        {(target.session ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {target.session!.map((s: string) => {
              const sy = (target.session_years as Record<string, number> | null)?.[s]
              return (
                <span key={s} className="py-[3px] px-2.5 rounded-full bg-blue-50 text-blue-700 text-[0.78rem]">
                  {s}{sy != null ? ` ${sy}년` : ''}
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-0">
        {canView(privacy.department, 'member', isSelf, isMember, isAdmin) && target.department && (
          <Row label="학과" value={target.department} />
        )}
        {canView(privacy.school_year, 'member', isSelf, isMember, isAdmin) && target.school_year != null && (
          <Row label="학년" value={`${target.school_year}학년`} />
        )}
        {canView(privacy.phone, 'admin', isSelf, isMember, isAdmin) && target.phone && (
          <div className="flex gap-3 py-2.5 border-b border-gray-100">
            <span className="w-20 text-[0.85rem] text-gray-500 shrink-0">연락처</span>
            <a href={`tel:${target.phone}`} className="text-[0.9rem] text-blue-600">
              {target.phone}
            </a>
          </div>
        )}
        {(target.genre_preference ?? []).length > 0 && (
          <div className="flex gap-3 py-2.5 border-b border-gray-100">
            <span className="w-20 text-[0.85rem] text-gray-500 shrink-0">선호 장르</span>
            <div className="flex flex-wrap gap-1">
              {target.genre_preference!.map((g: string) => (
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
                          m.isTarget
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

      {canInvite && (
        <div className="mt-5">
          <InviteButton targetId={id} myTeams={myLedTeams!} />
        </div>
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
