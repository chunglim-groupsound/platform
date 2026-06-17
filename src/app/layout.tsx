import type { Metadata } from 'next'
import { Anton, Space_Grotesk, Space_Mono, Noto_Sans_KR } from 'next/font/google'
import './globals.css'

const anton = Anton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-anton',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

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
  const fontVars = [
    anton.variable,
    spaceGrotesk.variable,
    spaceMono.variable,
    notoSansKR.variable,
  ].join(' ')

  return (
    <html lang="ko" className={`${fontVars} h-full`} suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: THEME_INIT }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  )
}
