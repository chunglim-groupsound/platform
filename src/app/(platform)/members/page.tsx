'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MemberCard } from '@/components/members/MemberCard'
import { MemberFilter, type FilterState } from '@/components/members/MemberFilter'
import { AdminSection } from '@/components/members/AdminSection'
import type { MemberCardData } from '@/types/app'
import { isAdminRole } from '@/lib/constants'

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
      setIsAdmin(isAdminRole(profile?.role))
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
    if (filter.role === 'IS_LEADER') {
      result = result.filter(m => m.is_leader)
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
    <main className="py-6 px-5 max-w-[960px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-[1.4rem] font-extrabold m-0">부원 명단</h1>
        <button
          onClick={() => router.push('/teams')}
          className="py-[7px] px-4 rounded-lg text-[0.85rem] border border-gray-300 bg-white cursor-pointer font-medium"
        >
          팀 목록 보기
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-[60px]">불러오는 중...</div>
      ) : (
        <>
          <AdminSection admins={admins} myId={myId ?? ''} />

          <div className="mb-5">
            <MemberFilter value={filter} onChange={setFilter} isAdmin={isAdmin} />
          </div>

          <div className="text-[0.82rem] text-gray-500 mb-3">
            {filtered.length}명
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '12px',
            }}
          >
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
            <div className="text-center text-gray-400 py-12">
              조건에 맞는 부원이 없습니다.
            </div>
          )}
        </>
      )}
    </main>
  )
}
