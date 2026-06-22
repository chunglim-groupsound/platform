'use client';
import React from 'react';
import { Icons } from '@/components/icons';
import { UI } from '@/components/shared-ui';
import { Timetable } from '@/components/timetable';
import { DATA } from '@/lib/mock-data';

// ═══════════════════════════════════════════════════════════════════════════
// 청림그룹사운드 리디자인
// 모듈: 홈 화면 (window.HomeScreens)
// 메인 파일에서 src="modules/07-home.jsx" 로 로드됨.
// 로드 순서가 의존성 순서입니다 (이 파일은 07/12 번째).
// ═══════════════════════════════════════════════════════════════════════════


// ───────────── HOME — 3 variations ─────────────
const D = DATA;
const UU = UI;
const TT = Timetable;

// compute now / next session on the live day
function nowNext() {
  const today = D.BOOKINGS.filter(b => b.day === D.NOW.day).sort((a,b)=>a.start-b.start);
  const current = today.find(b => D.NOW.hour >= b.start && D.NOW.hour < b.start + b.len);
  const next = today.find(b => b.start > D.NOW.hour);
  return {
    current: current && { ...current, team: TT.teamById(current.team)! },
    next: next && { ...next, team: TT.teamById(next.team)! },
  };
}

/* shared: now/next live strip */
function NowStrip({ go }: { go: (s: string) => void }) {
  const { current, next } = nowNext();
  return (
    <div className="card nowstrip" style={{ display:'flex', alignItems:'stretch', overflow:'hidden', cursor:'pointer' }} onClick={()=>go('timetable')}>
      <div style={{ flex:1, padding:'18px 22px', display:'flex', alignItems:'center', gap:16 }}>
        {current ? (
          <>
            <span className="dot dot-live" style={{ background:current.team.hue, flex:'0 0 auto' }}></span>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="mono" style={{ fontSize:10, letterSpacing:'0.16em', color:'#7FD8A8', textTransform:'uppercase' }}>지금 합주 중</div>
              <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:18, marginTop:3 }}>{current.team.name}</div>
            </div>
            <span className="mono" style={{ fontSize:12, color:'var(--muted-foreground)' }}>{TT.fmtHour(current.start)}–{TT.fmtHour(current.start+current.len)}</span>
          </>
        ) : (
          <span style={{ color:'var(--muted-foreground)', fontSize:14 }}>지금은 예약된 합주가 없어요.</span>
        )}
      </div>
      {next && (
        <div style={{ padding:'18px 22px', borderLeft:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:14, background:'var(--surface)' }}>
          <div style={{ textAlign:'right' }}>
            <div className="mono" style={{ fontSize:10, letterSpacing:'0.16em', color:'var(--subtle-foreground)', textTransform:'uppercase' }}>다음</div>
            <div style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:14, marginTop:3 }}>{next.team.name}</div>
          </div>
          <span className="mono" style={{ fontSize:12, color:next.team.hue }}>{TT.fmtHour(next.start)}</span>
        </div>
      )}
    </div>
  );
}

/* shared: active teams ledger */
function TeamLedger({ go, max = 5 }: { go: (s: string) => void; max?: number }) {
  const teams = D.TEAMS.filter(t=>t.active).slice(0, max || 5);
  return (
    <div style={{ border:'1px solid var(--border-subtle)', borderRadius:8, overflow:'hidden' }}>
      {teams.map((t,i) => (
        <div key={t.id} onClick={()=>go('teams')} style={{
          display:'flex', alignItems:'center', gap:16, padding:'15px 20px', cursor:'pointer',
          borderTop: i>0 ? '1px solid var(--border-subtle)':'none', transition:'background .14s',
        }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--surface-elevated)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <span style={{ width:8, height:28, borderRadius:2, background:t.hue, flex:'0 0 auto' }}></span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15.5 }}>{t.name}</div>
            <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:2 }}>팀장 {t.leader} · {t.members}명</div>
            <div className="mono" style={{ fontSize:12, color:'var(--muted-foreground)', marginTop:3 }}>
              {t.song ? '♪ ' + t.song : '연습곡 미정'}
            </div>
          </div>
          <UU.RecruitBadge recruiting={t.recruiting} />
        </div>
      ))}
    </div>
  );
}

/* ===== VARIANT C — CONSOLE ===== */
function HomeConsole({ go }: { go: (s: string) => void }) {
  return (
    <div className="screen-in" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* compact top bar */}
      <div className="card" style={{ padding:'22px 26px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:24, flexWrap:'wrap' }}>
        <div>
          <UU.Kicker>청림그룹사운드</UU.Kicker>
          <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:24, marginTop:10, letterSpacing:'-0.02em', whiteSpace:'nowrap' }}>
            안녕하세요, <span style={{color:'var(--accent-hover)'}}>{D.ME?.nick}</span>님
          </div>
        </div>
        <div style={{ display:'flex', gap:28 }}>
          <UU.Stat value={D.STATS.members} label="부원" accent />
          <UU.Stat value={D.STATS.teams} label="팀" />
          <UU.Stat value="14" label="주간 합주" />
        </div>
      </div>

      <NowStrip go={go} />

      {/* 2-col: timetable peek + notices feed */}
      <div style={{ display:'grid', gridTemplateColumns:'1.35fr 1fr', gap:20 }} className="console-grid">
        <div>
          <UU.SectionHead kicker="타임테이블 현황" title="이번 주" action="전체" onAction={()=>go('timetable')} />
          <TT.TimetableGrid compact />
        </div>
        <div>
          <UU.SectionHead kicker="동아리 소식" title="게시판" action="전체" onAction={()=>go('notices')} />
          <div style={{ border:'1px solid var(--border-subtle)', borderRadius:8, overflow:'hidden' }}>
            {D.NOTICES.slice(0,5).map((n,i) => (
              <div key={n.id} onClick={()=>go('notices')} style={{ padding:'15px 18px', borderTop:i>0?'1px solid var(--border-subtle)':'none', cursor:'pointer', display:'flex', flexDirection:'column', gap:6 }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--surface-elevated)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {n.pinned && <span style={{ color:'var(--accent)' }}><Icons.pin size={13} /></span>}
                  <span className="mono" style={{ fontSize:9.5, letterSpacing:'0.08em', color:'var(--subtle-foreground)', textTransform:'uppercase' }}>{n.tag}</span>
                  <span className="mono" style={{ fontSize:9.5, color:'var(--subtle-foreground)', marginLeft:'auto' }}>{n.date}</span>
                </div>
                <div style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:13.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{n.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <UU.SectionHead kicker="합주 중인 팀" title="활동 팀" action="전체 보기" onAction={()=>go('teams')} />
        <TeamLedger go={go} />
      </div>
    </div>
  );
}

export const Home = { HomeConsole };


