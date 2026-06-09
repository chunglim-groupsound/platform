-- Add session_years column to users table.
-- Stores self-reported years of experience per session, e.g. {"기타": 3, "보컬": 1}.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS session_years jsonb DEFAULT NULL;
