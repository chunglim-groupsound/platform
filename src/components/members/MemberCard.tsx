'use client'

import { Avatar } from '@/components/ui/Avatar'
import { Badge, BadgeAccent } from '@/components/ui/Badge'
import { WhitelistBadge } from './WhitelistBadge'
import type { MemberCardData } from '@/types/app'

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: '개발 담당',
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

  const avatarName = member.name ?? member.nickname ?? '?'
  const roleLabel = ROLE_LABEL[member.role]

  if (variant === 'compact') {
    return (
      <div
        onClick={() => onClick(member.id)}
        className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl bg-surface cursor-pointer border transition-colors ${isMe ? 'border-accent/50' : 'border-[var(--border)]'} hover:bg-surface-elevated`}
      >
        <Avatar name={avatarName} src={member.profile_image_url} size={36} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{displayName}</div>
          <div className="text-[0.75rem] text-muted-foreground truncate">
            {member.session.join(' · ')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => onClick(member.id)}
      className={`rounded-xl bg-surface cursor-pointer flex flex-col items-center gap-2.5 p-4 transition-colors border ${isMe ? 'border-accent/50' : 'border-[var(--border)]'} hover:bg-surface-elevated`}
    >
      <Avatar name={avatarName} src={member.profile_image_url} size={56} />

      <div className="text-center min-w-0 w-full">
        <div className="font-bold text-[0.9rem] text-foreground truncate px-1">{displayName}</div>
        {member.generation != null && (
          <div className="text-[0.75rem] text-muted-foreground">{member.generation}기</div>
        )}
      </div>

      {member.session.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center">
          {member.session.map(s => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
      )}

      {(roleLabel || member.is_whitelist || member.is_leader) && (
        <div className="flex gap-1 flex-wrap justify-center">
          {member.is_leader && <BadgeAccent>팀장</BadgeAccent>}
          {roleLabel && <BadgeAccent>{roleLabel}</BadgeAccent>}
          {member.is_whitelist && <WhitelistBadge />}
        </div>
      )}
    </div>
  )
}
