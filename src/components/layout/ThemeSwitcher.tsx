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
    <div className="flex items-center gap-1.5">
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => apply(t.id)}
          title={t.label}
          className="w-5 h-5 rounded-full p-0 cursor-pointer shrink-0 transition-[border-color,outline-color] duration-150"
          style={{
            background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)`,
            border: current === t.id
              ? '2px solid rgba(255,255,255,0.85)'
              : '2px solid rgba(255,255,255,0.2)',
            outline: current === t.id ? '1px solid rgba(255,255,255,0.3)' : 'none',
            outlineOffset: '2px',
          }}
        />
      ))}
    </div>
  )
}
