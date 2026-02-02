-- ========================================
-- NEXUS - COMPLETE DATABASE SETUP
-- ========================================
-- Run this in Supabase SQL Editor to set up all tables
-- Copy & paste this entire file and click "RUN"

-- ============ USER TABLES ============

-- User authentication table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User profiles
CREATE TABLE IF NOT EXISTS userProfileData (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    bio TEXT,
    location TEXT,
    email TEXT,
    phno TEXT,
    profileImage TEXT,
    bannerImage TEXT,
    creationDate TIMESTAMP DEFAULT NOW(),
    streak TEXT DEFAULT '0',
    interests JSONB DEFAULT '[]',
    stats_id INTEGER
);

-- User stats
CREATE TABLE IF NOT EXISTS user_stats (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE,
    posts INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0,
    followers INTEGER DEFAULT 0,
    numofchar INTEGER DEFAULT 0
);

-- ============ CHARACTER/COMPANION TABLES ============

-- AI Characters
CREATE TABLE IF NOT EXISTS character_data (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    user_id TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    role TEXT,
    image TEXT,
    languages TEXT,
    personality TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Character views/stats
CREATE TABLE IF NOT EXISTS character_views (
    id SERIAL PRIMARY KEY,
    character_id TEXT NOT NULL,
    viewer_id TEXT,
    viewed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(character_id, viewer_id)
);

-- AI chat history
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    messages JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI chat metadata
CREATE TABLE IF NOT EXISTS ai_chat_metadata (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    character_name TEXT NOT NULL,
    character_avatar TEXT,
    last_message TEXT,
    last_message_at TIMESTAMP DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    UNIQUE(user_id, character_id)
);

-- Chatbot models
CREATE TABLE IF NOT EXISTS chatbot_models (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    provider TEXT,
    model_id TEXT,
    icon TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ CONFESSION/CAMPUS TABLES ============

-- Confessions
CREATE TABLE IF NOT EXISTS confessions (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    alias TEXT NOT NULL,
    session_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    reactions JSONB DEFAULT '{}',
    poll JSONB,
    score INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    is_explicit BOOLEAN DEFAULT FALSE
);

-- Confession reactions
CREATE TABLE IF NOT EXISTS confession_reactions (
    confession_id TEXT NOT NULL,
    user_hash TEXT NOT NULL,
    reaction TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (confession_id, user_hash, reaction)
);

-- Confession replies
CREATE TABLE IF NOT EXISTS confession_replies (
    id TEXT PRIMARY KEY,
    confession_id TEXT NOT NULL,
    alias TEXT NOT NULL,
    content TEXT NOT NULL,
    session_id TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    reactions JSONB DEFAULT '{}'
);

-- ============ ANNOUNCEMENT TABLES ============

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    target_audience JSONB NOT NULL,
    campus TEXT NOT NULL,
    department TEXT,
    scheduled_for TIMESTAMP,
    expires_at TIMESTAMP,
    attachments JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    requires_acknowledgment BOOLEAN DEFAULT FALSE,
    tags JSONB DEFAULT '[]',
    is_pinned BOOLEAN DEFAULT FALSE,
    likes INTEGER DEFAULT 0,
    reactions JSONB DEFAULT '{}',
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    has_threads BOOLEAN DEFAULT FALSE,
    poll JSONB,
    rsvp JSONB,
    event_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Urgent broadcasts
CREATE TABLE IF NOT EXISTS urgent_broadcasts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    urgency_level TEXT NOT NULL,
    broadcast_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lost & Found
CREATE TABLE IF NOT EXISTS lost_found_items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    image_url TEXT,
    campus TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ HANGOUT/ROOMS TABLES ============

-- Rooms (Hangout Palaces & Admin Rooms)
CREATE TABLE IF NOT EXISTS rooms (
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

-- Room messages
CREATE TABLE IF NOT EXISTS room_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    reactions JSONB DEFAULT '{}',
    reply_to TEXT
);

-- Room participants
CREATE TABLE IF NOT EXISTS room_participants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW(),
    last_read_at TIMESTAMP DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    last_message_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(room_id, user_id)
);

-- ============ DARKROOM TABLES ============

-- Darkroom messages
CREATE TABLE IF NOT EXISTS darkroom_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    alias TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    session_id TEXT
);

-- Darkroom active users
CREATE TABLE IF NOT EXISTS darkroom_active_users (
    socket_id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    alias TEXT NOT NULL,
    joined_at TIMESTAMP DEFAULT NOW()
);

-- ============ SESSION/AUTH TABLES ============

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    is_revoked BOOLEAN DEFAULT FALSE
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE
);

-- MFA (Multi-Factor Authentication)
CREATE TABLE IF NOT EXISTS mfa_secrets (
    user_id TEXT PRIMARY KEY,
    secret TEXT NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ AUDIT/MONITORING TABLES ============

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ MISC TABLES ============

-- Unread counters
CREATE TABLE IF NOT EXISTS unread_counters (
    user_id TEXT PRIMARY KEY,
    arena_count INTEGER DEFAULT 0,
    campus_count INTEGER DEFAULT 0,
    companion_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity feed
CREATE TABLE IF NOT EXISTS activity_feed (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    ref_id TEXT NOT NULL,
    audience TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ INDEXES FOR PERFORMANCE ============

CREATE INDEX IF NOT EXISTS idx_confessions_created_at ON confessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_campus ON announcements(campus, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_char ON ai_chat_history(user_id, character_id);
CREATE INDEX IF NOT EXISTS idx_character_views_character ON character_views(character_id);
CREATE INDEX IF NOT EXISTS idx_darkroom_messages_room ON darkroom_messages(room_id, timestamp DESC);

-- ============ COMPLETED! ============
-- Your Nexus database is now ready!


