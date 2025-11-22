-- Campus scoping migration: ensure per-campus separation for Confessions, Replies, and Announcements

-- 1) Confession replies: add campus column if missing
ALTER TABLE IF EXISTS confession_replies
  ADD COLUMN IF NOT EXISTS campus TEXT;

-- 2) Confessions: ensure campus composite index for fast campus feeds
CREATE INDEX IF NOT EXISTS idx_confessions_campus_created_at
  ON confessions(campus, created_at DESC);

-- 3) Confession replies: campus and created_at composite index
CREATE INDEX IF NOT EXISTS idx_confession_replies_campus_created_at
  ON confession_replies(campus, created_at ASC);

-- 4) Announcements: ensure campus column exists and composite index
ALTER TABLE IF EXISTS announcements
  ADD COLUMN IF NOT EXISTS campus TEXT;

CREATE INDEX IF NOT EXISTS idx_announcements_campus_created_at
  ON announcements(campus, created_at DESC);

-- 5) Backfill campus values where NULL
-- Default to 'mit-adt' if unknown; adjust as needed per deployment
UPDATE confessions SET campus = 'mit-adt' WHERE campus IS NULL;
UPDATE confession_replies r
SET campus = COALESCE(r.campus, c.campus, 'mit-adt')
FROM confessions c
WHERE r.confession_id = c.id AND r.campus IS NULL;

UPDATE announcements SET campus = COALESCE(campus, 'all');

-- 6) Optional: basic RLS allowing public reads (writes controlled at API layer)
-- Enable RLS if not already enabled
ALTER TABLE IF EXISTS confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS confession_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS announcements ENABLE ROW LEVEL SECURITY;

-- Allow read for all
DO $$ BEGIN
  CREATE POLICY confessions_read_all ON confessions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY confession_replies_read_all ON confession_replies FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY announcements_read_all ON announcements FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


