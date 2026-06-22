'use client';
import { NoticesModule } from '@/components/board';
import { useGo } from '@/lib/navigation';

export default function NoticesAdminPage() {
  const go = useGo();
  return <NoticesModule.NoticesScreen go={go} initialTab="admin" />;
}
