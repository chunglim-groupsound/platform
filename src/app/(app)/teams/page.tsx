'use client';
import { Screens } from '@/components/members-teams-profile';
import { useGo } from '@/lib/navigation';

export default function TeamsPage() {
  const go = useGo();
  return <Screens.TeamsScreen go={go} />;
}
