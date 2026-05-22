import { createClient } from '@/lib/supabase/server'

export default async function StatusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('status, name')
    .eq('id', user!.id)
    .single()

  const messages: Record<string, string> = {
    PENDING: '가입 신청이 접수되었습니다. 운영진 검토 후 면접 일정을 안내드립니다.',
    WITHDRAWN: '접근이 제한된 계정입니다. 운영진에게 문의해 주세요.',
  }

  return (
    <main>
      <h2>{profile?.name}님</h2>
      <p>{messages[profile?.status ?? 'PENDING']}</p>
    </main>
  )
}