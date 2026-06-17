import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { AppMain } from '@/components/layout/AppMain'

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AppMain>{children}</AppMain>
      <BottomNav />
    </div>
  )
}
