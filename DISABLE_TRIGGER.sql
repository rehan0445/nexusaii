-- ========================================
-- EMERGENCY: DISABLE AUTO-CREATE USER PROFILE TRIGGER
-- ========================================
-- This trigger is causing connection timeout issues by creating additional
-- database load during user registration when the system is already overwhelmed.
-- 
-- ⚠️ IMPORTANT: Run this in Supabase SQL Editor IMMEDIATELY
-- 
-- Steps:
-- 1. Go to https://app.supabase.com/project/dswuotsdaltsomyqqykn/sql
-- 2. Paste and run the SQL commands below
-- 3. Verify the trigger is removed (should return 0 rows)
-- ========================================

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verify trigger is removed (should return 0 rows)
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Expected result: 0 rows (confirms trigger is disabled)

