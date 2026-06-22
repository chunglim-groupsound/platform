'use client';
// 화면 키 ↔ Next 라우트 매핑. 원본 SPA 의 go(screen, params) 호출을 그대로 살리기 위한 어댑터.
import { useRouter } from 'next/navigation';

type Params = { id?: string; kind?: string } | null | undefined;

export function screenToPath(screen: string, params?: Params): string {
  const p = params || {};
  switch (screen) {
    case 'home': return '/home';
    case 'timetable': return '/timetable';
    case 'members': return '/members';
    case 'my-profile': return '/profile';
    case 'profile-edit': return '/profile/edit';
    case 'teams': return '/teams';
    case 'notices': return '/notices';
    case 'notices-admin': return '/notices/admin';
    case 'notices-user': return '/notices/user';
    case 'notice-detail': return `/notices/${p.id ?? ''}`;
    case 'notice-create': return `/notices/new${p.kind ? `?kind=${encodeURIComponent(p.kind)}` : ''}`;
    case 'notice-edit': return `/notices/${p.id ?? ''}/edit`;
    case 'admin': return '/admin';
    case 'notifications': return '/notifications';
    case 'report': return '/report';
    default: return '/home';
  }
}

export function pathToScreen(pathname: string): string {
  if (pathname === '/home' || pathname === '') return 'home';
  if (pathname.startsWith('/timetable')) return 'timetable';
  if (pathname.startsWith('/members')) return 'members';
  if (pathname === '/profile/edit') return 'profile-edit';
  if (pathname.startsWith('/profile')) return 'my-profile';
  if (pathname.startsWith('/teams')) return 'teams';
  if (pathname === '/notices/admin') return 'notices-admin';
  if (pathname === '/notices/user') return 'notices-user';
  if (pathname.startsWith('/notices/new')) return 'notice-create';
  if (/^\/notices\/[^/]+\/edit/.test(pathname)) return 'notice-edit';
  if (/^\/notices\/[^/]+/.test(pathname)) return 'notice-detail';
  if (pathname.startsWith('/notices')) return 'notices';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/notifications')) return 'notifications';
  if (pathname.startsWith('/report')) return 'report';
  return 'home';
}

// 원본 컴포넌트가 받는 go(key, params) 시그니처를 그대로 제공.
export function useGo() {
  const router = useRouter();
  return (screen: string, params?: Params) => {
    router.push(screenToPath(screen, params));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}
