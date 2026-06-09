# IA 명세서 (Information Architecture) — 청림그룹사운드 플랫폼

> 코드 기반 역추적 버전 (2026-06-10, 리팩토링 반영)  
> 원본: `platform/src/app/**`, `platform/src/proxy.ts`

---

## 1. 전체 라우트 구조

```
/                               공개 - 랜딩 페이지 (Kakao 로그인)
│
├── /auth/
│   └── callback                공개 - OAuth 콜백 처리 (Route Handler)
│
├── /status                     인증됨 (모든 상태) - 상태 안내 페이지
│   └── ?reason=not_open        모집 기간 외 접근 시
│
├── (auth 그룹) ────────────────── PENDING 상태 회원 전용
│   ├── /link                   기존 부원 계정 연동 (kakao_id 매칭)
│   └── /apply                  신규 가입 신청서 작성
│
└── (platform 그룹) ─────────────── PROBATION/ACTIVE/INACTIVE 이상
    ├── /home                   대시보드 (INTERVIEWING 접근 가능)
    ├── /timetable              시간표 (미구현 — INTERVIEWING 접근 가능)
    ├── /notices                공지사항 (미구현 — INTERVIEWING 접근 가능)
    │
    ├── /members                부원 목록
    │   ├── /[id]               부원 프로필 상세
    │   ├── /me                 내 프로필 확인
    │   └── /me/edit            내 프로필 수정
    │
    ├── /teams                  팀 목록
    │   ├── /new                팀 생성 (ACTIVE/INACTIVE만 가능)
    │   ├── /[id]               팀 상세
    │   └── /[id]/edit          팀 수정 (팀장/부팀장/운영진)
    │
    └── /admin ─────────────────── ADMIN/SUPER_ADMIN 전용
        ├── /applications       가입 신청서 목록 + 면접 관리
        ├── /interview-slots    면접 슬롯 생성/삭제
        ├── /settings           모집 기간 설정 (개방/마감)
        ├── /members            부원 목록 + 상태 변경
        │   └── /[id]           부원 상세 + 경고/탈퇴 관리
        └── /import             CSV 일괄 등록
```

---

## 2. API 라우트 구조

```
/api/
│
├── /auth/
│   ├── /link/search            POST - 기존 부원 검색 (name + generation)
│   └── /link/confirm           POST - 계정 연동 확정
│
├── /members/
│   ├── /                       GET  - 부원 목록 (필터, 검색, 개인정보 마스킹)
│   ├── /[id]                   GET  - 부원 프로필 상세
│   ├── /me                     PATCH - 내 프로필 수정
│   ├── /me/invitations/
│   │   ├── /                   GET  - 받은 팀 초대 목록
│   │   └── /[invitationId]     PATCH - 초대 수락/거절
│   └── /me/join-requests/      GET  - 내가 보낸 팀 가입 신청 목록
│
├── /teams/
│   ├── /                       GET, POST - 팀 목록 / 팀 생성
│   ├── /[id]/
│   │   ├── /                   GET, PATCH, DELETE - 팀 상세 / 수정 / 삭제
│   │   ├── /activate           POST - 팀 활성화 신청 (Route Handler)
│   │   ├── /invitations/       GET, POST - 초대 목록 / 초대 발송
│   │   ├── /join-requests/
│   │   │   ├── /               GET, POST - 신청 목록 / 가입 신청
│   │   │   └── /[requestId]    PATCH - 신청 수락/거절
│   │   ├── /leave              POST - 팀 탈퇴
│   │   └── /members/[userId]   DELETE - 팀원 강퇴
│
├── /settings/
│   └── /recruitment            GET - 현재 모집 기간 상태 (공개)
│
├── /interview-slots/           GET - 신청자용 면접 슬롯 목록
│
├── /interview-preferences/     GET, POST - 내 면접 희망 슬롯 조회/등록
│
└── /admin/
    ├── /settings/recruitment   GET, PATCH - 모집 기간 관리
    ├── /applications/
    │   ├── /[id]/preferences   GET - 특정 신청자 희망 슬롯
    │   ├── /schedule           POST - 면접 슬롯 배정
    │   └── /result             POST - 면접 결과 입력
    ├── /interview-slots/
    │   ├── /                   GET, POST - 슬롯 목록 / 슬롯 생성
    │   └── /[id]               DELETE - 슬롯 삭제
    ├── /members/
    │   ├── /link-status        GET - CSV 등록된 계정의 연동 상태
    │   ├── /transition         POST - 회원 상태 강제 변경
    │   └── /[id]/warnings      GET, POST - 경고 목록 / 경고 발급
    └── /import                 POST - CSV 부원 일괄 등록
```

---

## 3. 접근 제어 매트릭스

| 경로 | 비로그인 | PENDING | INTERVIEWING | PROBATION | ACTIVE/INACTIVE | ADMIN/SUPER_ADMIN |
|------|---------|---------|-------------|-----------|----------------|------------------|
| `/` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/status` | ❌→`/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/link`, `/apply` | ❌→`/` | ✅ | ❌→`/home` | ❌→`/home` | ❌→`/home` | ❌→`/home` |
| `/home` | ❌→`/` | ❌→`/link` | ✅ | ✅ | ✅ | ✅ |
| `/timetable`, `/notices` | ❌→`/` | ❌→`/link` | ✅ | ✅ | ✅ | ✅ |
| `/members/*`, `/teams/*` | ❌→`/` | ❌→`/link` | ❌→`/home` | ✅ | ✅ | ✅ |
| `/admin/*` | ❌→`/` | ❌→`/link` | ❌→`/home` | ❌→`/home` | ❌→`/home` | ✅ |

**팀 작업 권한**:
| 작업 | 일반 부원 | 팀장/부팀장 | 운영진 |
|------|---------|-----------|------|
| 팀 목록/상세 조회 | ✅ | ✅ | ✅ |
| 팀 생성 | ✅ (ACTIVE/INACTIVE) | ✅ | ✅ |
| 연습곡/소개/모집 상태/부팀장 수정 | ❌ | ✅ | ✅ |
| 팀장 위임 (`leader_id`) | ❌ | ✅ (팀장만) | ✅ |
| 팀 이름/활성 상태 변경 | ❌ | ❌ ⚠️ (팀장 권한 추가 예정) | ✅ |
| 팀원 강퇴 | ❌ | ✅ | ✅ |
| 팀 탈퇴 | ✅ (팀장 제외) | ✅ (부팀장: vice_leader_id 자동 초기화) | ✅ |
| 팀 활성화 신청 | ❌ | ✅ (팀장/부팀장) | — |
| 팀 활성화 승인 | ❌ | ❌ | ✅ |
| 팀 삭제 | ❌ | ✅ | ✅ |

---

## 4. 회원 상태 흐름도

```
[신규 카카오 로그인]
         │
         ▼
    PENDING ──── 모집 기간 아님 ──→ /status (안내)
         │
    모집 기간 중
         │
         ▼
    /link (기존 부원 여부 확인)
    ├── 기존 부원: linked_auth_id 연결 → PENDING 유지 → 신청서 작성
    └── 신규: /apply → 신청서 작성
         │
         ▼
   신청서 제출 → PENDING (신청서 있음) → /status (승인 대기)
         │
    운영진 면접 슬롯 배정
         │
         ▼
  INTERVIEWING ── 면접 결과 입력 ──→ FAIL → WITHDRAWN
         │
        PASS
         │
         ▼
  PROBATION (수습) ──── 수습 만료 / 경고 3회 ──→ WITHDRAWN
         │                    │
    활성화 신청 + 승인      비활성화
         │                    │
         ▼                    ▼
      ACTIVE ◀──────────── INACTIVE
         │
    탈퇴 / 경고 3회
         │
         ▼
    WITHDRAWN (종료)
```

---

## 5. 컴포넌트 계층 구조

```
app/
├── layout.tsx (루트 — 폰트, 메타데이터)
│
├── (platform)/layout.tsx
│   ├── components/layout/NavLinks.tsx
│   └── components/LogoutButton.tsx
│
├── (platform)/home/page.tsx
│   └── components/layout/DashboardCards.tsx
│
├── (platform)/members/page.tsx
│   ├── components/members/MemberFilter.tsx
│   └── components/members/MemberCard.tsx
│
├── (platform)/members/[id]/page.tsx
│   ├── components/teams/InviteButton.tsx
│   └── components/members/WhitelistBadge.tsx
│
├── (platform)/members/me/page.tsx + edit/page.tsx
│   └── components/members/ProfileForm.tsx
│       └── components/members/PrivacySettings.tsx
│
├── (platform)/teams/page.tsx
│   └── components/teams/TeamCard.tsx
│
├── (platform)/teams/[id]/page.tsx
│   ├── components/teams/TeamMemberList.tsx
│   ├── components/teams/RecruitingToggle.tsx
│   ├── components/teams/JoinRequestSection.tsx
│   ├── components/teams/JoinRequestsPanel.tsx
│   ├── components/teams/ActivationPanel.tsx
│   └── components/teams/LeaveTeamButton.tsx
│
├── (platform)/teams/new/page.tsx
│   └── components/teams/NewTeamForm.tsx
│
├── (platform)/teams/[id]/edit/page.tsx
│   └── components/teams/EditTeamForm.tsx
│
└── (platform)/admin/
    ├── applications/page.tsx
    │   ├── components/admin/ApplicationCard.tsx
    │   └── components/InterviewSlotPicker.tsx  (최상위 유지 — auth/apply에서도 사용)
    ├── members/page.tsx
    │   └── components/admin/MemberList.tsx
    ├── members/[id]/page.tsx
    │   ├── components/admin/WarningSection.tsx
    │   ├── components/admin/WithdrawSection.tsx
    │   └── components/admin/SessionYearsEditor.tsx  // 세션 연차 수정 (운영진용)
    └── import/page.tsx  (CSV 파싱 로직 인라인)
```

### 공유 모듈 구조 (`src/lib/`, `src/types/`)

```
src/
├── lib/
│   ├── auth/
│   │   └── session.ts          getCurrentSession() — 인증 헬퍼 (모든 Route Handler 공통)
│   ├── api/
│   │   └── response.ts         apiError() / apiSuccess() — 표준 응답 빌더
│   ├── constants.ts            ADMIN_ROLES, ACTIVE_STATUSES 등 + isAdminRole() 등 유틸
│   ├── team/
│   │   └── utils.ts            calcSessionSummary / calcMemberCount / filterMyTeams / toTeamCardData
│   ├── member/
│   │   ├── privacy.ts          maskMember() — 개인정보 마스킹
│   │   ├── transitions.ts      상태 전이 로직
│   │   └── probation.ts        수습 만료 처리
│   └── supabase/
│       ├── server.ts           createClient() — SSR용 Supabase 클라이언트
│       ├── client.ts           브라우저용 Supabase 클라이언트
│       └── admin.ts            createAdminClient() — Service Role 클라이언트 (RLS 우회)
└── types/
    ├── database.ts             Supabase 자동생성 타입 (pnpm types로 재생성)
    ├── app.ts                  MemberCardData, MemberStatus, MemberRole, RequestStatus 등
    └── team.ts                 TeamListItem, TeamCardData, TeamDetailRow 등 팀 관련 공유 타입
```

---

## 6. 데이터 흐름 요약

### 부원 목록 조회 (개인정보 마스킹)
```
GET /api/members
  ├── supabase.auth.getUser() — 호출자 인증
  ├── users 테이블에서 호출자 profile 조회 (role, status)
  ├── users 테이블 전체 쿼리 (필터 적용)
  ├── teams 테이블에서 현재 팀장 ID Set 구성
  └── maskMember() 적용 → privacy_settings 기반 필드별 공개 범위 적용
```

### 팀 상세 조회
```
GET /api/teams/[id]
  ├── getCurrentSession(supabase) — 인증 + 프로필 조회
  ├── hasActiveMemberAccess(session.profile.status) — PROBATION 이상 확인
  └── createAdminClient()로 teams + leader + team_members 조인 쿼리
      (RLS 우회 — 팀 정보는 부원이면 누구나 볼 수 있어야 하므로)
```

### 팀 정보 수정
```
PATCH /api/teams/[id]
  ├── getCurrentSession(supabase) — 인증
  ├── resolveTeamAccess() — isAdmin / isLeader / isViceLeader 판단
  ├── isAdmin → adminFields (name, is_active 포함)
  └── isLeader/isViceLeader → leaderFields (name, current_song, description, is_recruiting, vice_leader_id, leader_id)
```

### 회원 상태 전이
```
PATCH /api/admin/members/[id]       // 세션 연차 등 운영진 수정
POST /api/admin/members/transition
  ├── 운영진 권한 확인
  ├── validate_status_transition() DB 함수 호출
  └── transition_member_status() DB 함수 호출
      ├── users.status 업데이트
      └── member_history 기록 삽입
```
