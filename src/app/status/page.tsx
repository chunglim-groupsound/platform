import { createClient } from '@/lib/supabase/server'
import InterviewSlotPicker from '@/components/InterviewSlotPicker'

interface Props {
  searchParams: Promise<{ reason?: string }>
}

export default async function StatusPage({ searchParams }: Props) {
  const { reason } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (reason === 'not_open') {
    return (
      <main style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ fontSize: '32px', marginBottom: '16px' }}>🎸</p>
          <h2 style={titleStyle}>현재 모집 기간이 아닙니다</h2>
          <p style={descStyle}>
            신규 부원 모집 기간이 아닙니다.<br />
            다음 모집 공고를 기다려주세요.
          </p>
        </div>
      </main>
    )
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, status, name')
    .or(`id.eq.${user!.id},linked_auth_id.eq.${user!.id}`)
    .maybeSingle()

  // 확정 슬롯 조회
  const { data: application } = await supabase
    .from('join_applications')
    .select('id, confirmed_slot_id, interview_slots(slot_at)')
    .eq('user_id', profile?.id ?? user!.id)
    .maybeSingle()

  const rawSlot = application?.interview_slots
  const confirmedSlotAt: string | null =
    Array.isArray(rawSlot) ? (rawSlot[0]?.slot_at ?? null) : ((rawSlot as unknown as { slot_at: string } | null)?.slot_at ?? null)

  const status = (profile?.status ?? 'PENDING') as 'PENDING' | 'INTERVIEWING' | 'WITHDRAWN' | string
  const isPending      = status === 'PENDING'
  const isInterviewing = status === 'INTERVIEWING'

  const STATUS_MESSAGES: Record<string, string> = {
    PENDING:      '가입 신청이 접수되었습니다. 운영진 검토 후 면접 일정을 안내드립니다.',
    INTERVIEWING: '면접 일정이 곧 안내됩니다.',
    WITHDRAWN:    '접근이 제한된 계정입니다. 운영진에게 문의해 주세요.',
  }

  const statusMessage = confirmedSlotAt
    ? '면접 일정이 확정되었습니다. 아래 일정을 확인해 주세요.'
    : (STATUS_MESSAGES[status] ?? '신청 상태를 확인 중입니다.')

  return (
    <main style={containerStyle}>
      <div style={{ ...cardStyle, maxWidth: isPending || isInterviewing ? '520px' : '480px' }}>
        <h2 style={titleStyle}>{profile?.name}님</h2>
        <p style={descStyle}>{statusMessage}</p>

        {/* 확정 슬롯 표시 */}
        {confirmedSlotAt && (
          <div style={confirmedBoxStyle}>
            <p style={{ fontSize: '12px', color: '#1d4ed8', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.02em' }}>
              확정된 면접 일정
            </p>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '0' }}>
              {new Date(confirmedSlotAt).toLocaleString('ko-KR', {
                month: 'long', day: 'numeric', weekday: 'short',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        )}

        {/* PENDING 상태 + 신청서 있음 + 확정 슬롯 없음 → 희망 일정 선택 */}
        {isPending && application && !confirmedSlotAt && (
          <div style={slotSectionStyle}>
            <h3 style={slotTitleStyle}>희망 면접 일정 선택</h3>
            <InterviewSlotPicker />
          </div>
        )}
      </div>
    </main>
  )
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f4f5f7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  padding: '48px 40px',
  width: '100%',
  textAlign: 'center',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
}

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  marginBottom: '12px',
  color: '#111827',
}

const descStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  lineHeight: 1.7,
  marginBottom: '24px',
}

const confirmedBoxStyle: React.CSSProperties = {
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '10px',
  padding: '16px 20px',
  marginBottom: '24px',
  textAlign: 'center',
}

const slotSectionStyle: React.CSSProperties = {
  marginTop: '8px',
  textAlign: 'left',
  borderTop: '1px solid #f3f4f6',
  paddingTop: '24px',
}

const slotTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: '#111827',
  marginBottom: '14px',
}
