'use client';
import React from 'react';
import { Icons } from '@/components/icons';
import { UI } from '@/components/shared-ui';
import { Timetable } from '@/components/timetable';
import { Home } from '@/components/home';
import { Screens } from '@/components/members-teams-profile';
import { NoticesModule } from '@/components/board';
import { Notifications } from '@/components/notifications';
import { ReportModule } from '@/components/report';
import { MemberAdmin } from '@/components/member-admin';
import { DATA, TeamStore, TTShared } from '@/lib/mock-data';
import { useTweaks } from '@/components/tweaks';

// ═══════════════════════════════════════════════════════════════════════════
// 청림그룹사운드 리디자인
// 모듈: 앱 루트 + 운영자 페이지 (모집·팀활성화·타임테이블 설정 / 라우팅 / 마운트)
// 메인 파일에서 src="modules/12-app-root.jsx" 로 로드됨.
// 로드 순서가 의존성 순서입니다 (이 파일은 12/12 번째).
// ═══════════════════════════════════════════════════════════════════════════


// ───────────── APP ROOT ─────────────
const { useState, useEffect, useRef } = React;
const D = DATA;
const ME = D.ME!;
type NavParams = Record<string, unknown> | null;
type GoFn = (k: string, params?: NavParams) => void;
type IconComp = (props: { size: number }) => React.ReactElement;

interface InterviewSlot { id: string; date: string; start: string; end: string; capacity: number; booked: number; note: string; }
interface SlotGroup { date: string; items: InterviewSlot[]; }
interface Applicant { id: string; name: string; dept: string; contact: string; kakao: string; sessions: string[]; exp: string; message: string; appliedAt: string; preferredSlotIds: string[]; status: string; slotId: string | null; notified: boolean; notifiedAt?: string | null; }
interface TtTerm { id: string; type: 'semester' | 'vacation'; label: string; start: string; end: string; bookOpenDate?: string; bookOpenTime?: string; }
interface TtEvent { id: string; kind: 'event' | 'closed'; label: string; start: string; end: string; allDay: boolean; startTime: number; endTime: number; note?: string; }

const UU = UI;
const TT = Timetable;
const H = Home;
const S = Screens;
const N = NoticesModule;
const NOT = Notifications;
const RP = ReportModule;
const MA = MemberAdmin;
function useTeamStore(){ const [,f] = useState(0); useEffect(() => { const unsub = TeamStore.subscribe(() => f(x=>x+1)); return () => { unsub(); }; }, []); }

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "worn-denim",
  "accent": "default",
  "displayFont": "anton"
}/*EDITMODE-END*/;

const NAV = [
  { key:'home',      label:'홈' },
  { key:'timetable', label:'타임테이블' },
  { key:'members',   label:'부원' },
  { key:'teams',     label:'팀' },
  { key:'notices',   label:'게시판' },
];

const THEME_DOTS = [
  { id:'worn-denim',   label:'Worn Denim',   bg:'#151A26', accent:'#D6A35A' },
  { id:'slate-stage',  label:'Slate Stage',  bg:'#161719', accent:'#AEB7C4' },
  { id:'crimson-amp',  label:'Ember',        bg:'#121A1C', accent:'#E58A6B' },
  { id:'velvet-night', label:'Velvet Night', bg:'#15141F', accent:'#D9B468' },
  { id:'neon-moss',    label:'Green Room',   bg:'#121A14', accent:'#DA8AA0' },
];

function Header({ screen, go, theme, setTheme }: { screen: string; go: GoFn; theme: string; setTheme: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key==='Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);
  return (
    <header style={{ position:'sticky', top:0, zIndex:100, background:'var(--surface)', borderBottom:'1px solid var(--border-subtle)', backdropFilter:'blur(8px)' }}>
      <div className="hdr-inner" style={{ maxWidth:1180, margin:'0 auto', padding:'0 26px', height:62, display:'flex', alignItems:'center', gap:30 }}>
        {/* logo */}
        <div onClick={()=>go('home')} style={{ display:'flex', alignItems:'center', gap:11, cursor:'pointer', flex:'0 0 auto' }}>
          <span style={{ width:30, height:30, borderRadius:6, border:'1.5px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-hover)' }}>
            <span style={{ width:22, height:22, display:'inline-block', background:'var(--accent-hover)', WebkitMaskImage:'url(/icon.svg)', WebkitMaskSize:'contain', WebkitMaskRepeat:'no-repeat', WebkitMaskPosition:'center', maskImage:'url(/icon.svg)', maskSize:'contain', maskRepeat:'no-repeat', maskPosition:'center' }} />
          </span>
          <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15.5, letterSpacing:'-0.02em', whiteSpace:'nowrap' }}>청림그룹사운드</span>
        </div>

        {/* nav */}
        <nav className="desk-nav" style={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
          {NAV.map(n => {
            const active = screen === n.key || (n.key==='notices' && screen.indexOf('notice')===0);
            return (
              <button key={n.key} onClick={()=>go(n.key)} style={{
                position:'relative', padding:'8px 14px', fontSize:13.5, fontFamily:'var(--font-sans)',
                fontWeight: active?700:500, borderRadius:6, whiteSpace:'nowrap',
                color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                transition:'color .14s',
              }}
                onMouseEnter={e=>{ if(!active) e.currentTarget.style.color='var(--foreground)'; }}
                onMouseLeave={e=>{ if(!active) e.currentTarget.style.color='var(--muted-foreground)'; }}>
                {n.label}
                {active && <span style={{ position:'absolute', left:14, right:14, bottom:-1, height:2, background:'var(--accent)', borderRadius:2 }}></span>}
              </button>
            );
          })}
          <button onClick={()=>go('admin')} style={{
            padding:'8px 14px', fontSize:13.5, fontFamily:'var(--font-sans)', fontWeight:600,
            color: screen==='admin' ? 'var(--accent-hover)' : 'var(--accent)', borderRadius:6, whiteSpace:'nowrap',
          }}>운영</button>
        </nav>

        {/* notifications + profile */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto', flex:'0 0 auto' }}>
        <NOT.BellMenu go={go} />
        <div ref={menuRef} className="hdr-profile" style={{ position:'relative', flex:'0 0 auto' }}>
          <button onClick={()=>setMenuOpen(o=>!o)} style={{
            display:'flex', alignItems:'center', gap:9, padding:'5px 8px 5px 5px', borderRadius:22,
            border:`1px solid ${menuOpen?'var(--border)':'transparent'}`, background: menuOpen?'var(--surface-elevated)':'transparent', transition:'all .14s',
          }}
            onMouseEnter={e=>{ if(!menuOpen) e.currentTarget.style.background='var(--surface-elevated)'; }}
            onMouseLeave={e=>{ if(!menuOpen) e.currentTarget.style.background='transparent'; }}>
            <UU.Avatar name={ME.nick||ME.name} size={30} hue="var(--accent-hover)" />
            <span className="hdr-user" style={{ fontSize:13, fontWeight:600, color:'var(--foreground)', whiteSpace:'nowrap' }}>{ME.nick||ME.name}</span>
            <span className="hdr-user" style={{ color:'var(--subtle-foreground)', display:'flex', transform: menuOpen?'rotate(90deg)':'rotate(90deg) scaleX(-1)', transition:'transform .18s' }}><Icons.chevron size={13} /></span>
          </button>

          {menuOpen && (
            <div className="profile-menu" style={{
              position:'absolute', top:'calc(100% + 10px)', right:0, width:264, zIndex:200,
              background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12,
              boxShadow:'0 18px 50px rgba(0,0,0,0.45)', overflow:'hidden',
            }}>
              {/* identity */}
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 16px', borderBottom:'1px solid var(--border-subtle)' }}>
                <UU.Avatar name={ME.nick||ME.name} size={42} hue="var(--accent-hover)" />
                <div style={{ minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15 }}>{ME.nick||ME.name}</span>
                    {(ME as { whitelist?: boolean }).whitelist && <span title="화이트리스트" style={{ color:'#E8C463', fontSize:12 }}>★</span>}
                  </div>
                  <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:2 }}>{ME.gen}기 · 정식 부원</div>
                </div>
              </div>

              {/* profile settings */}
              <button className="pm-item" onClick={()=>{ setMenuOpen(false); go('my-profile'); }}>
                <Icons.person size={17} /><span>내 프로필</span><span style={{ marginLeft:'auto', color:'var(--subtle-foreground)' }}><Icons.chevron size={14} /></span>
              </button>

              {/* report */}
              <button className="pm-item" onClick={()=>{ setMenuOpen(false); go('report'); }} style={{ borderTop:'1px solid var(--border-subtle)' }}>
                <Icons.flag size={17} /><span>신고 · 제보</span><span style={{ marginLeft:'auto', color:'var(--subtle-foreground)' }}><Icons.chevron size={14} /></span>
              </button>

              {/* theme */}
              <div style={{ padding:'10px 16px 13px', borderTop:'1px solid var(--border-subtle)' }}>
                <div className="mono" style={{ fontSize:9.5, letterSpacing:'0.12em', color:'var(--subtle-foreground)', textTransform:'uppercase', marginBottom:9 }}>테마 변경</div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {THEME_DOTS.map(t => {
                    const sel = theme===t.id;
                    return (
                      <button key={t.id} onClick={()=>setTheme(t.id)} style={{
                        display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8,
                        border:`1px solid ${sel?'var(--accent)':'var(--border-subtle)'}`, background: sel?'var(--accent-muted)':'transparent', transition:'all .14s',
                      }}
                        onMouseEnter={e=>{ if(!sel) e.currentTarget.style.background='var(--surface-elevated)'; }}
                        onMouseLeave={e=>{ if(!sel) e.currentTarget.style.background='transparent'; }}>
                        <span style={{ width:18, height:18, borderRadius:'50%', flex:'0 0 auto', background:`linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)`, border:'1px solid rgba(255,255,255,0.2)' }}></span>
                        <span style={{ fontSize:12.5, fontFamily:'var(--font-sans)', fontWeight: sel?600:400, color: sel?'var(--accent-hover)':'var(--muted-foreground)', whiteSpace:'nowrap' }}>{t.label}</span>
                        {sel && <span style={{ marginLeft:'auto', color:'var(--accent-hover)', display:'flex' }}><Icons.check size={15} /></span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* logout */}
              <button className="pm-item pm-danger" onClick={()=>setMenuOpen(false)} style={{ borderTop:'1px solid var(--border-subtle)' }}>
                <Icons.logout size={17} /><span>로그아웃</span>
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}

/* ───────────── ADMIN — 모집 관리 (랜딩 페이지 모집 여부 · 모집글) ───────────── */
const RECRUIT_KEY = 'CHUNGLIM_recruit_v1';
const RECRUIT_DEFAULT = {
  open: true,
  semester: '2026-2학기 신입 모집',
  headline: '보컬 · 건반 세션 우대',
  body: '카카오 로그인 후 지원서를 작성하면 면접 일정을 안내드립니다.',
  sessions: ['보컬', '건반'],
  periodStart: '2026-08-25',
  periodEnd: '2026-09-12',
  closedNote: '이번 학기 신입 부원 모집은 마감되었습니다. 다음 모집 일정은 공지를 통해 안내드릴게요.',
  updatedAt: '2026.06.10 14:22',
  updatedBy: '도형',
};
const REC_SESSIONS = ['보컬', '기타', '베이스', '드럼', '건반'];

function loadRecruit() {
  try { const raw = localStorage.getItem(RECRUIT_KEY); if (raw) return { ...RECRUIT_DEFAULT, ...JSON.parse(raw) }; } catch (e) {}
  return { ...RECRUIT_DEFAULT };
}
function recNowStamp() {
  const d = new Date(); const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function recMMDD(iso: string) { if (!iso) return '—'; const parts = iso.split('-'); return parts.length === 3 ? `${parts[1]}.${parts[2]}` : iso; }

const recInput: React.CSSProperties = {
  width: '100%', padding: '11px 13px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--foreground)', fontSize: 14, boxSizing: 'border-box',
  fontFamily: 'var(--font-kr)', outline: 'none',
};
function RecField({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 9, flexWrap: 'wrap' }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--foreground)', fontFamily: 'var(--font-sans)', flex: '0 0 auto', whiteSpace: 'nowrap' }}>{children}</label>
      {hint && <span className="mono" style={{ fontSize: 10, color: 'var(--subtle-foreground)' }}>{hint}</span>}
    </div>
  );
}
function RecSwitch({ on, onChange }: { on: boolean; onChange: (val: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} style={{
      width: 54, height: 30, borderRadius: 999, padding: 3, flex: '0 0 auto', cursor: 'pointer',
      background: on ? 'var(--accent)' : 'var(--border)', transition: 'background .2s ease',
      display: 'flex', alignItems: 'center', justifyContent: on ? 'flex-end' : 'flex-start',
      border: 'none',
    }}>
      <span style={{ width: 24, height: 24, borderRadius: '50%', background: on ? '#1A1308' : 'var(--foreground)', boxShadow: '0 1px 3px rgba(0,0,0,0.35)', transition: 'all .2s ease' }}></span>
    </button>
  );
}

/* live replica of the landing-page recruitment block */
function RecruitPreview({ data }: { data: { open: boolean; semester: string; headline: string; body: string; sessions: string[]; periodStart: string; periodEnd: string; closedNote: string } }) {
  const open = data.open;
  const tags = data.sessions || [];
  return (
    <div style={{
      position: 'relative', border: '1px solid var(--border-subtle)', borderRadius: 12,
      background: 'var(--surface)', padding: '28px 30px', overflow: 'hidden',
    }}>
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: open ? 'var(--accent)' : 'var(--border)' }}></span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 260px' }}>
          <div className="kicker">{open ? (data.semester || '모집') : '모집 마감'}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 23, letterSpacing: '-0.02em', marginTop: 12, textWrap: 'pretty' }}>
            {open ? (data.headline || '—') : '다음 모집을 기다려주세요'}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 9, lineHeight: 1.65, textWrap: 'pretty' }}>
            {open ? data.body : data.closedNote}
          </div>
          {open && tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
              {tags.map((s: string) => (
                <span key={s} className="mono" style={{ fontSize: 10, letterSpacing: '0.04em', padding: '3px 9px', borderRadius: 5, color: 'var(--accent-hover)', border: '1px solid color-mix(in oklab, var(--accent) 40%, transparent)', background: 'var(--accent-muted)' }}>{s} 우대</span>
              ))}
            </div>
          )}
          {open && (data.periodStart || data.periodEnd) && (
            <div className="mono" style={{ fontSize: 11, color: 'var(--subtle-foreground)', marginTop: 13, letterSpacing: '0.04em' }}>
              모집 기간 {recMMDD(data.periodStart)} – {recMMDD(data.periodEnd)}
            </div>
          )}
        </div>
        <div style={{ flex: '0 0 auto' }}>
          {open ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '13px 24px', borderRadius: 9, background: '#FEE500', color: '#191600', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14.5, whiteSpace: 'nowrap' }}>
              <span className="ico"><svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.582 2 2 4.91 2 8.5c0 2.284 1.437 4.294 3.61 5.487L4.79 17.18a.25.25 0 0 0 .373.274L9.35 14.93c.216.018.434.028.65.028 4.418 0 8-2.91 8-6.5S14.418 2 10 2z" fill="#191600" /></svg></span>
              지원하기
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 9, border: '1px solid var(--border)', color: 'var(--subtle-foreground)', fontFamily: 'var(--font-sans)', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
              <Icons.lock size={15} />모집 마감
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RecruitSettings() {
  const init = React.useMemo(loadRecruit, []);
  const [open, setOpen] = useState(init.open);
  const [semester, setSemester] = useState(init.semester);
  const [headline, setHeadline] = useState(init.headline);
  const [body, setBody] = useState(init.body);
  const [sessions, setSessions] = useState(init.sessions || []);
  const [periodStart, setPeriodStart] = useState(init.periodStart);
  const [periodEnd, setPeriodEnd] = useState(init.periodEnd);
  const [closedNote, setClosedNote] = useState(init.closedNote);
  const [meta, setMeta] = useState({ updatedAt: init.updatedAt, updatedBy: init.updatedBy });
  const [saved, setSaved] = useState(false);

  const preview = { open, semester, headline, body, sessions, periodStart, periodEnd, closedNote };
  const toggleSession = (s: string) => setSessions((cur: string[]) => cur.includes(s) ? cur.filter((x: string) => x !== s) : [...cur, s]);

  const save = () => {
    const stamp = recNowStamp();
    const who = ME.nick || ME.name;
    const data = { ...preview, updatedAt: stamp, updatedBy: who };
    try { localStorage.setItem(RECRUIT_KEY, JSON.stringify(data)); } catch (e) {}
    setMeta({ updatedAt: stamp, updatedBy: who });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="admin-grid">
        {/* ─── EDIT COLUMN ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* status toggle */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                <span style={{ width: 42, height: 42, borderRadius: 10, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: open ? 'var(--accent-hover)' : 'var(--subtle-foreground)', background: open ? 'var(--accent-muted)' : 'var(--surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                  <Icons.megaphone size={21} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16, whiteSpace: 'nowrap' }}>랜딩 페이지 모집</span>
                    <UU.RecruitBadge recruiting={open} />
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--subtle-foreground)', marginTop: 5, lineHeight: 1.5, textWrap: 'pretty' }}>
                    {open ? '방문자에게 모집글과 지원 버튼이 노출됩니다' : '모집글이 마감 상태로 표시됩니다'}
                  </div>
                </div>
              </div>
              <RecSwitch on={open} onChange={setOpen} />
            </div>
          </div>

          {/* recruitment post fields */}
          <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--subtle-foreground)' }}>모집글</div>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 140px' }}>
                <RecField hint="시작">모집 기간</RecField>
                <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={recInput} />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <RecField hint="마감">&nbsp;</RecField>
                <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={recInput} />
              </div>
            </div>

            <div>
              <RecField hint="예: 2026-2학기 신입 모집">학기 라벨</RecField>
              <input value={semester} onChange={(e) => setSemester(e.target.value)} maxLength={40} placeholder="모집 라벨을 입력하세요" style={recInput} />
            </div>

            <div>
              <RecField hint="최대 40자 · 굵게 노출">모집 헤드라인</RecField>
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={40} placeholder="예: 보컬 · 건반 세션 우대" style={recInput} />
            </div>

            <div>
              <RecField hint="최대 200자">안내 문구</RecField>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={200} placeholder="지원 방법·일정 등을 안내하세요" style={{ ...recInput, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }} />
            </div>

            <div>
              <RecField hint="선택 · 여러 개 가능">우대 세션</RecField>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {REC_SESSIONS.map((s) => {
                  const on2 = sessions.includes(s);
                  return (
                    <button key={s} type="button" onClick={() => toggleSession(s)} className="mono" style={{
                      padding: '8px 15px', borderRadius: 20, fontSize: 12, letterSpacing: '0.02em', whiteSpace: 'nowrap', transition: 'all .14s',
                      border: `1px solid ${on2 ? 'var(--accent)' : 'var(--border)'}`,
                      background: on2 ? 'var(--accent-muted)' : 'transparent',
                      color: on2 ? 'var(--accent-hover)' : 'var(--muted-foreground)',
                      fontWeight: on2 ? 700 : 400,
                    }}>{s}</button>
                  );
                })}
              </div>
            </div>

            <div>
              <RecField hint="모집 마감 시 노출">마감 안내 문구</RecField>
              <textarea value={closedNote} onChange={(e) => setClosedNote(e.target.value)} rows={2} maxLength={200} placeholder="마감 상태일 때 보여줄 문구" style={{ ...recInput, resize: 'vertical', minHeight: 62, lineHeight: 1.6, opacity: open ? 0.6 : 1 }} />
            </div>
          </div>

          {/* save bar */}
          <div className="rec-savebar card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', boxShadow: '0 10px 30px rgba(0,0,0,0.28)' }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--subtle-foreground)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icons.clock size={13} />최근 수정 {meta.updatedAt} · {meta.updatedBy}
            </div>
            <button className="btn btn-primary" onClick={save} style={{ padding: '11px 22px', minWidth: 134, justifyContent: 'center' }}>
              {saved ? <><Icons.check size={16} />저장됨</> : '변경사항 저장'}
            </button>
          </div>
        </div>

        {/* ─── PREVIEW COLUMN ─── */}
        <div className="admin-preview">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--subtle-foreground)' }}>방문자 미리보기</span>
            <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}></span>
          </div>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden', background: 'var(--background)' }}>
            {/* faux browser chrome */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface)' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--border)' }}></span>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--border)' }}></span>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--border)' }}></span>
              <span className="mono" style={{ marginLeft: 8, fontSize: 10.5, color: 'var(--subtle-foreground)' }}>청림그룹사운드 · 랜딩 페이지</span>
            </div>
            <div style={{ padding: 18 }}>
              <RecruitPreview data={preview} />
            </div>
          </div>
          <p className="mono" style={{ margin: '14px 2px 0', fontSize: 11, color: 'var(--subtle-foreground)', lineHeight: 1.7, textWrap: 'pretty' }}>
            랜딩 페이지의 모집 영역이 위와 같이 표시됩니다. 저장 후 새로고침하면 실제 페이지에 반영돼요.
          </p>
        </div>
      </div>
  );
}

/* ─── 면접 가능 시간대 (운영진) — 등록 · 삭제 ─── */
const INTERVIEW_KEY = 'CHUNGLIM_interview_v1';
const INTERVIEW_DEFAULT = [
  { id: 'iv1', date: '2026-09-14', start: '18:00', end: '18:20', capacity: 1, booked: 1, note: '' },
  { id: 'iv2', date: '2026-09-14', start: '18:30', end: '18:50', capacity: 1, booked: 1, note: '' },
  { id: 'iv3', date: '2026-09-14', start: '19:00', end: '19:20', capacity: 1, booked: 0, note: '' },
  { id: 'iv4', date: '2026-09-15', start: '19:00', end: '19:30', capacity: 2, booked: 1, note: '그룹 면접' },
  { id: 'iv5', date: '2026-09-15', start: '19:30', end: '20:00', capacity: 2, booked: 0, note: '그룹 면접' },
];
function loadInterview() {
  try { const raw = localStorage.getItem(INTERVIEW_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  return INTERVIEW_DEFAULT.map((s) => ({ ...s }));
}
function saveInterview(list: InterviewSlot[]) { try { localStorage.setItem(INTERVIEW_KEY, JSON.stringify(list)); } catch (e) {} }
const IV_WD = ['일', '월', '화', '수', '목', '금', '토'];
function ivWeekday(iso: string) { const d = new Date(iso + 'T00:00:00'); return IV_WD[d.getDay()] || ''; }
function ivDur(start: string, end: string) { const [a, b] = start.split(':').map(Number); const [c, e] = end.split(':').map(Number); return (c * 60 + e) - (a * 60 + b); }
function ivAddMin(hhmm: string, mins: number) { const [h, m] = hhmm.split(':').map(Number); let t = ((h * 60 + m + mins) % 1440 + 1440) % 1440; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; }

function InterviewSchedule() {
  const [slots, setSlots] = useState(loadInterview);
  const [form, setForm] = useState({ date: '2026-09-14', start: '18:00', end: '18:20', capacity: 1, note: '' });
  const [err, setErr] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const setF = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));
  const persist = (next: InterviewSlot[]) => { setSlots(next); saveInterview(next); };

  const add = () => {
    if (!form.date || !form.start || !form.end) { setErr('날짜와 시작·종료 시간을 입력해 주세요.'); return; }
    if (form.end <= form.start) { setErr('종료 시간이 시작 시간보다 늦어야 해요.'); return; }
    const cap = Math.max(1, Number(form.capacity) || 1);
    const slot = { id: 'iv' + Date.now(), date: form.date, start: form.start, end: form.end, capacity: cap, booked: 0, note: (form.note || '').trim() };
    persist([...slots, slot]);
    setErr('');
    const dur = Math.max(10, ivDur(form.start, form.end));
    setForm((f) => ({ ...f, start: f.end, end: ivAddMin(f.end, dur), note: '' }));
  };
  const remove = (id: string) => { persist(slots.filter((s: InterviewSlot) => s.id !== id)); setConfirmId(null); };

  const groups = React.useMemo(() => {
    const sorted = [...slots].sort((a, b) => a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date));
    const out: SlotGroup[] = [];
    sorted.forEach((s) => { let g = out.find((x) => x.date === s.date); if (!g) { g = { date: s.date, items: [] }; out.push(g); } g.items.push(s); });
    return out;
  }, [slots]);

  const totalCap = slots.reduce((a: number, s: InterviewSlot) => a + s.capacity, 0);
  const totalBooked = slots.reduce((a: number, s: InterviewSlot) => a + s.booked, 0);
  const stepInput: React.CSSProperties = { ...recInput, width: 56, textAlign: 'center', padding: '10px 4px' };
  const stepBtn: React.CSSProperties = { width: 38, height: 42, borderRadius: 8, border: '1px solid var(--border)', color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, lineHeight: 1, flex: '0 0 auto', background: 'var(--surface)' };

  return (
    <div className="admin-grid">
      {/* ─── LIST COLUMN ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="card" style={{ padding: 4, display: 'flex' }}>
          {[['등록 시간대', slots.length + '개'], ['총 정원', totalCap + '명'], ['예약 신청', totalBooked + '명']].map(([l, v], i) => (
            <div key={l} style={{ flex: 1, padding: '15px 18px', borderLeft: i ? '1px solid var(--border-subtle)' : 'none' }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--subtle-foreground)' }}>{l}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 23, marginTop: 6, letterSpacing: '-0.02em' }}>{v}</div>
            </div>
          ))}
        </div>

        {groups.length === 0 ? (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center', border: '1px dashed var(--border)', background: 'transparent' }}>
            <div style={{ display: 'inline-flex', width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', color: 'var(--subtle-foreground)', border: '1px solid var(--border-subtle)' }}><Icons.calendar size={22} /></div>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16, marginTop: 14 }}>등록된 면접 시간대가 없어요</div>
            <div className="mono" style={{ fontSize: 11.5, color: 'var(--subtle-foreground)', marginTop: 7 }}>오른쪽 패널에서 첫 시간대를 추가해 주세요</div>
          </div>
        ) : groups.map((g, gi) => {
          const [yy, mm, dd] = g.date.split('-');
          return (
            <div key={g.date}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 11, marginTop: gi ? 6 : 0 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>{mm}.{dd}</span>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--subtle-foreground)' }}>({ivWeekday(g.date)}요일) · {g.items.length}개 시간대</span>
                <span style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }}></span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {g.items.map((s) => {
                  const full = s.booked >= s.capacity;
                  const dur = ivDur(s.start, s.end);
                  return (
                    <div key={s.id} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ flex: '0 0 auto', minWidth: 100 }}>
                        <div className="mono" style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>{s.start}<span style={{ color: 'var(--subtle-foreground)', margin: '0 3px' }}>–</span>{s.end}</div>
                        <div className="mono" style={{ fontSize: 10.5, color: 'var(--subtle-foreground)', marginTop: 3 }}>{dur}분</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                        {s.note ? <span style={{ fontSize: 12.5, color: 'var(--muted-foreground)', textWrap: 'pretty' }}>{s.note}</span> : <span className="mono" style={{ fontSize: 11.5, color: 'var(--subtle-foreground)' }}>개별 면접</span>}
                      </div>
                      <div style={{ flex: '0 0 auto', textAlign: 'right', minWidth: 54 }}>
                        <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: full ? 'var(--subtle-foreground)' : 'var(--accent-hover)' }}>{s.booked}/{s.capacity}</div>
                        <div className="mono" style={{ fontSize: 10, color: full ? 'var(--subtle-foreground)' : 'var(--muted-foreground)', marginTop: 2 }}>{full ? '마감' : `${s.capacity - s.booked}자리`}</div>
                      </div>
                      {confirmId === s.id ? (
                        <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
                          <button onClick={() => remove(s.id)} className="mono" style={{ fontSize: 11.5, fontWeight: 700, padding: '7px 11px', borderRadius: 6, background: 'rgba(224,122,95,0.15)', color: '#E58C75', border: '1px solid rgba(224,122,95,0.34)' }}>삭제</button>
                          <button onClick={() => setConfirmId(null)} className="mono" style={{ fontSize: 11.5, padding: '7px 11px', borderRadius: 6, color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>취소</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmId(s.id)} aria-label="시간대 삭제" title="삭제" style={{ flex: '0 0 auto', width: 34, height: 34, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--subtle-foreground)', border: '1px solid var(--border-subtle)', transition: 'all .14s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#E58C75'; e.currentTarget.style.borderColor = 'rgba(224,122,95,0.4)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--subtle-foreground)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
                          <Icons.trash size={15} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── ADD PANEL ─── */}
      <div className="admin-preview">
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span style={{ width: 40, height: 40, borderRadius: 10, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-hover)', background: 'var(--accent-muted)', border: '1px solid var(--border-subtle)' }}><Icons.plus size={19} /></span>
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15.5 }}>면접 시간대 추가</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--subtle-foreground)', marginTop: 3 }}>지원자가 예약할 슬롯을 만들어요</div>
            </div>
          </div>
          <hr className="rule" />
          <div>
            <RecField hint="면접 진행일">날짜</RecField>
            <input type="date" value={form.date} onChange={(e) => setF('date', e.target.value)} style={recInput} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <RecField hint="시작">시간</RecField>
              <input type="time" step={300} value={form.start} onChange={(e) => setF('start', e.target.value)} style={recInput} />
            </div>
            <div style={{ flex: 1 }}>
              <RecField hint="종료">&nbsp;</RecField>
              <input type="time" step={300} value={form.end} onChange={(e) => setF('end', e.target.value)} style={recInput} />
            </div>
          </div>
          <div>
            <RecField hint="이 시간대 면접 인원">정원</RecField>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <button type="button" aria-label="정원 감소" onClick={() => setF('capacity', Math.max(1, (Number(form.capacity) || 1) - 1))} style={stepBtn}>−</button>
              <input type="number" min={1} max={20} value={form.capacity} onChange={(e) => setF('capacity', e.target.value)} style={stepInput} />
              <button type="button" aria-label="정원 증가" onClick={() => setF('capacity', Math.min(20, (Number(form.capacity) || 1) + 1))} style={stepBtn}>+</button>
              <span className="mono" style={{ fontSize: 12, color: 'var(--subtle-foreground)' }}>명</span>
            </div>
          </div>
          <div>
            <RecField hint="선택 · 최대 30자">메모</RecField>
            <input value={form.note} onChange={(e) => setF('note', e.target.value)} maxLength={30} placeholder="예: 그룹 면접 / 악기 지참" style={recInput} />
          </div>
          {err && <div className="mono" style={{ fontSize: 11.5, color: '#E58C75', lineHeight: 1.5 }}>{err}</div>}
          <button className="btn btn-primary" onClick={add} style={{ justifyContent: 'center', padding: '12px' }}><Icons.plus size={16} />시간대 추가</button>
        </div>
        <p className="mono" style={{ margin: '14px 2px 0', fontSize: 11, color: 'var(--subtle-foreground)', lineHeight: 1.7, textWrap: 'pretty' }}>
          추가한 시간대는 지원자의 면접 예약 화면에 노출됩니다. 정원이 차면 자동으로 마감 처리돼요.
        </p>
      </div>
    </div>
  );
}

/* ─── 지원자 관리 (운영진) — 신청서 확인 · 면접 확정 · 합/불합격 · 통지 ─── */
const APPLICANTS_KEY = 'CHUNGLIM_applicants_v2';
const APPLICANTS_DEFAULT = [
  { id: 'ap1', name: '김도윤', dept: '경영학과 21', contact: '010-2345-6789', kakao: 'doyoon_k', sessions: ['보컰'], exp: '고교 밴드부 보컰 2년', message: '무대에서 노래할 때가 가장 행복합니다. 인디록부터 발라드까지 폭넓게 소화할 수 있어요. 꿂 함께하고 싶습니다.', appliedAt: '2026.09.10 21:14', preferredSlotIds: ['iv1', 'iv3'], status: 'new', slotId: null, notified: false },
  { id: 'ap2', name: '이서진', dept: '컴퓨터공학과 22', contact: '010-3456-7890', kakao: 'seojin.lee', sessions: ['기타', '베이스'], exp: '독학 4년 · 합주 경험 다수', message: '펀크록과 모던록을 좋아합니다. 리듬·리드 기타 모두 가능하고 베이스도 칠 수 있어요. 합주라면 자신 있습니다!', appliedAt: '2026.09.11 14:02', preferredSlotIds: ['iv4', 'iv5'], status: 'interview', slotId: 'iv4', notified: false },
  { id: 'ap3', name: '박하늘', dept: '실용음악과 21', contact: '010-4567-8901', kakao: 'haneul_drum', sessions: ['드럼'], exp: '밴드 활동 3년', message: '드럼 하나는 정말 자신 있습니다. 정기공연 무대에 꿂 서고 싶어서 지원했어요.', appliedAt: '2026.09.09 19:30', preferredSlotIds: ['iv1', 'iv2'], status: 'pass', slotId: 'iv1', notified: true, notifiedAt: '2026.09.13 11:20' },
  { id: 'ap4', name: '최유나', dept: '영어영문학과 23', contact: '010-5678-9012', kakao: 'yuna_c', sessions: ['건반', '보컰'], exp: '피아노 10년 · 밴드 첫 도전', message: '클래식 피아노를 오래 쳤고 밴드 건반에 도전해보고 싶습니다. 코러스도 가능해요!', appliedAt: '2026.09.11 22:48', preferredSlotIds: ['iv3', 'iv5'], status: 'new', slotId: null, notified: false },
  { id: 'ap5', name: '정민호', dept: '기계공학과 20', contact: '010-6789-0123', kakao: 'minho_j', sessions: ['기타'], exp: '취미 1년', message: '실력은 아직 부족하지만 열정만큼은 누구에게도 지지 않습니다. 열심히 배우겠습니다.', appliedAt: '2026.09.08 16:10', preferredSlotIds: ['iv3'], status: 'fail', slotId: null, notified: false },
];
function loadApplicants() { try { const raw = localStorage.getItem(APPLICANTS_KEY); if (raw) return JSON.parse(raw); } catch (e) {} return APPLICANTS_DEFAULT.map((a) => ({ ...a })); }
function saveApplicants(list: Applicant[]) { try { localStorage.setItem(APPLICANTS_KEY, JSON.stringify(list)); } catch (e) {} }
const AP_FILTERS: [string, string][] = [['all', '전체'], ['new', '서류 확인'], ['interview', '면접 예정'], ['pass', '합격'], ['fail', '불합격']];
function apSlotText(s: InterviewSlot | undefined) { return s ? `${s.date.slice(5).replace('-', '.')} (${ivWeekday(s.date)}) ${s.start}–${s.end}` : ''; }
function apPassMsg(a: Applicant) { return `${a.name}님, 청림그룹사운드 신입 면접에 합격하셨습니다! 함께 무대를 만들어가게 되어 기쇁니다. 첫 모임 일정은 개별 안내드릴게요.`; }
function apFailMsg(a: Applicant) { return `${a.name}님, 소중한 지원에 진심으로 감사드립니다. 아쉬운 마음이지만 이번 모집에서는 함께하지 못하게 되었어요. 다음 기회에 다시 만나뷕기를 바랍니다.`; }

function ApStatusTag({ s, size }: { s: string; size?: string }) {
  const fs = size === 'lg' ? 11 : 10.5;
  if (s === 'new') return <span className="badge" style={{ fontSize: fs }}>서류 확인</span>;
  if (s === 'interview') return <span className="badge badge-accent" style={{ fontSize: fs }}><span className="dot" style={{ background: 'var(--accent)' }}></span>면접 예정</span>;
  if (s === 'pass') return <span className="badge badge-live" style={{ fontSize: fs }}><span className="dot dot-live"></span>합격</span>;
  if (s === 'fail') return <span className="badge" style={{ fontSize: fs, color: '#E58C75', borderColor: 'rgba(224,122,95,0.32)', background: 'rgba(224,122,95,0.09)' }}>불합격</span>;
  return null;
}
function ApChips({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {items.map((x) => <span key={x} className="mono" style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>{x}</span>)}
    </div>
  );
}
function ApRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
      <span className="mono" style={{ fontSize: 11, color: 'var(--subtle-foreground)', flex: '0 0 60px' }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function ApplicantManager() {
  const [apps, setApps] = useState(loadApplicants);
  const [slots, setSlots] = useState(loadInterview);
  const [filter, setFilter] = useState('all');
  const [selId, setSelId] = useState<string | null>(() => { const a = loadApplicants(); return a[0] ? a[0].id : null; });
  const [picking, setPicking] = useState(false);
  const [toast, setToast] = useState('');

  const persistApps = (next: Applicant[]) => { setApps(next); saveApplicants(next); };
  const persistSlots = (next: InterviewSlot[]) => { setSlots(next); saveInterview(next); };
  const update = (id: string, patch: Partial<Applicant>) => persistApps(apps.map((a: Applicant) => a.id === id ? { ...a, ...patch } : a));

  const sel = apps.find((a: Applicant) => a.id === selId) || null;
  const list = filter === 'all' ? apps : apps.filter((a: Applicant) => a.status === filter);
  const countOf = (k: string) => k === 'all' ? apps.length : apps.filter((a: Applicant) => a.status === k).length;
  const slotById = (id: string) => slots.find((s: InterviewSlot) => s.id === id);
  const prefOf = (a: Applicant | null): InterviewSlot[] => (a && a.preferredSlotIds ? (a.preferredSlotIds.map(slotById).filter(Boolean) as InterviewSlot[]) : []);
  React.useEffect(() => { if (!localStorage.getItem(APPLICANTS_KEY)) saveApplicants(APPLICANTS_DEFAULT); }, []);

  const assignSlot = (slotId: string) => {
    const sl = slotById(slotId); if (!sl || sl.booked >= sl.capacity) return;
    persistSlots(slots.map((s: InterviewSlot) => s.id === slotId ? { ...s, booked: s.booked + 1 } : s));
    if (sel) update(sel.id, { status: 'interview', slotId });
    setPicking(false);
  };
  const releaseSlot = (slotId: string) => { const sl = slotById(slotId); if (sl) persistSlots(slots.map((s: InterviewSlot) => s.id === slotId ? { ...s, booked: Math.max(0, s.booked - 1) } : s)); };
  const cancelInterview = () => { if (!sel) return; if (sel.slotId) releaseSlot(sel.slotId); update(sel.id, { status: 'new', slotId: null }); setPicking(false); };
  const decide = (res: string) => { if (sel) update(sel.id, { status: res, notified: false }); };
  const revertDecision = () => { if (sel) update(sel.id, { status: sel.slotId ? 'interview' : 'new', notified: false }); };
  const notify = () => { if (!sel) return; update(sel.id, { notified: true, notifiedAt: recNowStamp() }); setToast('지원자에게 결과를 통지했어요'); setTimeout(() => setToast(''), 2400); };
  const unnotify = () => { if (sel) update(sel.id, { notified: false, notifiedAt: null }); };

  const primaryBtn = { padding: '11px 16px', justifyContent: 'center' };
  const dangerBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, padding: '11px 16px', borderRadius: 5, border: '1px solid rgba(224,122,95,0.34)', color: '#E58C75', background: 'rgba(224,122,95,0.08)', transition: 'all .15s' };

  return (
    <div className="admin-grid">
      {/* ─── LIST ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {AP_FILTERS.map(([k, l]) => { const on = filter === k; return (
            <button key={k} onClick={() => setFilter(k)} className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, padding: '7px 13px', borderRadius: 20, border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-muted)' : 'transparent', color: on ? 'var(--accent-hover)' : 'var(--muted-foreground)', transition: 'all .14s' }}>
              {l}<span style={{ fontSize: 10.5, opacity: 0.8 }}>{countOf(k)}</span>
            </button>
          ); })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {list.length === 0 ? (
            <div className="card" style={{ padding: '40px 24px', textAlign: 'center', border: '1px dashed var(--border)', background: 'transparent' }}>
              <div className="mono" style={{ fontSize: 12, color: 'var(--subtle-foreground)' }}>해당 상태의 지원자가 없어요</div>
            </div>
          ) : list.map((a: Applicant) => { const on = a.id === selId; return (
            <button key={a.id} onClick={() => { setSelId(a.id); setPicking(false); }} className="card" style={{ textAlign: 'left', padding: '15px 16px', display: 'flex', alignItems: 'center', gap: 14, borderColor: on ? 'var(--accent)' : 'var(--border-subtle)', background: on ? 'var(--surface-elevated)' : 'var(--surface)' }}>
              <span className="avatar" style={{ width: 42, height: 42, fontSize: 15 }}>{a.name[0]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15 }}>{a.name}</span>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--subtle-foreground)' }}>{a.dept}</span>
                </div>
                <div style={{ marginTop: 8 }}><ApChips items={a.sessions} /></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flex: '0 0 auto' }}>
                <ApStatusTag s={a.status} />
                {a.notified && <span className="mono" style={{ fontSize: 9.5, color: 'var(--subtle-foreground)', display: 'flex', alignItems: 'center', gap: 3 }}><Icons.check size={11} />통지됨</span>}
              </div>
            </button>
          ); })}
        </div>
      </div>

      {/* ─── DETAIL ─── */}
      <div className="admin-preview">
        {!sel ? (
          <div className="card" style={{ padding: '46px 24px', textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 12, color: 'var(--subtle-foreground)' }}>지원자를 선택하세요</div>
          </div>
        ) : (
          <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <span className="avatar" style={{ width: 50, height: 50, fontSize: 18 }}>{sel.name[0]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 19 }}>{sel.name}</span>
                  <ApStatusTag s={sel.status} size="lg" />
                </div>
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--subtle-foreground)', marginTop: 4 }}>{sel.dept} · 지원 {sel.appliedAt}</div>
              </div>
            </div>
            <hr className="rule" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <ApRow label="지원 세션"><ApChips items={sel.sessions} /></ApRow>
              <ApRow label="경력"><span style={{ fontSize: 13, color: 'var(--foreground)' }}>{sel.exp}</span></ApRow>
              <ApRow label="연락처"><span className="mono" style={{ fontSize: 12 }}>{sel.contact} · 카톡 {sel.kakao}</span></ApRow>
            </div>

            <div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--subtle-foreground)', marginBottom: 8 }}>지원 동기</div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted-foreground)', padding: '13px 15px', borderRadius: 8, background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)', textWrap: 'pretty' }}>{sel.message}</div>
            </div>

            {sel.slotId && slotById(sel.slotId) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: 8, border: '1px solid color-mix(in oklab, var(--accent) 30%, transparent)', background: 'var(--accent-muted)' }}>
                <span style={{ color: 'var(--accent-hover)', flex: '0 0 auto' }}><Icons.calendar size={17} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--subtle-foreground)' }}>확정된 면접 일정</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, marginTop: 3 }}>{apSlotText(slotById(sel.slotId))}</div>
                </div>
              </div>
            )}

            {sel.status !== 'new' && prefOf(sel).length > 0 && (
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--subtle-foreground)', lineHeight: 1.7 }}>지원자 희망 — {prefOf(sel).map(apSlotText).join(' / ')}</div>
            )}

            <hr className="rule" />

            {sel.status === 'new' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--subtle-foreground)' }}>희망 면접 시간대 · 하나를 선택해 확정</div>
                {prefOf(sel).length === 0 ? (
                  <div className="mono" style={{ fontSize: 11.5, color: 'var(--subtle-foreground)', lineHeight: 1.6 }}>지원자가 희망 면접 시간대를 선택하지 않았어요.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {prefOf(sel).map((s) => { const full = s.booked >= s.capacity; return (
                      <button key={s.id} disabled={full} onClick={() => assignSlot(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', textAlign: 'left', opacity: full ? 0.5 : 1, cursor: full ? 'not-allowed' : 'pointer', transition: 'all .14s' }}
                        onMouseEnter={(e) => { if (!full) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-muted)'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}>
                        <span style={{ color: full ? 'var(--subtle-foreground)' : 'var(--accent-hover)', flex: '0 0 auto' }}><Icons.calendar size={15} /></span>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{apSlotText(s)}</span>
                        <span style={{ flex: 1 }}></span>
                        <span className="mono" style={{ fontSize: 10.5, color: full ? 'var(--subtle-foreground)' : 'var(--muted-foreground)' }}>{full ? '마감' : `${s.capacity - s.booked}자리`}</span>
                      </button>
                    ); })}
                  </div>
                )}
                <button onClick={() => decide('fail')} style={{ ...dangerBtn, marginTop: 3 }}>불합격 처리</button>
              </div>
            )}

            {sel.status === 'interview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" onClick={() => decide('pass')} style={{ ...primaryBtn, flex: 1 }}><Icons.check size={16} />합격</button>
                  <button onClick={() => decide('fail')} style={{ ...dangerBtn, flex: 1 }}>불합격</button>
                </div>
                <button onClick={cancelInterview} className="mono" style={{ fontSize: 11.5, color: 'var(--subtle-foreground)', padding: '6px', textAlign: 'center' }}>면접 일정 배정 취소</button>
              </div>
            )}

            {(sel.status === 'pass' || sel.status === 'fail') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: '13px 15px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-elevated)' }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--subtle-foreground)', marginBottom: 7 }}>통지 메시지 미리보기</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--muted-foreground)', textWrap: 'pretty' }}>{sel.status === 'pass' ? apPassMsg(sel) : apFailMsg(sel)}</div>
                </div>
                {sel.notified ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: 11.5, color: '#7FD8A8', display: 'flex', alignItems: 'center', gap: 6 }}><Icons.check size={14} />{sel.notifiedAt} 통지 완료</span>
                    <button onClick={unnotify} className="mono" style={{ fontSize: 11, color: 'var(--subtle-foreground)' }}>통지 취소</button>
                  </div>
                ) : (
                  <button className="btn btn-primary" onClick={notify} style={primaryBtn}><Icons.bell size={16} />{sel.status === 'pass' ? '합격' : '불합격'} 결과 통지하기</button>
                )}
                <button onClick={revertDecision} className="mono" style={{ fontSize: 11.5, color: 'var(--subtle-foreground)', padding: '6px', textAlign: 'center' }}>결정 취소</button>
              </div>
            )}

            {toast && <div className="mono" style={{ fontSize: 11.5, color: '#7FD8A8', display: 'flex', alignItems: 'center', gap: 6 }}><Icons.check size={14} />{toast}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── 팀 활성화 관리 (운영진) ─────────────
   팀장이 보낸 활성화 신청을 수락/거절하고, 전체 팀의 활성 상태를 일괄 관리. */
function TeamActivationManager() {
  useTeamStore();
  const teams = D.TEAMS;
  const teamById = (id: string) => teams.find((t) => t.id === id);
  const pending = TeamStore.pending();
  const activeCount = teams.filter((t) => t.active).length;

  const [selReq, setSelReq] = useState<Set<string>>(() => new Set());
  const [selTeam, setSelTeam] = useState<Set<string>>(() => new Set());

  const pendingIds = pending.map((r) => r.id);
  const reqAllOn = pendingIds.length > 0 && pendingIds.every((id) => selReq.has(id));
  const toggleReq = (id: string) => setSelReq((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleReqAll = () => setSelReq(reqAllOn ? new Set<string>() : new Set(pendingIds));
  const selReqIds = pendingIds.filter((id) => selReq.has(id));

  const teamAllOn = teams.length > 0 && teams.every((t) => selTeam.has(t.id));
  const toggleTeam = (id: string) => setSelTeam((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleTeamAll = () => setSelTeam(teamAllOn ? new Set() : new Set(teams.map((t) => t.id)));
  const selTeamArr = [...selTeam];

  const Check = ({ on, onClick }: { on: boolean; onClick: (e: React.MouseEvent) => void }) => (
    <div role="checkbox" aria-checked={on} onClick={onClick} style={{
      width: 20, height: 20, borderRadius: 6, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent)' : 'transparent',
      color: on ? 'var(--accent-foreground)' : 'transparent', transition: 'all .12s', cursor: 'pointer',
    }}><Icons.check size={13} /></div>
  );

  const sessionSummary = (t: { sessions: Record<string, number> }) => Object.entries(t.sessions).map(([s, n]) => `${s} ${n}`).join(' · ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>

      {/* ── 활성화 신청 대기 ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 18 }}>활성화 신청</h2>
            <span className="mono" style={{ fontSize: 12, color: pending.length ? 'var(--accent-hover)' : 'var(--subtle-foreground)' }}>{pending.length}건 대기</span>
          </div>
          {pending.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn mono" onClick={toggleReqAll} style={{ fontSize: 12, padding: '7px 13px' }}>
                <Check on={reqAllOn} onClick={(e) => { e.stopPropagation(); toggleReqAll(); }} />{reqAllOn ? '전체 해제' : '전체 선택'}
              </button>
              <button className="btn" disabled={!selReqIds.length} onClick={() => { TeamStore.rejectMany(selReqIds); setSelReq(new Set()); }}
                style={{ fontSize: 12.5, padding: '7px 13px', opacity: selReqIds.length ? 1 : 0.4, borderColor: selReqIds.length ? 'rgba(224,138,138,0.4)' : 'var(--border)', color: selReqIds.length ? '#E08A8A' : 'var(--muted-foreground)' }}>
                선택 거절
              </button>
              <button className="btn btn-primary" disabled={!selReqIds.length} onClick={() => { TeamStore.approveMany(selReqIds.length ? selReqIds : pendingIds); setSelReq(new Set()); }}
                style={{ fontSize: 12.5, padding: '7px 14px', opacity: 1 }}>
                <Icons.check size={14} />{selReqIds.length ? `선택 ${selReqIds.length}건 수락` : '전체 수락'}
              </button>
            </div>
          )}
        </div>

        {pending.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '20px 22px', borderRadius: 12, border: '1px dashed var(--border)', color: 'var(--subtle-foreground)' }}>
            <Icons.check size={17} /><span style={{ fontSize: 13.5 }}>대기 중인 활성화 신청이 없습니다.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map((r) => {
              const t = teamById(r.teamId); if (!t) return null;
              const on = selReq.has(r.id);
              return (
                <div key={r.id} style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${on ? UU.hexA(t.hue, 0.5) : 'var(--border-subtle)'}`, background: on ? UU.hexA(t.hue, 0.06) : 'var(--surface)', transition: 'all .14s' }}>
                  <div style={{ height: 3, background: t.hue }}></div>
                  <div style={{ padding: '16px 18px', display: 'flex', gap: 14 }}>
                    <div style={{ paddingTop: 2 }}><Check on={on} onClick={() => toggleReq(r.id)} /></div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>{t.name}</span>
                            <span className="mono" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, color: t.hue, background: UU.hexA(t.hue, 0.1), border: `1px solid ${UU.hexA(t.hue, 0.28)}` }}>비활성</span>
                          </div>
                          <div className="mono" style={{ fontSize: 11, color: 'var(--subtle-foreground)', marginTop: 5 }}>{r.role} {r.by} · {t.members}명 · {sessionSummary(t)}</div>
                        </div>
                        <span className="mono" style={{ fontSize: 10.5, color: 'var(--subtle-foreground)', flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 5 }}><Icons.clock size={12} />{r.at}</span>
                      </div>
                      {r.note && <p style={{ margin: 0, fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.65, padding: '11px 13px', borderRadius: 9, background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)' }}>{r.note}</p>}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" style={{ padding: '7px 15px', fontSize: 12.5 }} onClick={() => TeamStore.approve(r.id)}><Icons.check size={14} />수락 · 활성화</button>
                        <button className="btn" style={{ padding: '7px 15px', fontSize: 12.5, borderColor: 'rgba(224,138,138,0.4)', color: '#E08A8A' }} onClick={() => TeamStore.reject(r.id)}>거절</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 전체 팀 일괄 관리 ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 18 }}>전체 팀</h2>
            <span className="mono" style={{ fontSize: 12, color: 'var(--subtle-foreground)' }}>{activeCount} / {teams.length} 활성</span>
          </div>
          <button className="btn mono" onClick={toggleTeamAll} style={{ fontSize: 12, padding: '7px 13px' }}>
            <Check on={teamAllOn} onClick={(e) => { e.stopPropagation(); toggleTeamAll(); }} />{teamAllOn ? '전체 해제' : '전체 선택'}
          </button>
        </div>

        {/* 일괄 액션 바 */}
        {selTeamArr.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 11, background: 'var(--accent-muted)', border: '1px solid color-mix(in oklab, var(--accent) 35%, transparent)', flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 12, color: 'var(--accent-hover)', fontWeight: 700 }}>{selTeamArr.length}개 팀 선택됨</span>
            <div style={{ flex: 1 }}></div>
            <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 12.5 }} onClick={() => { TeamStore.setActiveMany(selTeamArr, true); setSelTeam(new Set()); }}><Icons.spark size={14} />일괄 활성화</button>
            <button className="btn" style={{ padding: '7px 14px', fontSize: 12.5, borderColor: 'rgba(224,138,138,0.4)', color: '#E08A8A' }} onClick={() => { TeamStore.setActiveMany(selTeamArr, false); setSelTeam(new Set()); }}><Icons.pause size={14} />일괄 비활성화</button>
            <button className="btn mono" style={{ padding: '7px 12px', fontSize: 11.5 }} onClick={() => setSelTeam(new Set())}>선택 해제</button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {teams.map((t) => {
            const on = selTeam.has(t.id);
            const req = TeamStore.pendingFor(t.id);
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 11, background: on ? UU.hexA(t.hue, 0.07) : 'var(--surface)', border: `1px solid ${on ? UU.hexA(t.hue, 0.45) : 'var(--border-subtle)'}`, transition: 'all .14s' }}>
                <Check on={on} onClick={() => toggleTeam(t.id)} />
                <span style={{ width: 4, height: 30, borderRadius: 2, background: t.hue, flex: '0 0 auto' }}></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                    {req && <span className="mono" style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 4, color: 'var(--accent-hover)', background: 'var(--accent-muted)', border: '1px solid color-mix(in oklab, var(--accent) 35%, transparent)' }}>신청 대기</span>}
                  </div>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--subtle-foreground)', marginTop: 3 }}>팀장 {t.leader} · {t.members}명</div>
                </div>
                <span className="mono" style={{ fontSize: 10.5, padding: '4px 10px', borderRadius: 5, flex: '0 0 auto', whiteSpace: 'nowrap',
                  color: t.active ? '#7FD8A8' : 'var(--subtle-foreground)', background: t.active ? 'rgba(127,216,168,0.08)' : 'var(--surface-elevated)', border: `1px solid ${t.active ? 'rgba(127,216,168,0.3)' : 'var(--border-subtle)'}` }}>
                  {t.active ? '활성' : '비활성'}
                </span>
                {t.active ? (
                  <button className="btn" style={{ padding: '6px 13px', fontSize: 12, flex: '0 0 auto' }} onClick={() => TeamStore.setActive(t.id, false)}><Icons.pause size={13} />비활성화</button>
                ) : (
                  <button className="btn btn-primary" style={{ padding: '6px 13px', fontSize: 12, flex: '0 0 auto' }} onClick={() => TeamStore.setActive(t.id, true)}><Icons.check size={13} />활성화</button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ═════════════ 타임테이블 운영 설정 (학기·방학 · 행사 기간) ═════════════ */
const TT_TERMS_KEY = TTShared.KEYS.terms;
const TT_EVENTS_KEY = TTShared.KEYS.events;
const TT_HOURS_KEY = TTShared.KEYS.hours;
const TT_TODAY = TTShared.TT_TODAY;          // 데모 기준일 (앱 내부 달력: 금요일)
const TT_ANCHOR_MON = TTShared.TT_ANCHOR_MON; // 앱 내부 달력의 월요일 기준점

// 기본값은 부원 타임테이블과 공유 (TTShared) — 운영자가 저장하면 양쪽 모두 동일 데이터를 읽음
const TT_TERMS_DEFAULT = TTShared.TERMS_DEFAULT;
const TT_EVENTS_DEFAULT = TTShared.EVENTS_DEFAULT;
const TT_HOURS_DEFAULT = TTShared.HOURS_DEFAULT;

function ttLoad<T>(key: string, def: T): T { try{ const r = localStorage.getItem(key); if(r) return JSON.parse(r); }catch(e){} return def; }
function ttSave(key: string, v: unknown){ try{ localStorage.setItem(key, JSON.stringify(v)); }catch(e){} }
function ttFmt(iso: string){ if(!iso) return '—'; const p = iso.split('-'); return p.length===3 ? `${p[0]}.${p[1]}.${p[2]}` : iso; }
function ttFmtShort(iso: string){ if(!iso) return '—'; const p = iso.split('-'); return p.length===3 ? `${p[1]}.${p[2]}` : iso; }
function ttHHMM(h: number){ return String(h).padStart(2,'0') + ':00'; }
function ttWeekday(iso: string){ if(!iso) return ''; const a = new Date(TT_ANCHOR_MON+'T00:00'), d = new Date(iso+'T00:00'); let n = Math.round((d.getTime()-a.getTime())/86400000) % 7; if(n<0) n+=7; return ['월','화','수','목','금','토','일'][n]; }
function ttDays(a: string, b: string){ const d1 = new Date(a+'T00:00'), d2 = new Date(b+'T00:00'); return Math.round((d2.getTime()-d1.getTime())/86400000) + 1; }
function ttActiveTerm(terms: TtTerm[]){ return terms.find(t => TT_TODAY >= t.start && TT_TODAY <= t.end) || null; }
function ttTimeText(e: TtEvent){ return e.allDay ? '온종일' : `${ttHHMM(e.startTime)}–${ttHHMM(e.endTime)}`; }
function ttEventStatus(e: TtEvent){
  if(TT_TODAY < e.start){ const d = ttDays(TT_TODAY, e.start) - 1; return { label: d===0?'내일':`D-${d}`, tone:'soon' }; }
  if(TT_TODAY > e.end) return { label:'종료', tone:'past' };
  return { label:'진행 중', tone:'now' };
}

function TtSeg({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }){
  return (
    <div style={{ display:'flex', gap:8 }}>
      {options.map(([v, l]) => {
        const on = value === v;
        return (
          <button key={v} type="button" onClick={() => onChange(v)} style={{
            flex:1, padding:'10px 12px', borderRadius:8, cursor:'pointer',
            border:`1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
            background: on ? 'var(--accent-muted)' : 'var(--surface)',
            color: on ? 'var(--accent-hover)' : 'var(--muted-foreground)',
            fontFamily:'var(--font-sans)', fontWeight: on ? 700 : 500, fontSize:13, transition:'all .14s',
          }}>{l}</button>
        );
      })}
    </div>
  );
}

function TtHourSelect({ value, onChange, min=6, max=24 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }){
  const opts = []; for(let h=min; h<=max; h++) opts.push(h);
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))} style={{
      ...recInput, width:'auto', minWidth:96, padding:'9px 12px', cursor:'pointer',
    }}>
      {opts.map(h => <option key={h} value={h}>{ttHHMM(h)}</option>)}
    </select>
  );
}

/* 운영시간 한 모드(학기중/방학중) 편집 블록 */
function TtHoursBlock({ Ic, title, hint, h, onChange }: { Ic: IconComp; title: string; hint: string; h: Record<string, number>; onChange: (key: string, val: number) => void }){
  const rows = [['weekday', '평일', 'weekdayOpen', 'weekdayClose'], ['weekend', '주말', 'weekendOpen', 'weekendClose']];
  return (
    <div style={{ flex:'1 1 300px', minWidth:0, border:'1px solid var(--border-subtle)', borderRadius:11, padding:'18px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:16 }}>
        <span style={{ width:38, height:38, borderRadius:9, flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-hover)', background:'var(--accent-muted)', border:'1px solid var(--border-subtle)' }}><Ic size={18} /></span>
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15 }}>{title}</div>
          <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:2 }}>{hint}</div>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
        {rows.map(([rk, rl, ok, ck]) => (
          <div key={rk} style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span className="mono" style={{ fontSize:12, color:'var(--muted-foreground)', flex:'0 0 38px' }}>{rl}</span>
            <TtHourSelect value={h[ok]} onChange={(v) => onChange(ok, v)} />
            <span style={{ color:'var(--subtle-foreground)' }}>–</span>
            <TtHourSelect value={h[ck]} onChange={(v) => onChange(ck, v)} />
            <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)' }}>{Math.max(0, h[ck]-h[ok])}시간 운영</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 학기 · 방학 설정 ─── */
function TermSettings(){
  const [terms, setTerms] = useState<TtTerm[]>(() => ttLoad(TT_TERMS_KEY, TT_TERMS_DEFAULT.map(t => ({ ...t }))));
  const [hours, setHours] = useState(() => ttLoad(TT_HOURS_KEY, JSON.parse(JSON.stringify(TT_HOURS_DEFAULT))));
  const [form, setForm] = useState<{ type: 'semester' | 'vacation'; label: string; start: string; end: string; bookOpenDate: string; bookOpenTime: string }>({ type:'semester', label:'', start:'', end:'', bookOpenDate:'', bookOpenTime:'' });
  const [editId, setEditId] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const persistTerms = (list: TtTerm[]) => { setTerms(list); ttSave(TT_TERMS_KEY, list); };
  const setHourVal = (mode: string, key: string, val: number) => {
    const next = { ...hours, [mode]: { ...hours[mode], [key]: val } };
    setHours(next); ttSave(TT_HOURS_KEY, next);
  };
  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v } as typeof f));
  const resetForm = () => { setForm({ type:'semester', label:'', start:'', end:'', bookOpenDate:'', bookOpenTime:'' }); setEditId(null); setErr(''); };

  const submit = () => {
    const label = form.label.trim();
    if(!label){ setErr('기간 이름을 입력해 주세요.'); return; }
    if(!form.start || !form.end){ setErr('시작일과 종료일을 모두 선택해 주세요.'); return; }
    if(form.end < form.start){ setErr('종료일이 시작일보다 빠를 수 없어요.'); return; }
    if((form.bookOpenDate && !form.bookOpenTime) || (!form.bookOpenDate && form.bookOpenTime)){ setErr('합주예약 시작은 날짜와 시간을 함께 입력해 주세요.'); return; }
    if(form.bookOpenDate && form.bookOpenDate > form.start){ setErr('합주예약 시작일은 기간 시작일보다 늦을 수 없어요.'); return; }
    const patch = { type:form.type, label, start:form.start, end:form.end, bookOpenDate:form.bookOpenDate, bookOpenTime:form.bookOpenTime };
    if(editId){
      persistTerms(terms.map(t => t.id === editId ? { ...t, ...patch } : t));
    } else {
      persistTerms([...terms, { id:'tm'+Date.now(), ...patch }]);
    }
    resetForm();
  };
  const startEdit = (t: TtTerm) => { setForm({ type:t.type, label:t.label, start:t.start, end:t.end, bookOpenDate:t.bookOpenDate || '', bookOpenTime:t.bookOpenTime || '' }); setEditId(t.id); setErr(''); setConfirmId(null); };
  const remove = (id: string) => { persistTerms(terms.filter((t: TtTerm) => t.id !== id)); setConfirmId(null); if(editId===id) resetForm(); };

  const active = ttActiveTerm(terms);
  const activeType = active ? active.type : 'semester';
  const ah = hours[activeType];
  const sorted = [...terms].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      {/* 현재 운영 모드 hero */}
      <div className="card" style={{ padding:'26px 28px', position:'relative', overflow:'hidden' }}>
        <span style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background: active ? 'var(--accent)' : 'var(--border)' }}></span>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
          <div style={{ minWidth:0 }}>
            <div className="mono" style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--subtle-foreground)' }}>현재 운영 모드 · {ttFmt(TT_TODAY)} ({ttWeekday(TT_TODAY)}) 기준</div>
            <div style={{ display:'flex', alignItems:'center', gap:11, marginTop:13 }}>
              <span style={{ width:44, height:44, borderRadius:11, flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center', color: active ? 'var(--accent-hover)' : 'var(--subtle-foreground)', background: active ? 'var(--accent-muted)' : 'var(--surface-elevated)', border:'1px solid var(--border-subtle)' }}>
                {activeType === 'semester' ? <Icons.book size={22} /> : <Icons.spark size={22} />}
              </span>
              <div>
                <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:26, letterSpacing:'-0.02em' }}>{active ? (activeType === 'semester' ? '학기중' : '방학중') : '운영 기간 미지정'}</div>
                <div className="mono" style={{ fontSize:11.5, color:'var(--muted-foreground)', marginTop:3 }}>{active ? `${active.label} · ${ttFmtShort(active.start)}–${ttFmtShort(active.end)}` : '오늘이 포함된 운영 기간이 없어요'}</div>
              </div>
            </div>
          </div>
          <div style={{ flex:'0 0 auto', borderLeft:'1px solid var(--border-subtle)', paddingLeft:22, display:'flex', flexDirection:'column', gap:10 }}>
            <div className="mono" style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--subtle-foreground)' }}>합주실 운영시간</div>
            {[['평일', ah.weekdayOpen, ah.weekdayClose], ['주말', ah.weekendOpen, ah.weekendClose]].map(([l, o, c]) => (
              <div key={l} style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                <span className="mono" style={{ fontSize:11.5, color:'var(--muted-foreground)', flex:'0 0 30px' }}>{l}</span>
                <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:16, letterSpacing:'0.01em' }}>{ttHHMM(o)}<span style={{ color:'var(--subtle-foreground)', margin:'0 4px', fontWeight:400 }}>–</span>{ttHHMM(c)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 운영시간 editor */}
      <div className="card" style={{ padding:22 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:18 }}>
          <div>
            <div className="mono" style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--subtle-foreground)' }}>운영시간</div>
            <p style={{ margin:'8px 0 0', fontSize:12.5, color:'var(--muted-foreground)', lineHeight:1.6, textWrap:'pretty', maxWidth:520 }}>학기중·방학중 각각 평일과 주말의 합주실 운영 시작·종료 시각을 정합니다. 종료 시각 이후 시간대는 타임테이블에서 ‘운영 종료’로 잠겨요.</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          <TtHoursBlock Ic={Icons.book} title="학기중" hint="SEMESTER" h={hours.semester} onChange={(k, v) => setHourVal('semester', k, v)} />
          <TtHoursBlock Ic={Icons.spark} title="방학중" hint="VACATION" h={hours.vacation} onChange={(k, v) => setHourVal('vacation', k, v)} />
        </div>
      </div>

      {/* 운영 기간 목록 + 추가 */}
      <div className="admin-grid">
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:2 }}>
            <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:17, letterSpacing:'-0.01em' }}>운영 기간</span>
            <span className="mono" style={{ fontSize:11.5, color:'var(--subtle-foreground)' }}>{terms.length}개 · 학년도 달력</span>
            <span style={{ flex:1, height:1, background:'var(--border-subtle)' }}></span>
          </div>
          {sorted.length === 0 ? (
            <div className="card" style={{ padding:'44px 24px', textAlign:'center', border:'1px dashed var(--border)', background:'transparent' }}>
              <div style={{ display:'inline-flex', width:48, height:48, borderRadius:12, alignItems:'center', justifyContent:'center', color:'var(--subtle-foreground)', border:'1px solid var(--border-subtle)' }}><Icons.calendar size={22} /></div>
              <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:16, marginTop:14 }}>등록된 운영 기간이 없어요</div>
              <div className="mono" style={{ fontSize:11.5, color:'var(--subtle-foreground)', marginTop:7 }}>오른쪽에서 학기·방학 기간을 추가해 주세요</div>
            </div>
          ) : sorted.map(t => {
            const isActive = active && active.id === t.id;
            const isSem = t.type === 'semester';
            const editing = editId === t.id;
            return (
              <div key={t.id} className="card" style={{ padding:'15px 17px', display:'flex', alignItems:'center', gap:14, position:'relative', overflow:'hidden', borderColor: editing ? 'var(--accent)' : undefined }}>
                {isActive && <span style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'var(--accent)' }}></span>}
                <span style={{ flex:'0 0 auto', width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color: isSem ? 'var(--accent-hover)' : 'var(--muted-foreground)', background: isSem ? 'var(--accent-muted)' : 'var(--surface-elevated)', border:'1px solid var(--border-subtle)' }}>
                  {isSem ? <Icons.book size={18} /> : <Icons.spark size={18} />}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15 }}>{t.label}</span>
                    <span className="mono" style={{ fontSize:9.5, padding:'2px 7px', borderRadius:4, color: isSem ? 'var(--accent-hover)' : 'var(--muted-foreground)', background: isSem ? 'var(--accent-muted)' : 'var(--surface-elevated)', border:'1px solid var(--border-subtle)' }}>{isSem ? '학기' : '방학'}</span>
                    {isActive && <span className="mono" style={{ fontSize:9.5, padding:'2px 7px', borderRadius:4, color:'var(--accent-hover)', border:'1px solid color-mix(in oklab, var(--accent) 45%, transparent)' }}><span className="dot" style={{ background:'var(--accent)', marginRight:5 }}></span>진행 중</span>}
                  </div>
                  <div className="mono" style={{ fontSize:11.5, color:'var(--subtle-foreground)', marginTop:5 }}>{ttFmt(t.start)} – {ttFmt(t.end)} · {ttDays(t.start, t.end)}일</div>
                  {t.bookOpenDate && (
                    <div className="mono" style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10.5, color:'var(--accent-hover)', marginTop:6, padding:'2px 8px 2px 6px', borderRadius:5, background:'var(--accent-muted)', border:'1px solid var(--border-subtle)' }}><Icons.calendar size={11} />예약 오픈 {ttFmt(t.bookOpenDate)} {t.bookOpenTime}</div>
                  )}
                </div>
                {confirmId === t.id ? (
                  <div style={{ display:'flex', gap:6, flex:'0 0 auto' }}>
                    <button onClick={() => remove(t.id)} className="mono" style={{ fontSize:11.5, fontWeight:700, padding:'7px 11px', borderRadius:6, background:'rgba(224,122,95,0.15)', color:'#E58C75', border:'1px solid rgba(224,122,95,0.34)' }}>삭제</button>
                    <button onClick={() => setConfirmId(null)} className="mono" style={{ fontSize:11.5, padding:'7px 11px', borderRadius:6, color:'var(--muted-foreground)', border:'1px solid var(--border)' }}>취소</button>
                  </div>
                ) : (
                  <div style={{ display:'flex', gap:7, flex:'0 0 auto' }}>
                    <button onClick={() => startEdit(t)} aria-label="기간 수정" title="수정" style={{ width:34, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--subtle-foreground)', border:'1px solid var(--border-subtle)', transition:'all .14s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-hover)'; e.currentTarget.style.borderColor = 'color-mix(in oklab, var(--accent) 45%, transparent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--subtle-foreground)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}><Icons.edit size={15} /></button>
                    <button onClick={() => setConfirmId(t.id)} aria-label="기간 삭제" title="삭제" style={{ width:34, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--subtle-foreground)', border:'1px solid var(--border-subtle)', transition:'all .14s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#E58C75'; e.currentTarget.style.borderColor = 'rgba(224,122,95,0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--subtle-foreground)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}><Icons.trash size={15} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="admin-preview">
          <div className="card" style={{ padding:22, display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:11 }}>
              <span style={{ width:40, height:40, borderRadius:10, flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-hover)', background:'var(--accent-muted)', border:'1px solid var(--border-subtle)' }}>{editId ? <Icons.edit size={18} /> : <Icons.plus size={19} />}</span>
              <div>
                <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15.5 }}>{editId ? '운영 기간 수정' : '운영 기간 추가'}</div>
                <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:3 }}>학기 또는 방학 기간을 등록해요</div>
              </div>
            </div>
            <hr className="rule" />
            <div>
              <RecField hint="기간 유형">구분</RecField>
              <TtSeg options={[['semester', '학기'], ['vacation', '방학']]} value={form.type} onChange={(v) => setF('type', v)} />
            </div>
            <div>
              <RecField hint="예: 2026-2학기 / 겨울방학">기간 이름</RecField>
              <input value={form.label} onChange={(e) => setF('label', e.target.value)} maxLength={20} placeholder="기간 이름을 입력하세요" style={recInput} />
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <div style={{ flex:'1 1 130px' }}>
                <RecField hint="시작">기간</RecField>
                <input type="date" value={form.start} onChange={(e) => setF('start', e.target.value)} style={recInput} />
              </div>
              <div style={{ flex:'1 1 130px' }}>
                <RecField hint="종료">&nbsp;</RecField>
                <input type="date" value={form.end} onChange={(e) => setF('end', e.target.value)} style={recInput} />
              </div>
            </div>
            <div>
              <RecField hint="부원 예약 오픈 일시 · 선택">합주예약 시작</RecField>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <input type="date" value={form.bookOpenDate} onChange={(e) => setF('bookOpenDate', e.target.value)} style={{ ...recInput, flex:'1 1 130px' }} />
                <input type="time" step={300} value={form.bookOpenTime} onChange={(e) => setF('bookOpenTime', e.target.value)} style={{ ...recInput, flex:'1 1 110px' }} />
              </div>
              <p className="mono" style={{ margin:'8px 2px 0', fontSize:10.5, color:'var(--subtle-foreground)', lineHeight:1.6, textWrap:'pretty' }}>이 일시부터 부원들이 해당 학기·방학의 합주 예약을 시작할 수 있어요. 비워 두면 기간 시작과 동시에 열립니다.</p>
            </div>
            {err && <div className="mono" style={{ fontSize:11.5, color:'#E58C75', lineHeight:1.5 }}>{err}</div>}
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-primary" onClick={submit} style={{ flex:1, justifyContent:'center', padding:'12px' }}>{editId ? <><Icons.check size={16} />수정 저장</> : <><Icons.plus size={16} />기간 추가</>}</button>
              {editId && <button className="btn" onClick={resetForm} style={{ justifyContent:'center', padding:'12px 16px' }}>취소</button>}
            </div>
          </div>
          <p className="mono" style={{ margin:'14px 2px 0', fontSize:11, color:'var(--subtle-foreground)', lineHeight:1.7, textWrap:'pretty' }}>
            오늘 날짜가 포함된 기간의 유형에 따라 합주실 운영시간이 자동으로 적용됩니다. 기간이 겹치면 먼저 등록된 기간이 우선해요.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── 행사 기간 설정 ─── */
function EventPeriodSettings(){
  const [events, setEvents] = useState<TtEvent[]>(() => ttLoad<TtEvent[]>(TT_EVENTS_KEY, TT_EVENTS_DEFAULT).map(e => ({ ...e, allDay: e.allDay ?? true, startTime: e.startTime ?? 8, endTime: e.endTime ?? 22 })));
  const [form, setForm] = useState<{ kind: 'event' | 'closed'; label: string; start: string; end: string; allDay: boolean; startTime: number; endTime: number; note: string }>({ kind:'event', label:'', start:'', end:'', allDay:true, startTime:18, endTime:22, note:'' });
  const [editId, setEditId] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const persist = (list: TtEvent[]) => { setEvents(list); ttSave(TT_EVENTS_KEY, list); };
  const setF = (k: string, v: string | boolean | number) => setForm(f => ({ ...f, [k]: v } as typeof f));
  const resetForm = () => { setForm({ kind:'event', label:'', start:'', end:'', allDay:true, startTime:18, endTime:22, note:'' }); setEditId(null); setErr(''); };

  const submit = () => {
    const label = form.label.trim();
    if(!label){ setErr('행사 이름을 입력해 주세요.'); return; }
    if(!form.start || !form.end){ setErr('시작일과 종료일을 모두 선택해 주세요.'); return; }
    if(form.end < form.start){ setErr('종료일이 시작일보다 빠를 수 없어요.'); return; }
    if(!form.allDay && form.endTime <= form.startTime){ setErr('종료 시각이 시작 시각보다 늦어야 해요.'); return; }
    const payload = { kind:form.kind, label, start:form.start, end:form.end, allDay:form.allDay, startTime:form.startTime, endTime:form.endTime, note:form.note.trim() };
    if(editId){ persist(events.map(e => e.id === editId ? { ...e, ...payload } : e)); }
    else { persist([...events, { id:'ev'+Date.now(), ...payload }]); }
    resetForm();
  };
  const startEdit = (e: TtEvent) => { setForm({ kind: e.kind as 'event' | 'closed', label:e.label, start:e.start, end:e.end, allDay:e.allDay!==false, startTime:e.startTime!=null?e.startTime:18, endTime:e.endTime!=null?e.endTime:22, note:e.note || '' }); setEditId(e.id); setErr(''); setConfirmId(null); };
  const remove = (id: string) => { persist(events.filter((e: TtEvent) => e.id !== id)); setConfirmId(null); if(editId===id) resetForm(); };

  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
  const nClosed = events.filter(e => e.kind === 'closed').length;
  const nEvent = events.length - nClosed;
  const toneColor: Record<string, string> = { now:'var(--accent-hover)', soon:'var(--muted-foreground)', past:'var(--subtle-foreground)' };

  return (
    <div className="admin-grid">
      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <div className="card" style={{ padding:4, display:'flex' }}>
          {[['등록 기간', events.length + '개'], ['행사', nEvent + '건'], ['합주실 휴무', nClosed + '건']].map(([l, v], i) => (
            <div key={l} style={{ flex:1, padding:'15px 18px', borderLeft: i ? '1px solid var(--border-subtle)' : 'none' }}>
              <div className="mono" style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--subtle-foreground)' }}>{l}</div>
              <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:23, marginTop:6, letterSpacing:'-0.02em' }}>{v}</div>
            </div>
          ))}
        </div>

        {sorted.length === 0 ? (
          <div className="card" style={{ padding:'48px 24px', textAlign:'center', border:'1px dashed var(--border)', background:'transparent' }}>
            <div style={{ display:'inline-flex', width:48, height:48, borderRadius:12, alignItems:'center', justifyContent:'center', color:'var(--subtle-foreground)', border:'1px solid var(--border-subtle)' }}><Icons.flag size={22} /></div>
            <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:16, marginTop:14 }}>등록된 행사 기간이 없어요</div>
            <div className="mono" style={{ fontSize:11.5, color:'var(--subtle-foreground)', marginTop:7 }}>오른쪽에서 공연·MT·시험기간 휴무 등을 추가해 주세요</div>
          </div>
        ) : sorted.map(e => {
          const isClosed = e.kind === 'closed';
          const st = ttEventStatus(e);
          const editing = editId === e.id;
          const span = ttDays(e.start, e.end);
          return (
            <div key={e.id} className="card" style={{ padding:'16px 18px', display:'flex', gap:15, alignItems:'flex-start', position:'relative', overflow:'hidden', borderColor: editing ? 'var(--accent)' : undefined }}>
              <span style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background: isClosed ? 'rgba(224,122,95,0.6)' : 'var(--accent)' }}></span>
              <span style={{ flex:'0 0 auto', width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color: isClosed ? '#E58C75' : 'var(--accent-hover)', background: isClosed ? 'rgba(224,122,95,0.1)' : 'var(--accent-muted)', border:'1px solid var(--border-subtle)' }}>
                {isClosed ? <Icons.lock size={18} /> : <Icons.flag size={18} />}
              </span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15 }}>{e.label}</span>
                  <span className="mono" style={{ fontSize:9.5, padding:'2px 7px', borderRadius:4, color: isClosed ? '#E58C75' : 'var(--accent-hover)', background: isClosed ? 'rgba(224,122,95,0.1)' : 'var(--accent-muted)', border:`1px solid ${isClosed ? 'rgba(224,122,95,0.3)' : 'var(--border-subtle)'}` }}>{isClosed ? '합주실 휴무' : '행사'}</span>
                  <span className="mono" style={{ fontSize:9.5, padding:'2px 7px', borderRadius:4, color: toneColor[st.tone], border:'1px solid var(--border-subtle)' }}>{st.tone === 'now' && <span className="dot" style={{ background:'var(--accent)', marginRight:5 }}></span>}{st.label}</span>
                </div>
                <div className="mono" style={{ fontSize:11.5, color:'var(--subtle-foreground)', marginTop:6, display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                  <span>{ttFmt(e.start)} ({ttWeekday(e.start)}) – {ttFmt(e.end)} ({ttWeekday(e.end)}) · {span}일</span>
                  <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--border)' }}></span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontWeight:700, color: e.allDay ? 'var(--muted-foreground)' : (isClosed ? '#E58C75' : 'var(--accent-hover)') }}><Icons.clock size={12} />{ttTimeText(e)}</span>
                </div>
                {e.note && <p style={{ margin:'8px 0 0', fontSize:12.5, color:'var(--muted-foreground)', lineHeight:1.6, textWrap:'pretty' }}>{e.note}</p>}
              </div>
              {confirmId === e.id ? (
                <div style={{ display:'flex', gap:6, flex:'0 0 auto' }}>
                  <button onClick={() => remove(e.id)} className="mono" style={{ fontSize:11.5, fontWeight:700, padding:'7px 11px', borderRadius:6, background:'rgba(224,122,95,0.15)', color:'#E58C75', border:'1px solid rgba(224,122,95,0.34)' }}>삭제</button>
                  <button onClick={() => setConfirmId(null)} className="mono" style={{ fontSize:11.5, padding:'7px 11px', borderRadius:6, color:'var(--muted-foreground)', border:'1px solid var(--border)' }}>취소</button>
                </div>
              ) : (
                <div style={{ display:'flex', gap:7, flex:'0 0 auto' }}>
                  <button onClick={() => startEdit(e)} aria-label="행사 수정" title="수정" style={{ width:34, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--subtle-foreground)', border:'1px solid var(--border-subtle)', transition:'all .14s' }}
                    onMouseEnter={(ev) => { ev.currentTarget.style.color = 'var(--accent-hover)'; ev.currentTarget.style.borderColor = 'color-mix(in oklab, var(--accent) 45%, transparent)'; }}
                    onMouseLeave={(ev) => { ev.currentTarget.style.color = 'var(--subtle-foreground)'; ev.currentTarget.style.borderColor = 'var(--border-subtle)'; }}><Icons.edit size={15} /></button>
                  <button onClick={() => setConfirmId(e.id)} aria-label="행사 삭제" title="삭제" style={{ width:34, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--subtle-foreground)', border:'1px solid var(--border-subtle)', transition:'all .14s' }}
                    onMouseEnter={(ev) => { ev.currentTarget.style.color = '#E58C75'; ev.currentTarget.style.borderColor = 'rgba(224,122,95,0.4)'; }}
                    onMouseLeave={(ev) => { ev.currentTarget.style.color = 'var(--subtle-foreground)'; ev.currentTarget.style.borderColor = 'var(--border-subtle)'; }}><Icons.trash size={15} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="admin-preview">
        <div className="card" style={{ padding:22, display:'flex', flexDirection:'column', gap:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:11 }}>
            <span style={{ width:40, height:40, borderRadius:10, flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-hover)', background:'var(--accent-muted)', border:'1px solid var(--border-subtle)' }}>{editId ? <Icons.edit size={18} /> : <Icons.plus size={19} />}</span>
            <div>
              <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15.5 }}>{editId ? '행사 기간 수정' : '행사 기간 추가'}</div>
              <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:3 }}>공연·MT·휴무 등 특별 기간</div>
            </div>
          </div>
          <hr className="rule" />
          <div>
            <RecField hint="합주실 사용 여부">구분</RecField>
            <TtSeg options={[['event', '행사'], ['closed', '합주실 휴무']]} value={form.kind} onChange={(v) => setF('kind', v)} />
            <p className="mono" style={{ margin:'9px 0 0', fontSize:10.5, color:'var(--subtle-foreground)', lineHeight:1.6, textWrap:'pretty' }}>{form.kind === 'closed' ? '이 기간에는 합주실 예약이 막히고 타임테이블에 휴무로 표시됩니다.' : '공연·MT 등 일정을 타임테이블에 안내로 표시합니다.'}</p>
          </div>
          <div>
            <RecField hint="최대 24자">행사 이름</RecField>
            <input value={form.label} onChange={(e) => setF('label', e.target.value)} maxLength={24} placeholder="예: 정기공연 리허설 주간" style={recInput} />
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 130px' }}>
              <RecField hint="시작">기간</RecField>
              <input type="date" value={form.start} onChange={(e) => setF('start', e.target.value)} style={recInput} />
            </div>
            <div style={{ flex:'1 1 130px' }}>
              <RecField hint="종료">&nbsp;</RecField>
              <input type="date" value={form.end} onChange={(e) => setF('end', e.target.value)} style={recInput} />
            </div>
          </div>
          <div>
            <RecField hint={form.kind === 'closed' ? '휴무 적용 시간' : '진행 시간'}>시간대</RecField>
            <TtSeg options={[['allday', '온종일'], ['custom', '시간 지정']]} value={form.allDay ? 'allday' : 'custom'} onChange={(v) => setF('allDay', v === 'allday')} />
            {!form.allDay && (
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12, flexWrap:'wrap' }}>
                <TtHourSelect value={form.startTime} onChange={(v) => setF('startTime', v)} />
                <span style={{ color:'var(--subtle-foreground)' }}>–</span>
                <TtHourSelect value={form.endTime} onChange={(v) => setF('endTime', v)} />
                <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)' }}>매일 {Math.max(0, form.endTime - form.startTime)}시간</span>
              </div>
            )}
            <p className="mono" style={{ margin:'9px 0 0', fontSize:10.5, color:'var(--subtle-foreground)', lineHeight:1.6, textWrap:'pretty' }}>{form.allDay ? '기간 내 모든 운영시간에 적용됩니다.' : '기간 내 매일 이 시간대에만 적용돼, 타임테이블에 시간 단위로 표시됩니다.'}</p>
          </div>
          <div>
            <RecField hint="선택 · 최대 80자">메모</RecField>
            <textarea value={form.note} onChange={(e) => setF('note', e.target.value.slice(0, 80))} rows={2} placeholder="부원에게 안내할 내용을 적어보세요" style={{ ...recInput, resize:'vertical', lineHeight:1.6 }} />
          </div>
          {err && <div className="mono" style={{ fontSize:11.5, color:'#E58C75', lineHeight:1.5 }}>{err}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-primary" onClick={submit} style={{ flex:1, justifyContent:'center', padding:'12px' }}>{editId ? <><Icons.check size={16} />수정 저장</> : <><Icons.plus size={16} />행사 추가</>}</button>
            {editId && <button className="btn" onClick={resetForm} style={{ justifyContent:'center', padding:'12px 16px' }}>취소</button>}
          </div>
        </div>
        <p className="mono" style={{ margin:'14px 2px 0', fontSize:11, color:'var(--subtle-foreground)', lineHeight:1.7, textWrap:'pretty' }}>
          등록한 행사·휴무 기간은 부원들이 보는 타임테이블 상단과 해당 날짜에 표시됩니다.
        </p>
      </div>
    </div>
  );
}

function TimetableSettings(){
  const [section, setSection] = useState('term');
  const subs: [string, string, IconComp][] = [['term', '학기 · 방학', Icons.calendar], ['event', '행사 기간', Icons.flag]];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', gap:3, padding:3, border:'1px solid var(--border-subtle)', borderRadius:9, background:'var(--surface)', alignSelf:'flex-start' }}>
        {subs.map(([k, l, Ic]) => {
          const on = section === k;
          return (
            <button key={k} onClick={() => setSection(k)} style={{
              display:'inline-flex', alignItems:'center', gap:8, fontFamily:'var(--font-sans)', fontSize:13.5,
              fontWeight: on ? 700 : 500, padding:'9px 18px', borderRadius:6, transition:'all .14s',
              background: on ? 'var(--accent)' : 'transparent', color: on ? '#1A1308' : 'var(--muted-foreground)',
            }}><span className="ico" style={{ display:'flex' }}>{React.createElement(Ic, { size:15 })}</span>{l}</button>
          );
        })}
      </div>
      {section === 'term' ? <TermSettings /> : <EventPeriodSettings />}
    </div>
  );
}

function AdminScreen() {
  type AdminTab = 'recruit' | 'interview' | 'applicants' | 'teams' | 'timetable' | 'members' | 'migrate';
  const [tab, setTab] = useState<AdminTab>('recruit');
  const tabs: [AdminTab, string, IconComp][] = [['recruit', '모집 설정', Icons.megaphone], ['interview', '면접 일정', Icons.calendar], ['applicants', '지원자', Icons.person], ['teams', '팀 활성화', Icons.grid], ['timetable', '타임테이블', Icons.clock], ['members', '부원 관리', Icons.shield], ['migrate', '부원 이전', Icons.upload]];
  const KICK: Record<AdminTab, string> = { recruit: '운영진 전용 · 랜딩 페이지', interview: '운영진 전용 · 신입 면접', applicants: '운영진 전용 · 신입 선발', teams: '운영진 전용 · 팀 활성화', timetable: '운영진 전용 · 합주실 운영', members: '운영진 전용 · 부원 일괄 관리', migrate: '운영진 전용 · 데이터 이전' };
  const TITLE: Record<AdminTab, string> = { recruit:'RECRUIT', interview:'RECRUIT', applicants:'RECRUIT', teams:'TEAMS', timetable:'TIMETABLE', members:'ROSTER', migrate:'MIGRATE' };
  const INTRO: Record<AdminTab, string> = {
    recruit: '랜딩 페이지의 신입 모집 노출 여부와 모집글을 관리합니다. 저장하면 방문자에게 보이는 화면에 즉시 반영돼요.',
    interview: '지원자에게 안내할 면접 가능 시간대를 등록·삭제합니다. 등록한 시간대는 지원자의 면접 예약 화면에 노출돼요.',
    applicants: '신입 지원서와 지원자가 고른 희망 면접 시간대를 확인하고, 그중 하나로 면접을 확정해요. 합격·불합격을 결정해 결과를 통지합니다.',
    teams: '팀장이 보낸 활성화 신청을 검토해 수락하면 해당 팀이 정식 활동 팀으로 공개됩니다. 전체 팀의 활성 상태도 한 곳에서 일괄로 켜고 끌 수 있어요.',
    timetable: '합주실 타임테이블의 학기·방학 운영시간과 행사 기간을 설정합니다. 오늘 날짜에 맞는 운영 모드가 자동으로 적용되고, 변경 내용은 부원이 보는 타임테이블에 반영돼요.',
    members: '부원 전체를 한 곳에서 관리합니다. 화이트리스트 지정, 운영진 위임, 경고 부여, 정지·제적을 개별 또는 일괄로 처리할 수 있어요.',
    migrate: '기존 부원 명단을 CSV로 한 번에 옮겨옵니다. 양식을 내려받아 채운 뒤 업로드하면, 미리보기로 검증한 다음 명단에 일괄 등록돼요.',
  };
  return (
    <div className="screen-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
        <div>
          <UU.Kicker>{KICK[tab]}</UU.Kicker>
          <h1 className="display" style={{ margin: '14px 0 0', fontSize: 60 }}>{TITLE[tab]}</h1>
          <p style={{ margin: '12px 0 0', fontSize: 14.5, color: 'var(--muted-foreground)', maxWidth: 480, lineHeight: 1.7, textWrap: 'pretty' }}>{INTRO[tab]}</p>
        </div>
        {tab === 'recruit' && (
          <a className="btn btn-ghost mono" href="랜딩 페이지.html" target="_blank" rel="noopener" style={{ fontSize: 12, letterSpacing: '0.04em', color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-hover)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}>
            랜딩 페이지 열기<Icons.arrow size={14} />
          </a>
        )}
      </div>

      <div className="admin-tabbar" style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border-subtle)', flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {tabs.map(([k, l, Ic]) => {
          const on = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 2px', marginBottom: -1, fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: on ? 700 : 500, color: on ? 'var(--foreground)' : 'var(--muted-foreground)', borderBottom: `2px solid ${on ? 'var(--accent)' : 'transparent'}`, transition: 'color .14s', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
              <span className="ico">{React.createElement(Ic, { size: 16 })}</span>{l}
            </button>
          );
        })}
      </div>

      {tab === 'recruit' ? <RecruitSettings /> : tab === 'interview' ? <InterviewSchedule /> : tab === 'applicants' ? <ApplicantManager /> : tab === 'teams' ? <TeamActivationManager /> : tab === 'timetable' ? <TimetableSettings /> : tab === 'members' ? <MA.MemberAdminScreen /> : <MA.MemberMigration />}
    </div>
  );
}

function SiteFooter({ go }: { go: GoFn }) {
  const links = [
    { k:'timetable', l:'합주실 예약' },
    { k:'members', l:'부원' },
    { k:'teams', l:'팀' },
    { k:'notices', l:'게시판' },
    { k:'notifications', l:'알림' },
    { k:'report', l:'신고·제보' },
  ];
  return (
    <footer style={{ marginTop:64, paddingTop:30, borderTop:'1px solid var(--border-subtle)',
      display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ width:32, height:32, borderRadius:7, border:'1.5px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-hover)', flex:'0 0 auto' }}>
          <span style={{ width:24, height:24, display:'inline-block', background:'var(--accent-hover)', WebkitMaskImage:'url(/icon.svg)', WebkitMaskSize:'contain', WebkitMaskRepeat:'no-repeat', WebkitMaskPosition:'center', maskImage:'url(/icon.svg)', maskSize:'contain', maskRepeat:'no-repeat', maskPosition:'center' }} />
        </span>
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15, letterSpacing:'-0.02em' }}>청림그룹사운드</div>
          <div className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)', marginTop:3 }}>한남대학교 밴드 동아리</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
        {links.map(x => (
          <button key={x.k} onClick={()=>go(x.k)} className="mono" style={{ fontSize:12, color:'var(--muted-foreground)', letterSpacing:'0.02em', transition:'color .14s' }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--accent-hover)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--muted-foreground)'}>{x.l}</button>
        ))}
      </div>
      <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)', letterSpacing:'0.06em' }}>© 2026 CHUNGLIM GROUP SOUND</span>
    </footer>
  );
}

function BottomNav({ screen, go }: { screen: string; go: GoFn }) {
  const items = [
    { key:'home', label:'홈', icon:Icons.home },
    { key:'timetable', label:'일정', icon:Icons.calendar },
    { key:'members', label:'부원', icon:Icons.users },
    { key:'teams', label:'팀', icon:Icons.guitar },
    { key:'notices', label:'게시판', icon:Icons.megaphone },
    { key:'admin', label:'운영', icon:Icons.settings },
  ];
  return (
    <nav className="bottom-nav">
      {items.map(it => (
        <button key={it.key} className="bn-item" data-active={screen===it.key || (it.key==='notices' && screen.indexOf('notice')===0)} onClick={()=>go(it.key)}>
          <span className="bn-ic ico">{React.createElement(it.icon,{size:21})}</span>
          <span className="bn-lb">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState('home');

  // apply theme/accent/font to <html>
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-theme', t.theme);
    el.setAttribute('data-accent', t.accent);
    el.setAttribute('data-font', t.displayFont);
  }, [t.theme, t.accent, t.displayFont]);

  const [navNonce, setNavNonce] = useState(0);
  const [navParams, setNavParams] = useState<NavParams>(null);
  const go: GoFn = (k, params=null) => { setNavNonce(n=>n+1); setScreen(k); setNavParams(params ?? null); window.scrollTo({ top:0, behavior:'smooth' }); };

  let content;
  if (screen === 'home') {
    content = <H.HomeConsole go={go} />;
  } else if (screen === 'timetable') content = <TT.TimetableScreen />;
  else if (screen === 'members') content = <S.MembersScreen go={go} autoOpenSelf={false} />;
  else if (screen === 'my-profile') content = <S.MembersScreen go={go} autoOpenSelf={true} />;
  else if (screen === 'profile-edit') content = <S.ProfileEditScreen go={go} />;
  else if (screen === 'teams') content = <S.TeamsScreen go={go} />;
  else if (screen === 'notices') content = <N.NoticesScreen go={go} />;
  else if (screen === 'notice-detail') content = <N.NoticeDetailScreen go={go} id={(navParams?.id as string) ?? ''} />;
  else if (screen === 'notice-create') content = <N.NoticeCreateScreen go={go} kind={navParams?.kind as string | undefined} />;
  else if (screen === 'notice-edit') content = <N.NoticeEditScreen go={go} id={(navParams?.id as string) ?? ''} />;
  else if (screen === 'admin') content = <AdminScreen />;
  else if (screen === 'notifications') content = React.createElement((NOT.NotificationsScreen as unknown) as React.ComponentType<{ go: GoFn }>, { go });
  else if (screen === 'report') content = <RP.ReportScreen />;

  return (
    <>
      <Header screen={screen} go={go} theme={t.theme} setTheme={(id)=>setTweak('theme',id)} />
      <main className="app-main" style={{ maxWidth:1180, margin:'0 auto', padding:'40px 26px 90px' }}>
        <React.Fragment key={navNonce}>{content}</React.Fragment>
        <SiteFooter go={go} />
      </main>

      <BottomNav screen={screen} go={go} />

    </>
  );
}

export { App, Header, BottomNav, SiteFooter, AdminScreen, RecruitSettings, InterviewSchedule, ApplicantManager, TeamActivationManager, TimetableSettings };


