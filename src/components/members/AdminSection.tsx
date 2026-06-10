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
    <section className="mb-8">
      <h2 className="text-base font-bold text-gray-700 mb-3">
        운영진
      </h2>
      <div className="flex flex-wrap gap-3">
        {admins.map(member => (
          <div key={member.id} className="w-[160px]">
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
