-- Campus-specific Announcements and Lost & Found tables for 5 campuses
-- Campuses: mit-adt, mit-wpu, iict, parul-university, vit-vellore

-- Helper to create announcements table
-- Columns: id, campus, user_name, title, content, category, priority, tags, event_date, created_at, updated_at

CREATE TABLE IF NOT EXISTS announcements_mit_adt (
  id TEXT PRIMARY KEY,
  campus TEXT DEFAULT 'mit-adt',
  user_name TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  priority TEXT,
  tags TEXT[],
  event_date TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements_mit_wpu (LIKE announcements_mit_adt INCLUDING ALL);
ALTER TABLE announcements_mit_wpu ALTER COLUMN campus SET DEFAULT 'mit-wpu';

CREATE TABLE IF NOT EXISTS announcements_iict (LIKE announcements_mit_adt INCLUDING ALL);
ALTER TABLE announcements_iict ALTER COLUMN campus SET DEFAULT 'iict';

CREATE TABLE IF NOT EXISTS announcements_parul_university (LIKE announcements_mit_adt INCLUDING ALL);
ALTER TABLE announcements_parul_university ALTER COLUMN campus SET DEFAULT 'parul-university';

CREATE TABLE IF NOT EXISTS announcements_vit_vellore (LIKE announcements_mit_adt INCLUDING ALL);
ALTER TABLE announcements_vit_vellore ALTER COLUMN campus SET DEFAULT 'vit-vellore';

-- Indexes for announcements tables
CREATE INDEX IF NOT EXISTS announcements_mit_adt_created_at_idx ON announcements_mit_adt(created_at DESC);
CREATE INDEX IF NOT EXISTS announcements_mit_wpu_created_at_idx ON announcements_mit_wpu(created_at DESC);
CREATE INDEX IF NOT EXISTS announcements_iict_created_at_idx ON announcements_iict(created_at DESC);
CREATE INDEX IF NOT EXISTS announcements_parul_university_created_at_idx ON announcements_parul_university(created_at DESC);
CREATE INDEX IF NOT EXISTS announcements_vit_vellore_created_at_idx ON announcements_vit_vellore(created_at DESC);

-- Lost & Found tables per campus
-- Columns: id, campus, user_name, title, description, category, item_type, location, photos, tags, created_at, updated_at

CREATE TABLE IF NOT EXISTS lost_found_mit_adt (
  id TEXT PRIMARY KEY,
  campus TEXT DEFAULT 'mit-adt',
  user_name TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  item_type TEXT,
  location TEXT,
  photos TEXT[],
  tags TEXT[],
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lost_found_mit_wpu (LIKE lost_found_mit_adt INCLUDING ALL);
ALTER TABLE lost_found_mit_wpu ALTER COLUMN campus SET DEFAULT 'mit-wpu';

CREATE TABLE IF NOT EXISTS lost_found_iict (LIKE lost_found_mit_adt INCLUDING ALL);
ALTER TABLE lost_found_iict ALTER COLUMN campus SET DEFAULT 'iict';

CREATE TABLE IF NOT EXISTS lost_found_parul_university (LIKE lost_found_mit_adt INCLUDING ALL);
ALTER TABLE lost_found_parul_university ALTER COLUMN campus SET DEFAULT 'parul-university';

CREATE TABLE IF NOT EXISTS lost_found_vit_vellore (LIKE lost_found_mit_adt INCLUDING ALL);
ALTER TABLE lost_found_vit_vellore ALTER COLUMN campus SET DEFAULT 'vit-vellore';

-- Indexes for lost_found tables
CREATE INDEX IF NOT EXISTS lost_found_mit_adt_created_at_idx ON lost_found_mit_adt(created_at DESC);
CREATE INDEX IF NOT EXISTS lost_found_mit_wpu_created_at_idx ON lost_found_mit_wpu(created_at DESC);
CREATE INDEX IF NOT EXISTS lost_found_iict_created_at_idx ON lost_found_iict(created_at DESC);
CREATE INDEX IF NOT EXISTS lost_found_parul_university_created_at_idx ON lost_found_parul_university(created_at DESC);
CREATE INDEX IF NOT EXISTS lost_found_vit_vellore_created_at_idx ON lost_found_vit_vellore(created_at DESC);

-- Ensure confession campus tables exist and add required author/engagement columns
-- We add columns if missing to avoid errors when re-running migrations

DO $$ BEGIN
  -- MIT ADT
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'confessions_mit_adt') THEN
    CREATE TABLE confessions_mit_adt (LIKE confessions INCLUDING ALL);
    ALTER TABLE confessions_mit_adt ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'mit-adt';
  END IF;
  ALTER TABLE confessions_mit_adt
    ADD COLUMN IF NOT EXISTS user_name TEXT,
    ADD COLUMN IF NOT EXISTS user_email TEXT,
    ADD COLUMN IF NOT EXISTS anonymous_name TEXT,
    ADD COLUMN IF NOT EXISTS avatar JSONB,
    ADD COLUMN IF NOT EXISTS uploads JSONB,
    ADD COLUMN IF NOT EXISTS search_history JSONB;

  -- MIT WPU
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'confessions_mit_wpu') THEN
    CREATE TABLE confessions_mit_wpu (LIKE confessions INCLUDING ALL);
    ALTER TABLE confessions_mit_wpu ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'mit-wpu';
  END IF;
  ALTER TABLE confessions_mit_wpu
    ADD COLUMN IF NOT EXISTS user_name TEXT,
    ADD COLUMN IF NOT EXISTS user_email TEXT,
    ADD COLUMN IF NOT EXISTS anonymous_name TEXT,
    ADD COLUMN IF NOT EXISTS avatar JSONB,
    ADD COLUMN IF NOT EXISTS uploads JSONB,
    ADD COLUMN IF NOT EXISTS search_history JSONB;

  -- IICT
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'confessions_iict') THEN
    CREATE TABLE confessions_iict (LIKE confessions INCLUDING ALL);
    ALTER TABLE confessions_iict ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'iict';
  END IF;
  ALTER TABLE confessions_iict
    ADD COLUMN IF NOT EXISTS user_name TEXT,
    ADD COLUMN IF NOT EXISTS user_email TEXT,
    ADD COLUMN IF NOT EXISTS anonymous_name TEXT,
    ADD COLUMN IF NOT EXISTS avatar JSONB,
    ADD COLUMN IF NOT EXISTS uploads JSONB,
    ADD COLUMN IF NOT EXISTS search_history JSONB;

  -- Parul University
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'confessions_parul_university') THEN
    CREATE TABLE confessions_parul_university (LIKE confessions INCLUDING ALL);
    ALTER TABLE confessions_parul_university ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'parul-university';
  END IF;
  ALTER TABLE confessions_parul_university
    ADD COLUMN IF NOT EXISTS user_name TEXT,
    ADD COLUMN IF NOT EXISTS user_email TEXT,
    ADD COLUMN IF NOT EXISTS anonymous_name TEXT,
    ADD COLUMN IF NOT EXISTS avatar JSONB,
    ADD COLUMN IF NOT EXISTS uploads JSONB,
    ADD COLUMN IF NOT EXISTS search_history JSONB;

  -- VIT Vellore
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'confessions_vit_vellore') THEN
    CREATE TABLE confessions_vit_vellore (LIKE confessions INCLUDING ALL);
    ALTER TABLE confessions_vit_vellore ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'vit-vellore';
  END IF;
  ALTER TABLE confessions_vit_vellore
    ADD COLUMN IF NOT EXISTS user_name TEXT,
    ADD COLUMN IF NOT EXISTS user_email TEXT,
    ADD COLUMN IF NOT EXISTS anonymous_name TEXT,
    ADD COLUMN IF NOT EXISTS avatar JSONB,
    ADD COLUMN IF NOT EXISTS uploads JSONB,
    ADD COLUMN IF NOT EXISTS search_history JSONB;
END $$;

-- Store nested comments/replies (threading) already exists in confession_replies; ensure columns for attachments/emojis if needed
DO $$ BEGIN
  BEGIN
    ALTER TABLE confession_replies ADD COLUMN emojis JSONB;
  EXCEPTION WHEN duplicate_column THEN
    -- ignore
    NULL;
  END;
  BEGIN
    ALTER TABLE confession_replies ADD COLUMN uploads JSONB;
  EXCEPTION WHEN duplicate_column THEN
    -- ignore
    NULL;
  END;
END $$;

-- Poll votes for confessions (who voted which option)
CREATE TABLE IF NOT EXISTS confession_poll_votes (
  confession_id TEXT NOT NULL,
  voter_session_id TEXT NOT NULL,
  option TEXT NOT NULL,
  voted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (confession_id, voter_session_id)
);
CREATE INDEX IF NOT EXISTS idx_confession_poll_votes_confession ON confession_poll_votes(confession_id);


