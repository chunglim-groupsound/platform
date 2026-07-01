-- 청림그룹사운드 플랫폼 초기 스키마 (document/spec/ERD_명세서.md 기준)
-- 그린필드 마이그레이션 — 이전 마이그레이션(20260701174328)에서 원격 스키마를 전부 비운 상태에서 새로 작성.

-- ============================================================
-- 1. Enum 타입
-- ============================================================

create type public.member_status as enum ('PROBATION', 'ACTIVE', 'INACTIVE', 'WITHDRAWN');
create type public.member_role as enum ('ADMIN', 'SUPER_ADMIN');
create type public.officer_title as enum ('회장', '부회장', '총무');
create type public.team_role as enum ('leader', 'vice', 'member');
create type public.request_status as enum ('pending', 'approved', 'rejected');
create type public.invite_status as enum ('pending', 'accepted', 'rejected');
create type public.application_status as enum ('new', 'interview', 'pass', 'fail');
create type public.notice_kind as enum ('admin', 'user');
create type public.report_category as enum ('conduct', 'gear', 'noshow', 'suggest', 'etc');
create type public.report_status as enum ('received', 'reviewing', 'resolved', 'rejected');
create type public.notification_type as enum ('notice', 'comment', 'team', 'report', 'schedule', 'system');
create type public.term_type as enum ('semester', 'vacation');
create type public.booking_kind as enum ('regular', 'oneoff');
create type public.event_kind as enum ('closed', 'event');

-- ============================================================
-- 2. teams / users
-- ============================================================

create table public.teams (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    hue text,
    description text,
    current_song text,
    is_recruiting boolean not null default false,
    is_active boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.users (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid references auth.users (id) on delete set null,
    kakao_id text unique,
    name text not null,
    nick text,
    gen int,
    session text[],
    session_experience jsonb not null default '{}'::jsonb,
    genres text[],
    dept text,
    student_id text,
    school_year text,
    phone text,
    phone_private boolean not null default false,
    avatar_source text not null default 'default' check (avatar_source in ('kakao', 'default')),
    bio text,
    status public.member_status not null default 'PROBATION',
    role public.member_role,
    admin_role public.officer_title,
    team_id uuid references public.teams (id) on delete set null,
    team_role public.team_role,
    whitelist boolean not null default false,
    privacy_settings jsonb not null default '{}'::jsonb,
    probation_started_at timestamptz,
    joined_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint users_admin_role_requires_admin check (admin_role is null or role in ('ADMIN', 'SUPER_ADMIN')),
    constraint users_team_role_requires_team check (team_id is not null or team_role is null),
    constraint users_auth_user_id_unique unique (auth_user_id)
);

create unique index users_admin_role_unique_idx on public.users (admin_role) where admin_role is not null;
create index users_team_id_idx on public.users (team_id);
create index users_status_idx on public.users (status);
create index users_gen_idx on public.users (gen);

-- ============================================================
-- 3. 팀 활성화 / 가입 / 초대
-- ============================================================

create table public.team_activation_requests (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.teams (id) on delete cascade,
    requested_by uuid not null references public.users (id),
    note text,
    status public.request_status not null default 'pending',
    requested_at timestamptz not null default now(),
    decided_at timestamptz,
    decided_by uuid references public.users (id)
);

create unique index team_activation_requests_pending_unique_idx
    on public.team_activation_requests (team_id) where status = 'pending';
create index team_activation_requests_team_id_idx on public.team_activation_requests (team_id);

create table public.team_join_requests (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.teams (id) on delete cascade,
    applicant_id uuid not null references public.users (id) on delete cascade,
    message text,
    status public.invite_status not null default 'pending',
    created_at timestamptz not null default now(),
    decided_at timestamptz
);

create index team_join_requests_team_id_idx on public.team_join_requests (team_id);
create index team_join_requests_applicant_id_idx on public.team_join_requests (applicant_id);

create table public.team_invitations (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.teams (id) on delete cascade,
    invitee_id uuid not null references public.users (id) on delete cascade,
    invited_by uuid not null references public.users (id),
    message text,
    status public.invite_status not null default 'pending',
    created_at timestamptz not null default now(),
    decided_at timestamptz
);

create index team_invitations_team_id_idx on public.team_invitations (team_id);
create index team_invitations_invitee_id_idx on public.team_invitations (invitee_id);

-- ============================================================
-- 4. 경고 / 운영진 연혁
-- ============================================================

create table public.member_warnings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users (id) on delete cascade,
    reason text not null,
    issued_by uuid not null references public.users (id),
    created_at timestamptz not null default now()
);

create index member_warnings_user_id_idx on public.member_warnings (user_id);

create table public.officer_history (
    id uuid primary key default gen_random_uuid(),
    role public.officer_title not null,
    year text not null,
    member_id uuid references public.users (id) on delete set null,
    name text not null,
    gen int
);

create table public.generation_leaders (
    gen int primary key,
    member_id uuid references public.users (id) on delete set null,
    name text not null
);

-- ============================================================
-- 5. 가입 지원 / 면접
-- ============================================================

create table public.interview_slots (
    id uuid primary key default gen_random_uuid(),
    slot_date date not null,
    start_time time not null,
    end_time time not null,
    capacity int not null default 1,
    note text,
    created_by uuid not null references public.users (id),
    created_at timestamptz not null default now()
);

create table public.applications (
    id uuid primary key default gen_random_uuid(),
    kakao_id text not null,
    name text not null,
    nick text,
    session text[],
    session_experience jsonb not null default '{}'::jsonb,
    genres text[],
    dept text,
    student_id text,
    school_year text,
    phone text,
    message text,
    avatar_source text,
    status public.application_status not null default 'new',
    slot_id uuid references public.interview_slots (id),
    notified boolean not null default false,
    notified_at timestamptz,
    applied_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index applications_slot_id_idx on public.applications (slot_id);
create index applications_status_idx on public.applications (status);

create table public.application_slot_preferences (
    id uuid primary key default gen_random_uuid(),
    application_id uuid not null references public.applications (id) on delete cascade,
    slot_id uuid not null references public.interview_slots (id) on delete cascade,
    unique (application_id, slot_id)
);

create index application_slot_preferences_slot_id_idx on public.application_slot_preferences (slot_id);

create table public.recruitment_settings (
    id uuid primary key default gen_random_uuid(),
    is_open boolean not null default false,
    semester text,
    headline text,
    body text,
    sessions text[],
    period_start date,
    period_end date,
    closed_note text,
    updated_by uuid references public.users (id),
    updated_at timestamptz not null default now()
);

create unique index recruitment_settings_singleton_idx on public.recruitment_settings ((true));

-- ============================================================
-- 6. 공지
-- ============================================================

create table public.notices (
    id uuid primary key default gen_random_uuid(),
    kind public.notice_kind not null,
    tag text,
    pinned boolean not null default false,
    author_id uuid not null references public.users (id),
    title text not null,
    body text,
    rich boolean not null default false,
    views int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index notices_kind_pinned_created_at_idx on public.notices (kind, pinned, created_at desc);

create table public.notice_images (
    id uuid primary key default gen_random_uuid(),
    notice_id uuid not null references public.notices (id) on delete cascade,
    url text not null,
    name text,
    ord int not null default 0
);

create index notice_images_notice_id_idx on public.notice_images (notice_id);

create table public.notice_comments (
    id uuid primary key default gen_random_uuid(),
    notice_id uuid not null references public.notices (id) on delete cascade,
    author_id uuid not null references public.users (id),
    body text not null,
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);

create index notice_comments_notice_id_idx on public.notice_comments (notice_id);

create table public.notice_replies (
    id uuid primary key default gen_random_uuid(),
    comment_id uuid not null references public.notice_comments (id) on delete cascade,
    parent_reply_id uuid references public.notice_replies (id) on delete cascade,
    author_id uuid not null references public.users (id),
    body text not null,
    created_at timestamptz not null default now(),
    deleted_at timestamptz
);

create index notice_replies_comment_id_idx on public.notice_replies (comment_id);
create index notice_replies_parent_reply_id_idx on public.notice_replies (parent_reply_id);

create table public.notice_reads (
    notice_id uuid not null references public.notices (id) on delete cascade,
    user_id uuid not null references public.users (id) on delete cascade,
    read_at timestamptz not null default now(),
    primary key (notice_id, user_id)
);

create table public.references_info (
    id uuid primary key default gen_random_uuid(),
    icon text,
    label text not null,
    value text,
    secret boolean not null default false,
    note text,
    ord int not null default 0,
    updated_at timestamptz not null default now()
);

-- ============================================================
-- 7. 신고 / 알림
-- ============================================================

create table public.reports (
    id uuid primary key default gen_random_uuid(),
    category public.report_category not null,
    title text not null,
    body text,
    anonymous boolean not null default false,
    reporter_id uuid not null references public.users (id),
    status public.report_status not null default 'received',
    reply text,
    reply_author_id uuid references public.users (id),
    reply_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index reports_reporter_id_idx on public.reports (reporter_id);
create index reports_status_idx on public.reports (status);

create table public.notifications (
    id uuid primary key default gen_random_uuid(),
    recipient_id uuid not null references public.users (id) on delete cascade,
    type public.notification_type not null,
    title text not null,
    body text,
    target_screen text,
    target_params jsonb,
    read boolean not null default false,
    created_at timestamptz not null default now()
);

create index notifications_recipient_id_read_created_at_idx
    on public.notifications (recipient_id, read, created_at desc);

-- ============================================================
-- 8. 타임테이블
-- ============================================================

create table public.terms (
    id uuid primary key default gen_random_uuid(),
    type public.term_type not null,
    label text not null,
    start_date date not null,
    end_date date not null,
    book_open_date date,
    book_open_time time,
    created_at timestamptz not null default now()
);

create table public.room_hours_config (
    type public.term_type primary key,
    weekday_open int not null,
    weekday_close int not null,
    weekend_open int not null,
    weekend_close int not null
);

create table public.booking_templates (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.teams (id) on delete cascade,
    term_id uuid not null references public.terms (id) on delete cascade,
    day_of_week int not null check (day_of_week between 0 and 6),
    start_hour int not null,
    length_hours int not null,
    created_by uuid not null references public.users (id),
    created_at timestamptz not null default now()
);

create index booking_templates_term_id_day_of_week_idx on public.booking_templates (term_id, day_of_week);

create table public.bookings (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.teams (id) on delete cascade,
    booking_date date not null,
    start_hour int not null,
    length_hours int not null,
    kind public.booking_kind not null default 'oneoff',
    created_by uuid not null references public.users (id),
    created_at timestamptz not null default now()
);

create index bookings_booking_date_start_hour_idx on public.bookings (booking_date, start_hour);

create table public.calendar_events (
    id uuid primary key default gen_random_uuid(),
    kind public.event_kind not null,
    label text not null,
    start_date date not null,
    end_date date not null,
    all_day boolean not null default true,
    start_hour int,
    end_hour int,
    note text,
    created_by uuid not null references public.users (id),
    created_at timestamptz not null default now()
);

-- ============================================================
-- 9. 감사 로그
-- ============================================================

create table public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    target_table text not null,
    target_id uuid,
    action text not null,
    before jsonb,
    after jsonb,
    actor_id uuid references public.users (id),
    created_at timestamptz not null default now()
);

create index audit_logs_target_table_target_id_idx on public.audit_logs (target_table, target_id);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
