-- Phase 5.1: Confession persistence enhancements

-- Ensure the confessions table has the columns required for persistence
ALTER TABLE confessions
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS alias JSONB,
  ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS poll JSONB,
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS replies_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_explicit BOOLEAN DEFAULT FALSE;

-- Replies table to persist confession replies and nested threading metadata
CREATE TABLE IF NOT EXISTS confession_replies (
  id TEXT PRIMARY KEY,
  confession_id TEXT NOT NULL REFERENCES confessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  alias JSONB,
  session_id TEXT,
  parent_id TEXT NULL REFERENCES confession_replies(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  score INTEGER DEFAULT 0,
  metadata JSONB
);

-- Helpful indexes for feed loading
CREATE INDEX IF NOT EXISTS idx_confessions_created_at_desc ON confessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_score_desc ON confessions(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_confessions_replies_count_desc ON confessions(replies_count DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_confession_replies_confession_created_at ON confession_replies(confession_id, created_at);

