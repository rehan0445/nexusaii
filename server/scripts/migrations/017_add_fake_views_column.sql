-- Migration 017: Add fake_views column to character_view_counts table
-- This migration adds a column to store fake views for display purposes
-- Display views = total_views + fake_views

-- Add fake_views column to character_view_counts table
ALTER TABLE character_view_counts 
ADD COLUMN IF NOT EXISTS fake_views INTEGER NOT NULL DEFAULT 0;

-- Add index for performance (if needed for queries)
CREATE INDEX IF NOT EXISTS idx_character_view_counts_fake_views 
ON character_view_counts(fake_views);

-- Add comment for documentation
COMMENT ON COLUMN character_view_counts.fake_views IS 'Fake views added for display purposes. Display views = total_views + fake_views. Values are set once via migration and remain constant.';

-- Create a view for easier querying (optional but helpful)
CREATE OR REPLACE VIEW character_display_views AS
SELECT 
  character_id,
  total_views,
  fake_views,
  (total_views + fake_views) AS display_views,
  unique_views,
  last_viewed_at,
  updated_at
FROM character_view_counts;

-- Add comment to view
COMMENT ON VIEW character_display_views IS 'View that calculates display_views = total_views + fake_views for easier querying';

