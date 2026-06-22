'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemePicker } from '@/components/public/ThemePicker';
import { useTheme } from '@/hooks/useTheme';
import './(public)/public.css';
import './landing.css';

const REC_KEY = 'CHUNGLIM_recruit_v1';
const REC_DEFAULT = {
  open: true,
  semester: '2026-2학기 신입 모집',
  headline: '보컬 · 건반 세션 우대',
  body: '카카오 로그인 후 지원서를 작성하면 면접 일정을 안내드립니다.',
  sessions: ['보컬', '건반'] as string[],
  periodStart: '2026-08-25',
  periodEnd: '2026-09-12',
  closedNote: '이번 학기 신입 부원 모집은 마감되었습니다. 다음 모집 일정은 공지를 통해 안내드릴게요.',
};

function mmdd(iso: string) {
  const p = iso.split('-');
  return p.length === 3 ? `${p[1]}.${p[2]}` : iso;
}

function readRecruit() {
  try {
    const raw = localStorage.getItem(REC_KEY);
    if (raw) return { ...REC_DEFAULT, ...JSON.parse(raw) };
  } catch {}
  return { ...REC_DEFAULT };
}

export default function LandingPage() {
  const theme = useTheme();
  const [recruit, setRecruit] = useState(REC_DEFAULT);

  useEffect(() => {
    setRecruit(readRecruit());
    const handleStorage = (e: StorageEvent) => {
      if (e.key === REC_KEY) setRecruit(readRecruit());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="pub-body">
      <div className="amb" />
      <header className="bar">
        <div className="wrap bar-inner">
          <div className="logo">
            <span style={{ width:30, height:30, borderRadius:6, border:'1.5px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ width:22, height:22, display:'inline-block', background:'var(--accent-hover)', WebkitMaskImage:'url(/icon.svg)', WebkitMaskSize:'contain', WebkitMaskRepeat:'no-repeat', WebkitMaskPosition:'center', maskImage:'url(/icon.svg)', maskSize:'contain', maskRepeat:'no-repeat', maskPosition:'center' }} />
            </span>
            <span className="name">청림그룹사운드</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <ThemePicker
              currentTheme={theme.currentTheme}
              open={theme.open}
              onToggle={(e) => { e.stopPropagation(); theme.setOpen(v => !v); }}
              onSelect={theme.applyTheme}
              pickerRef={theme.pickerRef}
            />
            <Link className="pub-btn" href="/home">로그인</Link>
          </div>
        </div>
      </header>

      <section className="wrap hero">
        <div className="kicker">한남대학교 밴드 동아리 · SINCE 1985</div>
        <h1>청림<br />그룹사운드</h1>
        <p className="sub">
          음악으로 하나되는 공간.<br />
          <b>함께 연주하고, 함께 성장합니다.</b>
        </p>
        <div className="cta-row">
          <Link className="kakao" href="/join">
            <span className="ico">
              <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.582 2 2 4.91 2 8.5c0 2.284 1.437 4.294 3.61 5.487L4.79 17.18a.25.25 0 0 0 .373.274L9.35 14.93c.216.018.434.028.65.028 4.418 0 8-2.91 8-6.5S14.418 2 10 2z" fill="#191600" />
              </svg>
            </span>
            카카오로 시작하기
          </Link>
          <span className="cta-note">기존 부원은 계정 연동으로 바로 입장</span>
        </div>
        <div className="rail">
          <div className="item"><div className="n acc">48</div><div className="l">활동 부원</div></div>
          <div className="item"><div className="n">6</div><div className="l">합주 팀</div></div>
          <div className="item"><div className="n">21</div><div className="l">기수</div></div>
          <div className="item">
            <div className="n">40<span style={{ fontSize: 26 }}>+</span></div>
            <div className="l">정기 공연</div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <div className="kicker">우리가 하는 일</div>
              <h2>동아리 활동</h2>
            </div>
            <Link className="pub-btn" href="/home">합주 일정 보기</Link>
          </div>
          <div className="acts">
            <div className="act">
              <div className="top">
                <span className="ic ico">
                  <svg width="24" height="24" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>
                </span>
                <span className="idx">01</span>
              </div>
              <h3>정기 합주</h3>
              <p>매주 합주실에 모여 팀별로 연습합니다. 온라인 타임테이블로 합주실을 예약해요.</p>
            </div>
            <div className="act">
              <div className="top">
                <span className="ic ico">
                  <svg width="24" height="24" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/></svg>
                </span>
                <span className="idx">02</span>
              </div>
              <h3>정기 공연</h3>
              <p>학기마다 무대에 올라 한 학기의 연습을 관객 앞에서 선보입니다.</p>
            </div>
            <div className="act">
              <div className="top">
                <span className="ic ico">
                  <svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 2l2.5 5.3 5.8.8-4.2 4 1 5.7L12 20l-5.1 2.6 1-5.7-4.2-4 5.8-.8z" transform="translate(0 -1)"/></svg>
                </span>
                <span className="idx">03</span>
              </div>
              <h3>신입 교육</h3>
              <p>악기를 처음 잡는 분도 환영합니다. 세션별 선배가 기초부터 함께합니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" style={{ borderTop: 'none', paddingTop: 0 }}>
        <div className="wrap">
          <div className={`join-block${recruit.open ? '' : ' is-closed'}`}>
            <div>
              <div className="kicker">{recruit.open ? recruit.semester : '모집 마감'}</div>
              <div className="big">{recruit.open ? recruit.headline : '다음 모집을 기다려주세요'}</div>
              <div className="small">{recruit.open ? recruit.body : (recruit.closedNote)}</div>
              {recruit.open && recruit.sessions.length > 0 && (
                <div className="rec-tags">
                  {recruit.sessions.map((s: string) => <span key={s} className="rec-tag">{s} 우대</span>)}
                </div>
              )}
              {recruit.open && (recruit.periodStart || recruit.periodEnd) && (
                <div className="rec-period">
                  모집 기간 {mmdd(recruit.periodStart)} – {mmdd(recruit.periodEnd)}
                </div>
              )}
            </div>
            {recruit.open ? (
              <Link className="kakao" href="/join">
                <span className="ico">
                  <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.582 2 2 4.91 2 8.5c0 2.284 1.437 4.294 3.61 5.487L4.79 17.18a.25.25 0 0 0 .373.274L9.35 14.93c.216.018.434.028.65.028 4.418 0 8-2.91 8-6.5S14.418 2 10 2z" fill="#191600" />
                  </svg>
                </span>
                지원하기
              </Link>
            ) : (
              <span className="rec-closed-btn">
                <span className="ico">
                  <svg width="15" height="15" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>
                </span>
                모집 마감
              </span>
            )}
          </div>
        </div>
      </section>

      <footer className="pub-footer">
        <div className="wrap foot-inner">
          <span>© 청림그룹사운드 · 한남대학교</span>
          <span>CHUNGLIM GROUP SOUND</span>
        </div>
      </footer>
    </div>
  );
}
