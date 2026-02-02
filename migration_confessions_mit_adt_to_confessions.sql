-- ============================================
-- Migration: confessions_mit_adt -> confessions
-- ============================================
-- This migration script moves all data from confessions_mit_adt 
-- to the new general confessions table.
--
-- Column Mappings:
--   - comment_count (old) -> replies_count (new)
--   - campus: Keep existing value or default to 'mit_adt' if null
--   - Other extra fields (upvotes, downvotes, is_trending, etc.) are ignored
--   - Duplicate IDs will be skipped (ON CONFLICT DO NOTHING)
--
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Insert all confessions from confessions_mit_adt into confessions
-- Skip any rows that already exist (duplicate IDs)
INSERT INTO confessions (
  id,
  content,
  alias,
  session_id,
  campus,
  created_at,
  reactions,
  poll,
  score,
  replies_count,  -- Maps from comment_count in old table
  is_explicit,
  author_id,
  updated_at,
  edited_at,
  is_deleted
)
SELECT 
  old.id,
  old.content,
  old.alias,
  old.session_id,
  COALESCE(old.campus, 'mit_adt') as campus,  -- Use existing campus or default to 'mit_adt'
  old.created_at,
  old.reactions,
  old.poll,
  old.score,
  COALESCE(old.comment_count, 0) as replies_count,  -- Map comment_count to replies_count
  old.is_explicit,
  old.author_id,
  old.updated_at,
  old.edited_at,
  COALESCE(old.is_deleted, false) as is_deleted
FROM confessions_mit_adt old
WHERE NOT EXISTS (
  -- Skip rows that already exist in the new table
  SELECT 1 FROM confessions new WHERE new.id = old.id
)
ON CONFLICT (id) DO NOTHING;  -- Safety: skip duplicates if any

-- Step 2: Verify migration
-- Check how many rows were inserted
SELECT 
  (SELECT COUNT(*) FROM confessions) as total_in_new_table,
  (SELECT COUNT(*) FROM confessions_mit_adt) as total_in_old_table,
  (SELECT COUNT(*) FROM confessions WHERE campus = 'mit_adt' OR campus IS NULL) as migrated_with_mit_adt_campus;

-- Step 3: Check for any remaining differences (optional diagnostic)
-- This will show any IDs that exist in old table but not in new table
SELECT 
  old.id,
  old.created_at,
  old.content
FROM confessions_mit_adt old
WHERE NOT EXISTS (
  SELECT 1 FROM confessions new WHERE new.id = old.id
)
ORDER BY old.created_at DESC
LIMIT 10;

