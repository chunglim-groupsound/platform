import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '청림그룹사운드',
  description: '청림그룹사운드 밴드 동아리 — 합주실 예약 · 부원 · 팀 · 공지',
  appleWebApp: { capable: true, title: '청림그룹사운드', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#151A26',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const themeScript = `
(function(){try{
  var s=localStorage.getItem('CHUNGLIM_tweaks_v1');
  if(s){var t=JSON.parse(s);var e=document.documentElement;
    if(t.theme)e.setAttribute('data-theme',t.theme);
    if(t.accent)e.setAttribute('data-accent',t.accent);
    if(t.displayFont)e.setAttribute('data-font',t.displayFont);
  }
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="worn-denim">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-bg"></div>
        {children}
      </body>
    </html>
  );
}
