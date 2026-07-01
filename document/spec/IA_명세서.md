# IA 명세서 (Information Architecture) — 청림그룹사운드 플랫폼

> 버전: v1 (2026-07-02) — 현재 `platform/src/app/**` 실제 라우트 + mock 컴포넌트 기준
> [ERD_명세서.md](./ERD_명세서.md) 와 세트로 사용

---

## ⚠️ 선행 확인 사항 — TODO.md 체크리스트 오류

`platform/TODO.md`의 "6. 라우팅 & 인증 가드" 섹션은 `proxy.ts`, `hooks/use-me.ts`, `hooks/use-role.ts`를 완료([x])로 표시하고 있으나, **실제 코드베이스에는 이 파일들이 존재하지 않는다** (`middleware.ts`/`proxy.ts` 없음, `hooks/`에는 `useTheme.ts`만 존재). `members-teams-profile.tsx`의 `useRole()`은 동명이나 `RoleStore` 구독용 로컬 리렌더 훅일 뿐 실제 인증/권한 가드가 아니다. 즉 **인증 가드는 아직 전혀 구현되어 있지 않다** — `/admin/*`을 포함한 모든 라우트가 로그인 여부와 무관하게 접근 가능한 상태(TODO.md 7절의 "어드민 권한 체크 — 미구현" 항목과 일치). 이 문서의 접근 제어 매트릭스(4절)는 **구현해야 할 목표 사양**이며 현재 동작을 서술한 것이 아니다.

---

## 1. 전체 라우트 구조

```
/                                   공개 — 랜딩 페이지 (Kakao 로그인 진입점)
/login                              공개 — 로그인
│
(public) 레이아웃 ──────────────────
├── /join                           공개(카카오 로그인 직후) — 가입 방식 선택
├── /join/existing                  기존 부원 인증 (로스터 매칭 → 프로필 보완)
└── /join/new                       신규 지원자 지원서 작성 + 상태 추적
│
(app) 레이아웃 ─────────────────────── 인증 필요 (실제 가드는 미구현, 목표 사양)
├── /home                           대시보드
├── /timetable                      합주실 예약 타임테이블
├── /members                        부원 목록
│   └── /members/[id]               부원 프로필 상세 (현재는 members-teams-profile 내 모달, 상세 페이지 라우트 승격 필요)
├── /teams                          팀 목록 (+ 팀 상세/생성/수정은 현재 페이지 내 상태 전환으로 구현 — 라우트 승격 검토)
├── /notices                        → /notices/admin 리다이렉트
│   ├── /notices/admin              운영진 공지 목록
│   ├── /notices/user               부원 공지 목록
│   ├── /notices/new?kind=          공지 작성
│   ├── /notices/[id]                공지 상세
│   └── /notices/[id]/edit           공지 수정
├── /notifications                  알림 목록
├── /profile                        내 프로필
│   └── /profile/edit               내 프로필 수정
├── /report                         신고 관리 큐 (운영진 전용 — 비운영진 접근 시 /report/new로 리다이렉트)
│   ├── /report/new                 신고하기 (부원)
│   └── /report/history             내 신고 내역 (부원)
│
└── /admin ─────────────────────────── 운영진(ADMIN/SUPER_ADMIN) 전용 (권한 가드 목표 사양 — 현재 미구현)
    ├── /admin                       → /admin/recruit 리다이렉트
    └── /admin/[section]             동적 라우트, 유효하지 않은 section은 404
        ├── recruit                  모집 설정 (지원 그룹)
        ├── interview                면접 슬롯 관리 (지원 그룹)
        ├── applicants               지원자 관리 (지원 그룹)
        ├── teams                    팀 활성화 관리 (팀 그룹)
        ├── timetable                타임테이블 설정 — 학기/방학, 운영시간, 행사 (타임테이블 그룹)
        ├── members                  부원 관리 — 상태/경고/화이트리스트/직책 (부원 그룹)
        ├── migrate                  CSV 부원 일괄 등록 (부원 그룹)
        ├── notices                  공지 관리(관리자용 인라인 콘솔) (게시판 그룹)
        ├── reports                  신고 관리(관리자용 인라인 콘솔) (신고 제보 그룹)
        ├── president                역대 회장 (연혁 그룹)
        ├── vice                     역대 부회장 (연혁 그룹)
        ├── treasurer                역대 총무 (연혁 그룹)
        └── genleader                기수별 기장 (연혁 그룹)
```

> 참고: `/api/*` Route Handler는 현재 **전무** — 모든 화면이 `src/lib/mock-data.ts`를 직접 참조하거나 `src/lib/services/index.ts`의 async 래퍼(현재는 mock 반환)를 통해 데이터를 얻는다. API 명세서(API_명세서.md)는 이 서비스 레이어가 실제로 호출해야 할 엔드포인트를 정의한다.

---

## 2. 접근 제어 매트릭스 (목표 사양)

| 경로 | 비로그인 | `PROBATION` | `ACTIVE`/`INACTIVE` | `WITHDRAWN` | `ADMIN`/`SUPER_ADMIN` |
|---|---|---|---|---|---|
| `/`, `/login` | ✅ | ✅(→`/home`로 리다이렉트 권장) | ✅(→`/home`) | ✅ | ✅(→`/home`) |
| `/join`, `/join/existing`, `/join/new` | ❌→`/` | ❌→`/home` | ❌→`/home` | ✅ (재가입 신청 허용 시) | ❌→`/home` |
| `/home`, `/timetable`, `/notices/*`, `/notifications`, `/profile*` | ❌→`/` | ✅ | ✅ | ❌→`/` | ✅ |
| `/members*`, `/teams*` | ❌→`/` | ✅ (읽기 전용, 4절 팀 권한표 참고) | ✅ | ❌→`/` | ✅ |
| `/report/new`, `/report/history` | ❌→`/` | ✅ | ✅ | ❌→`/` | ✅ |
| `/report` (관리 큐) | ❌→`/` | ❌→`/report/new` | ❌→`/report/new` | ❌→`/` | ✅ |
| `/admin/*` | ❌→`/` | ❌→`/home` | ❌→`/home` | ❌→`/` | ✅ |

> 지원자 전용 화면(`/join/new`의 지원 상태 추적)은 `applications` 레코드 존재 여부로 별도 판별 — `users` 테이블 상태와 무관.

---

## 3. 회원/지원 상태 흐름도

### 3.1 가입 지원 (Applications)

```
[카카오 로그인] → /join
    ├── 기존 부원(로스터 매칭) → /join/existing → 프로필 보완 제출 → users.auth_user_id 연결, status 그대로 유지
    └── 신규 지원자 → /join/new → applications 레코드 생성 (status: new)
                                        │
                                운영진: 면접 슬롯 배정
                                        ▼
                                  status: interview ── 슬롯 취소(cancelInterview) ──→ status: new
                                        │
                                운영진: 합·불 결정(decide)
                              ┌─────────┴─────────┐
                              ▼                   ▼
                        status: pass         status: fail
                              │                   │
                        users INSERT          (종료, 재지원 시 새 applications 레코드)
                        (status: PROBATION)
```
- `pass`/`fail` 판정도 `revertDecision()`으로 되돌릴 수 있음(운영진 실수 정정용) — 단, `pass` 확정 후 이미 `users` 레코드가 생성되었다면 되돌리기는 `users` 레코드 처리(비활성화 등)를 함께 고려해야 함(기능 명세서에 규칙 명시).
- `notify`/`unnotify`는 상태와 독립적인 "통지 완료 여부" 플래그 — 실제 알림 발송(FCM, PWA 완료 후 연동 예정)과 연결될 지점.

### 3.2 회원 상태 (`users.status`)

```
PROBATION ──── 활동 정지(경고 누적/운영진 판단) ──→ INACTIVE
    │                                                  │
    │ 정회원 전환(운영진 승인)                          │ 재승인
    ▼                                                  ▼
 ACTIVE ◀─────────────────────────────────────────────┘
    │
    │ 제명/자진 탈퇴
    ▼
WITHDRAWN (종료 상태)
```
- `SUPER_ADMIN` 및 `me`(본인 세션 사용자, 즉 자기 자신에 대한 상태 변경) 는 상태 변경 대상에서 제외(`MAStore` 가드 규칙 그대로 서버에도 적용 필요).
- 경고 3회 누적 시 UI가 "제적 기준"을 안내하나, **자동 전이는 하지 않음** — 운영진의 명시적 액션 필요(수동 게이트, mock 동작 유지).

### 3.3 팀 활성화 (`team_activation_requests`)

```
teams.is_active = false
    │ 팀장: 활성화 신청(submit)
    ▼
request.status = pending  ──── 팀장: 취소(cancel) ───→ (요청 삭제, is_active 그대로 false)
    │
    │ 운영진: 승인(approve) / 거절(reject)
    ├── approve → teams.is_active = true,  request.status = approved
    └── reject  → teams.is_active 그대로,  request.status = rejected
```
- 운영진은 신청 없이도 `setActive`로 직접 활성/비활성 토글 가능(승인 절차 생략) — 이 경우 대기 중이던 신청은 자동 취소.

### 3.4 신고 처리 (`reports.status`)

```
received → reviewing → resolved
              │
              └──────→ rejected   (별도 종결 분기, 진행바에는 표시 안 함)
```
- `resolved`/`rejected` 전이 시에만 답변(`reply`) 첨부 UI가 노출되나, 답변 자체는 선택 사항.

---

## 4. 팀 내 권한 매트릭스

| 작업 | 일반 부원(비소속) | 팀원 | 부팀장 | 팀장 | 운영진 |
|---|---|---|---|---|---|
| 팀 목록/상세 조회 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 팀 가입 신청 (모집중 팀에) | ✅ | — | — | — | — |
| 팀원 초대 | ❌ | ❌ | ✅ | ✅ | ✅ |
| 연습곡/소개/모집상태 수정 | ❌ | ❌ | ✅ | ✅ | ✅ |
| 팀원 강퇴 | ❌ | ❌ | ✅ | ✅ | ✅ |
| 부팀장 지정 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 팀명/색상(hue) 변경 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 활성화 신청/취소 | ❌ | ❌ | ❌ | ✅ | — |
| 활성화 승인/거절 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 팀 삭제 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 합주실 정기/단발 예약 생성·수정 | ❌ | ❌(조회만) | ✅(자기 팀만) | ✅(자기 팀만) | ✅(전체 팀) |

---

## 5. 화면 ↔ 컴포넌트 매핑 (현재 코드 기준)

```
src/app/
├── layout.tsx                              루트 — 폰트, 테마 토큰
├── page.tsx                                랜딩 (components/public 참고)
├── login/page.tsx
│
├── (public)/layout.tsx
│   ├── join/page.tsx                        가입 방식 선택
│   ├── join/existing/page.tsx               기존 부원 인증 + 프로필 보완
│   └── join/new/page.tsx                    지원서 작성 + StatusView(상태 추적)
│
└── (app)/layout.tsx                         AppShell(Header/BottomNav) — components/app-shell.tsx
    ├── home/page.tsx                         → components/home.tsx (HomeConsole)
    ├── timetable/page.tsx                    → components/timetable.tsx (TimetableScreen)
    ├── members/page.tsx                      → components/members-teams-profile.tsx (MembersScreen, MemberDetail)
    ├── teams/page.tsx                        → components/members-teams-profile.tsx (TeamsScreen, TeamDetail, TeamEdit, TeamCreate)
    ├── notices/{admin,user}/page.tsx         → components/board.tsx (NoticesScreen)
    ├── notices/new/page.tsx, [id]/(edit)     → components/board.tsx (NoticeForm, NoticeDetail)
    ├── notifications/page.tsx                → components/notifications.tsx
    ├── profile/{page,edit/page}.tsx          → components/members-teams-profile.tsx (ProfileEditScreen 등)
    ├── report/{page,new,history}/page.tsx    → components/report.tsx (ReportScreen, ReportForm, ReportHistory)
    │
    └── admin/
        ├── layout.tsx                        탭 그룹 네비게이션(GROUPS)
        ├── page.tsx                           → /admin/recruit 리다이렉트
        └── [section]/page.tsx                 SECTIONS 맵 → 아래 컴포넌트로 디스패치
            ├── recruit    → app-internals.tsx  RecruitSettings
            ├── interview  → app-internals.tsx  InterviewSchedule
            ├── applicants → app-internals.tsx  ApplicantManager
            ├── teams      → app-internals.tsx  TeamActivationManager
            ├── timetable  → app-internals.tsx  TimetableSettings(TermSettings+EventPeriodSettings)
            ├── members    → member-admin.tsx   MemberAdminScreen
            ├── migrate    → member-admin.tsx   MemberMigration
            ├── notices    → board.tsx          NoticesAdminSection
            ├── reports    → report.tsx         ReportAdminSection
            ├── president/vice/treasurer → officers.tsx  OfficerRoleScreen(role)
            └── genleader  → officers.tsx       GenLeaderScreen
```

### 공유 모듈 (현재 존재 / 신규 필요)

```
src/lib/
├── mock-data.ts          (현재) 전체 mock 데이터 + TeamStore/RoleStore/HistoryStore/TTShared
├── navigation.ts          (현재) 라우트 이동 헬퍼
├── services/
│   ├── index.ts           (현재) membersService/teamsService/noticesService/timetableService/rolesService/recruitService — 전부 mock 반환, api.* 호출로 교체 대상
│   └── client.ts           (현재) fetch 기반 api 클라이언트 (구현됨, 아직 미사용)
│
└── (신규 필요)
    ├── auth/session.ts      getCurrentSession(supabase) — 인증 세션 + users 프로필 조회
    ├── auth/kakao.ts         Kakao OAuth 토큰 교환 + 콜백 처리
    ├── constants.ts          isAdminRole(), hasActiveMemberAccess(), canManageTeam() 등
    ├── member/privacy.ts     maskMember() — privacy_settings 기반 마스킹
    ├── member/transitions.ts  회원 상태 전이 검증
    ├── team/utils.ts          팀 세션 집계, 카드 데이터 변환
    ├── supabase/{server,client,admin}.ts   Supabase 클라이언트 3종
    └── api/response.ts        apiSuccess()/apiError() 표준 응답 빌더

src/hooks/
├── useTheme.ts            (현재)
└── (신규 필요) use-me.ts, use-role.ts   — TODO.md 표기와 달리 아직 미구현 (본 문서 상단 경고 참고)

middleware.ts               (신규 필요, 프로젝트 루트) — 세션 쿠키 확인 후 2절 매트릭스에 따라 리다이렉트
```

---

## 6. 데이터 흐름 요약 (대표 시나리오)

### 6.1 부원 목록 조회 (개인정보 마스킹)
```
GET /api/members
  ├── 세션 쿠키 → auth.users → users 프로필 조회 (role, status)
  ├── status < PROBATION(미가입)면 401/403
  ├── users 테이블 쿼리(세션/기수/상태 필터, 검색어)
  └── maskMember(): privacy_settings 기준 name/phone/dept/school_year/generation 필드별 마스킹
```

### 6.2 팀 활성화 신청 → 승인
```
POST /api/teams/[id]/activation-requests   (팀장만)
  └── team_activation_requests INSERT (status=pending), 동일 team_id pending 존재 시 409

PATCH /api/admin/activation-requests/[id]   (운영진만)
  ├── status='approved' → teams.is_active=true (트랜잭션)
  └── status='rejected' → request만 갱신
```

### 6.3 지원자 합격 → 회원 전환
```
POST /api/admin/applications/[id]/decision   { result: 'pass' }
  ├── applications.status = 'pass'
  ├── users INSERT (status='PROBATION', probation_started_at=now(), kakao_id=applications.kakao_id, ...지원서 필드 매핑)
  └── notifications INSERT (합격 통지, FCM 연동 전까지는 인앱 알림만)
```

### 6.4 공지 열람 및 읽음 처리
```
GET /api/notices/[id]
  ├── notice_reads UPSERT(notice_id, user_id, read_at=now())  — kind='admin'인 경우만
  └── notices.views += 1  (매 조회마다 증가, 중복 방지 없음 — mock 동작 유지)
```
