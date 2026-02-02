-- ============================================
-- Fix: Create companion_chat_hints table
-- ============================================
-- This table was referenced in the code but never created

-- Create companion_chat_hints table
CREATE TABLE IF NOT EXISTS companion_chat_hints (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  hint_text TEXT NOT NULL,
  context_messages JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  
  -- Add index for faster lookups
  CONSTRAINT fk_companion_hints_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_companion_hints_user_character 
  ON companion_chat_hints(user_id, character_id);

CREATE INDEX IF NOT EXISTS idx_companion_hints_expires 
  ON companion_chat_hints(expires_at);

-- Create function to auto-delete expired hints
CREATE OR REPLACE FUNCTION delete_expired_companion_hints()
RETURNS void AS $$
BEGIN
  DELETE FROM companion_chat_hints
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up expired hints
-- (Requires pg_cron extension - comment out if not available)
-- SELECT cron.schedule('cleanup-companion-hints', '0 * * * *', 'SELECT delete_expired_companion_hints()');

-- Enable RLS (Row Level Security)
ALTER TABLE companion_chat_hints ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own hints
CREATE POLICY "Users can insert own hints" ON companion_chat_hints
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can view their own hints
CREATE POLICY "Users can view own hints" ON companion_chat_hints
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own hints
CREATE POLICY "Users can delete own hints" ON companion_chat_hints
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON companion_chat_hints TO authenticated;
GRANT SELECT, INSERT, DELETE ON companion_chat_hints TO anon;

-- Success message
SELECT 'companion_chat_hints table created successfully!' as status;

