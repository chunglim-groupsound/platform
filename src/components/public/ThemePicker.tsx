'use client';
import { THEME_META, ThemeId, useTheme } from '@/hooks/useTheme';

interface Props {
  currentTheme: ThemeId;
  open: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onSelect: (id: ThemeId) => void;
  pickerRef: React.RefObject<HTMLDivElement | null>;
}

export function ThemePicker({ currentTheme, open, onToggle, onSelect, pickerRef }: Props) {
  const meta = THEME_META[currentTheme];
  return (
    <div className={`theme-picker${open ? ' open' : ''}`} ref={pickerRef}>
      <button className="theme-trigger" onClick={onToggle} aria-haspopup="true" aria-expanded={open}>
        <span className="sw" style={{ background: meta.sw }} />
        <span className="lbl">{meta.label}</span>
        <span className="chev ico">
          <svg width="13" height="13" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </button>
      <div className="theme-menu" role="menu">
        <div className="tm-title">테마 변경</div>
        <div className="tm-list">
          {(Object.entries(THEME_META) as [ThemeId, (typeof THEME_META)[ThemeId]][]).map(([id, m]) => (
            <button key={id} className="theme-opt" aria-pressed={currentTheme === id} onClick={() => onSelect(id)}>
              <span className="sw" style={{ background: m.sw }} />
              <span className="nm">{m.label}</span>
              <span className="ck ico">
                <svg width="15" height="15" viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
