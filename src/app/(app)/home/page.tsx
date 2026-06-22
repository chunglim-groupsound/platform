'use client';
import { Home } from '@/components/home';
import { useGo } from '@/lib/navigation';

export default function HomePage() {
  const go = useGo();
  return <Home.HomeConsole go={go} />;
}
