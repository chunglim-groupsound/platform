'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ThemePicker } from '@/components/public/ThemePicker';
import { useTheme } from '@/hooks/useTheme';
import './new.css';

const IV_KEY = 'CHUNGLIM_interview_v1';
const AP_KEY = 'CHUNGLIM_applicants_v2';
const MY_KEY = 'CHUNGLIM_my_application_v1';

const SESSION_LIST = ['보컬', '기타', '베이스', '드럼', '건반'];
const GENRE_LIST   = ['록', '팝', '인디', '재즈', 'R&B', '메탈', '발라드', '포크'];
const YEAR_LIST    = ['1학년', '2학년', '3학년', '4학년', '5학년', '수료', '졸업', '휴학'];
const WD = ['일','월','화','수','목','금','토'];

const IV_DEFAULT = [
  { id:'iv1', date:'2026-09-14', start:'18:00', end:'18:20', capacity:1, booked:1, note:'' },
  { id:'iv2', date:'2026-09-14', start:'18:30', end:'18:50', capacity:1, booked:1, note:'' },
  { id:'iv3', date:'2026-09-14', start:'19:00', end:'19:20', capacity:1, booked:0, note:'' },
  { id:'iv4', date:'2026-09-15', start:'19:00', end:'19:30', capacity:2, booked:1, note:'그룹 면접' },
  { id:'iv5', date:'2026-09-15', start:'19:30', end:'20:00', capacity:2, booked:0, note:'그룹 면접' },
];

const AP_SEED = [
  { id:'ap1', name:'김도윤', dept:'경영학과 21', contact:'010-2345-6789', kakao:'doyoon_k', sessions:['보컬'], exp:'고교 밴드부 보컬 2년', message:'무대에서 노래할 때가 가장 행복합니다.', appliedAt:'2026.09.10 21:14', preferredSlotIds:['iv1','iv3'], status:'new', slotId:null as string|null, notified:false, notifiedAt:null as string|null },
  { id:'ap2', name:'이서진', dept:'컴퓨터공학과 22', contact:'010-3456-7890', kakao:'seojin.lee', sessions:['기타','베이스'], exp:'독학 4년', message:'펑크록과 모던록을 좋아합니다.', appliedAt:'2026.09.11 14:02', preferredSlotIds:['iv4','iv5'], status:'interview', slotId:'iv4', notified:false, notifiedAt:null },
  { id:'ap3', name:'박하늘', dept:'실용음악과 21', contact:'010-4567-8901', kakao:'haneul_drum', sessions:['드럼'], exp:'밴드 활동 3년', message:'드럼 하나는 정말 자신 있습니다.', appliedAt:'2026.09.09 19:30', preferredSlotIds:['iv1','iv2'], status:'pass', slotId:'iv1', notified:true, notifiedAt:'2026.09.13 11:20' },
  { id:'ap4', name:'최유나', dept:'영어영문학과 23', contact:'010-5678-9012', kakao:'yuna_c', sessions:['건반','보컬'], exp:'피아노 10년', message:'클래식 피아노를 오래 쳤고 밴드 건반에 도전해보고 싶습니다.', appliedAt:'2026.09.11 22:48', preferredSlotIds:['iv3','iv5'], status:'new', slotId:null, notified:false, notifiedAt:null },
  { id:'ap5', name:'정민호', dept:'기계공학과 20', contact:'010-6789-0123', kakao:'minho_j', sessions:['기타'], exp:'취미 1년', message:'열정만큼은 누구에게도 지지 않습니다.', appliedAt:'2026.09.08 16:10', preferredSlotIds:['iv3'], status:'fail', slotId:null, notified:false, notifiedAt:null },
];

type Slot = typeof IV_DEFAULT[0];
type Applicant = typeof AP_SEED[0];

function loadSlots(): Slot[] {
  try { const r = localStorage.getItem(IV_KEY); if (r) { const v = JSON.parse(r); if (Array.isArray(v)) return v; } } catch {}
  return IV_DEFAULT.map(s => ({ ...s }));
}
function loadApplicants(): Applicant[] {
  try { const r = localStorage.getItem(AP_KEY); if (r) { const v = JSON.parse(r); if (Array.isArray(v)) return v; } } catch {}
  return [];
}
function saveApplicants(list: Applicant[]) {
  try { localStorage.setItem(AP_KEY, JSON.stringify(list)); } catch {}
}
function weekday(iso: string) { return WD[new Date(iso + 'T00:00:00').getDay()] || ''; }
function slotText(s: Slot) { return `${s.date.slice(5).replace('-','.')} (${weekday(s.date)}) ${s.start}–${s.end}`; }
function nowStamp() {
  const d = new Date(), p = (n: number) => String(n).padStart(2,'0');
  return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function slotDur(s: Slot) {
  const toM = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
  return Math.max(0, toM(s.end) - toM(s.start));
}
function deriveStage(a: Applicant) {
  if (a.status === 'interview') return 'interview';
  if (a.status === 'pass' || a.status === 'fail') return a.notified ? 'result' : 'await';
  return 'doc';
}

export default function JoinNewPage() {
  const theme = useTheme();
  const [view, setView] = useState<'form' | 'status'>('form');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [editingSlots, setEditingSlots] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // form state
  const [avatarSource, setAvatarSource] = useState<'kakao' | 'default'>('kakao');
  const [name, setName] = useState('');
  const [nick, setNick] = useState('');
  const [sessions, setSessions] = useState<string[]>([]);
  const [sessionExp, setSessionExp] = useState<Record<string, string>>({});
  const [genres, setGenres] = useState<string[]>([]);
  const [dept, setDept] = useState('');
  const [studentId, setStudentId] = useState('');
  const [year, setYear] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [chosenSlots, setChosenSlots] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const sl = loadSlots(); setSlots(sl);
    try {
      const myId = localStorage.getItem(MY_KEY);
      if (myId) {
        const list = loadApplicants();
        const a = list.find(x => x.id === myId);
        if (a) { setCurrentId(myId); setApplicant(a); setView('status'); }
      }
    } catch {}
    const handleStorage = (e: StorageEvent) => {
      if (e.key === AP_KEY || e.key === IV_KEY) {
        setSlots(loadSlots());
        if (currentId) {
          const list = loadApplicants();
          const a = list.find(x => x.id === currentId);
          if (a) setApplicant(a);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [currentId]);

  function toggleChip<T extends string>(list: T[], val: T, setList: (v: T[]) => void) {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  }
  function formatPhone(raw: string) {
    let d = raw.replace(/\D/g,'').slice(0,11);
    if (d.length >= 8) d = d.replace(/(\d{3})(\d{4})(\d+)/,'$1-$2-$3');
    else if (d.length >= 4) d = d.replace(/(\d{3})(\d+)/,'$1-$2');
    return d;
  }

  function submit() {
    const errors: Record<string, boolean> = {};
    if (!name.trim()) errors.name = true;
    if (!sessions.length) errors.sessions = true;
    if (!dept.trim()) errors.dept = true;
    if (!studentId.trim()) errors.studentId = true;
    if (!year) errors.year = true;
    if (!phone.trim()) errors.phone = true;
    if (!message.trim()) errors.message = true;
    if (slots.length && chosenSlots.size === 0) errors.slots = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const sid = studentId.trim();
    const cohort = sid.length >= 4 ? sid.slice(2,4) : '';
    const expParts = sessions.filter(s => sessionExp[s]).map(s => `${s} ${sessionExp[s]}년`);
    const a: Applicant = {
      id: 'ap' + Date.now(), name: name.trim(), dept: (dept.trim() + (cohort ? ' ' + cohort : '')).trim(),
      contact: phone.trim(), kakao: '', sessions, exp: expParts.length ? expParts.join(' · ') : '신규 지원',
      message: message.trim(), appliedAt: nowStamp(), preferredSlotIds: [...chosenSlots],
      status: 'new', slotId: null, notified: false, notifiedAt: null,
    } as unknown as Applicant;

    let list = loadApplicants();
    if (!list.length) list = AP_SEED.map(x => ({ ...x }));
    list.push(a);
    saveApplicants(list);
    try { localStorage.setItem(MY_KEY, a.id); } catch {}
    setCurrentId(a.id); setApplicant(a); setView('status'); setEditingSlots(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function applyDemo(st: string) {
    if (!applicant) return;
    const list = loadApplicants(); const rec = list.find(x => x.id === applicant.id); if (!rec) return;
    const fallbackSlot = () => (rec.preferredSlotIds || []).find((x: string) => slots.find(s => s.id === x)) || slots[0]?.id || null;
    if (st === 'new') { rec.status = 'new'; rec.slotId = null; rec.notified = false; rec.notifiedAt = null; }
    else if (st === 'interview') { rec.status = 'interview'; rec.slotId = rec.slotId || fallbackSlot(); rec.notified = false; rec.notifiedAt = null; }
    else { rec.status = st as 'pass'|'fail'; if (!rec.slotId) rec.slotId = fallbackSlot(); rec.notified = true; rec.notifiedAt = nowStamp(); }
    saveApplicants(list); setEditingSlots(false); setApplicant({ ...rec });
  }

  function showToast(msg: string) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }

  function saveEditSlots(newChosen: Set<string>) {
    if (!applicant) return;
    const list = loadApplicants(); const rec = list.find(x => x.id === applicant.id);
    if (rec) { rec.preferredSlotIds = [...newChosen]; saveApplicants(list); setApplicant({ ...rec }); }
    setEditingSlots(false); showToast('희망 면접 시간대를 변경했어요');
  }

  const slotById = (id: string) => slots.find(s => s.id === id);

  return (
    <div className="pub-body">
      <div className="amb" />
      <header className="bar">
        <div className="wrap bar-inner">
          <Link className="logo" href="/">
            <span style={{ width:30, height:30, borderRadius:6, border:'1.5px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ width:22, height:22, display:'inline-block', background:'var(--accent-hover)', WebkitMaskImage:'url(/icon.svg)', WebkitMaskSize:'contain', WebkitMaskRepeat:'no-repeat', WebkitMaskPosition:'center', maskImage:'url(/icon.svg)', maskSize:'contain', maskRepeat:'no-repeat', maskPosition:'center' }} />
            </span>
            <span className="name">청림그룹사운드</span>
          </Link>
          <ThemePicker
            currentTheme={theme.currentTheme}
            open={theme.open}
            onToggle={(e) => { e.stopPropagation(); theme.setOpen(v => !v); }}
            onSelect={theme.applyTheme}
            pickerRef={theme.pickerRef}
          />
        </div>
      </header>

      <main className="new-main">
        <div className="wrap panel">
          {view === 'form' && (
            <>
              <Link className="back" href="/join">
                <span className="ico"><svg width="14" height="14" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></span>
                가입 방식 다시 선택
              </Link>
              <div className="kicker">신규 부원 · 지원서</div>
              <h1 className="title">지원서를 작성할게요</h1>
              <p className="title-sub">세션과 간단한 소개, 그리고 <b>희망 면접 시간대</b>를 골라주세요.</p>

              <div className="formcard">
                <div className="sect-head"><span className="n">01</span><span className="t">프로필</span><span className="ln" /></div>
                <div className="field">
                  <div className="flabel"><label>프로필 사진</label><span className="h">필수</span></div>
                  <div className="avapick">
                    {(['kakao', 'default'] as const).map(val => (
                      <div key={val} className="avaopt" aria-pressed={avatarSource === val} onClick={() => setAvatarSource(val)}>
                        {val === 'kakao'
                          ? <span className="pv kao">{name.trim().slice(-2) || '나'}</span>
                          : <span className="pv def ico"><svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="9" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg></span>
                        }
                        <span className="lab">
                          <span className="a">{val === 'kakao' ? '카카오 프로필' : '기본 이미지'}</span>
                          <span className="b">{val === 'kakao' ? '연동된 사진 사용' : '세션 아이콘 사용'}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <div className="flabel"><label>이름</label><span className="h">필수 · 실명</span></div>
                  <input className="inp" maxLength={20} placeholder="예) 김도윤"
                    style={fieldErrors.name ? { borderColor: 'var(--bad)' } : {}}
                    value={name} onChange={e => { setName(e.target.value); setFieldErrors(fe => ({ ...fe, name: false })); }} />
                </div>
                <div className="field">
                  <div className="flabel"><label>닉네임 (활동명)</label><span className="h">선택 · 최대 20자</span></div>
                  <input className="inp" maxLength={20} placeholder="미입력 시 실명으로 표시됩니다" value={nick} onChange={e => setNick(e.target.value)} />
                </div>

                <div className="divider" />
                <div className="sect-head"><span className="n">02</span><span className="t">음악 활동</span><span className="ln" /></div>
                <div className="field">
                  <div className="flabel"><label>지원 세션</label><span className="h">필수 · 중복 선택 가능</span></div>
                  <div className="chips" style={fieldErrors.sessions ? { outline: '1px solid var(--bad)', outlineOffset: 4, borderRadius: 8 } : {}}>
                    {SESSION_LIST.map(s => (
                      <button key={s} type="button" className="chip" aria-pressed={sessions.includes(s)}
                        onClick={() => { toggleChip(sessions, s, v => { setSessions(v); setSessionExp(prev => { const n = { ...prev }; if (!v.includes(s)) delete n[s]; else if (!n[s]) n[s] = ''; return n; }); }); setFieldErrors(fe => ({ ...fe, sessions: false })); }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <div className="flabel"><label>세션별 경력 연차</label><span className="h">선택</span></div>
                  {sessions.length === 0
                    ? <div className="empty-exp">세션을 먼저 선택하면 연차를 입력할 수 있어요.</div>
                    : <div className="exprows">{sessions.map(s => (
                        <div key={s} className="exprow">
                          <span className="sn">{s}</span>
                          <input className="yr" type="number" min={0} max={99} value={sessionExp[s] ?? ''}
                            onChange={e => setSessionExp(prev => ({ ...prev, [s]: e.target.value }))} />
                          <span className="yu">년</span>
                        </div>
                      ))}</div>
                  }
                </div>
                <div className="field">
                  <div className="flabel"><label>선호 장르</label><span className="h">선택 · 중복 가능</span></div>
                  <div className="chips">{GENRE_LIST.map(g => <button key={g} type="button" className="chip" aria-pressed={genres.includes(g)} onClick={() => toggleChip(genres, g, setGenres)}>{g}</button>)}</div>
                </div>

                <div className="divider" />
                <div className="sect-head"><span className="n">03</span><span className="t">학적 · 연락처</span><span className="ln" /></div>
                <div className="field">
                  <div className="flabel"><label>학과</label><span className="h">필수</span></div>
                  <input className="inp" maxLength={30} placeholder="예) 실용음악과"
                    style={fieldErrors.dept ? { borderColor: 'var(--bad)' } : {}}
                    value={dept} onChange={e => { setDept(e.target.value); setFieldErrors(fe => ({ ...fe, dept: false })); }} />
                </div>
                <div className="two-col">
                  <div className="field">
                    <div className="flabel"><label>학번</label><span className="h">필수</span></div>
                    <input className="inp" inputMode="numeric" maxLength={10} placeholder="예) 20261234"
                      style={fieldErrors.studentId ? { borderColor: 'var(--bad)' } : {}}
                      value={studentId} onChange={e => { setStudentId(e.target.value.replace(/\D/g,'')); setFieldErrors(fe => ({ ...fe, studentId: false })); }} />
                  </div>
                  <div className="field">
                    <div className="flabel"><label>학년</label><span className="h">필수</span></div>
                    <select className="inp" value={year}
                      style={fieldErrors.year ? { borderColor: 'var(--bad)' } : {}}
                      onChange={e => { setYear(e.target.value); setFieldErrors(fe => ({ ...fe, year: false })); }}>
                      <option value="" disabled>선택</option>
                      {YEAR_LIST.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <div className="flabel"><label>연락처</label><span className="h">필수</span></div>
                  <input className="inp" inputMode="numeric" maxLength={13} placeholder="010-0000-0000"
                    style={fieldErrors.phone ? { borderColor: 'var(--bad)' } : {}}
                    value={phone} onChange={e => { setPhone(formatPhone(e.target.value)); setFieldErrors(fe => ({ ...fe, phone: false })); }} />
                </div>

                <div className="divider" />
                <div className="sect-head"><span className="n">04</span><span className="t">지원 동기</span><span className="ln" /></div>
                <div className="field">
                  <div className="flabel"><label>자기소개 · 지원 동기</label><span className="h">{message.length}/200</span></div>
                  <textarea className="inp" rows={3} maxLength={200} placeholder="어떤 음악을 좋아하는지, 왜 청림에 들어오고 싶은지 적어주세요."
                    style={fieldErrors.message ? { borderColor: 'var(--bad)' } : {}}
                    value={message} onChange={e => { setMessage(e.target.value); setFieldErrors(fe => ({ ...fe, message: false })); }} />
                </div>

                <div className="divider" />
                <div className="sect-head"><span className="n">05</span><span className="t">희망 면접 시간대</span><span className="ln" /></div>
                <p className="slot-intro">가능한 시간대를 <b>여러 개</b> 골라주세요. 운영진이 그중 하나로 면접을 확정해 안내드려요.</p>
                <SlotPicker
                  slots={slots} chosen={chosenSlots} setChosen={setChosenSlots}
                  hasError={!!fieldErrors.slots}
                  onInteract={() => setFieldErrors(fe => ({ ...fe, slots: false }))}
                />

                <button className="pub-btn-primary" onClick={submit}>
                  <span className="ico"><svg width="17" height="17" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg></span>
                  지원서 제출하기
                </button>
                <p className="formnote">제출 후에도 운영진 통지 전까지 희망 시간대는 변경 요청할 수 있어요.</p>
              </div>
            </>
          )}

          {view === 'status' && applicant && (
            <StatusView
              applicant={applicant}
              slots={slots}
              slotById={slotById}
              editingSlots={editingSlots}
              onStartEdit={() => setEditingSlots(true)}
              onCancelEdit={() => setEditingSlots(false)}
              onSaveEdit={saveEditSlots}
              onApplyDemo={applyDemo}
              onReset={() => { try { localStorage.removeItem(MY_KEY); } catch {} setView('form'); setCurrentId(null); setApplicant(null); }}
            />
          )}
        </div>
      </main>

      {toast && <div className="sttoast">{toast}</div>}

      <footer className="pub-footer">
        <div className="wrap foot-inner">
          <span>© 청림그룹사운드 · 한남대학교</span>
          <span>CHUNGLIM GROUP SOUND</span>
        </div>
      </footer>
    </div>
  );
}

/* ── Slot Picker ── */
function SlotPicker({ slots, chosen, setChosen, hasError, onInteract }: {
  slots: Slot[]; chosen: Set<string>; setChosen: (s: Set<string>) => void;
  hasError: boolean; onInteract: () => void;
}) {
  if (!slots.length) return <div className="slot-empty">아직 등록된 면접 시간대가 없어요. 지원서를 제출하면 운영진이 면접 일정을 별도로 안내드릴게요.</div>;
  const sorted = [...slots].sort((a,b) => a.date===b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date));
  const groups: { date: string; items: Slot[] }[] = [];
  sorted.forEach(s => { let g = groups.find(x => x.date===s.date); if (!g) { g={date:s.date,items:[]}; groups.push(g); } g.items.push(s); });
  return (
    <div style={hasError ? { outline: '1px solid var(--bad)', outlineOffset: 6, borderRadius: 10 } : {}}>
      {groups.map(g => {
        const [,mm,dd] = g.date.split('-');
        return (
          <div key={g.date} className="slotgroup">
            <div className="gh"><span className="d">{mm}.{dd}</span><span className="w">({weekday(g.date)}요일)</span><span className="ln" /></div>
            <div className="slotlist">
              {g.items.map(s => {
                const full = s.booked >= s.capacity;
                const on = chosen.has(s.id);
                return (
                  <button key={s.id} type="button" className="slotopt" aria-pressed={on} disabled={full && !on}
                    onClick={() => {
                      const next = new Set(chosen);
                      if (on) next.delete(s.id); else next.add(s.id);
                      setChosen(next); onInteract();
                    }}
                  >
                    <span className="box ico"><svg width="13" height="13" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></span>
                    <span className="tm">{s.start}–{s.end}</span>
                    <span className="rm">{full && !on ? '마감' : (s.note ? s.note : `면접 ${s.capacity}명`)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Status View ── */
function StatusView({ applicant: a, slots, slotById, editingSlots, onStartEdit, onCancelEdit, onSaveEdit, onApplyDemo, onReset }: {
  applicant: Applicant; slots: Slot[]; slotById: (id: string) => Slot | undefined;
  editingSlots: boolean; onStartEdit: () => void; onCancelEdit: () => void;
  onSaveEdit: (s: Set<string>) => void; onApplyDemo: (st: string) => void; onReset: () => void;
}) {
  const [editChosen, setEditChosen] = useState<Set<string>>(new Set());
  const stage = deriveStage(a);

  useEffect(() => {
    if (editingSlots) setEditChosen(new Set((a.preferredSlotIds || []).filter((id: string) => slotById(id))));
  }, [editingSlots]);

  const confSlot = slotById(a.slotId || '');

  return (
    <>
      <div className="kicker">신규 부원 · 가입 현황</div>
      <h1 className="title">가입 진행 상황</h1>
      <p className="title-sub"><b>{a.name}</b>님, 지원해 주셔서 감사합니다. 아래에서 진행 상황을 실시간으로 확인할 수 있어요.</p>

      <div className="formcard">
        {/* stepper */}
        <div className="stepper">
          {[
            { label: '서류 확인', s: stage === 'doc' ? 'active' : 'done' },
            null,
            { label: '면접', s: stage === 'doc' ? 'pending' : stage === 'interview' ? 'active' : 'done' },
            null,
            { label: stage === 'result' ? (a.status === 'pass' ? '합격' : '불합격') : '결과',
              s: stage === 'doc' ? 'pending' : stage === 'interview' ? 'pending' : stage === 'await' ? 'wait' : a.status === 'pass' ? 'pass' : 'fail' },
          ].map((item, i) =>
            item === null
              ? <div key={i} className={`stepline${
                  (i === 1 && (stage === 'interview' || stage === 'await' || stage === 'result')) ||
                  (i === 3 && (stage === 'await' || stage === 'result'))
                    ? ' filled' : ''
                }`} />
              : <div key={i} className={`step ${item.s}`}>
                  <div className="dot ico">
                    {item.s === 'done' || item.s === 'pass' ? <svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                      : item.s === 'fail' ? <svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
                      : [1,2,3][Math.floor(i/2)]}
                  </div>
                  <div className="lbl">{item.label}</div>
                </div>
          )}
        </div>

        {/* hero status */}
        <div className={`statushero${stage==='doc'||stage==='interview'?' is-accent':stage==='await'?' is-muted':a.status==='pass'?' is-ok':' is-bad'}`}>
          <div className="hi ico">
            {stage==='doc'&&<svg width="18" height="18" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h5"/></svg>}
            {stage==='interview'&&<svg width="16" height="16" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>}
            {stage==='await'&&<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5l3.2 2"/></svg>}
            {stage==='result'&&a.status==='pass'&&<svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>}
            {stage==='result'&&a.status!=='pass'&&<svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>}
          </div>
          <div>
            <h3>{stage==='doc'?'서류를 확인하고 있어요':stage==='interview'?'면접이 확정되었어요':stage==='await'?'면접이 마무리되었어요':a.status==='pass'?'합격을 축하해요':'이번엔 함께하지 못했어요'}</h3>
            <p>{stage==='doc'?'운영진이 지원서를 검토하고 있어요. 희망하신 면접 시간대 중 하나로 면접을 확정해 카카오톡으로 안내드릴게요.'
              :stage==='interview'?'아래 일정에 맞춰 면접에 참석해 주세요.'
              :stage==='await'?'결과를 정리하고 있어요. 발표되면 카카오톡으로 가장 먼저 안내드릴게요.'
              :a.status==='pass'?`${a.name}님, 청림그룹사운드 신입 면접에 합격하셨습니다! 함께 무대를 만들어가게 되어 정말 기뻐요.`
              :`${a.name}님, 소중한 지원에 진심으로 감사드립니다. 아쉽지만 이번 모집에서는 함께하지 못하게 되었어요.`}</p>
          </div>
        </div>

        {/* stage body */}
        {stage === 'doc' && (
          editingSlots
            ? <>
                <div className="sect-head"><span className="n">·</span><span className="t">희망 면접 시간대 변경</span><span className="ln" /></div>
                <SlotPicker slots={slots} chosen={editChosen} setChosen={setEditChosen} hasError={false} onInteract={() => {}} />
                <div className="editactions">
                  <button className="pub-btn-primary" onClick={() => onSaveEdit(editChosen)}>변경 저장</button>
                  <button className="pub-btn-ghost" style={{ width: 'auto', flexShrink: 0, paddingLeft: 22, paddingRight: 22 }} onClick={onCancelEdit}>취소</button>
                </div>
              </>
            : <>
                <div className="sect-head"><span className="n">·</span><span className="t">내가 고른 희망 면접 시간대</span><span className="ln" /></div>
                <div className="preflist">
                  {(a.preferredSlotIds || []).length > 0
                    ? (a.preferredSlotIds || []).map((id: string) => { const s = slotById(id); return s ? (
                        <div key={id} className="prefitem">
                          <span className="ico" style={{ color: 'var(--accent-hover)' }}><svg width="16" height="16" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg></span>
                          <span className="tx">{slotText(s)}</span>
                          {s.note && <span className="nt">{s.note}</span>}
                        </div>
                      ) : null; })
                    : <div className="prefitem"><span className="tx" style={{ fontFamily: 'var(--font-kr)', color: 'var(--muted-foreground)' }}>아직 고른 시간대가 없어요.</span></div>
                  }
                </div>
                <button className="pub-btn-ghost" onClick={onStartEdit}>
                  <span className="ico"><svg width="15" height="15" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.05 2.05 0 0 1 2.9 2.9L7 19l-4 1 1-4z"/></svg></span>
                  면접 일정 변경하기
                </button>
              </>
        )}

        {(stage === 'interview' || stage === 'await') && (
          <>
            <div className="sect-head"><span className="n">·</span><span className="t">{stage==='await'?'면접 진행 일정':'확정된 면접 일정'}</span><span className="ln" /></div>
            {confSlot ? (
              <div className={`slotcard${stage==='await'?' muted':''}`}>
                <div className="dchip">
                  <span className="dm">{confSlot.date.slice(5).replace('-','.')}</span>
                  <span className="dw">({weekday(confSlot.date)})</span>
                </div>
                <div className="vline" />
                <div className="tinfo">
                  <div className="tt">{confSlot.start} – {confSlot.end}</div>
                  <div className="tn">{confSlot.note ? confSlot.note : '개별 면접'} · 약 {slotDur(confSlot)}분</div>
                </div>
              </div>
            ) : <p className="statushint">면접 일정이 곧 안내될 예정이에요.</p>}
            {stage === 'interview' && <p className="statushint">일정 변경이 필요하면 카카오톡으로 운영진에게 연락해 주세요.</p>}
          </>
        )}

        {/* summary */}
        <div className="divider" />
        <div className="sect-head"><span className="n">·</span><span className="t">지원 정보</span><span className="ln" /></div>
        <div className="summary">
          <div className="row"><span className="k">이름</span><span className="v">{a.name}</span></div>
          <div className="row"><span className="k">지원 세션</span><span className="v">{(a.sessions||[]).join(' · ')||'—'}</span></div>
          <div className="row"><span className="k">학과</span><span className="v">{a.dept||'—'}</span></div>
          <div className="row"><span className="k">접수일시</span><span className="v" style={{ fontFamily:'var(--font-mono)', fontSize:12.5 }}>{a.appliedAt||''}</span></div>
        </div>

        {/* demo controls */}
        <div className="demobar">
          <span className="demolabel">데모 미리보기 · 운영진이 상태를 바꾸면 이 화면이 자동으로 갱신돼요</span>
          <div className="demoseg">
            {[['new','서류 확인'],['interview','면접 예정'],['pass','합격'],['fail','불합격']].map(([v,l]) => (
              <button key={v} aria-pressed={a.status===v} onClick={() => onApplyDemo(v)}>{l}</button>
            ))}
          </div>
          <button className="demo-reset" onClick={onReset}>
            <span className="ico"><svg width="15" height="15" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.05 2.05 0 0 1 2.9 2.9L7 19l-4 1 1-4z"/></svg></span>
            새 지원서 작성 (처음 화면으로)
          </button>
        </div>
      </div>

      <Link className="pub-btn-primary" href="/home" style={{ textDecoration:'none', marginTop:22 }}>
        <span className="ico"><svg width="17" height="17" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
        청림 둘러보기
      </Link>
      <Link className="pub-btn-ghost" href="/" style={{ textDecoration:'none' }}>랜딩으로 돌아가기</Link>
    </>
  );
}
