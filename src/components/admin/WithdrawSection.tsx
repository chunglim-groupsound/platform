'use client'

import { useState } from 'react'

interface Props {
  memberId: string
  memberName: string
  currentStatus: string
}

export function WithdrawSection({ memberId, memberName, currentStatus }: Props) {
  const [reason, setReason]       = useState('')
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState<string | null>(null)

  if (currentStatus === 'WITHDRAWN' || done) {
    return (
      <section className="mb-8 pb-8 border-b border-[#f0f0f0]">
        <h2 className="text-[15px] font-medium text-[#333] mb-3.5">탈퇴 처리</h2>
        <p className="text-[13px] text-gray-400">이미 탈퇴 처리된 계정입니다.</p>
      </section>
    )
  }

  const handleWithdraw = async () => {
    if (!reason.trim()) { setError('탈퇴 사유를 입력해주세요.'); return }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/members/transition', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: memberId, toStatus: 'WITHDRAWN', reason: reason.trim() }),
    })

    setLoading(false)
    if (res.ok) {
      setDone(true)
      setConfirming(false)
    } else {
      const data = await res.json()
      setError(data.error ?? '처리 실패')
    }
  }

  return (
    <section className="mb-8 pb-8 border-b border-[#f0f0f0]">
      <h2 className="text-[15px] font-medium text-[#333] mb-3.5">탈퇴 처리</h2>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="py-2 px-[18px] text-[13px] font-semibold bg-white text-red-600 border-[1.5px] border-red-300 rounded-md cursor-pointer"
        >
          탈퇴 처리하기
        </button>
      ) : (
        <div className="p-4 border-[1.5px] border-red-300 rounded-lg bg-red-50 flex flex-col gap-2.5">
          <p className="text-[13px] font-semibold text-red-700 m-0">
            {memberName}님을 탈퇴 처리합니다
          </p>
          <textarea
            value={reason}
            onChange={e => { setReason(e.target.value); setError(null) }}
            placeholder="탈퇴 사유를 입력하세요 (필수)"
            rows={2}
            className="w-full py-2 px-2.5 text-[13px] border border-red-300 rounded-md outline-none leading-[1.5] bg-white resize-y"
            style={{ boxSizing: 'border-box' }}
          />
          {error && (
            <p className="text-[13px] text-red-600 m-0">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="py-[7px] px-[18px] text-[13px] font-semibold bg-red-600 text-white border-none rounded-md"
              style={{
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '처리 중...' : '탈퇴 확정'}
            </button>
            <button
              onClick={() => { setConfirming(false); setReason(''); setError(null) }}
              disabled={loading}
              className="py-[7px] px-[18px] text-[13px] bg-white text-gray-500 border border-gray-300 rounded-md cursor-pointer"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
