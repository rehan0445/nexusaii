-- Create character_data table for user-created characters
CREATE TABLE IF NOT EXISTS character_data (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  role TEXT,
  image TEXT,
  languages JSONB,
  personality JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chatbot_models table for built-in AI characters
CREATE TABLE IF NOT EXISTS chatbot_models (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  image TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  languages JSONB,
  personality JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create character_likes table for tracking likes
CREATE TABLE IF NOT EXISTS character_likes (
  id SERIAL PRIMARY KEY,
  character_id INTEGER NOT NULL REFERENCES character_data(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(character_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_character_data_user_id ON character_data(user_id);
CREATE INDEX IF NOT EXISTS idx_character_data_name ON character_data(name);
CREATE INDEX IF NOT EXISTS idx_chatbot_models_name ON chatbot_models(name);
CREATE INDEX IF NOT EXISTS idx_character_likes_character_id ON character_likes(character_id);
CREATE INDEX IF NOT EXISTS idx_character_likes_user_id ON character_likes(user_id);

-- Enable RLS (Row Level Security) on character_data
ALTER TABLE character_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for character_data
-- Users can view all characters
CREATE POLICY "Users can view all characters" ON character_data
  FOR SELECT USING (true);

-- Users can only insert their own characters
CREATE POLICY "Users can insert their own characters" ON character_data
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can only update their own characters
CREATE POLICY "Users can update their own characters" ON character_data
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can only delete their own characters
CREATE POLICY "Users can delete their own characters" ON character_data
  FOR DELETE USING (auth.uid()::text = user_id);

-- Enable RLS on chatbot_models (read-only for all users)
ALTER TABLE chatbot_models ENABLE ROW LEVEL SECURITY;

-- RLS policy for chatbot_models - all users can read
CREATE POLICY "All users can view chatbot models" ON chatbot_models
  FOR SELECT USING (true);

-- Enable RLS on character_likes
ALTER TABLE character_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for character_likes
CREATE POLICY "Users can view all likes" ON character_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own likes" ON character_likes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own likes" ON character_likes
  FOR DELETE USING (auth.uid()::text = user_id);
