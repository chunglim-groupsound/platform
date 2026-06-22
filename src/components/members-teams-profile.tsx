'use client';
import React from 'react';
import * as ReactDOM from 'react-dom';
import { Icons } from '@/components/icons';
import { UI } from '@/components/shared-ui';
import { DATA, RoleStore, TeamStore } from '@/lib/mock-data';

// ═══════════════════════════════════════════════════════════════════════════
// 청림그룹사운드 리디자인
// 모듈: 부원 · 팀 · 프로필 화면 (window.MTN)
// 메인 파일에서 src="modules/05-members-teams-profile.jsx" 로 로드됨.
// 로드 순서가 의존성 순서입니다 (이 파일은 05/12 번째).
// ═══════════════════════════════════════════════════════════════════════════

// ─── Type definitions ────────────────────────────────────────────────────────
interface Warning { reason: string; date: string; issuer: string; }
interface Member {
  id: string; name: string; nick: string | null; gen: number;
  session: string[]; dept: string; role: 'ADMIN' | 'SUPER_ADMIN' | null; me: boolean;
  teamId?: string | null; teamRole?: 'leader' | 'vice' | 'member' | null; status?: string;
  phone?: string; joinedAt?: string; bio?: string; privatePhone?: boolean;
  warnings?: Warning[]; whitelist?: boolean; adminRole?: string | null;
}
interface Team {
  id: string; name: string; hue: string; leader: string; members: number;
  sessions: Record<string, number>; song: string | null;
  recruiting: boolean; active: boolean; desc?: string;
}
interface Invitation { id: string; teamId: string; inviter: string; msg: string | null; _result?: string; }
interface JoinReq { id: string; teamId: string; status: string; date: string; }
interface DemoReq { id: string; who: string; session: string; msg: string | null; }
type GoFn = (screen: string) => void;
type IconComp = React.ComponentType<{ size?: number }>;
// ─────────────────────────────────────────────────────────────────────────────


// ───────────── MEMBERS / TEAMS / NOTICES ─────────────
const { useState, useEffect, useRef } = React;
const { MEMBERS } = DATA as unknown as { MEMBERS: Member[] };
const TEAMS_ = DATA.TEAMS as unknown as Team[];
// subscribe a component to 직책(회장·부회장·총무) 변경
function useRole(){ const [,f] = useState(0); useEffect(() => { const u=RoleStore.subscribe(() => f(x=>x+1)); return ()=>{u();}; }, []); }
// subscribe a component to 팀 활성/신청 변경
function useTeamStore(){ const [,f] = useState(0); useEffect(() => { const u=TeamStore.subscribe(() => f(x=>x+1)); return ()=>{u();}; }, []); }
const U = UI;

// 팀 퍼스널 컬러 팔레트 — 눈이 편한 저채도 톤 (TEAM_HUES 확장)
const TEAM_PALETTE = [
  '#5B8EC7','#5F8FD6','#5FA9A6','#5FB089','#6FAF8A','#8FB35F',
  '#C9B45A','#D6A35A','#C77F4A','#C76A5A','#C77A86','#C76A9E',
  '#A87FC7','#8B7FC7','#7F8CC7','#8A93A8','#7E8896','#9A6F5A',
];

/* measure how many columns an auto-fill grid renders, so page size = full rows (no ragged empty space) */
function useColumns(ref: React.RefObject<HTMLElement | null>, minCol: number, gap: number) {
  const [cols, setCols] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setCols(Math.max(1, Math.floor((w + gap) / (minCol + gap))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minCol, gap]);
  return cols;
}

/* ===== PAGINATION (windowed, Naver-style: « ‹ 1…N › ») ===== */
function Pagination({ page, pageCount, onChange, windowSize = 5 }: {
  page: number; pageCount: number; onChange: (p: number) => void; windowSize?: number;
}) {
  if (pageCount <= 1) return null;
  const block = Math.floor(page / windowSize);
  const start = block * windowSize;
  const end = Math.min(start + windowSize, pageCount);
  const nums: number[] = [];
  for (let i = start; i < end; i++) nums.push(i);
  const hasPrevBlock = start > 0;
  const hasNextBlock = end < pageCount;

  const Cell = ({ children, disabled, onClick, active, label, glyph }: {
    children: React.ReactNode; disabled?: boolean; onClick?: () => void;
    active?: boolean; label: string; glyph?: boolean;
  }) => (
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

/* ===== MEMBER DETAIL (modal) ===== */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; bd: string }> = {
  ACTIVE:    { label:'정식', color:'#7FD8A8', bg:'rgba(127,216,168,0.1)', bd:'rgba(127,216,168,0.3)' },
  PROBATION: { label:'수습', color:'var(--accent-hover)', bg:'var(--accent-muted)', bd:'color-mix(in oklab, var(--accent) 40%, transparent)' },
  INACTIVE:  { label:'비활성', color:'var(--muted-foreground)', bg:'transparent', bd:'var(--border)' },
  WITHDRAWN: { label:'제적', color:'#E08A8A', bg:'rgba(224,138,138,0.08)', bd:'rgba(224,138,138,0.3)' },
};
const TEAMROLE_CFG: Record<string, { label: string; icon: IconComp | null }> = {
  leader: { label:'팀장', icon:Icons.crown },
  vice:   { label:'부팀장', icon:Icons.star },
  member: { label:'팀원', icon:null },
};

// skill-verified title
function WhitelistBadge({ compact }: { compact?: boolean }) {
  return (
    <span title="화이트리스트 · 실력 검증 부원" className="mono" style={{
      display:'inline-flex', alignItems:'center', gap:3, whiteSpace:'nowrap',
      fontSize:10.5, fontWeight:700, letterSpacing:'0.04em', padding:'3px 8px', borderRadius:20,
      color:'#E8C463', background:'rgba(232,196,99,0.1)', border:'1px solid rgba(232,196,99,0.35)',
    }}>★ {compact ? 'WL' : '화이트리스트'}</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] || STATUS_CFG.ACTIVE;
  return (
    <span className="mono" style={{ fontSize:10.5, letterSpacing:'0.06em', padding:'3px 9px', borderRadius:4,
      color:c.color, background:c.bg, border:`1px solid ${c.bd}`, whiteSpace:'nowrap' }}>{c.label}</span>
  );
}

function DetailRow({ icon, label, value, mono }: {
  icon: IconComp; label: string; value: React.ReactNode; mono?: boolean;
}) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0' }}>
      <span style={{ color:'var(--subtle-foreground)', flex:'0 0 auto' }}>{React.createElement(icon,{size:16})}</span>
      <span className="mono" style={{ fontSize:11, letterSpacing:'0.04em', color:'var(--subtle-foreground)', width:64, flex:'0 0 auto', textTransform:'uppercase' }}>{label}</span>
      <span style={{ fontSize:13.5, color:'var(--foreground)', fontFamily: mono?'var(--font-mono)':'var(--font-kr)', flex:1, minWidth:0 }}>{value}</span>
    </div>
  );
}

/* viewer-role simulator: lets you preview the screen as 일반/팀장/운영진 */
function ViewerSwitch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts = [['member','일반 부원'],['leader','팀장·부팀장'],['admin','운영진']];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, flexWrap:'wrap' }}>
      <span className="mono" style={{ fontSize:9.5, letterSpacing:'0.12em', color:'var(--subtle-foreground)', textTransform:'uppercase' }}>미리보기 권한</span>
      <div style={{ display:'flex', gap:3, padding:3, border:'1px solid var(--border-subtle)', borderRadius:7, background:'var(--background)' }}>
        {opts.map(([k,l]) => (
          <button key={k} onClick={()=>onChange(k)} className="mono" style={{
            fontSize:10.5, letterSpacing:'0.02em', padding:'5px 10px', borderRadius:5,
            background: value===k ? 'var(--accent)' : 'transparent',
            color: value===k ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
            fontWeight: value===k?700:400, transition:'all .14s', whiteSpace:'nowrap',
          }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

/* invite-to-team action (팀장/부팀장) */
function InviteAction({ target, myTeams }: {
  target: Member; myTeams: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [teamId, setTeamId] = useState(myTeams[0] ? myTeams[0].id : '');
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);
  void target;
  if (sent) {
    const t = myTeams.find(x=>x.id===teamId);
    return <div style={{ display:'flex', alignItems:'center', gap:8, color:'#7FD8A8', fontSize:13 }}>
      <Icons.check size={16} />〈{t?t.name:''}〉팀 초대를 보냈어요.
    </div>;
  }
  if (!open) {
    return <button className="btn btn-primary" onClick={()=>setOpen(true)}><Icons.send size={15} />팀으로 초대하기</button>;
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {myTeams.length > 1 ? (
        <select value={teamId} onChange={e=>setTeamId(e.target.value)} style={{
          padding:'9px 11px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface-elevated)',
          color:'var(--foreground)', fontSize:13 }}>
          {myTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      ) : (
        <div className="mono" style={{ fontSize:12, color:'var(--muted-foreground)' }}>팀: {myTeams[0] ? myTeams[0].name : '—'}</div>
      )}
      <textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="초대 메시지 (선택)" rows={2}
        style={{ width:'100%', padding:'9px 11px', borderRadius:6, border:'1px solid var(--border)',
          background:'var(--surface-elevated)', color:'var(--foreground)', fontSize:13, resize:'vertical', boxSizing:'border-box', fontFamily:'var(--font-kr)' }} />
      <div style={{ display:'flex', gap:8 }}>
        <button className="btn btn-primary" onClick={()=>setSent(true)}><Icons.send size={15} />초대 보내기</button>
        <button className="btn" onClick={()=>setOpen(false)}>취소</button>
      </div>
    </div>
  );
}

/* admin warning panel */
function WarningPanel({ member }: { member: Member }) {
  const [list, setList] = useState<Warning[]>(member.warnings || []);
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);
  const count = list.length;
  const badgeColor = count>=3 ? '#E08A8A' : count>=2 ? 'var(--accent-hover)' : 'var(--muted-foreground)';
  const badgeBg = count>=3 ? 'rgba(224,138,138,0.1)' : count>=2 ? 'var(--accent-muted)' : 'var(--surface-elevated)';
  const add = () => {
    if(!reason.trim()) return;
    setList([{ reason:reason.trim(), date:'2026.06.11', issuer:'나' }, ...list]);
    setReason(''); setOpen(false);
  };
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:13 }}>
        <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:14, color:'var(--foreground)' }}>경고 이력</span>
        <span className="mono" style={{ fontSize:10.5, fontWeight:700, padding:'2px 9px', borderRadius:20, color:badgeColor, background:badgeBg, border:`1px solid ${badgeColor==='var(--muted-foreground)'?'var(--border-subtle)':'currentColor'}` }}>{count}회</span>
        {count>=3 && <span className="mono" style={{ fontSize:10.5, color:'#E08A8A' }}>제적 기준 도달</span>}
        {count>=2 && count<3 && <span className="mono" style={{ fontSize:10.5, color:'var(--accent-hover)' }}>제적 1회 전</span>}
      </div>
      {list.length===0 ? (
        <div style={{ fontSize:12.5, color:'var(--subtle-foreground)', marginBottom:12 }}>경고 이력이 없습니다.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:13 }}>
          {list.map((w, i) => (
            <div key={i} style={{ padding:'10px 12px', borderRadius:7, background:'rgba(224,138,138,0.06)', border:'1px solid rgba(224,138,138,0.18)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:3 }}>
                <span className="mono" style={{ fontSize:11, fontWeight:700, color:'#E08A8A' }}>경고 {count-i}회차</span>
                <span className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)' }}>{w.date} · {w.issuer}</span>
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
            <button className="btn" onClick={add} style={{ borderColor:'rgba(224,138,138,0.5)', color:'#E08A8A' }}>경고 추가</button>
            <button className="btn" onClick={()=>{setOpen(false);setReason('');}}>취소</button>
          </div>
        </div>
      ) : (
        <button className="btn" onClick={()=>setOpen(true)} style={{ borderColor:'rgba(224,138,138,0.4)', color:'#E08A8A' }}><Icons.alert size={15} />경고 추가</button>
      )}
    </div>
  );
}

/* admin status actions: 정지(INACTIVE) / 밴·제적(WITHDRAWN) */
function AdminStatusActions({ member }: { member: Member }) {
  const [status, setStatus] = useState<string>(member.status ?? 'ACTIVE');
  const [confirm, setConfirm] = useState<string | null>(null);
  const act = (s: string) => { setStatus(s); setConfirm(null); };
  if (status==='INACTIVE' || status==='WITHDRAWN') {
    const c = STATUS_CFG[status];
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <span style={{ fontSize:13, color:'var(--muted-foreground)' }}>현재 <b style={{color:c.color}}>{c.label}</b> 상태입니다.</span>
        <button className="btn" onClick={()=>setStatus('ACTIVE')}>정식으로 복구</button>
      </div>
    );
  }
  if (confirm) {
    const isBan = confirm==='ban';
    return (
      <div style={{ padding:14, borderRadius:9, background: isBan?'rgba(224,138,138,0.08)':'var(--surface-elevated)', border:`1px solid ${isBan?'rgba(224,138,138,0.35)':'var(--border)'}`, display:'flex', flexDirection:'column', gap:10 }}>
        <span style={{ fontSize:13, color: isBan?'#E08A8A':'var(--foreground)', fontWeight:600 }}>
          {member.nick||member.name}님을 {isBan?'제적(밴)':'정지(비활성)'} 처리할까요?
        </span>
        <textarea placeholder={`${isBan?'제적':'정지'} 사유를 입력하세요 (필수)`} rows={2}
          style={{ width:'100%', padding:'9px 11px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--foreground)', fontSize:13, resize:'vertical', boxSizing:'border-box', fontFamily:'var(--font-kr)' }} />
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={()=>act(isBan?'WITHDRAWN':'INACTIVE')} style={{ borderColor: isBan?'#E08A8A':'var(--accent)', color: isBan?'#E08A8A':'var(--accent-hover)' }}>{isBan?'제적 확정':'정지 확정'}</button>
          <button className="btn" onClick={()=>setConfirm(null)}>취소</button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
      <button className="btn" onClick={()=>setConfirm('suspend')}><Icons.pause size={15} />정지</button>
      <button className="btn" onClick={()=>setConfirm('ban')} style={{ borderColor:'rgba(224,138,138,0.4)', color:'#E08A8A' }}><Icons.ban size={15} />밴·제적</button>
    </div>
  );
}

/* admin: 운영진 직책 관리 (회장·부회장·총무 — 각 1명) */
function OfficerRolePanel({ member }: { member: Member }) {
  useRole();
  const RS = RoleStore;
  const current = member.adminRole || null;
  const opts: [string | null, string][] = [[null, '일반 운영진'], ...RS.titles.map((t: string) => [t, t] as [string, string])];
  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {opts.map(([val, label]) => {
          const on = current === val;
          const holder = val ? RS.holder(val) : null;
          const takenByOther = holder && holder.id !== member.id;
          return (
            <button key={label} onClick={()=>RS.setRole(member.id, val)} style={{
              display:'flex', flexDirection:'column', alignItems:'flex-start', gap:3, padding:'9px 13px', borderRadius:9, minWidth:86,
              border:`1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-muted)' : 'transparent',
              color: on ? 'var(--accent-hover)' : 'var(--muted-foreground)', transition:'all .14s', cursor:'pointer', textAlign:'left',
            }}>
              <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:13 }}>{label}</span>
              {val && <span className="mono" style={{ fontSize:9.5, color: on ? 'var(--accent-hover)' : 'var(--subtle-foreground)' }}>
                {takenByOther ? `현재 ${(holder as Member).nick||(holder as Member).name}` : (on ? '지정됨' : '비어 있음')}
              </span>}
            </button>
          );
        })}
      </div>
      <p style={{ margin:'12px 0 0', fontSize:11.5, color:'var(--subtle-foreground)', lineHeight:1.6, textWrap:'pretty' }}>
        회장·부회장·총무는 각각 1명만 지정할 수 있어요. 다른 부원에게 직책을 옮기면 기존 담당자는 일반 운영진으로 바뀝니다.
      </p>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop:'1px solid var(--border-subtle)', paddingTop:18 }}>
      <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:14 }}>
        <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:14, flex:'0 0 auto', whiteSpace:'nowrap' }}>{title}</span>
        {hint && <span className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)', letterSpacing:'0.04em' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// my inbox: received team invitations + my sent join requests
const MY_INVITATIONS: Invitation[] = [
  { id:'iv1', teamId:'t3', inviter:'아라', msg:'보컬 했으면 하는데 관심 있으세요? 청량한 팔레트라 잘 맞을 거 같아요!' },
  { id:'iv2', teamId:'t5', inviter:'가비', msg:null },
];
const MY_REQUESTS: JoinReq[] = [
  { id:'rq1', teamId:'t4', status:'PENDING', date:'06.09' },
  { id:'rq2', teamId:'t2', status:'REJECTED', date:'05.30' },
];

function MyInbox() {
  const [invites, setInvites] = useState<Invitation[]>(MY_INVITATIONS);
  const [requests, setRequests] = useState<JoinReq[]>(MY_REQUESTS);
  const respond = (id: string, accept: boolean) => {
    setInvites(prev => prev.map(iv => iv.id===id ? { ...iv, _result: accept?'accepted':'rejected' } : iv));
    setTimeout(() => setInvites(prev => prev.filter(iv => iv.id!==id)), 1000);
  };
  const cancelReq = (id: string) => setRequests(prev => prev.filter(r => r.id!==id));
  const REQ_CFG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:  { label:'대기 중', color:'var(--accent-hover)', bg:'var(--accent-muted)' },
    ACCEPTED: { label:'수락됨', color:'#7FD8A8', bg:'rgba(127,216,168,0.1)' },
    REJECTED: { label:'거절됨', color:'#E08A8A', bg:'rgba(224,138,138,0.1)' },
  };
  return (
    <>
      {/* received invitations */}
      <div style={{ marginTop:18 }}>
        <Section title="받은 팀 초대" hint={`${invites.length}건`}>
          {invites.length===0 ? (
            <div className="mono" style={{ fontSize:12.5, color:'var(--subtle-foreground)' }}>받은 초대가 없어요.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {invites.map(iv => {
                const t = TEAMS_.find(x=>x.id===iv.teamId);
                if (!t) return null;
                if (iv._result) {
                  return <div key={iv.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 14px', borderRadius:9, fontSize:13,
                    color: iv._result==='accepted'?'#7FD8A8':'var(--muted-foreground)', background:'var(--surface-elevated)', border:'1px solid var(--border-subtle)' }}>
                    <Icons.check size={15} />〈{t.name}〉 초대를 {iv._result==='accepted'?'수락했어요':'거절했어요'}.
                  </div>;
                }
                return (
                  <div key={iv.id} style={{ padding:'14px 16px', borderRadius:10, background:'var(--surface)', border:`1px solid ${U.hexA(t.hue,0.3)}`, display:'flex', flexDirection:'column', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                        <span style={{ width:7, height:26, borderRadius:2, background:t.hue, flex:'0 0 auto' }}></span>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:14.5 }}>{t.name}</div>
                          <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:2 }}>초대 · {iv.inviter}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:7, flex:'0 0 auto' }}>
                        <button className="btn btn-primary" style={{ padding:'6px 14px', fontSize:12.5 }} onClick={()=>respond(iv.id,true)}>수락</button>
                        <button className="btn" style={{ padding:'6px 14px', fontSize:12.5, borderColor:'rgba(224,138,138,0.4)', color:'#E08A8A' }} onClick={()=>respond(iv.id,false)}>거절</button>
                      </div>
                    </div>
                    {iv.msg && <p style={{ margin:0, fontSize:13, color:'var(--muted-foreground)', lineHeight:1.6 }}>{iv.msg}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* my sent join requests */}
      <div style={{ marginTop:18 }}>
        <Section title="내 가입 신청" hint={`${requests.length}건`}>
          {requests.length===0 ? (
            <div className="mono" style={{ fontSize:12.5, color:'var(--subtle-foreground)' }}>신청한 팀이 없어요.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {requests.map(r => {
                const t = TEAMS_.find(x=>x.id===r.teamId);
                if (!t) return null;
                const cfg = REQ_CFG[r.status];
                return (
                  <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:9, background:'var(--surface)', border:'1px solid var(--border-subtle)' }}>
                    <span style={{ width:7, height:24, borderRadius:2, background:t.hue, flex:'0 0 auto' }}></span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:14 }}>{t.name}</div>
                      <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:2 }}>{r.date} 신청</div>
                    </div>
                    <span className="mono" style={{ fontSize:10.5, fontWeight:700, padding:'3px 9px', borderRadius:20, color:cfg.color, background:cfg.bg, flex:'0 0 auto', whiteSpace:'nowrap' }}>{cfg.label}</span>
                    {r.status==='PENDING' && <button className="btn" style={{ padding:'5px 11px', fontSize:11.5, flex:'0 0 auto' }} onClick={()=>cancelReq(r.id)}>취소</button>}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </>
  );
}

function MemberDetail({ member, viewer, onClose, onEdit }: {
  member: Member; viewer: string; onClose: () => void; onEdit: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow=''; };
  }, []);
  useRole();
  if (!member) return null;
  const team = member.teamId ? TEAMS_.find(t=>t.id===member.teamId) : null;
  const trole = member.teamRole ? TEAMROLE_CFG[member.teamRole] : null;
  const hue = member.session.includes('보컬') ? 'var(--accent-hover)' : 'var(--muted-foreground)';
  // teams the viewer leads (for invite). demo: first two active teams
  const myTeams = TEAMS_.filter(t=>t.active).slice(0,2).map(t=>({ id:t.id, name:t.name }));
  const showInvite = viewer==='leader' || viewer==='admin';
  const showAdmin = viewer==='admin';

  return ReactDOM.createPortal((
    <div onClick={onClose} className="modal-backdrop">
      <div onClick={e=>e.stopPropagation()} className="modal-card">
        {/* close */}
        <button onClick={onClose} className="modal-close" aria-label="닫기"><Icons.x size={18} /></button>

        {/* header */}
        <div style={{ display:'flex', alignItems:'center', gap:16, paddingRight:30 }}>
          <U.Avatar name={member.nick||member.name} size={62} hue={hue} />
          <div style={{ minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, flexWrap:'wrap' }}>
              <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:23, letterSpacing:'-0.02em' }}>{member.nick||member.name}</span>
              <StatusBadge status={member.status ?? 'ACTIVE'} />
              {member.whitelist && <WhitelistBadge />}
              {RoleStore.label(member) && <U.Badge variant="accent">{RoleStore.label(member)}</U.Badge>}
            </div>
            <div className="mono" style={{ fontSize:12, color:'var(--subtle-foreground)', marginTop:5 }}>{member.gen}기 · {member.name}</div>
          </div>
        </div>

        {/* sessions + bio */}
        <div style={{ marginTop:18, display:'flex', flexDirection:'column', gap:13 }}>
          <U.SessionTags list={member.session} />
          <p style={{ margin:0, fontSize:13.5, color:'var(--muted-foreground)', lineHeight:1.7 }}>{member.bio}</p>
        </div>

        {/* my own card → edit profile */}
        {member.me && (
          <button className="btn btn-primary" onClick={onEdit} style={{ marginTop:16, width:'100%', justifyContent:'center' }}>
            <Icons.edit size={15} />프로필 수정
          </button>
        )}

        {member.me && <MyInbox />}

        {/* team affiliation */}
        <div style={{ marginTop:18 }}>
          {team ? (
            <div style={{ display:'flex', alignItems:'center', gap:13, padding:'14px 16px', borderRadius:9, background:U.hexA(team.hue,0.08), border:`1px solid ${U.hexA(team.hue,0.25)}` }}>
              <span style={{ width:8, height:34, borderRadius:2, background:team.hue, flex:'0 0 auto' }}></span>
              <div style={{ flex:1, minWidth:0 }}>
                <div className="mono" style={{ fontSize:10, letterSpacing:'0.12em', color:'var(--subtle-foreground)', textTransform:'uppercase' }}>소속 팀</div>
                <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:16, marginTop:2 }}>{team.name}</div>
              </div>
              {trole && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12.5, fontWeight:600, color:team.hue, padding:'5px 11px', borderRadius:6, background:U.hexA(team.hue,0.12) }}>
                  {trole.icon && React.createElement(trole.icon,{size:14})}{trole.label}
                </span>
              )}
            </div>
          ) : (
            <div className="mono" style={{ fontSize:12.5, color:'var(--subtle-foreground)', padding:'14px 16px', borderRadius:9, border:'1px dashed var(--border)' }}>소속 팀이 없습니다.</div>
          )}
        </div>

        {/* profile fields */}
        <div style={{ marginTop:8 }}>
          <DetailRow icon={Icons.book} label="학과" value={member.dept} />
          <DetailRow icon={Icons.phone} label="연락처" value={member.privatePhone ? '비공개' : member.phone} mono />
          <DetailRow icon={Icons.cake} label="가입" value={`${member.joinedAt} 입부`} mono />
        </div>

        {/* viewer-gated actions */}
        {showInvite && (
          <div style={{ marginTop:18 }}>
            <Section title="팀 초대" hint="팀장·부팀장">
              <InviteAction target={member} myTeams={myTeams} />
            </Section>
          </div>
        )}
        {showAdmin && (
          <>
            {RoleStore.isOfficer(member) && (
              <div style={{ marginTop:18 }}>
                <Section title="운영진 직책" hint="회장 · 부회장 · 총무"><OfficerRolePanel member={member} /></Section>
              </div>
            )}
            <div style={{ marginTop:18 }}>
              <Section title="경고 관리" hint="운영진"><WarningPanel member={member} /></Section>
            </div>
            <div style={{ marginTop:18 }}>
              <Section title="상태 관리" hint="정지 · 제적"><AdminStatusActions member={member} /></Section>
            </div>
          </>
        )}
      </div>
    </div>
  ), document.body);
}

/* ===== MEMBERS ===== */
function MembersScreen({ go, autoOpenSelf }: { go?: GoFn; autoOpenSelf?: boolean }) {
  const [filter, setFilter] = useState('전체');
  const [page, setPage] = useState(0);
  useRole();
  const [selected, setSelected] = useState<Member | null>(autoOpenSelf ? (DATA.ME as unknown as Member) : null);
  const [viewer, setViewer] = useState('admin');
  const [onlyAdmin, setOnlyAdmin] = useState(false);
  const [onlyWL, setOnlyWL] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const cols = useColumns(gridRef, 158, 14);
  const PAGE = cols * 4;            // always full rows → no ragged empty space
  const sessions = ['전체', ...DATA.SESSIONS];
  const filtered = MEMBERS.filter(m => {
    if (filter !== '전체' && !m.session.includes(filter)) return false;
    if (onlyAdmin && !RoleStore.isOfficer(m)) return false;
    if (onlyWL && !m.whitelist) return false;
    return true;
  });
  const pageCount = Math.ceil(filtered.length / PAGE);
  const safePage = Math.min(page, Math.max(0, pageCount - 1));
  const shown = filtered.slice(safePage * PAGE, safePage * PAGE + PAGE);

  return (
    <div className="screen-in" style={{ display:'flex', flexDirection:'column', gap:26 }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
        <div>
          <U.Kicker>{DATA.STATS.members}명 활동 중</U.Kicker>
          <h1 className="display" style={{ margin:'14px 0 0', fontSize:64 }}>MEMBERS</h1>
        </div>
        {/* search */}
        <div style={{ display:'flex', alignItems:'center', gap:9, border:'1px solid var(--border)', borderRadius:6, padding:'9px 13px', minWidth:220, color:'var(--muted-foreground)' }}>
          <Icons.search size={16} />
          <span style={{ fontSize:13 }}>이름 · 닉네임 검색</span>
        </div>
      </div>

      {/* viewer-role simulator */}
      <ViewerSwitch value={viewer} onChange={setViewer} />

      {/* filter chips */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {sessions.map(s => {
            const active = filter === s;
            return (
              <button key={s} onClick={()=>{ setFilter(s); setPage(0); }} className="mono" style={{
                fontSize:11.5, letterSpacing:'0.05em', padding:'7px 14px', borderRadius:5, whiteSpace:'nowrap',
                border:`1px solid ${active ? 'var(--accent)':'var(--border)'}`,
                background: active ? 'var(--accent-muted)':'transparent',
                color: active ? 'var(--accent-hover)':'var(--muted-foreground)',
                transition:'all .14s',
              }}>{s.toUpperCase()}</button>
            );
          })}
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={()=>{ setOnlyAdmin(v=>!v); setPage(0); }} className="mono" style={{
            fontSize:11.5, letterSpacing:'0.05em', padding:'7px 14px', borderRadius:5, whiteSpace:'nowrap', transition:'all .14s',
            border:`1px solid ${onlyAdmin ? 'var(--accent)':'var(--border-subtle)'}`,
            background: onlyAdmin ? 'var(--accent-muted)':'transparent',
            color: onlyAdmin ? 'var(--accent-hover)':'var(--muted-foreground)',
          }}>운영진만</button>
          <button onClick={()=>{ setOnlyWL(v=>!v); setPage(0); }} className="mono" style={{
            fontSize:11.5, letterSpacing:'0.05em', padding:'7px 14px', borderRadius:5, whiteSpace:'nowrap', transition:'all .14s',
            border:`1px solid ${onlyWL ? 'rgba(232,196,99,0.5)':'var(--border-subtle)'}`,
            background: onlyWL ? 'rgba(232,196,99,0.1)':'transparent',
            color: onlyWL ? '#E8C463':'var(--muted-foreground)',
          }}>★ 화이트리스트</button>
        </div>
      </div>

      {/* grid */}
      <div ref={gridRef} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(158px, calc(50% - 7px)), 1fr))', gap:14 }}>
        {shown.map((m, i) => {
          const trole = m.teamRole ? TEAMROLE_CFG[m.teamRole] : null;
          const team = m.teamId ? TEAMS_.find(t=>t.id===m.teamId) : null;
          return (
          <div key={m.id} onClick={()=>setSelected(m)} className="card card-hover rise" style={{ padding:20, display:'flex', flexDirection:'column', gap:13, animationDelay:`${i*0.03}s`, cursor:'pointer',
            borderColor: m.me ? 'var(--accent)' : 'var(--border-subtle)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <U.Avatar name={m.nick || m.name} size={46} hue={m.session.includes('보컬') ? 'var(--accent-hover)' : 'var(--muted-foreground)'} />
              {RoleStore.label(m) ? <U.Badge variant="accent">{RoleStore.label(m)}</U.Badge>
                : m.me ? <U.Badge variant="accent">나</U.Badge>
                : trole && m.teamRole!=='member' && team ? (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10.5, fontWeight:600, color:team.hue, padding:'3px 8px', borderRadius:4, background:U.hexA(team.hue,0.12) }}>
                    {trole.icon && React.createElement(trole.icon,{size:12})}{trole.label}
                  </span>
                ) : null}
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:16, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.nick || m.name}</span>
                {m.whitelist && <span title="화이트리스트" style={{ color:'#E8C463', fontSize:13, flex:'0 0 auto', lineHeight:1 }}>★</span>}
              </div>
              <div className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)', marginTop:2 }}>
                {m.gen}기 · {m.name}
              </div>
            </div>
            <U.SessionTags list={m.session} />
            <div style={{ borderTop:'1px solid var(--border-subtle)', paddingTop:11, fontSize:12, color:'var(--muted-foreground)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
              <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{team ? team.name : m.dept}</span>
              {team && <span style={{ width:7, height:7, borderRadius:2, background:team.hue, flex:'0 0 auto' }}></span>}
            </div>
          </div>
          );
        })}
      </div>
      <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
      {selected && <MemberDetail member={selected} viewer={viewer} onClose={()=>setSelected(null)} onEdit={()=>{ setSelected(null); go && go('profile-edit'); }} />}
    </div>
  );
}

/* ===== TEAMS ===== */
function teamMembersOf(teamId: string): Member[] {
  return MEMBERS.filter(m => m.teamId === teamId)
    .sort((a, b) => { const rank = (r: string | null | undefined) => r==='leader'?0 : r==='vice'?1 : 2; return rank(a.teamRole) - rank(b.teamRole); });
}
const DEMO_REQUESTS: Record<string, DemoReq[]> = {
  t2: [
    { id:'jr1', who:'세훈', session:'기타', msg:'록 사운드 좋아합니다. 함께하고 싶어요!' },
    { id:'jr2', who:'예니', session:'보컬', msg:null },
  ],
  t4: [ { id:'jr3', who:'가비', session:'드럼', msg:'몽환적인 무드 너무 좋아요.' } ],
};

function TeamViewerSwitch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts = [['auto','나로 보기'],['guest','비멤버'],['member','팀원'],['leader','팀장·부팀장'],['admin','운영진']];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, flexWrap:'wrap' }}>
      <span className="mono" style={{ fontSize:9.5, letterSpacing:'0.12em', color:'var(--subtle-foreground)', textTransform:'uppercase' }}>미리보기 권한</span>
      <div style={{ display:'flex', gap:3, padding:3, border:'1px solid var(--border-subtle)', borderRadius:7, background:'var(--surface)' }}>
        {opts.map(([k,l]) => (
          <button key={k} onClick={()=>onChange(k)} className="mono" style={{
            fontSize:10.5, letterSpacing:'0.02em', padding:'5px 10px', borderRadius:5,
            background: value===k ? 'var(--accent)' : 'transparent',
            color: value===k ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
            fontWeight: value===k?700:400, transition:'all .14s', whiteSpace:'nowrap',
          }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function MiniMemberRow({ m, hue, badge, kick }: {
  m: Member; hue?: string; badge?: React.ReactNode; kick?: React.ReactNode;
}) {
  void hue;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:9, background:'var(--surface)', border:'1px solid var(--border-subtle)' }}>
      <U.Avatar name={m.nick||m.name} size={38} hue={m.session.includes('보컬')?'var(--accent-hover)':'var(--muted-foreground)'} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.nick||m.name}</span>
          {m.whitelist && <span title="화이트리스트" style={{ color:'#E8C463', fontSize:12, flex:'0 0 auto' }}>★</span>}
        </div>
        <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:2 }}>{m.session.join(' / ')}</div>
      </div>
      {badge}
      {kick}
    </div>
  );
}

/* ---- TEAM ACTIVATION (팀장 신청 / 운영진 승인 대기) ---- */
function TeamActivationPanel({ team, role }: { team: Team; role: string }) {
  useTeamStore();
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const canManage = role === 'leader' || role === 'admin';
  const isAdmin = role === 'admin';
  const ME = DATA.ME as unknown as Member;
  const myName = (ME && (ME.nick || ME.name)) || '팀장';
  const pending = TeamStore.pendingFor(team.id);
  const accent = team.hue;

  // 일반 부원/비멤버에게 보이는 안내
  if (!canManage) {
    return (
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'16px 18px', borderRadius:11, background:'var(--surface)', border:'1px dashed var(--border)' }}>
        <span style={{ color:'var(--subtle-foreground)', flex:'0 0 auto', marginTop:1 }}><Icons.pause size={17} /></span>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:14 }}>아직 비활성 팀이에요</div>
          <p style={{ margin:'5px 0 0', fontSize:12.5, color:'var(--muted-foreground)', lineHeight:1.6 }}>
            {pending ? '팀장이 활성화를 신청해 운영진 승인을 기다리고 있어요.' : '팀장이 활성화를 신청하고 운영진이 승인하면 정식 활동 팀으로 공개됩니다.'}
          </p>
        </div>
      </div>
    );
  }

  // 신청 검토 중 (대기)
  if (pending) {
    return (
      <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${U.hexA(accent,0.32)}`, background:U.hexA(accent,0.06) }}>
        <div style={{ padding:'17px 19px', display:'flex', flexDirection:'column', gap:13 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:8, background:U.hexA(accent,0.14), color:accent, flex:'0 0 auto' }}><Icons.clock size={16} /></span>
            <div style={{ minWidth:0 }}>
              <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:14.5 }}>활성화 신청 검토 중</div>
              <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:2 }}>{pending.at} · {pending.by} 신청 · 운영진 승인 대기</div>
            </div>
          </div>
          {pending.note && (
            <p style={{ margin:0, fontSize:13, color:'var(--muted-foreground)', lineHeight:1.65, padding:'11px 13px', borderRadius:9, background:'var(--surface)', border:'1px solid var(--border-subtle)' }}>{pending.note}</p>
          )}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button className="btn" onClick={()=>TeamStore.cancel(team.id)} style={{ padding:'8px 15px', fontSize:12.5 }}><Icons.x size={14} />신청 취소</button>
            {isAdmin && <button className="btn btn-primary" onClick={()=>{ const r = TeamStore.pendingFor(team.id); if(r) TeamStore.approve(r.id); }} style={{ padding:'8px 15px', fontSize:12.5 }}><Icons.check size={14} />바로 승인</button>}
          </div>
        </div>
      </div>
    );
  }

  // 신청 가능 (대기 신청 없음)
  return (
    <div style={{ borderRadius:12, overflow:'hidden', border:`1px solid ${U.hexA(accent,0.3)}`, background:U.hexA(accent,0.05) }}>
      <div style={{ padding:'17px 19px', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:11 }}>
          <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:8, background:U.hexA(accent,0.14), color:accent, flex:'0 0 auto' }}><Icons.spark size={16} /></span>
          <div style={{ minWidth:0 }}>
            <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:14.5 }}>이 팀은 아직 비활성 상태예요</div>
            <p style={{ margin:'5px 0 0', fontSize:12.5, color:'var(--muted-foreground)', lineHeight:1.6 }}>
              활성화를 신청하면 운영진이 검토 후 승인합니다. 승인되면 팀 목록·타임테이블에 정식 공개돼요.
            </p>
          </div>
        </div>
        {open && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <FieldLabel hint="선택 · 최대 200자">운영진에게 전할 메시지</FieldLabel>
            <textarea value={note} onChange={e=>setNote(e.target.value.slice(0,200))} rows={3}
              placeholder="세션 구성, 정기 합주 계획 등 활성화 사유를 적어보세요"
              style={{ ...inputStyle, background:'var(--surface)', resize:'vertical', minHeight:78, lineHeight:1.6 }} autoFocus />
          </div>
        )}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {open ? (
            <>
              <button className="btn btn-primary" onClick={()=>{ TeamStore.submit(team.id, myName, note); setNote(''); setOpen(false); }}><Icons.send size={15} />활성화 신청 보내기</button>
              <button className="btn" onClick={()=>{ setOpen(false); setNote(''); }}>취소</button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={()=>setOpen(true)}><Icons.spark size={15} />활성화 신청</button>
              {isAdmin && <button className="btn" onClick={()=>TeamStore.setActive(team.id, true)}><Icons.check size={15} />운영진 바로 활성화</button>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- TEAM DETAIL ---- */
function TeamDetail({ team, viewer, onBack, onEdit, go }: {
  team: Team; viewer: string; onBack: () => void; onEdit: () => void; go?: GoFn;
}) {
  useTeamStore();
  const [requests, setRequests] = useState<DemoReq[]>(DEMO_REQUESTS[team.id] || []);
  const [joined, setJoined] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');
  const [confirmKick, setConfirmKick] = useState<string | null>(null);
  const [kicked, setKicked] = useState<Set<string>>(new Set());
  const members = teamMembersOf(team.id).filter(m=>!kicked.has(m.id));
  // resolve effective relationship: 'auto' derives from the logged-in user (ME) per team
  const ME = DATA.ME as unknown as Member;
  let role = viewer;
  if (viewer === 'auto') {
    if (ME.teamId === team.id) role = (ME.teamRole === 'leader' || ME.teamRole === 'vice') ? 'leader' : 'member';
    else role = 'guest';
  }
  const canManage = role==='leader' || role==='admin';
  const isMember = role==='member' || canManage;
  const totalSessions = Object.values(team.sessions).reduce((a,b)=>a+b,0);
  const respond = (id: string) => setRequests(rs => rs.filter(r=>r.id!==id));

  return (
    <div className="screen-in" style={{ maxWidth:760, margin:'0 auto', display:'flex', flexDirection:'column', gap:26 }}>
      <button onClick={onBack} className="mono" style={{ display:'flex', width:'fit-content', alignItems:'center', gap:6, fontSize:12, color:'var(--muted-foreground)' }}
        onMouseEnter={e=>e.currentTarget.style.color='var(--accent-hover)'} onMouseLeave={e=>e.currentTarget.style.color='var(--muted-foreground)'}>
        <Icons.chevron size={14} {...{style:{transform:'rotate(180deg)'}}} />팀 목록으로
      </button>

      <div style={{ borderRadius:12, overflow:'hidden', border:'1px solid var(--border-subtle)', background:'var(--surface)' }}>
        <div style={{ height:4, background:team.hue }}></div>
        <div style={{ padding:'26px 28px', display:'flex', flexDirection:'column', gap:18 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <h1 style={{ margin:0, fontFamily:'var(--font-sans)', fontWeight:700, fontSize:30, letterSpacing:'-0.03em' }}>{team.name}</h1>
                {!team.active && <U.Badge variant="dim">비활성</U.Badge>}
                <U.RecruitBadge recruiting={team.recruiting} />
              </div>
              <div className="mono" style={{ fontSize:12, color:'var(--subtle-foreground)', marginTop:8 }}>팀장 {team.leader} · {members.length}명 · {totalSessions} 세션</div>
            </div>
            {canManage && <button className="btn" onClick={onEdit}><Icons.edit size={15} />팀 수정</button>}
          </div>

          {team.desc && <p style={{ margin:0, fontSize:14, color:'var(--muted-foreground)', lineHeight:1.7 }}>{team.desc}</p>}

          {team.song ? (
            <div style={{ display:'flex', alignItems:'center', gap:11, padding:'13px 15px', borderRadius:9, background:U.hexA(team.hue,0.08), border:`1px solid ${U.hexA(team.hue,0.22)}` }}>
              <span style={{ color:team.hue, flex:'0 0 auto' }}><Icons.music size={17} /></span>
              <div style={{ minWidth:0 }}>
                <div className="mono" style={{ fontSize:9.5, letterSpacing:'0.12em', color:'var(--subtle-foreground)', textTransform:'uppercase' }}>연습곡</div>
                <div style={{ fontSize:14, color:'var(--foreground)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{team.song}</div>
              </div>
            </div>
          ) : (
            <div className="mono" style={{ fontSize:12.5, color:'var(--subtle-foreground)', padding:'13px 15px', border:'1px dashed var(--border)', borderRadius:9 }}>연습곡 미정</div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {!isMember && team.recruiting && team.active && !joined && joinOpen && (
              <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'15px 16px', borderRadius:10, background:'var(--surface-elevated)', border:`1px solid ${U.hexA(team.hue,0.3)}` }}>
                <FieldLabel hint="선택 · 최대 200자">가입 신청 메시지</FieldLabel>
                <textarea value={joinMsg} onChange={e=>setJoinMsg(e.target.value.slice(0,200))} rows={3}
                  placeholder={`〈${team.name}〉에 지원하는 이유나 자신의 세션·경력을 적어보세요`}
                  style={{ ...inputStyle, background:'var(--surface)', resize:'vertical', minHeight:80, lineHeight:1.6 }} autoFocus />
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-primary" onClick={()=>{ setJoined(true); setJoinOpen(false); }}><Icons.send size={15} />신청 보내기</button>
                  <button className="btn" onClick={()=>setJoinOpen(false)}>취소</button>
                </div>
              </div>
            )}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {!isMember && team.recruiting && team.active && !joinOpen && (
                joined
                  ? <span style={{ display:'flex', alignItems:'center', gap:7, color:'#7FD8A8', fontSize:13.5 }}><Icons.check size={16} />가입 신청을 보냈어요</span>
                  : <button className="btn btn-primary" onClick={()=>setJoinOpen(true)}><Icons.plus size={15} />가입 신청</button>
              )}
              <button className="btn" onClick={()=>go && go('timetable')}><Icons.calendar size={15} />합주 일정</button>
            </div>
          </div>
        </div>
      </div>

      {/* 비활성 팀 — 팀장 활성화 신청 */}
      {!team.active && <TeamActivationPanel team={team} role={role} />}

      {/* session composition */}
      <div>
        <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15, marginBottom:13 }}>세션 구성</div>
        <div style={{ display:'flex', gap:3, height:8, borderRadius:4, overflow:'hidden', marginBottom:11 }}>
          {Object.entries(team.sessions).map(([s,n]) =>
            Array.from({length:n}).map((_,k) => (
              <div key={s+k} title={s} style={{ flex:1, background:U.hexA(team.hue, 0.35 + k*0.12), minWidth:8 }}></div>
            ))
          )}
        </div>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          {Object.entries(team.sessions).map(([s,n]) => (
            <span key={s} className="mono" style={{ fontSize:12, color:'var(--muted-foreground)' }}>{s}<span style={{color:team.hue,fontWeight:700}}> {n}</span></span>
          ))}
        </div>
      </div>

      {/* members */}
      <div>
        <div style={{ display:'flex', alignItems:'baseline', gap:9, marginBottom:13 }}>
          <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15, whiteSpace:'nowrap' }}>팀원</span>
          <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)' }}>{members.length}명</span>
        </div>
        {members.length===0 ? (
          <div className="mono" style={{ fontSize:12.5, color:'var(--subtle-foreground)' }}>팀원이 없습니다.</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {members.map(m => {
              const tr = m.teamRole ? TEAMROLE_CFG[m.teamRole] : null;
              const badge = tr && m.teamRole!=='member'
                ? <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, color:team.hue, padding:'4px 10px', borderRadius:20, background:U.hexA(team.hue,0.12), flex:'0 0 auto', whiteSpace:'nowrap' }}>{tr.icon && React.createElement(tr.icon,{size:12})}{tr.label}</span>
                : null;
              const kick = (canManage && m.teamRole!=='leader') ? (
                confirmKick===m.id ? (
                  <span style={{ display:'flex', gap:5, flex:'0 0 auto' }}>
                    <button className="btn" style={{ padding:'5px 11px', fontSize:11.5, borderColor:'#E08A8A', color:'#E08A8A' }} onClick={()=>{ setKicked(k=>new Set([...k,m.id])); setConfirmKick(null); }}>확인</button>
                    <button className="btn" style={{ padding:'5px 11px', fontSize:11.5 }} onClick={()=>setConfirmKick(null)}>취소</button>
                  </span>
                ) : (
                  <button className="btn" style={{ padding:'5px 11px', fontSize:11.5, flex:'0 0 auto', borderColor:'rgba(224,138,138,0.4)', color:'#E08A8A' }} onClick={()=>setConfirmKick(m.id)}>추방</button>
                )
              ) : null;
              return <MiniMemberRow key={m.id} m={m} badge={badge} kick={kick} />;
            })}
          </div>
        )}
      </div>

      {/* join requests */}
      {canManage && (
        <div>
          <div style={{ display:'flex', alignItems:'baseline', gap:9, marginBottom:13 }}>
            <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15, whiteSpace:'nowrap' }}>가입 신청</span>
            <span className="mono" style={{ fontSize:11, color: requests.length?'var(--accent-hover)':'var(--subtle-foreground)' }}>{requests.length}건</span>
          </div>
          {requests.length===0 ? (
            <div className="mono" style={{ fontSize:12.5, color:'var(--subtle-foreground)' }}>대기 중인 신청이 없습니다.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {requests.map(r => (
                <div key={r.id} style={{ padding:'14px 16px', borderRadius:10, background:'var(--surface)', border:'1px solid var(--border-subtle)', display:'flex', flexDirection:'column', gap:9 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <span style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:14 }}>{r.who}</span>
                      <span className="mono" style={{ fontSize:10.5, color:team.hue, padding:'2px 8px', borderRadius:4, background:U.hexA(team.hue,0.1) }}>{r.session}</span>
                    </div>
                    <div style={{ display:'flex', gap:7 }}>
                      <button className="btn btn-primary" style={{ padding:'6px 14px', fontSize:12.5 }} onClick={()=>respond(r.id)}>수락</button>
                      <button className="btn" style={{ padding:'6px 14px', fontSize:12.5, borderColor:'rgba(224,138,138,0.4)', color:'#E08A8A' }} onClick={()=>respond(r.id)}>거절</button>
                    </div>
                  </div>
                  {r.msg && <p style={{ margin:0, fontSize:13, color:'var(--muted-foreground)', lineHeight:1.6 }}>{r.msg}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- TEAM CREATE ---- */
function TeamCreate({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [songs, setSongs] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const submit = () => { if(!name.trim()){ setErr('팀명을 입력해주세요'); return; } setErr(''); setDone(true); setTimeout(onBack, 950); };
  return (
    <div className="screen-in" style={{ maxWidth:560, margin:'0 auto', display:'flex', flexDirection:'column', gap:26 }}>
      <div>
        <button onClick={onBack} className="mono" style={{ display:'flex', width:'fit-content', alignItems:'center', gap:6, fontSize:12, color:'var(--muted-foreground)', marginBottom:14 }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--accent-hover)'} onMouseLeave={e=>e.currentTarget.style.color='var(--muted-foreground)'}>
          <Icons.chevron size={14} {...{style:{transform:'rotate(180deg)'}}} />팀 목록으로
        </button>
        <U.Kicker>새 팀 만들기</U.Kicker>
        <h1 className="display" style={{ margin:'12px 0 0', fontSize:52 }}>NEW TEAM</h1>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
        <div>
          <FieldLabel hint="최대 50자 · 필수">팀명</FieldLabel>
          <input value={name} onChange={e=>{setName(e.target.value); setErr('');}} maxLength={50} placeholder="팀명을 입력하세요" style={{ ...inputStyle, borderColor: err?'#E08A8A':'var(--border)' }} />
          {err && <div className="mono" style={{ fontSize:11.5, color:'#E08A8A', marginTop:7 }}>{err}</div>}
        </div>
        <div>
          <FieldLabel hint="선택">팀 소개</FieldLabel>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} maxLength={200} placeholder="팀을 소개하는 문구를 입력하세요" style={{ ...inputStyle, resize:'vertical', minHeight:78, lineHeight:1.6 }} />
        </div>
        <div>
          <FieldLabel hint="선택 · 여러 곡 추가 가능">연습 곡명</FieldLabel>
          <SongPicker songs={songs} setSongs={setSongs} />
        </div>
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-primary" onClick={submit} style={{ flex:1, justifyContent:'center', padding:'13px' }}>
          {done ? <><Icons.check size={16} />생성됨</> : '팀 만들기'}
        </button>
        <button className="btn" onClick={onBack} style={{ padding:'13px 22px' }}>취소</button>
      </div>
    </div>
  );
}

/* ---- TEAM EDIT ---- */
function TeamEdit({ team, viewer, onBack }: { team: Team; viewer: string; onBack: () => void }) {
  const isAdmin = viewer==='admin';   // 'auto'/leader can edit but not rename or toggle active
  const members = teamMembersOf(team.id);
  const [name, setName] = useState(team.name);
  const [desc, setDesc] = useState(team.desc || '');
  const [songs, setSongs] = useState<string[]>(team.song ? [team.song] : []);
  const [hue, setHue] = useState(team.hue);
  const [recruiting, setRecruiting] = useState(team.recruiting);
  const [active, setActive] = useState(team.active);
  const viceM = members.find(m=>m.teamRole==='vice');
  const [vice, setVice] = useState(viceM ? viceM.id : '');
  const [newLeader, setNewLeader] = useState('');
  const [done, setDone] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const candidates = members.filter(m=>m.teamRole!=='leader');
  const Seg = ({ val, cur, set, children }: {
    val: boolean; cur: boolean; set: (v: boolean) => void; children: React.ReactNode;
  }) => (
    <button type="button" onClick={()=>set(val)} className="mono" style={{
      padding:'8px 16px', borderRadius:7, fontSize:12.5, whiteSpace:'nowrap',
      border:`1px solid ${cur===val ? 'var(--accent)':'var(--border)'}`,
      background: cur===val ? 'var(--accent-muted)':'transparent',
      color: cur===val ? 'var(--accent-hover)':'var(--muted-foreground)',
      fontWeight: cur===val?700:400, transition:'all .14s',
    }}>{children}</button>
  );
  const save = () => { team.hue = hue; team.desc = desc; team.recruiting = recruiting; team.song = songs[0] || null; if (isAdmin) TeamStore.setActive(team.id, active); setDone(true); setTimeout(onBack, 950); };
  return (
    <div className="screen-in" style={{ maxWidth:560, margin:'0 auto', display:'flex', flexDirection:'column', gap:26 }}>
      <div>
        <button onClick={onBack} className="mono" style={{ display:'flex', width:'fit-content', alignItems:'center', gap:6, fontSize:12, color:'var(--muted-foreground)', marginBottom:14 }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--accent-hover)'} onMouseLeave={e=>e.currentTarget.style.color='var(--muted-foreground)'}>
          <Icons.chevron size={14} {...{style:{transform:'rotate(180deg)'}}} />{team.name}으로
        </button>
        <U.Kicker>팀 정보 수정</U.Kicker>
        <h1 className="display" style={{ margin:'12px 0 0', fontSize:52 }}>EDIT TEAM</h1>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
        <div>
          <FieldLabel hint={isAdmin ? '최대 50자' : '팀장은 변경 불가'}>팀명</FieldLabel>
          <input value={name} onChange={e=>setName(e.target.value)} maxLength={50} disabled={!isAdmin} style={{ ...inputStyle, opacity: isAdmin?1:0.55, cursor: isAdmin?'text':'not-allowed' }} />
        </div>
        <div>
          <FieldLabel>팀 소개</FieldLabel>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} maxLength={200} style={{ ...inputStyle, resize:'vertical', minHeight:78, lineHeight:1.6 }} />
        </div>
        <div>
          <FieldLabel hint="여러 곡 추가 가능">연습 곡명</FieldLabel>
          <SongPicker songs={songs} setSongs={setSongs} hue={hue} />
        </div>
        <div>
          <FieldLabel hint="타임테이블·카드에 표시되는 팀 색">팀 퍼스널 컬러</FieldLabel>
          {/* live preview */}
          <div style={{ display:'flex', alignItems:'center', gap:13, padding:'13px 15px', borderRadius:10, border:'1px solid var(--border-subtle)', background:'var(--surface)', marginBottom:13 }}>
            <span style={{ width:34, height:34, borderRadius:9, flex:'0 0 auto', background:hue, boxShadow:`0 0 0 4px ${U.hexA(hue,0.18)}` }}></span>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15, color:hue, whiteSpace:'nowrap' }}>{name || team.name}</span>
                <span className="mono" style={{ fontSize:10, letterSpacing:'0.04em', padding:'2px 7px', borderRadius:3, color:hue, border:`1px solid ${U.hexA(hue,0.4)}`, background:U.hexA(hue,0.1), whiteSpace:'nowrap' }}>합주중</span>
              </div>
              <div style={{ display:'flex', gap:3, height:5, borderRadius:3, overflow:'hidden', marginTop:8 }}>
                {[0.35,0.5,0.65,0.8].map((o,i)=>(<div key={i} style={{ flex:1, background:U.hexA(hue,o) }}></div>))}
              </div>
            </div>
            <span className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', textTransform:'uppercase', flex:'0 0 auto' }}>{hue}</span>
          </div>
          {/* swatch grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(40px, 1fr))', gap:9 }}>
            {TEAM_PALETTE.map(c => {
              const sel = hue.toLowerCase() === c.toLowerCase();
              return (
                <button key={c} type="button" onClick={()=>setHue(c)} title={c} style={{
                  height:40, borderRadius:9, background:c, position:'relative', transition:'transform .12s, box-shadow .12s',
                  border:'1px solid rgba(255,255,255,0.12)',
                  boxShadow: sel ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}` : 'none',
                  transform: sel ? 'scale(1.04)' : 'none',
                }}
                  onMouseEnter={e=>{ if(!sel) e.currentTarget.style.transform='scale(1.06)'; }}
                  onMouseLeave={e=>{ if(!sel) e.currentTarget.style.transform='none'; }}>
                  {sel && <span style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', filter:'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}><Icons.check size={18} /></span>}
                </button>
              );
            })}
          </div>
          {/* custom hex */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:13 }}>
            <span className="mono" style={{ fontSize:10.5, letterSpacing:'0.06em', color:'var(--subtle-foreground)', textTransform:'uppercase', whiteSpace:'nowrap' }}>직접 지정</span>
            <label style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 11px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer' }}>
              <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(hue)?hue:'#5B8EC7'} onChange={e=>setHue(e.target.value)}
                style={{ width:24, height:24, padding:0, border:'none', borderRadius:5, background:'none', cursor:'pointer' }} />
              <span className="mono" style={{ fontSize:12, color:'var(--muted-foreground)' }}>색상 선택</span>
            </label>
          </div>
        </div>
        <div>
          <FieldLabel>모집 상태</FieldLabel>
          <div style={{ display:'flex', gap:8 }}><Seg val={true} cur={recruiting} set={setRecruiting}>모집 중</Seg><Seg val={false} cur={recruiting} set={setRecruiting}>모집 완료</Seg></div>
        </div>
        {isAdmin && (
          <div>
            <FieldLabel hint="운영진">팀 활성 여부</FieldLabel>
            <div style={{ display:'flex', gap:8 }}><Seg val={true} cur={active} set={setActive}>활성</Seg><Seg val={false} cur={active} set={setActive}>비활성</Seg></div>
          </div>
        )}
        {candidates.length > 0 && (
          <div>
            <FieldLabel>부팀장 지정</FieldLabel>
            <select value={vice} onChange={e=>setVice(e.target.value)} style={inputStyle}>
              <option value="">없음</option>
              {candidates.map(m => <option key={m.id} value={m.id}>{m.nick||m.name}</option>)}
            </select>
          </div>
        )}
        {candidates.length > 0 && (
          <div>
            <FieldLabel>팀장 위임</FieldLabel>
            <select value={newLeader} onChange={e=>setNewLeader(e.target.value)} style={inputStyle}>
              <option value="">변경하지 않음</option>
              {candidates.map(m => <option key={m.id} value={m.id}>{m.nick||m.name}</option>)}
            </select>
            {newLeader && <div className="mono" style={{ fontSize:11, color:'var(--accent-hover)', marginTop:7 }}>⚠ 저장 시 팀장 권한이 이전됩니다.</div>}
          </div>
        )}
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-primary" onClick={save} style={{ flex:1, justifyContent:'center', padding:'13px' }}>
          {done ? <><Icons.check size={16} />저장됨</> : '저장'}
        </button>
        <button className="btn" onClick={onBack} style={{ padding:'13px 22px' }}>취소</button>
      </div>
      <div style={{ borderTop:'1px solid rgba(224,138,138,0.2)', paddingTop:20 }}>
        <div className="mono" style={{ fontSize:11, fontWeight:700, color:'#E08A8A', letterSpacing:'0.06em', marginBottom:12, textTransform:'uppercase' }}>위험 영역</div>
        {!showDelete ? (
          <button className="btn" onClick={()=>setShowDelete(true)} style={{ borderColor:'rgba(224,138,138,0.4)', color:'#E08A8A' }}><Icons.ban size={15} />팀 삭제</button>
        ) : (
          <div style={{ padding:16, borderRadius:10, background:'rgba(224,138,138,0.07)', border:'1px solid rgba(224,138,138,0.3)', display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:13.5, color:'#E08A8A', fontWeight:600 }}>정말 삭제하시겠습니까?
              <div style={{ fontWeight:400, color:'var(--muted-foreground)', fontSize:12.5, marginTop:4 }}>팀원·신청·초대 내역이 모두 삭제됩니다.</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn" onClick={()=>{ setShowDelete(false); onBack(); }} style={{ borderColor:'#E08A8A', color:'#E08A8A' }}>삭제 확인</button>
              <button className="btn" onClick={()=>setShowDelete(false)}>취소</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamsScreen({ go }: { go?: GoFn }) {
  useTeamStore();
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState<Team | null>(null);
  const [viewer, setViewer] = useState('auto');
  const [page, setPage] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const cols = useColumns(gridRef, 300, 16);
  const PAGE = cols * 2;            // always full rows → no ragged empty space
  const pageCount = Math.ceil(TEAMS_.length / PAGE);
  const safePage = Math.min(page, Math.max(0, pageCount - 1));
  const shown = TEAMS_.slice(safePage * PAGE, safePage * PAGE + PAGE);

  if (view==='detail' && selected) return <TeamDetail team={selected} viewer={viewer} onBack={()=>setView('list')} onEdit={()=>setView('edit')} go={go} />;
  if (view==='create') return <TeamCreate onBack={()=>setView('list')} />;
  if (view==='edit' && selected) return <TeamEdit team={selected} viewer={viewer} onBack={()=>setView('detail')} />;

  return (
    <div className="screen-in" style={{ display:'flex', flexDirection:'column', gap:26 }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
        <div>
          <U.Kicker>{TEAMS_.filter(t=>t.active).length}개 팀 · 합주 중</U.Kicker>
          <h1 className="display" style={{ margin:'14px 0 0', fontSize:64 }}>TEAMS</h1>
        </div>
        <button className="btn btn-primary" onClick={()=>setView('create')}><Icons.plus size={15} />팀 만들기</button>
      </div>

      <TeamViewerSwitch value={viewer} onChange={setViewer} />

      <div ref={gridRef} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
        {shown.map((t, i) => (
          <div key={t.id} onClick={()=>{ setSelected(t); setView('detail'); }} className="card card-hover rise" style={{ overflow:'hidden', animationDelay:`${i*0.04}s`, opacity: t.active?1:0.72, cursor:'pointer' }}>
            {/* hue spine */}
            <div style={{ height:3, background:t.hue }}></div>
            <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:15 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                <div>
                  <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:21, letterSpacing:'-0.02em' }}>{t.name}</div>
                  <div className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)', marginTop:4 }}>팀장 {t.leader} · {t.members}명</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                  {!t.active && <U.Badge variant="dim">비활성</U.Badge>}
                  <U.RecruitBadge recruiting={t.recruiting} />
                </div>
              </div>

              {/* session composition bar */}
              <div style={{ display:'flex', gap:3, height:6, borderRadius:3, overflow:'hidden' }}>
                {Object.entries(t.sessions).map(([s,n]) =>
                  Array.from({length:n}).map((_,k) => (
                    <div key={s+k} title={s} style={{ flex:1, background: U.hexA(t.hue, 0.35 + k*0.12), minWidth:8 }}></div>
                  ))
                )}
              </div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {Object.entries(t.sessions).map(([s,n]) => (
                  <span key={s} className="mono" style={{ fontSize:10.5, color:'var(--muted-foreground)' }}>{s}<span style={{color:t.hue,fontWeight:700}}> {n}</span></span>
                ))}
              </div>

              {/* current song */}
              {t.song ? (
                <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 12px', borderRadius:5, background:U.hexA(t.hue,0.08), border:`1px solid ${U.hexA(t.hue,0.2)}` }}>
                  <span style={{ color:t.hue, flex:'0 0 auto' }}><Icons.music size={15} /></span>
                  <span style={{ fontSize:12.5, color:'var(--foreground)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.song}</span>
                </div>
              ) : (
                <div className="mono" style={{ fontSize:12, color:'var(--subtle-foreground)', padding:'10px 12px', border:'1px dashed var(--border)', borderRadius:5 }}>
                  연습곡 미정
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}

/* ===== NOTICES — 공지 화면은 별도 NoticesModule 스크립트로 분리 ===== */

/* ===== PROFILE EDIT ===== */
const GENRE_OPTIONS = ['록','팝','인디','재즈','R&B','메탈','힙합','발라드','펀크','포크'];
const SESSION_OPTIONS = ['보컬','기타','베이스','드럼','건반'];
const PRIVACY_FIELDS = [
  { key:'name', label:'실명', scopes:['all','member','admin'] },
  { key:'generation', label:'기수', scopes:['all','member','admin'] },
  { key:'phone', label:'연락처', scopes:['member','admin'] },
  { key:'department', label:'학과', scopes:['all','member','admin'] },
  { key:'student_id', label:'학번', scopes:['admin'] },
  { key:'school_year', label:'학년', scopes:['all','member','admin'] },
];
const SCOPE_LABEL: Record<string, string> = { all:'전체', member:'부원', admin:'운영진' };

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:9, flexWrap:'wrap' }}>
      <label style={{ fontSize:12.5, fontWeight:600, color:'var(--foreground)', fontFamily:'var(--font-sans)', whiteSpace:'nowrap', flex:'0 0 auto' }}>{children}</label>
      {hint && <span className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)' }}>{hint}</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width:'100%', padding:'10px 13px', borderRadius:8, border:'1px solid var(--border)',
  background:'var(--surface)', color:'var(--foreground)', fontSize:14, boxSizing:'border-box',
  fontFamily:'var(--font-kr)', outline:'none',
};

function Chip({ active, onClick, children, hue }: {
  active: boolean; onClick: () => void; children: React.ReactNode; hue?: string;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      padding:'7px 15px', borderRadius:20, fontSize:12.5, fontFamily:'var(--font-sans)', whiteSpace:'nowrap',
      border:`1px solid ${active ? (hue||'var(--accent)') : 'var(--border)'}`,
      background: active ? (hue?U.hexA(hue,0.14):'var(--accent-muted)') : 'transparent',
      color: active ? (hue||'var(--accent-hover)') : 'var(--muted-foreground)',
      fontWeight: active?600:400, transition:'all .14s',
    }}>{children}</button>
  );
}

/* ---- SONG PICKER (검색 + 선택 곡 리스트 + 삭제) ---- */
const SONG_LIBRARY = [
  '잔나비 — 주저하는 연인들을 위해', '실리카겔 — NO PAIN', '데이식스 — 예뻤어', '새소년 — 긴 꿈',
  '혁오 — TOMBOY', '터치드 — 그날의 우리', '쏜애플 — 시퍼렇게', '검정치마 — Antifreeze',
  '국카스텐 — 거울', '넬 — 기억을 걷는 시간', '브로콜리너마저 — 앵콜요청금지', '장기하와 얼굴들 — 그건 니 생각이고',
  '십센치 — 봄이 좋냐??', '데이브레이크 — 좋은 걸 어떡해', '카더가든 — 명동콜링', '소란 — 가을 우체국 앞에서',
  '잔나비 — 뜨거운 여름밤은 가고 남은 건 볼품없지만', '쏜애플 — 빛이 나는 너에게', '아이유 — 밤편지', '폴킴 — 모든 날, 모든 순간',
];
const songNorm = (s: string) => (s||'').toLowerCase().replace(/\s+/g,'');
function SongPicker({ songs, setSongs, hue }: {
  songs: string[]; setSongs: (s: string[]) => void; hue?: string;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const accent = hue || 'var(--accent-hover)';
  const add = (raw: string | undefined) => {
    const v = (raw||'').trim();
    if (!v) return;
    if (!songs.some(x => songNorm(x) === songNorm(v))) setSongs([...songs, v]);
    setQ('');
  };
  const remove = (i: number) => setSongs(songs.filter((_, j) => j !== i));
  const suggestions = q.trim()
    ? SONG_LIBRARY.filter(s => songNorm(s).includes(songNorm(q)) && !songs.some(x => songNorm(x) === songNorm(s))).slice(0, 6)
    : [];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
      {/* 선택된 곡 리스트 */}
      {songs.length > 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {songs.map((s, i) => (
            <div key={s+i} style={{ display:'flex', alignItems:'center', gap:11, padding:'9px 9px 9px 13px', borderRadius:9, background:'var(--surface)', border:'1px solid var(--border-subtle)' }}>
              <span className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', width:16, flex:'0 0 auto', textAlign:'center' }}>{String(i+1).padStart(2,'0')}</span>
              <span style={{ color:accent, flex:'0 0 auto', display:'flex' }}><Icons.music size={15} /></span>
              <span style={{ flex:1, minWidth:0, fontSize:13.5, color:'var(--foreground)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s}</span>
              <button type="button" onClick={()=>remove(i)} aria-label="곡 삭제" title="삭제" style={{ width:28, height:28, borderRadius:7, flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--subtle-foreground)', border:'1px solid transparent', transition:'all .12s' }}
                onMouseEnter={e=>{ e.currentTarget.style.color='#E08A8A'; e.currentTarget.style.background='rgba(224,138,138,0.1)'; e.currentTarget.style.borderColor='rgba(224,138,138,0.3)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.color='var(--subtle-foreground)'; e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; }}>
                <Icons.x size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mono" style={{ fontSize:11.5, color:'var(--subtle-foreground)', padding:'11px 13px', border:'1px dashed var(--border)', borderRadius:9 }}>아직 추가된 곡이 없습니다 · 아래에서 검색해 추가하세요</div>
      )}
      {/* 검색창 */}
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--subtle-foreground)', display:'flex', pointerEvents:'none' }}><Icons.search size={15} /></span>
        <input
          value={q}
          onChange={e=>{ setQ(e.target.value); setOpen(true); }}
          onFocus={()=>setOpen(true)}
          onBlur={()=>setTimeout(()=>setOpen(false), 130)}
          onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); add(suggestions[0] || q); } }}
          maxLength={100}
          placeholder="곡 검색 — 아티스트 또는 곡명"
          style={{ ...inputStyle, paddingLeft:36, paddingRight: q.trim() ? 84 : 13 }}
        />
        {q.trim() && (
          <button type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>add(suggestions[0] || q)} className="mono" style={{
            position:'absolute', right:7, top:'50%', transform:'translateY(-50%)', padding:'6px 12px', borderRadius:6, fontSize:11.5, fontWeight:600,
            display:'flex', alignItems:'center', gap:4, cursor:'pointer', color:accent,
            border:`1px solid ${hue ? U.hexA(hue,0.45) : 'var(--border-subtle)'}`,
            background: hue ? U.hexA(hue,0.12) : 'var(--accent-muted)',
          }}><Icons.plus size={13} />추가</button>
        )}
        {/* 검색 제안 드롭다운 */}
        {open && suggestions.length > 0 && (
          <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:40, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:9, boxShadow:'0 14px 38px rgba(0,0,0,0.45)', overflow:'hidden', padding:4 }}>
            {suggestions.map(s => (
              <button key={s} type="button" onMouseDown={e=>e.preventDefault()} onClick={()=>add(s)} style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'9px 10px', borderRadius:6, textAlign:'left', transition:'background .12s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--surface-elevated)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{ color:'var(--subtle-foreground)', flex:'0 0 auto', display:'flex' }}><Icons.music size={14} /></span>
                <span style={{ fontSize:13, color:'var(--foreground)', flex:1, minWidth:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s}</span>
                <span className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)', flex:'0 0 auto' }}>추가</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileEditScreen({ go }: { go: GoFn }) {
  const me = DATA.ME as unknown as Member;
  const [photo, setPhoto] = useState('default'); // 'kakao' | 'default'
  const [nickname, setNickname] = useState(me.nick || '');
  const [bio, setBio] = useState(me.bio || '');
  const [sessions, setSessions] = useState<string[]>(me.session.slice());
  const [years, setYears] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    me.session.forEach(s => { o[s] = '2'; });
    return o;
  });
  const [genres, setGenres] = useState(['인디','팝']);
  const [phone, setPhone] = useState(me.phone ?? '');
  const [dept, setDept] = useState(me.dept);
  const [studentId, setStudentId] = useState('20' + (28 - (me.gen-18)) + '0' + (100+me.gen));
  const [schoolYear, setSchoolYear] = useState('2');
  const [privacy, setPrivacy] = useState<Record<string, string>>({ name:'member', generation:'all', phone:'admin', department:'member', student_id:'admin', school_year:'member' });
  const [saved, setSaved] = useState(false);

  const toggleSession = (s: string) => {
    setSessions(prev => {
      const has = prev.includes(s);
      const next = has ? prev.filter(x=>x!==s) : [...prev, s];
      setYears(y => { const ny={...y}; if(has) delete ny[s]; else if(!(s in ny)) ny[s]='0'; return ny; });
      return next;
    });
  };
  const toggleGenre = (g: string) => setGenres(prev => prev.includes(g) ? prev.filter(x=>x!==g) : [...prev, g]);
  const save = () => { setSaved(true); setTimeout(()=>{ setSaved(false); go('members'); }, 900); };

  return (
    <div className="screen-in" style={{ maxWidth:640, margin:'0 auto', display:'flex', flexDirection:'column', gap:30 }}>
      {/* header */}
      <div>
        <button onClick={()=>go('members')} className="mono" style={{ display:'flex', width:'fit-content', alignItems:'center', gap:6, fontSize:12, color:'var(--muted-foreground)', marginBottom:14 }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--accent-hover)'} onMouseLeave={e=>e.currentTarget.style.color='var(--muted-foreground)'}>
          <Icons.chevron size={14} {...{style:{transform:'rotate(180deg)'}}} />부원으로
        </button>
        <U.Kicker>내 정보 수정</U.Kicker>
        <h1 className="display" style={{ margin:'12px 0 0', fontSize:52 }}>EDIT PROFILE</h1>
      </div>

      {/* photo + identity */}
      <div style={{ display:'flex', gap:22, alignItems:'center', padding:'22px', borderRadius:12, background:'var(--surface)', border:'1px solid var(--border-subtle)', flexWrap:'wrap' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:11, flex:'0 0 auto' }}>
          {/* avatar preview */}
          {photo==='kakao' ? (
            <div style={{ width:84, height:84, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
              background:'linear-gradient(140deg, #F7D94C, #E5A823)', color:'#3A2A08', border:'1px solid var(--border-subtle)' }}>
              <Icons.person size={42} />
            </div>
          ) : (
            <U.Avatar name={me.nick||me.name} size={84} hue="var(--accent-hover)" />
          )}
          {/* toggle */}
          <div style={{ display:'flex', gap:5, padding:4, borderRadius:9, background:'var(--background)', border:'1px solid var(--border-subtle)' }}>
            <button onClick={()=>setPhoto('kakao')} style={{
              display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:600, padding:'6px 11px', borderRadius:6, transition:'all .14s', whiteSpace:'nowrap',
              background: photo==='kakao' ? '#FEE500' : 'transparent', color: photo==='kakao' ? '#191600' : 'var(--muted-foreground)' }}>
              <span style={{ width:13, height:13, borderRadius:3, background: photo==='kakao'?'#191600':'var(--subtle-foreground)', display:'inline-flex', alignItems:'center', justifyContent:'center', color: photo==='kakao'?'#FEE500':'var(--background)', fontSize:9, fontWeight:900 }}>k</span>
              카카오
            </button>
            <button onClick={()=>setPhoto('default')} style={{
              fontSize:11.5, fontWeight:600, padding:'6px 13px', borderRadius:6, transition:'all .14s', whiteSpace:'nowrap',
              background: photo==='default' ? 'var(--accent)' : 'transparent', color: photo==='default' ? 'var(--accent-foreground)' : 'var(--muted-foreground)' }}>
              기본
            </button>
          </div>
        </div>
        <div style={{ flex:1, minWidth:160 }}>
          <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:19 }}>{me.name}</div>
          <div className="mono" style={{ fontSize:12, color:'var(--subtle-foreground)', marginTop:4 }}>{me.gen}기 · 정식 부원</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:11, fontSize:11.5, color:'var(--subtle-foreground)' }}>
            <Icons.lock size={13} /><span style={{ textWrap:'pretty' }}>이름·기수는 운영진만 수정할 수 있어요</span>
          </div>
        </div>
      </div>

      {/* basic info */}
      <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
        <h3 style={{ margin:0, fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15 }}>기본 정보</h3>

        <div>
          <FieldLabel hint="최대 20자">닉네임 (활동명)</FieldLabel>
          <input value={nickname} onChange={e=>setNickname(e.target.value)} maxLength={20} placeholder="미입력 시 실명으로 표시됩니다" style={inputStyle} />
        </div>

        <div>
          <FieldLabel hint={`${bio.length}/60`}>상태메시지</FieldLabel>
          <textarea value={bio} onChange={e=>setBio(e.target.value.slice(0,60))} rows={2} placeholder="프로필에 표시될 한 줄 소개를 적어보세요"
            style={{ ...inputStyle, resize:'vertical', minHeight:60, lineHeight:1.6 }} />
        </div>

        <div>
          <FieldLabel hint="최소 1개">세션</FieldLabel>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {SESSION_OPTIONS.map(s => <Chip key={s} active={sessions.includes(s)} onClick={()=>toggleSession(s)}>{s}</Chip>)}
          </div>
          {sessions.length>0 && (
            <div style={{ marginTop:14 }}>
              <span className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', letterSpacing:'0.04em' }}>세션별 경력 연차 (선택)</span>
              <div style={{ display:'flex', flexWrap:'wrap', gap:14, marginTop:9 }}>
                {sessions.map(s => (
                  <div key={s} style={{ display:'flex', alignItems:'center', gap:7 }}>
                    <span style={{ fontSize:12.5, color:'var(--muted-foreground)', minWidth:40 }}>{s}</span>
                    <input type="number" min={0} max={99} value={years[s] ?? ''} onChange={e=>setYears(y=>({...y,[s]:e.target.value}))}
                      style={{ width:54, padding:'7px 8px', borderRadius:7, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--foreground)', fontSize:13, textAlign:'center', fontFamily:'var(--font-mono)' }} />
                    <span style={{ fontSize:12, color:'var(--subtle-foreground)' }}>년</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <FieldLabel>선호 장르</FieldLabel>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {GENRE_OPTIONS.map(g => <Chip key={g} active={genres.includes(g)} onClick={()=>toggleGenre(g)}>{g}</Chip>)}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }} className="edit-grid">
          <div>
            <FieldLabel>연락처</FieldLabel>
            <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="010-0000-0000" style={inputStyle} />
          </div>
          <div>
            <FieldLabel>학과</FieldLabel>
            <input value={dept} onChange={e=>setDept(e.target.value)} placeholder="학과명" style={inputStyle} />
          </div>
          <div>
            <FieldLabel>학번</FieldLabel>
            <input value={studentId} onChange={e=>setStudentId(e.target.value)} placeholder="학번" style={inputStyle} />
          </div>
          <div>
            <FieldLabel>학년</FieldLabel>
            <select value={schoolYear} onChange={e=>setSchoolYear(e.target.value)} style={inputStyle}>
              <option value="">선택 안 함</option>
              {[1,2,3,4,5].map(y => <option key={y} value={y}>{y}학년</option>)}
              <option value="휴학">휴학</option>
              <option value="졸업">졸업</option>
            </select>
          </div>
        </div>
      </div>

      {/* privacy */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div>
          <h3 style={{ margin:0, fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15 }}>공개 범위 설정</h3>
          <p style={{ margin:'6px 0 0', fontSize:12, color:'var(--subtle-foreground)' }}>항목별로 누구에게 보일지 선택하세요.</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
          {PRIVACY_FIELDS.map(f => {
            const cur = privacy[f.key];
            const locked = f.scopes.length===1;
            return (
              <div key={f.key} style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                <span style={{ width:58, fontSize:13, color:'var(--muted-foreground)', flex:'0 0 auto' }}>{f.label}</span>
                <div style={{ display:'flex', gap:6 }}>
                  {f.scopes.map(sc => (
                    <button key={sc} disabled={locked} onClick={()=>!locked && setPrivacy(p=>({...p,[f.key]:sc}))} className="mono" style={{
                      fontSize:11, padding:'5px 12px', borderRadius:20, transition:'all .14s',
                      border:`1px solid ${cur===sc ? 'var(--accent)' : 'var(--border)'}`,
                      background: cur===sc ? 'var(--accent-muted)' : 'transparent',
                      color: cur===sc ? 'var(--accent-hover)' : 'var(--muted-foreground)',
                      cursor: locked ? 'not-allowed' : 'pointer', opacity: locked?0.7:1,
                    }}>{SCOPE_LABEL[sc]}</button>
                  ))}
                </div>
                {f.key==='phone' && cur==='all' && <span className="mono" style={{ fontSize:10.5, color:'#E08A8A' }}>⚠ 모두에게 공개됩니다</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* save */}
      <div style={{ display:'flex', gap:10, position:'sticky', bottom:0, paddingBottom:4 }}>
        <button className="btn btn-primary" onClick={save} style={{ flex:1, justifyContent:'center', padding:'13px' }}>
          {saved ? <><Icons.check size={16} />저장됨</> : '저장하기'}
        </button>
        <button className="btn" onClick={()=>go('members')} style={{ padding:'13px 22px' }}>취소</button>
      </div>
    </div>
  );
}

export const Screens = { MembersScreen, TeamsScreen, ProfileEditScreen };
