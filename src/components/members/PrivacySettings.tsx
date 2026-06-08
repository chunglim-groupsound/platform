'use client'

const SCOPE_OPTIONS = [
  { value: 'all',    label: '전체 공개' },
  { value: 'member', label: '부원만' },
  { value: 'admin',  label: '운영진만' },
]

const PRIVACY_FIELDS: { key: string; label: string; allowedScopes: string[]; defaultScope: string }[] = [
  { key: 'generation',  label: '기수',   allowedScopes: ['all', 'member', 'admin'], defaultScope: 'member' },
  { key: 'phone',       label: '연락처', allowedScopes: ['member', 'admin'],        defaultScope: 'admin' },
  { key: 'department',  label: '학과',   allowedScopes: ['all', 'member', 'admin'], defaultScope: 'member' },
  { key: 'student_id',  label: '학번',   allowedScopes: ['admin'],                  defaultScope: 'admin' },
  { key: 'school_year', label: '학년',   allowedScopes: ['all', 'member', 'admin'], defaultScope: 'member' },
]

interface PrivacySettingsProps {
  value: Record<string, string>
  onChange: (next: Record<string, string>) => void
}

export function PrivacySettings({ value, onChange }: PrivacySettingsProps) {
  const handleChange = (key: string, scope: string) => {
    onChange({ ...value, [key]: scope })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {PRIVACY_FIELDS.map(field => {
        const current = value[field.key] ?? field.defaultScope
        return (
          <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '60px', fontSize: '0.875rem', color: '#374151', flexShrink: 0 }}>
              {field.label}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {SCOPE_OPTIONS.filter(o => field.allowedScopes.includes(o.value)).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange(field.key, opt.value)}
                  style={{
                    padding: '3px 10px', borderRadius: '9999px', fontSize: '0.78rem',
                    border: '1px solid',
                    borderColor: current === opt.value ? '#3b82f6' : '#d1d5db',
                    background: current === opt.value ? '#eff6ff' : '#fff',
                    color: current === opt.value ? '#1d4ed8' : '#6b7280',
                    cursor: field.allowedScopes.length === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: current === opt.value ? 600 : 400,
                  }}
                  disabled={field.allowedScopes.length === 1}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {field.key === 'phone' && current === 'all' && (
              <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>
                ⚠ 모든 사람에게 공개됩니다
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
