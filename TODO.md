# 청림그룹사운드 플랫폼 — TODO

> 최종 업데이트: 2026-06-10

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

- [ ] **팀장도 팀 이름 변경 가능하게** — `PATCH /api/teams/[id]`의 `leaderFields`에 `name` 추가
- [ ] **`member_role.TEAM_LEADER` 제거** — 팀장 여부는 `teams.leader_id`로 관리하므로 enum 값 불필요. DB 마이그레이션 + `database.ts` 재생성 + `constants.ts` `ROLE_LABELS` 정리 필요

### 기능 추가

- [ ] **세션 연차** — 사용자별 각 세션(악기/파트)을 얼마나 했는지 연차 표시 (DB 설계부터 필요)
- [ ] **타임테이블** — `/timetable` 페이지 구현 (현재 빈 페이지)
- [ ] **공지사항** — `/notices` 페이지 구현 (현재 빈 페이지)
- [ ] **연습실 예약** — `GET /api/teams/[id]` 응답의 `reservations: []` 플레이스홀더 처리

### 스타일

- [ ] **globals.css 테마 세팅** — `@theme` 블록으로 CSS 변수 → Tailwind 토큰 등록, 테마별(`default` / `dark` 등) 색상 정의
- [ ] **ThemeSwitcher 컴포넌트** — `<html data-theme>` 토글 + localStorage 저장
- [ ] **전체 디자인 적용** — 인라인 `style={{}}` → Tailwind 클래스로 전체 마이그레이션

---

## 개발자 직접 확인 필요 (리팩토링 체크리스트 섹션 11)

기능 정확성 검증 — 코드 읽고 흐름 손으로 추적 필요.

- [ ] `linked_auth_id` 플로우 — 기존 부원이 새 Kakao 계정으로 로그인할 때 `user.id` vs `users.id` 흐름 전체 추적
- [ ] 팀 활성화 플로우 — 수습 부원 팀 생성 → 활성화 신청 → 운영진 승인 경로 확인
- [ ] 경고 3회 자동 탈퇴 — DB 트리거 / Edge Function / API 레이어 중 어디서 처리하는지 확인
- [ ] `privacy_settings` 완전성 — `maskMember()`가 처리하는 필드와 `PrivacySettings.tsx`에서 설정 가능한 필드 일치 여부
- [ ] 면접 슬롯 `capacity` 초과 검증 — 배정 시 현재 인원 확인하는지
- [ ] CSV import `kakao_id` 중복 처리 — 이미 연동된 계정 import 시 동작
