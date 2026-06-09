# API 명세서 v2 — 청림그룹사운드 플랫폼

> 코드 기반 역추적 버전 (2026-06-10, 리팩토링 반영)  
> 원본: `platform/src/app/api/**`  
> Base URL: `https://{도메인}/api`

---

## 공통 규칙

### 인증
모든 `/api/*` 엔드포인트는 Supabase 세션 쿠키 기반 인증.  
미인증 시 `401 Unauthorized` 반환.

### 응답 형식
`src/lib/api/response.ts`의 `apiError()` / `apiSuccess()`로 전체 표준화됨.

```typescript
// 성공
NextResponse.json(data, { status: 200 })

// 에러
NextResponse.json({ error: string, ...extras? }, { status: number })
```

> 500 응답은 DB 에러 메시지를 그대로 노출하지 않음 — 항상 `'서버 오류가 발생했습니다'` 반환.

### 권한 레벨
| 레벨 | 조건 |
|------|------|
| `MEMBER_ACCESS` | status가 PROBATION, ACTIVE, INACTIVE 중 하나 |
| `ADMIN_ACCESS` | role이 ADMIN 또는 SUPER_ADMIN |
| `TEAM_ACCESS` | 팀장, 부팀장, 또는 ADMIN_ACCESS |

---

## 1. 인증 (Auth)

### `POST /auth/link/search`
기존 부원 계정 검색 (이름 + 기수 매칭).

**요청**
```json
{ "name": "홍길동", "generation": 25 }
```

**응답 200**
```json
{ "users": [{ "id": "uuid", "name": "홍길동", "generation": 25, "kakao_id": "12345" }] }
```

**응답 404**: 일치하는 부원 없음

---

### `POST /auth/link/confirm`
Kakao Auth UID를 기존 부원 계정에 연결.

**요청**
```json
{ "userId": "uuid" }
```

**응답 200**
```json
{ "success": true }
```

---

## 2. 부원 (Members)

### `GET /api/members`
부원 목록 조회. 개인정보는 `privacy_settings` 기반으로 마스킹됨.

**권한**: `MEMBER_ACCESS` (미인증 시 401, 권한 미달 시 403)

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `session` | `string[]` | 세션 필터 (OR 조건, 복수 가능) |
| `generation` | `number` | 기수 필터 |
| `role` | `member_role` | 역할 필터 |
| `is_whitelist` | `'true'` | 화이트리스트만 |
| `status` | `member_status` | 상태 필터 (운영진만 가능) |
| `q` | `string` | 이름/닉네임 부분 검색 |

**응답 200**
```json
{
  "members": [MemberCardData],
  "admins": [MemberCardData],
  "total": 42
}
```

**MemberCardData** (`src/types/app.ts`)
```typescript
{
  id: string
  name: string | null          // privacy 기반 마스킹
  nickname: string | null
  profile_image_url: string | null
  status: MemberStatus
  role: MemberRole
  is_whitelist: boolean
  session: string[]
  generation: number | null    // privacy 기반 마스킹
  phone: string | null         // privacy 기반 마스킹 (기본: admin만)
  department: string | null    // privacy 기반 마스킹
  school_year: number | null   // privacy 기반 마스킹
  is_leader?: boolean          // 현재 어떤 팀의 팀장인지 여부 (computed)
}
```

---

### `GET /api/members/[id]`
특정 부원 프로필 상세 조회.

**권한**: `MEMBER_ACCESS`

**응답 200**
```json
{ "member": MemberCardData }
```

**응답 404**: 해당 부원 없음

---

### `PATCH /api/members/me`
내 프로필 수정.

**요청 (수정 가능 필드만 포함)**
```json
{
  "nickname": "길동이",
  "phone": "010-1234-5678",
  "department": "컴퓨터공학과",
  "school_year": 3,
  "session": ["기타"],
  "genre_preference": ["록", "재즈"],
  "privacy_settings": {
    "name": "member",
    "phone": "admin",
    "generation": "all"
  }
}
```

**응답 200**
```json
{ "success": true }
```

---

### `GET /api/members/me/invitations`
내가 받은 팀 초대 목록.

**응답 200**
```json
{
  "invitations": [{
    "id": "uuid",
    "team_id": "uuid",
    "team_name": "팀명",
    "invited_by_name": "홍길동",
    "message": "함께 해요",
    "status": "PENDING",
    "created_at": "ISO8601"
  }]
}
```

---

### `PATCH /api/members/me/invitations/[invitationId]`
팀 초대 수락 또는 거절.

**요청**
```json
{ "action": "accept" }   // 또는 "reject"
```

**응답 200**
```json
{ "success": true }
```

---

### `GET /api/members/me/join-requests`
내가 보낸 팀 가입 신청 목록.

**응답 200**
```json
{
  "requests": [{
    "id": "uuid",
    "team_id": "uuid",
    "team_name": "팀명",
    "message": "가입하고 싶어요",
    "status": "PENDING",
    "created_at": "ISO8601"
  }]
}
```

---

## 3. 팀 (Teams)

### `GET /api/teams`
팀 목록 조회.

**권한**: `MEMBER_ACCESS`

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `recruiting` | `'true'|'false'` | 모집 상태 필터 |
| `inactive` | `'true'` | 비활성 팀 포함 (운영진만) |

**응답 200**
```json
{ "teams": [TeamSummary] }
```

---

### `POST /api/teams`
팀 생성. ACTIVE/INACTIVE 부원만 가능.

**요청**
```json
{
  "name": "팀명",
  "current_song": "연습곡",
  "description": "팀 소개",
  "is_recruiting": true
}
```

**응답 201**
```json
{ "team": { "id": "uuid", ...TeamData } }
```

---

### `GET /api/teams/[id]`
팀 상세 조회 (팀원 목록, 팀장 정보 포함).

**권한**: `MEMBER_ACCESS`

**응답 200**
```json
{
  "team": {
    "id": "uuid",
    "name": "팀명",
    "current_song": "연습곡",
    "description": "팀 소개",
    "is_active": true,
    "is_recruiting": true,
    "leader_id": "uuid",
    "vice_leader_id": "uuid | null",
    "leader": MemberCardData,
    "team_members": [{
      "id": "uuid",
      "user_id": "uuid",
      "session_in_team": ["기타"],
      "joined_at": "ISO8601",
      "user": MemberCardData
    }]
  },
  "reservations": []  // 미구현 — 항상 빈 배열
}
```

---

### `PATCH /api/teams/[id]`
팀 정보 수정.

**권한**: `TEAM_ACCESS`

**수정 가능 필드 (팀장/부팀장)**
```json
{
  "current_song": "새 연습곡",
  "description": "팀 소개 수정",
  "is_recruiting": false,
  "vice_leader_id": "uuid | null",
  "leader_id": "uuid"             // 팀장 위임 (팀장만 의미있음)
}
```

**추가 수정 가능 필드 (운영진만)**
```json
{
  "name": "팀명 변경",            // ⚠️ 팀장 권한 추가 예정 (TODO)
  "is_active": false              // is_active 변경 시 activation_requested 자동 false
}
```

**응답 200**
```json
{ "success": true }
```

---

### `DELETE /api/teams/[id]`
팀 삭제.

**권한**: `TEAM_ACCESS`

**응답 200**
```json
{ "success": true }
```

---

### `POST /api/teams/[id]/join-requests`
팀 가입 신청.

**요청**
```json
{ "message": "가입하고 싶습니다" }
```

**응답 201**
```json
{ "success": true }
```

---

### `GET /api/teams/[id]/join-requests`
팀에 들어온 가입 신청 목록.

**권한**: `TEAM_ACCESS`

**응답 200**
```json
{
  "requests": [{
    "id": "uuid",
    "applicant_id": "uuid",
    "applicant": MemberCardData,
    "message": "가입하고 싶습니다",
    "status": "PENDING",
    "created_at": "ISO8601"
  }]
}
```

---

### `PATCH /api/teams/[id]/join-requests/[requestId]`
가입 신청 수락 또는 거절.

**권한**: `TEAM_ACCESS`

**요청**
```json
{ "action": "accept" }  // 또는 "reject"
```

**응답 200**
```json
{ "success": true }
```

---

### `POST /api/teams/[id]/invitations`
팀원 초대 발송.

**권한**: `TEAM_ACCESS`

**요청**
```json
{ "inviteeId": "uuid", "message": "초대합니다" }
```

> 피초대자 status 제한 없음 — INACTIVE 부원도 초대 가능.  
> 이미 팀원이거나 이미 초대된 경우 `409` 반환.

**응답 201**
```json
{ "invitation": { "id": "uuid" } }
```

---

### `GET /api/teams/[id]/invitations`
팀이 보낸 초대 목록.

**권한**: `TEAM_ACCESS`

**응답 200**
```json
{ "invitations": [TeamInvitation] }
```

---

### `POST /api/teams/[id]/leave`
팀 탈퇴.

> **팀장**: 탈퇴 불가 (`400`) — 팀장 위임(`PATCH leader_id`) 먼저 필요.  
> **부팀장**: 탈퇴 시 `vice_leader_id` 자동으로 `null` 처리 (별도 위임 불필요).  
> 탈퇴 시 해당 팀에 보낸 가입 신청도 함께 삭제.

**응답 200**
```json
{ "success": true }
```

---

### `DELETE /api/teams/[id]/members/[userId]`
팀원 강퇴.

**권한**: `TEAM_ACCESS`

**응답 200**
```json
{ "success": true }
```

---

## 4. 면접 슬롯 (Interview Slots)

### `GET /api/interview-slots`
신청자용 면접 슬롯 목록 조회 (모집 기간 중에만 접근 가능).

**응답 200**
```json
{
  "slots": [{
    "id": "uuid",
    "slot_at": "ISO8601",
    "capacity": 5
  }]
}
```

---

### `GET /api/interview-preferences`
내가 선택한 면접 희망 슬롯 목록.

**응답 200**
```json
{ "preferences": [{ "slot_id": "uuid", "slot_at": "ISO8601" }] }
```

---

### `POST /api/interview-preferences`
면접 희망 슬롯 등록/변경.

**요청**
```json
{ "slot_ids": ["uuid1", "uuid2"] }
```

**응답 200**
```json
{ "success": true }
```

---

## 5. 모집 설정 (Recruitment Settings)

### `GET /api/settings/recruitment`
현재 모집 기간 상태 조회 (공개).

**응답 200**
```json
{
  "is_open": true,
  "open_at": "ISO8601",
  "close_at": "ISO8601"
}
```

---

## 6. 운영진 전용 (Admin)

### `GET /api/admin/settings/recruitment`
모집 기간 상세 조회.

### `PATCH /api/admin/settings/recruitment`
모집 기간 설정.

**요청**
```json
{
  "is_open": true,
  "open_at": "ISO8601",
  "close_at": "ISO8601"
}
```

---

### `GET /api/admin/applications/[id]/preferences`
특정 신청자의 희망 면접 슬롯 조회.

---

### `POST /api/admin/applications/schedule`
신청자에게 면접 슬롯 배정.

**요청**
```json
{ "application_id": "uuid", "slot_id": "uuid" }
```

---

### `POST /api/admin/applications/result`
면접 결과 입력.

**요청**
```json
{
  "application_id": "uuid",
  "result": "PASS",  // 또는 "FAIL"
  "admin_note": "메모"
}
```

---

### `GET /api/admin/interview-slots`
면접 슬롯 목록 (신청자 수 포함).

**응답 200**
```json
{
  "slots": [{
    "id": "uuid",
    "slot_at": "ISO8601",
    "capacity": 5,
    "confirmed_count": 2,
    "preference_count": 8
  }]
}
```

---

### `POST /api/admin/interview-slots`
면접 슬롯 생성.

**요청**
```json
{ "slot_at": "ISO8601", "capacity": 5 }
```

---

### `DELETE /api/admin/interview-slots/[id]`
면접 슬롯 삭제.

---

### `GET /api/admin/members/link-status`
CSV 등록 부원들의 Kakao 계정 연동 여부 조회.

**응답 200**
```json
{
  "members": [{
    "id": "uuid",
    "name": "홍길동",
    "generation": 25,
    "kakao_id": "12345",
    "linked_auth_id": "uuid | null",
    "is_linked": true
  }]
}
```

---

### `POST /api/admin/members/transition`
회원 상태 강제 변경.

**요청**
```json
{
  "user_id": "uuid",
  "to_status": "ACTIVE",
  "reason": "수습 기간 만료"
}
```

---

### `GET /api/admin/members/[id]/warnings`
특정 부원의 경고 내역 조회.

**응답 200**
```json
{
  "warnings": [{
    "id": "uuid",
    "reason": "무단결석",
    "issued_by_name": "운영진이름",
    "created_at": "ISO8601"
  }],
  "count": 1
}
```

---

### `POST /api/admin/members/[id]/warnings`
경고 발급.

**요청**
```json
{ "reason": "무단결석" }
```

---

### `POST /api/admin/import`
CSV 파일 부원 일괄 등록.

**요청**: `multipart/form-data` — `file: CSV`

**CSV 컬럼**: `이름`, `기수`, `카카오ID`, `세션`, `기타`...

**응답 200**
```json
{
  "success": true,
  "imported": 15,
  "skipped": 2,
  "errors": ["3행: 기수가 숫자가 아님"]
}
```

---

## 7. 미구현 / 추후 구현 예정 엔드포인트

| 경로/기능 | 설명 | 현재 상태 |
|---------|------|---------|
| `reservations` (팀 상세 응답) | 팀 연습 예약 | 항상 `[]` 반환 (`src/app/api/teams/[id]/route.ts`) |
| `/api/timetable/*` | 시간표 데이터 | 미존재 |
| `/api/notices/*` | 공지사항 데이터 | 미존재 |
| FCM 웹 푸시 연동 | 알림 시스템 | 설계만 완료 |
| `PATCH /api/teams/[id]` — `name` 필드 팀장 권한 | 팀장의 팀 이름 변경 | 현재 운영진만 가능 (TODO) |
| `member_role.TEAM_LEADER` 제거 | DB Enum 정리 | 미완료 — DB 마이그레이션 필요 |
| 세션 연차 | 사용자별 각 세션 활동 기간 기록 | 미설계 |
