-- Fix Missing Tables for Nexus
-- Run this in Supabase SQL Editor

-- User profiles table (CRITICAL - was missing)
CREATE TABLE IF NOT EXISTS "userProfileData" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    bio TEXT,
    location TEXT,
    email TEXT,
    phno TEXT,
    "profileImage" TEXT,
    "bannerImage" TEXT,
    "creationDate" TIMESTAMP DEFAULT NOW(),
    streak TEXT DEFAULT '0',
    interests JSONB DEFAULT '[]',
    stats_id INTEGER
);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE,
    posts INTEGER DEFAULT 0,
    following INTEGER DEFAULT 0,
    followers INTEGER DEFAULT 0,
    numofchar INTEGER DEFAULT 0
);

-- Room messages (may be missing)
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

-- Character views
CREATE TABLE IF NOT EXISTS character_views (
    id SERIAL PRIMARY KEY,
    character_id TEXT NOT NULL,
    viewer_id TEXT,
    viewed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(character_id, viewer_id)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_char ON ai_chat_history(user_id, character_id);
CREATE INDEX IF NOT EXISTS idx_character_views_character ON character_views(character_id);

-- Done!
SELECT 'All missing tables created successfully!' AS status;

