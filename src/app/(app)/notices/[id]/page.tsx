'use client';
import { useParams } from 'next/navigation';
import { NoticesModule } from '@/components/board';
import { useGo } from '@/lib/navigation';

export default function NoticeDetailPage() {
  const go = useGo();
  const params = useParams();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) ?? '';
  return <NoticesModule.NoticeDetailScreen go={go} id={id} />;
}
