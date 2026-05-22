// Deno Edge Function — VS Code에서 Deno 확장(denoland.vscode-deno) 설치 필요

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ExpiredMember {
  id: string
  name: string
  probation_started_at: string
}

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 30일 이상 경과한 PROBATION 회원 조회
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString()

  const { data: expired, error } = await supabase
    .from('users')
    .select('id, name, probation_started_at')
    .eq('status', 'PROBATION')
    .lt('probation_started_at', thirtyDaysAgo)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!expired || expired.length === 0) {
    return new Response(JSON.stringify({ message: '만료 대상 없음' }), { status: 200 })
  }

  const members = expired as ExpiredMember[]

  // ⚠️ 자동 ACTIVE 전환 금지 — 운영진 확인 필수
  // Phase 2에서 카카오 알림톡 연동 후 실제 알림 발송 구현
  console.log(
    `유예 만료 대상 ${members.length}명:`,
    members.map((u) => u.name).join(', ')
  )

  return new Response(
    JSON.stringify({ expired: members.length, members }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})