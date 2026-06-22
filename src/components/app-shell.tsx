'use client';
// 앱 셸 — 헤더 / 하단 내비 / 푸터 / Tweaks 패널.
// 원본 App() 의 셸 부분을 라우터 기반으로 재구성. 화면 콘텐츠(children)는 각 page.tsx 가 채운다.
// localStorage 를 렌더 중 읽는 화면이 많아 마운트 이후에만 콘텐츠를 그려 SSR 충돌을 피한다.
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Header, BottomNav, SiteFooter } from '@/components/app-internals';
import { useGo, pathToScreen } from '@/lib/navigation';
import { useTweaks } from '@/components/tweaks';

const TWEAK_DEFAULTS = { theme: 'worn-denim', accent: 'default', displayFont: 'anton' };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const go = useGo();
  const screen = pathToScreen(pathname || '/');
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('data-theme', t.theme);
    el.setAttribute('data-accent', t.accent);
    el.setAttribute('data-font', t.displayFont);
  }, [t.theme, t.accent, t.displayFont]);

  if (!mounted) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '2.5px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.75s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <Header screen={screen} go={go} theme={t.theme} setTheme={(id: string) => setTweak('theme', id)} />
      <main className="app-main" style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 26px 90px' }}>
        <React.Fragment key={pathname}>{children}</React.Fragment>
        <SiteFooter go={go} />
      </main>
      <BottomNav screen={screen} go={go} />
    </>
  );
}
