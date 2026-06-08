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
  const handleResult = async (result: 'PASS' | 'FAIL') => {
    const label = result === 'PASS' ? '합격' : '불합격'
    if (!confirm(`${member?.name}님을 ${label} 처리하시겠습니까?`)) return

    setLoading(result === 'PASS' ? 'pass' : 'fail')

    const res = await fetch('/api/admin/applications/result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: application.id,
        userId: member?.id,
        result,
        adminNote,
      }),
    })

    setLoading(null)

    if (res.ok) {
      setDone(true)
      alert(
        result === 'PASS'
          ? `${member?.name}님이 유예 부원으로 전환되었습니다.`
          : `${member?.name}님이 불합격 처리되었습니다.`
      )
    } else {
      const { error } = await res.json()
      alert('오류: ' + error)
    }
  }

  if (done) {
    return (
      <div style={{ padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', opacity: 0.5, marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>✅ {member?.name} — 처리 완료</span>
      </div>
    )
  }

  return (
    <div style={cardStyle}>

      {/* ── 신청자 기본 정보 ── */}
      <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' as const }}>
        <strong style={{ fontSize: '17px', color: '#111827' }}>{member?.name}</strong>
        <span style={{ fontSize: '13px', color: '#6b7280' }}>
          {member?.generation}기 · {member?.session?.join(', ')}
        </span>
        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>
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

      <hr style={{ margin: '16px 0', borderColor: '#f3f4f6' }} />

      {/* ── 면접 슬롯 확정 ── */}
      <div style={{ marginBottom: '16px' }}>
        <p style={labelStyle}>
          면접 슬롯 확정
          {preferences.length > 0 && (
            <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: '6px' }}>
              (신청자 희망 {preferences.length}개)
            </span>
          )}
        </p>

        {slots.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>생성된 슬롯이 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '10px' }}>
            {slots.map(slot => {
              const isPref = preferences.includes(slot.id)
              const isConfirmed = selectedSlotId === slot.id
              return (
                <label
                  key={slot.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    border: `1.5px solid ${isConfirmed ? '#4A90E2' : '#e5e7eb'}`,
                    borderRadius: '7px',
                    backgroundColor: isConfirmed ? '#eff6ff' : '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#111827',
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
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#4A90E2', fontWeight: 600 }}>
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
          style={{
            padding: '8px 18px', borderRadius: '7px',
            background: (!selectedSlotId || loading === 'schedule') ? '#d1d5db' : '#4A90E2',
            color: '#fff', border: 'none',
            cursor: !selectedSlotId ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: 600,
          }}
        >
          {loading === 'schedule' ? '처리 중...' : isScheduled ? '슬롯 재확정' : '슬롯 확정'}
        </button>
      </div>

      {/* ── 운영진 메모 ── */}
      <div style={{ marginBottom: '16px' }}>
        <p style={labelStyle}>운영진 메모 (내부 전용)</p>
        <textarea
          value={adminNote}
          onChange={e => setAdminNote(e.target.value)}
          placeholder="면접 시 참고 내용, 특이사항 등"
          rows={2}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', resize: 'vertical' as const, fontSize: '13px', boxSizing: 'border-box' as const }}
        />
      </div>

      {/* ── 합격 / 불합격 ── */}
      {!isScheduled && (
        <p style={{ fontSize: '12px', color: '#dc2626', marginBottom: '8px' }}>
          면접 슬롯을 먼저 확정해야 합격 처리가 가능합니다.
        </p>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => handleResult('PASS')}
          disabled={!!loading || !isScheduled}
          style={{
            padding: '9px 22px', borderRadius: '7px',
            background: (!isScheduled || loading) ? '#d1d5db' : '#16a34a',
            color: '#fff', border: 'none',
            cursor: (!isScheduled || !!loading) ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: '13px',
          }}
        >
          {loading === 'pass' ? '처리 중...' : '합격'}
        </button>
        <button
          onClick={() => handleResult('FAIL')}
          disabled={!!loading}
          style={{
            padding: '9px 22px', borderRadius: '7px',
            background: loading ? '#d1d5db' : '#dc2626',
            color: '#fff', border: 'none',
            cursor: !!loading ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: '13px',
          }}
        >
          {loading === 'fail' ? '처리 중...' : '불합격'}
        </button>
      </div>

    </div>
  )
}

function Detail({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <p style={labelStyle}>{label}</p>
      <p style={{ whiteSpace: 'pre-wrap', background: '#f9fafb', padding: '10px 12px', borderRadius: '6px', fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>
        {text}
      </p>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  padding: '20px 24px',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  marginBottom: '14px',
  backgroundColor: '#fff',
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '8px',
}
