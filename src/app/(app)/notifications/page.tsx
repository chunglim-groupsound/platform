'use client';
import { Notifications } from '@/components/notifications';
import { useGo } from '@/lib/navigation';

export default function NotificationsPage() {
  const go = useGo();
  return <Notifications.NotificationsScreen go={go} />;
}
