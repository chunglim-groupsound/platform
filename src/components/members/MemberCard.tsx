'use client'

import Image from 'next/image'
import { WhitelistBadge } from './WhitelistBadge'
import type { MemberCardData } from '@/types/app'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: '최고관리자',
  ADMIN:       '운영진',
}

interface MemberCardProps {
  member: MemberCardData
  isMe: boolean
  onClick: (id: string) => void
  variant?: 'grid' | 'compact'
}

export function MemberCard({ member, isMe, onClick, variant = 'grid' }: MemberCardProps) {
  const displayName = member.nickname
    ? (member.name ? `${member.nickname} (${member.name})` : member.nickname)
    : (member.name ?? '비공개')

  const roleLabel = ROLE_LABEL[member.role]

  if (variant === 'compact') {
    return (
      <div
        onClick={() => onClick(member.id)}
        className={`flex items-center gap-2.5 py-2 px-3 rounded-lg bg-gray-50 cursor-pointer border ${isMe ? 'border-blue-500' : 'border-gray-200'}`}
      >
        <div className="relative w-9 h-9 shrink-0">
          {member.profile_image_url ? (
            <Image
              src={member.profile_image_url}
              alt={member.name ?? '비공개'}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-base text-gray-500">
              {(member.name ?? '?')[0]}
            </div>
          )}
        </div>
        <div>
          <div className="text-sm font-semibold">{displayName}</div>
          <div className="text-[0.75rem] text-gray-500">
            {member.session.join(' · ')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => onClick(member.id)}
      className={`rounded-xl border bg-white p-4 cursor-pointer flex flex-col items-center gap-2 transition-shadow duration-150 ${isMe ? 'border-[2px] border-blue-500' : 'border border-gray-200'}`}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div className="relative w-16 h-16">
        {member.profile_image_url ? (
          <Image
            src={member.profile_image_url}
            alt={member.name ?? '비공개'}
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-500">
            {(member.name ?? '?')[0]}
          </div>
        )}
      </div>

      <div className="text-center">
        <div className="font-bold text-[0.95rem]">{displayName}</div>
        {member.generation != null && (
          <div className="text-[0.75rem] text-gray-500">{member.generation}기</div>
        )}
      </div>

      <div className="flex flex-wrap gap-1 justify-center">
        {member.session.map(s => (
          <span key={s} className="py-0.5 px-2 rounded-full bg-blue-50 text-blue-700 text-[0.72rem] font-medium">
            {s}
          </span>
        ))}
      </div>

      <div className="flex gap-1 flex-wrap justify-center">
        {roleLabel && (
          <span className="py-0.5 px-2 rounded-full bg-amber-100 text-amber-800 text-[0.72rem] font-semibold">
            {roleLabel}
          </span>
        )}
        {member.is_whitelist && <WhitelistBadge />}
      </div>

      {member.department && (
        <div className="text-[0.75rem] text-gray-500">{member.department}</div>
      )}

      {member.phone && (
        <a
          href={`tel:${member.phone}`}
          onClick={e => e.stopPropagation()}
          className="text-[0.75rem] text-blue-600 no-underline"
        >
          {member.phone}
        </a>
      )}
    </div>
  )
}
