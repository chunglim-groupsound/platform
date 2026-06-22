'use client';
import { useEffect, useRef, useState } from 'react';

export const THEME_META = {
  'worn-denim':   { label: 'Worn Denim',   sw: 'linear-gradient(135deg,#151A26 50%,#D6A35A 50%)' },
  'slate-stage':  { label: 'Slate Stage',  sw: 'linear-gradient(135deg,#161719 50%,#AEB7C4 50%)' },
  'crimson-amp':  { label: 'Ember',        sw: 'linear-gradient(135deg,#121A1C 50%,#E58A6B 50%)' },
  'velvet-night': { label: 'Velvet Night', sw: 'linear-gradient(135deg,#15141F 50%,#D9B468 50%)' },
  'neon-moss':    { label: 'Green Room',   sw: 'linear-gradient(135deg,#121A14 50%,#DA8AA0 50%)' },
} as const;

export type ThemeId = keyof typeof THEME_META;

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('worn-denim');
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as ThemeId | null;
    if (saved && THEME_META[saved]) {
      document.documentElement.setAttribute('data-theme', saved);
      setCurrentTheme(saved);
    }
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  function applyTheme(id: ThemeId) {
    document.documentElement.setAttribute('data-theme', id);
    setCurrentTheme(id);
    localStorage.setItem('theme', id);
    setOpen(false);
  }

  return { currentTheme, open, setOpen, applyTheme, pickerRef };
}
