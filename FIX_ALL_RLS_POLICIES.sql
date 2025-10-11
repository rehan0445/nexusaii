-- ========================================
-- FIX ALL AUTH RLS POLICIES - CRITICAL PERFORMANCE FIX
-- ========================================
-- This fixes the "Auth RLS Initialization Plan" performance issue
-- by wrapping auth.uid() in (select auth.uid()) to evaluate once per query
-- instead of once per row.
--
-- Run this in Supabase SQL Editor IMMEDIATELY
-- ========================================

-- 1. CHARACTER_LIKES (HIGHEST PRIORITY - causing timeout issues)
-- ========================================

DROP POLICY IF EXISTS "Users can insert their own likes" ON public.character_likes;
CREATE POLICY "Users can insert their own likes"
ON public.character_likes FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.character_likes;
CREATE POLICY "Users can delete their own likes"
ON public.character_likes FOR DELETE
TO authenticated
USING (user_id = (select auth.uid()));

-- 2. CHARACTER_DATA
-- ========================================

DROP POLICY IF EXISTS "Users can insert their own characters" ON public.character_data;
CREATE POLICY "Users can insert their own characters"
ON public.character_data FOR INSERT
TO authenticated
WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own characters" ON public.character_data;
CREATE POLICY "Users can update their own characters"
ON public.character_data FOR UPDATE
TO authenticated
USING (created_by = (select auth.uid()))
WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own characters" ON public.character_data;
CREATE POLICY "Users can delete their own characters"
ON public.character_data FOR DELETE
TO authenticated
USING (created_by = (select auth.uid()));

-- 3. USER_PREFERENCES
-- ========================================

DROP POLICY IF EXISTS "user_preferences_read" ON public.user_preferences;
CREATE POLICY "user_preferences_read"
ON public.user_preferences FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "user_preferences_write" ON public.user_preferences;
CREATE POLICY "user_preferences_write"
ON public.user_preferences FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "user_preferences_update" ON public.user_preferences;
CREATE POLICY "user_preferences_update"
ON public.user_preferences FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- 4. CONFESSIONS (affects performance at scale)
-- ========================================

DROP POLICY IF EXISTS "confessions_mods_on_all" ON public.confessions;
CREATE POLICY "confessions_mods_on_all"
ON public.confessions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = (select auth.uid()) 
    AND role IN ('admin', 'moderator')
  )
);

-- 5. TYPING_INDICATORS
-- ========================================

DROP POLICY IF EXISTS "Users can manage their own typing indicators" ON public.typing_indicators;
CREATE POLICY "Users can manage their own typing indicators"
ON public.typing_indicators FOR ALL
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- 6. USER_SESSIONS
-- ========================================

DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
CREATE POLICY "Users can view own sessions"
ON public.user_sessions FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

-- 7. REFRESH_TOKENS
-- ========================================

DROP POLICY IF EXISTS "Users can view own refresh tokens" ON public.refresh_tokens;
CREATE POLICY "Users can view own refresh tokens"
ON public.refresh_tokens FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

-- 8. CHARACTER_CHAT_BACKGROUNDS
-- ========================================

DROP POLICY IF EXISTS "Users can view their own backgrounds" ON public.character_chat_backgrounds;
CREATE POLICY "Users can view their own backgrounds"
ON public.character_chat_backgrounds FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own backgrounds" ON public.character_chat_backgrounds;
CREATE POLICY "Users can insert their own backgrounds"
ON public.character_chat_backgrounds FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own backgrounds" ON public.character_chat_backgrounds;
CREATE POLICY "Users can delete their own backgrounds"
ON public.character_chat_backgrounds FOR DELETE
TO authenticated
USING (user_id = (select auth.uid()));

-- 9. USER_PROFILES
-- ========================================

DROP POLICY IF EXISTS "owner insert user_profiles" ON public.user_profiles;
CREATE POLICY "owner insert user_profiles"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "owner update user_profiles" ON public.user_profiles;
CREATE POLICY "owner update user_profiles"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "authenticated_can_view_own_profile" ON public.user_profiles;
CREATE POLICY "authenticated_can_view_own_profile"
ON public.user_profiles FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "authenticated_can_insert_own_profile" ON public.user_profiles;
CREATE POLICY "authenticated_can_insert_own_profile"
ON public.user_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "authenticated_can_update_own_profile" ON public.user_profiles;
CREATE POLICY "authenticated_can_update_own_profile"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- 10. COMPANION_CHAT_HINTS
-- ========================================

DROP POLICY IF EXISTS "Users can manage their own chat hints" ON public.companion_chat_hints;
CREATE POLICY "Users can manage their own chat hints"
ON public.companion_chat_hints FOR ALL
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- 11. HANGOUTS
-- ========================================

DROP POLICY IF EXISTS "Users can view active hangouts they are members of" ON public.hangouts;
CREATE POLICY "Users can view active hangouts they are members of"
ON public.hangouts FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND EXISTS (
    SELECT 1 FROM hangout_members 
    WHERE hangout_id = hangouts.id 
    AND user_id = (select auth.uid()) 
    AND left_at IS NULL
  )
);

DROP POLICY IF EXISTS "Users can create hangouts" ON public.hangouts;
CREATE POLICY "Users can create hangouts"
ON public.hangouts FOR INSERT
TO authenticated
WITH CHECK (creator_id = (select auth.uid()));

DROP POLICY IF EXISTS "Creators can update their hangouts" ON public.hangouts;
CREATE POLICY "Creators can update their hangouts"
ON public.hangouts FOR UPDATE
TO authenticated
USING (creator_id = (select auth.uid()))
WITH CHECK (creator_id = (select auth.uid()));

-- 12. HANGOUT_MESSAGES
-- ========================================

DROP POLICY IF EXISTS "Members can view messages in their hangouts" ON public.hangout_messages;
CREATE POLICY "Members can view messages in their hangouts"
ON public.hangout_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM hangout_members 
    WHERE hangout_id = hangout_messages.hangout_id 
    AND user_id = (select auth.uid()) 
    AND left_at IS NULL
  )
);

DROP POLICY IF EXISTS "Members can send messages in their hangouts" ON public.hangout_messages;
CREATE POLICY "Members can send messages in their hangouts"
ON public.hangout_messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = (select auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM hangout_members 
    WHERE hangout_id = hangout_messages.hangout_id 
    AND user_id = (select auth.uid()) 
    AND left_at IS NULL
  )
);

-- 13. HANGOUT_MEMBERS
-- ========================================

DROP POLICY IF EXISTS "Users can view members of hangouts they belong to" ON public.hangout_members;
CREATE POLICY "Users can view members of hangouts they belong to"
ON public.hangout_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM hangout_members hm2 
    WHERE hm2.hangout_id = hangout_members.hangout_id 
    AND hm2.user_id = (select auth.uid()) 
    AND hm2.left_at IS NULL
  )
);

DROP POLICY IF EXISTS "Users can join hangouts" ON public.hangout_members;
CREATE POLICY "Users can join hangouts"
ON public.hangout_members FOR INSERT
TO authenticated
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can leave hangouts (update left_at)" ON public.hangout_members;
CREATE POLICY "Users can leave hangouts (update left_at)"
ON public.hangout_members FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- ========================================
-- VERIFICATION QUERY
-- ========================================
-- Run this to confirm all policies are fixed:

SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN qual::text LIKE '%auth.uid()%' 
            AND qual::text NOT LIKE '%(select auth.uid())%' THEN '❌ NOT FIXED'
        WHEN with_check::text LIKE '%auth.uid()%' 
            AND with_check::text NOT LIKE '%(select auth.uid())%' THEN '❌ NOT FIXED'
        ELSE '✅ FIXED'
    END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual::text LIKE '%auth.uid()%' 
    OR with_check::text LIKE '%auth.uid()%'
  )
ORDER BY 
    CASE 
        WHEN qual::text LIKE '%auth.uid()%' 
            AND qual::text NOT LIKE '%(select auth.uid())%' THEN 0
        WHEN with_check::text LIKE '%auth.uid()%' 
            AND with_check::text NOT LIKE '%(select auth.uid())%' THEN 0
        ELSE 1
    END,
    tablename,
    policyname;

-- Expected: All rows should show '✅ FIXED'

