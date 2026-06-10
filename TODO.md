# 청림그룹사운드 플랫폼 — TODO

> 최종 업데이트: 2026-06-10 (스타일 전체 완료 — 테마 시스템 + ThemeSwitcher + Tailwind 마이그레이션)

---

## 명세서

| 문서 | 위치 |
|------|------|
| ERD (DB 스키마 + 관계도) | `document/spec/ERD_명세서.md` |
| IA (라우트 + 컴포넌트 구조) | `document/spec/IA_명세서.md` |
| API 명세 | `document/spec/API_명세서_v2.md` |
| 리팩토링 체크리스트 | `document/refactoring/리팩토링_체크리스트.md` |

---

## 미완료 — 코드 변경 필요

### 버그 / 정책

- [x] **팀장도 팀 이름 변경 가능하게** — `PATCH /api/teams/[id]`의 `leaderFields`에 `name` 추가
- [x] **`member_role.TEAM_LEADER` 제거** — 팀장 여부는 `teams.leader_id`로 관리하므로 enum 값 불필요. DB 마이그레이션 + `database.ts` 재생성 + `constants.ts` `ROLE_LABELS` 정리 필요

### 기능 추가

- [x] **세션 연차** — 사용자별 각 세션(악기/파트)을 얼마나 했는지 연차 표시 (DB 설계부터 필요)
- [ ] **타임테이블** — `/timetable` 페이지 구현 (현재 빈 페이지)
- [ ] **공지사항** — `/notices` 페이지 구현 (현재 빈 페이지)
- [ ] **연습실 예약** — `GET /api/teams/[id]` 응답의 `reservations: []` 플레이스홀더 처리

### 스타일

- [x] **globals.css 테마 세팅** — Tailwind v4 `@theme inline`으로 토큰 등록, Worn Denim(기본) · Slate Stage 두 테마 정의 (`data-theme` 속성으로 전환)
- [x] **ThemeSwitcher 컴포넌트** — `src/components/layout/ThemeSwitcher.tsx`, 헤더 우측 컬러 스와치 UI, `localStorage` + `data-theme` 동기화, 새로고침 플래시 방지(`next/script beforeInteractive`)
- [x] **전체 디자인 적용** — 인라인 `style={{}}` → Tailwind 클래스로 전체 마이그레이션

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

## 개발자 직접 확인 필요 (리팩토링 체크리스트 섹션 11)

기능 정확성 검증 — 코드 읽고 흐름 손으로 추적 필요.

- [ ] `linked_auth_id` 플로우 — 기존 부원이 새 Kakao 계정으로 로그인할 때 `user.id` vs `users.id` 흐름 전체 추적
- [ ] 팀 활성화 플로우 — 수습 부원 팀 생성 → 활성화 신청 → 운영진 승인 경로 확인
- [ ] 경고 3회 자동 탈퇴 — DB 트리거 / Edge Function / API 레이어 중 어디서 처리하는지 확인
- [ ] `privacy_settings` 완전성 — `maskMember()`가 처리하는 필드와 `PrivacySettings.tsx`에서 설정 가능한 필드 일치 여부
- [ ] 면접 슬롯 `capacity` 초과 검증 — 배정 시 현재 인원 확인하는지
- [ ] CSV import `kakao_id` 중복 처리 — 이미 연동된 계정 import 시 동작
