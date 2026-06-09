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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: '#f9fafb',
          cursor: 'pointer',
          border: isMe ? '1px solid #3b82f6' : '1px solid #e5e7eb',
        }}
      >
        <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
          {member.profile_image_url ? (
            <Image
              src={member.profile_image_url}
              alt={member.name ?? '비공개'}
              fill
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', color: '#6b7280',
            }}>
              {(member.name ?? '?')[0]}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{displayName}</div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {member.session.join(' · ')}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => onClick(member.id)}
      style={{
        borderRadius: '12px',
        border: isMe ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        background: '#fff',
        padding: '16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        {member.profile_image_url ? (
          <Image
            src={member.profile_image_url}
            alt={member.name ?? '비공개'}
            fill
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', color: '#6b7280',
          }}>
            {(member.name ?? '?')[0]}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{displayName}</div>
        {member.generation != null && (
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{member.generation}기</div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
        {member.session.map(s => (
          <span key={s} style={{
            padding: '2px 8px', borderRadius: '9999px',
            background: '#eff6ff', color: '#1d4ed8',
            fontSize: '0.72rem', fontWeight: 500,
          }}>
            {s}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {roleLabel && (
          <span style={{
            padding: '2px 8px', borderRadius: '9999px',
            background: '#fef3c7', color: '#92400e',
            fontSize: '0.72rem', fontWeight: 600,
          }}>
            {roleLabel}
          </span>
        )}
        {member.is_whitelist && <WhitelistBadge />}
      </div>

      {member.department && (
        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{member.department}</div>
      )}

      {member.phone && (
        <a
          href={`tel:${member.phone}`}
          onClick={e => e.stopPropagation()}
          style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none' }}
        >
          {member.phone}
        </a>
      )}
    </div>
  )
}
