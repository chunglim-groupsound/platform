'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Invitation {
  id: string
  message: string | null
  status: string
  created_at: string
  team: { id: string; name: string } | null
  inviter: { id: string; name: string; nickname: string | null } | null
}

interface Props {
  invitations: Invitation[]
}

export function MyInvitationsSection({ invitations }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function respond(invitationId: string, status: 'ACCEPTED' | 'REJECTED') {
    setLoading(invitationId)
    try {
      await fetch(`/api/members/me/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ marginTop: '28px' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
        받은 팀 초대 ({invitations.length}건)
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {invitations.map(inv => (
          <div key={inv.id} style={{
            padding: '12px 14px', borderRadius: '10px',
            border: '1px solid #e5e7eb', background: '#fff',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                {inv.team && (
                  <Link
                    href={`/teams/${inv.team.id}`}
                    style={{ fontWeight: 600, fontSize: '0.9rem', color: '#4f46e5', textDecoration: 'none' }}
                  >
                    {inv.team.name}
                  </Link>
                )}
                {inv.inviter && (
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '2px 0 0' }}>
                    초대한 사람: {inv.inviter.nickname ?? inv.inviter.name}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  onClick={() => respond(inv.id, 'ACCEPTED')}
                  disabled={loading === inv.id}
                  style={{
                    padding: '4px 12px', borderRadius: '7px', fontSize: '0.8rem',
                    border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer',
                    opacity: loading === inv.id ? 0.6 : 1,
                  }}
                >
                  수락
                </button>
                <button
                  onClick={() => respond(inv.id, 'REJECTED')}
                  disabled={loading === inv.id}
                  style={{
                    padding: '4px 12px', borderRadius: '7px', fontSize: '0.8rem',
                    border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer',
                    opacity: loading === inv.id ? 0.6 : 1,
                  }}
                >
                  거절
                </button>
              </div>
            </div>
            {inv.message && (
              <p style={{ fontSize: '0.83rem', color: '#6b7280', margin: 0 }}>{inv.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
