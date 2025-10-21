-- Create companion_mood_states table for tracking character-user mood states
CREATE TABLE IF NOT EXISTS companion_mood_states (
  id SERIAL PRIMARY KEY,
  character_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  mood VARCHAR(50) NOT NULL DEFAULT 'neutral',
  intensity DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (intensity >= 0 AND intensity <= 1),
  messages_since_mood_change INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique mood state per character-user pair
  UNIQUE(character_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_companion_mood_states_character_user 
ON companion_mood_states(character_id, user_id);

-- Create index for cleanup of old mood states
CREATE INDEX IF NOT EXISTS idx_companion_mood_states_last_updated 
ON companion_mood_states(last_updated);

-- Add RLS policies
ALTER TABLE companion_mood_states ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own mood states
CREATE POLICY "Users can access their own mood states" ON companion_mood_states
  FOR ALL USING (auth.uid()::text = user_id);

-- Policy: Service role can access all mood states
CREATE POLICY "Service role can access all mood states" ON companion_mood_states
  FOR ALL USING (auth.role() = 'service_role');
