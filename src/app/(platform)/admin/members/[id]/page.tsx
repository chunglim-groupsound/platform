import { createClient } from '@/lib/supabase/server'

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
    .select('*, changed_by_user:changed_by(name)')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false })

  const { data: application } = await supabase
    .from('join_applications')
    .select('*')
    .eq('user_id', params.id)
    .maybeSingle()

  return (
    <div>
      {/* 회원 기본 정보 */}
      <section>
        <h2>{member?.name}</h2>
        <p>{member?.generation}기 | {member?.session?.join(', ')}</p>
        <p>상태: {member?.status} | 역할: {member?.role}</p>
      </section>

      {/* 가입 신청서 내용 */}
      {application && (
        <section>
          <h3>가입 신청서</h3>
          <p><strong>지원 동기</strong>: {application.motivation}</p>
          <p><strong>자기소개</strong>: {application.self_intro}</p>
        </section>
      )}

      {/* 상태 이력 타임라인 */}
      <section>
        <h3>상태 이력</h3>
        {history?.map(h => (
          <div key={h.id}>
            <span>{new Date(h.created_at).toLocaleDateString('ko-KR')}</span>
            <span>{h.from_status} → {h.to_status}</span>
            <span>{h.reason}</span>
          </div>
        ))}
      </section>

      {/* 역할·화이트리스트 관리 버튼 — Client Component로 분리 */}
    </div>
  )
}