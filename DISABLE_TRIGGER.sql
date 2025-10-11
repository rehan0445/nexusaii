-- ========================================
-- DISABLE AUTO-CREATE USER PROFILE TRIGGER
-- ========================================
-- This temporarily disables the trigger to fix connection timeout issues
-- Run this in Supabase SQL Editor IMMEDIATELY

-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verify trigger is removed
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Should return 0 rows if successfully removed

