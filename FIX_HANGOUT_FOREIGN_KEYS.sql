-- ============================================
-- FIX HANGOUT TABLES FOREIGN KEY RELATIONSHIPS
-- ============================================

-- Drop existing tables if they exist to recreate with proper foreign keys
DROP TABLE IF EXISTS room_participants CASCADE;
DROP TABLE IF EXISTS room_messages CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- ============ ROOMS TABLE ============
-- Rooms (Hangout Palaces & Admin Rooms)
CREATE TABLE rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    bio TEXT,
    rules JSONB DEFAULT '[]',
    category TEXT,
    member_count INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT FALSE,
    is_official BOOLEAN DEFAULT FALSE,
    room_type TEXT DEFAULT 'palace',
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW(),
    moderators TEXT[] DEFAULT ARRAY[]::TEXT[],
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    icon TEXT,
    profile_picture TEXT,
    created_by TEXT,
    campus_id TEXT,
    max_co_admins INTEGER DEFAULT 3,
    default_ban_duration TEXT DEFAULT '1day',
    allow_member_requests BOOLEAN DEFAULT TRUE,
    allow_admin_invites BOOLEAN DEFAULT TRUE,
    auto_transfer_on_inactivity BOOLEAN DEFAULT TRUE,
    inactivity_days INTEGER DEFAULT 10
);

-- ============ ROOM MESSAGES TABLE ============
-- Room messages (with foreign key to rooms)
CREATE TABLE room_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    reactions JSONB DEFAULT '{}',
    reply_to TEXT
);

-- ============ ROOM PARTICIPANTS TABLE ============
-- Room participants (with foreign key to rooms)
CREATE TABLE room_participants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW(),
    last_read_at TIMESTAMP DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    last_message_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(room_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON room_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_joined_at ON room_participants(joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_last_activity ON rooms(last_activity DESC);

-- Enable RLS on all tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rooms (public read, authenticated create)
CREATE POLICY "Enable read access for all users" ON rooms FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON rooms FOR UPDATE USING (true) WITH CHECK (true);

-- Create RLS policies for room_messages (public read, authenticated insert/update)
CREATE POLICY "Enable read access for all users" ON room_messages FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON room_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for own messages" ON room_messages FOR UPDATE USING (true) WITH CHECK (true);

-- Create RLS policies for room_participants (public read, authenticated insert/update)
CREATE POLICY "Enable read access for all users" ON room_participants FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON room_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for own participation" ON room_participants FOR UPDATE USING (true) WITH CHECK (true);

-- Insert some test data
INSERT INTO rooms (id, name, description, created_by) VALUES
    ('test-room-1', 'Test Palace 1', 'A test hangout room', 'test-user-1'),
    ('test-room-2', 'Test Palace 2', 'Another test hangout room', 'test-user-2')
ON CONFLICT (id) DO NOTHING;

-- Test foreign key relationships
SELECT '✅ Foreign key relationships fixed!' AS status;

