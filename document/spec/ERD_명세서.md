# ERD 명세서 — 청림그룹사운드 플랫폼

> 코드 기반 역추적 버전 (2026-06-10, 리팩토링 반영)  
> 원본: `platform/src/types/database.ts`, `document/spec/migrations/*.sql`

---

## 1. 엔티티 관계도 (Mermaid ERD)

```mermaid
erDiagram
    users {
        uuid id PK
        text kakao_id UK
        uuid linked_auth_id FK
        text name
        text nickname
        int generation
        text[] session
        text profile_image_url
        text[] genre_preference
        text phone
        text department
        int school_year
        member_status status
        member_role role
        bool is_whitelist
        jsonb privacy_settings
        timestamptz privacy_agreed_at
        timestamptz probation_started_at
        timestamptz activated_at
        timestamptz last_active_at
        timestamptz created_at
        timestamptz updated_at
    }

    teams {
        uuid id PK
        text name
        uuid leader_id FK
        uuid vice_leader_id FK
        text current_song
        text description
        bool is_active
        bool is_recruiting
        bool activation_requested
        timestamptz created_at
        timestamptz updated_at
    }

    team_members {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        text[] session_in_team
        timestamptz joined_at
    }

    team_join_requests {
        uuid id PK
        uuid team_id FK
        uuid applicant_id FK
        text message
        request_status status
        timestamptz created_at
        timestamptz updated_at
    }

    team_invitations {
        uuid id PK
        uuid team_id FK
        uuid invitee_id FK
        uuid invited_by FK
        text message
        request_status status
        timestamptz created_at
        timestamptz updated_at
    }

    join_applications {
        uuid id PK
        uuid user_id FK
        text motivation
        text self_intro
        uuid confirmed_slot_id FK
        interview_result interview_result
        text admin_note
        timestamptz created_at
    }

    interview_slots {
        uuid id PK
        timestamptz slot_at
        int capacity
        uuid created_by FK
        timestamptz created_at
    }

    interview_preferences {
        uuid id PK
        uuid application_id FK
        uuid user_id FK
        uuid slot_id FK
        timestamptz created_at
    }

    recruitment_periods {
        uuid id PK
        bool is_open
        timestamptz open_at
        timestamptz close_at
        uuid created_by FK
        timestamptz created_at
    }

    member_warnings {
        uuid id PK
        uuid user_id FK
        text reason
        uuid issued_by FK
        timestamptz created_at
    }

    member_history {
        uuid id PK
        uuid user_id FK
        member_status from_status
        member_status to_status
        uuid changed_by FK
        text reason
        timestamptz created_at
    }

    audit_logs {
        uuid id PK
        text target_table
        uuid target_id
        text action
        jsonb before
        jsonb after
        uuid actor_id FK
        timestamptz created_at
    }

    users ||--o{ team_members : "소속"
    teams ||--o{ team_members : "구성원"
    users ||--o{ teams : "팀장(leader_id)"
    users ||--o{ teams : "부팀장(vice_leader_id)"
    teams ||--o{ team_join_requests : "받은 신청"
    users ||--o{ team_join_requests : "보낸 신청(applicant)"
    teams ||--o{ team_invitations : "보낸 초대"
    users ||--o{ team_invitations : "받은 초대(invitee)"
    users ||--o{ team_invitations : "초대한 사람(invited_by)"
    users ||--|| join_applications : "신청서(1:1)"
    interview_slots ||--o{ join_applications : "확정 슬롯(confirmed_slot_id)"
    join_applications ||--o{ interview_preferences : "희망 슬롯"
    interview_slots ||--o{ interview_preferences : "슬롯"
    users ||--o{ interview_slots : "생성자(created_by)"
    users ||--o{ recruitment_periods : "생성자(created_by)"
    users ||--o{ member_warnings : "경고 대상"
    users ||--o{ member_warnings : "경고 발급자(issued_by)"
    users ||--o{ member_history : "변경 대상"
    users ||--o{ member_history : "변경자(changed_by)"
    users ||--o{ audit_logs : "행위자(actor_id)"
```

---

## 2. 열거형 (Enums)

### `member_status`
| 값 | 설명 | 전이 가능 대상 |
|----|------|--------------|
| `PENDING` | 가입 신청 전 / 미연동 | → INTERVIEWING |
| `INTERVIEWING` | 면접 대기 중 | → ACTIVE, WITHDRAWN |
| `PROBATION` | 수습 부원 | → ACTIVE, INACTIVE, WITHDRAWN |
| `ACTIVE` | 정식 부원 | → INACTIVE, WITHDRAWN |
| `INACTIVE` | 활동 중단 | → ACTIVE, WITHDRAWN |
| `WITHDRAWN` | 탈퇴 | (종료 상태) |

### `member_role`
| 값 | 설명 |
|----|------|
| `SUPER_ADMIN` | 개발 담당 (최고 권한) |
| `ADMIN` | 운영진 |
| `MEMBER` | 정식 부원 |
| `PROBATION_MEMBER` | 유예 부원 |

> 팀장 여부는 `teams.leader_id`로 관리. `TEAM_LEADER` enum 값은 제거됨.

### `interview_result`
| 값 | 설명 |
|----|------|
| `PENDING` | 결과 미입력 |
| `PASS` | 합격 |
| `FAIL` | 불합격 |

### `request_status`
| 값 | 설명 |
|----|------|
| `PENDING` | 처리 대기 |
| `ACCEPTED` | 수락됨 |
| `REJECTED` | 거절됨 |

---

## 3. 테이블 상세 설명

### users
핵심 회원 테이블. Supabase Auth의 `auth.users`와 별도로 관리됨.
- `linked_auth_id`: 기존 부원(kakao_id로 등록)이 새 Kakao 계정으로 로그인했을 때 연결되는 auth UID
- `privacy_settings` (JSONB): `{ name, generation, phone, department, school_year }` 각 필드별 공개 범위 (`'all'|'member'|'admin'`)
- `session`: 악기/파트 배열 (예: `['기타', '보컬']`)
- `is_whitelist`: 사전 등록된 명단 여부

### teams
밴드/앙상블 팀 단위.
- `activation_requested`: 수습 팀장이 활성화를 신청한 상태 (운영진 승인 대기)
- `is_active`: 운영진이 활성화 승인한 팀만 `true`
- `is_recruiting`: 팀이 직접 제어하는 모집 상태 토글

### join_applications
`users` 와 1:1 관계. 가입 신청서.
- `confirmed_slot_id`: 운영진이 배정한 면접 슬롯 (NULL이면 미배정)
- `interview_result`: 기본값 `PENDING`

### interview_preferences
신청자가 선택한 면접 희망 슬롯 목록.

### recruitment_periods
단일 레코드 (upsert 패턴). 현재 모집 기간 설정.

### member_warnings
경고 누적 시 자동 탈퇴 처리 (3회 초과시). Supabase Edge Function 또는 트리거로 처리.

### audit_logs
데이터 변경 감사 로그. `before`/`after` JSONB로 이전/이후 값 보관.

---

## 4. 뷰 & 함수

### 뷰: `probation_expiry`
수습 부원의 수습 만료 일자를 계산하는 뷰. Edge Function `probation-check`가 참조.

### DB 함수
| 함수명 | 설명 |
|-------|------|
| `get_my_role()` | 현재 로그인 사용자의 role 반환 |
| `get_my_status()` | 현재 로그인 사용자의 status 반환 |
| `get_my_user_id()` | 현재 로그인 사용자의 users.id 반환 |
| `validate_status_transition(from, to)` | 상태 전이 유효성 검사 |
| `transition_member_status(user_id, to_status, changed_by?, reason?)` | 상태 전이 실행 + 이력 기록 |

### 앱 레이어 공유 유틸 (`src/lib/`)
| 함수/파일 | 설명 |
|---------|------|
| `lib/auth/session.ts` — `getCurrentSession(supabase)` | 인증 세션 + users 프로필 조회. `{ user, profile, myId }` 반환. `myId`는 항상 `users.id` 기준 (linked_auth_id 대응) |
| `lib/constants.ts` — `isAdminRole(role)` | `ADMIN`, `SUPER_ADMIN` 여부 반환 |
| `lib/constants.ts` — `hasActiveMemberAccess(status)` | `ACTIVE`, `INACTIVE`, `PROBATION` 여부 반환 |
| `lib/constants.ts` — `canCreateTeam(status)` | `ACTIVE`, `INACTIVE` 여부 반환 |
| `lib/team/utils.ts` — `calcSessionSummary(leader, members)` | 팀 세션별 인원 집계 |
| `lib/team/utils.ts` — `calcMemberCount(leader, members)` | 팀 전체 인원 수 (리더 중복 제거) |
| `lib/team/utils.ts` — `filterMyTeams(teams, meIds)` | 내가 속한 팀만 필터 |
| `lib/team/utils.ts` — `toTeamCardData(team)` | `TeamListItem` → `TeamCardData` 변환 |
| `lib/api/response.ts` — `apiError(msg, status, extras?)` | 표준 에러 응답 |
| `lib/api/response.ts` — `apiSuccess(data, status?)` | 표준 성공 응답 |

---

## 5. RLS 정책 요약

| 테이블 | 읽기 | 쓰기 |
|--------|------|------|
| `users` | 본인 / ACTIVE 이상 부원 (개인정보 컬럼 제외) | 본인만 (일부 컬럼) |
| `teams` | PROBATION 이상 부원 | 팀장, 부팀장, 운영진 |
| `team_members` | PROBATION 이상 부원 | 운영진 (직접 조작) |
| `join_applications` | 본인 / 운영진 | 본인 (생성), 운영진 (결과) |
| `interview_slots` | PENDING 이상 (모집 기간 중) | 운영진만 |
| `member_warnings` | 운영진만 | 운영진만 |
| `audit_logs` | 운영진만 | 시스템만 (트리거) |
