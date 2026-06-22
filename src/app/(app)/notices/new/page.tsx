'use client';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { NoticesModule } from '@/components/board';
import { useGo } from '@/lib/navigation';

function NoticeCreateInner() {
  const go = useGo();
  const kind = useSearchParams().get('kind') || undefined;
  return <NoticesModule.NoticeCreateScreen go={go} kind={kind} />;
}

export default function NoticeCreatePage() {
  return (
    <Suspense fallback={null}>
      <NoticeCreateInner />
    </Suspense>
  );
}
