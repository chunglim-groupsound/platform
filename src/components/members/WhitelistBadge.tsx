'use client'

export function WhitelistBadge() {
  return (
    <span
      title="화이트리스트"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        padding: '1px 6px',
        borderRadius: '9999px',
        fontSize: '0.7rem',
        fontWeight: 600,
        background: '#fef9c3',
        color: '#854d0e',
        border: '1px solid #fde047',
      }}
    >
      ★ WL
    </span>
  )
}
