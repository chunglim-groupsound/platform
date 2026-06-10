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
    <div className="mt-7">
      <h2 className="text-base font-bold mb-3">
        받은 팀 초대 ({invitations.length}건)
      </h2>
      <div className="flex flex-col gap-2.5">
        {invitations.map(inv => (
          <div key={inv.id} className="py-3 px-3.5 rounded-[10px] border border-gray-200 bg-white flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div>
                {inv.team && (
                  <Link
                    href={`/teams/${inv.team.id}`}
                    className="font-semibold text-[0.9rem] text-indigo-600 no-underline"
                  >
                    {inv.team.name}
                  </Link>
                )}
                {inv.inviter && (
                  <p className="text-[0.8rem] text-gray-500 mt-0.5 mb-0">
                    초대한 사람: {inv.inviter.nickname ?? inv.inviter.name}
                  </p>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => respond(inv.id, 'ACCEPTED')}
                  disabled={loading === inv.id}
                  className="py-1 px-3 rounded-[7px] text-[0.8rem] border-none bg-green-600 text-white cursor-pointer"
                  style={{ opacity: loading === inv.id ? 0.6 : 1 }}
                >
                  수락
                </button>
                <button
                  onClick={() => respond(inv.id, 'REJECTED')}
                  disabled={loading === inv.id}
                  className="py-1 px-3 rounded-[7px] text-[0.8rem] border border-red-300 bg-white text-red-600 cursor-pointer"
                  style={{ opacity: loading === inv.id ? 0.6 : 1 }}
                >
                  거절
                </button>
              </div>
            </div>
            {inv.message && (
              <p className="text-[0.83rem] text-gray-500 m-0">{inv.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
