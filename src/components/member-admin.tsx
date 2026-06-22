'use client';
import React from 'react';
import * as ReactDOM from 'react-dom';
import { Icons } from '@/components/icons';
import { UI } from '@/components/shared-ui';
import { DATA, RoleStore } from '@/lib/mock-data';

// ═══════════════════════════════════════════════════════════════════════════
// 청림그룹사운드 리디자인
// 모듈: 부원 관리 콘솔 + CSV 마이그레이션 (운영진)
// 메인 파일에서 src="modules/11-member-admin.jsx" 로 로드됨.
// 로드 순서가 의존성 순서입니다 (이 파일은 11/12 번째).
// ═══════════════════════════════════════════════════════════════════════════


// ═════════════ 부원 관리 (MEMBER ADMIN CONSOLE) ═════════════
const { useState, useEffect, useRef, useMemo } = React;
const D = DATA;
const UU = UI;
const RS = RoleStore;
const MEMBERS = D.MEMBERS;
const TEAMS = D.TEAMS;

const STATUS_CFG = {
  ACTIVE:    { label:'정식',  color:'#7FD8A8', bg:'rgba(127,216,168,0.1)',  bd:'rgba(127,216,168,0.3)' },
  PROBATION: { label:'수습',  color:'var(--accent-hover)', bg:'var(--accent-muted)', bd:'color-mix(in oklab, var(--accent) 40%, transparent)' },
  INACTIVE:  { label:'정지',  color:'var(--muted-foreground)', bg:'transparent', bd:'var(--border)' },
  WITHDRAWN: { label:'제적',  color:'#E08A8A', bg:'rgba(224,138,138,0.08)', bd:'rgba(224,138,138,0.3)' },
};
const RED = '#E08A8A';
type MemberType = (typeof MEMBERS)[0];
type LogEntry = { key: string; name: string; action: string; detail: string; tone: string; ts: string };
const teamOf = (m: MemberType) => m.teamId ? TEAMS.find(t=>t.id===m.teamId) : null;

// ───────── STORE ─────────
const MAStore = (function(){
  const listeners = new Set<() => void>();
  const log: LogEntry[] = [];
  const emit = () => listeners.forEach(l=>l());
  const find = (id: string) => MEMBERS.find(m=>m.id===id);
  const today = '2026.06.13';
  const note = (m: MemberType | undefined, action: string, detail: string, tone: string) => {
    if (!m) return;
    log.unshift({ key:Math.random().toString(36).slice(2), name:(m as { nick?: string; name: string }).nick||m.name, action, detail, tone:tone||'neutral', ts:'방금 전' });
    if (log.length > 30) log.pop();
  };
  return {
    log: () => log,
    subscribe(l: () => void){ listeners.add(l); return ()=>listeners.delete(l); },
    setWhitelist(ids: string[], val: boolean){
      let n=0; ids.forEach(id=>{ const m=find(id); if(m){ const mm = m as { whitelist?: boolean }; if(mm.whitelist!==val){ mm.whitelist=val; n++; }}});
      if(n){ const m=find(ids[0]); note(m, '화이트리스트', (ids.length>1?`${n}명 `:'')+(val?'지정':'해제'), 'accent'); emit(); }
    },
    addWarning(ids: string[], reason: string){
      ids.forEach(id=>{ const m=find(id); if(m){ const mm = m as { warnings?: { reason: string; date: string; issuer: string }[]; nick?: string }; mm.warnings=[{ reason:(reason||'').trim()||'사유 미기재', date:today, issuer:'나' }, ...(mm.warnings||[])]; note(m, '경고 부여', `${mm.warnings.length}회차 · ${(reason||'').trim()||'사유 미기재'}`, 'warn'); }});
      emit();
    },
    removeWarning(id: string, idx: number){ const m=find(id); if(m){ const mm = m as { warnings?: unknown[] }; mm.warnings=(mm.warnings||[]).filter((_,i)=>i!==idx); note(m,'경고 취소','', 'neutral'); emit(); } },
    setStatus(ids: string[], status: string, reason?: string){
      ids.forEach(id=>{ const m=find(id); if(m && m.role!=='SUPER_ADMIN' && !m.me){ (m as { status?: string }).status=status; note(m, '상태 변경', STATUS_CFG[status as keyof typeof STATUS_CFG].label + (reason?` · ${reason}`:''), status==='WITHDRAWN'?'danger':status==='INACTIVE'?'warn':'good'); }});
      emit();
    },
    promote(id: string){ const m=find(id); if(m && !m.role){ m.role='ADMIN'; note(m,'운영진 위임','일반 부원 → 운영진','accent'); emit(); } },
    demote(id: string){ const m=find(id); if(m && m.role==='ADMIN'){ m.role=null; (m as { adminRole?: string | null }).adminRole=null; note(m,'운영진 해제','운영진 → 일반 부원','neutral'); emit(); } },
    setOfficer(id: string, title: string){ RS.setRole(id, title); const m=find(id); if(m){ note(m,'직책 지정', title||'일반 운영진','accent'); } },
    bulkImport(newMembers: MemberType[]){
      newMembers.forEach(m => MEMBERS.push(m));
      if(newMembers.length){
        log.unshift({ key:Math.random().toString(36).slice(2), name:`${newMembers.length}명`, action:'CSV 마이그레이션', detail:`기존 부원 ${newMembers.length}명 등록`, tone:'accent', ts:'방금 전' });
        if(log.length > 30) log.pop();
        emit();
      }
      return newMembers.length;
    },
  };
})();

function useMA(){
  const [,f] = useState(0);
  useEffect(()=>{
    const u1 = MAStore.subscribe(()=>f(x=>x+1));
    const u2 = RS.subscribe(()=>f(x=>x+1));
    return ()=>{ u1(); u2(); };
  },[]);
}

// ───────── SMALL PARTS ─────────
function StatusBadge({ status }: { status: string }){
  const c = STATUS_CFG[status as keyof typeof STATUS_CFG] || STATUS_CFG.ACTIVE;
  return <span className="mono" style={{ fontSize:10, letterSpacing:'0.05em', padding:'3px 8px', borderRadius:4, color:c.color, background:c.bg, border:`1px solid ${c.bd}`, whiteSpace:'nowrap' }}>{c.label}</span>;
}
function RoleTag({ m }: { m: MemberType }){
  const label = RS.label(m);
  if(!label) return <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)' }}>일반 부원</span>;
  const dev = m.role==='SUPER_ADMIN';
  return <span className="mono" style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10.5, fontWeight:700, letterSpacing:'0.03em', padding:'3px 9px', borderRadius:20,
    color: dev?'#9FB4D6':'var(--accent-hover)', background: dev?'rgba(159,180,214,0.1)':'var(--accent-muted)', border:`1px solid ${dev?'rgba(159,180,214,0.32)':'color-mix(in oklab, var(--accent) 38%, transparent)'}` }}>
    {dev ? <Icons.shield size={11}/> : <Icons.crown size={11}/>}{label}</span>;
}
function WLStar({ on }: { on: boolean }){
  return on
    ? <span title="화이트리스트" style={{ color:'#E8C463', fontSize:14, lineHeight:1 }}>★</span>
    : <span style={{ color:'var(--subtle-foreground)', fontSize:13, lineHeight:1 }}>—</span>;
}
function Check({ on, indeterminate }: { on?: boolean; indeterminate?: boolean }){
  return <span className="ma-check" data-on={on||indeterminate}>{on ? <Icons.check size={12}/> : indeterminate ? <span style={{ width:8, height:2, background:'currentColor', borderRadius:2 }}></span> : null}</span>;
}

// ───────── MAIN SCREEN ─────────
const STATUS_FILTERS: [string, string][] = [['all','전체'],['ACTIVE','정식'],['PROBATION','수습'],['INACTIVE','정지'],['WITHDRAWN','제적']];
const ROLE_FILTERS: [string, string][] = [['all','전체'],['officer','운영진'],['member','일반 부원']];
const SORTS: [string, string][] = [['gen','기수순'],['name','이름순'],['warn','경고순']];

/* windowed pager (전역 Pagination 과 동일한 .pager 스타일 재사용) */
function MAPagination({ page, pageCount, onChange, windowSize = 5 }: { page: number; pageCount: number; onChange: (p: number) => void; windowSize?: number }) {
  if (pageCount <= 1) return null;
  const block = Math.floor(page / windowSize);
  const start = block * windowSize;
  const end = Math.min(start + windowSize, pageCount);
  const nums = [];
  for (let i = start; i < end; i++) nums.push(i);
  const hasPrevBlock = start > 0;
  const hasNextBlock = end < pageCount;
  const Cell = ({ children, disabled, onClick, active, label, glyph }: { children?: React.ReactNode; disabled?: boolean; onClick?: () => void; active?: boolean; label?: string; glyph?: boolean }) => (
    <button aria-label={label} aria-current={active ? 'page' : undefined}
      disabled={disabled} onClick={disabled ? undefined : onClick}
      className="pager-cell mono" data-active={active ? 'true' : undefined}
      data-glyph={glyph ? 'true' : undefined}>
      {children}
    </button>
  );
  return (
    <nav className="pager" aria-label="페이지">
      <Cell glyph label="첫 페이지" disabled={page === 0} onClick={() => onChange(0)}>«</Cell>
      <Cell glyph label="이전 묶음" disabled={!hasPrevBlock} onClick={() => onChange(start - 1)}>‹</Cell>
      {nums.map(i => (
        <Cell key={i} label={`${i + 1} 페이지`} active={i === page} onClick={() => onChange(i)}>{i + 1}</Cell>
      ))}
      <Cell glyph label="다음 묶음" disabled={!hasNextBlock} onClick={() => onChange(end)}>›</Cell>
      <Cell glyph label="마지막 페이지" disabled={page === pageCount - 1} onClick={() => onChange(pageCount - 1)}>»</Cell>
    </nav>
  );
}

function MemberAdminScreen(){
  useMA();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');
  const [onlyWL, setOnlyWL] = useState(false);
  const [onlyWarn, setOnlyWarn] = useState(false);
  const [sort, setSort] = useState('gen');
  const [page, setPage] = useState(0);
  const PER_PAGE = 12;
  const [sel, setSel] = useState<Set<string>>(()=>new Set());
  const [open, setOpen] = useState<string | null>(null);
  const [bulk, setBulk] = useState<string | null>(null);

  const filtered = useMemo(()=>{
    const term = q.trim().toLowerCase();
    let list = MEMBERS.filter(m=>{
      const mm = m as { status?: string; whitelist?: boolean; warnings?: unknown[] };
      if(status!=='all' && mm.status!==status) return false;
      if(role==='officer' && !RS.isOfficer(m)) return false;
      if(role==='member' && RS.isOfficer(m)) return false;
      if(onlyWL && !mm.whitelist) return false;
      if(onlyWarn && !(mm.warnings&&mm.warnings.length)) return false;
      if(term){
        const hay = `${m.name} ${m.nick||''} ${m.dept||''} ${(m.session||[]).join(' ')}`.toLowerCase();
        if(!hay.includes(term)) return false;
      }
      return true;
    });
    list = list.slice().sort((a,b)=>{
      if(sort==='name') return a.name.localeCompare(b.name,'ko');
      if(sort==='warn') return (b.warnings?.length||0)-(a.warnings?.length||0) || a.gen-b.gen;
      return a.gen-b.gen || a.name.localeCompare(b.name,'ko');
    });
    return list;
  }, [q,status,role,onlyWL,onlyWarn,sort, MEMBERS.map(m=>{ const mm=m as {status?:string;whitelist?:boolean;warnings?:unknown[]}; return (mm.status??'')+String(mm.whitelist??'')+m.role+(mm.warnings?.length||0); }).join()]);

  const stats = useMemo(()=>({
    total: MEMBERS.length,
    officer: MEMBERS.filter(m=>RS.isOfficer(m)).length,
    wl: MEMBERS.filter(m=>(m as {whitelist?:boolean}).whitelist).length,
    warn: MEMBERS.filter(m=>{ const mm=m as {warnings?:unknown[]}; return mm.warnings&&mm.warnings.length; }).length,
    inactive: MEMBERS.filter(m=>(m as {status?:string}).status==='INACTIVE').length,
    withdrawn: MEMBERS.filter(m=>(m as {status?:string}).status==='WITHDRAWN').length,
  }), [MEMBERS.map(m=>{ const mm=m as {status?:string;whitelist?:boolean;warnings?:unknown[]}; return (mm.status??'')+String(mm.whitelist??'')+m.role+(mm.warnings?.length||0); }).join()]);

  const visibleIds = filtered.map(m=>m.id);
  const selVisible = visibleIds.filter(id=>sel.has(id));
  const allOn = visibleIds.length>0 && selVisible.length===visibleIds.length;
  const someOn = selVisible.length>0 && !allOn;

  // pagination — 필터/정렬이 바뀌면 첫 페이지로
  useEffect(()=>{ setPage(0); }, [q,status,role,onlyWL,onlyWarn,sort]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pageCount-1);
  const paged = filtered.slice(safePage*PER_PAGE, safePage*PER_PAGE + PER_PAGE);
  const toggleAll = () => setSel(prev=>{ const n=new Set(prev); if(allOn){ visibleIds.forEach(id=>n.delete(id)); } else { visibleIds.forEach(id=>n.add(id)); } return n; });
  const toggle = (id: string) => setSel(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const clearSel = () => setSel(new Set());

  const selArr = [...sel].filter(id=>MEMBERS.find(m=>m.id===id));
  const runBulk = (action: string) => {
    if(action==='wl-on'){ MAStore.setWhitelist(selArr, true); clearSel(); }
    else if(action==='wl-off'){ MAStore.setWhitelist(selArr, false); clearSel(); }
    else if(action==='reinstate'){ MAStore.setStatus(selArr, 'ACTIVE'); clearSel(); }
    else setBulk(action);   // warn / suspend / ban → confirm
  };

  const openMember = MEMBERS.find(m=>m.id===open) || null;

  return (
    <div className="screen-in" style={{ display:'flex', flexDirection:'column', gap:22 }}>
      {/* stat strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:1, background:'var(--border-subtle)', border:'1px solid var(--border-subtle)', borderRadius:9, overflow:'hidden' }}>
        <StatCell label="전체 부원" value={stats.total} />
        <StatCell label="운영진" value={stats.officer} accent />
        <StatCell label="화이트리스트" value={stats.wl} gold />
        <StatCell label="경고 보유" value={stats.warn} warn={stats.warn>0} />
        <StatCell label="정지" value={stats.inactive} />
        <StatCell label="제적" value={stats.withdrawn} danger={stats.withdrawn>0} />
      </div>

      {/* controls */}
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:'1 1 260px', minWidth:200 }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--subtle-foreground)' }}><Icons.search size={15}/></span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="이름 · 닉네임 · 학과 · 세션 검색"
              style={{ width:'100%', padding:'10px 12px 10px 36px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--foreground)', fontSize:13.5, boxSizing:'border-box' }} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span className="mono" style={{ fontSize:9.5, letterSpacing:'0.1em', color:'var(--subtle-foreground)', textTransform:'uppercase' }}>정렬</span>
            <div style={{ display:'flex', gap:3, padding:3, border:'1px solid var(--border-subtle)', borderRadius:7, background:'var(--surface)' }}>
              {SORTS.map(([k,l])=>(
                <button key={k} onClick={()=>setSort(k)} className="mono" style={{ fontSize:10.5, padding:'5px 10px', borderRadius:5, background: sort===k?'var(--accent)':'transparent', color: sort===k?'var(--accent-foreground)':'var(--muted-foreground)', fontWeight: sort===k?700:400, transition:'all .14s' }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <Segmented opts={STATUS_FILTERS} value={status} onChange={setStatus} />
          <span style={{ width:1, height:18, background:'var(--border-subtle)' }}></span>
          <Segmented opts={ROLE_FILTERS} value={role} onChange={setRole} />
          <span style={{ width:1, height:18, background:'var(--border-subtle)' }}></span>
          <QuickToggle on={onlyWL} onClick={()=>setOnlyWL(v=>!v)}>★ 화이트리스트</QuickToggle>
          <QuickToggle on={onlyWarn} onClick={()=>setOnlyWarn(v=>!v)} danger>경고 보유</QuickToggle>
        </div>
      </div>

      {/* table */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border-subtle)', borderRadius:11, overflow:'hidden' }}>
        <div className="ma-table-scroll">
          <div className="ma-table-inner">
            {/* head */}
            <div className="ma-row ma-head" style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', background:'var(--background)' }}>
              <button onClick={toggleAll} aria-label="전체 선택" style={{ display:'flex' }}><Check on={allOn} indeterminate={someOn} /></button>
              <span>부원</span><span>기수 · 세션</span><span>팀</span><span>직책</span><span>상태</span><span style={{ textAlign:'center' }}>경고</span><span style={{ textAlign:'center' }}>WL</span><span></span>
            </div>
            {/* rows */}
            {filtered.length===0 ? (
              <div style={{ padding:'48px 16px', textAlign:'center', color:'var(--subtle-foreground)', fontSize:13 }}>조건에 맞는 부원이 없습니다.</div>
            ) : paged.map(m=>(
              <MemberRow key={m.id} m={m} selected={sel.has(m.id)} onToggle={()=>toggle(m.id)} onOpen={()=>setOpen(m.id)} />
            ))}
          </div>
        </div>
        <div style={{ padding:'11px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid var(--border-subtle)' }}>
          <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)' }}>{filtered.length>0 ? `${safePage*PER_PAGE+1}–${Math.min((safePage+1)*PER_PAGE, filtered.length)} / ${filtered.length}명` : `0 / 전체 ${MEMBERS.length}명`}</span>
          {selArr.length>0 && <button onClick={clearSel} className="mono" style={{ fontSize:11, color:'var(--muted-foreground)' }}>선택 해제</button>}
        </div>
      </div>

      {/* pagination */}
      {pageCount>1 && (
        <div style={{ display:'flex', justifyContent:'center' }}>
          <MAPagination page={safePage} pageCount={pageCount} onChange={setPage} />
        </div>
      )}

      {/* recent action log */}
      <ActionLog />

      {/* bulk action bar */}
      {selArr.length>0 && <BulkBar count={selArr.length} onRun={runBulk} onClear={clearSel} />}

      {/* drawer */}
      {openMember && <MemberDrawer member={openMember} onClose={()=>setOpen(null)} />}

      {/* bulk confirm */}
      {bulk && <BulkConfirm action={bulk} ids={selArr} onDone={()=>{ setBulk(null); clearSel(); }} onCancel={()=>setBulk(null)} />}
    </div>
  );
}

function StatCell({ label, value, accent, gold, warn, danger }: { label: string; value: number; accent?: boolean; gold?: boolean; warn?: boolean; danger?: boolean }){
  const color = danger ? RED : warn ? 'var(--accent-hover)' : gold ? '#E8C463' : accent ? 'var(--accent-hover)' : 'var(--foreground)';
  return (
    <div style={{ background:'var(--surface)', padding:'15px 16px', display:'flex', flexDirection:'column', gap:6 }}>
      <span style={{ fontFamily:'var(--font-display)', fontSize:34, lineHeight:0.85, color }}>{value}</span>
      <span className="mono" style={{ fontSize:9.5, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted-foreground)' }}>{label}</span>
    </div>
  );
}

function Segmented({ opts, value, onChange }: { opts: [string, string][]; value: string; onChange: (v: string) => void }){
  return (
    <div style={{ display:'flex', gap:3, padding:3, border:'1px solid var(--border-subtle)', borderRadius:7, background:'var(--surface)' }}>
      {opts.map(([k,l])=>(
        <button key={k} onClick={()=>onChange(k)} style={{ fontSize:11.5, fontFamily:'var(--font-sans)', fontWeight: value===k?700:500, padding:'5px 11px', borderRadius:5, whiteSpace:'nowrap', transition:'all .14s',
          background: value===k?'var(--accent)':'transparent', color: value===k?'var(--accent-foreground)':'var(--muted-foreground)' }}>{l}</button>
      ))}
    </div>
  );
}
function QuickToggle({ on, onClick, danger, children }: { on: boolean; onClick: () => void; danger?: boolean; children: React.ReactNode }){
  return (
    <button onClick={onClick} className="mono" style={{ fontSize:11, padding:'6px 11px', borderRadius:6, transition:'all .14s', whiteSpace:'nowrap',
      border:`1px solid ${on ? (danger?'rgba(224,138,138,0.5)':'var(--accent)') : 'var(--border-subtle)'}`,
      background: on ? (danger?'rgba(224,138,138,0.1)':'var(--accent-muted)') : 'transparent',
      color: on ? (danger?RED:'var(--accent-hover)') : 'var(--muted-foreground)' }}>{children}</button>
  );
}

function MemberRow({ m, selected, onToggle, onOpen }: { m: MemberType; selected: boolean; onToggle: () => void; onOpen: () => void }){
  const team = teamOf(m);
  const mm = m as { warnings?: unknown[]; whitelist?: boolean; status?: string };
  const wc = (mm.warnings&&mm.warnings.length)||0;
  return (
    <div className="ma-row ma-body-row" data-sel={selected} onClick={onOpen}>
      <button onClick={e=>{ e.stopPropagation(); onToggle(); }} aria-label="선택" style={{ display:'flex' }}><Check on={selected} /></button>
      <div style={{ display:'flex', alignItems:'center', gap:11, minWidth:0 }}>
        <UU.Avatar name={m.name} size={34} hue={team?team.hue:undefined} />
        <div style={{ minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:13.5, whiteSpace:'nowrap' }}>{m.name}</span>
            {m.nick && <span className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', whiteSpace:'nowrap' }}>{m.nick}</span>}
            {m.me && <span className="mono" style={{ fontSize:9, color:'var(--accent-hover)', border:'1px solid color-mix(in oklab, var(--accent) 40%, transparent)', borderRadius:3, padding:'0 4px' }}>나</span>}
          </div>
          <div className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.dept}</div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
        <span className="mono" style={{ fontSize:11, color:'var(--muted-foreground)', flex:'0 0 auto' }}>{m.gen}기</span>
        <span style={{ display:'flex', gap:4, minWidth:0, overflow:'hidden' }}>
          {(m.session||[]).map(s=><span key={s} className="mono" style={{ fontSize:9.5, padding:'1px 5px', borderRadius:3, color:'var(--accent-hover)', border:'1px solid var(--border)', whiteSpace:'nowrap' }}>{s}</span>)}
        </span>
      </div>
      <div style={{ minWidth:0 }}>
        {team ? <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, color:'var(--foreground)', minWidth:0 }}><span style={{ width:7, height:7, borderRadius:2, background:team.hue, flex:'0 0 auto' }}></span><span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{team.name}</span></span> : <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)' }}>무소속</span>}
      </div>
      <div><RoleTag m={m} /></div>
      <div><StatusBadge status={mm.status ?? 'ACTIVE'} /></div>
      <div style={{ textAlign:'center' }}>{wc>0 ? <span className="mono" style={{ fontSize:11, fontWeight:700, color: wc>=3?RED:wc>=2?'var(--accent-hover)':'var(--muted-foreground)' }}>{wc}회</span> : <span style={{ color:'var(--subtle-foreground)' }}>—</span>}</div>
      <div style={{ textAlign:'center' }}><WLStar on={!!mm.whitelist} /></div>
      <div style={{ display:'flex', justifyContent:'flex-end', color:'var(--subtle-foreground)' }}><Icons.arrow size={15} /></div>
    </div>
  );
}

function BulkBar({ count, onRun, onClear }: { count: number; onRun: (action: string) => void; onClear: () => void }){
  const btn = { fontSize:12.5, padding:'7px 13px', whiteSpace:'nowrap' };
  return (
    <div className="sel-actionbar" style={{ position:'sticky', bottom:16, zIndex:30, display:'flex', justifyContent:'center', pointerEvents:'none' }}>
      <div style={{ pointerEvents:'auto', display:'flex', alignItems:'center', gap:10, padding:'11px 12px 11px 18px', borderRadius:12, background:'var(--surface-elevated)', border:'1px solid var(--accent)', boxShadow:'0 14px 40px rgba(0,0,0,0.45)', flexWrap:'wrap' }}>
        <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:13, whiteSpace:'nowrap' }}><span style={{ color:'var(--accent-hover)' }}>{count}명</span> 선택됨</span>
        <span style={{ width:1, height:20, background:'var(--border)' }}></span>
        <button className="btn" style={btn} onClick={()=>onRun('wl-on')}><span style={{ color:'#E8C463' }}>★</span> 화이트리스트</button>
        <button className="btn" style={btn} onClick={()=>onRun('wl-off')}>WL 해제</button>
        <button className="btn" style={{ ...btn, borderColor:'rgba(224,138,138,0.4)', color:RED }} onClick={()=>onRun('warn')}><Icons.alert size={14}/>경고</button>
        <button className="btn" style={{ ...btn, borderColor:'rgba(224,138,138,0.4)', color:RED }} onClick={()=>onRun('suspend')}><Icons.pause size={14}/>정지</button>
        <button className="btn" style={btn} onClick={()=>onRun('reinstate')}>복구</button>
        <button className="ma-iconbtn" onClick={onClear} aria-label="선택 해제"><Icons.x size={16}/></button>
      </div>
    </div>
  );
}

function BulkConfirm({ action, ids, onDone, onCancel }: { action: string; ids: string[]; onDone: () => void; onCancel: () => void }){
  const [reason, setReason] = useState('');
  const cfg = {
    warn:    { title:'경고 부여', verb:'경고를 부여', danger:true, run:()=>MAStore.addWarning(ids, reason) },
    suspend: { title:'활동 정지', verb:'정지 처리', danger:true, run:()=>MAStore.setStatus(ids,'INACTIVE', reason.trim()) },
    ban:     { title:'밴 · 제적', verb:'제적 처리', danger:true, run:()=>MAStore.setStatus(ids,'WITHDRAWN', reason.trim()) },
  }[action];
  if(!cfg) return null;
  const protectedCount = ids.filter(id=>{ const m=MEMBERS.find(x=>x.id===id); return m && (m.role==='SUPER_ADMIN'||m.me); }).length;
  const effective = action==='warn' ? ids.length : ids.length - protectedCount;
  return ReactDOM.createPortal((
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={e=>e.stopPropagation()} style={{ maxWidth:430 }}>
        <button onClick={onCancel} className="modal-close" aria-label="닫기"><Icons.x size={18}/></button>
        <UU.Kicker>일괄 조치</UU.Kicker>
        <h2 style={{ margin:'12px 0 6px', fontFamily:'var(--font-sans)', fontWeight:700, fontSize:21, color: cfg.danger?RED:'var(--foreground)' }}>{cfg.title}</h2>
        <p style={{ margin:0, fontSize:13.5, color:'var(--muted-foreground)', lineHeight:1.7 }}>
          선택한 <b style={{ color:'var(--foreground)' }}>{ids.length}명</b>을 {cfg.verb}합니다.
          {action!=='warn' && protectedCount>0 && <span style={{ color:RED }}> 운영진(개발)·본인 {protectedCount}명은 제외돼 {effective}명에게 적용돼요.</span>}
        </p>
        <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder={action==='warn'?'경고 사유 (모든 대상에 동일 적용)':'사유를 입력하세요 (선택)'} rows={3}
          style={{ width:'100%', marginTop:14, padding:'10px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-elevated)', color:'var(--foreground)', fontSize:13, resize:'vertical', boxSizing:'border-box', fontFamily:'var(--font-kr)' }} />
        <div style={{ display:'flex', gap:9, marginTop:14 }}>
          <button className="btn" onClick={()=>{ cfg.run(); onDone(); }} style={{ flex:1, justifyContent:'center', borderColor: cfg.danger?RED:'var(--accent)', color: cfg.danger?RED:'var(--accent-hover)' }}>{cfg.title} 확정</button>
          <button className="btn" onClick={onCancel} style={{ padding:'9px 20px' }}>취소</button>
        </div>
      </div>
    </div>
  ), document.body);
}

// ───────── DRAWER ─────────
function MemberDrawer({ member, onClose }: { member: MemberType; onClose: () => void }){
  useMA();
  const m = member;
  const team = teamOf(m);
  const protectedM = m.role==='SUPER_ADMIN' || m.me;
  return ReactDOM.createPortal((
    <div className="ma-drawer-backdrop" onClick={onClose}>
      <div className="ma-drawer" onClick={e=>e.stopPropagation()}>
        {/* header */}
        <div style={{ padding:'22px 24px 18px', borderBottom:'1px solid var(--border-subtle)', position:'sticky', top:0, background:'var(--surface)', zIndex:2 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <UU.Kicker>부원 관리</UU.Kicker>
            <button onClick={onClose} className="ma-iconbtn" aria-label="닫기"><Icons.x size={17}/></button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:14 }}>
            <UU.Avatar name={m.name} size={52} hue={team?team.hue:undefined} />
            <div style={{ minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:19 }}>{m.name}</span>
                {m.nick && <span className="mono" style={{ fontSize:12, color:'var(--muted-foreground)' }}>{m.nick}</span>}
              </div>
              <div className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)', marginTop:3 }}>{m.gen}기 · {m.dept}{team?` · ${team.name}`:' · 무소속'}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:13, flexWrap:'wrap' }}>
            <StatusBadge status={(m as { status?: string }).status ?? 'ACTIVE'} />
            <RoleTag m={m} />
            {(m as { whitelist?: boolean }).whitelist && <span className="mono" style={{ fontSize:10, fontWeight:700, color:'#E8C463', background:'rgba(232,196,99,0.1)', border:'1px solid rgba(232,196,99,0.35)', borderRadius:20, padding:'3px 9px' }}>★ 화이트리스트</span>}
          </div>
        </div>

        <div style={{ padding:'4px 24px 32px' }}>
          {protectedM && <div style={{ margin:'16px 0 4px', padding:'10px 13px', borderRadius:8, background:'rgba(159,180,214,0.07)', border:'1px solid rgba(159,180,214,0.2)', fontSize:12, color:'var(--muted-foreground)', lineHeight:1.6 }}>
            {m.role==='SUPER_ADMIN' ? '개발 권한 부원입니다. 정지·제적·강등이 제한됩니다.' : '본인 계정입니다. 상태 변경이 제한됩니다.'}
          </div>}

          {/* 화이트리스트 */}
          <DSection title="화이트리스트" hint="실력 검증 부원">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14 }}>
              <p style={{ margin:0, fontSize:12.5, color:'var(--muted-foreground)', lineHeight:1.6, textWrap:'pretty' }}>지정 시 합주실 우선 예약·팀 결성 권한이 부여됩니다.</p>
              <span className="ma-switch" data-on={!!(m as { whitelist?: boolean }).whitelist} onClick={()=>MAStore.setWhitelist([m.id], !(m as { whitelist?: boolean }).whitelist)} role="switch" aria-checked={!!(m as { whitelist?: boolean }).whitelist}></span>
            </div>
          </DSection>

          {/* 운영진 위임 */}
          <DSection title="운영진 권한" hint="위임 · 직책">
            <OfficerPanel m={m} />
          </DSection>

          {/* 경고 */}
          <DSection title="경고 관리" hint="3회 시 제적 기준">
            <WarnPanel m={m} />
          </DSection>

          {/* 상태 */}
          <DSection title="상태 관리" hint="정지 · 제적 · 복구">
            <StatusPanel m={m} disabled={protectedM} />
          </DSection>
        </div>
      </div>
    </div>
  ), document.body);
}

function DSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }){
  return (
    <div style={{ borderTop:'1px solid var(--border-subtle)', paddingTop:18, marginTop:18 }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:9, marginBottom:13 }}>
        <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:14 }}>{title}</span>
        {hint && <span className="mono" style={{ fontSize:9.5, color:'var(--subtle-foreground)', letterSpacing:'0.04em' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function OfficerPanel({ m }: { m: MemberType }){
  const isOfficer = RS.isOfficer(m);
  const isDev = m.role==='SUPER_ADMIN';
  if(isDev){
    return <p style={{ margin:0, fontSize:12.5, color:'var(--muted-foreground)', lineHeight:1.6 }}>개발 권한은 시스템에서만 변경할 수 있습니다.</p>;
  }
  return (
    <div>
      {!isOfficer ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:12.5, color:'var(--muted-foreground)' }}>일반 부원입니다. 운영진으로 위임할 수 있어요.</span>
          <button className="btn btn-primary" style={{ fontSize:12.5, padding:'8px 14px' }} onClick={()=>MAStore.promote(m.id)}><Icons.shield size={14}/>운영진 위임</button>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
            {([[null,'일반 운영진'], ...RS.titles.map((t: string)=>[t,t])] as [string|null, string][]).map(([val,label])=>{
              const on = ((m as { adminRole?: string | null }).adminRole||null)===val;
              const holder = val ? RS.holder(val) : null;
              const taken = holder && holder.id!==m.id;
              return (
                <button key={label} onClick={()=>MAStore.setOfficer(m.id, val ?? '')} style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:3, padding:'9px 12px', borderRadius:9, minWidth:84, textAlign:'left', transition:'all .14s',
                  border:`1px solid ${on?'var(--accent)':'var(--border)'}`, background: on?'var(--accent-muted)':'transparent', color: on?'var(--accent-hover)':'var(--muted-foreground)' }}>
                  <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:12.5 }}>{label}</span>
                  {val && <span className="mono" style={{ fontSize:9, color: on?'var(--accent-hover)':'var(--subtle-foreground)' }}>{taken?`현재 ${(holder as { nick?: string; name: string }).nick||holder.name}`:(on?'지정됨':'비어 있음')}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
            <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)', lineHeight:1.6, flex:'1 1 180px' }}>회장·부회장·총무는 각 1명. 옮기면 기존 담당자는 일반 운영진으로 바뀝니다.</span>
            <button className="btn" style={{ fontSize:12, padding:'7px 13px', borderColor:'rgba(224,138,138,0.4)', color:RED }} onClick={()=>MAStore.demote(m.id)}>운영진 해제</button>
          </div>
        </>
      )}
    </div>
  );
}

function WarnPanel({ m }: { m: MemberType }){
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);
  const list = ((m as { warnings?: { reason: string; date: string; issuer: string }[] }).warnings)||[];
  const count = list.length;
  const color = count>=3?RED:count>=2?'var(--accent-hover)':'var(--muted-foreground)';
  const add = () => { MAStore.addWarning([m.id], reason); setReason(''); setOpen(false); };
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:12 }}>
        <span className="mono" style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:20, color, border:`1px solid ${count?color:'var(--border-subtle)'}` }}>{count}회</span>
        {count>=3 && <span className="mono" style={{ fontSize:10.5, color:RED }}>제적 기준 도달</span>}
        {count===2 && <span className="mono" style={{ fontSize:10.5, color:'var(--accent-hover)' }}>제적 1회 전</span>}
      </div>
      {count===0 ? (
        <div style={{ fontSize:12.5, color:'var(--subtle-foreground)', marginBottom:12 }}>경고 이력이 없습니다.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:12 }}>
          {list.map((w,i)=>(
            <div key={i} style={{ padding:'10px 12px', borderRadius:8, background:'rgba(224,138,138,0.06)', border:'1px solid rgba(224,138,138,0.18)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:3, alignItems:'center' }}>
                <span className="mono" style={{ fontSize:10.5, fontWeight:700, color:RED }}>경고 {count-i}회차</span>
                <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)' }}>{w.date} · {w.issuer}</span>
                  <button onClick={()=>MAStore.removeWarning(m.id,i)} className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)' }}>취소</button>
                </span>
              </div>
              <div style={{ fontSize:12.5, color:'var(--muted-foreground)' }}>{w.reason}</div>
            </div>
          ))}
        </div>
      )}
      {open ? (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="경고 사유를 입력하세요" rows={2}
            style={{ width:'100%', padding:'9px 11px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface-elevated)', color:'var(--foreground)', fontSize:13, resize:'vertical', boxSizing:'border-box', fontFamily:'var(--font-kr)' }} />
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn" onClick={add} style={{ borderColor:'rgba(224,138,138,0.5)', color:RED }}>경고 추가</button>
            <button className="btn" onClick={()=>{ setOpen(false); setReason(''); }}>취소</button>
          </div>
        </div>
      ) : (
        <button className="btn" onClick={()=>setOpen(true)} style={{ borderColor:'rgba(224,138,138,0.4)', color:RED }}><Icons.alert size={15}/>경고 추가</button>
      )}
    </div>
  );
}

function StatusPanel({ m, disabled }: { m: MemberType; disabled?: boolean }){
  const [confirm, setConfirm] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const mStatus = (m as { status?: string }).status;
  const mNick = (m as { nick?: string }).nick;
  if(disabled){
    return <p style={{ margin:0, fontSize:12.5, color:'var(--subtle-foreground)', lineHeight:1.6 }}>이 부원은 상태를 변경할 수 없습니다.</p>;
  }
  if(mStatus==='INACTIVE' || mStatus==='WITHDRAWN'){
    const c = STATUS_CFG[mStatus as keyof typeof STATUS_CFG];
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <span style={{ fontSize:12.5, color:'var(--muted-foreground)' }}>현재 <b style={{ color:c.color }}>{c.label}</b> 상태입니다.</span>
        <button className="btn" onClick={()=>MAStore.setStatus([m.id],'ACTIVE')}>정식으로 복구</button>
      </div>
    );
  }
  if(confirm){
    const isBan = confirm==='ban';
    return (
      <div style={{ padding:13, borderRadius:9, background: isBan?'rgba(224,138,138,0.08)':'var(--surface-elevated)', border:`1px solid ${isBan?'rgba(224,138,138,0.35)':'var(--border)'}`, display:'flex', flexDirection:'column', gap:10 }}>
        <span style={{ fontSize:13, color: isBan?RED:'var(--foreground)', fontWeight:600 }}>{mNick||m.name}님을 {isBan?'제적(밴)':'정지'} 처리할까요?</span>
        <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder={`${isBan?'제적':'정지'} 사유 (선택)`} rows={2}
          style={{ width:'100%', padding:'9px 11px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--foreground)', fontSize:13, resize:'vertical', boxSizing:'border-box', fontFamily:'var(--font-kr)' }} />
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={()=>{ MAStore.setStatus([m.id], isBan?'WITHDRAWN':'INACTIVE', reason.trim()); setConfirm(null); setReason(''); }} style={{ borderColor: isBan?RED:'var(--accent)', color: isBan?RED:'var(--accent-hover)' }}>{isBan?'제적 확정':'정지 확정'}</button>
          <button className="btn" onClick={()=>{ setConfirm(null); setReason(''); }}>취소</button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
      <button className="btn" onClick={()=>setConfirm('suspend')}><Icons.pause size={15}/>정지</button>
      <button className="btn" onClick={()=>setConfirm('ban')} style={{ borderColor:'rgba(224,138,138,0.4)', color:RED }}><Icons.ban size={15}/>밴 · 제적</button>
    </div>
  );
}

function ActionLog(){
  useMA();
  const log = MAStore.log();
  const [open, setOpen] = useState(true);
  const toneColor: Record<string, string> = { accent:'var(--accent-hover)', warn:'var(--accent-hover)', danger:RED, good:'#7FD8A8', neutral:'var(--muted-foreground)' };
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border-subtle)', borderRadius:11, overflow:'hidden' }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', textAlign:'left' }}>
        <span style={{ display:'flex', alignItems:'center', gap:9 }}>
          <Icons.inbox size={16} />
          <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:13.5 }}>최근 조치 내역</span>
          <span className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)' }}>{log.length}건</span>
        </span>
        <span style={{ color:'var(--subtle-foreground)', transform: open?'rotate(90deg)':'none', transition:'transform .16s' }}><Icons.arrow size={15}/></span>
      </button>
      {open && (
        <div style={{ borderTop:'1px solid var(--border-subtle)', maxHeight:230, overflowY:'auto' }}>
          {log.length===0 ? (
            <div style={{ padding:'22px 16px', textAlign:'center', fontSize:12.5, color:'var(--subtle-foreground)' }}>아직 조치 내역이 없습니다. 부원을 선택하거나 카드를 열어 관리해 보세요.</div>
          ) : log.map(e=>(
            <div key={e.key} style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 16px', borderBottom:'1px solid var(--border-subtle)' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:toneColor[e.tone], flex:'0 0 auto' }}></span>
              <span style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:12.5, flex:'0 0 auto' }}>{e.name}</span>
              <span className="mono" style={{ fontSize:10.5, fontWeight:700, color:toneColor[e.tone], flex:'0 0 auto' }}>{e.action}</span>
              <span style={{ fontSize:11.5, color:'var(--muted-foreground)', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.detail}</span>
              <span className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)', flex:'0 0 auto' }}>{e.ts}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═════════════ CSV 부원 마이그레이션 ═════════════ */
const SESS = D.SESSIONS;                       // ['보컬','기타','베이스','드럼','건반']
const SESS_ALIAS = {
  vocal:'보컬', vo:'보컬', '보컬리스트':'보컬',
  guitar:'기타', gt:'기타', 'gtr':'기타', '일렉기타':'기타', '통기타':'기타',
  bass:'베이스', ba:'베이스', '베이스기타':'베이스',
  drum:'드럼', drums:'드럼', dr:'드럼', '드럼즈':'드럼',
  keyboard:'건반', keys:'건반', key:'건반', ke:'건반', '키보드':'건반', '신디':'건반', '피아노':'건반',
};
const HEAD_SYN = {
  name:['이름','성명','성함','name'],
  nick:['닉네임','별명','활동명','nick','nickname'],
  gen:['기수','코호트','gen','generation'],
  session:['세션','파트','악기','session','part'],
  dept:['학과','전공','학부','소속','dept','department','major'],
  phone:['전화번호','연락처','휴대폰','휴대전화','phone','tel'],
  role:['역할','구분','직책','권한','role'],
};
const DEFAULT_MAP = { name:0, nick:1, gen:2, session:3, dept:4, phone:5, role:6 };
const MIG_COLS = [
  ['이름', '필수', '실명. 비어 있으면 오류'],
  ['닉네임', '선택', '없으면 비워 둬도 됩니다'],
  ['기수', '필수', '숫자만 (예: 18)'],
  ['세션', '필수', '보컬·기타·베이스·드럼·건반 / 복수는 슬래시'],
  ['학과', '선택', '미기재 시 “미기재”로 등록'],
  ['전화번호', '선택', '없으면 연락처 비공개로 설정'],
  ['역할', '선택', '“운영진” 입력 시 운영진으로 등록'],
];
const TEMPLATE = [
  '이름,닉네임,기수,세션,학과,전화번호,역할',
  '김도현,도형,18,기타,실용음악과,010-1234-5678,운영진',
  '이서연,,19,보컬,국어국문학과,010-2345-6789,일반',
  '박지훈,,18,드럼/건반,기계공학과,,일반',
  '최유진,유즈,20,건반,작곡과,010-4567-8901,일반',
].join('\n');
const MIG_ST = {
  ok:    { label:'등록 가능', color:'#6FAF8A', bg:'rgba(111,175,138,0.10)', bd:'rgba(111,175,138,0.32)' },
  dup:   { label:'중복 의심', color:'#E8C463', bg:'rgba(232,196,99,0.10)', bd:'rgba(232,196,99,0.32)' },
  error: { label:'오류',     color:RED,        bg:'rgba(224,138,138,0.08)', bd:'rgba(224,138,138,0.30)' },
};

function parseCSV(text: string){
  const rows=[]; let field='', row=[], inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQ){
      if(c==='"'){ if(text[i+1]==='"'){ field+='"'; i++; } else inQ=false; }
      else field+=c;
    } else if(c==='"'){ inQ=true; }
    else if(c===','){ row.push(field); field=''; }
    else if(c==='\n'||c==='\r'){ if(c==='\r'&&text[i+1]==='\n') i++; row.push(field); rows.push(row); row=[]; field=''; }
    else field+=c;
  }
  if(field.length||row.length){ row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim()!==''));
}
function mapHeader(cells: string[]){
  const map: Record<string, number> = {};
  cells.forEach((c,i)=>{
    const norm=c.toLowerCase().replace(/\s/g,'');
    for(const k in HEAD_SYN){ if(map[k]!=null) continue; if((HEAD_SYN as Record<string, string[]>)[k].some((s: string)=>norm===s.toLowerCase()||norm.includes(s.toLowerCase()))){ map[k]=i; break; } }
  });
  return Object.keys(map).length ? map : DEFAULT_MAP;
}
function normSessions(raw: string){
  if(!raw) return { ok:[] as string[], bad:[] as string[] };
  const parts=raw.split(/[\/,;|·、，\s]+/).map((s: string)=>s.trim()).filter(Boolean);
  const ok: string[]=[], bad: string[]=[];
  parts.forEach((p: string)=>{ const found=(SESS as string[]).includes(p)?p:(SESS_ALIAS as Record<string, string>)[p.toLowerCase()]; if(found){ if(!ok.includes(found)) ok.push(found); } else bad.push(p); });
  return { ok, bad };
}
type MigRow = { n: number; name: string; nick: string; gen: number; genRaw: string; sessionArr: string[]; dept: string; phone: string; isAdmin: boolean; roleRaw: string; status: string; errors: string[] };
function analyzeCSV(raw: string): { rows: MigRow[]; headerFound: boolean }{
  const matrix=parseCSV(raw||'');
  if(!matrix.length) return { rows:[], headerFound:false };
  const first=matrix[0].map((s: string)=>s.trim());
  const looksHeader=first.some((c: string)=>/이름|name|성명|성함/i.test(c));
  const map: Record<string, number>=looksHeader?mapHeader(first):DEFAULT_MAP;
  const dataRows=looksHeader?matrix.slice(1):matrix;
  const existing=new Set(MEMBERS.map(m=>m.name+'·'+m.gen));
  const seen=new Set<string>();
  const rows=dataRows.map((cells: string[],i: number)=>{
    const get=(key: string)=>{ const idx=map[key]; return idx==null?'':(cells[idx]||'').trim(); };
    const errors=[];
    const name=get('name'); if(!name) errors.push('이름 없음');
    const genRaw=get('gen'); const genNum=parseInt(genRaw.replace(/[^0-9]/g,''),10);
    if(!genRaw) errors.push('기수 없음'); else if(isNaN(genNum)) errors.push('기수 형식 오류');
    const { ok:sessionArr, bad }=normSessions(get('session'));
    if(!sessionArr.length && !bad.length) errors.push('세션 없음');
    if(bad.length) errors.push('세션 인식 불가: '+bad.join(', '));
    const roleRaw=get('role'); const isAdmin=/운영|관리|admin|회장|부회장|총무/i.test(roleRaw);
    let status=errors.length?'error':'ok';
    if(status==='ok'){ const key=name+'·'+genNum; if(existing.has(key)||seen.has(key)) status='dup'; seen.add(key); }
    return { n:i+1, name, nick:get('nick'), gen:genNum, genRaw, sessionArr, dept:get('dept'), phone:get('phone'), isAdmin, roleRaw, status, errors };
  });
  return { rows, headerFound:looksHeader };
}

function MigStat({ label, value, color }: { label: string; value: number | string; color?: string }){
  return (
    <div style={{ padding:'13px 16px', background:'var(--surface)' }}>
      <div className="mono" style={{ fontSize:9.5, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--subtle-foreground)' }}>{label}</div>
      <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:24, marginTop:5, color:color||'var(--foreground)' }}>{value}</div>
    </div>
  );
}

function MemberMigration(){
  useMA();
  const [text, setText] = useState('');
  const [rows, setRows] = useState<MigRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [includeDup, setIncludeDup] = useState(false);
  const [drag, setDrag] = useState(false);
  const [done, setDone] = useState<{ count: number; admins: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = (raw: string, name: string | null) => { const res=analyzeCSV(raw); setRows(res.rows as MigRow[]); setText(raw); if(name!=null) setFileName(name); setDone(null); };
  const onFile = (file: File) => {
    if(!file) return;
    const r=new FileReader();
    r.onload=e=>{
      const buf=(e.target as FileReader).result as ArrayBuffer;
      const bytes=new Uint8Array(buf);
      const hasUtf8Bom=bytes[0]===0xEF&&bytes[1]===0xBB&&bytes[2]===0xBF;
      let text: string;
      if(hasUtf8Bom){
        text=new TextDecoder('utf-8').decode(buf);
      } else {
        const utf8=new TextDecoder('utf-8').decode(buf);
        text=utf8.includes('�')?new TextDecoder('euc-kr').decode(buf):utf8;
      }
      run(text, file.name);
    };
    r.readAsArrayBuffer(file);
  };
  const reset = () => { setRows(null); setText(''); setFileName(''); setIncludeDup(false); };

  function downloadTemplate(){
    const blob=new Blob(['\uFEFF'+TEMPLATE], { type:'text/csv;charset=utf-8' });
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='청림_부원_마이그레이션_양식.csv'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  const stats = rows ? {
    total: rows.length,
    ok: rows.filter(r=>r.status==='ok').length,
    dup: rows.filter(r=>r.status==='dup').length,
    error: rows.filter(r=>r.status==='error').length,
  } : null;
  const importable: MigRow[] = rows ? rows.filter(r=>r.status==='ok'||(includeDup&&r.status==='dup')) : [];

  function doImport(){
    const maxId=MEMBERS.reduce((mx,m)=>{ const n=parseInt(String(m.id).replace(/\D/g,''),10); return isNaN(n)?mx:Math.max(mx,n); },0);
    const newMembers=importable.map((r,i)=>({
      id:'m'+(maxId+1+i), name:r.name, nick:r.nick||null, gen:r.gen, session:r.sessionArr.slice(),
      dept:r.dept||'미기재', role:r.isAdmin?'ADMIN':null, adminRole:null, me:false,
      status:'ACTIVE', whitelist:false, warnings:[], privatePhone:!r.phone, teamId:null,
    })) as MemberType[];
    const count=MAStore.bulkImport(newMembers);
    setDone({ count, admins:newMembers.filter(m=>m.role==='ADMIN').length });
    reset();
  }

  return (
    <div className="screen-in" style={{ display:'flex', flexDirection:'column', gap:22 }}>
      {/* success banner */}
      {done && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'16px 18px', borderRadius:12, background:'rgba(111,175,138,0.08)', border:'1px solid rgba(111,175,138,0.3)' }}>
          <span style={{ color:'#6FAF8A', flex:'0 0 auto', marginTop:1 }}><Icons.check size={20}/></span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15 }}>마이그레이션 완료 — {done.count}명 등록</div>
            <div style={{ fontSize:12.5, color:'var(--muted-foreground)', marginTop:4, lineHeight:1.6 }}>
              기존 부원 {done.count}명이 명단에 추가됐어요{done.admins>0?` (운영진 ${done.admins}명 포함)`:''}. <b style={{ color:'var(--foreground)' }}>부원 관리</b> 탭에서 확인할 수 있습니다.
            </div>
          </div>
          <button onClick={()=>setDone(null)} className="ma-iconbtn" aria-label="닫기"><Icons.x size={16}/></button>
        </div>
      )}

      {/* guide + template */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border-subtle)', borderRadius:12, padding:'20px 22px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:18, flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 320px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:10 }}>
              <span style={{ color:'var(--accent-hover)', display:'flex' }}><Icons.sheet size={18}/></span>
              <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15 }}>CSV 양식으로 한 번에 옮기기</span>
            </div>
            <ol style={{ margin:0, paddingLeft:0, listStyle:'none', display:'flex', flexDirection:'column', gap:7 }}>
              {['양식을 내려받아 기존 부원 명단을 채웁니다','채운 CSV 파일을 업로드하거나 내용을 붙여넣습니다','미리보기에서 오류를 확인하고 명단에 등록합니다'].map((s,i)=>(
                <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:13, color:'var(--muted-foreground)', lineHeight:1.6 }}>
                  <span className="mono" style={{ flex:'0 0 auto', width:19, height:19, borderRadius:5, background:'var(--accent-muted)', color:'var(--accent-hover)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10.5, fontWeight:700, marginTop:1 }}>{i+1}</span>
                  <span style={{ textWrap:'pretty' }}>{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <button className="btn" onClick={downloadTemplate} style={{ flex:'0 0 auto' }}><Icons.download size={15}/>CSV 양식 다운로드</button>
        </div>

        {/* column spec */}
        <div style={{ marginTop:18, paddingTop:18, borderTop:'1px solid var(--border-subtle)', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px, 1fr))', gap:'12px 22px' }}>
          {MIG_COLS.map(([col,req,desc])=>(
            <div key={col} style={{ display:'flex', flexDirection:'column', gap:3 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:12.5 }}>{col}</span>
                <span className="mono" style={{ fontSize:9, padding:'1px 6px', borderRadius:3, letterSpacing:'0.04em', color: req==='필수'?'var(--accent-hover)':'var(--subtle-foreground)', background: req==='필수'?'var(--accent-muted)':'var(--surface-elevated)', border:'1px solid var(--border-subtle)' }}>{req}</span>
              </div>
              <span style={{ fontSize:11.5, color:'var(--subtle-foreground)', lineHeight:1.5, textWrap:'pretty' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* input zone — shown until parsed */}
      {!rows && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div
            onClick={()=>fileRef.current&&fileRef.current.click()}
            onDragOver={e=>{ e.preventDefault(); setDrag(true); }}
            onDragLeave={()=>setDrag(false)}
            onDrop={e=>{ e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}
            style={{ cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:11, padding:'40px 24px', borderRadius:12, textAlign:'center',
              border:`1.5px dashed ${drag?'var(--accent)':'var(--border)'}`, background: drag?'var(--accent-muted)':'var(--surface)', transition:'all .15s' }}>
            <span style={{ color:drag?'var(--accent-hover)':'var(--subtle-foreground)', display:'flex' }}><Icons.upload size={30}/></span>
            <div>
              <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:14.5 }}>CSV 파일을 끌어다 놓거나 클릭해서 선택</div>
              <div className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)', marginTop:6 }}>.csv · UTF-8 인코딩 권장</div>
            </div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display:'none' }} onChange={e=>{ if(e.target.files?.[0]) onFile(e.target.files[0]); }} />
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ flex:1, height:1, background:'var(--border-subtle)' }}></span>
            <span className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', letterSpacing:'0.08em' }}>또는 직접 붙여넣기</span>
            <span style={{ flex:1, height:1, background:'var(--border-subtle)' }}></span>
          </div>

          <textarea value={text} onChange={e=>setText(e.target.value)} rows={5} spellCheck={false}
            placeholder={'이름,닉네임,기수,세션,학과,전화번호,역할\n김도현,도형,18,기타,실용음악과,010-1234-5678,운영진'}
            style={{ width:'100%', padding:'13px 15px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--foreground)', fontSize:12.5, fontFamily:'var(--font-mono)', lineHeight:1.7, resize:'vertical', boxSizing:'border-box' }} />
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button className="btn btn-primary" disabled={!text.trim()} onClick={()=>run(text, '직접 입력')} style={{ opacity:text.trim()?1:0.45, cursor:text.trim()?'pointer':'not-allowed' }}><Icons.check size={15}/>분석하기</button>
          </div>
        </div>
      )}

      {/* preview */}
      {rows && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span className="mono" style={{ fontSize:11, color:'var(--muted-foreground)' }}><Icons.sheet size={13} style={{ verticalAlign:'-2px', marginRight:5 }}/>{fileName||'CSV'}</span>
            </div>
            <button className="btn" onClick={reset} style={{ fontSize:12, padding:'7px 13px' }}><Icons.x size={14}/>다른 파일 선택</button>
          </div>

          {/* stat strip */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:1, background:'var(--border-subtle)', border:'1px solid var(--border-subtle)', borderRadius:9, overflow:'hidden' }}>
            <MigStat label="전체 행" value={stats!.total} />
            <MigStat label="등록 가능" value={stats!.ok} color="#6FAF8A" />
            <MigStat label="중복 의심" value={stats!.dup} color={stats!.dup>0?'#E8C463':undefined} />
            <MigStat label="오류" value={stats!.error} color={stats!.error>0?RED:undefined} />
          </div>

          {/* preview table */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border-subtle)', borderRadius:11, overflow:'hidden' }}>
            <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
              <div style={{ minWidth:760 }}>
                <div className="ma-head" style={{ display:'grid', gridTemplateColumns:'40px minmax(120px,1.4fr) 96px 62px 150px minmax(120px,1fr) 92px 150px', gap:12, alignItems:'center', padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--background)' }}>
                  <span>#</span><span>이름</span><span>닉네임</span><span>기수</span><span>세션</span><span>학과</span><span>역할</span><span>판정</span>
                </div>
                {rows!.map(r=>{
                  const st=MIG_ST[r.status as keyof typeof MIG_ST];
                  const muted=r.status==='error';
                  return (
                    <div key={r.n} style={{ display:'grid', gridTemplateColumns:'40px minmax(120px,1.4fr) 96px 62px 150px minmax(120px,1fr) 92px 150px', gap:12, alignItems:'center', padding:'11px 16px', borderBottom:'1px solid var(--border-subtle)', opacity:muted?0.72:1, background: r.status==='error'?'rgba(224,138,138,0.03)':'transparent' }}>
                      <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)' }}>{String(r.n).padStart(2,'0')}</span>
                      <span style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:13, color: r.name?'var(--foreground)':RED, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.name||'— 없음'}{r.isAdmin&&<span className="mono" style={{ fontSize:9, marginLeft:6, padding:'1px 5px', borderRadius:3, color:'var(--accent-hover)', background:'var(--accent-muted)' }}>운영진</span>}</span>
                      <span style={{ fontSize:12.5, color:r.nick?'var(--muted-foreground)':'var(--subtle-foreground)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.nick||'—'}</span>
                      <span className="mono" style={{ fontSize:12, color: r.errors.some(e=>e.includes('기수'))?RED:'var(--muted-foreground)' }}>{r.genRaw||'—'}</span>
                      <span style={{ display:'flex', gap:4, flexWrap:'wrap' }}>{r.sessionArr.length?r.sessionArr.map(s=><span key={s} className="mono" style={{ fontSize:10, padding:'2px 7px', borderRadius:4, color:'var(--muted-foreground)', background:'var(--surface-elevated)', border:'1px solid var(--border-subtle)' }}>{s}</span>):<span style={{ color:RED, fontSize:12 }}>—</span>}</span>
                      <span style={{ fontSize:12.5, color:r.dept?'var(--muted-foreground)':'var(--subtle-foreground)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.dept||'미기재'}</span>
                      <span style={{ fontSize:12.5, color:'var(--muted-foreground)' }}>{r.isAdmin?'운영진':'일반'}</span>
                      <span title={r.errors.join(' · ')} style={{ display:'inline-flex', alignItems:'center', gap:6, minWidth:0 }}>
                        <span className="mono" style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:4, whiteSpace:'nowrap', color:st.color, background:st.bg, border:`1px solid ${st.bd}` }}>{st.label}</span>
                        {r.errors.length>0 && <span style={{ fontSize:10.5, color:'var(--subtle-foreground)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.errors[0]}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* import bar */}
          <div className="rec-savebar" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap', padding:'14px 18px', borderRadius:12, background:'var(--surface)', border:'1px solid var(--border)', boxShadow:'0 10px 30px rgba(0,0,0,0.25)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
              <span style={{ fontSize:13, color:'var(--muted-foreground)' }}><b style={{ color:'var(--foreground)' }}>{importable.length}명</b> 등록 예정{stats!.error>0&&<span style={{ color:RED }}> · 오류 {stats!.error}행 제외</span>}</span>
              {stats!.dup>0 && (
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:12.5, color:'var(--muted-foreground)' }}>
                  <span className="ma-switch" data-on={includeDup} onClick={()=>setIncludeDup(v=>!v)} role="switch" aria-checked={includeDup} style={{ width:36, height:21 }}></span>
                  중복 의심 {stats!.dup}행도 포함
                </label>
              )}
            </div>
            <button className="btn btn-primary" disabled={importable.length===0} onClick={doImport} style={{ opacity:importable.length?1:0.45, cursor:importable.length?'pointer':'not-allowed' }}><Icons.upload size={15}/>{importable.length}명 명단에 등록</button>
          </div>
        </div>
      )}
    </div>
  );
}

export const MemberAdmin = { MemberAdminScreen, MemberMigration };


