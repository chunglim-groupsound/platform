'use client';
import { Screens } from '@/components/members-teams-profile';
import { useGo } from '@/lib/navigation';

export default function ProfileEditPage() {
  const go = useGo();
  return <Screens.ProfileEditScreen go={go} />;
}
