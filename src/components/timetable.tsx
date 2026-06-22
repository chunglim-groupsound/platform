'use client';
import React from 'react';
import * as ReactDOM from 'react-dom';
import { Icons } from '@/components/icons';
import { UI } from '@/components/shared-ui';
import { DATA, TTShared } from '@/lib/mock-data';
import type { Team, Booking, RoomEvent, HourConfig, WeekDay } from '@/lib/mock-data';

// ═══════════════════════════════════════════════════════════════════════════
// 청림그룹사운드 리디자인
// 모듈: 타임테이블 — 합주실 주간 예약 (Timetable)
// 메인 파일에서 src="modules/04-timetable.jsx" 로 로드됨.
// 로드 순서가 의존성 순서입니다 (이 파일은 04/12 번째).
// ═══════════════════════════════════════════════════════════════════════════


// ───────────── TIMETABLE (the star) ─────────────
const { useState, useEffect } = React;
const { DAYS, HOURS, BOOKINGS, TEAMS, ROOM_EVENTS } = DATA;
const { hexA } = UI;
const TTS = TTShared;

const ROW_H = 50;
const HEAD_H = 52;
const DAY_DATES = ['09','10','11','12','13','14','15']; // week of June
const MY_TEAM_IDS = ['t1','t2']; // 내가 팀장·부팀장인 팀 (데모)

interface Selection {
  day: number;
  anchor: number;
  lo: number;
  hi: number;
}

function teamById(id: string): Team | undefined { return TEAMS.find(t => t.id === id); }
function fmtHour(h: number): string { return String(h).padStart(2,'0') + ':00'; }
// 운영시간은 운영자 설정(hours: {weekdayOpen,weekdayClose,weekendOpen,weekendClose})을 따른다
function dayClose(hours: HourConfig, day: number): number { return day>=5 ? hours.weekendClose : hours.weekdayClose; }
function dayOpen(hours: HourConfig, day: number): number { return day>=5 ? hours.weekendOpen : hours.weekdayOpen; }
function isClosed(hours: HourConfig, day: number, hour: number): boolean { return hour >= dayClose(hours, day) || hour < dayOpen(hours, day); }
function eventAt(events: RoomEvent[], day: number, hour: number): RoomEvent | undefined { return events.find(e => e.day===day && hour>=e.start && hour<e.start+e.len); }
function bookingAt(list: Booking[], day: number, hour: number): Booking | undefined { return list.find(b => b.day===day && hour>=b.start && hour<b.start+b.len); }
function cellFree(hours: HourConfig, events: RoomEvent[], list: Booking[], day: number, hour: number): boolean { return !isClosed(hours,day,hour) && !eventAt(events,day,hour) && !bookingAt(list,day,hour); }
function hoursForType(type: string): HourConfig { const h = TTS.loadHours(); return h[type] ?? h.semester; }

function useNow() {
  const read = () => { const d = new Date(); return { day: (d.getDay() + 6) % 7, hour: d.getHours(), minute: d.getMinutes() }; };
  const [now, setNow] = useState(read);
  useEffect(() => {
    const id = setInterval(() => setNow(read()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ───── shared grid renderer (read-only + interactive) ─────
interface GridProps {
  hours: HourConfig;
  compact?: boolean;
  bookings: Booking[];
  selection?: Selection | null;
  onCell?: (day: number, hour: number) => void;
  onBooking?: (b: Booking) => void;
  canSelect?: boolean;
  isCurrent?: boolean;
  weekDates?: string[];
  events?: RoomEvent[];
}

function Grid({ hours, compact=false, bookings, selection, onCell, onBooking, canSelect, isCurrent=true, weekDates=DAY_DATES, events=ROOM_EVENTS }: GridProps) {
  const now = useNow();
  const base = [...HOURS, 22];   // include 22:00 closing boundary so 21–22 blocks aren't clipped
  const rowHours = compact ? base.filter(h => h >= 15) : base;
  const firstHour = rowHours[0];
  const nowTop = HEAD_H + ((now.hour + now.minute/60) - firstHour) * ROW_H;
  const showNow = isCurrent && now.hour >= firstHour && now.hour < dayClose(hours, now.day);
  const colW = `calc((100% - 52px) / 7)`;

  return (
    <div style={{
      border:'1px solid var(--border-subtle)', borderRadius:8, overflowX:'auto', overflowY:'hidden', WebkitOverflowScrolling:'touch',
      background:'var(--surface)', position:'relative',
    }}>
      <div style={{ position:'relative', display:'grid', gridTemplateColumns:`52px repeat(7, 1fr)`, minWidth: compact ? 560 : 720 }}>

        {/* corner */}
        <div style={{ height:HEAD_H, borderBottom:'1px solid var(--border-subtle)', borderRight:'1px solid var(--border-subtle)', position:'sticky', left:0, zIndex:6, background:'var(--surface)' }}></div>
        {/* day headers */}
        {DAYS.map((d, i) => {
          const today = isCurrent && i === now.day;
          return (
            <div key={d} style={{
              height:HEAD_H, borderBottom:'1px solid var(--border-subtle)',
              borderRight: i<6 ? '1px solid var(--border-subtle)':'none',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1,
              background: today ? 'color-mix(in oklab, var(--accent) 10%, transparent)' : 'transparent',
            }}>
              <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:14,
                color: today ? 'var(--accent-hover)' : (i>=5 ? 'var(--muted-foreground)':'var(--foreground)') }}>{d}</span>
              <span className="mono" style={{ fontSize:10, color: today ? 'var(--accent)' : 'var(--subtle-foreground)' }}>{weekDates[i]}</span>
            </div>
          );
        })}

        {/* hour rows / cells */}
        {rowHours.map((h, ri) => (
          <React.Fragment key={h}>
            <div style={{
              height:ROW_H, borderRight:'1px solid var(--border-subtle)',
              borderBottom: ri<rowHours.length-1 ? '1px solid var(--border-subtle)':'none',
              display:'flex', justifyContent:'flex-end', paddingRight:7, paddingTop:3,
              position:'sticky', left:0, zIndex:4, background:'var(--surface)',
            }}>
              <span className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)' }}>{fmtHour(h)}</span>
            </div>
            {DAYS.map((d, ci) => {
              const closed = isClosed(hours, ci, h);
              const ev = eventAt(events, ci, h);
              const free = !closed && !ev && !bookingAt(bookings, ci, h);
              const selected = selection && selection.day===ci && h>=selection.lo && h<=selection.hi;
              const clickable = canSelect && free;
              const todayCell = isCurrent && ci===now.day;
              return (
                <div key={ci}
                  onClick={clickable ? ()=>onCell?.(ci, h) : undefined}
                  style={{
                    height:ROW_H, borderRight: ci<6 ? '1px solid var(--border-subtle)':'none',
                    borderBottom: ri<rowHours.length-1 ? '1px solid var(--border-subtle)':'none',
                    background: selected ? hexA('#D6A35A', 0.28)
                      : closed ? 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.022) 5px, rgba(255,255,255,0.022) 6px)'
                      : (todayCell ? 'color-mix(in oklab, var(--accent) 5%, transparent)' : 'transparent'),
                    cursor: clickable ? 'pointer' : 'default', transition:'background .1s',
                    position:'relative',
                  }}
                  onMouseEnter={clickable ? (e=>{ if(!selected) e.currentTarget.style.background=hexA('#D6A35A',0.1); }) : undefined}
                  onMouseLeave={clickable ? (e=>{ if(!selected) e.currentTarget.style.background = todayCell?'color-mix(in oklab, var(--accent) 5%, transparent)':'transparent'; }) : undefined}>
                </div>
              );
            })}
          </React.Fragment>
        ))}

        {/* room-closed labels (one per day, top of closed region) */}
        {!compact && DAYS.map((d, ci) => {
          const close = dayClose(hours, ci);
          if (close > rowHours[rowHours.length-1]) return null;
          const top = HEAD_H + (close - firstHour) * ROW_H + 5;
          const left = `calc(52px + ${ci} * ${colW})`;
          return (
            <div key={'cl'+ci} style={{ position:'absolute', top, left, width:colW, textAlign:'center', pointerEvents:'none' }}>
              <span className="mono" style={{ fontSize:9, color:'var(--subtle-foreground)', opacity:0.7 }}>운영 종료</span>
            </div>
          );
        })}

        {/* event (행사) blocks */}
        {events.filter(e => e.start + e.len > firstHour).map((e, idx) => {
          const start = Math.max(e.start, firstHour);
          const top = HEAD_H + (start - firstHour) * ROW_H;
          const height = (e.start + e.len - start) * ROW_H;
          const left = `calc(52px + ${e.day} * ${colW})`;
          return (
            <div key={'ev'+idx} style={{
              position:'absolute', top, height, left, width:colW,
              background:'repeating-linear-gradient(45deg, rgba(224,138,138,0.1), rgba(224,138,138,0.1) 6px, rgba(224,138,138,0.04) 6px, rgba(224,138,138,0.04) 12px)',
              borderLeft:'2.5px solid rgba(224,138,138,0.5)', display:'flex', flexDirection:'column', justifyContent:'center',
              padding:'0 8px', overflow:'hidden', pointerEvents:'none',
            }}>
              <span className="mono" style={{ fontSize:10, fontWeight:700, color:'#E08A8A' }}>행사</span>
              <span className="mono" style={{ fontSize:9.5, color:'var(--muted-foreground)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{e.label}</span>
            </div>
          );
        })}

        {/* booking blocks */}
        {bookings.filter(b => b.start + b.len > firstHour).map((b) => {
          const t = teamById(b.team)!;
          const start = Math.max(b.start, firstHour);
          const top = HEAD_H + (start - firstHour) * ROW_H + 3;
          const height = (b.start + b.len - start) * ROW_H - 6;
          const left = `calc(52px + ${b.day} * ${colW} + 3px)`;
          const isNow = isCurrent && b.day===now.day && now.hour>=b.start && now.hour<b.start+b.len;
          const mine = MY_TEAM_IDS.includes(b.team);
          return (
            <div key={b.id} title={`${t.name} · ${fmtHour(b.start)}–${fmtHour(b.start+b.len)}`}
              onClick={onBooking ? (e)=>{ e.stopPropagation(); onBooking(b); } : undefined}
              style={{
                position:'absolute', top, height, left, width:`calc(${colW} - 6px)`,
                background: hexA(t.hue, isNow ? 0.22 : 0.14),
                borderLeft:`2.5px solid ${t.hue}`,
                borderRadius:4, padding:'6px 8px', overflow:'hidden',
                boxShadow: isNow ? `0 0 0 1px ${hexA(t.hue,0.5)}` : 'none',
                cursor: onBooking ? 'pointer' : 'default', transition:'background .15s',
              }}
              onMouseEnter={onBooking ? (e=>e.currentTarget.style.background=hexA(t.hue,0.26)) : undefined}
              onMouseLeave={onBooking ? (e=>e.currentTarget.style.background=hexA(t.hue,isNow?0.22:0.14)) : undefined}>
              {b.len <= 1 ? (
                /* compact single-line for 1-hour blocks */
                <div style={{ display:'flex', alignItems:'center', gap:5, height:'100%' }}>
                  {isNow && <span className="dot dot-live" style={{ flex:'0 0 auto' }}></span>}
                  <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:11.5, color:'var(--foreground)',
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', minWidth:0 }}>{t.name}</span>
                  <span className="mono" style={{ fontSize:8, padding:'1px 4px', borderRadius:3, flex:'0 0 auto', color: b.kind==='regular'?'var(--accent-hover)':'var(--muted-foreground)', background: b.kind==='regular'?'var(--accent-muted)':'var(--surface-elevated)', border:'1px solid var(--border-subtle)' }}>{b.kind==='regular'?'정기':'단발'}</span>
                  {mine && <span style={{ flex:'0 0 auto', color:t.hue, marginLeft:'auto' }}><Icons.edit size={11} /></span>}
                </div>
              ) : (
                <>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    {isNow && <span className="dot dot-live" style={{ flex:'0 0 auto' }}></span>}
                    <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:12, color:'var(--foreground)',
                      whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.name}</span>
                    {mine && <span style={{ flex:'0 0 auto', color:t.hue }}><Icons.edit size={11} /></span>}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3, flexWrap:'wrap' }}>
                    <span className="mono" style={{ fontSize:9.5, color: hexA(t.hue, 0.95) }}>{fmtHour(b.start)}–{fmtHour(b.start+b.len)}</span>
                    <span className="mono" style={{ fontSize:8.5, padding:'1px 5px', borderRadius:3, color: b.kind==='regular'?'var(--accent-hover)':'var(--muted-foreground)', background: b.kind==='regular'?'var(--accent-muted)':'var(--surface-elevated)', border:'1px solid var(--border-subtle)' }}>{b.kind==='regular'?'정기':'단발'}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* NOW line */}
        {showNow && (
          <div style={{ position:'absolute', top:nowTop, left:0, right:0, height:0, zIndex:7, pointerEvents:'none', display:'flex', alignItems:'center' }}>
            <div style={{ position:'absolute', left:0, right:0, top:0, borderTop:`2px solid var(--accent)` }}></div>
            <span className="mono" style={{
              position:'sticky', left:4, zIndex:8, fontSize:9, letterSpacing:'0.08em',
              background:'var(--accent)', color:'#0E1626', padding:'1px 5px', borderRadius:3, fontWeight:700,
            }}>NOW {String(now.hour).padStart(2,'0')}:{String(now.minute).padStart(2,'0')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// read-only wrapper (home preview) — 현재 운영 기간 기준
function TimetableGrid({ compact }: { compact?: boolean }) {
  const cur = TTS.activeTerm(TTS.loadTerms());
  const hours = hoursForType(cur ? cur.type : 'semester');
  return <Grid hours={hours} compact={compact} bookings={BOOKINGS} canSelect={false} isCurrent={true} events={ROOM_EVENTS} />;
}

// ───── reservation modal ─────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize:12, fontWeight:600, color:'var(--muted-foreground)', marginBottom:8, fontFamily:'var(--font-sans)' }}>{label}</div>
      {children}
    </div>
  );
}
function KindToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts: [string, string, string][] = [['regular','정기 합주','매주 반복'],['oneoff','단발성','이번 주 1회']];
  return (
    <div style={{ display:'flex', gap:8 }}>
      {opts.map(([k,l,sub]) => {
        const on = value===k;
        return (
          <button key={k} onClick={()=>onChange(k)} style={{
            flex:1, padding:'11px 12px', borderRadius:9, textAlign:'left', transition:'all .14s',
            border:`1px solid ${on?'var(--accent)':'var(--border)'}`, background: on?'var(--accent-muted)':'transparent',
          }}>
            <div style={{ fontSize:13.5, fontWeight:700, fontFamily:'var(--font-sans)', color: on?'var(--accent-hover)':'var(--foreground)' }}>{l}</div>
            <div className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)', marginTop:3 }}>{sub}</div>
          </button>
        );
      })}
    </div>
  );
}

interface ReserveModalProps {
  slot: Selection;
  wf: WeekDay[] | null;
  onClose: () => void;
  onConfirm: (bkObj: Booking) => void;
}
function ReserveModal({ slot, wf, onClose, onConfirm }: ReserveModalProps) {
  const myTeams = MY_TEAM_IDS.map(id => teamById(id)!);
  const [teamId, setTeamId] = useState(myTeams[0].id);
  const [kind, setKind] = useState<Booking['kind']>('regular');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', onKey); document.body.style.overflow='hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow=''; };
  }, [onClose]);
  const len = slot.hi - slot.lo + 1;
  return ReactDOM.createPortal((
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()} style={{ maxWidth:440 }}>
        <button onClick={onClose} className="modal-close" aria-label="닫기"><Icons.x size={18} /></button>
        <UI.Kicker>합주 예약</UI.Kicker>
        <h2 style={{ margin:'12px 0 0', fontFamily:'var(--font-sans)', fontWeight:700, fontSize:22, letterSpacing:'-0.02em' }}>합주실 A 예약</h2>

        {/* slot summary */}
        <div style={{ margin:'18px 0 22px', padding:'15px 17px', borderRadius:10, background:'var(--surface-elevated)', border:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:13 }}>
          <span style={{ color:'var(--accent-hover)', flex:'0 0 auto' }}><Icons.clock size={20} /></span>
          <div>
            <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:16 }}>{DAYS[slot.day]}요일 · {Number((wf && wf[slot.day] ? wf[slot.day].mm : '06'))}월 {(wf && wf[slot.day] ? wf[slot.day].dd : DAY_DATES[slot.day])}일</div>
            <div className="mono" style={{ fontSize:12.5, color:'var(--accent-hover)', marginTop:3 }}>{fmtHour(slot.lo)}–{fmtHour(slot.hi+1)} · {len}시간</div>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <Field label="팀 선택">
            {myTeams.length > 1 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {myTeams.map(t => {
                  const on = teamId===t.id;
                  return (
                    <button key={t.id} onClick={()=>setTeamId(t.id)} style={{
                      display:'flex', alignItems:'center', gap:11, padding:'11px 13px', borderRadius:9, textAlign:'left', transition:'all .14s',
                      border:`1px solid ${on?t.hue:'var(--border)'}`, background: on?hexA(t.hue,0.1):'transparent',
                    }}>
                      <span style={{ width:8, height:8, borderRadius:2, background:t.hue, flex:'0 0 auto' }}></span>
                      <span style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:14, color: on?'var(--foreground)':'var(--muted-foreground)' }}>{t.name}</span>
                      {on && <span style={{ marginLeft:'auto', color:t.hue, display:'flex' }}><Icons.check size={16} /></span>}
                    </button>
                  );
                })}
              </div>
            ) : <div className="mono" style={{ fontSize:13, color:'var(--muted-foreground)' }}>{myTeams[0].name}</div>}
          </Field>

          <Field label="합주 유형">
            <KindToggle value={kind} onChange={v => setKind(v as Booking['kind'])} />
          </Field>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button className="btn btn-primary" style={{ flex:1, justifyContent:'center', padding:'13px' }}
            onClick={()=>onConfirm({ id:'u'+Date.now(), day:slot.day, start:slot.lo, len, team:teamId, kind })}>
            <Icons.check size={16} />예약 신청
          </button>
          <button className="btn" onClick={onClose} style={{ padding:'13px 22px' }}>취소</button>
        </div>
      </div>
    </div>
  ), document.body);
}

// ───── edit modal (existing booking) ─────
interface EditModalProps {
  booking: Booking;
  hours: HourConfig;
  events: RoomEvent[];
  bookings: Booking[];
  onClose: () => void;
  onSave: (bkObj: Booking, scope: string) => void;
  onDelete: (id: string, scope: string) => void;
}
function EditModal({ booking, hours, events, bookings, onClose, onSave, onDelete }: EditModalProps) {
  const t = teamById(booking.team)!;
  const mine = MY_TEAM_IDS.includes(booking.team);
  const [scope, setScope] = useState('week');   // 'all' | 'week' — 정기 합주 변경 대상
  const [start, setStart] = useState(booking.start);
  const [len, setLen] = useState(booking.len);
  const [confirmDel, setConfirmDel] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', onKey); document.body.style.overflow='hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow=''; };
  }, [onClose]);
  const others = bookings.filter(b => b.id!==booking.id);
  const slotFree = (d: number, h: number) => !isClosed(hours,d,h) && !eventAt(events,d,h) && !bookingAt(others,d,h);
  const canStartDown = start>dayOpen(hours,booking.day) && slotFree(booking.day, start-1);
  const canEndUp = (start+len) < dayClose(hours,booking.day) && slotFree(booking.day, start+len);
  const canEndDown = len>1;
  return ReactDOM.createPortal((
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()} style={{ maxWidth:440 }}>
        <button onClick={onClose} className="modal-close" aria-label="닫기"><Icons.x size={18} /></button>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ width:9, height:30, borderRadius:2, background:t.hue, flex:'0 0 auto' }}></span>
          <div>
            <UI.Kicker>{mine ? '합주 일정 수정' : '합주 정보'}</UI.Kicker>
            <h2 style={{ margin:'8px 0 0', fontFamily:'var(--font-sans)', fontWeight:700, fontSize:21, letterSpacing:'-0.02em' }}>{t.name}</h2>
          </div>
        </div>

        <div style={{ margin:'18px 0', padding:'14px 16px', borderRadius:10, background:'var(--surface-elevated)', border:'1px solid var(--border-subtle)' }}>
          <div className="mono" style={{ fontSize:10, letterSpacing:'0.12em', color:'var(--subtle-foreground)', textTransform:'uppercase' }}>{DAYS[booking.day]}요일 · 합주실 A</div>
          <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:19, marginTop:5 }}>{fmtHour(start)} – {fmtHour(start+len)} <span style={{ fontSize:13, color:'var(--muted-foreground)', fontWeight:400 }}>· {len}시간</span></div>
        </div>

        {!mine ? (
          <div className="mono" style={{ fontSize:12.5, color:'var(--subtle-foreground)', padding:'2px 0 4px' }}>
            다른 팀의 합주는 수정할 수 없어요. 우리 팀(팀장·부팀장) 합주만 변경 가능합니다.
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {booking.kind==='regular' ? (
              <Field label="변경 대상">
                <div style={{ display:'flex', gap:8 }}>
                  {([['week','이번 주만','이번 회차만 적용'],['all','정기 전체','매주 반복 전체']] as [string,string,string][]).map(([k,l,sub]) => {
                    const on = scope===k;
                    return (
                      <button key={k} onClick={()=>setScope(k)} style={{
                        flex:1, padding:'11px 12px', borderRadius:9, textAlign:'left', transition:'all .14s',
                        border:`1px solid ${on?'var(--accent)':'var(--border)'}`, background: on?'var(--accent-muted)':'transparent',
                      }}>
                        <div style={{ fontSize:13.5, fontWeight:700, fontFamily:'var(--font-sans)', color: on?'var(--accent-hover)':'var(--foreground)' }}>{l}</div>
                        <div className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)', marginTop:3 }}>{sub}</div>
                      </button>
                    );
                  })}
                </div>
              </Field>
            ) : (
              <div className="mono" style={{ fontSize:11.5, color:'var(--subtle-foreground)', display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ fontSize:9, padding:'2px 7px', borderRadius:3, color:'var(--muted-foreground)', background:'var(--surface-elevated)', border:'1px solid var(--border-subtle)' }}>단발</span>
                이번 회차 1회성 합주입니다.
              </div>
            )}
            <Field label="시간 변경">
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:140, padding:'10px 12px', borderRadius:9, border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)' }}>시작 {fmtHour(start)}</span>
                  <span style={{ display:'flex', gap:4 }}>
                    <button className="step-btn" disabled={!canStartDown} onClick={()=>{ setStart(s=>s-1); setLen(l=>l+1); }}>−</button>
                    <button className="step-btn" disabled={len<=1} onClick={()=>{ setStart(s=>s+1); setLen(l=>l-1); }}>+</button>
                  </span>
                </div>
                <div style={{ flex:1, minWidth:140, padding:'10px 12px', borderRadius:9, border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)' }}>종료 {fmtHour(start+len)}</span>
                  <span style={{ display:'flex', gap:4 }}>
                    <button className="step-btn" disabled={!canEndDown} onClick={()=>setLen(l=>l-1)}>−</button>
                    <button className="step-btn" disabled={!canEndUp} onClick={()=>setLen(l=>l+1)}>+</button>
                  </span>
                </div>
              </div>
            </Field>

            {/* save / delete */}
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:'center', padding:'12px' }}
                onClick={()=>onSave({ ...booking, start, len }, scope)}><Icons.check size={16} />저장</button>
              <button className="btn" onClick={onClose} style={{ padding:'12px 20px' }}>취소</button>
            </div>
            <div style={{ borderTop:'1px solid rgba(224,138,138,0.2)', paddingTop:16 }}>
              {!confirmDel ? (
                <button className="btn" onClick={()=>setConfirmDel(true)} style={{ borderColor:'rgba(224,138,138,0.4)', color:'#E08A8A' }}><Icons.ban size={15} />합주 취소 (삭제)</button>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10, padding:14, borderRadius:10, background:'rgba(224,138,138,0.07)', border:'1px solid rgba(224,138,138,0.3)' }}>
                  <span style={{ fontSize:13, color:'#E08A8A', fontWeight:600 }}>이 합주 일정을 취소할까요?
                    <span style={{ fontWeight:400, color:'var(--muted-foreground)', fontSize:12 }}> {booking.kind==='regular' ? (scope==='all'?'(정기 합주 전체가 삭제됩니다)':'(이번 주 합주만 취소되고 정기 일정은 유지됩니다)') : '(이번 회차가 삭제됩니다)'}</span>
                  </span>
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="btn" onClick={()=>onDelete(booking.id, scope)} style={{ borderColor:'#E08A8A', color:'#E08A8A' }}>삭제 확인</button>
                    <button className="btn" onClick={()=>setConfirmDel(false)}>유지</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  ), document.body);
}

// ───── full timetable screen ─────
function TimetableScreen() {
  // 운영자 설정(학기·방학 기간, 운영시간)을 읽어 현재/다음 기간 시간표를 구성한다
  const terms = React.useMemo(() => TTS.loadTerms(), []);
  const hoursCfg = React.useMemo(() => TTS.loadHours(), []);
  const current = React.useMemo(() => TTS.activeTerm(terms), [terms]);
  const upcoming = React.useMemo(() => TTS.upcomingTerms(terms), [terms]);
  const tabs = React.useMemo(() => [...(current ? [current] : []), ...upcoming], [current, upcoming]);

  const [role, setRole] = useState('leader');      // 'leader' | 'member'
  const [termId, setTermId] = useState<string | null>(() => current ? current.id : (tabs[0] ? tabs[0].id : null));
  const [sel, setSel] = useState<Selection | null>(null);
  const [reserving, setReserving] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  // 기간별 예약 목록 — 현재 기간은 기존 합주 데이터, 다음 기간은 빈 시간표에서 시작
  const [bookingsByTerm, setBookingsByTerm] = useState<Record<string, Booking[]>>(() => current ? { [current.id]: BOOKINGS } : {});

  const term = tabs.find(t => t.id === termId) || tabs[0] || null;

  if (!term) {
    return (
      <div className="screen-in" style={{ display:'flex', flexDirection:'column', gap:24 }}>
        <div>
          <UI.Kicker>합주실 A</UI.Kicker>
          <h1 className="display" style={{ margin:'14px 0 0', fontSize:60 }}>TIMETABLE</h1>
        </div>
        <div className="card" style={{ padding:'48px 28px', textAlign:'center', border:'1px dashed var(--border)', background:'transparent' }}>
          <div style={{ display:'inline-flex', width:50, height:50, borderRadius:13, alignItems:'center', justifyContent:'center', color:'var(--subtle-foreground)', border:'1px solid var(--border-subtle)' }}><Icons.calendar size={23} /></div>
          <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:18, marginTop:15 }}>운영 중인 기간이 없어요</div>
          <div className="mono" style={{ fontSize:12, color:'var(--subtle-foreground)', marginTop:8 }}>운영자가 학기·방학 기간을 등록하면 시간표가 표시됩니다</div>
        </div>
      </div>
    );
  }

  const isCurrent = !!(current && term.id === current.id);
  const hours = hoursCfg[term.type] ?? hoursCfg.semester;
  const events = isCurrent ? ROOM_EVENTS : [];
  const wf = isCurrent ? TTS.weekFull(TTS.TT_ANCHOR_MON) : TTS.weekFull(TTS.mondayOf(term.start));
  const weekDates = wf.map(x => x.dd);
  const bk = TTS.bookingState(term);
  const canSelect = role === 'leader' && bk.open;

  const bookings = bookingsByTerm[term.id] || (isCurrent ? BOOKINGS : []);
  const setTermBookings = (updater: (cur: Booking[]) => Booking[]) => setBookingsByTerm(prev => {
    const cur = prev[term.id] || (isCurrent ? BOOKINGS : []);
    return { ...prev, [term.id]: updater(cur) };
  });

  const selectTerm = (id: string) => { setTermId(id); setSel(null); setReserving(false); setEditing(null); };

  const onCell = (day: number, hour: number) => {
    if (sel && sel.day===day && (hour===sel.anchor+1 || hour===sel.anchor-1)) {
      const lo = Math.min(sel.anchor, hour), hi = Math.max(sel.anchor, hour);
      if (cellFree(hours, events, bookings, day, lo) && cellFree(hours, events, bookings, day, hi)) {
        setSel({ day, anchor: sel.anchor, lo, hi });
        return;
      }
    }
    if (sel && sel.day===day && sel.lo===sel.hi && sel.lo===hour) { setSel(null); return; }
    setSel({ day, anchor: hour, lo: hour, hi: hour });
  };
  const reserve = (bkObj: Booking) => { setTermBookings(list => [...list, bkObj]); setReserving(false); setSel(null); };
  const saveEdit = (bkObj: Booking) => { setTermBookings(list => list.map(b => b.id===bkObj.id ? bkObj : b)); setEditing(null); };
  const del = (id: string) => { setTermBookings(list => list.filter(b => b.id!==id)); setEditing(null); };

  const total = bookings.length;
  const totalHours = bookings.reduce((a,b)=>a+b.len,0);
  const regulars = bookings.filter(b=>b.kind==='regular').length;

  const fmtMD = (iso: string) => { const p = iso.split('-'); return `${Number(p[1])}월 ${Number(p[2])}일`; };
  const hoursSummary = `평일 ${fmtHour(hours.weekdayOpen)}–${fmtHour(hours.weekdayClose)} · 주말 ${fmtHour(hours.weekendOpen)}–${fmtHour(hours.weekendClose)}`;
  const dBadge = (bk.dLeft ?? 0) > 0 ? `D-${bk.dLeft}` : ((bk.dLeft ?? 0) === 0 ? '오늘' : '오픈 예정');

  return (
    <div className="screen-in" style={{ display:'flex', flexDirection:'column', gap:22 }}>
      {/* hero */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
        <div>
          <UI.Kicker>합주실 A · {isCurrent ? '현재 기간' : '예정 기간'}</UI.Kicker>
          <h1 className="display" style={{ margin:'14px 0 0', fontSize:60 }}>TIMETABLE</h1>
          <p style={{ margin:'10px 0 0', color:'var(--muted-foreground)', fontSize:14 }}>
            {term.label} · {fmtMD(term.start)} — {fmtMD(term.end)}{isCurrent ? ' · 이번 주' : ' · 첫 주 미리보기'}
          </p>
        </div>
        <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', textAlign:'right' }}>
          <div style={{ letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5 }}>{term.type==='semester' ? '학기중' : '방학중'} 운영시간</div>
          {hoursSummary}
        </div>
      </div>

      {/* 기간 전환 탭 (현재 / 다음 기간) */}
      <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
        {tabs.map(t => {
          const on = t.id === termId;
          const cur = current && t.id === current.id;
          const tbk = TTS.bookingState(t);
          const status = cur ? '진행 중' : (tbk.open ? '예약 가능' : ((tbk.dLeft ?? 0)>0 ? `D-${tbk.dLeft}` : '오늘 오픈'));
          const statusOn = cur || tbk.open;
          return (
            <button key={t.id} onClick={()=>selectTerm(t.id)} style={{
              display:'flex', alignItems:'center', gap:11, padding:'11px 15px', borderRadius:10, textAlign:'left', transition:'all .14s',
              border:`1px solid ${on ? 'var(--accent)' : 'var(--border-subtle)'}`,
              background: on ? 'var(--accent-muted)' : 'var(--surface)',
            }}>
              <span style={{ flex:'0 0 auto', width:30, height:30, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color: on?'var(--accent-hover)':'var(--muted-foreground)', background: on?'var(--surface)':'var(--surface-elevated)', border:'1px solid var(--border-subtle)' }}>
                {t.type==='semester' ? <Icons.book size={15} /> : <Icons.spark size={15} />}
              </span>
              <div>
                <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:13.5, color: on?'var(--foreground)':'var(--muted-foreground)' }}>{t.label}</div>
                <div className="mono" style={{ display:'flex', alignItems:'center', gap:5, fontSize:9.5, marginTop:3, color: statusOn?'var(--accent-hover)':'var(--subtle-foreground)' }}>
                  {cur && <span className="dot" style={{ background:'var(--accent)' }}></span>}
                  {status} · {fmtMD(t.start)}–{fmtMD(t.end)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 예약 오픈 안내 배너 */}
      {!bk.open ? (
        <div className="card" style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:14, position:'relative', overflow:'hidden', borderColor:'var(--border-subtle)' }}>
          <span style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'var(--border)' }}></span>
          <span style={{ flex:'0 0 auto', width:42, height:42, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted-foreground)', background:'var(--surface-elevated)', border:'1px solid var(--border-subtle)' }}><Icons.clock size={20} /></span>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="mono" style={{ fontSize:9.5, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--subtle-foreground)' }}>합주 예약 준비 중</div>
            <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:14.5, marginTop:4, textWrap:'pretty' }}>
              이 기간 합주 예약은 {fmtMD(bk.openDate ?? '')}({bk.openWeekday}) {bk.openTime}에 열려요
            </div>
            <div className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)', marginTop:4 }}>지금은 시간표 미리보기만 제공됩니다 · 예약 시작 일시는 운영자가 설정합니다</div>
          </div>
          <span className="mono" style={{ flex:'0 0 auto', fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15, padding:'7px 12px', borderRadius:8, color:'var(--accent-hover)', background:'var(--accent-muted)', border:'1px solid color-mix(in oklab, var(--accent) 40%, transparent)' }}>{dBadge}</span>
        </div>
      ) : !isCurrent ? (
        <div className="card" style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:13, position:'relative', overflow:'hidden' }}>
          <span style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'var(--accent)' }}></span>
          <span style={{ flex:'0 0 auto', color:'var(--accent-hover)', display:'flex' }}><Icons.check size={18} /></span>
          <div style={{ fontSize:13, color:'var(--muted-foreground)', textWrap:'pretty' }}>
            <b style={{ color:'var(--foreground)', fontFamily:'var(--font-sans)' }}>예약이 열렸어요.</b> 다음 기간 합주를 미리 잡을 수 있습니다.
          </div>
        </div>
      ) : null}

      {/* role + legend */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, flexWrap:'wrap' }}>
          <span className="mono" style={{ fontSize:9.5, letterSpacing:'0.12em', color:'var(--subtle-foreground)', textTransform:'uppercase' }}>미리보기 권한</span>
          <div style={{ display:'flex', gap:3, padding:3, border:'1px solid var(--border-subtle)', borderRadius:7, background:'var(--surface)' }}>
            {([['leader','팀장·부팀장'],['member','일반 부원']] as [string,string][]).map(([k,l]) => (
              <button key={k} onClick={()=>{ setRole(k); setSel(null); }} className="mono" style={{
                fontSize:10.5, padding:'5px 10px', borderRadius:5, whiteSpace:'nowrap', transition:'all .14s',
                background: role===k?'var(--accent)':'transparent', color: role===k?'var(--accent-foreground)':'var(--muted-foreground)', fontWeight: role===k?700:400,
              }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', gap:13, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:18, height:10, borderRadius:2, background:'var(--accent-muted)', border:'1px solid var(--accent)' }}></span><span className="mono" style={{ fontSize:10.5, color:'var(--muted-foreground)' }}>정기</span></span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:18, height:10, borderRadius:2, background:'var(--surface-elevated)', border:'1px solid var(--border)' }}></span><span className="mono" style={{ fontSize:10.5, color:'var(--muted-foreground)' }}>단발</span></span>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:18, height:10, borderRadius:2, background:'rgba(224,138,138,0.15)', border:'1px solid rgba(224,138,138,0.5)' }}></span><span className="mono" style={{ fontSize:10.5, color:'var(--muted-foreground)' }}>행사</span></span>
        </div>
      </div>

      {/* helper hint */}
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12.5, color: canSelect?'var(--muted-foreground)':'var(--subtle-foreground)' }}>
        <span style={{ color:'var(--accent-hover)', display:'flex', flex:'0 0 auto' }}><Icons.clock size={15} /></span>
        {!bk.open ? '예약 오픈 일시 전까지는 시간표 조회만 가능해요.'
          : canSelect ? '빈 시간 블록을 클릭해 합주를 예약하세요. 같은 요일에서 연속 블록을 클릭하면 시간이 이어집니다.'
          : '일반 부원은 합주 일정을 조회만 할 수 있어요. (예약은 팀장·부팀장)'}
      </div>

      <Grid hours={hours} bookings={bookings} selection={sel} onCell={onCell} canSelect={canSelect}
        isCurrent={isCurrent} weekDates={weekDates} events={events}
        onBooking={(b)=>setEditing(b)} />

      {/* selection action bar */}
      {sel && (
        <div className="sel-actionbar" style={{ position:'sticky', bottom:16, zIndex:30, display:'flex', justifyContent:'center', pointerEvents:'none' }}>
          <div style={{ pointerEvents:'auto', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'12px 14px 12px 20px', borderRadius:12,
            background:'var(--surface-elevated)', border:'1px solid var(--accent)', boxShadow:'0 14px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div>
                <span className="mono" style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--subtle-foreground)', textTransform:'uppercase' }}>선택</span>
                <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:14.5, marginTop:2 }}>{DAYS[sel.day]}요일 {fmtHour(sel.lo)}–{fmtHour(sel.hi+1)} <span style={{ color:'var(--accent-hover)', fontSize:12.5 }}>· {sel.hi-sel.lo+1}시간</span></div>
              </div>
              <button className="btn btn-primary" onClick={()=>setReserving(true)}><Icons.plus size={15} />예약하기</button>
            </div>
            <button className="btn" onClick={()=>setSel(null)} style={{ padding:'9px 13px' }}><Icons.x size={15} /></button>
          </div>
        </div>
      )}

      {/* footer stat strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'var(--border-subtle)',
        border:'1px solid var(--border-subtle)', borderRadius:8, overflow:'hidden' }}>
        {([
          [String(total), isCurrent ? '이번 주 합주' : '예약된 합주','회'],
          [String(totalHours),'예약 시간','시간'],
          [String(regulars),'정기 합주','팀'],
        ] as [string,string,string][]).map(([v,l,u]) => (
          <div key={l} style={{ background:'var(--surface)', padding:'14px 10px', display:'flex', alignItems:'baseline', gap:6, minWidth:0 }}>
            <span className="display" style={{ fontSize:28, flex:'0 0 auto' }}>{v}</span>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:11, color:'var(--foreground)', fontFamily:'var(--font-sans)', fontWeight:600, wordBreak:'keep-all' }}>{l}</div>
              <div className="mono" style={{ fontSize:9, color:'var(--subtle-foreground)' }}>{u}</div>
            </div>
          </div>
        ))}
      </div>

      {reserving && sel && <ReserveModal slot={sel} wf={wf} onClose={()=>setReserving(false)} onConfirm={reserve} />}
      {editing && <EditModal booking={editing} hours={hours} events={events} bookings={bookings} onClose={()=>setEditing(null)} onSave={saveEdit} onDelete={del} />}
    </div>
  );
}

export const Timetable = { TimetableScreen, TimetableGrid, teamById, fmtHour };
