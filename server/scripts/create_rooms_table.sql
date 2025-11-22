-- Create rooms table for persistent storage
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
    -- Role management settings
    max_co_admins INTEGER DEFAULT 3,
    default_ban_duration TEXT DEFAULT '1day',
    allow_member_requests BOOLEAN DEFAULT TRUE,
    allow_admin_invites BOOLEAN DEFAULT TRUE,
    auto_transfer_on_inactivity BOOLEAN DEFAULT TRUE,
    inactivity_days INTEGER DEFAULT 10
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_rooms_category ON rooms(category);
CREATE INDEX IF NOT EXISTS idx_rooms_room_type ON rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_rooms_is_private ON rooms(is_private);
