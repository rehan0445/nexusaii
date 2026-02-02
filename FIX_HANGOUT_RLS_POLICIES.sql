-- ============================================
-- FIX HANGOUT ROOMS & PALACES - RLS POLICIES
-- ============================================
-- This migration fixes the security policies that are blocking
-- hangout room creation and message storage.
--
-- ISSUE: After security hardening, RLS was enabled on some tables
-- but hangout tables (rooms, room_messages, room_participants) were
-- not properly configured with policies, causing all operations to fail.
--
-- SOLUTION: Add proper RLS policies that allow service_role (backend)
-- to perform all operations while users can read their own data.
-- ============================================

-- ============================================
-- 1. ROOMS TABLE
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS rooms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS rooms_read ON rooms;
DROP POLICY IF EXISTS rooms_write_server ON rooms;
DROP POLICY IF EXISTS rooms_update_server ON rooms;
DROP POLICY IF EXISTS rooms_delete_server ON rooms;

-- Allow everyone to read rooms (for browsing)
CREATE POLICY rooms_read ON rooms
FOR SELECT USING (true);

-- Allow backend (service_role) to create, update, delete rooms
CREATE POLICY rooms_write_server ON rooms
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY rooms_update_server ON rooms
FOR UPDATE 
USING (auth.role() = 'service_role');

CREATE POLICY rooms_delete_server ON rooms
FOR DELETE 
USING (auth.role() = 'service_role');

-- ============================================
-- 2. ROOM_MESSAGES TABLE
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS room_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS room_messages_read ON room_messages;
DROP POLICY IF EXISTS room_messages_write_server ON room_messages;
DROP POLICY IF EXISTS room_messages_update_server ON room_messages;
DROP POLICY IF EXISTS room_messages_delete_server ON room_messages;

-- Allow everyone to read messages (they'll be filtered by room access at app level)
CREATE POLICY room_messages_read ON room_messages
FOR SELECT USING (true);

-- Allow backend (service_role) to insert, update, delete messages
CREATE POLICY room_messages_write_server ON room_messages
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY room_messages_update_server ON room_messages
FOR UPDATE 
USING (auth.role() = 'service_role');

CREATE POLICY room_messages_delete_server ON room_messages
FOR DELETE 
USING (auth.role() = 'service_role');

-- ============================================
-- 3. ROOM_PARTICIPANTS TABLE
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS room_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS room_participants_read ON room_participants;
DROP POLICY IF EXISTS room_participants_write_server ON room_participants;
DROP POLICY IF EXISTS room_participants_update_server ON room_participants;
DROP POLICY IF EXISTS room_participants_delete_server ON room_participants;

-- Allow everyone to read participants (for room member lists)
CREATE POLICY room_participants_read ON room_participants
FOR SELECT USING (true);

-- Allow backend (service_role) to insert, update, delete participants
CREATE POLICY room_participants_write_server ON room_participants
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY room_participants_update_server ON room_participants
FOR UPDATE 
USING (auth.role() = 'service_role');

CREATE POLICY room_participants_delete_server ON room_participants
FOR DELETE 
USING (auth.role() = 'service_role');

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Room messages indexes (for fast message retrieval)
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON room_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_messages_user_id ON room_messages(user_id);

-- Room participants indexes (for join/leave operations)
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_active ON room_participants(is_active) WHERE is_active = true;

-- Rooms indexes (already exist in create_rooms_table.sql, but adding IF NOT EXISTS for safety)
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_rooms_category ON rooms(category);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type ON rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_rooms_is_private ON rooms(is_private);
CREATE INDEX IF NOT EXISTS idx_rooms_campus_id ON rooms(campus_id) WHERE campus_id IS NOT NULL;

-- ============================================
-- 5. VERIFY TABLES EXIST
-- ============================================

-- If tables don't exist, create them
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    bio TEXT,
    rules TEXT[],
    category TEXT NOT NULL,
    member_count INTEGER DEFAULT 1,
    is_private BOOLEAN DEFAULT FALSE,
    is_official BOOLEAN DEFAULT FALSE,
    room_type TEXT DEFAULT 'palace',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moderators TEXT[],
    tags TEXT[],
    icon TEXT,
    profile_picture TEXT,
    created_by TEXT NOT NULL,
    campus_id TEXT,
    max_co_admins INTEGER DEFAULT 3,
    default_ban_duration TEXT DEFAULT '1day',
    allow_member_requests BOOLEAN DEFAULT TRUE,
    allow_admin_invites BOOLEAN DEFAULT TRUE,
    auto_transfer_on_inactivity BOOLEAN DEFAULT TRUE,
    inactivity_days INTEGER DEFAULT 10
);

CREATE TABLE IF NOT EXISTS room_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    reactions JSONB DEFAULT '{}',
    reply_to TEXT
);

CREATE TABLE IF NOT EXISTS room_participants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    last_message_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(room_id, user_id)
);

-- ============================================
-- VERIFICATION QUERIES (Run these to confirm)
-- ============================================

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('rooms', 'room_messages', 'room_participants');

-- Check policies exist:
-- SELECT tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename IN ('rooms', 'room_messages', 'room_participants');

-- ============================================
-- NOTES FOR REN
-- ============================================
-- 1. This script is IDEMPOTENT - safe to run multiple times
-- 2. The service_role key in your .env must be valid
-- 3. After running this, restart your backend server
-- 4. Test room creation and messaging
-- 5. Check server logs for any "permission denied" errors
-- ============================================

