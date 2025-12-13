-- ============================================
-- Update RPC Functions: Remove Legacy Table References
-- ============================================
-- This script updates the three engagement RPC functions to query only
-- the main 'confessions' table, removing all references to the dropped
-- legacy tables.
--
-- Functions updated:
--  1. get_trending_confessions
--  2. get_fresh_random_confessions
--  3. get_top_rated_confessions
-- ============================================

-- ============ TRENDING CONFESSIONS FUNCTION ============
-- Returns confessions sorted by engagement score: (upvotes * 1) + (comment_count * 3)
-- Now queries only the unified 'confessions' table
CREATE OR REPLACE FUNCTION get_trending_confessions(
  p_limit_count INTEGER DEFAULT 20,
  p_days_lookback INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  content TEXT,
  alias JSONB,
  session_id TEXT,
  campus TEXT,
  created_at TIMESTAMP,
  score INTEGER,
  replies_count INTEGER,
  reactions JSONB,
  poll JSONB,
  is_explicit BOOLEAN,
  engagement_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH all_confessions AS (
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      COALESCE(c.campus, 'general') as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions c
    WHERE (p_days_lookback IS NULL OR c.created_at >= NOW() - (p_days_lookback || ' days')::INTERVAL)
  ),
  confessions_with_engagement AS (
    SELECT 
      ac.*,
      -- Calculate engagement score: (score * 1) + (comment_count * 3)
      (ac.score * 1.0 + get_comment_count_for_confession(ac.id) * 3.0) as engagement_score
    FROM all_confessions ac
  )
  SELECT 
    cwe.id,
    cwe.content,
    cwe.alias,
    cwe.session_id,
    cwe.campus,
    cwe.created_at,
    cwe.score,
    cwe.replies_count,
    cwe.reactions,
    cwe.poll,
    cwe.is_explicit,
    cwe.engagement_score
  FROM confessions_with_engagement cwe
  ORDER BY cwe.engagement_score DESC, cwe.created_at DESC
  LIMIT p_limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============ FRESH DROPS FUNCTION ============
-- Returns random confessions from the last 24 hours, limited to specified count
-- Now queries only the unified 'confessions' table
CREATE OR REPLACE FUNCTION get_fresh_random_confessions(
  p_limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id TEXT,
  content TEXT,
  alias JSONB,
  session_id TEXT,
  campus TEXT,
  created_at TIMESTAMP,
  score INTEGER,
  replies_count INTEGER,
  reactions JSONB,
  poll JSONB,
  is_explicit BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH all_confessions AS (
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      COALESCE(c.campus, 'general') as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions c
    WHERE c.created_at >= NOW() - INTERVAL '24 hours'
  )
  SELECT 
    ac.id,
    ac.content,
    ac.alias,
    ac.session_id,
    ac.campus,
    ac.created_at,
    ac.score,
    ac.replies_count,
    ac.reactions,
    ac.poll,
    ac.is_explicit
  FROM all_confessions ac
  ORDER BY RANDOM()
  LIMIT p_limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============ TOP RATED (ALL TIME) FUNCTION ============
-- Returns confessions sorted by score in descending order
-- Now queries only the unified 'confessions' table
CREATE OR REPLACE FUNCTION get_top_rated_confessions(
  p_limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id TEXT,
  content TEXT,
  alias JSONB,
  session_id TEXT,
  campus TEXT,
  created_at TIMESTAMP,
  score INTEGER,
  replies_count INTEGER,
  reactions JSONB,
  poll JSONB,
  is_explicit BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH all_confessions AS (
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      COALESCE(c.campus, 'general') as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions c
  )
  SELECT 
    ac.id,
    ac.content,
    ac.alias,
    ac.session_id,
    ac.campus,
    ac.created_at,
    ac.score,
    ac.replies_count,
    ac.reactions,
    ac.poll,
    ac.is_explicit
  FROM all_confessions ac
  ORDER BY ac.score DESC NULLS LAST, ac.created_at DESC
  LIMIT p_limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Verification Query
-- ============================================
-- Verify the functions were updated successfully
SELECT 
  routine_name,
  routine_type,
  '✅ Updated successfully' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_trending_confessions', 'get_fresh_random_confessions', 'get_top_rated_confessions')
ORDER BY routine_name;

