-- Phase 5: Core tables

-- Confessions
CREATE TABLE IF NOT EXISTS confessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NULL,
  content TEXT NOT NULL,
  campus TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  meta JSON NULL
);

CREATE TABLE IF NOT EXISTS confession_reactions (
  confession_id TEXT NOT NULL,
  user_hash TEXT NOT NULL,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (confession_id, user_hash, reaction)
);

-- Info posts
CREATE TABLE IF NOT EXISTS info_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Activity feed (generic reference to info or group events)
CREATE TABLE IF NOT EXISTS activity_feed (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  audience TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unread counters
CREATE TABLE IF NOT EXISTS unread_counters (
  user_id TEXT PRIMARY KEY,
  arena_count INTEGER NOT NULL DEFAULT 0,
  campus_count INTEGER NOT NULL DEFAULT 0,
  companion_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AI conversations/messages
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Update existing confessions to have campus field (for existing data migration)
-- This should be run once to migrate existing data
-- UPDATE confessions SET campus = 'mit-adt' WHERE campus IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_confessions_created_at ON confessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_campus ON confessions(campus);
CREATE INDEX IF NOT EXISTS idx_confessions_campus_created_at ON confessions(campus, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_info_posts_created_at ON info_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id, created_at DESC);


