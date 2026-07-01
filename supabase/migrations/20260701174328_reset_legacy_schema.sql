-- 과거 백엔드 구현 스캐폴딩 전체 제거 (2026-07-02)
-- 원격 프로젝트에 남아있던 23개 테이블은 전부 0행(데이터 없음)이었고,
-- 신규 작성된 document/spec/ERD_명세서.md와 테이블/컬럼/enum 체계가 달라 재설계하기로 결정.
-- 이 마이그레이션 이후 새 ERD 기준 스키마를 처음부터 다시 생성한다.

drop trigger if exists on_auth_user_created on auth.users;

drop view if exists public.probation_expiry cascade;

drop table if exists public.audit_logs cascade;
drop table if exists public.booking_exceptions cascade;
drop table if exists public.bookings cascade;
drop table if exists public.interview_preferences cascade;
drop table if exists public.interview_slots cascade;
drop table if exists public.join_applications cascade;
drop table if exists public.member_history cascade;
drop table if exists public.member_warnings cascade;
drop table if exists public.notice_comments cascade;
drop table if exists public.notices cascade;
drop table if exists public.notifications cascade;
drop table if exists public.recruitment_periods cascade;
drop table if exists public.reference_items cascade;
drop table if exists public.reports cascade;
drop table if exists public.team_activation_requests cascade;
drop table if exists public.team_invitations cascade;
drop table if exists public.team_join_requests cascade;
drop table if exists public.team_members cascade;
drop table if exists public.teams cascade;
drop table if exists public.timetable_events cascade;
drop table if exists public.timetable_hours cascade;
drop table if exists public.timetable_terms cascade;
drop table if exists public.users cascade;

drop function if exists public.get_my_role() cascade;
drop function if exists public.get_my_status() cascade;
drop function if exists public.get_my_user_id() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.increment_notice_views(uuid) cascade;
drop function if exists public.transition_member_status(uuid, public.member_status, uuid, text) cascade;
drop function if exists public.update_updated_at() cascade;
drop function if exists public.validate_status_transition(public.member_status, public.member_status) cascade;

drop type if exists public.activation_status cascade;
drop type if exists public.booking_kind cascade;
drop type if exists public.event_kind cascade;
drop type if exists public.interview_result cascade;
drop type if exists public.member_role cascade;
drop type if exists public.member_status cascade;
drop type if exists public.notice_kind cascade;
drop type if exists public.notification_type cascade;
drop type if exists public.report_category cascade;
drop type if exists public.report_status cascade;
drop type if exists public.request_status cascade;
drop type if exists public.school_year_status cascade;
drop type if exists public.term_type cascade;
