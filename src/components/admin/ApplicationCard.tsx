'use client'

import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────
interface Application {
  id: string
  motivation: string | null
  self_intro: string | null
  confirmed_slot_id: string | null
  interview_result: 'PENDING' | 'PASS' | 'FAIL'
  admin_note: string | null
  created_at: string
  users: {
    id: string
    name: string
    generation: number | null
    session: string[] | null
    status: string
  } | null
}

interface Slot {
  id: string
  slot_at: string
}

interface Props {
  application: Application
}

function formatSlot(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─────────────────────────────────────────────
// ApplicationCard
// ─────────────────────────────────────────────
export default function ApplicationCard({ application }: Props) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [preferences, setPreferences] = useState<string[]>([]) // slot_id 목록
  const [selectedSlotId, setSelectedSlotId] = useState<string>(application.confirmed_slot_id ?? '')
  const [adminNote, setAdminNote] = useState(application.admin_note ?? '')
  const [loading, setLoading] = useState<'schedule' | 'pass' | 'fail' | null>(null)
  const [isScheduled, setIsScheduled] = useState(!!application.confirmed_slot_id)
  const [done, setDone] = useState(false)
  const [resultPending, setResultPending] = useState<'PASS' | 'FAIL' | null>(null)
  const [resultReason, setResultReason] = useState('')

  const member = application.users

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/interview-slots').then(r => r.json()),
      fetch(`/api/admin/applications/${application.id}/preferences`).then(r => r.json()).catch(() => []),
    ]).then(([slotsData, prefData]) => {
      setSlots(Array.isArray(slotsData) ? slotsData : [])
      setPreferences(Array.isArray(prefData) ? prefData : [])
    })
  }, [application.id])

  // ── 슬롯 확정 ──────────────────────────────
  const handleSchedule = async () => {
    if (!selectedSlotId) return alert('면접 슬롯을 선택해주세요.')
    setLoading('schedule')

    const res = await fetch('/api/admin/applications/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: application.id,
        userId: member?.id,
        slotId: selectedSlotId,
      }),
    })

    setLoading(null)
    if (res.ok) {
      setIsScheduled(true)
      alert(`${member?.name}님 면접 슬롯이 확정되었습니다.`)
    } else {
      const { error } = await res.json()
      alert('오류: ' + error)
    }
  }

  // ── 면접 결과 처리 ──────────────────────────
  const handleResultConfirm = async () => {
    if (!resultPending) return
    setLoading(resultPending === 'PASS' ? 'pass' : 'fail')

    const res = await fetch('/api/admin/applications/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: application.id,
        userId: member?.id,
        result: resultPending,
        adminNote,
        reason: resultReason.trim() || undefined,
      }),
    })

    setLoading(null)
    setResultPending(null)
    setResultReason('')

    if (res.ok) {
      setDone(true)
    } else {
      const { error } = await res.json()
      alert('오류: ' + error)
    }
  }

  if (done) {
    return (
      <div className="px-4 py-3 border border-gray-200 rounded-lg opacity-50 mb-3">
        <span className="text-sm text-gray-500">✅ {member?.name} — 처리 완료</span>
      </div>
    )
  }

  return (
    <div className="py-5 px-6 border border-gray-200 rounded-[10px] mb-3.5 bg-white">

      {/* ── 신청자 기본 정보 ── */}
      <div className="mb-3.5 flex items-baseline gap-2 flex-wrap">
        <strong className="text-[17px] text-gray-900">{member?.name}</strong>
        <span className="text-[13px] text-gray-500">
          {member?.generation}기 · {member?.session?.join(', ')}
        </span>
        <span className="text-xs text-gray-400 ml-auto">
          신청일: {new Date(application.created_at).toLocaleDateString('ko-KR')}
        </span>
      </div>

      {/* ── 지원 동기 / 자기소개 ── */}
      {application.motivation && (
        <Detail label="지원 동기" text={application.motivation} />
      )}
      {application.self_intro && (
        <Detail label="자기소개" text={application.self_intro} />
      )}

      <hr className="my-4 border-gray-100" />

      {/* ── 면접 슬롯 확정 ── */}
      <div className="mb-4">
        <p className="text-[13px] font-semibold text-gray-700 mb-2">
          면접 슬롯 확정
          {preferences.length > 0 && (
            <span className="font-normal text-gray-500 ml-1.5">
              (신청자 희망 {preferences.length}개)
            </span>
          )}
        </p>

        {slots.length === 0 ? (
          <p className="text-[13px] text-gray-400">생성된 슬롯이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-1.5 mb-2.5">
            {slots.map(slot => {
              const isPref = preferences.includes(slot.id)
              const isConfirmed = selectedSlotId === slot.id
              return (
                <label
                  key={slot.id}
                  className="flex items-center gap-2.5 py-[9px] px-3 rounded-[7px] cursor-pointer text-[13px] text-gray-900"
                  style={{
                    border: `1.5px solid ${isConfirmed ? '#4A90E2' : '#e5e7eb'}`,
                    backgroundColor: isConfirmed ? '#eff6ff' : '#fff',
                  }}
                >
                  <input
                    type="radio"
                    name={`slot-${application.id}`}
                    value={slot.id}
                    checked={isConfirmed}
                    onChange={() => setSelectedSlotId(slot.id)}
                    style={{ accentColor: '#4A90E2' }}
                  />
                  {formatSlot(slot.slot_at)}
                  {isPref && (
                    <span className="ml-auto text-[11px] text-[#4A90E2] font-semibold">
                      희망
                    </span>
                  )}
                </label>
              )
            })}
          </div>
        )}

        <button
          onClick={handleSchedule}
          disabled={loading === 'schedule' || !selectedSlotId}
          className="py-2 px-[18px] rounded-[7px] text-white border-none text-[13px] font-semibold"
          style={{
            background: (!selectedSlotId || loading === 'schedule') ? '#d1d5db' : '#4A90E2',
            cursor: !selectedSlotId ? 'not-allowed' : 'pointer',
          }}
        >
          {loading === 'schedule' ? '처리 중...' : isScheduled ? '슬롯 재확정' : '슬롯 확정'}
        </button>
      </div>

      {/* ── 운영진 메모 ── */}
      <div className="mb-4">
        <p className="text-[13px] font-semibold text-gray-700 mb-2">운영진 메모 (내부 전용)</p>
        <textarea
          value={adminNote}
          onChange={e => setAdminNote(e.target.value)}
          placeholder="면접 시 참고 내용, 특이사항 등"
          rows={2}
          className="w-full p-2 rounded-md border border-gray-200 text-[13px] outline-none resize-y"
          style={{ boxSizing: 'border-box' }}
        />
      </div>

      {/* ── 합격 / 불합격 ── */}
      {!isScheduled && !resultPending && (
        <p className="text-xs text-red-600 mb-2">
          면접 슬롯을 먼저 확정해야 합격 처리가 가능합니다.
        </p>
      )}

      {resultPending ? (
        /* 인라인 확인 폼 */
        <div
          className="py-[14px] px-4 rounded-lg"
          style={{
            border: `1.5px solid ${resultPending === 'PASS' ? '#86efac' : '#fca5a5'}`,
            backgroundColor: resultPending === 'PASS' ? '#f0fdf4' : '#fff5f5',
          }}
        >
          <p
            className="text-[13px] font-semibold mb-2"
            style={{ color: resultPending === 'PASS' ? '#15803d' : '#b91c1c' }}
          >
            {member?.name}님을 {resultPending === 'PASS' ? '합격' : '불합격'} 처리합니다
          </p>
          <textarea
            value={resultReason}
            onChange={e => setResultReason(e.target.value)}
            placeholder={resultPending === 'PASS' ? '합격 사유 (선택)' : '불합격 사유 (선택)'}
            rows={2}
            className="w-full py-2 px-2.5 text-[13px] border border-gray-200 rounded-md outline-none mb-2.5 leading-[1.5] resize-y"
            style={{ boxSizing: 'border-box' }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleResultConfirm}
              disabled={!!loading}
              className="py-[7px] px-[18px] rounded-md text-[13px] font-semibold text-white border-none"
              style={{
                background: resultPending === 'PASS' ? '#16a34a' : '#dc2626',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? '처리 중...' : '확인'}
            </button>
            <button
              onClick={() => { setResultPending(null); setResultReason('') }}
              disabled={!!loading}
              className="py-[7px] px-[18px] rounded-md text-[13px] bg-white text-gray-500 border border-gray-300 cursor-pointer"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => setResultPending('PASS')}
            disabled={!!loading || !isScheduled}
            className="py-[9px] px-[22px] rounded-[7px] text-white border-none font-semibold text-[13px]"
            style={{
              background: (!isScheduled || loading) ? '#d1d5db' : '#16a34a',
              cursor: (!isScheduled || !!loading) ? 'not-allowed' : 'pointer',
            }}
          >
            합격
          </button>
          <button
            onClick={() => setResultPending('FAIL')}
            disabled={!!loading}
            className="py-[9px] px-[22px] rounded-[7px] text-white border-none font-semibold text-[13px]"
            style={{
              background: loading ? '#d1d5db' : '#dc2626',
              cursor: !!loading ? 'not-allowed' : 'pointer',
            }}
          >
            불합격
          </button>
        </div>
      )}

    </div>
  )
}

function Detail({ label, text }: { label: string; text: string }) {
  return (
    <div className="mb-2.5">
      <p className="text-[13px] font-semibold text-gray-700 mb-2">{label}</p>
      <p className="whitespace-pre-wrap bg-gray-50 py-2.5 px-3 rounded-md text-[13px] text-gray-700 leading-[1.6]">
        {text}
      </p>
    </div>
  )
}
