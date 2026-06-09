'use client'

import { useState } from 'react'
import Link from 'next/link'
import { STATUS_LABELS } from '@/lib/constants'
import { ALLOWED_TRANSITIONS } from '@/lib/member/transitions'
import { calcProbationDday } from '@/lib/member/probation'

const TABS = ['전체', 'PENDING', 'INTERVIEWING', 'PROBATION', 'ACTIVE', 'INACTIVE']

export default function MemberListClient({ members }: { members: any[] }) {
  const [activeTab, setActiveTab] = useState('전체')

  const filtered = activeTab === '전체'
    ? members
    : members.filter(m => m.status === activeTab)

  return (
    <div>
      {/* 탭 */}
      <div>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ fontWeight: activeTab === tab ? 'bold' : 'normal' }}
          >
            {STATUS_LABELS[tab] ?? tab}
            {tab !== '전체' && (
              <span>({members.filter(m => m.status === tab).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* 회원 목록 */}
      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>기수</th>
            <th>세션</th>
            <th>상태</th>
            <th>D-Day</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(member => (
            <tr key={member.id}>
              <td>
                <Link href={`/admin/members/${member.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                  {member.name}
                </Link>
              </td>
              <td>{member.generation}기</td>
              <td>{member.session?.join(', ')}</td>
              <td>{STATUS_LABELS[member.status]}</td>
              <td>
                {member.status === 'PROBATION' && member.probation_started_at
                  ? calcProbationDday(member.probation_started_at)
                  : '-'}
              </td>
              <td>
                <StatusChangeDropdown memberId={member.id} currentStatus={member.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// 상태 변경 드롭다운 컴포넌트
function StatusChangeDropdown({
  memberId,
  currentStatus,
}: {
  memberId: string
  currentStatus: string
}) {
  const options = ALLOWED_TRANSITIONS[currentStatus] ?? []
  if (options.length === 0) return <span>-</span>

  const handleChange = async (toStatus: string) => {
    await fetch('/api/admin/members/transition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: memberId, toStatus }),
    })
    window.location.reload() // 간단 처리, 추후 낙관적 업데이트로 개선 가능
  }

  return (
    <select onChange={e => handleChange(e.target.value)} defaultValue="">
      <option value="" disabled>변경</option>
      {options.map(s => (
        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
      ))}
    </select>
  )
}
