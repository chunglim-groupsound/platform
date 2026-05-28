'use client'

import { useRouter } from 'next/navigation'
import { MemberCard } from './MemberCard'
import type { MemberCardData } from '@/types/app'

interface AdminSectionProps {
  admins: MemberCardData[]
  myId: string
}

export function AdminSection({ admins, myId }: AdminSectionProps) {
  const router = useRouter()

  if (admins.length === 0) return null

  return (
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>
        운영진
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        {admins.map(member => (
          <div key={member.id} style={{ width: '160px' }}>
            <MemberCard
              member={member}
              isMe={member.id === myId}
              onClick={(id) => {
                if (id === myId) router.push('/members/me')
                else router.push(`/members/${id}`)
              }}
              variant="grid"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
