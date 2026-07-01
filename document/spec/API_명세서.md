# API 명세서 — 청림그룹사운드 플랫폼

> 버전: v1 (2026-07-02) — 신규 작성. [ERD_명세서.md](./ERD_명세서.md), [IA_명세서.md](./IA_명세서.md), [기능_명세서.md](./기능_명세서.md) 와 세트로 사용.
> Base URL: `/api` (Next.js Route Handler, 현재 코드에는 `src/app/api/*`가 전혀 없음 — 전량 신규 구현)
> 프론트 연동 지점: `src/lib/services/index.ts`의 각 함수 본문을 아래 엔드포인트 호출로 교체(`src/lib/services/client.ts`의 `api.*` 래퍼는 이미 구현되어 있으나 미사용 상태).

---

## 0. 공통 규칙

### 인증
Supabase 세션 쿠키 기반. 미인증 요청은 `401`. 인증되었으나 권한 부족은 `403`.

### 응답 형식
```typescript
// 성공
NextResponse.json(data, { status: 200 | 201 })
// 에러
NextResponse.json({ error: string, ...extras? }, { status: number })
```
500 응답은 내부 에러 메시지를 노출하지 않고 `'서버 오류가 발생했습니다'` 고정 반환.

### 권한 레벨
| 레벨 | 조건 |
|---|---|
| `PUBLIC` | 인증 불필요 |
| `MEMBER` | `users.status IN ('PROBATION','ACTIVE','INACTIVE')` |
| `TEAM_MANAGER` | 요청 대상 팀의 `team_role IN ('leader','vice')` 이거나 `ADMIN` |
| `ADMIN` | `role IN ('ADMIN','SUPER_ADMIN')` |
| `SELF` | 본인 리소스에 한해 |

### 페이지네이션
목록형 GET은 `?limit`(기본 20, 최대 100) + `?cursor`(또는 `?page`) 쿼리 지원. 응답에 `{ items: [...], nextCursor: string|null, total?: number }` 형태 사용.

---

## 1. 인증 (Auth)

### `GET /api/auth/session`
현재 로그인 사용자의 세션 요약(이름, role, status) — `/join` 진입 시 표시용.
`PUBLIC` (미인증이면 `{ authenticated:false }` 반환, 에러 아님)

### `POST /api/auth/kakao/callback`
Kakao OAuth 콜백 처리 — 토큰 교환, `users.kakao_id`/`auth_user_id` 매칭 또는 세션만 생성. `PUBLIC`

### `POST /api/auth/link/search`
기존 부원 로스터 검색(이름 + 기수).
```json
// 요청
{ "name": "홍길동", "gen": 20 }
// 응답 200
{ "candidates": [{ "id": "uuid", "name": "홍길동", "gen": 20, "dept": "..." }] }
// 응답 404: 일치 없음
```
`PUBLIC` (로그인 상태의 미가입자만 — 서버에서 세션은 확인하되 회원 상태 요건은 없음)

### `POST /api/auth/link/confirm`
검색된 후보와 현재 Kakao 계정 연결.
```json
{ "userId": "uuid" }
```
→ `users.auth_user_id` 갱신, `{ "success": true }`

### `POST /api/auth/logout`
세션 종료. `MEMBER`

---

## 2. 지원(Applications) — 로그인은 되어 있으나 회원 아님

### `GET /api/settings/recruitment`
현재 모집 기간/개요 조회(공개). `PUBLIC`
```json
{ "isOpen": true, "headline": "...", "body": "...", "sessions": ["기타"], "periodStart": "2026-08-01", "periodEnd": "2026-08-20", "closedNote": "..." }
```

### `GET /api/interview-slots`
지원자용 면접 슬롯 목록(잔여 정원 포함). `PUBLIC`(모집 기간 중만 노출)
```json
{ "slots": [{ "id":"uuid","date":"2026-08-10","start":"14:00","end":"14:30","remaining":2 }] }
```

### `POST /api/applications`
지원서 제출.
```json
{
  "name":"...", "nick":"...", "session":["기타"], "sessionExperience":{"기타":2},
  "genres":["록"], "dept":"...", "studentId":"...", "schoolYear":"2학년",
  "phone":"010-....", "message":"...", "preferredSlotIds":["uuid"]
}
```
→ `201 { "applicationId": "uuid" }`. `PUBLIC`(중복 제출 방지: 동일 kakao 계정 활성 지원서 존재 시 `409`)

### `GET /api/applications/me`
내 지원서 현재 상태 조회(StatusView용). `SELF`

### `PATCH /api/applications/me/preferences`
`status='new'`인 동안 희망 슬롯 재선택.
```json
{ "preferredSlotIds": ["uuid"] }
```

---

## 3. 부원 (Members)

### `GET /api/members`
`MEMBER`. 쿼리: `session[]`, `gen`, `whitelist=true`, `role`, `q`.
응답 각 항목은 `기능_명세서.md` 3.4절 마스킹 규칙 적용 완료 상태로 반환.
```json
{ "items": [MemberCard], "nextCursor": null, "total": 82 }
```
**MemberCard**
```typescript
{
  id, name, nick, profileImageUrl, status, role, adminRole, whitelist,
  session: string[], gen, dept, phone, studentId, schoolYear,   // 마스킹 적용
  teamId, teamRole
}
```

### `GET /api/members/[id]`
`MEMBER` → `{ "member": MemberCard }`. 없으면 `404`.

### `PATCH /api/members/me`
`SELF`. 수정 가능 필드: `nick, bio, session, sessionExperience, genres, phone, phonePrivate, dept, studentId, schoolYear, avatarSource, privacySettings`.

### `GET /api/members/me/invitations`
`SELF` — 받은 팀 초대 목록.
### `PATCH /api/members/me/invitations/[id]`
```json
{ "action": "accept" }  // 또는 "reject"
```
### `GET /api/members/me/join-requests`
`SELF` — 내가 보낸 팀 가입 신청 목록(취소 가능).
### `DELETE /api/members/me/join-requests/[id]`
`SELF` — 신청 취소.

---

## 4. 팀 (Teams)

### `GET /api/teams`
`MEMBER`. 쿼리: `recruiting=true`, `active=false`(비활성 포함, 비운영진은 자동 제외).
### `POST /api/teams`
`MEMBER`(`status IN ('ACTIVE','INACTIVE')`만) — 팀 생성, 생성자를 `leader`로 자동 지정, `isActive=false`.
### `GET /api/teams/[id]`
`MEMBER` — 팀 상세(멤버 목록 포함).
### `PATCH /api/teams/[id]`
`TEAM_MANAGER`. 리더/부리더 가능 필드: `description, currentSong, isRecruiting`. 리더 전용: `viceLeaderId, leaderId`(위임). `ADMIN` 전용 추가 필드: `name, hue, isActive`.
### `DELETE /api/teams/[id]`
`TEAM_MANAGER`(리더) 또는 `ADMIN`.

### `POST /api/teams/[id]/join-requests`
`MEMBER`(비소속) — `{ "message": "..." }` → `201`.
### `GET /api/teams/[id]/join-requests`
`TEAM_MANAGER` — 대기 신청 목록.
### `PATCH /api/teams/[id]/join-requests/[requestId]`
`TEAM_MANAGER` — `{ "action": "accept"|"reject" }`. 수락 시 신청자의 기존 `team_id`가 있으면 자동 탈퇴 처리 후 신규 팀 편입.

### `POST /api/teams/[id]/invitations`
`TEAM_MANAGER` — `{ "inviteeId": "uuid", "message": "..." }`. 이미 팀원/이미 초대됨 `409`.
### `GET /api/teams/[id]/invitations`
`TEAM_MANAGER` — 보낸 초대 목록.

### `POST /api/teams/[id]/leave`
`MEMBER`(팀원) — 팀장은 `400`(먼저 위임 필요). 부팀장 탈퇴 시 부팀장 자리 자동 공석.
### `DELETE /api/teams/[id]/members/[userId]`
`TEAM_MANAGER` — 팀원 강퇴.

### `POST /api/teams/[id]/activation-requests`
`TEAM_MANAGER`(리더) — `{ "note": "..." }`. 이미 대기 중이면 `409`.
### `DELETE /api/teams/[id]/activation-requests/pending`
`TEAM_MANAGER`(리더) — 대기 신청 취소.

---

## 5. 타임테이블 (Timetable)

### `GET /api/timetable/terms`
`MEMBER` — 현재+예정 학기/방학 목록, 예약 오픈 상태 포함.
```json
{ "terms": [{ "id","type","label","start","end","bookingOpen": true, "opensAt": null }] }
```
### `GET /api/timetable/hours`
`MEMBER` — `room_hours_config` 2행.
### `GET /api/timetable/events?termId=`
`MEMBER` — 해당 기간의 휴무/행사 목록.
### `GET /api/timetable/bookings?termId=`
`MEMBER` — 정기예약 템플릿 + 해당 term 범위의 단발예약 병합 응답.
```json
{ "templates": [{ "id","teamId","dayOfWeek","startHour","lengthHours" }], "oneoffs": [{ "id","teamId","date","startHour","lengthHours" }] }
```
### `POST /api/timetable/bookings`
`TEAM_MANAGER`(자기 팀만) — `{ "teamId","kind":"regular"|"oneoff","termId?","dayOfWeek?","date?","startHour","lengthHours" }`. `kind='regular'`이면 `termId+dayOfWeek` 필수, `'oneoff'`면 `date` 필수. 겹침 검증 후 `201`.
### `PATCH /api/timetable/bookings/[id]`
`TEAM_MANAGER`(자기 팀 예약만) — 시작/종료 조정. 정기예약은 `?scope=week|all` 쿼리로 적용 범위 지정.
### `DELETE /api/timetable/bookings/[id]?scope=week|all`
`TEAM_MANAGER`(자기 팀 예약만) 또는 `ADMIN`.

---

## 6. 공지 (Notices)

### `GET /api/notices?kind=admin|user&tag=&page=`
`MEMBER`.
### `POST /api/notices`
`kind='user'`면 `MEMBER`, `kind='admin'`이면 `ADMIN`.
```json
{ "kind","tag","title","body","rich":false,"pinned":false,"images":[{"url","name"}] }
```
### `GET /api/notices/[id]`
`MEMBER` — 조회 시 `views += 1`, `kind='admin'`이면 `notice_reads` upsert.
### `PATCH /api/notices/[id]`
작성자 본인(`SELF`) 또는 `ADMIN`. `kind` 변경 불가.
### `DELETE /api/notices/[id]`
작성자 본인 또는 `ADMIN`.
### `GET /api/notices/[id]/reads`
`ADMIN` 또는 작성자 본인 — 읽음 인원 목록(`kind='admin'`만 의미 있음).

### `GET /api/notices/[id]/comments`
`MEMBER`(해당 공지가 `kind='user'`일 때만 존재).
### `POST /api/notices/[id]/comments`
`MEMBER` — `{ "body" }`.
### `DELETE /api/notices/[id]/comments/[commentId]`
작성자 본인만.
### `POST /api/notices/[id]/comments/[commentId]/replies`
`MEMBER` — `{ "body", "parentReplyId": "uuid|null" }`.
### `DELETE /api/notices/[id]/comments/[commentId]/replies/[replyId]`
작성자 본인만(하위 답글 cascade 삭제).

### `GET /api/references`
`MEMBER` — 상시 안내 목록(`secret` 필드는 값 자체는 내려주되 클라이언트가 마스킹 표시).
### `POST /api/references` / `PATCH /api/references/[id]` / `DELETE /api/references/[id]`
`ADMIN`.

---

## 7. 신고 (Reports)

### `POST /api/reports`
`MEMBER` — `{ "category","title","body","anonymous":true }` → `201`, `status` 항상 `'received'`로 서버가 고정.
### `GET /api/reports/me`
`SELF` — 내 신고 내역.
### `GET /api/reports`
`ADMIN` — 전체 큐. `anonymous=true` 항목은 `reporter` 필드를 응답에서 생략(값은 DB에 있으나 API가 마스킹).
쿼리: `status=`.
### `PATCH /api/reports/[id]`
`ADMIN` — `{ "status": "received"|"reviewing"|"resolved"|"rejected", "reply?": "..." }`. `resolved`/`rejected`는 `reply` 없이도 허용되나 UI상 권장. 변경 시 신고자에게 알림 발송.

---

## 8. 알림 (Notifications)

### `GET /api/notifications?filter=all|unread|<type>`
`SELF` — `recipient_id = 현재 사용자`로 자동 스코프.
### `PATCH /api/notifications/[id]/read`
`SELF`.
### `POST /api/notifications/read-all`
`SELF`.
> 알림 생성 엔드포인트는 없음 — 각 도메인 액션(공지 작성, 신고 상태 변경, 팀 초대 등) 처리 시 서버가 내부적으로 `notifications` INSERT.

---

## 9. 운영진 연혁 (Officers)

### `GET /api/officers/history?role=회장|부회장|총무`
`MEMBER`.
### `POST /api/officers/history` / `PATCH /api/officers/history/[id]` / `DELETE /api/officers/history/[id]`
`ADMIN`.
### `GET /api/officers/generation-leaders`
`MEMBER`.
### `PATCH /api/officers/generation-leaders/[gen]`
`ADMIN` — `{ "memberId": "uuid|null" }`.

---

## 10. 관리자 — 모집/면접/지원자

### `GET /api/admin/recruitment` / `PATCH /api/admin/recruitment`
`ADMIN` — 모집 설정 조회/저장(단일 row upsert).

### `GET /api/admin/interview-slots`
`ADMIN` — 정원/확정인원/희망인원 포함.
### `POST /api/admin/interview-slots`
`ADMIN` — `{ "date","start","end","capacity","note?" }`.
### `DELETE /api/admin/interview-slots/[id]`
`ADMIN` — 배정된 지원자가 있으면 `409`(선 배정 해제 요구) 또는 정책에 따라 강제 해제 후 삭제(구현 시 확정).

### `GET /api/admin/applications?status=`
`ADMIN`.
### `POST /api/admin/applications/[id]/assign-slot`
`ADMIN` — `{ "slotId": "uuid" }` — 정원 초과 시 `409`. → `status='interview'`.
### `POST /api/admin/applications/[id]/cancel-interview`
`ADMIN` → `status='new'`, 슬롯 정원 반환.
### `POST /api/admin/applications/[id]/decision`
`ADMIN` — `{ "result": "pass"|"fail" }`. `pass` 시 서버가 `users` 레코드 생성 트랜잭션 수행.
### `POST /api/admin/applications/[id]/revert-decision`
`ADMIN` → 이전 단계로 복귀(슬롯 유무에 따라 `interview`|`new`).
### `POST /api/admin/applications/[id]/notify`
`ADMIN` — `{ "notified": true|false }`(인앱 알림 발송 트리거 겸 플래그 갱신).

---

## 11. 관리자 — 부원 / 팀 활성화 / CSV

### `PATCH /api/admin/members/[id]/status`
`ADMIN` — `{ "status","reason" }`. 대상이 `SUPER_ADMIN`이거나 본인이면 `403`.
### `POST /api/admin/members/[id]/warnings` / `GET .../warnings` / `DELETE /api/admin/members/[id]/warnings/[warningId]`
`ADMIN`.
### `PATCH /api/admin/members/[id]/whitelist`
`ADMIN` — `{ "whitelist": true|false }`.
### `PATCH /api/admin/members/[id]/role`
`ADMIN` — `{ "role": "ADMIN"|null }`(승격/강등).
### `PATCH /api/admin/members/[id]/officer-title`
`ADMIN` — `{ "title": "회장"|"부회장"|"총무"|null }`(동일 직책 기존 보유자는 서버가 자동 해제).
### `POST /api/admin/members/bulk`
`ADMIN` — `{ "memberIds": [...], "action": "whitelist_on"|"whitelist_off"|"warn"|"suspend"|"reinstate"|"withdraw", "reason?" }`.

### `GET /api/admin/teams/activation-requests?status=pending`
`ADMIN`.
### `PATCH /api/admin/teams/activation-requests/[id]`
`ADMIN` — `{ "action": "approve"|"reject" }`.
### `POST /api/admin/teams/activation-requests/bulk`
`ADMIN` — `{ "ids": [...], "action": "approve"|"reject" }`.
### `PATCH /api/admin/teams/[id]/active`
`ADMIN` — `{ "isActive": true|false }`(신청 절차 생략, 대기 신청 자동 취소).

### `POST /api/admin/members/import`
`ADMIN` — `multipart/form-data`(CSV). 응답:
```json
{ "imported": 15, "duplicates": 2, "errors": ["3행: 학과 누락"] }
```

---

## 12. 관리자 — 타임테이블 설정

### `GET /api/admin/timetable/terms` / `POST` / `PATCH /[id]` / `DELETE /[id]`
`ADMIN`.
### `PATCH /api/admin/timetable/hours`
`ADMIN` — `{ "semester": HourConfig, "vacation": HourConfig }`.
### `GET /api/admin/timetable/events` / `POST` / `PATCH /[id]` / `DELETE /[id]`
`ADMIN`.

---

## 13. 미구현 / 설계 보류 항목

| 항목 | 비고 |
|---|---|
| FCM 웹 푸시 발송 API | PWA 구축 완료 후 진행(운영 방침 확정) — 그 전까지 `notifications` 테이블 인앱 알림만 |
| 신고 첨부파일 업로드 | 스토리지 버킷 설계 필요(Supabase Storage) |
| 공지 이미지 업로드 용량/개수 제한 | 정책 확정 필요 |
| 면접 슬롯 삭제 시 배정자 처리 정책 | 강제 해제 vs 삭제 차단, 운영 정책 확정 필요 |
| 팀 삭제 시 이력 보존 방식 | soft delete vs 스냅샷, 확정 필요 |
| `audit_logs` 실제 스키마 확인 | 원격 Supabase 프로젝트에 이미 존재할 가능성 — `supabase db pull`로 대조 필요 |
