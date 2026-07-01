# 청림그룹사운드 플랫폼 — TODO

> 최종 업데이트: 2026-07-02 (프론트엔드 mock 구현 완료 확인 + 백엔드/DB 개발용 명세서 재작성 + 체크리스트 추가)

---

## 명세서

> 2026-06-10 버전은 `refactor: 프론트 전면 작업`(클린슬레이트 재구축) 커밋에서 함께 삭제됨. 아래는 현재 mock 구현(`src/lib/mock-data.ts`, `src/components/*`) 실제 동작을 기준으로 2026-07-02 재작성한 버전.

| 문서 | 위치 |
|------|------|
| ERD (DB 스키마 + 관계도) | `document/spec/ERD_명세서.md` |
| IA (라우트 + 접근 제어 + 컴포넌트 구조) | `document/spec/IA_명세서.md` |
| 기능 명세 (화면별 규칙) | `document/spec/기능_명세서.md` |
| API 명세 | `document/spec/API_명세서.md` |

---

## 진행 사항

- 2026-07-02: 프론트엔드는 admin 포함 mock 데이터 기반으로 거의 완성된 상태 확인. 백엔드/DB가 전혀 없는 상태(API 라우트 0개, 인증 가드 미구현)임을 확인하고 명세서 4종 재작성 + 백엔드 개발 체크리스트 작성.

---

## 프론트엔드 작업 체크리스트

> 전략: mock 데이터로 프론트 완성 → API 명세 작성 → 백엔드 연동 순서로 진행  
> 설계 레퍼런스: `redesign/` 폴더 (12개 모듈, HTML 프로토타입)

### 0. 프로젝트 초기 설정

- [x] `src/app/layout.tsx` — Google Fonts (Anton, Space Grotesk, Space Mono, Noto Sans KR) 로드
- [x] `src/app/globals.css` — 5개 테마 CSS 토큰 (`worn-denim`, `slate-stage`, `crimson-amp`, `velvet-night`, `neon-moss`) + accent override
- [x] `data-theme` 속성 기반 테마 전환 로직 (localStorage 연동)
- [x] Tailwind CSS 커스텀 토큰 연동 (`globals.css` `@theme inline` — Tailwind v4 방식)
- [x] 폴더 구조 잡기: `components/`, `lib/mock/`, `hooks/`, `types/`

---

### 1. Mock 데이터 레이어

> 레퍼런스: `redesign/modules/01-mock-data.jsx`

- [x] `lib/mock/data.ts` — MEMBERS(48명), TEAMS(9팀), BOOKINGS, NOTICES, NOTICE_COMMENTS, ME, STATS 등 TypeScript로 변환
- [x] `lib/mock/stores.ts` — `TeamStore`, `RoleStore` (React Context 또는 Zustand)
- [x] `lib/mock/tt-shared.ts` — `TTShared` 운영기간·예약 오픈 공용 로직
- [x] `types/index.ts` — Member, Team, Notice, Booking 등 공통 타입 정의

---

### 2. 공통 컴포넌트

> 레퍼런스: `redesign/modules/02-icons.jsx`, `03-shared-ui.jsx`

- [x] `components/icons.tsx` — SVG 아이콘 컴포넌트 (guitar, bell, chevron, check, trash, plus, calendar, lock, flag, logout, person 등)
- [x] `components/ui/avatar.tsx` — Avatar, RecruitBadge, Badge, StatusDot
- [x] `components/ui/button.tsx` — btn, btn-primary 스타일
- [x] `components/layout/header.tsx` — 로고, 네비, 프로필 드롭다운, 테마 변경, BellMenu
- [x] `components/layout/bottom-nav.tsx` — 모바일 하단 네비게이션
- [x] `components/layout/app-layout.tsx` — 인증된 사용자 레이아웃 (Header + 콘텐츠 영역)

---

### 3. 인증 / 온보딩 페이지 (public)

> 레퍼런스: `redesign/랜딩 페이지.html`, `redesign/가입 *.html`

- [x] `app/(public)/page.tsx` — 랜딩 페이지 (히어로, 모집글 블록, 팀·공연 통계)
- [x] `app/(public)/join/page.tsx` — 가입 방식 선택
- [x] `app/(public)/join/existing/page.tsx` — 기존 부원 인증
- [x] `app/(public)/join/new/page.tsx` — 신규 부원 지원서
- [x] `app/(public)/login/page.tsx` — 로그인 (카카오 버튼, mock 처리)

---

### 4. 메인 앱 페이지 (인증 필요)

> 레퍼런스: `redesign/modules/07-home.jsx` ~ `11-member-admin.jsx`

- [x] `app/(app)/home/page.tsx` — 홈 (내 팀 카드, 최근 합주 일정, 공지 요약, 알림 뱃지)
- [x] `app/(app)/timetable/page.tsx` — 타임테이블 (주간 그리드, 예약 블록, 라이브 시간 표시, 예약 오픈 배너)
- [x] `app/(app)/members/page.tsx` — 부원 목록 (세션·기수 필터, 검색, 페이지네이션)
- [x] `app/(app)/members/[id]/page.tsx` — 부원 프로필 상세
- [x] `app/(app)/teams/page.tsx` — 팀 목록 (활성/비활성 탭, 모집 중 표시)
- [x] `app/(app)/teams/[id]/page.tsx` — 팀 상세 (합주곡, 세션 구성, 멤버, 활성화 신청)
- [x] `app/(app)/notices/page.tsx` — 공지 목록 (운영진/부원 탭, 태그 필터, 핀고정)
- [x] `app/(app)/notices/[id]/page.tsx` — 공지 상세 (본문, 댓글)
- [x] `app/(app)/notices/write/page.tsx` — 공지 작성
- [x] `app/(app)/my-profile/page.tsx` — 내 프로필 편집
- [x] `app/(app)/report/page.tsx` — 신고·제보
- [x] `app/(app)/notifications/page.tsx` — 알림 목록

---

### 5. 운영진 페이지 (ADMIN 권한)

> 레퍼런스: `redesign/modules/11-member-admin.jsx`, `12-app-root.jsx` (운영 탭 부분)

- [x] `app/(app)/admin/layout.tsx` — 운영 페이지 레이아웃 + 탭 네비
- [x] `app/(app)/admin/recruit/page.tsx` — 모집 관리 (모집 ON/OFF, 모집글 편집, 랜딩 미리보기)
- [x] `app/(app)/admin/interview/page.tsx` — 면접 시간대 관리
- [x] `app/(app)/admin/applicants/page.tsx` — 지원자 관리 (상태 필터, 면접 슬롯 배정, 합·불합격, 통지)
- [x] `app/(app)/admin/teams/page.tsx` — 팀 활성화 관리
- [x] `app/(app)/admin/timetable/page.tsx` — 타임테이블 설정 (운영기간, 합주실 운영시간, 이벤트)
- [x] `app/(app)/admin/members/page.tsx` — 부원 관리 (등급 변경, 직책 부여, 경고 발급, 제명)

---

### 6. 라우팅 & 인증 가드

> ⚠️ 2026-07-02 재확인: 아래 `proxy.ts`/`use-me.ts`/`use-role.ts` 항목은 실제로는 **파일 자체가 존재하지 않음**(과거 체크 표기 오류). `hooks/`에는 `useTheme.ts`만 존재하고, `middleware.ts`/`proxy.ts`는 프로젝트에 없음. `members-teams-profile.tsx`의 `useRole()`은 동명이나 `RoleStore` 구독용 로컬 훅일 뿐 실제 인증 가드가 아님. `/admin/*` 포함 전 라우트가 현재 인증/권한 체크 없이 접근 가능한 상태 — 백엔드 개발 체크리스트(하단) 3절에서 신규 구현 예정.

- [ ] `middleware.ts` — 인증 체크 (실제 Supabase 세션 쿠키 확인, IA 명세서 접근 제어 매트릭스 구현)
- [x] `app/(app)/layout.tsx` — 인증된 사용자 레이아웃 (레이아웃 셸만, 가드 로직은 없음)
- [x] `app/(public)/layout.tsx` — 비인증 레이아웃
- [ ] `hooks/use-me.ts` — 현재 로그인 유저 훅 (실 세션 기반, 신규 구현 필요)
- [ ] `hooks/use-role.ts` — 권한 체크 훅 (isAdmin, isSuperAdmin, 신규 구현 필요)

---

### 7. 최종 확인

- [x] 전 페이지 mock 데이터로 렌더링 정상 확인
- [x] 5개 테마 전환 동작 확인
- [x] 모바일 반응형 확인 (헤더 → 하단 네비 전환)
- [ ] 어드민 권한 체크 — 일반 부원으로 `/admin` 접근 시 차단 확인
- [x] `next dev` 실행 및 빌드 에러 없음 확인

---

## 백엔드/DB 개발 체크리스트 (MVP)

> 명세서 4종(ERD/IA/기능/API) 기준. 프론트는 mock으로 완성되어 있으므로 이 섹션은 실제 Supabase 스키마 + API 라우트 + 인증 가드 구현이 목표.

### 0. 사전 확인

- [ ] `supabase db pull`로 원격 프로젝트(`chunglim-platform`, ref `hlaqxryujkfgoweuralg`) 기존 스키마 확인 — `audit_logs` 등 과거 백엔드 구현 당시 테이블이 남아있는지 대조 (TODO.md 하단 "관측성" 항목 참고)
- [ ] Kakao OAuth 앱 설정 확인 (redirect URI, 요청 scope, `.env.local`의 `KAKAO_CLIENT_ID/SECRET` 유효성)
- [ ] Supabase 프로젝트 로컬 개발 환경 세팅 (`supabase start`, 마이그레이션 워크플로 확정)

### 1. DB 스키마 (Supabase migrations) — `ERD_명세서.md` 기준

- [ ] enum 타입 전체 생성 (`member_status`, `member_role`, `officer_title`, `team_role`, `request_status`, `invite_status`, `application_status`, `notice_kind`, `report_category`, `report_status`, `notification_type`, `term_type`, `booking_kind`, `event_kind`)
- [ ] `users` 테이블 + 인덱스(`kakao_id` unique, `admin_role` partial unique, `team_id`/`status`/`gen` 인덱스)
- [ ] `teams`, `team_activation_requests`, `team_join_requests`, `team_invitations`
- [ ] `member_warnings`, `officer_history`, `generation_leaders`
- [ ] `applications`, `interview_slots`, `application_slot_preferences`, `recruitment_settings`
- [ ] `notices`, `notice_images`, `notice_comments`, `notice_replies`, `notice_reads`, `references_info`
- [ ] `reports`
- [ ] `notifications`
- [ ] `terms`, `room_hours_config`, `calendar_events`, `booking_templates`, `bookings`
- [ ] `audit_logs` (0절에서 확인한 기존 원격 테이블과 대조 후 조정)
- [ ] seed 스크립트 — `mock-data.ts`의 48명 부원/9팀/공지/예약 데이터를 초기 seed로 변환 (데모/QA용)

### 2. RLS 정책 — `ERD_명세서.md` 6절 기준

- [ ] `users` RLS (본인 전체 필드 / `PROBATION` 이상 부원은 마스킹 전제로 열람, 쓰기는 본인 일부 필드 + 운영진)
- [ ] `teams`/`team_activation_requests`/`team_join_requests`/`team_invitations` RLS
- [ ] `notices`/`notice_comments`/`notice_replies`/`notice_reads` RLS
- [ ] `reports` RLS (익명 마스킹은 API 레벨에서 처리, RLS는 본인/운영진 기준만)
- [ ] `notifications` RLS (`recipient_id = auth.uid()` 매칭 기준 본인만)
- [ ] `applications`/`interview_slots` RLS
- [ ] `bookings`/`booking_templates` RLS
- [ ] `audit_logs` RLS (운영진 읽기 전용, 쓰기는 서비스 레이어/트리거만)

### 3. 인증 & 권한 가드 (현재 전무 — 최우선)

- [ ] Kakao OAuth 콜백 Route Handler (`POST /api/auth/kakao/callback`)
- [ ] `middleware.ts` — 세션 확인 + `IA_명세서.md` 2절 접근 제어 매트릭스 구현
- [ ] `lib/auth/session.ts` — `getCurrentSession()`
- [ ] `lib/constants.ts` — `isAdminRole()`, `hasActiveMemberAccess()`, `canManageTeam()` 등
- [ ] `hooks/use-me.ts`, `hooks/use-role.ts` 신규 구현 (기존 체크 표기는 오류였음 — 실제 파일 없음, 6절 참고)
- [ ] `/admin/*` 서버 사이드 권한 가드 — 7절 "어드민 권한 체크" 항목과 동일 이슈, 여기서 실제로 해결
- [ ] `board.tsx`/`report.tsx`/`members-teams-profile.tsx`의 `ViewerSwitch`류 클라이언트 권한 시뮬레이터 전량 제거 → 실제 세션 role/status로 교체

### 4. API 라우트 구현 — `API_명세서.md` 기준

- [ ] 인증 (세션 조회 / Kakao 콜백 / 기존 부원 검색·연동)
- [ ] 지원(applications) + 면접 슬롯 공개 조회
- [ ] 부원 (목록/상세/내 프로필/초대함/가입신청함)
- [ ] 팀 (목록/상세/생성/수정/삭제/가입신청/초대/탈퇴/강퇴/활성화신청)
- [ ] 타임테이블 (terms/hours/events/bookings 조회+예약 생성·수정·삭제)
- [ ] 공지 (notices/comments/replies/reads/references)
- [ ] 신고 (reports)
- [ ] 알림 (notifications)
- [ ] 운영진 연혁 (officers/history, generation-leaders)
- [ ] 관리자 — 모집/면접 슬롯/지원자 관리
- [ ] 관리자 — 부원 관리(상태/경고/화이트리스트/직책) + CSV 일괄 등록
- [ ] 관리자 — 팀 활성화 승인/거절
- [ ] 관리자 — 타임테이블 설정(학기/운영시간/행사)

### 5. 프론트엔드 연동 (mock → 실 API 전환)

- [ ] `lib/services/index.ts` 각 함수 본문을 `client.ts`의 `api.*` 호출로 교체 (이미 주석으로 표시된 엔드포인트들)
- [ ] `mock-data.ts` 의존 컴포넌트 점진 전환: `board.tsx`, `member-admin.tsx`, `members-teams-profile.tsx`, `timetable.tsx`, `report.tsx`, `notifications.tsx`, `officers.tsx`, `app-internals.tsx`
- [ ] 클라이언트 전용 상태(`TeamStore`/`RoleStore`/`HistoryStore`/`TTShared`)를 서버 데이터 fetch(react-query 등)로 교체
- [ ] localStorage 기반 mock 영속 로직 제거 (`CHUNGLIM_recruit_v1`, `CHUNGLIM_interview_v1`, `CHUNGLIM_applicants_v2`, `CHUNGLIM_tt_terms_v1`, `CHUNGLIM_tt_events_v1`, `CHUNGLIM_tt_hours_v1`, `CHUNGLIM_my_application_v1` 등)
- [ ] `notifications`, `reports` 전용 서비스 모듈 신설 — mock 상태에서는 이 둘만 `services/index.ts`에 스텁조차 없었음(자체 in-memory store로 관리 중)

### 6. QA

- [ ] 시드 데이터 기반 E2E 스모크 테스트 (지원 → 면접 배정 → 합격 → 회원 전환 → 로그인 플로우)
- [ ] 권한 매트릭스 회귀 테스트 (비로그인/PROBATION/ACTIVE/ADMIN 별 라우트 접근 — `IA_명세서.md` 2절 기준)
- [ ] 팀 활성화·타임테이블 겹침 방지 등 동시성 케이스 테스트

---

## 엑셀 데이터

- [ ] 기존 코드를 엑셀 데이터를 최대한 살릴 수 있는 형태도 변형

## TypeScript 에러 수정 (총 1,118개 → 0개 목표)

> `npx tsc --noEmit` 기준. 파일별로 하나씩 수정 후 체크.

- [x] `src/app/(app)/admin/[section]/page.tsx` — 1개 (컴포넌트 반환 타입 `null` 불가)
- [x] `src/app/(app)/members/page.tsx` — 1개 (`autoOpenSelf` prop 누락)
- [x] `src/components/notifications.tsx` — 17개 (암시적 `any`)
- [x] `src/components/report.tsx` — 38개 (암시적 `any`)
- [x] `src/components/icons.tsx` — 43개 (암시적 `any`)
- [x] `src/lib/mock-data.ts` — 73개 (암시적 `any` + 누락 속성)
- [x] `src/components/timetable.tsx` — 115개 (암시적 `any`)
- [x] `src/components/app-internals.tsx` — 190개 (암시적 `any` + `D.ME` undefined + `boxSizing` 타입)
- [x] `src/components/members-teams-profile.tsx` — 195개 (암시적 `any`)
- [x] `src/components/member-admin.tsx` — 201개 (암시적 `any`)
- [x] `src/components/board.tsx` — 244개 (암시적 `any`)

---

## MVP 이후 — 엔터프라이즈 아키텍처 전환

> MVP 완료 후 진행. 기능 완성 전에는 손대지 않는다.

### 유효성 검사 레이어

- [ ] **zod 도입** — API route 입력값 검증을 수동 if 분기 → zod 스키마로 전환
- [ ] **공통 에러 응답 타입** — zod 파싱 실패 → 일관된 400 응답 포맷으로 통일

### DTO 레이어 공식화

- [ ] **`*.dto.ts` 파일 분리** — 현재 `*Row` / `*Item` / `*Data` 네이밍 관습을 공식 DTO 파일로 분리
- [ ] **변환 함수 명시화** — DB Row → DTO 변환 로직을 `lib/*/mapper.ts` 형태로 정리

### 서비스 레이어

- [ ] **클래스 기반 Service 도입 검토** — 현재 `lib/**` 함수들을 도메인별 Service 클래스로 묶기 (`MemberService`, `TeamService` 등)
- [ ] **Repository 패턴 분리** — Supabase 쿼리를 `lib/*/repository.ts`로 격리해 비즈니스 로직과 분리

### 보안 / 권한

- [ ] **Supabase RLS 정책 강화** — 현재 API 레이어에서 하는 권한 체크 일부를 DB 레벨(RLS)로 내리기
- [ ] **API 미들웨어 통합** — 반복되는 세션 체크 / 권한 검증 로직을 `middleware.ts` 또는 공통 wrapper로 통합

### 관측성

- [ ] **구조화 로깅** — 관리자 액션 로그를 `audit_logs` 테이블에 기록 (테이블은 이미 존재)
- [ ] **에러 모니터링** — Sentry 등 연동

### 퍼포먼스

- [ ] **속도 개선** — 개발자도구 Performance 탭을 활용하여 CPU 및 네트워크 속도를 조절한 속도 개선

---
