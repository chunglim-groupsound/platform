'use client'

import { useEffect, useState } from 'react'

type Theme = 'worn-denim' | 'slate-stage'

const THEMES: { id: Theme; label: string; bg: string; accent: string }[] = [
  { id: 'worn-denim',  label: 'Worn Denim',  bg: '#1B2A45', accent: '#5B8EC7' },
  { id: 'slate-stage', label: 'Slate Stage', bg: '#18191D', accent: '#8B9AB0' },
]

export function ThemeSwitcher() {
  const [current, setCurrent] = useState<Theme>('worn-denim')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved && THEMES.some(t => t.id === saved)) {
      setCurrent(saved)
    }
  }, [])

  const apply = (id: Theme) => {
    setCurrent(id)
    document.documentElement.setAttribute('data-theme', id)
    localStorage.setItem('theme', id)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => apply(t.id)}
          title={t.label}
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            padding: 0,
            cursor: 'pointer',
            flexShrink: 0,
            background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)`,
            border: current === t.id
              ? '2px solid rgba(255,255,255,0.85)'
              : '2px solid rgba(255,255,255,0.2)',
            outline: current === t.id ? '1px solid rgba(255,255,255,0.3)' : 'none',
            outlineOffset: '2px',
            transition: 'border-color 0.15s, outline-color 0.15s',
          }}
        />
      ))}
    </div>
  )
}
