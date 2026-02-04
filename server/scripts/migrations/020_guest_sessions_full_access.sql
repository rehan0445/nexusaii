-- Add full_access to guest_sessions for single-entry flow (name, age, gender = full access, 18-100 only)
-- Run this in Supabase SQL Editor if guest_sessions already exists.

ALTER TABLE guest_sessions
ADD COLUMN IF NOT EXISTS full_access boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN guest_sessions.full_access IS 'true when user entered age 18-100 and has full access (1 year expiry)';
