-- Phase 14: Confession Engagement Features (Trending, Fresh Drops, Top Rated)
-- This migration adds SQL functions and indexes for engagement-based confession feeds

-- ============ INDEXES FOR PERFORMANCE ============

-- Index on created_at for fresh drops queries
CREATE INDEX IF NOT EXISTS idx_confessions_created_at_engagement ON confessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_mit_adt_created_at_engagement ON confessions_mit_adt(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_mit_wpu_created_at_engagement ON confessions_mit_wpu(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_vit_vellore_created_at_engagement ON confessions_vit_vellore(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_parul_university_created_at_engagement ON confessions_parul_university(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confessions_iict_created_at_engagement ON confessions_iict(created_at DESC);

-- Index on score (upvotes) for top rated queries
CREATE INDEX IF NOT EXISTS idx_confessions_score_engagement ON confessions(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_confessions_mit_adt_score_engagement ON confessions_mit_adt(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_confessions_mit_wpu_score_engagement ON confessions_mit_wpu(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_confessions_vit_vellore_score_engagement ON confessions_vit_vellore(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_confessions_parul_university_score_engagement ON confessions_parul_university(score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_confessions_iict_score_engagement ON confessions_iict(score DESC NULLS LAST);

-- ============ HELPER FUNCTION: COUNT COMMENTS FOR A CONFESSION ============
-- This function counts comments from all comment tables for a given confession_id
CREATE OR REPLACE FUNCTION get_comment_count_for_confession(p_confession_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER := 0;
BEGIN
  -- Count from all comment tables (main + per-campus)
  SELECT COALESCE(SUM(cnt), 0) INTO total_count
  FROM (
    SELECT COUNT(*) as cnt FROM comments WHERE confession_id = p_confession_id
    UNION ALL
    SELECT COUNT(*) FROM comments_mit_adt WHERE confession_id = p_confession_id
    UNION ALL
    SELECT COUNT(*) FROM comments_mit_wpu WHERE confession_id = p_confession_id
    UNION ALL
    SELECT COUNT(*) FROM comments_iict WHERE confession_id = p_confession_id
    UNION ALL
    SELECT COUNT(*) FROM comments_parul_university WHERE confession_id = p_confession_id
    UNION ALL
    SELECT COUNT(*) FROM comments_vit_vellore WHERE confession_id = p_confession_id
    UNION ALL
    SELECT COUNT(*) FROM sub_comments WHERE confession_id = p_confession_id
    UNION ALL
    SELECT COUNT(*) FROM sub_comments_mit_adt WHERE confession_id = p_confession_id
    UNION ALL
    SELECT COUNT(*) FROM sub_comments_mit_wpu WHERE confession_id = p_confession_id
    UNION ALL
    SELECT COUNT(*) FROM sub_comments_iict WHERE confession_id = p_confession_id
    UNION ALL
    SELECT COUNT(*) FROM sub_comments_parul_university WHERE confession_id = p_confession_id
    UNION ALL
    SELECT COUNT(*) FROM sub_comments_vit_vellore WHERE confession_id = p_confession_id
  ) AS comment_counts;
  
  RETURN total_count;
END;
$$ LANGUAGE plpgsql;

-- ============ TRENDING CONFESSIONS FUNCTION ============
-- Returns confessions sorted by engagement score: (upvotes * 1) + (comment_count * 3)
-- Prioritizes score over time (no specific timeframe)
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
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'mit-adt' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_mit_adt c
    WHERE (p_days_lookback IS NULL OR c.created_at >= NOW() - (p_days_lookback || ' days')::INTERVAL)
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'mit-wpu' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_mit_wpu c
    WHERE (p_days_lookback IS NULL OR c.created_at >= NOW() - (p_days_lookback || ' days')::INTERVAL)
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'vit-vellore' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_vit_vellore c
    WHERE (p_days_lookback IS NULL OR c.created_at >= NOW() - (p_days_lookback || ' days')::INTERVAL)
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'parul-university' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_parul_university c
    WHERE (p_days_lookback IS NULL OR c.created_at >= NOW() - (p_days_lookback || ' days')::INTERVAL)
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'iict' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_iict c
    WHERE (p_days_lookback IS NULL OR c.created_at >= NOW() - (p_days_lookback || ' days')::INTERVAL)
  ),
  confessions_with_engagement AS (
    SELECT 
      ac.*,
      -- Calculate engagement score: (upvotes * 1) + (comment_count * 3)
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
-- Returns random confessions from the last 24 hours, limited to 20 items
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
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'mit-adt' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_mit_adt c
    WHERE c.created_at >= NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'mit-wpu' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_mit_wpu c
    WHERE c.created_at >= NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'vit-vellore' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_vit_vellore c
    WHERE c.created_at >= NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'parul-university' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_parul_university c
    WHERE c.created_at >= NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'iict' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_iict c
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
-- Returns confessions sorted by upvotes (score) in descending order
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
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'mit-adt' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_mit_adt c
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'mit-wpu' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_mit_wpu c
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'vit-vellore' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_vit_vellore c
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'parul-university' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_parul_university c
    
    UNION ALL
    
    SELECT 
      c.id,
      c.content,
      c.alias,
      c.session_id,
      'iict' as campus,
      c.created_at,
      COALESCE(c.score, 0) as score,
      COALESCE(c.replies_count, 0) as replies_count,
      COALESCE(c.reactions, '{}'::jsonb) as reactions,
      c.poll,
      COALESCE(c.is_explicit, false) as is_explicit
    FROM confessions_iict c
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

