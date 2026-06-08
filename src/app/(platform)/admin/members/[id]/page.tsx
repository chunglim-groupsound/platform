// src/app/(platform)/admin/members/[id]/page.tsx
// 운영진 회원 상세 페이지 — 학과·학번·학년 표시 추가

import { createClient } from '@/lib/supabase/server'
import { WarningSection } from '@/components/admin/WarningSection'

const STATUS_LABELS: Record<string, string> = {
  PENDING:      '신청 대기',
  INTERVIEWING: '면접 중',
  PROBATION:    '유예',
  ACTIVE:       '정식',
  INACTIVE:     '휴면',
  WITHDRAWN:    '탈퇴',
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:      '개발 담당',
  ADMIN:            '운영진',
  TEAM_LEADER:      '팀장',
  MEMBER:           '정식 부원',
  PROBATION_MEMBER: '유예 부원',
}

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
    .select('*')
    .eq('user_id', params.id)
    .maybeSingle()

  if (!member) {
    return <div style={{ padding: '32px' }}>회원을 찾을 수 없습니다.</div>
  }

  return (
    <div style={{ padding: '32px', maxWidth: '700px' }}>

      {/* ── 기본 정보 ── */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>기본 정보</h2>

        <div style={styles.infoGrid}>
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
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>학교 정보</h2>

        <div style={styles.infoGrid}>
          <InfoRow label="학과" value={member.department  ?? '-'} />
          <InfoRow label="학번" value={member.student_id  ?? '-'} />
          <InfoRow
            label="학년"
            value={member.school_year ? `${member.school_year}학년` : '-'}
          />
        </div>
      </section>

      {/* ── 연락처 ── */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>연락처</h2>
        <div style={styles.infoGrid}>
          <InfoRow label="전화번호" value={member.phone ?? '-'} />
        </div>
      </section>

      {/* ── 유예 기간 정보 ── */}
      {member.status === 'PROBATION' && member.probation_started_at && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>유예 기간</h2>
          <div style={styles.infoGrid}>
            <InfoRow
              label="시작일"
              value={new Date(member.probation_started_at).toLocaleDateString('ko-KR')}
            />
            <InfoRow
              label="만료 예정"
              value={new Date(
                new Date(member.probation_started_at).getTime() + 30 * 24 * 60 * 60 * 1000
              ).toLocaleDateString('ko-KR')}
            />
            <InfoRow
              label="잔여일"
              value={(() => {
                const end = new Date(
                  new Date(member.probation_started_at).getTime() + 30 * 24 * 60 * 60 * 1000
                )
                const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return diff > 0 ? `D-${diff}` : '만료'
              })()}
            />
          </div>
        </section>
      )}

      {/* ── 가입 신청서 ── */}
      {application && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>가입 신청서</h2>

          {application.motivation && (
            <div style={styles.textBlock}>
              <p style={styles.textBlockLabel}>지원 동기</p>
              <p style={styles.textBlockBody}>{application.motivation}</p>
            </div>
          )}

          {application.self_intro && (
            <div style={styles.textBlock}>
              <p style={styles.textBlockLabel}>자기소개</p>
              <p style={styles.textBlockBody}>{application.self_intro}</p>
            </div>
          )}

          {application.admin_note && (
            <div style={{ ...styles.textBlock, background: '#fffbeb', border: '1px solid #fef08a' }}>
              <p style={styles.textBlockLabel}>운영진 메모 (내부)</p>
              <p style={styles.textBlockBody}>{application.admin_note}</p>
            </div>
          )}

          <div style={styles.infoGrid}>
            <InfoRow
              label="면접 일정"
              value={application.interview_scheduled_at
                ? new Date(application.interview_scheduled_at).toLocaleString('ko-KR')
                : '미정'}
            />
            <InfoRow
              label="면접 결과"
              value={{ PASS: '합격', FAIL: '불합격', PENDING: '대기 중' }[application.interview_result as string] ?? '-'}
            />
          </div>
        </section>
      )}

      {/* ── 경고 이력 ── */}
      <WarningSection memberId={params.id} />

      {/* ── 상태 이력 타임라인 ── */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>상태 이력</h2>

        {!history || history.length === 0 ? (
          <p style={{ color: '#aaa', fontSize: '14px' }}>이력이 없습니다.</p>
        ) : (
          <div style={styles.timeline}>
            {history.map((h: any) => (
              <div key={h.id} style={styles.timelineItem}>
                <div style={styles.timelineDot} />
                <div style={styles.timelineContent}>
                  <span style={styles.timelineStatus}>
                    {STATUS_LABELS[h.from_status] ?? h.from_status ?? '신규'} →{' '}
                    {STATUS_LABELS[h.to_status] ?? h.to_status}
                  </span>
                  <span style={styles.timelineMeta}>
                    {new Date(h.created_at).toLocaleDateString('ko-KR')}
                    {h.changer?.name && ` · ${h.changer.name}`}
                    {!h.changed_by && ' · 시스템'}
                  </span>
                  {h.reason && (
                    <span style={styles.timelineReason}>{h.reason}</span>
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
    <div style={infoRowStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  )
}

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  padding: '10px 0',
  borderBottom: '1px solid #f5f5f5',
  fontSize: '14px',
}
const labelStyle: React.CSSProperties = {
  width: '120px',
  flexShrink: 0,
  color: '#888',
  fontSize: '13px',
}
const valueStyle: React.CSSProperties = {
  color: '#222',
}

// ─────────────────────────────────────────────
// 스타일
// ─────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: '32px',
    paddingBottom: '32px',
    borderBottom: '1px solid #f0f0f0',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: 500,
    marginBottom: '14px',
    color: '#333',
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  textBlock: {
    background: '#f9f9f9',
    border: '1px solid #eee',
    borderRadius: '6px',
    padding: '14px 16px',
    marginBottom: '12px',
  },
  textBlockLabel: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '6px',
    fontWeight: 500,
  },
  textBlockBody: {
    fontSize: '14px',
    color: '#333',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap' as const,
    margin: 0,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  timelineItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4A90E2',
    marginTop: '5px',
    flexShrink: 0,
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  timelineStatus: {
    fontSize: '14px',
    color: '#222',
    fontWeight: 500,
  },
  timelineMeta: {
    fontSize: '12px',
    color: '#aaa',
  },
  timelineReason: {
    fontSize: '13px',
    color: '#666',
  },
}