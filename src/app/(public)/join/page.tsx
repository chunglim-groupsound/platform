'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemePicker } from '@/components/public/ThemePicker';
import { useTheme } from '@/hooks/useTheme';
import './join.css';

export default function JoinPage() {
  const theme = useTheme();
  const [kakaoName, setKakaoName] = useState('김민수');

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const name = params.get('name') || localStorage.getItem('kakaoName');
      if (name) setKakaoName(name);
    } catch {}
  }, []);

  const initial = kakaoName.trim().slice(-2, -1) || kakaoName.trim().slice(0, 1);

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

      <main className="join-main">
        <div className="wrap signup">
          <div className="who">
            <span className="ava">{initial}</span>
            <span className="meta">
              <span className="nm">{kakaoName}</span>
              <span className="sub">카카오 계정으로 로그인됨</span>
            </span>
            <span className="kao ico">
              <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.582 2 2 4.91 2 8.5c0 2.284 1.437 4.294 3.61 5.487L4.79 17.18a.25.25 0 0 0 .373.274L9.35 14.93c.216.018.434.028.65.028 4.418 0 8-2.91 8-6.5S14.418 2 10 2z" fill="#191600" />
              </svg>
            </span>
          </div>

          <h1>반가워요! <b>청림 부원</b> 등록을<br />먼저 마쳐주세요.</h1>
          <p className="lead">아직 연동된 부원 정보가 없어요. 아래에서 본인에게 맞는 가입 방식을 선택하면 등록을 시작합니다.</p>

          <div className="choices">
            <Link className="choice" href="/join/existing">
              <div className="top">
                <span className="ic ico">
                  <svg width="22" height="22" viewBox="0 0 24 24"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="m16.5 11.5 2.2 2.2 4-4.2"/></svg>
                </span>
                <span className="idx">01</span>
              </div>
              <h2>기존 부원</h2>
              <div className="kr">이미 청림에서 활동 중이에요</div>
              <p>동아리 명단에 등록된 부원이 카카오 계정을 연동합니다. 이름·기수를 확인하면 바로 입장할 수 있어요.</p>
              <div className="tags">
                <span className="tag"><span className="dot" />본인 확인 후 즉시 입장</span>
                <span className="tag"><span className="dot" />승인 불필요</span>
              </div>
              <div className="go">
                <span>계정 연동하기</span>
                <span className="arr ico">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </span>
              </div>
            </Link>

            <Link className="choice" href="/join/new">
              <div className="top">
                <span className="ic ico">
                  <svg width="22" height="22" viewBox="0 0 24 24"><path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M2.5 20a6.5 6.5 0 0 1 12 0"/><path d="M19 8.5v6M22 11.5h-6"/></svg>
                </span>
                <span className="idx">02</span>
              </div>
              <h2>신규 부원</h2>
              <div className="kr">새로 청림에 들어갈게요</div>
              <p>지원서를 작성하고 운영진의 승인을 받으면 활동을 시작합니다. 세션과 간단한 소개만 적으면 돼요.</p>
              <div className="tags">
                <span className="tag"><span className="dot" />지원서 작성</span>
                <span className="tag"><span className="dot" />운영진 승인 필요</span>
              </div>
              <div className="go">
                <span>지원서 쓰기</span>
                <span className="arr ico">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </span>
              </div>
            </Link>
          </div>

          <div className="afoot">
            <span className="hint">잘 모르겠다면 <b style={{ color: 'var(--muted-foreground)' }}>기존 부원</b>으로 먼저 확인해 보세요.</span>
            <Link className="switch" href="/">
              <span className="ico">
                <svg width="14" height="14" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              </span>
              다른 카카오 계정으로 로그인
            </Link>
          </div>
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
