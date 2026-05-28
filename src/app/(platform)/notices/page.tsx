export default function NoticesPage() {
  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '24px' }}>공지사항</h1>
      <div style={{
        border: '1px dashed #d1d5db',
        borderRadius: '14px',
        padding: '48px',
        textAlign: 'center',
        color: '#9ca3af',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📢</div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#6b7280', marginBottom: '4px' }}>공지사항 기능 준비 중</div>
        <div style={{ fontSize: '0.82rem' }}>공지 작성 · 조회 기능이 곧 추가됩니다.</div>
      </div>
    </main>
  )
}
