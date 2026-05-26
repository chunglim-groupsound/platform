'use client'

import { useState } from 'react'

// ─────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────
interface Application {
  id: string
  motivation: string | null
  self_intro: string | null
  interview_scheduled_at: string | null
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

interface Props {
  application: Application
}

// ─────────────────────────────────────────────
// ApplicationCard
// ─────────────────────────────────────────────
export default function ApplicationCard({ application }: Props) {
  const [scheduleInput, setScheduleInput] = useState(
    application.interview_scheduled_at
      ? new Date(application.interview_scheduled_at).toISOString().slice(0, 16)
      : ''
  )
  const [adminNote, setAdminNote] = useState(application.admin_note ?? '')
  const [loading, setLoading] = useState<'schedule' | 'pass' | 'fail' | null>(null)
  const [done, setDone] = useState(false)
  const [isScheduled, setIsScheduled] = useState(!!application.interview_scheduled_at)

  const member = application.users

  // ── 면접 일정 입력 ──────────────────────────
  const handleSchedule = async () => {
    if (!scheduleInput) return alert('면접 일시를 입력해주세요.')
    setLoading('schedule')

    const res = await fetch('/api/admin/applications/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: application.id,
        userId: member?.id,
        interviewScheduledAt: new Date(scheduleInput).toISOString(),
      }),
    })

    setLoading(null)
    if (res.ok) {
      setIsScheduled(true)
      alert(`${member?.name}님께 면접 일정이 전달되었습니다.`)
    } else {
      const { error } = await res.json()
      alert('오류: ' + error)
    }
  }

  // ── 면접 결과 처리 (합격 / 불합격) ──────────
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

  // 처리 완료된 카드는 접힌 상태로 표시
  if (done) {
    return (
      <div style={{ padding: '12px', border: '1px solid #ccc', opacity: 0.5 }}>
        <span>✅ {member?.name} — 처리 완료</span>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '16px' }}>

      {/* ── 신청자 기본 정보 ── */}
      <div style={{ marginBottom: '12px' }}>
        <strong style={{ fontSize: '18px' }}>{member?.name}</strong>
        <span style={{ marginLeft: '8px', color: '#666' }}>
          {member?.generation}기 · {member?.session?.join(', ')}
        </span>
        <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>
          신청일: {new Date(application.created_at).toLocaleDateString('ko-KR')}
        </span>
      </div>

      {/* ── 지원 동기 ── */}
      {application.motivation && (
        <div style={{ marginBottom: '10px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>지원 동기</p>
          <p style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: '8px', borderRadius: '4px' }}>
            {application.motivation}
          </p>
        </div>
      )}

      {/* ── 자기소개 ── */}
      {application.self_intro && (
        <div style={{ marginBottom: '10px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>자기소개</p>
          <p style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: '8px', borderRadius: '4px' }}>
            {application.self_intro}
          </p>
        </div>
      )}

      <hr style={{ margin: '16px 0' }} />

      {/* ── 면접 일정 입력 ── */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>면접 일정</p>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="datetime-local"
            value={scheduleInput}
            onChange={e => setScheduleInput(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            onClick={handleSchedule}
            disabled={loading === 'schedule'}
            style={{ padding: '6px 14px', borderRadius: '4px', background: '#4A90E2', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            {loading === 'schedule' ? '처리 중...' : '일정 저장 · 안내 발송'}
          </button>
        </div>
        {application.interview_scheduled_at && (
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            현재 일정: {new Date(application.interview_scheduled_at).toLocaleString('ko-KR')}
          </p>
        )}
      </div>

      {/* ── 운영진 메모 ── */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>운영진 메모 (내부 전용)</p>
        <textarea
          value={adminNote}
          onChange={e => setAdminNote(e.target.value)}
          placeholder="면접 시 참고 내용, 특이사항 등"
          rows={3}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
        />
      </div>

      {/* ── 합격 / 불합격 버튼 ── */}
      {!isScheduled && (
        <p style={{ fontSize: '12px', color: '#E74C3C', marginBottom: '8px' }}>
          면접 일정을 먼저 저장해야 합격 처리가 가능합니다.
        </p>
      )}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => handleResult('PASS')}
          disabled={!!loading || !isScheduled}
          style={{
            padding: '10px 24px', borderRadius: '4px',
            background: (!isScheduled || loading === 'pass') ? '#aaa' : '#27AE60',
            color: '#fff', border: 'none', cursor: !isScheduled ? 'not-allowed' : 'pointer', fontWeight: 'bold'
          }}
        >
          {loading === 'pass' ? '처리 중...' : '✅ 합격'}
        </button>
        <button
          onClick={() => handleResult('FAIL')}
          disabled={!!loading}
          style={{
            padding: '10px 24px', borderRadius: '4px',
            background: loading === 'fail' ? '#aaa' : '#E74C3C',
            color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          {loading === 'fail' ? '처리 중...' : '❌ 불합격'}
        </button>
      </div>

    </div>
  )
}
