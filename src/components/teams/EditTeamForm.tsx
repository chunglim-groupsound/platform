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

  const RecruitingBtn = ({ val }: { val: boolean }) => (
    <button
      type="button"
      onClick={() => setIsRecruiting(val)}
      className={`py-1.5 px-4 rounded-lg text-[0.88rem] border cursor-pointer ${
        isRecruiting === val
          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold'
          : 'border-gray-300 bg-white text-gray-700 font-normal'
      }`}
    >
      {val ? '모집 중' : '모집 완료'}
    </button>
  )

  return (
    <div className="flex flex-col gap-7">
      {/* 기본 정보 */}
      <form onSubmit={submit} className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.85rem] font-semibold text-gray-700">
            팀명{!isAdmin && <span className="text-gray-400 font-normal"> (팀장은 변경 불가)</span>}
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={50}
            disabled={!isAdmin}
            className={`w-full py-[9px] px-3 rounded-lg border border-gray-300 text-[0.9rem] box-border ${isAdmin ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-500'}`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.85rem] font-semibold text-gray-700">팀 소개</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3} maxLength={200}
            className="w-full py-[9px] px-3 rounded-lg border border-gray-300 text-[0.9rem] box-border resize-y"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.85rem] font-semibold text-gray-700">연습 곡명</label>
          <input
            value={currentSong}
            onChange={e => setCurrentSong(e.target.value)}
            placeholder="현재 연습 중인 곡"
            maxLength={100}
            className="w-full py-[9px] px-3 rounded-lg border border-gray-300 text-[0.9rem] box-border"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[0.85rem] font-semibold text-gray-700">모집 상태</label>
          <div className="flex gap-2">
            <RecruitingBtn val={true} />
            <RecruitingBtn val={false} />
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-2">
            <label className="text-[0.85rem] font-semibold text-gray-700">팀 활성 여부</label>
            <div className="flex gap-2">
              {[true, false].map(v => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setIsActive(v)}
                  className={`py-1.5 px-4 rounded-lg text-[0.88rem] border cursor-pointer ${
                    isActive === v
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold'
                      : 'border-gray-300 bg-white text-gray-700 font-normal'
                  }`}
                >
                  {v ? '활성' : '비활성'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 부팀장 지정 */}
        {viceCandidates.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.85rem] font-semibold text-gray-700">부팀장 지정</label>
            <select
              value={viceleaderId}
              onChange={e => setViceleaderId(e.target.value)}
              className="w-full py-[9px] px-3 rounded-lg border border-gray-300 text-[0.9rem] box-border bg-white cursor-pointer"
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
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.85rem] font-semibold text-gray-700">팀장 위임</label>
            <select
              value={newLeaderId}
              onChange={e => setNewLeaderId(e.target.value)}
              className="w-full py-[9px] px-3 rounded-lg border border-gray-300 text-[0.9rem] box-border bg-white cursor-pointer"
            >
              <option value="">변경하지 않음</option>
              {delegateCandidates.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {newLeaderId && (
              <p className="text-[0.8rem] text-amber-400 m-0">
                ⚠ 저장 시 팀장 권한이 이전됩니다.
              </p>
            )}
          </div>
        )}

        {error && <p className="text-red-600 text-[0.85rem] m-0">{error}</p>}

        <div className="flex gap-2.5 justify-end">
          <button
            type="button"
            onClick={() => router.push(`/teams/${teamId}`)}
            className="py-2 px-[18px] rounded-lg text-[0.88rem] border border-gray-300 bg-white text-gray-700 cursor-pointer"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`py-2 px-[18px] rounded-lg text-[0.88rem] font-semibold border-none bg-indigo-500 text-white ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>

      {/* 팀 삭제 */}
      <div className="border-t border-red-100 pt-5">
        <p className="text-[0.85rem] font-bold text-red-600 mb-2.5">위험 영역</p>
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="py-2 px-[18px] rounded-lg text-[0.88rem] border border-red-300 bg-white text-red-600 cursor-pointer font-semibold"
          >
            팀 삭제
          </button>
        ) : (
          <div className="flex flex-col gap-2.5 p-3.5 rounded-[10px] bg-red-50 border border-red-300">
            <p className="text-[0.88rem] text-red-600 m-0 font-semibold">
              정말 삭제하시겠습니까?<br />
              <span className="font-normal text-gray-500">팀원, 신청, 초대 내역이 모두 삭제됩니다.</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="py-[7px] px-4 rounded-lg text-[0.85rem] border border-gray-300 bg-white text-gray-700 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={deleteTeam}
                disabled={deleteLoading}
                className={`py-[7px] px-4 rounded-lg text-[0.85rem] font-bold border-none bg-red-600 text-white ${deleteLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
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
