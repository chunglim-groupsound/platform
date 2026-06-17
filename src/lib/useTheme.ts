'use client'

import { useEffect, useState } from 'react'

export type ThemeId =
  | 'worn-denim'
  | 'slate-stage'
  | 'crimson-amp'
  | 'velvet-night'
  | 'neon-moss'

export const THEMES: { id: ThemeId; label: string; bg: string; accent: string }[] = [
  { id: 'worn-denim',   label: 'Worn Denim',   bg: '#1B2A45', accent: '#5B8EC7' },
  { id: 'slate-stage',  label: 'Slate Stage',  bg: '#18191D', accent: '#8B9AB0' },
  { id: 'crimson-amp',  label: 'Crimson Amp',  bg: '#2A1518', accent: '#E05560' },
  { id: 'velvet-night', label: 'Velvet Night', bg: '#1A1525', accent: '#9C7FDB' },
  { id: 'neon-moss',    label: 'Neon Moss',    bg: '#121A18', accent: '#4FBF7A' },
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
