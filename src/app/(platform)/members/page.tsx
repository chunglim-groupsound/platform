'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MemberCard } from '@/components/members/MemberCard'
import { MemberFilter, type FilterState } from '@/components/members/MemberFilter'
import { AdminSection } from '@/components/members/AdminSection'
import type { MemberCardData } from '@/types/app'

export default function MembersPage() {
  const router = useRouter()
  const [myId, setMyId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [members, setMembers] = useState<MemberCardData[]>([])
  const [admins,  setAdmins]  = useState<MemberCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterState>({
    q: '', sessions: [], generation: '', role: '', isWhitelist: false,
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/')
      const { data: profile } = await supabase
        .from('users')
        .select('id, role')
        .or(`id.eq.${user.id},linked_auth_id.eq.${user.id}`)
        .maybeSingle()
      setMyId(profile?.id ?? user.id)
      setIsAdmin(['ADMIN', 'SUPER_ADMIN'].includes(profile?.role ?? ''))
    })
  }, [router])

  useEffect(() => {
    fetch('/api/members')
      .then(r => r.json())
      .then(data => {
        setMembers(data.members ?? [])
        setAdmins(data.admins ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = members

    if (filter.q) {
      const q = filter.q.toLowerCase()
      result = result.filter(m =>
        (m.name ?? '').toLowerCase().includes(q) ||
        (m.nickname ?? '').toLowerCase().includes(q) ||
        String(m.generation ?? '').includes(q)
      )
    }
    if (filter.sessions.length > 0) {
      result = result.filter(m => filter.sessions.some(s => m.session.includes(s)))
    }
    if (filter.generation) {
      result = result.filter(m => m.generation === Number(filter.generation))
    }
    if (filter.role === 'TEAM_LEADER') {
      result = result.filter(m => m.isLeader)
    } else if (filter.role) {
      result = result.filter(m => m.role === filter.role)
    }
    if (filter.isWhitelist) {
      result = result.filter(m => m.is_whitelist)
    }
    return result
  }, [members, filter])

  const handleClick = (id: string) => {
    if (id === myId) router.push('/members/me')
    else router.push(`/members/${id}`)
  }

  return (
    <main style={{ padding: '24px 20px', maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>부원 명단</h1>
        <button
          onClick={() => router.push('/teams')}
          style={{
            padding: '7px 16px', borderRadius: '8px', fontSize: '0.85rem',
            border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 500,
          }}
        >
          팀 목록 보기
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#9ca3af', textAlign: 'center', padding: '60px 0' }}>불러오는 중...</div>
      ) : (
        <>
          <AdminSection admins={admins} myId={myId ?? ''} />

          <div style={{ marginBottom: '20px' }}>
            <MemberFilter value={filter} onChange={setFilter} isAdmin={isAdmin} />
          </div>

          <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '12px' }}>
            {filtered.length}명
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px',
          }}>
            {filtered.map(m => (
              <MemberCard
                key={m.id}
                member={m}
                isMe={m.id === myId}
                onClick={handleClick}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '48px 0' }}>
              조건에 맞는 부원이 없습니다.
            </div>
          )}
        </>
      )}
    </main>
  )
}
