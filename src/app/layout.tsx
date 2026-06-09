import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-kr',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '청림그룹사운드',
  description: '청림그룹사운드 동아리 플랫폼',
  icons: {
    icon: '/icon.svg',
  },
}

const THEME_INIT = `(function(){
  var t = localStorage.getItem('theme') || 'worn-denim';
  document.documentElement.setAttribute('data-theme', t);
})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT }}
        />
        {children}
      </body>
    </html>
  )
}
