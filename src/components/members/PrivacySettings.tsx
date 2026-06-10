'use client'

const SCOPE_OPTIONS = [
  { value: 'all',    label: '전체 공개' },
  { value: 'member', label: '부원만' },
  { value: 'admin',  label: '운영진만' },
]

const PRIVACY_FIELDS: { key: string; label: string; allowedScopes: string[]; defaultScope: string }[] = [
  { key: 'name',        label: '실명',   allowedScopes: ['all', 'member', 'admin'], defaultScope: 'member' },
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
    <div className="flex flex-col gap-2.5">
      {PRIVACY_FIELDS.map(field => {
        const current = value[field.key] ?? field.defaultScope
        return (
          <div key={field.key} className="flex items-center gap-3">
            <span className="w-[60px] text-sm text-gray-700 shrink-0">
              {field.label}
            </span>
            <div className="flex gap-1.5">
              {SCOPE_OPTIONS.filter(o => field.allowedScopes.includes(o.value)).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange(field.key, opt.value)}
                  className="py-[3px] px-2.5 rounded-full text-[0.78rem] border"
                  style={{
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
              <span className="text-xs text-red-600">
                ⚠ 모든 사람에게 공개됩니다
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
