// ─────────────────────────────────────────────────────────────────────────────
// 서비스 레이어 — 화면과 데이터 소스 사이의 경계.
//
// 지금은 목 데이터(@/lib/mock-data)를 그대로 반환한다. 실제 백엔드가 준비되면
// 각 함수 본문을 client.ts 의 `api.*` 호출로 바꾸기만 하면 화면 코드는 손대지 않아도 된다.
//   예)  async listMembers() { return api.get<Member[]>('/members'); }
//
// 함수 시그니처를 async 로 둔 이유: 추후 네트워크 호출로 교체해도 호출부가 그대로 동작하도록.
// (현재 화면들은 DATA 를 직접 동기 참조하므로, 점진적 마이그레이션 시 이 레이어를 경유시키면 된다.)
// ─────────────────────────────────────────────────────────────────────────────

import { DATA, RoleStore, TeamStore, TTShared } from '@/lib/mock-data';
// import { api } from '@/lib/services/client';  // 실제 연동 시 활성화

/* 부원 ───────────────────────────────────────────────── */
export const membersService = {
  async list() { return DATA.MEMBERS; },               // TODO: api.get('/members')
  async get(id: string) { return DATA.MEMBERS.find((m: any) => m.id === id) ?? null; },
  async me() { return DATA.ME; },                      // TODO: api.get('/me')
};

/* 팀 ─────────────────────────────────────────────────── */
export const teamsService = {
  async list() { return DATA.TEAMS; },                 // TODO: api.get('/teams')
  async get(id: string) { return DATA.TEAMS.find((t: any) => t.id === id) ?? null; },
  store: TeamStore,                                    // 활성화 신청/승인 (현재 in-memory 스토어)
};

/* 공지 ───────────────────────────────────────────────── */
export const noticesService = {
  async list() { return DATA.NOTICES; },               // TODO: api.get('/notices')
  async get(id: string) { return DATA.NOTICES.find((n: any) => n.id === id) ?? null; },
  async comments(noticeId: string) { return (DATA.NOTICE_COMMENTS as any)[noticeId] ?? []; },
};

/* 합주실 타임테이블 ────────────────────────────────────── */
export const timetableService = {
  async bookings() { return DATA.BOOKINGS; },          // TODO: api.get('/bookings')
  async events() { return DATA.ROOM_EVENTS; },
  shared: TTShared,                                    // 학기/방학 기간 · 예약 오픈 규칙
};

/* 운영진 직책 ──────────────────────────────────────────── */
export const rolesService = {
  store: RoleStore,
  label: (m: any) => RoleStore.label(m),
};

/* 모집 설정(랜딩 페이지 연동) ──────────────────────────── */
const RECRUIT_KEY = 'CHUNGLIM_recruit_v1';
export const recruitService = {
  async get() {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(RECRUIT_KEY) : null;
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  },
  async save(data: unknown) {                          // TODO: api.put('/recruit', data)
    try { localStorage.setItem(RECRUIT_KEY, JSON.stringify(data)); } catch (e) {}
  },
};
