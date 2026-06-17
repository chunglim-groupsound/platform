'use client'

import { useEffect, useState } from 'react'

export type ThemeId =
  | 'worn-denim'
  | 'slate-stage'
  | 'crimson-amp'
  | 'velvet-night'
  | 'neon-moss'

export const THEMES: { id: ThemeId; label: string; bg: string; accent: string }[] = [
  { id: 'worn-denim',   label: 'Worn Denim',   bg: '#151A26', accent: '#D6A35A' },
  { id: 'slate-stage',  label: 'Slate Stage',  bg: '#161719', accent: '#AEB7C4' },
  { id: 'crimson-amp',  label: 'Ember',        bg: '#121A1C', accent: '#E58A6B' },
  { id: 'velvet-night', label: 'Velvet Night', bg: '#15141F', accent: '#D9B468' },
  { id: 'neon-moss',    label: 'Green Room',   bg: '#121A14', accent: '#DA8AA0' },
]

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>('worn-denim')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as ThemeId | null
    if (saved && THEMES.some(t => t.id === saved)) {
      setTheme(saved)
    }
  }, [])

  const applyTheme = (id: ThemeId) => {
    setTheme(id)
    document.documentElement.setAttribute('data-theme', id)
    localStorage.setItem('theme', id)
  }

  return { theme, applyTheme, themes: THEMES }
}
