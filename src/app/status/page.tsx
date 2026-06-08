import { createClient } from '@/lib/supabase/server'

interface Props {
  searchParams: Promise<{ reason?: string }>
}

export default async function StatusPage({ searchParams }: Props) {
  const { reason } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('status, name')
    .eq('id', user!.id)
    .single()

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

  const messages: Record<string, string> = {
    PENDING:  '가입 신청이 접수되었습니다. 운영진 검토 후 면접 일정을 안내드립니다.',
    WITHDRAWN: '접근이 제한된 계정입니다. 운영진에게 문의해 주세요.',
  }

  return (
    <main style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>{profile?.name}님</h2>
        <p style={descStyle}>{messages[profile?.status ?? 'PENDING']}</p>
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
  maxWidth: '480px',
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
}
