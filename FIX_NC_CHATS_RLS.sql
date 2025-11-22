-- ============================================
-- FIX RLS POLICY FOR NC_CHATS TABLE
-- ============================================
-- This script fixes the Row Level Security policy that's blocking room creation
-- Error: "new row violates row-level security policy for table nc_chats"
-- ============================================

-- First, check if the table exists and has RLS enabled
SELECT 
  tablename,
  rowsecurity AS "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'nc_chats' AND schemaname = 'public';

-- ============================================
-- OPTION 1: Allow all authenticated users to insert rooms
-- (Recommended for MVP/Development)
-- ============================================

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can insert rooms" ON nc_chats;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON nc_chats;
DROP POLICY IF EXISTS "Allow room creation" ON nc_chats;

-- Create policy allowing authenticated users to create rooms
CREATE POLICY "Enable insert for authenticated users only" ON nc_chats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- OPTION 2: Allow users to insert only their own rooms
-- (More secure - only if created_by column exists)
-- ============================================

-- Uncomment this if you want users to only create rooms where they're the creator
-- CREATE POLICY "Users can insert their own rooms" ON nc_chats
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (auth.uid() = created_by);

-- ============================================
-- ALSO ADD SELECT POLICY (to view rooms)
-- ============================================

-- Drop existing select policy if needed
DROP POLICY IF EXISTS "Anyone can view rooms" ON nc_chats;
DROP POLICY IF EXISTS "Enable read access for all users" ON nc_chats;

-- Allow authenticated users to view all rooms
CREATE POLICY "Enable read access for all users" ON nc_chats
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- ALSO ADD UPDATE POLICY (to modify rooms)
-- ============================================

-- Allow room creators/admins to update their rooms
DROP POLICY IF EXISTS "Users can update their rooms" ON nc_chats;

CREATE POLICY "Users can update their rooms" ON nc_chats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = admin_id)
  WITH CHECK (auth.uid() = created_by OR auth.uid() = admin_id);

-- ============================================
-- ALSO ADD DELETE POLICY (to delete rooms)
-- ============================================

-- Allow only room creators/admins to delete rooms
DROP POLICY IF EXISTS "Users can delete their rooms" ON nc_chats;

CREATE POLICY "Users can delete their rooms" ON nc_chats
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = admin_id);

-- ============================================
-- ENABLE REALTIME (Important!)
-- ============================================

-- Enable realtime for nc_chats table
ALTER PUBLICATION supabase_realtime ADD TABLE nc_chats;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all policies on nc_chats
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'nc_chats';

-- Check if realtime is enabled
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'nc_chats';

-- ============================================
-- NOTES
-- ============================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Make sure you're connected to the correct database
-- 3. If you get "column does not exist" errors, adjust the policy conditions
-- 4. Test by trying to create a room after running this script
-- 5. You can view/edit policies in: Database > Tables > nc_chats > Policies
-- ============================================

