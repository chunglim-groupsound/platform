'use client';
import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// 청림그룹사운드 리디자인
// 모듈: 라인 아이콘 세트 (Icons)
// 메인 파일에서 src="modules/02-icons.jsx" 로 로드됨.
// 로드 순서가 의존성 순서입니다 (이 파일은 02/12 번째).
// ═══════════════════════════════════════════════════════════════════════════


// ───────────── LINE ICONS (stroke 1.6, no emoji) ─────────────
type SvgProps = React.ComponentPropsWithoutRef<'span'> & { size?: number };

const Svg = ({ size = 18, children, ...p }: SvgProps) => (
  <span className="ico" style={{ width: size, height: size }} {...p}>
    <svg viewBox="0 0 24 24" width={size} height={size}>{children}</svg>
  </span>
);

const Icons: Record<string, (p: SvgProps) => React.ReactElement> = {
  home: (p) => <Svg {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9.5a.5.5 0 0 0 .5.5H9.5V14h5v6h4a.5.5 0 0 0 .5-.5V10"/></Svg>,
  calendar: (p) => <Svg {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"/></Svg>,
  users: (p) => <Svg {...p}><circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M16 5.2a3 3 0 0 1 0 5.6M17.5 14.6c2.2.6 3.8 2.4 3.8 4.9"/></Svg>,
  guitar: (p) => <Svg {...p}><circle cx="8.5" cy="15.5" r="4"/><circle cx="8.5" cy="15.5" r="1"/><path d="m11.3 12.6 6-6M15.2 4.7l1.7-1.7 2.1 2.1-1.7 1.7M16.9 6.4l1.4 1.4"/></Svg>,
  megaphone: (p) => <Svg {...p}><path d="M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1Z"/><path d="M18 8.5a4 4 0 0 1 0 7M7 15v4.5"/></Svg>,
  settings: (p) => <Svg {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6"/></Svg>,
  search: (p) => <Svg {...p}><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.6-3.6"/></Svg>,
  clock: (p) => <Svg {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.2 2"/></Svg>,
  chevron: (p) => <Svg {...p}><path d="m9 6 6 6-6 6"/></Svg>,
  arrow: (p) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Svg>,
  plus: (p) => <Svg {...p}><path d="M12 5v14M5 12h14"/></Svg>,
  check: (p) => <Svg {...p}><path d="m4.5 12.5 5 5 10-11"/></Svg>,
  pin: (p) => <Svg {...p}><path d="M9 4h6l-1 5 3 3v2H7v-2l3-3-1-5ZM12 17v3.5"/></Svg>,
  music: (p) => <Svg {...p}><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></Svg>,
  mic: (p) => <Svg {...p}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></Svg>,
  spark: (p) => <Svg {...p}><path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18"/></Svg>,
  logout: (p) => <Svg {...p}><path d="M14 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8"/><path d="M17 8l4 4-4 4M21 12H10"/></Svg>,
  phone: (p) => <Svg {...p}><path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a1 1 0 0 1-1 1A14 14 0 0 1 4 5a1 1 0 0 1 1-1Z"/></Svg>,
  grid: (p) => <Svg {...p}><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></Svg>,
  x: (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18"/></Svg>,
  crown: (p) => <Svg {...p}><path d="M4 18h16M4 18l-1.5-9 5 3.5L12 6l4.5 6.5 5-3.5L20 18"/></Svg>,
  star: (p) => <Svg {...p}><path d="m12 4 2.3 4.9 5.2.7-3.8 3.6 1 5.2L12 16l-4.7 2.4 1-5.2L4.5 9.6l5.2-.7z"/></Svg>,
  alert: (p) => <Svg {...p}><path d="M12 4.5 2.8 20h18.4L12 4.5Z"/><path d="M12 10v4.5M12 17.6v.2"/></Svg>,
  ban: (p) => <Svg {...p}><circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/></Svg>,
  pause: (p) => <Svg {...p}><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></Svg>,
  send: (p) => <Svg {...p}><path d="M21 4 3 11l6 2.5L12 20l3-7 6-9Z"/><path d="m9 13.5 6-6.5"/></Svg>,
  mail: (p) => <Svg {...p}><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m4 7 8 6 8-6"/></Svg>,
  cake: (p) => <Svg {...p}><path d="M4 20h16M5 20v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M4 15c1.5 0 1.5 1.2 3 1.2S10.5 15 12 15s1.5 1.2 3 1.2 1.5-1.2 3-1.2M12 8V5M9.5 5.5 12 4l2.5 1.5"/></Svg>,
  book: (p) => <Svg {...p}><path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4ZM18 16H7a2 2 0 0 0-2 2"/></Svg>,
  person: (p) => <Svg {...p}><circle cx="12" cy="8.5" r="4"/><path d="M4.5 20c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/></Svg>,
  edit: (p) => <Svg {...p}><path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z"/><path d="M13.5 6.5l4 4"/></Svg>,
  trash: (p) => <Svg {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M7 7l.9 12a1 1 0 0 0 1 1h6.2a1 1 0 0 0 1-1L18 7M10.5 11v6M13.5 11v6"/></Svg>,
  place: (p) => <Svg {...p}><path d="M12 21s7-5.6 7-11a7 7 0 0 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></Svg>,
  lock: (p) => <Svg {...p}><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></Svg>,
  bell: (p) => <Svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/></Svg>,
  flag: (p) => <Svg {...p}><path d="M5 21V4M5 5h12l-2 3 2 3H5"/></Svg>,
  shield: (p) => <Svg {...p}><path d="M12 3 5 6v5c0 4.5 3 8 7 9.5 4-1.5 7-5 7-9.5V6l-7-3Z"/></Svg>,
  inbox: (p) => <Svg {...p}><path d="M4 13h4l1.5 3h5L16 13h4"/><path d="M4 13 6.5 5h11L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5Z"/></Svg>,
  reply: (p) => <Svg {...p}><path d="M9 7 4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 5 5v1"/></Svg>,
  upload: (p) => <Svg {...p}><path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 15v3.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V15"/></Svg>,
  download: (p) => <Svg {...p}><path d="M12 4v11.5M7.5 11l4.5 4.5 4.5-4.5"/><path d="M4 15v3.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V15"/></Svg>,
  sheet: (p) => <Svg {...p}><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M4 9h16M4 14.5h16M9.5 9v11.5M14.5 9v11.5"/></Svg>,
};

export { Icons };


