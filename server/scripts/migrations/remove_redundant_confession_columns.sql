-- Migration: Remove Redundant Columns from confessions_mit_adt
-- Purpose: Clean up schema by removing redundant and unnecessary columns
-- Date: 2025-11-24

BEGIN;

-- Step 1: Update trigger function to remove replies_count
-- The trigger currently updates both comment_count and replies_count
-- We'll update it to only update comment_count
CREATE OR REPLACE FUNCTION update_confession_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.confessions_mit_adt
    SET 
      comment_count = COALESCE(comment_count, 0) + 1,
      updated_at = NOW()
    WHERE id = NEW.confession_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.confessions_mit_adt
    SET 
      comment_count = GREATEST(0, COALESCE(comment_count, 0) - 1),
      updated_at = NOW()
    WHERE id = OLD.confession_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop redundant columns
-- These columns are redundant or don't belong on the confessions table

-- Remove confession_text (redundant with content)
ALTER TABLE public.confessions_mit_adt DROP COLUMN IF EXISTS confession_text;

-- Remove replies_count (redundant with comment_count)
ALTER TABLE public.confessions_mit_adt DROP COLUMN IF EXISTS replies_count;

-- Remove user profile columns (belong in user profile table, not confessions)
ALTER TABLE public.confessions_mit_adt DROP COLUMN IF EXISTS user_name;
ALTER TABLE public.confessions_mit_adt DROP COLUMN IF EXISTS user_email;
ALTER TABLE public.confessions_mit_adt DROP COLUMN IF EXISTS anonymous_name;
ALTER TABLE public.confessions_mit_adt DROP COLUMN IF EXISTS uploads;
ALTER TABLE public.confessions_mit_adt DROP COLUMN IF EXISTS search_history;
ALTER TABLE public.confessions_mit_adt DROP COLUMN IF EXISTS avatar;

COMMIT;

-- Verification query (run after migration)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'confessions_mit_adt' 
-- ORDER BY ordinal_position;

