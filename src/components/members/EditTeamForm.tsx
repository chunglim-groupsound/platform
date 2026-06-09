'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TeamMember { id: string; name: string }

interface EditTeamFormProps {
  teamId: string
  initial: {
    name: string
    description: string | null
    current_song: string | null
    is_recruiting: boolean
    is_active: boolean
    leader_id: string | null
    vice_leader_id: string | null
  }
  isAdmin: boolean
  isLeader: boolean
  teamMembers: TeamMember[]
}

export function EditTeamForm({ teamId, initial, isAdmin, isLeader, teamMembers }: EditTeamFormProps) {
  const router = useRouter()
  const [name, setName]                   = useState(initial.name)
  const [description, setDescription]     = useState(initial.description ?? '')
  const [currentSong, setCurrentSong]     = useState(initial.current_song ?? '')
  const [isRecruiting, setIsRecruiting]   = useState(initial.is_recruiting)
  const [isActive, setIsActive]           = useState(initial.is_active)
  const [viceleaderId, setViceleaderId]   = useState(initial.vice_leader_id ?? '')
  const [newLeaderId, setNewLeaderId]     = useState('')
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 팀장 위임 대상: 본인 제외
  const delegateCandidates = teamMembers.filter(m => m.id !== initial.leader_id)
  // 부팀장 대상: 팀장 제외
  const viceCandidates = teamMembers.filter(m => m.id !== initial.leader_id)

  async function submit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (isAdmin && !name.trim()) { setError('팀명을 입력해주세요'); return }
    setError('')
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        description:    description.trim() || null,
        current_song:   currentSong.trim() || null,
        is_recruiting:  isRecruiting,
        vice_leader_id: viceleaderId || null,
      }
      if (isAdmin) {
        body.name      = name.trim()
        body.is_active = isActive
      }
      if ((isAdmin || isLeader) && newLeaderId) {
        body.leader_id = newLeaderId
      }

      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '오류가 발생했습니다'); return }
      router.push(`/teams/${teamId}`)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function deleteTeam() {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '삭제 중 오류가 발생했습니다'); return }
      router.push('/teams')
      router.refresh()
    } finally {
      setDeleteLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' as const,
  }
  const labelStyle: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 600, color: '#374151' }
  const selectStyle = { ...inputStyle, background: '#fff', cursor: 'pointer' }

  const RecruitingBtn = ({ val }: { val: boolean }) => (
    <button
      type="button"
      onClick={() => setIsRecruiting(val)}
      style={{
        padding: '6px 16px', borderRadius: '8px', fontSize: '0.88rem', border: '1px solid',
        borderColor: isRecruiting === val ? '#6366f1' : '#d1d5db',
        background:  isRecruiting === val ? '#eef2ff' : '#fff',
        color:       isRecruiting === val ? '#4338ca' : '#374151',
        fontWeight:  isRecruiting === val ? 700 : 400, cursor: 'pointer',
      }}
    >
      {val ? '모집 중' : '모집 완료'}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 기본 정보 */}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>
            팀명{!isAdmin && <span style={{ color: '#9ca3af', fontWeight: 400 }}> (팀장은 변경 불가)</span>}
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={50}
            disabled={!isAdmin}
            style={{ ...inputStyle, background: isAdmin ? '#fff' : '#f9fafb', color: isAdmin ? '#111827' : '#6b7280' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>팀 소개</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3} maxLength={200}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>연습 곡명</label>
          <input
            value={currentSong}
            onChange={e => setCurrentSong(e.target.value)}
            placeholder="현재 연습 중인 곡"
            maxLength={100}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={labelStyle}>모집 상태</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <RecruitingBtn val={true} />
            <RecruitingBtn val={false} />
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={labelStyle}>팀 활성 여부</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[true, false].map(v => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setIsActive(v)}
                  style={{
                    padding: '6px 16px', borderRadius: '8px', fontSize: '0.88rem', border: '1px solid',
                    borderColor: isActive === v ? '#6366f1' : '#d1d5db',
                    background:  isActive === v ? '#eef2ff' : '#fff',
                    color:       isActive === v ? '#4338ca' : '#374151',
                    fontWeight:  isActive === v ? 700 : 400, cursor: 'pointer',
                  }}
                >
                  {v ? '활성' : '비활성'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 부팀장 지정 */}
        {viceCandidates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>부팀장 지정</label>
            <select
              value={viceleaderId}
              onChange={e => setViceleaderId(e.target.value)}
              style={selectStyle}
            >
              <option value="">없음</option>
              {viceCandidates.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 팀장 위임 (팀장·관리자만) */}
        {(isAdmin || isLeader) && delegateCandidates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>팀장 위임</label>
            <select
              value={newLeaderId}
              onChange={e => setNewLeaderId(e.target.value)}
              style={selectStyle}
            >
              <option value="">변경하지 않음</option>
              {delegateCandidates.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {newLeaderId && (
              <p style={{ fontSize: '0.8rem', color: '#f59e0b', margin: 0 }}>
                ⚠ 저장 시 팀장 권한이 이전됩니다.
              </p>
            )}
          </div>
        )}

        {error && <p style={{ color: '#dc2626', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.push(`/teams/${teamId}`)}
            style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '0.88rem', border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600, border: 'none', background: '#6366f1', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>

      {/* 팀 삭제 */}
      <div style={{ borderTop: '1px solid #fee2e2', paddingTop: '20px' }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#dc2626', marginBottom: '10px' }}>위험 영역</p>
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '0.88rem', border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}
          >
            팀 삭제
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', borderRadius: '10px', background: '#fff5f5', border: '1px solid #fca5a5' }}>
            <p style={{ fontSize: '0.88rem', color: '#dc2626', margin: 0, fontWeight: 600 }}>
              정말 삭제하시겠습니까?<br />
              <span style={{ fontWeight: 400, color: '#6b7280' }}>팀원, 신청, 초대 내역이 모두 삭제됩니다.</span>
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={deleteTeam}
                disabled={deleteLoading}
                style={{ padding: '7px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, border: 'none', background: '#dc2626', color: '#fff', cursor: deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteLoading ? 0.7 : 1 }}
              >
                {deleteLoading ? '삭제 중...' : '삭제 확인'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
