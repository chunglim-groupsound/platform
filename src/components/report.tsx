'use client';
import React from 'react';
import { Icons } from '@/components/icons';
import { UI } from '@/components/shared-ui';
import { Notifications } from '@/components/notifications';
import { DATA } from '@/lib/mock-data';
import { useRouter, usePathname } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════════════════
// 청림그룹사운드 리디자인
// 모듈: 신고 · 제보 (ReportModule)
// 메인 파일에서 src="modules/09-report.jsx" 로 로드됨.
// 로드 순서가 의존성 순서입니다 (이 파일은 09/12 번째).
// ═══════════════════════════════════════════════════════════════════════════


// ═════════════ REPORT — 신고 · 제보 ═════════════
const { useState, useEffect } = React;
const U = UI;
const D = DATA;
const ME = D.ME;

type ReportStatus = 'received' | 'reviewing' | 'resolved' | 'rejected';
type StatusCounts = Record<ReportStatus, number>;

interface ReportItem {
  id: string;
  cat: string;
  title: string;
  body: string;
  anon: boolean;
  reporterId: string;
  date: string;
  status: ReportStatus;
  reply?: string;
  replyAuthor?: string;
  replyDate?: string;
}

type NotificationPayload = {
  type: 'notice' | 'comment' | 'team' | 'report' | 'schedule' | 'system';
  title: string;
  body: string;
  target?: { screen: string; params?: Record<string, string> };
};

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

const CATS = [
  { key:'conduct', label:'부원 신고',    icon:Icons.person,    hue:'#C76A5A', desc:'부적절한 언행·괴롭힘' },
  { key:'gear',    label:'합주실·장비',  icon:Icons.guitar,    hue:'#5B8EC7', desc:'장비 고장·시설 문제' },
  { key:'noshow',  label:'예약·노쇼',    icon:Icons.calendar,  hue:'#D6A35A', desc:'무단 노쇼·예약 위반' },
  { key:'suggest', label:'운영 건의·제보',icon:Icons.megaphone, hue:'#6FAF8A', desc:'운영 개선 제안' },
  { key:'etc',     label:'기타',         icon:Icons.flag,      hue:'#8A93A8', desc:'그 외 사안' },
];
const catCfg = (k: string)=>CATS.find(c=>c.key===k)||CATS[4];

const STATUS = {
  received:  { label:'접수됨',    color:'#5B8EC7', bg:'rgba(91,142,199,0.1)', bd:'rgba(91,142,199,0.32)' },
  reviewing: { label:'확인 중',   color:'var(--accent-hover)', bg:'var(--accent-muted)', bd:'color-mix(in oklab, var(--accent) 40%, transparent)' },
  resolved:  { label:'처리 완료', color:'#7FD8A8', bg:'rgba(127,216,168,0.1)', bd:'rgba(127,216,168,0.3)' },
  rejected:  { label:'반려',      color:'var(--muted-foreground)', bg:'transparent', bd:'var(--border)' },
};
const STATUS_FLOW = ['received','reviewing','resolved'];

const SEED = [
  { id:'rp1', cat:'gear',    title:'합주실 A 기타 앰프 잡음', body:'주말 합주 때 앰프에서 지지직 잡음이 계속 났어요. 케이블을 바꿔도 동일합니다. 점검 부탁드려요.', anon:false, reporterId:'m2', date:'2026.06.10 21:14', status:'resolved', reply:'확인해보니 앰프 인풋 잭 접촉 불량이었어요. 6월 11일에 잭을 교체하고 테스트까지 마쳤습니다. 같은 증상이 다시 생기면 바로 알려주세요. 제보 감사합니다!', replyAuthor:'도형', replyDate:'2026.06.11 13:20' },
  { id:'rp2', cat:'noshow',  title:'금요일 저녁 예약 노쇼 반복', body:'금요일 야간 예약이 비는 경우가 잦아요. 노쇼 패널티를 강화해주시면 좋겠습니다.', anon:true, reporterId:'m2', date:'2026.06.04 10:02', status:'reviewing' },
  { id:'rp3', cat:'conduct', title:'합주 중 고성·다툼', body:'특정 팀 합주 중 큰 소리로 다투는 일이 있었습니다. 확인 부탁드려요.', anon:true, reporterId:'m11', date:'2026.06.02 23:40', status:'received' },
  { id:'rp4', cat:'suggest', title:'사물함 증설 요청', body:'개인 장비를 보관할 사물함이 부족합니다. 증설을 검토 부탁드립니다.', anon:false, reporterId:'m13', date:'2026.05.28 14:20', status:'resolved', reply:'좋은 제안 감사해요. 학생회 예산으로 사물함 8칸을 추가 신청했고, 6월 말 합주실 B 입구에 설치 예정입니다. 배정 방식은 별도 공지로 안내드릴게요.', replyAuthor:'박지훈', replyDate:'2026.06.05 16:40' },
  { id:'rp5', cat:'gear',    title:'드럼 하이햇 스탠드 흔들림', body:'하이햇 스탠드 나사가 헐거워 합주 중 자꾸 흔들립니다.', anon:false, reporterId:'m6', date:'2026.05.22 19:05', status:'received' },
];

const ReportStore = (function(){
  let items: ReportItem[] = SEED.map(r=>({...r})) as ReportItem[];
  let viewer: 'member' | 'admin' = (ME!.role==='ADMIN'||ME!.role==='SUPER_ADMIN')?'admin':'member';
  const listeners = new Set<()=>void>();
  const emit = ()=>listeners.forEach(l=>l());
  const uid = ()=> 'rp'+Math.random().toString(36).slice(2,7);
  function stamp(){ const d=new Date(); const p=(n: number)=>String(n).padStart(2,'0'); return `2026.06.12 ${p(d.getHours())}:${p(d.getMinutes())}`; }
  return {
    all: ()=>items,
    mine: ()=>items.filter(r=>r.reporterId===ME!.id),
    add:(r: { cat: string; title: string; body: string; anon: boolean })=>{ const full: ReportItem={ ...r, id:uid(), reporterId:ME!.id, date:stamp(), status:'received' }; items=[full,...items]; emit(); return full.id; },
    setStatus:(id: string, s: ReportStatus, reply?: string)=>{ items=items.map(r=>{ if(r.id!==id) return r; const u={...r,status:s}; if(reply!==undefined&&reply.trim()){ u.reply=reply.trim(); u.replyAuthor=(ME!.nick||ME!.name); u.replyDate=stamp(); } return u; }); emit(); },
    getViewer:()=>viewer,
    setViewer:(v: 'member' | 'admin')=>{ viewer=v; emit(); },
    subscribe:(l: ()=>void)=>{ listeners.add(l); return ()=>{ listeners.delete(l); }; },
  };
})();
function useReport(){ const [,f]=useState(0); useEffect(()=>{ return ReportStore.subscribe(()=>f(x=>x+1)); },[]); return ReportStore; }
const notify = (n: NotificationPayload)=>{ const s = Notifications && Notifications.NotificationStore; if(s) s.add(n); };

function StatusBadge({ status }: { status: ReportStatus }){
  const st = STATUS[status]||STATUS.received;
  return <span className="mono" style={{ fontSize:10.5, letterSpacing:'0.04em', padding:'4px 11px', borderRadius:20, color:st.color, background:st.bg, border:`1px solid ${st.bd}`, whiteSpace:'nowrap', flex:'0 0 auto' }}>{st.label}</span>;
}

function StatusTimeline({ status }: { status: ReportStatus }){
  if(status==='rejected') return (
    <div className="mono" style={{ fontSize:11.5, color:'var(--muted-foreground)', display:'flex', alignItems:'center', gap:8 }}>
      <span style={{ width:9, height:9, borderRadius:'50%', background:'var(--muted-foreground)' }}></span>반려 처리된 신고예요
    </div>
  );
  const steps = [['received','접수'],['reviewing','확인'],['resolved','완료']];
  const idx = STATUS_FLOW.indexOf(status);
  return (
    <div style={{ display:'flex', alignItems:'center', maxWidth:320 }}>
      {steps.map(([k,l],i)=>{
        const active = i<=idx;
        return (
          <React.Fragment key={k}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <span style={{ width:11, height:11, borderRadius:'50%', background: active?'var(--accent)':'transparent', border:`1.5px solid ${active?'var(--accent)':'var(--border)'}` }}></span>
              <span className="mono" style={{ fontSize:10, color: active?'var(--accent-hover)':'var(--subtle-foreground)' }}>{l}</span>
            </div>
            {i<steps.length-1 && <div style={{ flex:1, height:2, margin:'0 6px 18px', background: i<idx?'var(--accent)':'var(--border)' }}></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ReportViewerSwitch(){
  const store = useReport();
  const viewer = store.getViewer();
  const opts = [['member','일반 부원'],['admin','운영진']];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, flexWrap:'wrap' }}>
      <span className="mono" style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--subtle-foreground)', textTransform:'uppercase' }}>미리보기 권한</span>
      <div style={{ display:'flex', gap:4, padding:3, borderRadius:9, background:'var(--surface)', border:'1px solid var(--border-subtle)' }}>
        {opts.map(([v,l])=>{
          const on = viewer===v;
          return <button key={v} onClick={()=>store.setViewer(v as 'member' | 'admin')} style={{ fontSize:11.5, fontWeight:600, fontFamily:'var(--font-sans)', padding:'5px 12px', borderRadius:6, transition:'all .14s', whiteSpace:'nowrap',
            background:on?'var(--accent)':'transparent', color:on?'var(--accent-foreground)':'var(--muted-foreground)' }}>{l}</button>;
        })}
      </div>
    </div>
  );
}

function ReportTabNav(){
  const store = useReport();
  const mine = store.mine();
  const pathname = usePathname();
  const router = useRouter();
  const tabs = [
    { key:'new',  href:'/report/new',     label:'신고하기',     Icon:Icons.flag  },
    { key:'mine', href:'/report/history', label:'내 신고 내역', Icon:Icons.inbox },
  ];
  return (
    <div style={{ display:'flex', gap:4, borderBottom:'1px solid var(--border-subtle)' }}>
      {tabs.map(({key,href,label,Icon})=>{
        const on = pathname.startsWith(href);
        return (
          <button key={key} onClick={()=>router.push(href)} style={{ position:'relative', display:'flex', alignItems:'center', gap:8, padding:'12px 16px',
            fontFamily:'var(--font-sans)', fontWeight:on?700:500, fontSize:14.5, color:on?'var(--foreground)':'var(--muted-foreground)', whiteSpace:'nowrap', transition:'color .14s' }}>
            <Icon size={16} />{label}
            {key==='mine'&&mine.length>0&&<span className="mono" style={{ fontSize:11, color:on?'var(--accent-hover)':'var(--subtle-foreground)' }}>{mine.length}</span>}
            {on&&<span style={{ position:'absolute', left:0, right:0, bottom:-1, height:2, background:'var(--accent)', borderRadius:2 }} />}
          </button>
        );
      })}
    </div>
  );
}

function ReportPageHeader(){
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
      <div>
        <U.Kicker>안전한 동아리 · 비공개 접수</U.Kicker>
        <h1 className="display" style={{ margin:'14px 0 0', fontSize:64 }}>REPORT</h1>
      </div>
      <ReportViewerSwitch />
    </div>
  );
}

/* ── member: form ── */
function ReportForm({ onDone }: { onDone: () => void }){
  const store = useReport();
  const [cat, setCat] = useState('gear');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [anon, setAnon] = useState(true);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const submit = ()=>{
    if(!title.trim()){ setErr('제목을 입력해주세요'); return; }
    if(!body.trim()){ setErr('상세 내용을 입력해주세요'); return; }
    setErr('');
    store.add({ cat, title:title.trim(), body:body.trim(), anon });
    notify({ type:'report', title:'신고가 접수됐어요', body:`‘${title.trim()}’ 제보가 정상 접수됐어요. 운영진 확인 후 처리 상태를 알려드릴게요.`, target:{ screen:'report' } });
    setDone(true);
    setTimeout(onDone, 1150);
  };
  if(done) return (
    <div className="card" style={{ maxWidth:640, padding:'48px 28px', display:'flex', flexDirection:'column', alignItems:'center', gap:14, textAlign:'center' }}>
      <span style={{ width:56, height:56, borderRadius:'50%', background:'rgba(127,216,168,0.12)', border:'1px solid rgba(127,216,168,0.3)', color:'#7FD8A8', display:'flex', alignItems:'center', justifyContent:'center' }}><Icons.check size={28} /></span>
      <div>
        <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:19 }}>접수되었습니다</div>
        <div style={{ fontSize:13.5, color:'var(--muted-foreground)', marginTop:6 }}>운영진이 확인 후 처리 상태를 알림으로 보내드려요.</div>
      </div>
    </div>
  );
  return (
    <div style={{ maxWidth:640, display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', gap:11, alignItems:'flex-start', padding:'14px 16px', borderRadius:11, background:U.hexA('#6FAF8A',0.07), border:`1px solid ${U.hexA('#6FAF8A',0.25)}` }}>
        <span style={{ color:'#6FAF8A', flex:'0 0 auto', marginTop:1 }}><Icons.lock size={17} /></span>
        <div style={{ fontSize:12.5, color:'var(--muted-foreground)', lineHeight:1.6 }}>접수된 내용은 <b style={{ color:'var(--foreground)' }}>운영진만 열람</b>합니다. 익명으로 접수하면 작성자 정보가 표시되지 않아요.</div>
      </div>
      <div>
        <FieldLabel hint="필수">신고 유형</FieldLabel>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px,1fr))', gap:10 }}>
          {CATS.map(c=>{
            const on = cat===c.key;
            return (
              <button key={c.key} type="button" onClick={()=>setCat(c.key)} style={{ textAlign:'left', padding:'13px 14px', borderRadius:11, display:'flex', flexDirection:'column', gap:9,
                border:`1px solid ${on?c.hue:'var(--border-subtle)'}`, background:on?U.hexA(c.hue,0.08):'var(--surface)', transition:'all .14s' }}>
                <span style={{ color:c.hue }}>{React.createElement(c.icon,{size:19})}</span>
                <div>
                  <div style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:13.5, color:on?'var(--foreground)':'var(--muted-foreground)' }}>{c.label}</div>
                  <div className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)', marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <FieldLabel hint="최대 60자 · 필수">제목</FieldLabel>
        <input value={title} onChange={e=>{setTitle(e.target.value); setErr('');}} maxLength={60} placeholder="무슨 일이 있었나요?" style={{ ...inputStyle, borderColor: err&&!title.trim()?'#E08A8A':'var(--border)' }} />
      </div>
      <div>
        <FieldLabel hint="필수">상세 내용</FieldLabel>
        <textarea value={body} onChange={e=>{setBody(e.target.value); setErr('');}} rows={5} maxLength={1000} placeholder="언제·어디서·어떤 일이 있었는지 구체적으로 적어주세요. 사진·증빙이 있다면 함께 알려주세요." style={{ ...inputStyle, resize:'vertical', minHeight:120, lineHeight:1.65, borderColor: err&&!body.trim()?'#E08A8A':'var(--border)' }} />
      </div>
      <div>
        <FieldLabel hint="선택">증빙 첨부</FieldLabel>
        <div style={{ border:'1px dashed var(--border)', borderRadius:11, padding:'22px', display:'flex', flexDirection:'column', alignItems:'center', gap:7, color:'var(--subtle-foreground)' }}>
          <Icons.plus size={20} />
          <span className="mono" style={{ fontSize:11.5 }}>사진·스크린샷을 끌어다 놓기</span>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, padding:'14px 16px', borderRadius:11, border:'1px solid var(--border-subtle)', background:'var(--surface)' }}>
        <div>
          <div style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:13.5 }}>익명으로 접수</div>
          <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:3 }}>{anon?'작성자 정보가 운영진에게도 표시되지 않아요':'운영진에게 내 이름이 표시돼요'}</div>
        </div>
        <button type="button" onClick={()=>setAnon(a=>!a)} role="switch" aria-checked={anon} style={{ width:46, height:26, borderRadius:20, flex:'0 0 auto', position:'relative', transition:'background .16s', background: anon?'var(--accent)':'var(--border)' }}>
          <span style={{ position:'absolute', top:3, left:anon?23:3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left .16s' }}></span>
        </button>
      </div>
      {err && <div className="mono" style={{ fontSize:12, color:'#E08A8A' }}>{err}</div>}
      <div>
        <button className="btn btn-primary" onClick={submit} style={{ width:'100%', justifyContent:'center', padding:'13px' }}><Icons.send size={15} />접수하기</button>
      </div>
    </div>
  );
}

function MyReportCard({ r }: { r: ReportItem }){
  const [open, setOpen] = useState(false);
  const c = catCfg(r.cat);
  return (
    <div className="card" style={{ overflow:'hidden' }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:13, padding:'16px 18px' }}>
        <span style={{ width:40, height:40, borderRadius:10, flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center', color:c.hue, background:U.hexA(c.hue,0.12), border:`1px solid ${U.hexA(c.hue,0.3)}` }}>{React.createElement(c.icon,{size:18})}</span>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span className="mono" style={{ fontSize:10, color:c.hue }}>{c.label}</span>
            {r.anon && <span className="mono" style={{ fontSize:9.5, color:'var(--subtle-foreground)' }}>· 익명</span>}
          </div>
          <div style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:14.5, marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.title}</div>
          <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:4 }}>{r.date}</div>
        </div>
        <StatusBadge status={r.status} />
      </button>
      {open && (
        <div style={{ padding:'4px 18px 18px 71px' }}>
          <p style={{ margin:'0 0 16px', fontSize:13.5, color:'var(--muted-foreground)', lineHeight:1.65, whiteSpace:'pre-wrap' }}>{r.body}</p>
          <StatusTimeline status={r.status} />
          {r.reply && (
            <div style={{ marginTop:16, padding:'15px 17px', borderRadius:12, background:'var(--accent-muted)', border:'1px solid color-mix(in oklab, var(--accent) 30%, transparent)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9 }}>
                <span style={{ color:'var(--accent-hover)', display:'flex' }}><Icons.shield size={15} /></span>
                <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:13, color:'var(--accent-hover)' }}>운영진 답변</span>
                {r.replyDate && <span className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)', marginLeft:'auto' }}>{r.replyDate}</span>}
              </div>
              <p style={{ margin:0, fontSize:13.5, color:'var(--foreground)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{r.reply}</p>
              {r.replyAuthor && <div className="mono" style={{ fontSize:10.5, color:'var(--muted-foreground)', marginTop:10 }}>— {r.replyAuthor} · 운영진</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MyReports({ onNew }: { onNew: () => void }){
  const store = useReport();
  const mine = store.mine();
  if(mine.length===0) return (
    <div className="card" style={{ padding:'52px 24px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
      <span style={{ color:'var(--subtle-foreground)' }}><Icons.inbox size={32} /></span>
      <div className="mono" style={{ fontSize:13, color:'var(--subtle-foreground)' }}>접수한 신고가 없어요</div>
      <button className="btn" onClick={onNew}><Icons.flag size={15} />신고하기</button>
    </div>
  );
  return <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{mine.map(r => <MyReportCard key={r.id} r={r} />)}</div>;
}

/* ── admin: queue ── */
function AdminReportCard({ r }: { r: ReportItem }){
  const store = useReport();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(r.reply ?? "");
  const c = catCfg(r.cat);
  const reporter = r.anon ? null : D.MEMBERS.find(m=>m.id===r.reporterId);
  const change = (s: ReportStatus, withReply: boolean)=>{
    store.setStatus(r.id, s, withReply ? reply : undefined);
    if(r.reporterId===ME!.id){
      const base = `’${r.title}’ 제보가 ‘${STATUS[s].label}’ 상태로 변경됐어요.`;
      notify({ type:'report', title:'신고 상태가 변경됐어요', body: (withReply && reply.trim()) ? `${base}\n운영진 답변: “${reply.trim()}”` : base, target:{ screen:'report' } });
    }
  };
  return (
    <div className="card" style={{ overflow:'hidden', borderColor: r.status==='received'?'color-mix(in oklab, var(--accent) 22%, var(--border-subtle))':'var(--border-subtle)' }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ width:'100%', textAlign:'left', display:'flex', alignItems:'center', gap:13, padding:'16px 18px' }}>
        <span style={{ width:40, height:40, borderRadius:10, flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center', color:c.hue, background:U.hexA(c.hue,0.12), border:`1px solid ${U.hexA(c.hue,0.3)}` }}>{React.createElement(c.icon,{size:18})}</span>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span className="mono" style={{ fontSize:10, color:c.hue }}>{c.label}</span>
            <span className="mono" style={{ fontSize:9.5, color:'var(--subtle-foreground)' }}>· {r.anon?'익명 접수':(reporter?(reporter.nick||reporter.name):'부원')}</span>
          </div>
          <div style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:14.5, marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.title}</div>
          <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:4 }}>{r.date}</div>
        </div>
        <StatusBadge status={r.status} />
        <span style={{ color:'var(--subtle-foreground)', flex:'0 0 auto', display:'flex', transform: open?'rotate(90deg)':'none', transition:'transform .18s' }}><Icons.chevron size={16} /></span>
      </button>
      {open && (
        <div style={{ borderTop:'1px solid var(--border-subtle)', padding:'16px 18px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:14 }}>
            {r.anon ? (
              <span style={{ width:34, height:34, borderRadius:'50%', flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface-elevated)', color:'var(--subtle-foreground)', border:'1px solid var(--border-subtle)' }}><Icons.lock size={15} /></span>
            ) : (
              <U.Avatar name={reporter?(reporter.nick||reporter.name):'부원'} size={34} hue="var(--muted-foreground)" />
            )}
            <div>
              <div style={{ fontSize:13.5, fontWeight:600, fontFamily:'var(--font-sans)' }}>{r.anon?'익명 접수':(reporter?(reporter.nick||reporter.name):'부원')}</div>
              <div className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)', marginTop:2 }}>{r.anon?'작성자 비공개':(reporter?`${reporter.gen}기 · ${reporter.session.join('·')}`:'')}</div>
            </div>
          </div>
          <p style={{ margin:'0 0 18px', fontSize:13.5, color:'var(--foreground)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{r.body}</p>
          <div className="mono" style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--subtle-foreground)', textTransform:'uppercase', marginBottom:9 }}>진행 상태</div>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:20 }}>
            {(['received','reviewing'] as const).map(s=>{
              const on = r.status===s; const st = STATUS[s];
              return (
                <button key={s} onClick={()=>change(s,false)} className="mono" style={{ fontSize:11.5, padding:'7px 13px', borderRadius:7, whiteSpace:'nowrap', transition:'all .14s',
                  border:`1px solid ${on?st.color:'var(--border)'}`, background: on?st.bg:'transparent', color: on?st.color:'var(--muted-foreground)', fontWeight:on?700:400 }}>{st.label}</button>
              );
            })}
          </div>

          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:10, marginBottom:9, flexWrap:'wrap' }}>
            <span className="mono" style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--subtle-foreground)', textTransform:'uppercase' }}>운영진 답변</span>
            <span className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)' }}>{r.anon?'익명 접수자':(reporter?(reporter.nick||reporter.name):'부원')}에게 전달돼요</span>
          </div>
          <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={3} maxLength={500} placeholder="처리 결과나 안내를 남겨주세요. 처리 완료·반려 시 부원에게 함께 전달됩니다." style={{ ...inputStyle, resize:'vertical', minHeight:78, lineHeight:1.6 }} />
          <div style={{ display:'flex', gap:9, marginTop:11, flexWrap:'wrap' }}>
            <button onClick={()=>change('resolved',true)} className="btn btn-primary" style={{ flex:'1 1 auto', justifyContent:'center', padding:'11px' }}><Icons.check size={15} />처리 완료로 답변</button>
            <button onClick={()=>change('rejected',true)} className="btn" style={{ justifyContent:'center', padding:'11px 18px' }}>반려</button>
          </div>
          {r.reply && (
            <div className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)', marginTop:11, display:'flex', alignItems:'center', gap:6 }}>
              <Icons.check size={12} />{r.replyAuthor} · {r.replyDate} 답변 등록됨
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminQueue(){
  const store = useReport();
  const [filter, setFilter] = useState('all');
  const all = store.all();
  const counts = (['received','reviewing','resolved','rejected'] as const).reduce<StatusCounts>((o,s)=>{ o[s]=all.filter(r=>r.status===s).length; return o; },{} as StatusCounts);
  const list = (filter==='all' ? all : all.filter(r=>r.status===filter)).slice().sort((a,b)=>{
    const rank = (s: ReportStatus) => s==='received'?0 : s==='reviewing'?1 : 2; return rank(a.status)-rank(b.status);
  });
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(128px,1fr))', gap:12 }}>
        {[['received','접수','#5B8EC7'],['reviewing','확인 중','#D6A35A'],['resolved','처리 완료','#7FD8A8'],['rejected','반려','#8A93A8']].map(([k,l,h])=>(
          <div key={k} className="card" style={{ padding:'16px 18px' }}>
            <div className="display" style={{ fontSize:34, color:h, lineHeight:1 }}>{counts[k as ReportStatus]||0}</div>
            <div className="mono" style={{ fontSize:11, color:'var(--muted-foreground)', marginTop:6 }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {[['all','전체'],['received','접수'],['reviewing','확인 중'],['resolved','처리 완료'],['rejected','반려']].map(([k,l])=>{
          const on=filter===k;
          const cnt = k==='all'?all.length:(counts[k as ReportStatus]||0);
          return <button key={k} onClick={()=>setFilter(k)} className="mono" style={{ fontSize:12, padding:'7px 14px', borderRadius:20, whiteSpace:'nowrap',
            border:`1px solid ${on?'var(--accent)':'var(--border)'}`, background:on?'var(--accent-muted)':'transparent', color:on?'var(--accent-hover)':'var(--muted-foreground)', fontWeight:on?700:400 }}>{l}<span style={{ opacity:0.65, marginLeft:6 }}>{cnt}</span></button>;
        })}
      </div>
      {list.length===0 ? (
        <div className="card mono" style={{ padding:'52px', textAlign:'center', color:'var(--subtle-foreground)', fontSize:13 }}>해당 신고가 없어요</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{list.map(r => <AdminReportCard key={r.id} r={r} />)}</div>
      )}
    </>
  );
}

function ReportScreen(){
  const store = useReport();
  const viewer = store.getViewer();
  const router = useRouter();
  useEffect(()=>{ if(viewer!=='admin') router.replace('/report/new'); },[viewer,router]);
  if(viewer!=='admin') return null;
  return (
    <div className="screen-in" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <ReportPageHeader />
      <AdminQueue />
    </div>
  );
}

function ReportAdminSection() {
  const store = useReport();
  useEffect(() => { store.setViewer('admin'); }, []);
  return <AdminQueue />;
}

export const ReportModule = { ReportScreen, ReportTabNav, ReportPageHeader, ReportForm, MyReports, ReportStore, ReportAdminSection };

