-- Create character_likes table for storing user likes on characters
CREATE TABLE IF NOT EXISTS character_likes (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES character_data(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(character_id, user_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_character_likes_character_id ON character_likes(character_id);
CREATE INDEX IF NOT EXISTS idx_character_likes_user_id ON character_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_character_likes_created_at ON character_likes(created_at);

-- Add comment to table
COMMENT ON TABLE character_likes IS 'Stores user likes for characters';
COMMENT ON COLUMN character_likes.character_id IS 'Reference to the character being liked';
COMMENT ON COLUMN character_likes.user_id IS 'Firebase user ID of the user who liked the character';
COMMENT ON COLUMN character_likes.created_at IS 'Timestamp when the like was created'; 