import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
      <main className="min-h-screen bg-[#f4f5f7] flex items-center justify-center py-10 px-5">
        <div className="bg-white rounded-xl py-12 px-10 w-full max-w-[480px] text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <p className="text-[32px] mb-4">🎸</p>
          <h2 className="text-[20px] font-semibold mb-3 text-gray-900">현재 모집 기간이 아닙니다</h2>
          <p className="text-[14px] text-gray-500 leading-[1.7] mb-6">
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

  // 확정 슬롯 조회 — 2단계로 분리 (RLS 우회: 슬롯은 admin 클라이언트로 조회)
  const { data: application } = await supabase
    .from('join_applications')
    .select('id, confirmed_slot_id')
    .eq('user_id', profile?.id ?? user!.id)
    .maybeSingle()

  let confirmedSlotAt: string | null = null
  if (application?.confirmed_slot_id) {
    const { data: slot } = await createAdminClient()
      .from('interview_slots')
      .select('slot_at')
      .eq('id', application.confirmed_slot_id)
      .single()
    confirmedSlotAt = slot?.slot_at ?? null
  }

  const status = (profile?.status ?? 'PENDING') as 'PENDING' | 'INTERVIEWING' | 'WITHDRAWN' | string
  const isPending      = status === 'PENDING'
  const isInterviewing = status === 'INTERVIEWING'
  const isWithdrawn    = status === 'WITHDRAWN'

  // WITHDRAWN 사유 조회 (member_history 최신 WITHDRAWN 전이의 reason)
  let withdrawnReason: string | null = null
  if (isWithdrawn) {
    const { data: hist } = await supabase
      .from('member_history')
      .select('reason')
      .eq('user_id', profile?.id ?? user!.id)
      .eq('to_status', 'WITHDRAWN')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    withdrawnReason = hist?.reason ?? null
  }

  const STATUS_MESSAGES: Record<string, string> = {
    PENDING:      '가입 신청이 접수되었습니다. 운영진 검토 후 면접 일정을 안내드립니다.',
    INTERVIEWING: '면접 일정이 곧 안내됩니다.',
    WITHDRAWN:    '계정 접근이 제한되었습니다.',
  }

  const statusMessage = (confirmedSlotAt && isInterviewing)
    ? '면접 일정이 확정되었습니다. 아래 일정을 확인해 주세요.'
    : (STATUS_MESSAGES[status] ?? '신청 상태를 확인 중입니다.')

  return (
    <main className="min-h-screen bg-[#f4f5f7] flex items-center justify-center py-10 px-5">
      {/* maxWidth가 상태에 따라 동적으로 달라지므로 inline style 유지 */}
      <div
        className="bg-white rounded-xl py-12 px-10 w-full text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        style={{ maxWidth: isPending || isInterviewing ? '520px' : '480px' }}
      >
        <h2 className="text-[20px] font-semibold mb-3 text-gray-900">{profile?.name}님</h2>
        <p className="text-[14px] text-gray-500 leading-[1.7] mb-6">{statusMessage}</p>

        {/* 확정 슬롯 표시 — INTERVIEWING 상태일 때만 */}
        {confirmedSlotAt && isInterviewing && (
          <div className="bg-blue-50 border border-blue-200 rounded-[10px] py-4 px-5 mb-6 text-center">
            <p className="text-[12px] text-blue-700 mb-1.5 font-semibold tracking-[0.02em]">
              확정된 면접 일정
            </p>
            <p className="text-[18px] font-bold text-gray-900 mb-0">
              {new Date(confirmedSlotAt).toLocaleString('ko-KR', {
                month: 'long', day: 'numeric', weekday: 'short',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        )}

        {/* WITHDRAWN 사유 표시 */}
        {isWithdrawn && (
          <div className="bg-red-50 border border-red-200 rounded-[10px] py-4 px-5 mb-4 text-left">
            <p className="text-[12px] text-red-600 font-semibold mb-1.5">
              제한 사유
            </p>
            <p className="text-[14px] text-red-900 m-0 leading-relaxed">
              {withdrawnReason ?? '운영진에게 직접 문의해 주세요.'}
            </p>
          </div>
        )}

        {/* PENDING 상태 + 신청서 있음 + 확정 슬롯 없음 → 희망 일정 선택 */}
        {isPending && application && !confirmedSlotAt && (
          <div className="mt-2 text-left border-t border-gray-100 pt-6">
            <h3 className="text-[15px] font-semibold text-gray-900 mb-3.5">희망 면접 일정 선택</h3>
            <InterviewSlotPicker />
          </div>
        )}
      </div>
    </main>
  )
}
