import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WarningSection } from '@/components/admin/WarningSection'
import { WithdrawSection } from '@/components/admin/WithdrawSection'
import { SessionYearsEditor } from '@/components/admin/SessionYearsEditor'
import { STATUS_LABELS, ROLE_LABELS } from '@/lib/constants'
import { calcProbationDday, calcProbationEndDate } from '@/lib/member/probation'

export default async function MemberDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single()

  const { data: history } = await supabase
    .from('member_history')
    .select('*, changer:changed_by(name)')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })

  const { data: application } = await supabase
    .from('join_applications')
    .select('*, confirmed_slot:interview_slots!confirmed_slot_id(slot_at)')
    .eq('user_id', params.id)
    .maybeSingle()

  if (!member) {
    return <div className="p-8">회원을 찾을 수 없습니다.</div>
  }

  return (
    <div className="max-w-[700px]">
      <Link href="/admin/members" className="text-[13px] text-gray-500 no-underline inline-block mb-5">
        ← 부원 목록
      </Link>

      {/* ── 기본 정보 ── */}
      <section className="mb-8 pb-8 border-b border-gray-100">
        <h2 className="text-[15px] font-medium mb-3.5 text-[#333]">기본 정보</h2>

        <div className="flex flex-col">
          <InfoRow label="이름"   value={member.name} />
          <InfoRow label="기수"   value={member.generation ? `${member.generation}기` : '-'} />
          <InfoRow label="세션"   value={member.session?.join(', ') || '-'} />
          <InfoRow label="상태"   value={STATUS_LABELS[member.status] ?? member.status} />
          <InfoRow label="역할"   value={ROLE_LABELS[member.role] ?? member.role} />
          <InfoRow
            label="화이트리스트"
            value={member.is_whitelist ? '✅ 보유' : '-'}
          />
        </div>
      </section>

      {/* ── 학교 정보 ── */}
      <section className="mb-8 pb-8 border-b border-gray-100">
        <h2 className="text-[15px] font-medium mb-3.5 text-[#333]">학교 정보</h2>

        <div className="flex flex-col">
          <InfoRow label="학과" value={member.department  ?? '-'} />
          <InfoRow label="학번" value={member.student_id  ?? '-'} />
          <InfoRow
            label="학년"
            value={member.school_year ? `${member.school_year}학년` : '-'}
          />
        </div>
      </section>

      {/* ── 연락처 ── */}
      <section className="mb-8 pb-8 border-b border-gray-100">
        <h2 className="text-[15px] font-medium mb-3.5 text-[#333]">연락처</h2>
        <div className="flex flex-col">
          <InfoRow label="전화번호" value={member.phone ?? '-'} />
        </div>
      </section>

      {/* ── 유예 기간 정보 ── */}
      {member.status === 'PROBATION' && member.probation_started_at && (
        <section className="mb-8 pb-8 border-b border-gray-100">
          <h2 className="text-[15px] font-medium mb-3.5 text-[#333]">유예 기간</h2>
          <div className="flex flex-col">
            <InfoRow
              label="시작일"
              value={new Date(member.probation_started_at).toLocaleDateString('ko-KR')}
            />
            <InfoRow
              label="만료 예정"
              value={calcProbationEndDate(member.probation_started_at).toLocaleDateString('ko-KR')}
            />
            <InfoRow
              label="잔여일"
              value={calcProbationDday(member.probation_started_at)}
            />
          </div>
        </section>
      )}

      {/* ── 가입 신청서 ── */}
      {application && (
        <section className="mb-8 pb-8 border-b border-gray-100">
          <h2 className="text-[15px] font-medium mb-3.5 text-[#333]">가입 신청서</h2>

          {application.motivation && (
            <div className="bg-[#f9f9f9] border border-[#eee] rounded-md py-3.5 px-4 mb-3">
              <p className="text-xs text-[#888] mb-1.5 font-medium">지원 동기</p>
              <p className="text-sm text-[#333] leading-[1.7] whitespace-pre-wrap m-0">{application.motivation}</p>
            </div>
          )}

          {application.self_intro && (
            <div className="bg-[#f9f9f9] border border-[#eee] rounded-md py-3.5 px-4 mb-3">
              <p className="text-xs text-[#888] mb-1.5 font-medium">자기소개</p>
              <p className="text-sm text-[#333] leading-[1.7] whitespace-pre-wrap m-0">{application.self_intro}</p>
            </div>
          )}

          {application.admin_note && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md py-3.5 px-4 mb-3">
              <p className="text-xs text-[#888] mb-1.5 font-medium">운영진 메모 (내부)</p>
              <p className="text-sm text-[#333] leading-[1.7] whitespace-pre-wrap m-0">{application.admin_note}</p>
            </div>
          )}

          <div className="flex flex-col">
            <InfoRow
              label="면접 일정"
              value={application.confirmed_slot?.slot_at
                ? new Date(application.confirmed_slot.slot_at).toLocaleString('ko-KR')
                : '미정'}
            />
            <InfoRow
              label="면접 결과"
              value={{ PASS: '합격', FAIL: '불합격', PENDING: '대기 중' }[application.interview_result as string] ?? '-'}
            />
          </div>
        </section>
      )}

      {/* ── 세션 연차 ── */}
      <section className="mb-8 pb-8 border-b border-gray-100">
        <h2 className="text-[15px] font-medium mb-3.5 text-[#333]">세션 연차</h2>
        <SessionYearsEditor
          memberId={params.id}
          initialSessionYears={(member.session_years ?? null) as Record<string, number> | null}
          memberSession={member.session}
        />
      </section>

      {/* ── 경고 이력 ── */}
      <WarningSection memberId={params.id} />

      {/* ── 탈퇴 처리 ── */}
      <WithdrawSection
        memberId={params.id}
        memberName={member.name}
        currentStatus={member.status}
      />

      {/* ── 상태 이력 타임라인 ── */}
      <section className="mb-8 pb-8 border-b border-gray-100">
        <h2 className="text-[15px] font-medium mb-3.5 text-[#333]">상태 이력</h2>

        {!history || history.length === 0 ? (
          <p className="text-gray-400 text-[14px]">이력이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((h: any) => (
              <div key={h.id} className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-[#4A90E2] mt-[5px] shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] text-[#222] font-medium">
                    {STATUS_LABELS[h.from_status] ?? h.from_status ?? '신규'} →{' '}
                    {STATUS_LABELS[h.to_status] ?? h.to_status}
                  </span>
                  <span className="text-[12px] text-gray-400">
                    {new Date(h.created_at).toLocaleDateString('ko-KR')}
                    {h.changer?.name && ` · ${h.changer.name}`}
                    {!h.changed_by && ' · 시스템'}
                  </span>
                  {h.reason && (
                    <span className="text-[13px] text-gray-500">{h.reason}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}

// ─────────────────────────────────────────────
// 서브 컴포넌트
// ─────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex py-2.5 border-b border-[#f5f5f5] text-[14px]">
      <span className="w-[120px] shrink-0 text-[#888] text-[13px]">{label}</span>
      <span className="text-[#222]">{value}</span>
    </div>
  )
}
