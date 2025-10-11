-- Migration: Interactive Character Experience Features
-- Adds affection levels, quest system, typing speed, and interaction tracking
-- Enables mini-games, friendship meters, and character-initiated messages

-- Add affection and quest columns to companion_context
ALTER TABLE companion_context ADD COLUMN IF NOT EXISTS affection_level INTEGER DEFAULT 0;
ALTER TABLE companion_context ADD COLUMN IF NOT EXISTS affection_visible_level INTEGER DEFAULT 1;
ALTER TABLE companion_context ADD COLUMN IF NOT EXISTS quest_progress JSONB DEFAULT '[]';
ALTER TABLE companion_context ADD COLUMN IF NOT EXISTS active_quest JSONB DEFAULT NULL;
ALTER TABLE companion_context ADD COLUMN IF NOT EXISTS typing_speed INTEGER DEFAULT 50;
ALTER TABLE companion_context ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE companion_context ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0;
ALTER TABLE companion_context ADD COLUMN IF NOT EXISTS pending_messages JSONB DEFAULT '[]';

-- Create index for last_interaction_at for inactivity triggers
CREATE INDEX IF NOT EXISTS idx_companion_context_last_interaction 
ON companion_context(last_interaction_at DESC);

-- Create index for affection_level for leaderboards/analytics
CREATE INDEX IF NOT EXISTS idx_companion_context_affection 
ON companion_context(affection_level DESC);

-- Add comments for documentation
COMMENT ON COLUMN companion_context.affection_level IS 'Hidden affection points (0-1000 scale)';
COMMENT ON COLUMN companion_context.affection_visible_level IS 'Visible affection tier (1-5: Acquaintance, Friend, Close Friend, Best Friend, Soulmate)';
COMMENT ON COLUMN companion_context.quest_progress IS 'Array of completed quests with rewards';
COMMENT ON COLUMN companion_context.active_quest IS 'Current active quest object';
COMMENT ON COLUMN companion_context.typing_speed IS 'Character typing speed in ms per character (30=fast, 50=normal, 80=slow)';
COMMENT ON COLUMN companion_context.last_interaction_at IS 'Timestamp of last user interaction for inactivity triggers';
COMMENT ON COLUMN companion_context.total_messages IS 'Total messages exchanged for affection calculation';
COMMENT ON COLUMN companion_context.pending_messages IS 'Character-initiated messages waiting for user to return';

