'use client';
import { useRouter } from 'next/navigation';
import { ReportModule } from '@/components/report';

export default function ReportHistoryPage() {
  const router = useRouter();
  return (
    <div className="screen-in" style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <ReportModule.ReportPageHeader />
      <ReportModule.ReportTabNav />
      <ReportModule.MyReports onNew={() => router.push('/report/new')} />
    </div>
  );
}
