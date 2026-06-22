'use client';
import { Screens } from '@/components/members-teams-profile';
import { useGo } from '@/lib/navigation';

export default function ProfilePage() {
  const go = useGo();
  return <Screens.MembersScreen go={go} autoOpenSelf={true} />;
}
