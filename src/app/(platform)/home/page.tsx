import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardCards } from '@/components/layout/DashboardCards'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: '최고관리자',
  ADMIN: '운영진',
  TEAM_LEADER: '팀장',
  MEMBER: '정식 부원',
  PROBATION_MEMBER: '수습 부원',
}

const STATUS_LABEL: Record<string, string> = {
  PROBATION: '수습 중',
  ACTIVE: '정식',
  INACTIVE: '비활동',
}

export default async function TimetablePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, nickname, role, status, generation, profile_image_url')
    .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
    .maybeSingle()

  if (!profile) redirect('/')

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(profile.role)

  // 간단한 통계
  const [{ count: memberCount }, { count: teamCount }] = await Promise.all([
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .in('status', ['ACTIVE', 'INACTIVE', 'PROBATION']),
    supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
  ])

  const displayName = profile.nickname ?? profile.name

  const cards: {
    href: string
    emoji: string
    title: string
    desc: string
    adminOnly?: boolean
    color: string
  }[] = [
    {
      href: '/members',
      emoji: '👥',
      title: '부원 명단',
      desc: '전체 부원 검색 · 필터 · 프로필 조회',
      color: '#eff6ff',
    },
    {
      href: '/members/me',
      emoji: '✏️',
      title: '내 프로필',
      desc: '세션, 학과, 연락처 등 프로필 수정',
      color: '#f0fdf4',
    },
    {
      href: '/teams',
      emoji: '🎸',
      title: '팀 목록',
      desc: '합주 팀 구성 및 현재 연습 곡 확인',
      color: '#fff7ed',
    },
    {
      href: '/notices',
      emoji: '📢',
      title: '공지사항',
      desc: '동아리 공지 및 일정 안내',
      color: '#fdf4ff',
    },
    {
      href: '/admin/applications',
      emoji: '⚙️',
      title: '운영 관리',
      desc: '가입 신청 처리 · 부원 상태 관리',
      adminOnly: true,
      color: '#fff1f2',
    },
    {
      href: '/admin/members',
      emoji: '👤',
      title: '부원 관리',
      desc: '기수 · 역할 · 화이트리스트 설정',
      adminOnly: true,
      color: '#fff1f2',
    },
  ]

  const visibleCards = cards.filter(c => !c.adminOnly || isAdmin)

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* 환영 배너 */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #111827 100%)',
        borderRadius: '16px',
        padding: '28px 28px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
            청림그룹사운드
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.3px' }}>
            안녕하세요, {displayName}님 👋
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 10px', borderRadius: '9999px',
              background: 'rgba(255,255,255,0.12)', fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.8)',
            }}>
              {ROLE_LABEL[profile.role] ?? profile.role}
            </span>
            {profile.generation != null && (
              <span style={{
                padding: '3px 10px', borderRadius: '9999px',
                background: 'rgba(255,255,255,0.12)', fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.8)',
              }}>
                {profile.generation}기
              </span>
            )}
            <span style={{
              padding: '3px 10px', borderRadius: '9999px',
              background: 'rgba(255,255,255,0.12)', fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.8)',
            }}>
              {STATUS_LABEL[profile.status] ?? profile.status}
            </span>
          </div>
        </div>

        {/* 통계 */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }}>{memberCount ?? '-'}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>총 부원</div>
          </div>
          <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }}>{teamCount ?? '-'}</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>활성 팀</div>
          </div>
        </div>
      </section>

      {/* 빠른 이동 */}
      <section>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#6b7280', marginBottom: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          메뉴
        </h2>
        <DashboardCards cards={visibleCards} />
      </section>

      {/* 타임테이블 예고 */}
      <section style={{
        border: '1px dashed #d1d5db',
        borderRadius: '14px',
        padding: '28px',
        textAlign: 'center',
        color: '#9ca3af',
      }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🗓</div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#6b7280', marginBottom: '4px' }}>합주실 타임테이블</div>
        <div style={{ fontSize: '0.82rem' }}>예약 시스템 개발 중입니다.</div>
      </section>

    </main>
  )
}
