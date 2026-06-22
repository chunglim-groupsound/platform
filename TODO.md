# 청림그룹사운드 플랫폼 — TODO

> 최종 업데이트: 2026-06-10 (스타일 전체 완료 — 테마 시스템 + ThemeSwitcher + Tailwind 마이그레이션)

---

## 명세서

| 문서 | 위치 |
|------|------|
| ERD (DB 스키마 + 관계도) | `document/spec/ERD_명세서.md` |
| IA (라우트 + 컴포넌트 구조) | `document/spec/IA_명세서.md` |
| 기능 | `document/spec/기능_명세서.md` |
| API 명세 | `document/spec/API_명세서_v2.md` |

---

## 진행 사항

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

- [x] `proxy.ts` — 인증 체크 (mock: 쿠키/localStorage 토큰 확인)
- [x] `app/(app)/layout.tsx` — 인증된 사용자 레이아웃
- [x] `app/(public)/layout.tsx` — 비인증 레이아웃
- [x] `hooks/use-me.ts` — 현재 로그인 유저 훅 (mock ME 반환)
- [x] `hooks/use-role.ts` — 권한 체크 훅 (isAdmin, isSuperAdmin)

---

### 7. 최종 확인

- [ ] 전 페이지 mock 데이터로 렌더링 정상 확인
- [ ] 5개 테마 전환 동작 확인
- [ ] 모바일 반응형 확인 (헤더 → 하단 네비 전환)
- [ ] 어드민 권한 체크 — 일반 부원으로 `/admin` 접근 시 차단 확인
- [ ] `next dev` 실행 및 빌드 에러 없음 확인

---

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

---
