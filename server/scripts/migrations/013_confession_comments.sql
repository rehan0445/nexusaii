-- Per-campus comment storage split into comments and sub_comments
-- Campuses: mit-adt, mit-wpu, iict, parul-university, vit-vellore

-- Each comments_<campus> table stores root-level comments for confessions
-- Columns: id, confession_id, campus, content, alias, session_id, created_at, score, metadata

CREATE TABLE IF NOT EXISTS comments_mit_adt (
  id TEXT PRIMARY KEY,
  confession_id TEXT NOT NULL,
  campus TEXT DEFAULT 'mit-adt',
  content TEXT NOT NULL,
  alias JSONB,
  session_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  score INTEGER DEFAULT 0,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS comments_mit_wpu (LIKE comments_mit_adt INCLUDING ALL);
ALTER TABLE comments_mit_wpu ALTER COLUMN campus SET DEFAULT 'mit-wpu';
CREATE TABLE IF NOT EXISTS comments_iict (LIKE comments_mit_adt INCLUDING ALL);
ALTER TABLE comments_iict ALTER COLUMN campus SET DEFAULT 'iict';
CREATE TABLE IF NOT EXISTS comments_parul_university (LIKE comments_mit_adt INCLUDING ALL);
ALTER TABLE comments_parul_university ALTER COLUMN campus SET DEFAULT 'parul-university';
CREATE TABLE IF NOT EXISTS comments_vit_vellore (LIKE comments_mit_adt INCLUDING ALL);
ALTER TABLE comments_vit_vellore ALTER COLUMN campus SET DEFAULT 'vit-vellore';

CREATE INDEX IF NOT EXISTS comments_mit_adt_confession_idx ON comments_mit_adt(confession_id, created_at);
CREATE INDEX IF NOT EXISTS comments_mit_wpu_confession_idx ON comments_mit_wpu(confession_id, created_at);
CREATE INDEX IF NOT EXISTS comments_iict_confession_idx ON comments_iict(confession_id, created_at);
CREATE INDEX IF NOT EXISTS comments_parul_university_confession_idx ON comments_parul_university(confession_id, created_at);
CREATE INDEX IF NOT EXISTS comments_vit_vellore_confession_idx ON comments_vit_vellore(confession_id, created_at);

-- Each sub_comments_<campus> table stores replies to comments (nested under comments)
-- Columns: id, comment_id, confession_id, campus, content, alias, session_id, created_at, score, metadata

CREATE TABLE IF NOT EXISTS sub_comments_mit_adt (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL,
  confession_id TEXT NOT NULL,
  campus TEXT DEFAULT 'mit-adt',
  content TEXT NOT NULL,
  alias JSONB,
  session_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  score INTEGER DEFAULT 0,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS sub_comments_mit_wpu (LIKE sub_comments_mit_adt INCLUDING ALL);
ALTER TABLE sub_comments_mit_wpu ALTER COLUMN campus SET DEFAULT 'mit-wpu';
CREATE TABLE IF NOT EXISTS sub_comments_iict (LIKE sub_comments_mit_adt INCLUDING ALL);
ALTER TABLE sub_comments_iict ALTER COLUMN campus SET DEFAULT 'iict';
CREATE TABLE IF NOT EXISTS sub_comments_parul_university (LIKE sub_comments_mit_adt INCLUDING ALL);
ALTER TABLE sub_comments_parul_university ALTER COLUMN campus SET DEFAULT 'parul-university';
CREATE TABLE IF NOT EXISTS sub_comments_vit_vellore (LIKE sub_comments_mit_adt INCLUDING ALL);
ALTER TABLE sub_comments_vit_vellore ALTER COLUMN campus SET DEFAULT 'vit-vellore';

CREATE INDEX IF NOT EXISTS sub_comments_mit_adt_comment_idx ON sub_comments_mit_adt(comment_id, created_at);
CREATE INDEX IF NOT EXISTS sub_comments_mit_wpu_comment_idx ON sub_comments_mit_wpu(comment_id, created_at);
CREATE INDEX IF NOT EXISTS sub_comments_iict_comment_idx ON sub_comments_iict(comment_id, created_at);
CREATE INDEX IF NOT EXISTS sub_comments_parul_university_comment_idx ON sub_comments_parul_university(comment_id, created_at);
CREATE INDEX IF NOT EXISTS sub_comments_vit_vellore_comment_idx ON sub_comments_vit_vellore(comment_id, created_at);


