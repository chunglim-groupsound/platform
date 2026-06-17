-- 1. school_year_status enum 생성
-- 2. users.school_year int → school_year_status enum 변환
-- 3. users.auth_key 컬럼 추가
-- 4. reports 테이블 신규 생성 + RLS

-- ── 1. school_year_status enum ───────────────────────────────────────────────

CREATE TYPE public.school_year_status AS ENUM (
  'YEAR_1',
  'YEAR_2',
  'YEAR_3',
  'YEAR_4',
  'YEAR_5',
  'COMPLETED',
  'ON_LEAVE',
  'GRADUATED'
);

-- ── 2. users.school_year: int → school_year_status ──────────────────────────

ALTER TABLE public.users
  ADD COLUMN school_year_new public.school_year_status;

UPDATE public.users SET school_year_new = CASE school_year
  WHEN 1 THEN 'YEAR_1'::public.school_year_status
  WHEN 2 THEN 'YEAR_2'::public.school_year_status
  WHEN 3 THEN 'YEAR_3'::public.school_year_status
  WHEN 4 THEN 'YEAR_4'::public.school_year_status
  WHEN 5 THEN 'YEAR_5'::public.school_year_status
  ELSE NULL
END;

ALTER TABLE public.users DROP COLUMN school_year;
ALTER TABLE public.users RENAME COLUMN school_year_new TO school_year;

-- ── 3. users.auth_key 컬럼 추가 ──────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS auth_key text UNIQUE;

-- ── 4. report_category / report_status enum 생성 ─────────────────────────────

CREATE TYPE public.report_category AS ENUM (
  'BUG',
  'OPINION',
  'COMPLAINT',
  'OTHER'
);

CREATE TYPE public.report_status AS ENUM (
  'PENDING',
  'REVIEWED',
  'RESOLVED'
);

-- ── 5. reports 테이블 생성 ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  category     public.report_category NOT NULL,
  title        text NOT NULL,
  body         text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  status       public.report_status NOT NULL DEFAULT 'PENDING',
  admin_note   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz
);

-- ── 6. get_my_user_id() 함수 (없을 경우 생성) ────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_user_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE SECURITY DEFINER
AS $$
  SELECT id
  FROM public.users
  WHERE id = auth.uid()
     OR linked_auth_id = auth.uid()
  LIMIT 1;
$$;

-- ── 7. RLS 활성화 + 정책 ──────────────────────────────────────────────────────

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 로그인 사용자는 제출 가능
CREATE POLICY reports_insert ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (
    is_anonymous = true
    OR user_id = public.get_my_user_id()
  );

-- 본인 제출 건(비익명) 조회 가능
CREATE POLICY reports_select_own ON public.reports
  FOR SELECT TO authenticated
  USING (
    is_anonymous = false
    AND user_id = public.get_my_user_id()
  );

-- 운영진: 전체 조회 + 수정
CREATE POLICY reports_admin_all ON public.reports
  FOR ALL TO authenticated
  USING (
    public.get_my_role() = ANY (ARRAY['ADMIN'::public.member_role, 'SUPER_ADMIN'::public.member_role])
  )
  WITH CHECK (
    public.get_my_role() = ANY (ARRAY['ADMIN'::public.member_role, 'SUPER_ADMIN'::public.member_role])
  );
