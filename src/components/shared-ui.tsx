'use client';
import React from 'react';
import { Icons } from '@/components/icons';

// ═══════════════════════════════════════════════════════════════════════════
// 청림그룹사운드 리디자인
// 모듈: 공용 UI 컴포넌트 (UI)
// 메인 파일에서 src="modules/03-shared-ui.jsx" 로 로드됨.
// 로드 순서가 의존성 순서입니다 (이 파일은 03/12 번째).
// ═══════════════════════════════════════════════════════════════════════════


// ───────────── SHARED UI ─────────────

// session → short glyph for avatars/labels
function Kicker({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="kicker" style={style}>{children}</div>;
}

// Section header: mono kicker + big title + optional action
function SectionHead({ kicker, title, action, onAction }: { kicker?: string; title?: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, marginBottom:18 }}>
      <div>
        <Kicker>{kicker}</Kicker>
        <h2 style={{ margin:'10px 0 0', fontFamily:'var(--font-sans)', fontWeight:700, fontSize:22, letterSpacing:'-0.02em', whiteSpace:'nowrap' }}>{title}</h2>
      </div>
      {action && (
        <button className="btn btn-ghost mono" style={{ fontSize:12, letterSpacing:'0.04em', color:'var(--muted-foreground)' }}
          onClick={onAction} onMouseEnter={e=>e.currentTarget.style.color='var(--accent-hover)'} onMouseLeave={e=>e.currentTarget.style.color='var(--muted-foreground)'}>
          {action}<Icons.arrow size={14} />
        </button>
      )}
    </div>
  );
}

function Avatar({ name, size = 40, hue }: { name?: string; size?: number; hue?: string }) {
  const initial = (name || '?')[0];
  return (
    <div className="avatar" style={{ width:size, height:size, fontSize:size*0.4, color: hue || 'var(--muted-foreground)' }}>
      {initial}
    </div>
  );
}

function Badge({ children, variant, style }: { children?: React.ReactNode; variant?: string; style?: React.CSSProperties }) {
  const cls = variant === 'accent' ? 'badge badge-accent'
    : variant === 'live' ? 'badge badge-live'
    : variant === 'dim' ? 'badge badge-dim' : 'badge';
  return <span className={cls} style={style}>{children}</span>;
}

function SessionTags({ list, hue }: { list: string[]; hue?: string }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
      {list.map((s: string) => (
        <span key={s} className="mono" style={{
          fontSize:10.5, letterSpacing:'0.04em', padding:'2px 7px', borderRadius:3,
          color: hue || 'var(--accent-hover)', whiteSpace:'nowrap',
          border:`1px solid ${hue ? hexA(hue,0.35) : 'var(--border)'}`,
          background: hue ? hexA(hue,0.08) : 'transparent',
        }}>{s}</span>
      ))}
    </div>
  );
}

// hex + alpha helper
function hexA(hex: string, a: number) {
  const h = hex.replace('#','');
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

// big Anton stat
function Stat({ value, label, accent }: { value: string | number; label: string; accent?: boolean }) {
  return (
    <div>
      <div className="display" style={{ fontSize:52, color: accent ? 'var(--accent-hover)' : 'var(--foreground)', lineHeight:0.85 }}>{value}</div>
      <div className="mono" style={{ fontSize:10.5, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--muted-foreground)', marginTop:8 }}>{label}</div>
    </div>
  );
}

function RecruitBadge({ recruiting }: { recruiting?: boolean }) {
  return recruiting
    ? <Badge variant="accent"><span className="dot" style={{ background:'var(--accent)' }}></span>모집중</Badge>
    : <Badge variant="dim">마감</Badge>;
}

export const UI = { Kicker, SectionHead, Avatar, Badge, SessionTags, Stat, RecruitBadge, hexA };


