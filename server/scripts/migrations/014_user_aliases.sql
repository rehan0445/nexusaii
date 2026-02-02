-- User Aliases Table for Confession Feature
-- This table stores persistent alias information linked to session_id
-- Ensures avatar, name, emoji, and color remain consistent across confessions, comments, and replies

CREATE TABLE IF NOT EXISTS user_aliases (
  session_id TEXT PRIMARY KEY,
  alias_name TEXT NOT NULL,
  alias_emoji TEXT NOT NULL DEFAULT '👤',
  alias_color TEXT NOT NULL DEFAULT 'from-gray-500 to-gray-600',
  alias_image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups by session_id (already primary key, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_user_aliases_session ON user_aliases(session_id);

-- Index for looking up by creation time (for analytics/cleanup)
CREATE INDEX IF NOT EXISTS idx_user_aliases_created ON user_aliases(created_at DESC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_aliases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS trigger_update_user_aliases_updated_at ON user_aliases;
CREATE TRIGGER trigger_update_user_aliases_updated_at
  BEFORE UPDATE ON user_aliases
  FOR EACH ROW
  EXECUTE FUNCTION update_user_aliases_updated_at();

