-- Remove TEAM_LEADER from member_role enum.
-- Team leader status is tracked via teams.leader_id; this enum value is redundant.

-- ── 1. Drop all policies that reference member_role ──────────────────────────

DROP POLICY IF EXISTS audit_logs_admin_select             ON public.audit_logs;
DROP POLICY IF EXISTS users_admin_all                     ON public.users;
DROP POLICY IF EXISTS history_admin_all                   ON public.member_history;
DROP POLICY IF EXISTS applications_admin_all              ON public.join_applications;
DROP POLICY IF EXISTS admin_all                           ON public.member_warnings;
DROP POLICY IF EXISTS teams_admin_all                     ON public.teams;
DROP POLICY IF EXISTS team_members_admin_all              ON public.team_members;
DROP POLICY IF EXISTS team_members_insert                 ON public.team_members;
DROP POLICY IF EXISTS recruitment_periods_admin_all       ON public.recruitment_periods;
DROP POLICY IF EXISTS interview_slots_admin_all           ON public.interview_slots;
DROP POLICY IF EXISTS interview_preferences_admin_select  ON public.interview_preferences;
DROP POLICY IF EXISTS team_join_requests_select           ON public.team_join_requests;
DROP POLICY IF EXISTS team_join_requests_update           ON public.team_join_requests;
DROP POLICY IF EXISTS team_join_requests_delete           ON public.team_join_requests;
DROP POLICY IF EXISTS team_invitations_select             ON public.team_invitations;
DROP POLICY IF EXISTS team_invitations_insert             ON public.team_invitations;

-- ── 2. Drop function whose return type is member_role ────────────────────────

DROP FUNCTION IF EXISTS public.get_my_role();

-- ── 3. Safety: demote any remaining TEAM_LEADER rows to MEMBER ───────────────

UPDATE public.users
SET role = 'MEMBER'
WHERE role = 'TEAM_LEADER';

-- ── 4. Recreate enum without TEAM_LEADER ─────────────────────────────────────

CREATE TYPE public.member_role_new AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'MEMBER',
  'PROBATION_MEMBER'
);

ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.users
  ALTER COLUMN role TYPE public.member_role_new
  USING role::text::public.member_role_new;

DROP TYPE public.member_role;
ALTER TYPE public.member_role_new RENAME TO member_role;

ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'PROBATION_MEMBER'::member_role;

-- ── 5. Recreate get_my_role() ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_role()
  RETURNS member_role
  LANGUAGE sql
  STABLE SECURITY DEFINER
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid()
     OR linked_auth_id = auth.uid()
  LIMIT 1;
$$;

-- ── 6. Recreate all policies ─────────────────────────────────────────────────

CREATE POLICY audit_logs_admin_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (get_my_role() = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role]));

CREATE POLICY users_admin_all ON public.users
  FOR ALL TO authenticated
  USING (get_my_role() = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role]));

CREATE POLICY history_admin_all ON public.member_history
  FOR ALL TO authenticated
  USING (get_my_role() = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role]));

CREATE POLICY applications_admin_all ON public.join_applications
  FOR ALL TO authenticated
  USING (get_my_role() = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role]));

CREATE POLICY admin_all ON public.member_warnings
  FOR ALL TO authenticated
  USING (get_my_role() = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role]))
  WITH CHECK (get_my_role() = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role]));

CREATE POLICY teams_admin_all ON public.teams
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role])
  ));

CREATE POLICY team_members_admin_all ON public.team_members
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role])
  ));

CREATE POLICY team_members_insert ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE (u.id = auth.uid() OR u.linked_auth_id = auth.uid())
        AND u.role = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role])
    )
    OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
        AND t.leader_id = (
          SELECT users.id FROM public.users
          WHERE users.id = auth.uid() OR users.linked_auth_id = auth.uid()
          LIMIT 1
        )
    )
    OR user_id = (
      SELECT users.id FROM public.users
      WHERE users.id = auth.uid() OR users.linked_auth_id = auth.uid()
      LIMIT 1
    )
  );

CREATE POLICY recruitment_periods_admin_all ON public.recruitment_periods
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role])
  ));

CREATE POLICY interview_slots_admin_all ON public.interview_slots
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role])
  ));

CREATE POLICY interview_preferences_admin_select ON public.interview_preferences
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role])
  ));

CREATE POLICY team_join_requests_select ON public.team_join_requests
  FOR SELECT TO authenticated
  USING (
    applicant_id = (
      SELECT users.id FROM public.users
      WHERE users.id = auth.uid() OR users.linked_auth_id = auth.uid()
      LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_join_requests.team_id
        AND t.leader_id = (
          SELECT users.id FROM public.users
          WHERE users.id = auth.uid() OR users.linked_auth_id = auth.uid()
          LIMIT 1
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE (u.id = auth.uid() OR u.linked_auth_id = auth.uid())
        AND u.role = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role])
    )
  );

CREATE POLICY team_join_requests_update ON public.team_join_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_join_requests.team_id
        AND t.leader_id = (
          SELECT users.id FROM public.users
          WHERE users.id = auth.uid() OR users.linked_auth_id = auth.uid()
          LIMIT 1
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE (u.id = auth.uid() OR u.linked_auth_id = auth.uid())
        AND u.role = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role])
    )
  );

CREATE POLICY team_join_requests_delete ON public.team_join_requests
  FOR DELETE TO authenticated
  USING (
    applicant_id = (
      SELECT users.id FROM public.users
      WHERE users.id = auth.uid() OR users.linked_auth_id = auth.uid()
      LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE (u.id = auth.uid() OR u.linked_auth_id = auth.uid())
        AND u.role = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role])
    )
  );

CREATE POLICY team_invitations_select ON public.team_invitations
  FOR SELECT TO authenticated
  USING (
    invitee_id = (
      SELECT users.id FROM public.users
      WHERE users.id = auth.uid() OR users.linked_auth_id = auth.uid()
      LIMIT 1
    )
    OR invited_by = (
      SELECT users.id FROM public.users
      WHERE users.id = auth.uid() OR users.linked_auth_id = auth.uid()
      LIMIT 1
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE (u.id = auth.uid() OR u.linked_auth_id = auth.uid())
        AND u.role = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role])
    )
  );

CREATE POLICY team_invitations_insert ON public.team_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = (
      SELECT users.id FROM public.users
      WHERE users.id = auth.uid() OR users.linked_auth_id = auth.uid()
      LIMIT 1
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.id = team_invitations.team_id
          AND t.leader_id = (
            SELECT users.id FROM public.users
            WHERE users.id = auth.uid() OR users.linked_auth_id = auth.uid()
            LIMIT 1
          )
      )
      OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE (u.id = auth.uid() OR u.linked_auth_id = auth.uid())
          AND u.role = ANY (ARRAY['ADMIN'::member_role, 'SUPER_ADMIN'::member_role])
      )
    )
  );
