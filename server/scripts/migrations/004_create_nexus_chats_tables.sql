-- Nexus Chats: Unified chat history and tracking
-- This migration creates tables to track all user chat activities across:
-- 1. Hangout Palace rooms
-- 2. Hangout Rooms (admin-controlled)
-- 3. Companion/Character chats

-- Table to track room messages for hangout chats
CREATE TABLE IF NOT EXISTS room_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    reactions JSONB DEFAULT '{}',
    reply_to TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Table to track user participation in rooms (for last read tracking)
CREATE TABLE IF NOT EXISTS room_participants (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    last_message_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Enhanced AI chat history table (if not exists, for companion chats)
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    messages JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track last message info for AI chats
CREATE TABLE IF NOT EXISTS ai_chat_metadata (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    character_name TEXT NOT NULL,
    character_avatar TEXT,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    UNIQUE(user_id, character_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON room_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_messages_user_id ON room_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_metadata_user_id ON ai_chat_metadata(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_char ON ai_chat_history(user_id, character_id);

