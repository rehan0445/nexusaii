-- Migration: Companion Context Persistence
-- Creates table to store persistent memory and context for companion chats
-- Enables seamless conversation continuity across sessions

-- Create companion_context table
CREATE TABLE IF NOT EXISTS companion_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  relationship_status TEXT DEFAULT 'just met',
  remembered_facts JSONB DEFAULT '[]',
  conversation_tone TEXT DEFAULT 'friendly',
  key_events JSONB DEFAULT '[]',
  user_preferences JSONB DEFAULT '{}',
  summary TEXT,
  message_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, character_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companion_context_user_character 
ON companion_context(user_id, character_id);

-- Create index for last_updated to track recent conversations
CREATE INDEX IF NOT EXISTS idx_companion_context_last_updated 
ON companion_context(last_updated DESC);

-- Add comment for documentation
COMMENT ON TABLE companion_context IS 'Stores persistent memory and context for companion chats to maintain conversation continuity';
COMMENT ON COLUMN companion_context.relationship_status IS 'Current relationship dynamic (e.g., just met, friends, close friends)';
COMMENT ON COLUMN companion_context.remembered_facts IS 'Array of important facts the companion should remember about the user';
COMMENT ON COLUMN companion_context.conversation_tone IS 'Overall tone of conversations (e.g., friendly, romantic, professional)';
COMMENT ON COLUMN companion_context.key_events IS 'Array of significant events or moments in the conversation history';
COMMENT ON COLUMN companion_context.user_preferences IS 'User preferences like nickname, topics to avoid, etc.';
COMMENT ON COLUMN companion_context.summary IS 'AI-generated summary of conversation history when it exceeds threshold';
COMMENT ON COLUMN companion_context.message_count IS 'Total number of messages exchanged to trigger summarization';

