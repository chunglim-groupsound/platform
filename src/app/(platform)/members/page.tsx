'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MemberCard } from '@/components/members/MemberCard'
import { MemberFilter, type FilterState } from '@/components/members/MemberFilter'
import { AdminSection } from '@/components/members/AdminSection'
import { Kicker } from '@/components/ui/Kicker'
import { Button } from '@/components/ui/Button'
import type { MemberCardData } from '@/types/app'
import { isAdminRole } from '@/lib/constants'

const PAGE_SIZE = 48

export default function MembersPage() {
  const router = useRouter()
  const [myId, setMyId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [members, setMembers] = useState<MemberCardData[]>([])
  const [admins,  setAdmins]  = useState<MemberCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
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

  // 필터 변경 시 첫 페이지로 리셋
  useEffect(() => { setPage(0) }, [filter])

  const filtered = useMemo(() => {
    let result = members

    if (filter.q) {
      const q = filter.q.toLowerCase()
      result = result.filter(m =>
        (m.name ?? '').toLowerCase().includes(q) ||
        (m.nickname ?? '').toLowerCase().includes(q)
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

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleClick = (id: string) => {
    if (id === myId) router.push('/members/me')
    else router.push(`/members/${id}`)
  }

  return (
    <main className="py-8 px-5 max-w-[960px] mx-auto animate-screen-in">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col gap-1.5">
          <Kicker>청림그룹사운드</Kicker>
          <h1 className="text-[1.5rem] font-extrabold tracking-[-0.3px] text-foreground m-0 leading-tight">
            부원 명단
          </h1>
        </div>
        <Button size="sm" onClick={() => router.push('/teams')}>
          팀 목록
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-center py-16 text-[0.9rem]">불러오는 중...</div>
      ) : (
        <>
          <AdminSection admins={admins} myId={myId ?? ''} />

          <div className="mb-5">
            <MemberFilter value={filter} onChange={setFilter} isAdmin={isAdmin} />
          </div>

          <div className="text-[0.78rem] text-subtle-foreground font-mono mb-4">
            {filtered.length}명
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))' }}>
            {paged.map(m => (
              <MemberCard
                key={m.id}
                member={m}
                isMe={m.id === myId}
                onClick={handleClick}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-16 text-[0.88rem]">
              조건에 맞는 부원이 없습니다.
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                ← 이전
              </Button>
              <span className="text-[0.82rem] text-muted-foreground font-mono px-2">
                {page + 1} / {totalPages}
              </span>
              <Button
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                다음 →
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
