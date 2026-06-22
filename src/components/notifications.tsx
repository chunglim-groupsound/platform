'use client';
import React from 'react';
import { Icons } from '@/components/icons';
import { UI } from '@/components/shared-ui';

// ═══════════════════════════════════════════════════════════════════════════
// 청림그룹사운드 리디자인
// 모듈: 알림 (Notifications)
// 메인 파일에서 src="modules/08-notifications.jsx" 로 로드됨.
// 로드 순서가 의존성 순서입니다 (이 파일은 08/12 번째).
// ═══════════════════════════════════════════════════════════════════════════


// ═════════════ NOTIFICATIONS — 알림 ═════════════
const { useState, useEffect, useRef } = React;
const U = UI;

const TYPE_CFG = {
  notice:   { label:'공지', icon:Icons.megaphone, hue:'#D6A35A' },
  comment:  { label:'댓글', icon:Icons.mail,      hue:'#5B8EC7' },
  team:     { label:'팀',   icon:Icons.guitar,    hue:'#8B7FC7' },
  report:   { label:'신고', icon:Icons.flag,      hue:'#6FAF8A' },
  schedule: { label:'일정', icon:Icons.calendar,  hue:'#5FA9A6' },
  system:   { label:'안내', icon:Icons.alert,     hue:'#C77A86' },
};

type NotifType = keyof typeof TYPE_CFG;

interface NotifTarget {
  screen: string;
  params?: Record<string, string>;
}

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  target?: NotifTarget;
}

type NewNotif = Omit<Notif, 'id' | 'read' | 'time'>;
type GoFn = (screen: string, params?: Record<string, string> | null) => void;

const SEED: Notif[] = [
  { id:'nt1', type:'notice',  title:'새 운영진 공지', body:'2026 정기공연 〈청림, 소리내다〉 라인업이 확정되었어요.', time:'10분 전', read:false, target:{ screen:'notice-detail', params:{ id:'n1' } } },
  { id:'nt2', type:'comment', title:'내 글에 댓글이 달렸어요', body:'박지훈 — "저도 갈래요!! 9시까지 합주실 앞으로 갈게요 🍻"', time:'1시간 전', read:false, target:{ screen:'notice-detail', params:{ id:'u5' } } },
  { id:'nt3', type:'team',    title:'팀 합류 제안', body:"'오버드라이브' 팀에서 보컬 세션으로 함께하자고 제안했어요.", time:'3시간 전', read:false, target:{ screen:'teams' } },
  { id:'nt4', type:'report',  title:'신고가 처리됐어요', body:"'합주실 A 기타 앰프 잡음' 제보가 처리 완료로 변경됐어요.", time:'어제', read:true, target:{ screen:'report' } },
  { id:'nt5', type:'schedule',title:'오늘 합주가 있어요', body:'야간비행 · 18:00–20:00 · 합주실 A', time:'어제', read:true, target:{ screen:'timetable' } },
  { id:'nt6', type:'system',  title:'회비 납부 마감 D-3', body:'상반기 회비(30,000원) 납부 기한이 6월 15일까지예요.', time:'2일 전', read:true, target:{ screen:'notice-detail', params:{ id:'n4' } } },
  { id:'nt7', type:'comment', title:'답글이 달렸어요', body:'하늘 — "오 반가워요! 평일 저녁 위주인데 가능하실까요?"', time:'4일 전', read:true, target:{ screen:'notice-detail', params:{ id:'u1' } } },
];

const NotificationStore = (function(){
  let items: Notif[] = SEED.map(n=>({...n}));
  const listeners = new Set<()=>void>();
  const emit = ()=>listeners.forEach(l=>l());
  return {
    all: ()=>items,
    unread: ()=>items.filter(n=>!n.read).length,
    markRead:(id: string)=>{ let ch=false; items=items.map(n=>{ if(n.id===id&&!n.read){ ch=true; return {...n,read:true}; } return n; }); if(ch) emit(); },
    markAllRead:()=>{ items=items.map(n=>n.read?n:{...n,read:true}); emit(); },
    add:(n: NewNotif)=>{ items=[{ id:'nt'+Math.random().toString(36).slice(2,7), read:false, time:'방금', ...n }, ...items]; emit(); },
    subscribe:(l: ()=>void)=>{ listeners.add(l); return ()=>listeners.delete(l); },
  };
})();
function useNotif(){ const [,f]=useState(0); useEffect(()=>{ const u=NotificationStore.subscribe(()=>f(x=>x+1)); return ()=>{ u(); }; },[]); return NotificationStore; }
function open_(go: GoFn, n: Notif){ NotificationStore.markRead(n.id); if(n.target) go(n.target.screen, n.target.params||null); }

function NotifIcon({ type, size=38 }: { type: NotifType; size?: number }){
  const c = TYPE_CFG[type] || TYPE_CFG.system;
  return (
    <span style={{ width:size, height:size, borderRadius:10, flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center',
      color:c.hue, background:U.hexA(c.hue,0.12), border:`1px solid ${U.hexA(c.hue,0.3)}` }}>
      {React.createElement(c.icon,{ size:Math.round(size*0.46) })}
    </span>
  );
}

function NotifRow({ n, onClick }: { n: Notif; onClick: ()=>void }){
  const base = n.read ? 'transparent' : 'var(--accent-muted)';
  return (
    <button onClick={onClick} style={{ width:'100%', textAlign:'left', display:'flex', gap:13, alignItems:'flex-start', padding:'15px 17px',
      background:base, borderBottom:'1px solid var(--border-subtle)', transition:'background .14s' }}
      onMouseEnter={e=>e.currentTarget.style.background='var(--surface-elevated)'}
      onMouseLeave={e=>e.currentTarget.style.background=base}>
      <NotifIcon type={n.type} size={38} />
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:14, color:'var(--foreground)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', minWidth:0 }}>{n.title}</span>
          {!n.read && <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)', flex:'0 0 auto' }}></span>}
        </div>
        <div style={{ fontSize:13, color:'var(--muted-foreground)', marginTop:4, lineHeight:1.55,
          display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{n.body}</div>
        <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:6 }}>{n.time}</div>
      </div>
    </button>
  );
}

function BellMenu({ go }: { go: GoFn }){
  const store = useNotif();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, right: 14 });
  const unread = store.unread();

  const toggle = () => {
    if (open) { setOpen(false); return; }
    if (btnRef.current) {
      const rect = (btnRef.current as HTMLElement).getBoundingClientRect();
      const vw = window.innerWidth;
      const modalW = Math.min(384, vw - 28);
      setPos({ top: rect.bottom + 12, right: Math.max(14, Math.min(vw - modalW - 14, vw - rect.right)) });
    }
    setOpen(true);
  };

  useEffect(()=>{
    if(!open) return;
    const onDoc=(e: MouseEvent)=>{ if(ref.current && !(ref.current as HTMLElement).contains(e.target as Node)) setOpen(false); };
    const onKey=(e: KeyboardEvent)=>{ if(e.key==='Escape') setOpen(false); };
    document.addEventListener('mousedown',onDoc); document.addEventListener('keydown',onKey);
    return ()=>{ document.removeEventListener('mousedown',onDoc); document.removeEventListener('keydown',onKey); };
  },[open]);
  const recent = store.all().slice(0,6);
  return (
    <div ref={ref} style={{ position:'relative', flex:'0 0 auto' }}>
      <button ref={btnRef} onClick={toggle} aria-label="알림" title="알림" style={{
        position:'relative', width:38, height:38, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
        color: open?'var(--accent-hover)':'var(--muted-foreground)', border:`1px solid ${open?'var(--border)':'transparent'}`,
        background: open?'var(--surface-elevated)':'transparent', transition:'all .14s' }}
        onMouseEnter={e=>{ if(!open){ e.currentTarget.style.color='var(--foreground)'; e.currentTarget.style.background='var(--surface-elevated)'; } }}
        onMouseLeave={e=>{ if(!open){ e.currentTarget.style.color='var(--muted-foreground)'; e.currentTarget.style.background='transparent'; } }}>
        <Icons.bell size={20} />
        {unread>0 && <span className="mono" style={{ position:'absolute', top:2, right:2, minWidth:16, height:16, padding:'0 4px', borderRadius:9,
          background:'var(--accent)', color:'#0E1626', fontSize:10, fontWeight:700, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center',
          border:'2px solid var(--surface)' }}>{unread>9?'9+':unread}</span>}
      </button>
      {open && (
        <div style={{ position:'fixed', top:pos.top, right:pos.right, width:384, maxWidth:'calc(100vw - 28px)', zIndex:300,
          background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, boxShadow:'0 18px 50px rgba(0,0,0,0.45)', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'14px 16px', borderBottom:'1px solid var(--border-subtle)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15 }}>알림</span>
              {unread>0 && <span className="mono" style={{ fontSize:10.5, color:'var(--accent-hover)', padding:'2px 8px', borderRadius:20, background:'var(--accent-muted)' }}>새 알림 {unread}</span>}
            </div>
            {unread>0 && <button onClick={()=>store.markAllRead()} className="mono" style={{ fontSize:11, color:'var(--muted-foreground)' }}
              onMouseEnter={e=>e.currentTarget.style.color='var(--accent-hover)'} onMouseLeave={e=>e.currentTarget.style.color='var(--muted-foreground)'}>모두 읽음</button>}
          </div>
          <div style={{ maxHeight:'min(58vh, 440px)', overflowY:'auto' }}>
            {recent.length===0 ? (
              <div className="mono" style={{ padding:'44px 20px', textAlign:'center', color:'var(--subtle-foreground)', fontSize:12.5 }}>새 알림이 없어요</div>
            ) : recent.map(n => <NotifRow key={n.id} n={n} onClick={()=>{ setOpen(false); open_(go,n); }} />)}
          </div>
          <button onClick={()=>{ setOpen(false); go('notifications'); }} style={{
            width:'100%', padding:'13px', borderTop:'1px solid var(--border-subtle)', fontFamily:'var(--font-sans)', fontWeight:600, fontSize:13,
            color:'var(--accent-hover)', display:'flex', alignItems:'center', justifyContent:'center', gap:6, whiteSpace:'nowrap', transition:'background .14s' }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--surface-elevated)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            알림 전체 보기 <Icons.arrow size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationsScreen({ go }: { go: GoFn }){
  const store = useNotif();
  const [filter, setFilter] = useState('all');
  const all = store.all();
  const unread = store.unread();
  const list = filter==='all' ? all : filter==='unread' ? all.filter(n=>!n.read) : all.filter(n=>n.type===filter);
  const filters = [['all','전체'],['unread','안 읽음'],['notice','공지'],['comment','댓글'],['team','팀'],['report','신고'],['schedule','일정']];
  return (
    <div className="screen-in" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
        <div>
          <U.Kicker>{unread>0?`읽지 않은 알림 ${unread}건`:'모두 확인했어요'}</U.Kicker>
          <h1 className="display" style={{ margin:'14px 0 0', fontSize:64 }}>알림</h1>
        </div>
        {unread>0 && <button className="btn" onClick={()=>store.markAllRead()}><Icons.check size={15} />모두 읽음</button>}
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {filters.map(([k,l])=>{
          const on = filter===k;
          const cnt = k==='all'?all.length : k==='unread'?unread : all.filter(n=>n.type===k).length;
          return (
            <button key={k} onClick={()=>setFilter(k!)} className="mono" style={{
              fontSize:12, padding:'7px 14px', borderRadius:20, whiteSpace:'nowrap', transition:'all .14s',
              border:`1px solid ${on?'var(--accent)':'var(--border)'}`, background:on?'var(--accent-muted)':'transparent',
              color:on?'var(--accent-hover)':'var(--muted-foreground)', fontWeight:on?700:400 }}>
              {l}{cnt>0 && <span style={{ opacity:0.65, marginLeft:6 }}>{cnt}</span>}
            </button>
          );
        })}
      </div>
      <div className="card" style={{ overflow:'hidden' }}>
        {list.length===0 ? (
          <div style={{ padding:'60px 20px', textAlign:'center' }}>
            <div style={{ color:'var(--subtle-foreground)', display:'flex', justifyContent:'center', marginBottom:12 }}><Icons.bell size={32} /></div>
            <div className="mono" style={{ fontSize:13, color:'var(--subtle-foreground)' }}>해당 알림이 없어요</div>
          </div>
        ) : list.map(n => <NotifRow key={n.id} n={n} onClick={()=>open_(go,n)} />)}
      </div>
    </div>
  );
}

export const Notifications = { NotificationStore, NotificationsScreen, BellMenu };
