-- Create character_views table for tracking character view counts
CREATE TABLE IF NOT EXISTS character_views (
    id SERIAL PRIMARY KEY,
    character_id VARCHAR(255) NOT NULL,
    user_id TEXT NULL, -- Can be null for anonymous views
    ip_address VARCHAR(45) NULL, -- For anonymous tracking
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255) NULL -- To prevent duplicate views in same session
);

-- Create character_view_counts table for aggregated view counts
CREATE TABLE IF NOT EXISTS character_view_counts (
    character_id VARCHAR(255) PRIMARY KEY,
    total_views INTEGER NOT NULL DEFAULT 0,
    unique_views INTEGER NOT NULL DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_character_views_character_id ON character_views(character_id);
CREATE INDEX IF NOT EXISTS idx_character_views_user_id ON character_views(user_id);
CREATE INDEX IF NOT EXISTS idx_character_views_viewed_at ON character_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_character_view_counts_total_views ON character_view_counts(total_views DESC);

-- Add comments
COMMENT ON TABLE character_views IS 'Individual view records for characters';
COMMENT ON TABLE character_view_counts IS 'Aggregated view counts for characters';
COMMENT ON COLUMN character_views.character_id IS 'ID/slug of the character being viewed';
COMMENT ON COLUMN character_views.user_id IS 'Firebase user ID (null for anonymous)';
COMMENT ON COLUMN character_views.ip_address IS 'IP address for anonymous tracking';
COMMENT ON COLUMN character_views.session_id IS 'Session ID to prevent duplicate views';
COMMENT ON COLUMN character_view_counts.total_views IS 'Total number of views';
COMMENT ON COLUMN character_view_counts.unique_views IS 'Number of unique viewers';
