-- Create companion_proactive_messages table for tracking proactive messages
CREATE TABLE IF NOT EXISTS companion_proactive_messages (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  character_id VARCHAR(255) NOT NULL,
  message_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for faster lookups
  INDEX idx_companion_proactive_messages_user_character (user_id, character_id),
  INDEX idx_companion_proactive_messages_created_at (created_at)
);

-- Add RLS policies
ALTER TABLE companion_proactive_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own proactive messages
CREATE POLICY "Users can access their own proactive messages" ON companion_proactive_messages
  FOR ALL USING (auth.uid()::text = user_id);

-- Policy: Service role can access all proactive messages
CREATE POLICY "Service role can access all proactive messages" ON companion_proactive_messages
  FOR ALL USING (auth.role() = 'service_role');
