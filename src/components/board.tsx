'use client';
import React from 'react';
import * as ReactDOM from 'react-dom';
import { Icons } from '@/components/icons';
import { UI } from '@/components/shared-ui';
import { DATA } from '@/lib/mock-data';

// ── Types ──────────────────────────────────────────────────────────────────
interface NoticeImage { url: string; name: string; }
interface Notice {
  id: string; kind: 'admin' | 'user'; tag: string; pinned: boolean;
  authorId: string; author: string; title: string; body: string;
  date: string; createdAt: string; updatedAt: string | null; views: number;
  rich?: boolean; images?: NoticeImage[];
}
interface Reply {
  id: string; authorId: string; author: string; body: string;
  date: string; parentReplyId: string | null;
}
interface ReplyNode extends Reply { children: ReplyNode[]; }
interface Comment {
  id: string; authorId: string; author: string; body: string;
  date: string; replies: Reply[];
}
interface Member {
  id: string; name: string; nick: string | null; gen: number;
  session: string[]; dept: string; role: string | null;
  adminRole?: string | null; me: boolean;
}
interface ReferenceItem {
  id: string; icon: string; label: string; value: string;
  secret: boolean; note: string;
}
interface Author {
  kind: 'member' | 'officer'; name: string; real: string | null;
  gen: number | null; session: string[] | null; role: string | null;
  adminRole?: string | null; me: boolean;
}
type GoFn = (screen: string, params?: Record<string, unknown>) => void;
interface NoticeFormInitial {
  kind: 'admin' | 'user'; tag: string; title: string; body: string;
  pinned?: boolean; images?: NoticeImage[]; id?: string;
  views?: number; createdAt?: string; updatedAt?: string | null;
  date?: string; authorId?: string; author?: string; rich?: boolean;
}
// ───────────────────────────────────────────────────────────────────────────


// ═════════════ NOTICES MODULE — 공지 (목록·세부·생성·수정) ═════════════
const { useState, useEffect, useRef } = React;
const U = UI;
const D = DATA;
const MEMBERS = D.MEMBERS as Member[];
const ME = D.ME as Member;

/* ── tag → hue ── */
const TAG_HUE: Record<string, string> = {
  공연:'#C77F4A', 합주실:'#5B8EC7', 회계:'#6FAF8A', 행사:'#C77A86',
  모집:'#8B7FC7', 자유:'#5FA9A6', 후기:'#D6A35A', 질문:'#9AA2AD',
};
const ADMIN_TAGS = ['공연','합주실','회계','행사','모집'];
const USER_TAGS  = ['모집','자유','행사','후기','질문'];
const KIND_LABEL: Record<string, string> = { admin:'공지', user:'부원 게시판' };

/* ── author resolution ── */
function resolveAuthor(n: Notice): Author {
  if (n.authorId && n.authorId !== 'officer') {
    const m = MEMBERS.find(x => x.id === n.authorId);
    if (m) return { kind:'member', name:m.nick || m.name, real:m.name, gen:m.gen, session:m.session, role:m.role, adminRole:m.adminRole, me:m.me };
  }
  return { kind:'officer', name:'운영진', real:null, gen:null, session:null, role:'ADMIN', me:false };
}

/* ── read receipts: which members have read each notice (seeded, deterministic) ── */
function _rhash(s: string): number { let h = 2166136261 >>> 0; for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
function seedReads(): Record<string, Set<string>> {
  const map: Record<string, Set<string>> = {};
  (D.NOTICES as Notice[]).forEach(n => {
    const ratio = Math.min(0.92, 0.42 + n.views / 950);
    const set = new Set<string>();
    MEMBERS.forEach(m => {
      if (m.id === n.authorId) { set.add(m.id); return; }
      if (_rhash(m.id + '|' + n.id) < ratio) set.add(m.id);
    });
    map[n.id] = set;
  });
  return map;
}

/* ── store: mutable + subscribable so create/edit/delete reflect everywhere ── */
const NoticeStore = (function(){
  let notices: Notice[] = (D.NOTICES as Notice[]).map(n => ({ ...n }));
  let comments: Record<string, Comment[]> = JSON.parse(JSON.stringify(D.NOTICE_COMMENTS));
  let reads: Record<string, Set<string>> = seedReads();
  let viewer = ME.role === 'ADMIN' || ME.role === 'SUPER_ADMIN' ? 'admin' : 'member';
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(l => l());
  const uid = (p: string) => p + Math.random().toString(36).slice(2,8);
  return {
    all: () => notices,
    get: (id: string) => notices.find(n => n.id === id),
    ofKind: (k: string) => notices.filter(n => n.kind === k),
    add: (n: Omit<Notice, 'id' | 'views' | 'createdAt' | 'updatedAt'>) => {
      const full: Notice = { ...n, id: uid('x'), views:0, createdAt: stamp(), updatedAt:null };
      notices = [full, ...notices];
      reads[full.id] = new Set([ME.id]);
      emit();
      return full.id;
    },
    update: (id: string, patch: Partial<Notice>) => { notices = notices.map(n => n.id===id ? { ...n, ...patch, updatedAt: stamp() } : n); emit(); },
    remove: (id: string) => { notices = notices.filter(n => n.id !== id); delete comments[id]; delete reads[id]; emit(); },
    bump: (id: string) => { const n = notices.find(x=>x.id===id); if (n) n.views++; },
    comments: (id: string): Comment[] => comments[id] || [],
    addComment: (id: string, body: string) => {
      comments[id] = [ ...(comments[id]||[]), { id: uid('c'), authorId: ME.id, author: ME.nick||ME.name, body, date: stampShort(), replies: [] } ];
      emit();
    },
    removeComment: (id: string, cid: string) => { comments[id] = (comments[id]||[]).filter(c => c.id !== cid); emit(); },
    addReply: (id: string, cid: string, body: string, parentReplyId: string | null = null) => {
      comments[id] = (comments[id]||[]).map(c => c.id===cid ? { ...c, replies:[ ...(c.replies||[]), { id: uid('r'), authorId: ME.id, author: ME.nick||ME.name, body, date: stampShort(), parentReplyId } ] } : c);
      emit();
    },
    removeReply: (id: string, cid: string, rid: string) => {
      comments[id] = (comments[id]||[]).map(c => {
        if (c.id !== cid) return c;
        const getDesc = (rs: Reply[], pid: string | null): string[] => rs.filter(r => r.parentReplyId === pid).flatMap(r => [r.id, ...getDesc(rs, r.id)]);
        const toRemove = new Set([rid, ...getDesc(c.replies||[], rid)]);
        return { ...c, replies:(c.replies||[]).filter(r=>!toRemove.has(r.id)) };
      });
      emit();
    },
    markRead: (id: string, mid: string) => { if (!reads[id]) reads[id] = new Set<string>(); if (!reads[id].has(mid)) { reads[id].add(mid); emit(); } },
    readStats: (id: string) => {
      const set = reads[id] || new Set<string>();
      const read = MEMBERS.filter(m => set.has(m.id));
      const unread = MEMBERS.filter(m => !set.has(m.id));
      return { read, unread, total: MEMBERS.length };
    },
    getViewer: () => viewer,
    setViewer: (v: string) => { viewer = v; emit(); },
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  };
})();
function useStore(){ const [,f] = useState(0); useEffect(() => { return NoticeStore.subscribe(() => f(x=>x+1)); }, []); return NoticeStore; }
function stamp(){ const d = new Date(); const p = (n: number) => String(n).padStart(2,'0'); return `2026.06.12 ${p(d.getHours())}:${p(d.getMinutes())}`; }
function stampShort(){ const d = new Date(); const p = (n: number) => String(n).padStart(2,'0'); return `06.12 ${p(d.getHours())}:${p(d.getMinutes())}`; }

function buildReplyTree(replies: Reply[]): ReplyNode[] {
  const map: Record<string, ReplyNode> = {};
  (replies||[]).forEach(r => (map[r.id] = { ...r, children:[] }));
  const roots: ReplyNode[] = [];
  (replies||[]).forEach(r => { if (r.parentReplyId && map[r.parentReplyId]) map[r.parentReplyId].children.push(map[r.id]); else roots.push(map[r.id]); });
  return roots;
}
function renderBody(text: string) {
  return text.split(/(@[^\s]+)/g).map((part, i) =>
    part.startsWith('@') ? <span key={i} style={{ color:'var(--accent-hover)', fontWeight:600 }}>{part}</span> : part
  );
}

/* permission helpers */
const canCreateAdmin = () => NoticeStore.getViewer() === 'admin';
const canEdit = (n: Notice) => NoticeStore.getViewer() === 'admin' || n.authorId === ME.id;

/* ── shared bits ── */
function TagBadge({ tag, size }: { tag: string; size?: string }) {
  const hue = TAG_HUE[tag] || 'var(--muted-foreground)';
  return (
    <span className="mono" style={{
      fontSize: size==='lg'?12:10.5, letterSpacing:'0.04em', padding: size==='lg'?'4px 11px':'3px 8px',
      borderRadius:4, color:hue, border:`1px solid ${U.hexA(hue,0.4)}`, background:U.hexA(hue,0.1),
      whiteSpace:'nowrap', flex:'0 0 auto',
    }}>{tag}</span>
  );
}

function AuthorChip({ author, size = 30, showMeta }: { author: Author; size?: number; showMeta?: boolean }) {
  const isOfficer = author.kind === 'officer';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:11, minWidth:0 }}>
      {isOfficer ? (
        <span style={{ width:size, height:size, borderRadius:'50%', flex:'0 0 auto', display:'flex', alignItems:'center', justifyContent:'center',
          background:'var(--accent-muted)', color:'var(--accent-hover)', border:'1px solid var(--border-subtle)' }}>
          <Icons.megaphone size={size*0.5} />
        </span>
      ) : (
        <U.Avatar name={author.name} size={size} hue={author.session && author.session.includes('보컬') ? 'var(--accent-hover)' : 'var(--muted-foreground)'} />
      )}
      <div style={{ minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize: size>34?15:13.5, whiteSpace:'nowrap' }}>{author.name}</span>
          {author.role && <span className="mono" style={{ fontSize:9.5, color:'var(--accent-hover)', padding:'1px 6px', borderRadius:3, background:'var(--accent-muted)', border:'1px solid var(--border-subtle)', whiteSpace:'nowrap', flex:'0 0 auto' }}>{author.role==='SUPER_ADMIN'?'개발':(author.adminRole||'운영진')}</span>}
          {author.me && <span className="mono" style={{ fontSize:9.5, color:'var(--subtle-foreground)' }}>나</span>}
        </div>
        {showMeta && !isOfficer && (
          <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {author.gen}기 · {author.session!.join('·')}
          </div>
        )}
        {showMeta && isOfficer && (
          <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:3 }}>청림그룹사운드 운영진</div>
        )}
      </div>
    </div>
  );
}

function ViewerSwitch() {
  const store = useStore();
  const viewer = store.getViewer();
  const opts: [string, string][] = [['member','일반 부원'],['admin','운영진']];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, flexWrap:'wrap' }}>
      <span className="mono" style={{ fontSize:10, letterSpacing:'0.1em', color:'var(--subtle-foreground)', textTransform:'uppercase' }}>미리보기 권한</span>
      <div style={{ display:'flex', gap:4, padding:3, borderRadius:9, background:'var(--surface)', border:'1px solid var(--border-subtle)' }}>
        {opts.map(([v,l]) => {
          const on = viewer === v;
          return (
            <button key={v} onClick={()=>store.setViewer(v)} style={{
              fontSize:11.5, fontWeight:600, fontFamily:'var(--font-sans)', padding:'5px 12px', borderRadius:6, transition:'all .14s', whiteSpace:'nowrap',
              background: on ? 'var(--accent)' : 'transparent', color: on ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
            }}>{l}</button>
          );
        })}
      </div>
    </div>
  );
}

/* ════════ LIST SCREEN ════════ */
function NoticesScreen({ go, initialTab = 'admin' }: { go: GoFn; initialTab?: string }) {
  const store = useStore();
  const [tab, setTab] = useState(initialTab);
  const [page, setPage] = useState(0);
  const PAGE = 5;

  const list = store.ofKind(tab);
  const pinned = list.filter(n => n.pinned);
  const rest = list.filter(n => !n.pinned);
  const pageCount = Math.ceil(rest.length / PAGE) || 1;
  const safePage = Math.min(page, pageCount - 1);
  const shownRest = rest.slice(safePage * PAGE, safePage * PAGE + PAGE);
  const switchTab = (k: string) => { go(k === 'admin' ? 'notices-admin' : 'notices-user'); };

  const canWrite = tab === 'user' ? true : canCreateAdmin();

  return (
    <div className="screen-in" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
        <div>
          <U.Kicker>동아리 소식</U.Kicker>
          <h1 className="display" style={{ margin:'14px 0 0', fontSize:64 }}>NOTICES</h1>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={()=>go('notice-create', { kind:tab })}>
            <Icons.plus size={15} />글쓰기
          </button>
        )}
      </div>
      <ViewerSwitch />

      {/* segmented tabs */}
      <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', borderBottom:'1px solid var(--border-subtle)', paddingBottom:0 }}>
        <div style={{ display:'flex', gap:4 }}>
          {([['admin','공지', Icons.megaphone],['user','부원 게시판', Icons.users]] as [string, string, React.FC<{size:number}>][]).map(([k,l,Ic]) => {
            const on = tab === k;
            const count = store.ofKind(k).length;
            return (
              <button key={k} onClick={()=>switchTab(k)} style={{
                position:'relative', display:'flex', alignItems:'center', gap:8, padding:'12px 16px', whiteSpace:'nowrap',
                fontFamily:'var(--font-sans)', fontWeight: on?700:500, fontSize:14.5,
                color: on ? 'var(--foreground)' : 'var(--muted-foreground)', transition:'color .14s',
              }}
                onMouseEnter={e=>{ if(!on) (e.currentTarget as HTMLButtonElement).style.color='var(--foreground)'; }}
                onMouseLeave={e=>{ if(!on) (e.currentTarget as HTMLButtonElement).style.color='var(--muted-foreground)'; }}>
                <Ic size={16} />{l}
                <span className="mono" style={{ fontSize:11, color: on?'var(--accent-hover)':'var(--subtle-foreground)' }}>{count}</span>
                {on && <span style={{ position:'absolute', left:0, right:0, bottom:-1, height:2, background:'var(--accent)', borderRadius:2 }}></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* admin reference cards */}
      {tab === 'admin' && <ReferenceCards />}

      {/* tab intro */}
      <p style={{ margin:0, fontSize:12.5, color:'var(--subtle-foreground)', lineHeight:1.6 }}>
        {tab === 'admin'
          ? '동아리 운영에 관한 공식 공지입니다. 운영진만 작성할 수 있어요.'
          : '부원들이 자유롭게 올리는 모집·소통 글입니다. 누구나 작성하고 댓글로 소통할 수 있어요.'}
      </p>

      {/* pinned */}
      {pinned.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {pinned.map(n => <NoticeCard key={n.id} n={n} go={go} pinned />)}
        </div>
      )}

      {/* list */}
      <div style={{ border:'1px solid var(--border-subtle)', borderRadius:10, overflow:'hidden' }}>
        {shownRest.length === 0 && (
          <div style={{ padding:'40px 20px', textAlign:'center', color:'var(--subtle-foreground)', fontSize:13 }}>아직 공지가 없습니다.</div>
        )}
        {shownRest.map((n,i) => <NoticeRow key={n.id} n={n} go={go} divider={i>0} />)}
      </div>

      <Pagination page={safePage} pageCount={pageCount} onChange={setPage} />
    </div>
  );
}

/* ── 운영진 상시 안내 store: 등록·수정·삭제 (구독형) ── */
const RefStore = (function(){
  let items: ReferenceItem[] = (D.REFERENCE as ReferenceItem[]).map(r => ({ ...r }));
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(l => l());
  const uid = () => 'r' + Math.random().toString(36).slice(2,7);
  return {
    all: () => items,
    add: (r: Omit<ReferenceItem, 'id'>) => { items = [...items, { ...r, id: uid() }]; emit(); },
    update: (id: string, patch: Partial<ReferenceItem>) => { items = items.map(r => r.id === id ? { ...r, ...patch } : r); emit(); },
    remove: (id: string) => { items = items.filter(r => r.id !== id); emit(); },
    subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  };
})();
function useRefStore(){ const [,f] = useState(0); useEffect(() => { return RefStore.subscribe(() => f(x=>x+1)); }, []); return RefStore; }

const REF_ICONS = ['lock','book','guitar','calendar','clock','settings','megaphone','pin','mail','person'];

function ReferenceCards() {
  const store = useRefStore();
  const isAdmin = NoticeStore.getViewer() === 'admin';
  const [editing, setEditing] = useState<{ mode: 'create' | 'edit'; item?: ReferenceItem } | null>(null);
  const items = store.all();
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
        <span style={{ color:'var(--accent)', display:'flex' }}><Icons.pin size={14} /></span>
        <span className="mono" style={{ fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted-foreground)' }}>상시 안내</span>
        {isAdmin && <span className="mono" style={{ fontSize:9.5, color:'var(--accent-hover)', padding:'2px 7px', borderRadius:3, background:'var(--accent-muted)', border:'1px solid var(--border-subtle)' }}>운영진 전용</span>}
        <span style={{ flex:1 }}></span>
        {isAdmin && (
          <button className="btn" style={{ padding:'7px 13px', fontSize:12.5 }} onClick={()=>setEditing({ mode:'create' })}>
            <Icons.plus size={14} />상시 공지 등록
          </button>
        )}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }} className="console-grid">
        {items.map(r => (
          <RefCard key={r.id} r={r} isAdmin={isAdmin} onEdit={()=>setEditing({ mode:'edit', item:r })} onDelete={()=>store.remove(r.id)} />
        ))}
        {isAdmin && (
          <button onClick={()=>setEditing({ mode:'create' })} className="card" style={{
            padding:'16px 17px', display:'flex', alignItems:'center', justifyContent:'center', gap:8, minHeight:118,
            border:'1.5px dashed var(--border)', background:'transparent', color:'var(--muted-foreground)', cursor:'pointer', transition:'all .14s',
          }}
            onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor='var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color='var(--accent-hover)'; }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLButtonElement).style.color='var(--muted-foreground)'; }}>
            <Icons.plus size={16} /><span style={{ fontSize:12.5 }}>상시 공지 추가</span>
          </button>
        )}
      </div>
      {editing && (
        <RefFormModal
          mode={editing.mode}
          initial={editing.item || { icon:'book', label:'', value:'', secret:false, note:'' } as Omit<ReferenceItem, 'id'>}
          onClose={()=>setEditing(null)}
          onSubmit={(data: Omit<ReferenceItem, 'id'>)=>{ if(editing.mode==='edit' && editing.item) store.update(editing.item.id, data); else store.add(data); setEditing(null); }}
        />
      )}
    </div>
  );
}

function RefCard({ r, isAdmin, onEdit, onDelete }: { r: ReferenceItem; isAdmin: boolean; onEdit: () => void; onDelete: () => void }) {
  const [show, setShow] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const Ic = (Icons as Record<string, React.FC<{size: number}>>)[r.icon] || Icons.book;
  return (
    <div className="card" style={{ padding:'16px 17px', display:'flex', flexDirection:'column', gap:10, position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <span style={{ width:30, height:30, borderRadius:7, background:'var(--accent-muted)', color:'var(--accent-hover)', display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto' }}><Ic size={16} /></span>
        <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1, minWidth:0 }}>{r.label}</span>
        {isAdmin && (
          <div style={{ display:'flex', gap:4, flex:'0 0 auto' }}>
            <button onClick={onEdit} title="수정" className="ref-icon-btn"><Icons.edit size={13} /></button>
            <button onClick={()=>setConfirmDel(true)} title="삭제" className="ref-icon-btn"><Icons.x size={13} /></button>
          </div>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
        <span className="mono" style={{ fontSize: r.secret?20:14, fontWeight:700, letterSpacing: r.secret?'0.18em':'0', color:'var(--foreground)' }}>
          {r.secret ? (show ? r.value : '••••') : r.value}
        </span>
        {r.secret && (
          <button onClick={()=>setShow(s=>!s)} className="mono" style={{ fontSize:10.5, color:'var(--accent-hover)', padding:'3px 9px', borderRadius:5, border:'1px solid var(--border)' }}>
            {show ? '숨기기' : '보기'}
          </button>
        )}
      </div>
      <p style={{ margin:0, fontSize:11.5, color:'var(--subtle-foreground)', lineHeight:1.6, textWrap:'pretty' }}>{r.note}</p>
      {confirmDel && (
        <div style={{ position:'absolute', inset:0, borderRadius:'inherit', background:'color-mix(in oklab, var(--surface) 92%, transparent)', WebkitBackdropFilter:'blur(2px)', backdropFilter:'blur(2px)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:11, padding:16, textAlign:'center' }}>
          <span style={{ fontSize:13, color:'var(--foreground)', fontWeight:600, textWrap:'pretty' }}>이 상시 공지를 삭제할까요?</span>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn" style={{ borderColor:'rgba(224,138,138,0.4)', color:'#E08A8A' }} onClick={()=>{ setConfirmDel(false); onDelete(); }}>삭제</button>
            <button className="btn" onClick={()=>setConfirmDel(false)}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}

function RefFormModal({ mode, initial, onClose, onSubmit }: {
  mode: 'create' | 'edit';
  initial: Omit<ReferenceItem, 'id'>;
  onClose: () => void;
  onSubmit: (data: Omit<ReferenceItem, 'id'>) => void;
}) {
  const [icon, setIcon] = useState(initial.icon || 'book');
  const [label, setLabel] = useState(initial.label || '');
  const [value, setValue] = useState(initial.value || '');
  const [secret, setSecret] = useState(!!initial.secret);
  const [note, setNote] = useState(initial.note || '');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if(e.key==='Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const valid = label.trim() && value.trim();
  const submit = () => { if(!valid) return; onSubmit({ icon, label:label.trim(), value:value.trim(), secret, note:note.trim() }); };
  return ReactDOM.createPortal((
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()} style={{ maxWidth:460 }}>
        <button onClick={onClose} className="modal-close" aria-label="닫기"><Icons.x size={18} /></button>
        <U.Kicker>운영진 상시 안내</U.Kicker>
        <h2 style={{ margin:'12px 0 0', fontFamily:'var(--font-sans)', fontWeight:700, fontSize:22, letterSpacing:'-0.02em' }}>{mode==='edit' ? '상시 공지 수정' : '상시 공지 등록'}</h2>
        <p style={{ margin:'8px 0 0', fontSize:12.5, color:'var(--subtle-foreground)', lineHeight:1.6, textWrap:'pretty' }}>공지 목록 상단에 항상 노출되는 안내 카드입니다. 동방 비밀번호·운영 수칙처럼 부원들이 자주 찾는 정보를 등록하세요.</p>

        <div style={{ display:'flex', flexDirection:'column', gap:20, marginTop:22 }}>
          {/* icon */}
          <div>
            <FieldLabel>아이콘</FieldLabel>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {REF_ICONS.map(k => {
                const on = icon === k;
                const Ik = (Icons as Record<string, React.FC<{size: number}>>)[k] || Icons.book;
                return (
                  <button key={k} type="button" onClick={()=>setIcon(k)} style={{
                    width:38, height:38, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .14s',
                    border:`1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-muted)' : 'transparent',
                    color: on ? 'var(--accent-hover)' : 'var(--muted-foreground)', cursor:'pointer',
                  }}><Ik size={17} /></button>
                );
              })}
            </div>
          </div>
          {/* label */}
          <div>
            <FieldLabel hint={`${label.length}/24`}>항목 이름</FieldLabel>
            <input value={label} onChange={e=>setLabel(e.target.value.slice(0,24))} placeholder="예) 동방 비밀번호" style={formInput} />
          </div>
          {/* value */}
          <div>
            <FieldLabel hint={`${value.length}/40`}>내용</FieldLabel>
            <input value={value} onChange={e=>setValue(e.target.value.slice(0,40))} placeholder="예) 1204" style={formInput} />
          </div>
          {/* secret toggle */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, padding:'13px 15px', borderRadius:10, border:'1px solid var(--border-subtle)', background:'var(--surface)' }}>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13.5, fontWeight:600, display:'flex', alignItems:'center', gap:7 }}><Icons.lock size={14} />민감 정보로 가리기</div>
              <div style={{ fontSize:11.5, color:'var(--subtle-foreground)', marginTop:3, textWrap:'pretty' }}>내용을 ••••로 가리고 '보기'를 눌러야 표시됩니다.</div>
            </div>
            <button type="button" onClick={()=>setSecret(s=>!s)} style={{ width:46, height:26, borderRadius:20, flex:'0 0 auto', position:'relative', transition:'all .16s', background: secret ? 'var(--accent)' : 'var(--border)' }}>
              <span style={{ position:'absolute', top:3, left: secret?23:3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left .16s' }}></span>
            </button>
          </div>
          {/* note */}
          <div>
            <FieldLabel hint="선택">안내 메모</FieldLabel>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="부원들에게 전할 추가 설명을 적어주세요" style={{ ...formInput, resize:'vertical', lineHeight:1.6 }} />
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:24 }}>
          <button className="btn btn-primary" onClick={submit} disabled={!valid} style={{ flex:1, justifyContent:'center', padding:'12px', opacity: valid?1:0.5 }}>
            {mode==='edit' ? '수정 완료' : '등록'}
          </button>
          <button className="btn" onClick={onClose} style={{ padding:'12px 20px' }}>취소</button>
        </div>
      </div>
    </div>
  ), document.body);
}

/* big pinned card */
function NoticeCard({ n, go, pinned }: { n: Notice; go: GoFn; pinned?: boolean }) {
  const author = resolveAuthor(n);
  return (
    <div className="card card-hover" style={{ padding:'20px 22px', display:'flex', gap:16, alignItems:'flex-start' }} onClick={()=>go('notice-detail', { id:n.id })}>
      <span style={{ color:'var(--accent)', marginTop:2, flex:'0 0 auto' }}><Icons.pin size={17} /></span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:9, flexWrap:'wrap' }}>
          <TagBadge tag={n.tag} />
          <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)' }}>{n.date} · {author.name}</span>
          <span className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', display:'inline-flex', alignItems:'center', gap:4, marginLeft:'auto' }}>
            <Icons.search size={11} />{n.views}
          </span>
        </div>
        <div style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:18, letterSpacing:'-0.01em', textWrap:'pretty' }}>{n.title}</div>
        <div style={{ fontSize:13.5, color:'var(--muted-foreground)', marginTop:8, lineHeight:1.65, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{n.body}</div>
      </div>
    </div>
  );
}

/* list row */
function NoticeRow({ n, go, divider }: { n: Notice; go: GoFn; divider?: boolean }) {
  const author = resolveAuthor(n);
  const cc = NoticeStore.comments(n.id).length;
  return (
    <div onClick={()=>go('notice-detail', { id:n.id })} style={{
      display:'flex', alignItems:'center', gap:15, padding:'16px 18px', cursor:'pointer',
      borderTop: divider ? '1px solid var(--border-subtle)' : 'none', transition:'background .14s',
    }}
      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='var(--surface-elevated)'}
      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background='transparent'}>
      <span style={{ width:50, flex:'0 0 auto', display:'flex', justifyContent:'center' }}><TagBadge tag={n.tag} /></span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:14.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{n.title}</span>
          {cc > 0 && <span className="mono" style={{ fontSize:11, color:'var(--accent-hover)', flex:'0 0 auto' }}>[{cc}]</span>}
        </div>
        <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:4 }}>{author.name}</div>
      </div>
      <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)', flex:'0 0 auto', display:'none' }} data-views>{n.views}</span>
      <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)', flex:'0 0 auto' }}>{n.date}</span>
      <span style={{ color:'var(--subtle-foreground)', flex:'0 0 auto' }}><Icons.chevron size={15} /></span>
    </div>
  );
}

/* ════════ DETAIL SCREEN ════════ */
function NoticeDetailScreen({ go, id }: { go: GoFn; id: string }) {
  const store = useStore();
  const n = store.get(id);
  useEffect(() => { if (n) { store.bump(id); store.markRead(id, ME.id); } }, [id]);
  const [confirmDel, setConfirmDel] = useState(false);

  if (!n) return (
    <div className="screen-in" style={{ textAlign:'center', padding:'80px 20px' }}>
      <p style={{ color:'var(--muted-foreground)' }}>공지를 찾을 수 없습니다.</p>
      <button className="btn" style={{ marginTop:16 }} onClick={()=>go('notices')}>목록으로</button>
    </div>
  );

  const author = resolveAuthor(n);
  const editable = canEdit(n);
  const siblings = store.ofKind(n.kind);
  const idx = siblings.findIndex(x => x.id === n.id);
  const prev = siblings[idx-1];
  const next = siblings[idx+1];

  const listScreen = n.kind === 'admin' ? 'notices-admin' : 'notices-user';
  const del = () => { store.remove(n.id); go(listScreen); };

  return (
    <div className="screen-in" style={{ maxWidth:760, margin:'0 auto', display:'flex', flexDirection:'column', gap:0 }}>
      {/* back */}
      <button onClick={()=>go(listScreen)} className="mono" style={{ display:'flex', width:'fit-content', alignItems:'center', gap:6, fontSize:12, color:'var(--muted-foreground)', marginBottom:20 }}
        onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color='var(--accent-hover)'} onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color='var(--muted-foreground)'}>
        <Icons.chevron size={14} {...{style:{transform:'rotate(180deg)'}}} />{KIND_LABEL[n.kind]} 목록
      </button>

      {/* kind + tag + pinned */}
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:14, flexWrap:'wrap' }}>
        <span className="mono" style={{ fontSize:11, letterSpacing:'0.08em', color: n.kind==='admin'?'var(--accent-hover)':'var(--muted-foreground)', textTransform:'uppercase' }}>{KIND_LABEL[n.kind]}</span>
        <span style={{ color:'var(--border)' }}>·</span>
        <TagBadge tag={n.tag} size="lg" />
        {n.pinned && <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:'var(--accent)', fontSize:11.5, fontWeight:600 }}><Icons.pin size={13} />고정</span>}
      </div>

      {/* title */}
      <h1 style={{ margin:0, fontFamily:'var(--font-sans)', fontWeight:700, fontSize:30, lineHeight:1.25, letterSpacing:'-0.02em', textWrap:'pretty' }}>{n.title}</h1>

      {/* author + meta */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginTop:20, paddingBottom:20, borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
        <AuthorChip author={author} size={42} showMeta />
        <div className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)', textAlign:'right', lineHeight:1.7 }}>
          <div>{n.createdAt}</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'flex-end' }}>
            {n.updatedAt && <span>수정됨 {n.updatedAt}</span>}
            <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Icons.search size={11} />조회 {n.views}</span>
          </div>
        </div>
      </div>

      {/* body */}
      {n.rich
        ? <div className="notice-body" style={{ fontSize:15, color:'var(--foreground)', lineHeight:1.85, padding:'28px 0 8px' }} dangerouslySetInnerHTML={{ __html: n.body }} />
        : <div style={{ fontSize:15, color:'var(--foreground)', lineHeight:1.85, whiteSpace:'pre-line', padding:'28px 0 8px', textWrap:'pretty' }}>{n.body}</div>}

      {/* attached images */}
      {n.images && n.images.length > 0 && <ImageGallery images={n.images} />}

      {/* edit / delete */}
      {editable && (
        <div style={{ display:'flex', gap:9, marginTop:18, paddingTop:20, borderTop:'1px solid var(--border-subtle)' }}>
          <button className="btn" onClick={()=>go('notice-edit', { id:n.id })}><Icons.edit size={14} />수정</button>
          {confirmDel ? (
            <div style={{ display:'flex', gap:7, alignItems:'center' }}>
              <span style={{ fontSize:12.5, color:'#E08A8A' }}>삭제할까요?</span>
              <button className="btn" style={{ borderColor:'rgba(224,138,138,0.4)', color:'#E08A8A' }} onClick={del}>삭제</button>
              <button className="btn btn-ghost" style={{ padding:'9px 8px' }} onClick={()=>setConfirmDel(false)}>취소</button>
            </div>
          ) : (
            <button className="btn" style={{ color:'var(--muted-foreground)' }} onClick={()=>setConfirmDel(true)}><Icons.ban size={14} />삭제</button>
          )}
        </div>
      )}

      {/* read receipts — 운영진 공지의 읽음 확인 (운영진/작성자에게만 노출) */}
      {n.kind === 'admin' && (store.getViewer() === 'admin' || n.authorId === ME.id) && <ReadReceipt noticeId={n.id} />}

      {/* comments — 부원 공지 only */}
      {n.kind === 'user' && <CommentSection noticeId={n.id} />}

      {/* prev / next */}
      <div style={{ marginTop:36, borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border-subtle)' }}>
        {prev && <NavLink dir="이전 글" n={prev} go={go} />}
        {next && <NavLink dir="다음 글" n={next} go={go} top={!!prev} />}
        {!prev && !next && <div style={{ padding:'16px 4px', fontSize:12.5, color:'var(--subtle-foreground)' }}>이 분류의 다른 글이 없습니다.</div>}
      </div>

      <div style={{ marginTop:24, display:'flex', justifyContent:'center' }}>
        <button className="btn" onClick={()=>go(listScreen)}>목록으로</button>
      </div>
    </div>
  );
}

function NavLink({ dir, n, go, top }: { dir: string; n: Notice; go: GoFn; top?: boolean }) {
  return (
    <div onClick={()=>go('notice-detail', { id:n.id })} style={{
      display:'flex', alignItems:'center', gap:14, padding:'15px 4px', cursor:'pointer',
      borderTop: top ? '1px solid var(--border-subtle)' : 'none', transition:'background .14s',
    }}
      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='var(--surface-elevated)'}
      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background='transparent'}>
      <span className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', width:48, flex:'0 0 auto' }}>{dir}</span>
      <span style={{ fontSize:13.5, color:'var(--muted-foreground)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1, minWidth:0 }}>{n.title}</span>
      <TagBadge tag={n.tag} />
    </div>
  );
}

/* ── read-receipt panel: 누가 읽었는지 · 몇 명이 안 읽었는지 ── */
function ReadReceipt({ noticeId }: { noticeId: string }) {
  const store = useStore();
  const { read, unread, total } = store.readStats(noticeId);
  const [tab, setTab] = useState<'read' | 'unread'>('unread');
  const [nudged, setNudged] = useState(false);
  const pct = total ? Math.round(read.length / total * 100) : 0;
  const list = tab === 'read' ? read : unread;

  return (
    <section style={{ marginTop:30, border:'1px solid var(--border)', borderRadius:14, background:'var(--surface)', overflow:'hidden' }}>
      {/* header */}
      <div style={{ display:'flex', alignItems:'center', gap:9, padding:'15px 18px', borderBottom:'1px solid var(--border-subtle)' }}>
        <span style={{ color:'var(--accent-hover)', display:'flex' }}><Icons.check size={17} /></span>
        <h3 style={{ margin:0, fontFamily:'var(--font-sans)', fontWeight:600, fontSize:15 }}>읽음 확인</h3>
        <span className="mono" style={{ fontSize:9.5, color:'var(--accent-hover)', padding:'2px 7px', borderRadius:3, background:'var(--accent-muted)', border:'1px solid var(--border-subtle)' }}>운영진 전용</span>
        <span style={{ flex:1 }}></span>
        <span className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)', whiteSpace:'nowrap' }}>전체 {total}명</span>
      </div>

      {/* summary + progress */}
      <div style={{ padding:'17px 18px 16px' }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:7 }}>
            <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:34, letterSpacing:'-0.02em' }}>{read.length}</span>
            <span className="mono" style={{ fontSize:12, color:'var(--muted-foreground)' }}>명 읽음 · {pct}%</span>
          </div>
          <span style={{ color:'var(--border)' }}>·</span>
          <div style={{ display:'flex', alignItems:'baseline', gap:7 }}>
            <span style={{ fontFamily:'var(--font-sans)', fontWeight:700, fontSize:34, letterSpacing:'-0.02em', color: unread.length ? '#E0A35A' : 'var(--muted-foreground)' }}>{unread.length}</span>
            <span className="mono" style={{ fontSize:12, color:'var(--muted-foreground)' }}>명 안 읽음</span>
          </div>
        </div>
        <div style={{ marginTop:14, height:7, borderRadius:4, background:'var(--surface-elevated)', overflow:'hidden' }}>
          <div style={{ width:pct+'%', height:'100%', borderRadius:4, background:'linear-gradient(90deg, var(--accent), var(--accent-hover))', transition:'width .4s ease' }}></div>
        </div>
      </div>

      {/* tabs */}
      <div style={{ display:'flex', padding:'0 18px', borderBottom:'1px solid var(--border-subtle)' }}>
        {([['read','읽음',read.length],['unread','안 읽음',unread.length]] as [string, string, number][]).map(([k,l,c]) => {
          const on = tab === k;
          return (
            <button key={k} onClick={()=>setTab(k as 'read' | 'unread')} style={{
              padding:'11px 2px', marginRight:18, fontFamily:'var(--font-sans)', fontSize:13, fontWeight: on?600:400,
              color: on?'var(--foreground)':'var(--muted-foreground)', borderBottom: on?'2px solid var(--accent)':'2px solid transparent', transition:'color .14s',
            }}>{l} <span className="mono" style={{ fontSize:11, color: on?'var(--accent-hover)':'var(--subtle-foreground)' }}>{c}</span></button>
          );
        })}
      </div>

      {/* member list */}
      <div style={{ maxHeight:284, overflowY:'auto', padding:'10px 10px 12px' }}>
        {list.length === 0 ? (
          <p style={{ textAlign:'center', color:'var(--subtle-foreground)', fontSize:13, padding:'28px 0' }}>
            {tab==='unread' ? '모든 부원이 읽었어요.' : '아직 읽은 부원이 없어요.'}
          </p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(152px, 1fr))', gap:2 }}>
            {list.map(m => <ReaderChip key={m.id} m={m} read={tab==='read'} />)}
          </div>
        )}
      </div>

      {/* nudge unread */}
      {tab==='unread' && unread.length > 0 && (
        <div style={{ padding:'12px 18px 16px', borderTop:'1px solid var(--border-subtle)' }}>
          <button className="btn" onClick={()=>setNudged(true)} disabled={nudged}
            style={{ width:'100%', justifyContent:'center', opacity: nudged?0.65:1, cursor: nudged?'default':'pointer' }}>
            {nudged
              ? <><Icons.check size={14} />안 읽은 {unread.length}명에게 알림을 보냈어요</>
              : <><Icons.megaphone size={14} />안 읽은 {unread.length}명에게 알림 보내기</>}
          </button>
        </div>
      )}
    </section>
  );
}

function ReaderChip({ m, read }: { m: Member; read: boolean }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 8px', borderRadius:8 }}>
      <div style={{ position:'relative', flex:'0 0 auto', opacity: read?1:0.5 }}>
        <U.Avatar name={m.nick || m.name} size={30} hue={m.session && m.session.includes('보컬') ? 'var(--accent-hover)' : 'var(--muted-foreground)'} />
        {read && (
          <span style={{ position:'absolute', right:-3, bottom:-3, width:14, height:14, borderRadius:'50%', background:'var(--accent)', color:'var(--accent-foreground)', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--surface)' }}>
            <Icons.check size={8} />
          </span>
        )}
      </div>
      <div style={{ minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:13, fontFamily:'var(--font-sans)', fontWeight:500, color: read?'var(--foreground)':'var(--muted-foreground)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
          {m.nick || m.name}{m.me && <span className="mono" style={{ fontSize:9, color:'var(--subtle-foreground)', flex:'0 0 auto' }}>나</span>}
        </div>
        <div className="mono" style={{ fontSize:9.5, color:'var(--subtle-foreground)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.gen}기 · {m.session.join('·')}</div>
      </div>
    </div>
  );
}

/* attached image gallery + lightbox */
function ImageGallery({ images }: { images: NoticeImage[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'grid', gridTemplateColumns: images.length===1 ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap:10 }}>
        {images.map((img, i) => (
          <button key={i} onClick={()=>setLightbox(i)} style={{
            display:'block', padding:0, borderRadius:10, overflow:'hidden', border:'1px solid var(--border-subtle)',
            background:'var(--surface)', cursor:'zoom-in', aspectRatio:'3 / 2',
          }}>
            <img src={img.url} alt={img.name||''} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          </button>
        ))}
      </div>
      {lightbox !== null && (
        <div className="modal-backdrop" style={{ cursor:'zoom-out' }} onClick={()=>setLightbox(null)}>
          <button className="modal-close" onClick={(e)=>{ e.stopPropagation(); setLightbox(null); }}><Icons.x size={18} /></button>
          <img src={images[lightbox].url} alt={images[lightbox].name||''} onClick={e=>e.stopPropagation()}
            style={{ maxWidth:'92vw', maxHeight:'88vh', borderRadius:10, boxShadow:'0 24px 70px rgba(0,0,0,0.6)' }} />
          {images.length > 1 && (
            <div style={{ position:'fixed', bottom:24, left:0, right:0, display:'flex', justifyContent:'center', gap:8 }} onClick={e=>e.stopPropagation()}>
              {images.map((_,i) => (
                <button key={i} onClick={()=>setLightbox(i)} style={{ width:9, height:9, borderRadius:'50%', background: i===lightbox?'var(--accent)':'var(--border)', border:'none', cursor:'pointer' }}></button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── rich text editor ── */
const EDITOR_FONTS = [
  { label:'기본 (고딕)', value:"'Noto Sans KR', sans-serif" },
  { label:'Grotesk', value:"'Space Grotesk', sans-serif" },
  { label:'Mono', value:"'Space Mono', monospace" },
];
const EDITOR_SIZES = [
  { label:'작게', value:'2' }, { label:'보통', value:'3' }, { label:'크게', value:'5' }, { label:'제목', value:'6' },
];
const EDITOR_COLORS = ['#EAEEF6','#8A96AC','#D6A35A','#5B8EC7','#6FAF8A','#C77A86','#E08A8A'];

function RichEditor({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<'font' | 'size' | null>(null);
  const [activeFont, setActiveFont] = useState(EDITOR_FONTS[0]);
  const [activeSize, setActiveSize] = useState(EDITOR_SIZES[1]);

  useEffect(() => { if (ref.current && value) ref.current.innerHTML = value; }, []);
  useEffect(() => {
    const close = () => setMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const sync = () => onChange(ref.current ? ref.current.innerHTML : '');
  const exec = (cmd: string, arg: string | null = null) => {
    ref.current!.focus();
    try { document.execCommand('styleWithCSS', false, 'true'); } catch(e){}
    document.execCommand(cmd, false, arg ?? undefined);
    sync();
  };
  const hold = (e: React.MouseEvent) => e.preventDefault();

  const Btn = ({ cmd, arg, title, children, glyph }: { cmd: string; arg?: string | null; title?: string; children: React.ReactNode; glyph?: string }) => (
    <button type="button" className="rt-btn" title={title} onMouseDown={hold} onClick={()=>exec(cmd, arg ?? null)}
      style={ glyph ? { fontFamily:'Georgia, serif', fontWeight: glyph==='b'?800:400, fontStyle: glyph==='i'?'italic':'normal', textDecoration: glyph==='u'?'underline':'none', fontSize:15 } : undefined }>
      {children}
    </button>
  );

  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:10, background:'var(--surface)' }}>
      <div className="rt-toolbar">
        {/* font family */}
        <div style={{ position:'relative' }} onClick={e=>e.stopPropagation()}>
          <button type="button" className="rt-btn" onMouseDown={hold} data-on={menu==='font'} onClick={()=>setMenu(m=>m==='font'?null:'font')}>
            <span style={{ fontFamily:activeFont.value }}>{activeFont.label.split(' ')[0]}</span><Icons.chevron size={12} {...{style:{transform:'rotate(90deg)', opacity:0.6}}} />
          </button>
          {menu==='font' && (
            <div className="rt-menu">
              {EDITOR_FONTS.map(f => (
                <button key={f.label} type="button" className="rt-menu-item" onMouseDown={hold}
                  onClick={()=>{ exec('fontName', f.value); setActiveFont(f); setMenu(null); }} style={{ fontFamily:f.value }}>{f.label}</button>
              ))}
            </div>
          )}
        </div>
        {/* font size */}
        <div style={{ position:'relative' }} onClick={e=>e.stopPropagation()}>
          <button type="button" className="rt-btn" onMouseDown={hold} data-on={menu==='size'} onClick={()=>setMenu(m=>m==='size'?null:'size')}>
            {activeSize.label}<Icons.chevron size={12} {...{style:{transform:'rotate(90deg)', opacity:0.6}}} />
          </button>
          {menu==='size' && (
            <div className="rt-menu" style={{ minWidth:96 }}>
              {EDITOR_SIZES.map(s => (
                <button key={s.value} type="button" className="rt-menu-item" onMouseDown={hold}
                  onClick={()=>{ exec('fontSize', s.value); setActiveSize(s); setMenu(null); }}>{s.label}</button>
              ))}
            </div>
          )}
        </div>
        <span className="rt-sep"></span>
        <Btn cmd="bold" title="굵게" glyph="b">B</Btn>
        <Btn cmd="italic" title="기울임" glyph="i">I</Btn>
        <Btn cmd="underline" title="밑줄" glyph="u">U</Btn>
        <span className="rt-sep"></span>
        {/* colors */}
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 5px' }}>
          {EDITOR_COLORS.map(c => (
            <span key={c} className="rt-swatch" title="글자색" style={{ background:c }} onMouseDown={hold} onClick={()=>exec('foreColor', c)}></span>
          ))}
        </div>
        <span className="rt-sep"></span>
        <Btn cmd="insertUnorderedList" title="목록">•≡</Btn>
        <Btn cmd="removeFormat" title="서식 지우기"><Icons.x size={14} /></Btn>
      </div>
      <div ref={ref} contentEditable className="rt-input notice-body" data-placeholder={placeholder}
        onInput={sync} onBlur={sync}
        style={{ minHeight:200, padding:'16px', fontSize:15, lineHeight:1.85, color:'var(--foreground)' }} />
    </div>
  );
}

/* comments */
function CommentComposer({ avatarName, placeholder, onSubmit, compact, autoFocus, initialValue = '' }: {
  avatarName: string;
  placeholder?: string;
  onSubmit: (v: string) => void;
  compact?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
}) {
  const [draft, setDraft] = useState(initialValue);
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (taRef.current && initialValue) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = taRef.current.scrollHeight + 'px';
    }
  }, []);
  const submit = () => { const v = draft.trim(); if (!v) return; onSubmit(v); setDraft(''); };
  return (
    <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
      <U.Avatar name={avatarName} size={compact?28:34} hue="var(--accent-hover)" />
      <textarea ref={taRef} value={draft} onChange={e=>setDraft(e.target.value)} rows={1} placeholder={placeholder} autoFocus={autoFocus}
        onInput={e=>{ const t = e.target as HTMLTextAreaElement; t.style.height='auto'; t.style.height=t.scrollHeight+'px'; }}
        onKeyDown={e=>{ if(e.key==='Enter' && (e.metaKey||e.ctrlKey)) submit(); }}
        style={{ flex:1, padding: compact?'8px 11px':'10px 13px', borderRadius:9, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--foreground)', fontSize: compact?13:14, fontFamily:'var(--font-kr)', resize:'none', outline:'none', lineHeight:1.55, minHeight: compact?38:42 }} />
      <button className="btn btn-primary" onClick={submit} disabled={!draft.trim()} style={{ padding: compact?'9px 13px':'11px 16px', opacity: draft.trim()?1:0.45, alignSelf:'stretch' }}><Icons.send size={compact?13:15} />등록</button>
    </div>
  );
}

function Persona({ authorId, fallback }: { authorId: string; fallback: string }): { name: string; hue: string; m: Member | undefined } {
  const m = MEMBERS.find(x => x.id === authorId);
  const name = m ? (m.nick || m.name) : fallback;
  const hue = m && m.session.includes('보컬') ? 'var(--accent-hover)' : 'var(--muted-foreground)';
  return { name, hue, m };
}

const REPLY_MAX_DEPTH = 1;

function ReplyItem({ noticeId, commentId, r, depth, store }: {
  noticeId: string;
  commentId: string;
  r: ReplyNode;
  depth: number;
  store: ReturnType<typeof useStore>;
}) {
  const rp = Persona({ authorId:r.authorId, fallback:r.author });
  const rmine = r.authorId === ME.id;
  const [replying, setReplying] = useState(false);
  const children = r.children || [];
  const canIndent = depth < REPLY_MAX_DEPTH;
  return (
    <div>
      <div style={{ display:'flex', gap:10 }}>
        <U.Avatar name={rp.name} size={28} hue={rp.hue} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:12.5 }}>{rp.name}</span>
            {rmine && <span className="mono" style={{ fontSize:9, color:'var(--subtle-foreground)' }}>나</span>}
            <span className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)' }}>{r.date}</span>
            {rmine && (
              <button onClick={()=>store.removeReply(noticeId, commentId, r.id)} className="mono"
                style={{ fontSize:10, color:'var(--subtle-foreground)', marginLeft:'auto' }}
                onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color='#E08A8A'}
                onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color='var(--subtle-foreground)'}>삭제</button>
            )}
          </div>
          <div style={{ fontSize:13.5, color:'var(--foreground)', marginTop:5, lineHeight:1.6, textWrap:'pretty' }}>{renderBody(r.body)}</div>
          <button onClick={()=>setReplying(x=>!x)} className="mono"
            style={{ fontSize:11, color: replying?'var(--accent-hover)':'var(--subtle-foreground)', marginTop:8, display:'inline-flex', alignItems:'center', gap:5 }}
            onMouseEnter={e=>{ if(!replying) (e.currentTarget as HTMLButtonElement).style.color='var(--muted-foreground)'; }}
            onMouseLeave={e=>{ if(!replying) (e.currentTarget as HTMLButtonElement).style.color='var(--subtle-foreground)'; }}>
            <Icons.arrow size={12} {...{style:{transform:'scaleX(-1)'}}} />답글{children.length > 0 && ` (${children.length})`}
          </button>
        </div>
      </div>
      {(children.length > 0 || replying) && (
        <div style={{
          marginLeft: canIndent ? 38 : 0, marginTop:10,
          paddingLeft: canIndent ? 14 : 0,
          borderLeft: canIndent ? '2px solid var(--border-subtle)' : 'none',
          display:'flex', flexDirection:'column', gap:12,
        }}>
          {children.map(child => (
            <ReplyItem key={child.id} noticeId={noticeId} commentId={commentId} r={child} depth={depth+1} store={store} />
          ))}
          {replying && (
            <CommentComposer compact autoFocus avatarName={ME.nick||ME.name} placeholder="답글을 입력하세요"
              initialValue={`@${rp.name} `}
              onSubmit={(v)=>{ store.addReply(noticeId, commentId, v, r.id); setReplying(false); }} />
          )}
        </div>
      )}
    </div>
  );
}

function CommentItem({ noticeId, c, divider }: { noticeId: string; c: Comment; divider?: boolean }) {
  const store = useStore();
  const p = Persona({ authorId:c.authorId, fallback:c.author });
  const mine = c.authorId === ME.id;
  const [replying, setReplying] = useState(false);
  const replyTree = buildReplyTree(c.replies || []);
  const totalReplies = (c.replies || []).length;
  return (
    <div style={{ padding:'16px 2px', borderTop: divider ? '1px solid var(--border-subtle)' : 'none' }}>
      <div style={{ display:'flex', gap:12 }}>
        <U.Avatar name={p.name} size={34} hue={p.hue} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:13.5 }}>{p.name}</span>
            {mine && <span className="mono" style={{ fontSize:9.5, color:'var(--subtle-foreground)' }}>나</span>}
            <span className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)' }}>{c.date}</span>
            {mine && <button onClick={()=>store.removeComment(noticeId, c.id)} className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginLeft:'auto' }}
              onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color='#E08A8A'} onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color='var(--subtle-foreground)'}>삭제</button>}
          </div>
          <div style={{ fontSize:14, color:'var(--foreground)', marginTop:6, lineHeight:1.65, textWrap:'pretty' }}>{renderBody(c.body)}</div>
          <button onClick={()=>setReplying(r=>!r)} className="mono" style={{ fontSize:11, color: replying?'var(--accent-hover)':'var(--subtle-foreground)', marginTop:9, display:'inline-flex', alignItems:'center', gap:5 }}
            onMouseEnter={e=>{ if(!replying) (e.currentTarget as HTMLButtonElement).style.color='var(--muted-foreground)'; }} onMouseLeave={e=>{ if(!replying) (e.currentTarget as HTMLButtonElement).style.color='var(--subtle-foreground)'; }}>
            <Icons.arrow size={12} {...{style:{transform:'scaleX(-1)'}}} />답글{totalReplies > 0 && ` (${totalReplies})`}
          </button>
        </div>
      </div>

      {(replyTree.length > 0 || replying) && (
        <div style={{ marginLeft:46, marginTop:10, paddingLeft:16, borderLeft:'2px solid var(--border-subtle)', display:'flex', flexDirection:'column', gap:14 }}>
          {replyTree.map(r => (
            <ReplyItem key={r.id} noticeId={noticeId} commentId={c.id} r={r} depth={0} store={store} />
          ))}
          {replying && (
            <CommentComposer compact autoFocus avatarName={ME.nick||ME.name} placeholder="답글을 입력하세요"
              onSubmit={(v)=>{ store.addReply(noticeId, c.id, v, null); setReplying(false); }} />
          )}
        </div>
      )}
    </div>
  );
}

function CommentSection({ noticeId }: { noticeId: string }) {
  const store = useStore();
  const list = store.comments(noticeId);
  const total = list.reduce((a,c)=>a + 1 + (c.replies?c.replies.length:0), 0);
  return (
    <div style={{ marginTop:34, paddingTop:26, borderTop:'1px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <h3 style={{ margin:0, fontFamily:'var(--font-sans)', fontWeight:700, fontSize:15 }}>댓글</h3>
        <span className="mono" style={{ fontSize:12, color:'var(--accent-hover)' }}>{total}</span>
      </div>

      <div style={{ display:'flex', flexDirection:'column' }}>
        {list.map((c,i) => <CommentItem key={c.id} noticeId={noticeId} c={c} divider={i>0} />)}
        {list.length === 0 && <div style={{ padding:'14px 2px 4px', fontSize:13, color:'var(--subtle-foreground)' }}>첫 댓글을 남겨보세요.</div>}
      </div>

      <div style={{ marginTop:18 }}>
        <CommentComposer avatarName={ME.nick||ME.name} placeholder="댓글을 입력하세요" onSubmit={(v)=>store.addComment(noticeId, v)} />
      </div>
    </div>
  );
}

/* ════════ FORM (create + edit shared) ════════ */
const formInput: React.CSSProperties = {
  width:'100%', padding:'11px 14px', borderRadius:9, border:'1px solid var(--border)',
  background:'var(--surface)', color:'var(--foreground)', fontSize:14.5, boxSizing:'border-box',
  fontFamily:'var(--font-kr)', outline:'none',
};

function NoticeForm({ mode, initial, kindLocked, onSubmit, onCancel }: {
  mode: 'create' | 'edit';
  initial: NoticeFormInitial;
  kindLocked?: boolean;
  onSubmit: (data: Omit<Notice, 'id' | 'views' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) {
  const isAdmin = NoticeStore.getViewer() === 'admin';
  const [kind, setKind] = useState<'admin' | 'user'>(initial.kind);
  const [tag, setTag] = useState(initial.tag);
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [pinned, setPinned] = useState(!!initial.pinned);
  const [images, setImages] = useState<NoticeImage[]>(initial.images || []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const tagOpts = kind === 'admin' ? ADMIN_TAGS : USER_TAGS;
  const bodyText = (body || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  const valid = title.trim() && bodyText && tag;

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    [...files].filter(f => f.type.startsWith('image/')).forEach(f => {
      const r = new FileReader();
      r.onload = () => setImages(prev => [...prev, { name: f.name, url: r.result as string }]);
      r.readAsDataURL(f);
    });
  };

  const changeKind = (k: 'admin' | 'user') => {
    setKind(k);
    if (k === 'admin' && !ADMIN_TAGS.includes(tag)) setTag(ADMIN_TAGS[0]);
    if (k === 'user') { if (!USER_TAGS.includes(tag)) setTag(USER_TAGS[0]); setPinned(false); }
  };

  const submit = () => { if (!valid) return; onSubmit({ kind, tag, title: title.trim(), body, rich: true, images, pinned: kind==='admin' ? pinned : false, date: '', author: ME.nick||ME.name, authorId: ME.id }); };

  return (
    <div className="screen-in" style={{ maxWidth:680, margin:'0 auto', display:'flex', flexDirection:'column', gap:28 }}>
      <div>
        <button onClick={onCancel} className="mono" style={{ display:'flex', width:'fit-content', alignItems:'center', gap:6, fontSize:12, color:'var(--muted-foreground)', marginBottom:14 }}
          onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color='var(--accent-hover)'} onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color='var(--muted-foreground)'}>
          <Icons.chevron size={14} {...{style:{transform:'rotate(180deg)'}}} />{mode==='edit'?'세부로':'목록으로'}
        </button>
        <U.Kicker>{mode==='edit' ? '공지 수정' : '공지 작성'}</U.Kicker>
        <h1 className="display" style={{ margin:'12px 0 0', fontSize:48 }}>{mode==='edit' ? 'EDIT' : 'WRITE'}</h1>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:22 }}>
        {/* kind */}
        <div>
          <FieldLabel hint={kindLocked ? '작성 후 구분 변경 불가' : (isAdmin ? '' : '운영진 공지는 운영진만 작성 가능')}>공지 구분</FieldLabel>
          <div style={{ display:'flex', gap:8 }}>
            {([['admin','공지', Icons.megaphone],['user','부원 게시판', Icons.users]] as [string, string, React.FC<{size:number}>][]).map(([k,l,Ic]) => {
              const on = kind === k;
              const locked = kindLocked || (k === 'admin' && !isAdmin);
              return (
                <button key={k} disabled={locked && !on} onClick={()=>!locked && changeKind(k as 'admin' | 'user')} style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px', borderRadius:10,
                  border:`1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-muted)' : 'transparent',
                  color: on ? 'var(--accent-hover)' : 'var(--muted-foreground)', fontFamily:'var(--font-sans)', fontWeight:600, fontSize:13.5,
                  cursor: (locked && !on) ? 'not-allowed' : 'pointer', opacity: (locked && !on) ? 0.4 : 1, transition:'all .14s',
                }}><Ic size={16} />{l}</button>
              );
            })}
          </div>
        </div>

        {/* tag */}
        <div>
          <FieldLabel>분류 태그</FieldLabel>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {tagOpts.map(t => {
              const on = tag === t; const hue = TAG_HUE[t];
              return (
                <button key={t} type="button" onClick={()=>setTag(t)} style={{
                  padding:'7px 15px', borderRadius:20, fontSize:12.5, fontFamily:'var(--font-sans)', whiteSpace:'nowrap', transition:'all .14s',
                  border:`1px solid ${on ? hue : 'var(--border)'}`, background: on ? U.hexA(hue,0.14) : 'transparent',
                  color: on ? hue : 'var(--muted-foreground)', fontWeight: on?600:400,
                }}>{t}</button>
              );
            })}
          </div>
        </div>

        {/* title */}
        <div>
          <FieldLabel hint={`${title.length}/60`}>제목</FieldLabel>
          <input value={title} onChange={e=>setTitle(e.target.value.slice(0,60))} placeholder="공지 제목을 입력하세요" style={formInput} />
        </div>

        {/* body */}
        <div>
          <FieldLabel hint="글꼴·크기·색상·굵기·목록을 사용할 수 있어요">본문</FieldLabel>
          <RichEditor value={body} onChange={setBody} placeholder="내용을 입력하세요" />
        </div>

        {/* image attach */}
        <div>
          <FieldLabel hint="여러 장 가능">이미지 첨부</FieldLabel>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:'none' }}
            onChange={e=>{ addFiles(e.target.files); e.target.value=''; }} />
          {images.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:10, marginBottom:12 }}>
              {images.map((img, i) => (
                <div key={i} style={{ position:'relative', borderRadius:9, overflow:'hidden', border:'1px solid var(--border-subtle)', aspectRatio:'1 / 1', background:'var(--surface-elevated)' }}>
                  <img src={img.url} alt={img.name||''} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  <button type="button" onClick={()=>setImages(prev=>prev.filter((_,k)=>k!==i))} title="제거" style={{
                    position:'absolute', top:5, right:5, width:24, height:24, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center',
                    background:'rgba(8,11,18,0.72)', color:'#fff', border:'none', cursor:'pointer',
                  }}><Icons.x size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={()=>fileRef.current && fileRef.current.click()}
            onDragOver={e=>{ e.preventDefault(); setDragOver(true); }} onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{ e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            style={{
              width:'100%', padding:'22px', borderRadius:10, background: dragOver?'var(--accent-muted)':'transparent',
              border:`1.5px dashed ${dragOver?'var(--accent)':'var(--border)'}`,
              color: dragOver?'var(--accent-hover)':'var(--muted-foreground)', display:'flex', flexDirection:'column', alignItems:'center', gap:8, transition:'all .14s',
            }}
            onMouseEnter={e=>{ if(!dragOver){ (e.currentTarget as HTMLButtonElement).style.borderColor='var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color='var(--accent-hover)'; } }}
            onMouseLeave={e=>{ if(!dragOver){ (e.currentTarget as HTMLButtonElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLButtonElement).style.color='var(--muted-foreground)'; } }}>
            <Icons.plus size={20} /><span style={{ fontSize:12.5 }}>{images.length>0 ? '이미지 더 추가' : '이미지를 끌어다 놓거나 클릭해 추가'}</span>
          </button>
        </div>

        {/* pinned — admin only */}
        {kind === 'admin' && isAdmin && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, padding:'14px 16px', borderRadius:10, border:'1px solid var(--border-subtle)', background:'var(--surface)' }}>
            <div>
              <div style={{ fontSize:13.5, fontWeight:600, display:'flex', alignItems:'center', gap:7, whiteSpace:'nowrap' }}><Icons.pin size={14} />상단 고정</div>
              <div style={{ fontSize:11.5, color:'var(--subtle-foreground)', marginTop:3, whiteSpace:'nowrap' }}>목록 맨 위에 항상 노출됩니다.</div>
            </div>
            <button onClick={()=>setPinned(p=>!p)} style={{
              width:46, height:26, borderRadius:20, flex:'0 0 auto', position:'relative', transition:'all .16s',
              background: pinned ? 'var(--accent)' : 'var(--border)',
            }}>
              <span style={{ position:'absolute', top:3, left: pinned?23:3, width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left .16s' }}></span>
            </button>
          </div>
        )}
      </div>

      {/* actions */}
      <div style={{ display:'flex', gap:10, position:'sticky', bottom:0, paddingBottom:4 }}>
        <button className="btn btn-primary" onClick={submit} disabled={!valid} style={{ flex:1, justifyContent:'center', padding:'13px', opacity: valid?1:0.5 }}>
          {mode==='edit' ? '수정 완료' : '공지 등록'}
        </button>
        <button className="btn" onClick={onCancel} style={{ padding:'13px 22px' }}>취소</button>
      </div>
    </div>
  );
}

function NoticeCreateScreen({ go, kind }: { go: GoFn; kind?: string }) {
  const isAdmin = NoticeStore.getViewer() === 'admin';
  const initialKind: 'admin' | 'user' = (kind === 'admin' && isAdmin) ? 'admin' : (kind === 'admin' ? 'user' : ((kind as 'admin' | 'user') || 'user'));
  const initial: NoticeFormInitial = { kind: initialKind, tag: initialKind==='admin'?ADMIN_TAGS[0]:USER_TAGS[0], title:'', body:'', pinned:false, images:[] };
  const submit = (data: Omit<Notice, 'id' | 'views' | 'createdAt' | 'updatedAt'>) => {
    const id = NoticeStore.add({ ...data, authorId: ME.id, author: ME.nick||ME.name, date: '06.12' });
    go('notice-detail', { id });
  };
  return <NoticeForm mode="create" initial={initial} onSubmit={submit} onCancel={()=>go(initialKind === 'admin' ? 'notices-admin' : 'notices-user')} />;
}

function NoticeEditScreen({ go, id }: { go: GoFn; id: string }) {
  const n = NoticeStore.get(id);
  if (!n) return (
    <div className="screen-in" style={{ textAlign:'center', padding:'80px 20px' }}>
      <p style={{ color:'var(--muted-foreground)' }}>공지를 찾을 수 없습니다.</p>
      <button className="btn" style={{ marginTop:16 }} onClick={()=>go('notices')}>목록으로</button>
    </div>
  );
  const htmlBody = n.rich ? n.body : (n.body || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  const initial: NoticeFormInitial = { ...n, body: htmlBody };
  const submit = (data: Omit<Notice, 'id' | 'views' | 'createdAt' | 'updatedAt'>) => { NoticeStore.update(id, data); go('notice-detail', { id }); };
  return <NoticeForm mode="edit" initial={initial} kindLocked onSubmit={submit} onCancel={()=>go('notice-detail', { id })} />;
}

/* shared field label + pagination (local copies for this module) */
function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:9, flexWrap:'wrap' }}>
      <label style={{ fontSize:12.5, fontWeight:600, color:'var(--foreground)', fontFamily:'var(--font-sans)', whiteSpace:'nowrap', flex:'0 0 auto' }}>{children}</label>
      {hint && <span className="mono" style={{ fontSize:10, color:'var(--subtle-foreground)' }}>{hint}</span>}
    </div>
  );
}

function Pagination({ page, pageCount, onChange, windowSize = 5 }: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
  windowSize?: number;
}) {
  if (pageCount <= 1) return null;
  const block = Math.floor(page / windowSize);
  const start = block * windowSize;
  const end = Math.min(start + windowSize, pageCount);
  const cells: number[] = [];
  for (let i=start;i<end;i++) cells.push(i);
  return (
    <div className="pager">
      <button className="pager-cell" data-glyph disabled={page===0} onClick={()=>onChange(0)}>«</button>
      <button className="pager-cell" data-glyph disabled={page===0} onClick={()=>onChange(page-1)}>‹</button>
      {cells.map(i => (
        <button key={i} className="pager-cell" {...(i===page?{'data-active':true}:{})} onClick={()=>onChange(i)}>{i+1}</button>
      ))}
      <button className="pager-cell" data-glyph disabled={page>=pageCount-1} onClick={()=>onChange(page+1)}>›</button>
      <button className="pager-cell" data-glyph disabled={page>=pageCount-1} onClick={()=>onChange(pageCount-1)}>»</button>
    </div>
  );
}

/* ════════ ADMIN CONSOLE SECTION ════════ */

type AdminNoticeView =
  | { type: 'list' }
  | { type: 'create' }
  | { type: 'edit'; id: string }
  | { type: 'detail'; id: string };

function AdminNoticeDetail({ id, onBack, onEdit }: { id: string; onBack: () => void; onEdit: (id: string) => void }) {
  const store = useStore();
  const n = store.get(id);
  const [confirmDel, setConfirmDel] = useState(false);

  if (!n) return (
    <div style={{ textAlign:'center', padding:'60px 20px' }}>
      <p style={{ color:'var(--muted-foreground)' }}>공지를 찾을 수 없습니다.</p>
      <button className="btn" style={{ marginTop:14 }} onClick={onBack}>목록으로</button>
    </div>
  );

  const author = resolveAuthor(n);
  const del = () => { store.remove(n.id); onBack(); };

  return (
    <div style={{ maxWidth:760, display:'flex', flexDirection:'column', gap:0 }}>
      <button onClick={onBack} className="mono" style={{ display:'flex', width:'fit-content', alignItems:'center', gap:6, fontSize:12, color:'var(--muted-foreground)', marginBottom:20 }}
        onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color='var(--accent-hover)'} onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color='var(--muted-foreground)'}>
        <Icons.chevron size={14} {...{style:{transform:'rotate(180deg)'}}} />공지 목록
      </button>

      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:14, flexWrap:'wrap' }}>
        <TagBadge tag={n.tag} size="lg" />
        {n.pinned && <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:'var(--accent)', fontSize:11.5, fontWeight:600 }}><Icons.pin size={13} />고정</span>}
      </div>

      <h2 style={{ margin:0, fontFamily:'var(--font-sans)', fontWeight:700, fontSize:26, lineHeight:1.25, letterSpacing:'-0.02em', textWrap:'pretty' }}>{n.title}</h2>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, marginTop:18, paddingBottom:18, borderBottom:'1px solid var(--border)', flexWrap:'wrap' }}>
        <AuthorChip author={author} size={36} showMeta />
        <div className="mono" style={{ fontSize:11, color:'var(--subtle-foreground)', textAlign:'right', lineHeight:1.7 }}>
          <div>{n.createdAt}</div>
          {n.updatedAt && <div>수정됨 {n.updatedAt}</div>}
          <div style={{ display:'flex', alignItems:'center', gap:5, justifyContent:'flex-end' }}><Icons.search size={11} />조회 {n.views}</div>
        </div>
      </div>

      {n.rich
        ? <div className="notice-body" style={{ fontSize:15, color:'var(--foreground)', lineHeight:1.85, padding:'24px 0 8px' }} dangerouslySetInnerHTML={{ __html: n.body }} />
        : <div style={{ fontSize:15, color:'var(--foreground)', lineHeight:1.85, whiteSpace:'pre-line', padding:'24px 0 8px', textWrap:'pretty' }}>{n.body}</div>}

      {n.images && n.images.length > 0 && <ImageGallery images={n.images} />}

      <div style={{ display:'flex', gap:9, marginTop:18, paddingTop:18, borderTop:'1px solid var(--border-subtle)' }}>
        <button className="btn" onClick={()=>onEdit(n.id)}><Icons.edit size={14} />수정</button>
        {confirmDel ? (
          <div style={{ display:'flex', gap:7, alignItems:'center' }}>
            <span style={{ fontSize:12.5, color:'#E08A8A' }}>삭제할까요?</span>
            <button className="btn" style={{ borderColor:'rgba(224,138,138,0.4)', color:'#E08A8A' }} onClick={del}>삭제</button>
            <button className="btn btn-ghost" style={{ padding:'9px 8px' }} onClick={()=>setConfirmDel(false)}>취소</button>
          </div>
        ) : (
          <button className="btn" style={{ color:'var(--muted-foreground)' }} onClick={()=>setConfirmDel(true)}><Icons.ban size={14} />삭제</button>
        )}
      </div>

      <ReadReceipt noticeId={n.id} />
    </div>
  );
}

function NoticeAdminRow({ n, onView, onEdit, onDelete }: { n: Notice; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const [confirmDel, setConfirmDel] = useState(false);
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderTop:'1px solid var(--border-subtle)', transition:'background .14s' }}
      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background='var(--surface-elevated)'}
      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background='transparent'}>
      {n.pinned && <span style={{ color:'var(--accent)', flex:'0 0 auto', display:'flex' }}><Icons.pin size={14} /></span>}
      <span style={{ width:54, flex:'0 0 auto', display:'flex', justifyContent:'center' }}><TagBadge tag={n.tag} /></span>
      <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={onView}>
        <div style={{ fontFamily:'var(--font-sans)', fontWeight:600, fontSize:14.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{n.title}</div>
        <div className="mono" style={{ fontSize:10.5, color:'var(--subtle-foreground)', marginTop:3 }}>{n.createdAt}</div>
      </div>
      <div style={{ display:'flex', gap:6, flex:'0 0 auto' }}>
        {confirmDel ? (
          <>
            <span style={{ fontSize:12, color:'#E08A8A', display:'flex', alignItems:'center' }}>삭제?</span>
            <button className="btn" style={{ padding:'6px 11px', fontSize:12, borderColor:'rgba(224,138,138,0.4)', color:'#E08A8A' }} onClick={onDelete}>확인</button>
            <button className="btn btn-ghost" style={{ padding:'6px 8px', fontSize:12 }} onClick={()=>setConfirmDel(false)}>취소</button>
          </>
        ) : (
          <>
            <button className="btn" style={{ padding:'7px 12px', fontSize:12 }} onClick={onEdit}><Icons.edit size={13} />수정</button>
            <button className="btn" style={{ padding:'7px 12px', fontSize:12, color:'var(--muted-foreground)' }} onClick={()=>setConfirmDel(true)}><Icons.ban size={13} />삭제</button>
          </>
        )}
      </div>
    </div>
  );
}

function NoticesAdminSection() {
  useStore();
  const [view, setView] = useState<AdminNoticeView>({ type:'list' });

  useEffect(() => { NoticeStore.setViewer('admin'); }, []);

  if (view.type === 'create') {
    const initial: NoticeFormInitial = { kind:'admin', tag:ADMIN_TAGS[0], title:'', body:'', pinned:false, images:[] };
    return (
      <NoticeForm mode="create" initial={initial} kindLocked
        onSubmit={(data) => {
          const id = NoticeStore.add({ ...data, authorId: ME.id, author: ME.nick || ME.name, date: stampShort() });
          setView({ type:'detail', id });
        }}
        onCancel={() => setView({ type:'list' })}
      />
    );
  }

  if (view.type === 'edit') {
    const n = NoticeStore.get(view.id);
    if (!n) { setView({ type:'list' }); return null; }
    const htmlBody = n.rich ? n.body : (n.body||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
    return (
      <NoticeForm mode="edit" initial={{ ...n, body:htmlBody }} kindLocked
        onSubmit={(data) => { NoticeStore.update(view.id, data); setView({ type:'detail', id:view.id }); }}
        onCancel={() => setView({ type:'detail', id:(view as { type:'edit'; id:string }).id })}
      />
    );
  }

  if (view.type === 'detail') {
    return (
      <AdminNoticeDetail
        id={view.id}
        onBack={() => setView({ type:'list' })}
        onEdit={(id: string) => setView({ type:'edit', id })}
      />
    );
  }

  const notices = NoticeStore.ofKind('admin');
  const pinned = notices.filter(n => n.pinned);
  const rest = notices.filter(n => !n.pinned);
  const all = [...pinned, ...rest];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button className="btn btn-primary" onClick={() => setView({ type:'create' })}>
          <Icons.plus size={15} />새 공지 작성
        </button>
      </div>

      <ReferenceCards />

      <div>
        <div className="mono" style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--subtle-foreground)', marginBottom:12 }}>공지 목록 · {all.length}건</div>
        <div style={{ border:'1px solid var(--border-subtle)', borderRadius:10, overflow:'hidden' }}>
          {all.length === 0 && (
            <div style={{ padding:'44px 20px', textAlign:'center', color:'var(--subtle-foreground)', fontSize:13 }}>등록된 공지가 없어요.</div>
          )}
          {all.map(n => (
            <NoticeAdminRow key={n.id} n={n}
              onView={() => setView({ type:'detail', id:n.id })}
              onEdit={() => setView({ type:'edit', id:n.id })}
              onDelete={() => NoticeStore.remove(n.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const NoticesModule = { NoticesScreen, NoticeDetailScreen, NoticeCreateScreen, NoticeEditScreen, NoticesAdminSection };
