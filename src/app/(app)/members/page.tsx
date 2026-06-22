'use client';
import { Screens } from '@/components/members-teams-profile';
import { useGo } from '@/lib/navigation';

export default function MembersPage() {
  const go = useGo();
  return <Screens.MembersScreen go={go} autoOpenSelf={false} />;
}
