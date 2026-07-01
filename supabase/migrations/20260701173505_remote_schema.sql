


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."activation_status" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE "public"."activation_status" OWNER TO "postgres";


CREATE TYPE "public"."booking_kind" AS ENUM (
    'REGULAR',
    'ONEOFF'
);


ALTER TYPE "public"."booking_kind" OWNER TO "postgres";


CREATE TYPE "public"."event_kind" AS ENUM (
    'CLOSED',
    'EVENT'
);


ALTER TYPE "public"."event_kind" OWNER TO "postgres";


CREATE TYPE "public"."interview_result" AS ENUM (
    'PENDING',
    'PASS',
    'FAIL'
);


ALTER TYPE "public"."interview_result" OWNER TO "postgres";


CREATE TYPE "public"."member_role" AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'MEMBER',
    'PROBATION_MEMBER'
);


ALTER TYPE "public"."member_role" OWNER TO "postgres";


CREATE TYPE "public"."member_status" AS ENUM (
    'PENDING',
    'INTERVIEWING',
    'PROBATION',
    'ACTIVE',
    'INACTIVE',
    'WITHDRAWN'
);


ALTER TYPE "public"."member_status" OWNER TO "postgres";


CREATE TYPE "public"."notice_kind" AS ENUM (
    'ADMIN',
    'USER'
);


ALTER TYPE "public"."notice_kind" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'NOTICE',
    'COMMENT',
    'TEAM',
    'REPORT',
    'SCHEDULE',
    'SYSTEM'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."report_category" AS ENUM (
    'CONDUCT',
    'GEAR',
    'NOSHOW',
    'SUGGEST',
    'OTHER'
);


ALTER TYPE "public"."report_category" OWNER TO "postgres";


CREATE TYPE "public"."report_status" AS ENUM (
    'RECEIVED',
    'REVIEWING',
    'RESOLVED',
    'REJECTED'
);


ALTER TYPE "public"."report_status" OWNER TO "postgres";


CREATE TYPE "public"."request_status" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED'
);


ALTER TYPE "public"."request_status" OWNER TO "postgres";


CREATE TYPE "public"."school_year_status" AS ENUM (
    'YEAR_1',
    'YEAR_2',
    'YEAR_3',
    'YEAR_4',
    'YEAR_5',
    'COMPLETED',
    'ON_LEAVE',
    'GRADUATED'
);


ALTER TYPE "public"."school_year_status" OWNER TO "postgres";


CREATE TYPE "public"."term_type" AS ENUM (
    'SEMESTER',
    'VACATION'
);


ALTER TYPE "public"."term_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "public"."member_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM users WHERE linked_auth_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_status"() RETURNS "public"."member_status"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT status FROM users WHERE linked_auth_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_user_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT id FROM users WHERE linked_auth_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_notice_views"("notice_id" "uuid") RETURNS "void"
    LANGUAGE "sql"
    AS $$
  UPDATE notices SET views = views + 1 WHERE id = notice_id;
$$;


ALTER FUNCTION "public"."increment_notice_views"("notice_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."transition_member_status"("p_user_id" "uuid", "p_to_status" "public"."member_status", "p_changed_by" "uuid" DEFAULT NULL::"uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_from_status member_status;
  v_result      jsonb;
BEGIN
  SELECT status INTO v_from_status FROM users WHERE id = p_user_id;

  IF NOT validate_status_transition(v_from_status, p_to_status) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_transition');
  END IF;

  UPDATE users SET status = p_to_status, updated_at = now() WHERE id = p_user_id;

  INSERT INTO member_history (user_id, from_status, to_status, changed_by, reason)
  VALUES (p_user_id, v_from_status, p_to_status, p_changed_by, p_reason);

  RETURN jsonb_build_object('ok', true);
END;
$$;


ALTER FUNCTION "public"."transition_member_status"("p_user_id" "uuid", "p_to_status" "public"."member_status", "p_changed_by" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_status_transition"("from_status" "public"."member_status", "to_status" "public"."member_status") RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    AS $$
  SELECT CASE
    WHEN from_status = 'PENDING'      AND to_status IN ('INTERVIEWING') THEN true
    WHEN from_status = 'INTERVIEWING' AND to_status IN ('PROBATION', 'WITHDRAWN') THEN true
    WHEN from_status = 'PROBATION'    AND to_status IN ('ACTIVE', 'INACTIVE', 'WITHDRAWN') THEN true
    WHEN from_status = 'ACTIVE'       AND to_status IN ('INACTIVE', 'WITHDRAWN') THEN true
    WHEN from_status = 'INACTIVE'     AND to_status IN ('ACTIVE', 'WITHDRAWN') THEN true
    ELSE false
  END;
$$;


ALTER FUNCTION "public"."validate_status_transition"("from_status" "public"."member_status", "to_status" "public"."member_status") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "target_table" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "before" "jsonb",
    "after" "jsonb",
    "actor_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_exceptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "exception_date" "date" NOT NULL,
    "reason" "text",
    "cancelled_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."booking_exceptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "day_of_week" integer,
    "specific_date" "date",
    "start_hour" integer NOT NULL,
    "length_hours" integer NOT NULL,
    "kind" "public"."booking_kind" NOT NULL,
    "term_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "application_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "slot_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."interview_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slot_at" timestamp with time zone NOT NULL,
    "capacity" integer DEFAULT 1 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."interview_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."join_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "self_intro" "text",
    "motivation" "text",
    "confirmed_slot_id" "uuid",
    "interview_result" "public"."interview_result" DEFAULT 'PENDING'::"public"."interview_result" NOT NULL,
    "admin_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."join_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "from_status" "public"."member_status",
    "to_status" "public"."member_status" NOT NULL,
    "changed_by" "uuid",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."member_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_warnings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "issued_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."member_warnings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notice_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "notice_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notice_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kind" "public"."notice_kind" NOT NULL,
    "tag" "text",
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "images" "jsonb",
    "pinned" boolean DEFAULT false NOT NULL,
    "views" integer DEFAULT 0 NOT NULL,
    "author_id" "uuid",
    "is_officer_post" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "link" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "linked_auth_id" "uuid",
    "auth_key" "text",
    "name" "text" NOT NULL,
    "nickname" "text",
    "bio" "text",
    "generation" integer,
    "session" "text"[],
    "session_years" "jsonb",
    "profile_image_url" "text",
    "genre_preference" "text"[],
    "phone" "text",
    "department" "text",
    "student_id" "text",
    "school_year" "public"."school_year_status",
    "status" "public"."member_status" DEFAULT 'PENDING'::"public"."member_status" NOT NULL,
    "role" "public"."member_role" DEFAULT 'PROBATION_MEMBER'::"public"."member_role" NOT NULL,
    "admin_role" "text",
    "is_whitelist" boolean DEFAULT false NOT NULL,
    "privacy_settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "privacy_agreed_at" timestamp with time zone,
    "probation_started_at" timestamp with time zone,
    "activated_at" timestamp with time zone,
    "last_active_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "kakao_id" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."probation_expiry" AS
 SELECT "id",
    "name",
    "generation",
    "session",
    "probation_started_at",
    ("probation_started_at" + '30 days'::interval) AS "expires_at",
    (EXTRACT(day FROM (("probation_started_at" + '30 days'::interval) - "now"())))::integer AS "remaining_days"
   FROM "public"."users"
  WHERE ("status" = 'PROBATION'::"public"."member_status");


ALTER VIEW "public"."probation_expiry" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recruitment_periods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "is_open" boolean DEFAULT false NOT NULL,
    "open_at" timestamp with time zone NOT NULL,
    "close_at" timestamp with time zone NOT NULL,
    "headline" "text",
    "description" "text",
    "preferred_sessions" "text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."recruitment_periods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reference_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "icon" "text" NOT NULL,
    "label" "text" NOT NULL,
    "value" "text" NOT NULL,
    "is_secret" boolean DEFAULT false NOT NULL,
    "note" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reference_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "category" "public"."report_category" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "is_anonymous" boolean DEFAULT false NOT NULL,
    "status" "public"."report_status" DEFAULT 'RECEIVED'::"public"."report_status" NOT NULL,
    "admin_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_activation_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "requested_by" "uuid",
    "note" "text",
    "status" "public"."activation_status" DEFAULT 'PENDING'::"public"."activation_status" NOT NULL,
    "decided_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."team_activation_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "invitee_id" "uuid" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "message" "text",
    "status" "public"."request_status" DEFAULT 'PENDING'::"public"."request_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."team_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_join_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "applicant_id" "uuid" NOT NULL,
    "message" "text",
    "status" "public"."request_status" DEFAULT 'PENDING'::"public"."request_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."team_join_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_in_team" "text"[],
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "hue" "text",
    "leader_id" "uuid",
    "vice_leader_id" "uuid",
    "current_song" "text",
    "description" "text",
    "is_active" boolean DEFAULT false NOT NULL,
    "is_recruiting" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timetable_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "kind" "public"."event_kind" NOT NULL,
    "label" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "all_day" boolean DEFAULT true NOT NULL,
    "start_time" integer,
    "end_time" integer,
    "note" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."timetable_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timetable_hours" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "term_type" "public"."term_type" NOT NULL,
    "weekday_open" integer NOT NULL,
    "weekday_close" integer NOT NULL,
    "weekend_open" integer NOT NULL,
    "weekend_close" integer NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."timetable_hours" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timetable_terms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."term_type" NOT NULL,
    "label" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "book_open_date" "date",
    "book_open_time" time without time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."timetable_terms" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_exceptions"
    ADD CONSTRAINT "booking_exceptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_preferences"
    ADD CONSTRAINT "interview_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_slots"
    ADD CONSTRAINT "interview_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."join_applications"
    ADD CONSTRAINT "join_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."join_applications"
    ADD CONSTRAINT "join_applications_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."member_history"
    ADD CONSTRAINT "member_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_warnings"
    ADD CONSTRAINT "member_warnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notice_comments"
    ADD CONSTRAINT "notice_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notices"
    ADD CONSTRAINT "notices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recruitment_periods"
    ADD CONSTRAINT "recruitment_periods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reference_items"
    ADD CONSTRAINT "reference_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_activation_requests"
    ADD CONSTRAINT "team_activation_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_join_requests"
    ADD CONSTRAINT "team_join_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timetable_events"
    ADD CONSTRAINT "timetable_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timetable_hours"
    ADD CONSTRAINT "timetable_hours_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timetable_hours"
    ADD CONSTRAINT "timetable_hours_term_type_key" UNIQUE ("term_type");



ALTER TABLE ONLY "public"."timetable_terms"
    ADD CONSTRAINT "timetable_terms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_key_key" UNIQUE ("auth_key");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_kakao_id_key" UNIQUE ("kakao_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_linked_auth_id_key" UNIQUE ("linked_auth_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."booking_exceptions"
    ADD CONSTRAINT "booking_exceptions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_exceptions"
    ADD CONSTRAINT "booking_exceptions_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "public"."timetable_terms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."interview_preferences"
    ADD CONSTRAINT "interview_preferences_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."join_applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_preferences"
    ADD CONSTRAINT "interview_preferences_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."interview_slots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_preferences"
    ADD CONSTRAINT "interview_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_slots"
    ADD CONSTRAINT "interview_slots_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."join_applications"
    ADD CONSTRAINT "join_applications_confirmed_slot_id_fkey" FOREIGN KEY ("confirmed_slot_id") REFERENCES "public"."interview_slots"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."join_applications"
    ADD CONSTRAINT "join_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_history"
    ADD CONSTRAINT "member_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."member_history"
    ADD CONSTRAINT "member_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_warnings"
    ADD CONSTRAINT "member_warnings_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."member_warnings"
    ADD CONSTRAINT "member_warnings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notice_comments"
    ADD CONSTRAINT "notice_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notice_comments"
    ADD CONSTRAINT "notice_comments_notice_id_fkey" FOREIGN KEY ("notice_id") REFERENCES "public"."notices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notice_comments"
    ADD CONSTRAINT "notice_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."notice_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notices"
    ADD CONSTRAINT "notices_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recruitment_periods"
    ADD CONSTRAINT "recruitment_periods_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."team_activation_requests"
    ADD CONSTRAINT "team_activation_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."team_activation_requests"
    ADD CONSTRAINT "team_activation_requests_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_join_requests"
    ADD CONSTRAINT "team_join_requests_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_join_requests"
    ADD CONSTRAINT "team_join_requests_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_vice_leader_id_fkey" FOREIGN KEY ("vice_leader_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."timetable_events"
    ADD CONSTRAINT "timetable_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_read" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."booking_exceptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "booking_exceptions_select" ON "public"."booking_exceptions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bookings_select" ON "public"."bookings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."interview_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interview_preferences_select" ON "public"."interview_preferences" FOR SELECT TO "authenticated" USING (("auth"."uid"() = ( SELECT "users"."linked_auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "interview_preferences"."user_id"))));



ALTER TABLE "public"."interview_slots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interview_slots_select" ON "public"."interview_slots" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."join_applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "join_applications_select" ON "public"."join_applications" FOR SELECT TO "authenticated" USING (("auth"."uid"() = ( SELECT "users"."linked_auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "join_applications"."user_id"))));



ALTER TABLE "public"."member_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_warnings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notice_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notice_comments_select" ON "public"."notice_comments" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."notices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notices_select" ON "public"."notices" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_select" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("auth"."uid"() = ( SELECT "users"."linked_auth_id"
   FROM "public"."users"
  WHERE ("users"."id" = "notifications"."user_id"))));



ALTER TABLE "public"."recruitment_periods" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recruitment_periods_select" ON "public"."recruitment_periods" FOR SELECT USING (true);



ALTER TABLE "public"."reference_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reference_items_select" ON "public"."reference_items" FOR SELECT TO "authenticated" USING (("is_secret" = false));



ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_activation_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_join_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_members_select" ON "public"."team_members" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teams_select" ON "public"."teams" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."timetable_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "timetable_events_select" ON "public"."timetable_events" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."timetable_hours" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "timetable_hours_select" ON "public"."timetable_hours" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."timetable_terms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "timetable_terms_select" ON "public"."timetable_terms" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_select" ON "public"."users" FOR SELECT TO "authenticated" USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_user_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_user_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_notice_views"("notice_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_notice_views"("notice_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_notice_views"("notice_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."transition_member_status"("p_user_id" "uuid", "p_to_status" "public"."member_status", "p_changed_by" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."transition_member_status"("p_user_id" "uuid", "p_to_status" "public"."member_status", "p_changed_by" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."transition_member_status"("p_user_id" "uuid", "p_to_status" "public"."member_status", "p_changed_by" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_status_transition"("from_status" "public"."member_status", "to_status" "public"."member_status") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_status_transition"("from_status" "public"."member_status", "to_status" "public"."member_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_status_transition"("from_status" "public"."member_status", "to_status" "public"."member_status") TO "service_role";


















GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."booking_exceptions" TO "anon";
GRANT ALL ON TABLE "public"."booking_exceptions" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_exceptions" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."interview_preferences" TO "anon";
GRANT ALL ON TABLE "public"."interview_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."interview_slots" TO "anon";
GRANT ALL ON TABLE "public"."interview_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_slots" TO "service_role";



GRANT ALL ON TABLE "public"."join_applications" TO "anon";
GRANT ALL ON TABLE "public"."join_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."join_applications" TO "service_role";



GRANT ALL ON TABLE "public"."member_history" TO "anon";
GRANT ALL ON TABLE "public"."member_history" TO "authenticated";
GRANT ALL ON TABLE "public"."member_history" TO "service_role";



GRANT ALL ON TABLE "public"."member_warnings" TO "anon";
GRANT ALL ON TABLE "public"."member_warnings" TO "authenticated";
GRANT ALL ON TABLE "public"."member_warnings" TO "service_role";



GRANT ALL ON TABLE "public"."notice_comments" TO "anon";
GRANT ALL ON TABLE "public"."notice_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."notice_comments" TO "service_role";



GRANT ALL ON TABLE "public"."notices" TO "anon";
GRANT ALL ON TABLE "public"."notices" TO "authenticated";
GRANT ALL ON TABLE "public"."notices" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."probation_expiry" TO "anon";
GRANT ALL ON TABLE "public"."probation_expiry" TO "authenticated";
GRANT ALL ON TABLE "public"."probation_expiry" TO "service_role";



GRANT ALL ON TABLE "public"."recruitment_periods" TO "anon";
GRANT ALL ON TABLE "public"."recruitment_periods" TO "authenticated";
GRANT ALL ON TABLE "public"."recruitment_periods" TO "service_role";



GRANT ALL ON TABLE "public"."reference_items" TO "anon";
GRANT ALL ON TABLE "public"."reference_items" TO "authenticated";
GRANT ALL ON TABLE "public"."reference_items" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."team_activation_requests" TO "anon";
GRANT ALL ON TABLE "public"."team_activation_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."team_activation_requests" TO "service_role";



GRANT ALL ON TABLE "public"."team_invitations" TO "anon";
GRANT ALL ON TABLE "public"."team_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."team_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."team_join_requests" TO "anon";
GRANT ALL ON TABLE "public"."team_join_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."team_join_requests" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."timetable_events" TO "anon";
GRANT ALL ON TABLE "public"."timetable_events" TO "authenticated";
GRANT ALL ON TABLE "public"."timetable_events" TO "service_role";



GRANT ALL ON TABLE "public"."timetable_hours" TO "anon";
GRANT ALL ON TABLE "public"."timetable_hours" TO "authenticated";
GRANT ALL ON TABLE "public"."timetable_hours" TO "service_role";



GRANT ALL ON TABLE "public"."timetable_terms" TO "anon";
GRANT ALL ON TABLE "public"."timetable_terms" TO "authenticated";
GRANT ALL ON TABLE "public"."timetable_terms" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


