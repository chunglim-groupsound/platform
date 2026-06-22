'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemePicker } from '@/components/public/ThemePicker';
import { useTheme } from '@/hooks/useTheme';
import './existing.css';

const ROSTER: Record<string, { name: string; gen: number; session: string[]; dept: string }> = {
  'CL18-7F3A-9K2D': { name: '김도현', gen: 18, session: ['기타'],         dept: '실용음악과' },
  'CL19-X2M8-QP4L': { name: '이서연', gen: 19, session: ['보컬'],         dept: '국어국문학과' },
  'CL20-D5R1-V7HT': { name: '최유진', gen: 20, session: ['건반', '보컬'], dept: '작곡과' },
};

const SESSION_LIST = ['보컬', '기타', '베이스', '드럼', '건반'];
const GENRE_LIST   = ['록', '팝', '인디', '재즈', 'R&B', '메탈', '힙합', '발라드', '펀크', '포크'];
const YEAR_LIST    = ['1학년', '2학년', '3학년', '4학년', '5학년', '수료', '졸업', '휴학'];

type Step = 1 | 2;

export default function JoinExistingPage() {
  const theme = useTheme();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [keyValue, setKeyValue] = useState('');
  const [keyError, setKeyError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [matched, setMatched] = useState<(typeof ROSTER)[string] | null>(null);

  // step 2 form
  const [avatarSource, setAvatarSource] = useState<'kakao' | 'default'>('kakao');
  const [nick, setNick] = useState('');
  const [bio, setBio] = useState('');
  const [sessions, setSessions] = useState<string[]>([]);
  const [sessionExp, setSessionExp] = useState<Record<string, string>>({});
  const [genres, setGenres] = useState<string[]>([]);
  const [dept, setDept] = useState('');
  const [studentId, setStudentId] = useState('');
  const [year, setYear] = useState('');
  const [phone, setPhone] = useState('');
  const [phonePrivate, setPhonePrivate] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  function normalize(v: string) { return v.toUpperCase().replace(/\s/g, ''); }

  function verify() {
    const key = normalize(keyValue);
    const rec = ROSTER[key];
    if (!rec) {
      setKeyError('인증키가 일치하지 않아요. 다시 확인해 주세요.');
      setShaking(true);
      setTimeout(() => setShaking(false), 420);
      return;
    }
    setKeyError('');
    setMatched(rec);
    setSessions(rec.session);
    setSessionExp(Object.fromEntries(rec.session.map(s => [s, '2'])));
    setDept(rec.dept);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleChip<T extends string>(list: T[], val: T, setList: (v: T[]) => void) {
    setList(list.includes(val) ? list.filter(x => x !== val) : [...list, val]);
  }

  function formatPhone(raw: string) {
    let d = raw.replace(/\D/g, '').slice(0, 11);
    if (d.length >= 8) d = d.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3');
    else if (d.length >= 4) d = d.replace(/(\d{3})(\d+)/, '$1-$2');
    return d;
  }

  function submit() {
    const errors: Record<string, boolean> = {};
    if (!sessions.length) errors.sessions = true;
    if (!dept.trim()) errors.dept = true;
    if (!studentId.trim()) errors.studentId = true;
    if (!year) errors.year = true;
    if (!phone.trim()) errors.phone = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    router.push('/home');
  }

  const kakaoInitial = matched ? matched.name.trim().slice(-2) : '';

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

      <main className="exist-main">
        <div className="wrap panel">
          <Link className="back" href="/join">
            <span className="ico"><svg width="14" height="14" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></span>
            가입 방식 다시 선택
          </Link>

          <div className="steps" id="stepBar">
            <div className={`step ${step === 1 ? 'active' : 'done'}`}>
              <span className="num">
                {step === 2
                  ? <svg width="14" height="14" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                  : '1'}
              </span>
              <span className="lbl">인증키 확인</span>
            </div>
            <span className={`line${step === 2 ? ' done' : ''}`} />
            <div className={`step ${step === 2 ? 'active' : ''}`}>
              <span className="num">2</span>
              <span className="lbl">부원 정보 등록</span>
            </div>
          </div>

          <div className="kicker">기존 부원 · 계정 연동</div>

          {/* STEP 1 */}
          {step === 1 && (
            <section>
              <h1 className="title">개인 인증키를 입력해 주세요</h1>
              <p className="title-sub">
                운영진에게 받은 <b style={{ color: 'var(--foreground)' }}>개인 인증키</b>로
                명단에 등록된 본인 정보를 안전하게 확인합니다. 이름·기수를 직접 입력하지 않아요.
              </p>
              <div className="formcard">
                <div className={`keyfield${keyError ? ' err' : ''}${shaking ? ' shake' : ''}`}>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="CL00-XXXX-XXXX"
                    maxLength={14}
                    aria-label="개인 인증키"
                    value={keyValue}
                    onChange={e => { setKeyValue(e.target.value); setKeyError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter' && normalize(keyValue).length >= 6) verify(); }}
                  />
                </div>
                {keyError && (
                  <div className="keyerror">
                    <span className="ico"><svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg></span>
                    <span>{keyError}</span>
                  </div>
                )}
                <p className="field-hint">인증키는 회장·총무에게 발급받을 수 있어요. 대소문자는 구분하지 않습니다.</p>
                <button
                  className="btn-primary"
                  disabled={normalize(keyValue).length < 6}
                  onClick={verify}
                >
                  <span className="ico"><svg width="17" height="17" viewBox="0 0 24 24"><path d="M9 12.5l2 2 4-4.5"/><circle cx="12" cy="12" r="9"/></svg></span>
                  인증키 확인
                </button>
                <div className="demo-note">
                  <b>데모용 인증키</b> — 클릭하면 자동 입력됩니다.<br />
                  {['CL18-7F3A-9K2D', 'CL19-X2M8-QP4L', 'CL20-D5R1-V7HT'].map(k => (
                    <code key={k} className="demo-key" onClick={() => setKeyValue(k)}>{k}</code>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* STEP 2 */}
          {step === 2 && matched && (
            <section>
              <h1 className="title">부원 정보를 등록할게요</h1>
              <p className="title-sub">명단에서 확인된 정보예요. 잠긴 항목은 운영진만 수정할 수 있어요. 나머지를 채우면 연동이 완료됩니다.</p>
              <div className="formcard">
                <div className="matched">
                  <span className="chk ico"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></span>
                  <span className="mt">
                    <span className="a">명단 확인 완료</span>
                    <span className="b">{matched.name} <span>· {matched.gen}기</span></span>
                  </span>
                </div>

                <div className="locked-grid">
                  <div className="locked">
                    <div className="k">이름</div>
                    <div className="v">
                      <span>{matched.name}</span>
                      <span className="lock ico"><svg width="13" height="13" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>
                    </div>
                  </div>
                  <div className="locked">
                    <div className="k">기수</div>
                    <div className="v">
                      <span>{matched.gen}기</span>
                      <span className="lock ico"><svg width="13" height="13" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>
                    </div>
                  </div>
                </div>

                <div className="divider" />

                {/* 프로필 */}
                <div className="sect-head"><span className="n">01</span><span className="t">프로필</span><span className="ln" /></div>
                <div className="field">
                  <div className="flabel"><label>프로필 사진</label><span className="h">필수</span></div>
                  <div className="avapick">
                    {(['kakao', 'default'] as const).map(val => (
                      <div
                        key={val}
                        className="avaopt"
                        aria-pressed={avatarSource === val}
                        onClick={() => setAvatarSource(val)}
                      >
                        {val === 'kakao'
                          ? <span className="pv kao">{kakaoInitial}</span>
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
                  <div className="flabel"><label>닉네임 (활동명)</label><span className="h">선택 · 최대 20자</span></div>
                  <input className="inp" maxLength={20} placeholder="미입력 시 실명으로 표시됩니다" value={nick} onChange={e => setNick(e.target.value)} />
                </div>
                <div className="field">
                  <div className="flabel"><label>상태메시지</label><span className="h">선택 · {bio.length}/60</span></div>
                  <textarea className="inp" rows={2} maxLength={60} placeholder="프로필에 표시될 한 줄 소개를 적어보세요" style={{ resize: 'vertical', minHeight: 60, lineHeight: 1.6 }} value={bio} onChange={e => setBio(e.target.value)} />
                </div>

                <div className="divider" />

                {/* 음악 활동 */}
                <div className="sect-head"><span className="n">02</span><span className="t">음악 활동</span><span className="ln" /></div>
                <div className="field">
                  <div className="flabel"><label>세션</label><span className="h">필수 · 중복 선택 가능</span></div>
                  <div className="chips" style={fieldErrors.sessions ? { outline: '1px solid var(--bad)', outlineOffset: 4, borderRadius: 8 } : {}}>
                    {SESSION_LIST.map(s => (
                      <button
                        key={s} type="button" className="chip"
                        aria-pressed={sessions.includes(s)}
                        onClick={() => {
                          toggleChip(sessions, s, v => {
                            setSessions(v);
                            setSessionExp(prev => {
                              const next = { ...prev };
                              if (!v.includes(s)) delete next[s];
                              else if (!next[s]) next[s] = '';
                              return next;
                            });
                          });
                          setFieldErrors(fe => ({ ...fe, sessions: false }));
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <div className="flabel"><label>세션별 경력 연차</label><span className="h">선택</span></div>
                  {sessions.length === 0
                    ? <div className="empty-exp">세션을 먼저 선택하면 연차를 입력할 수 있어요.</div>
                    : <div className="exprows">
                        {sessions.map(s => (
                          <div key={s} className="exprow">
                            <span className="sn">{s}</span>
                            <input className="yr" type="number" min={0} max={99}
                              value={sessionExp[s] ?? ''}
                              onChange={e => setSessionExp(prev => ({ ...prev, [s]: e.target.value }))} />
                            <span className="yu">년</span>
                          </div>
                        ))}
                      </div>
                  }
                </div>
                <div className="field">
                  <div className="flabel"><label>선호 장르</label><span className="h">선택 · 중복 가능</span></div>
                  <div className="chips">
                    {GENRE_LIST.map(g => (
                      <button key={g} type="button" className="chip" aria-pressed={genres.includes(g)} onClick={() => toggleChip(genres, g, setGenres)}>{g}</button>
                    ))}
                  </div>
                </div>

                <div className="divider" />

                {/* 학적·연락처 */}
                <div className="sect-head"><span className="n">03</span><span className="t">학적 · 연락처</span><span className="ln" /></div>
                <div className="field">
                  <div className="flabel"><label>학과</label><span className="h">필수</span></div>
                  <input className="inp" maxLength={30} placeholder="예) 실용음악과"
                    style={fieldErrors.dept ? { borderColor: 'var(--bad)' } : {}}
                    value={dept}
                    onChange={e => { setDept(e.target.value); setFieldErrors(fe => ({ ...fe, dept: false })); }} />
                </div>
                <div className="two-col">
                  <div className="field">
                    <div className="flabel"><label>학번</label><span className="h">필수</span></div>
                    <input className="inp" inputMode="numeric" maxLength={10} placeholder="예) 20231234"
                      style={fieldErrors.studentId ? { borderColor: 'var(--bad)' } : {}}
                      value={studentId}
                      onChange={e => { setStudentId(e.target.value.replace(/\D/g, '')); setFieldErrors(fe => ({ ...fe, studentId: false })); }} />
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
                    value={phone}
                    onChange={e => { setPhone(formatPhone(e.target.value)); setFieldErrors(fe => ({ ...fe, phone: false })); }} />
                  <label className={`toggle-row${phonePrivate ? ' on' : ''}`} onClick={() => setPhonePrivate(v => !v)}>
                    <span className="toggle" />
                    <span className="tl">연락처를 부원에게 비공개</span>
                  </label>
                </div>

                <button className="btn-primary" onClick={submit}>
                  <span className="ico">
                    <svg width="17" height="17" viewBox="0 0 24 24"><path d="m11.3 12.6 6-6M15.2 4.7l1.7-1.7 2.1 2.1-1.7 1.7"/><circle cx="8.5" cy="15.5" r="4"/></svg>
                  </span>
                  연동하고 입장하기
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="pub-footer">
        <div className="wrap foot-inner">
          <span>© 청림그룹사운드 · 한남대학교</span>
          <span>CHUNGLIM GROUP SOUND</span>
        </div>
      </footer>
    </div>
  );
}
