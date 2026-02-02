import { supabase } from "../config/supabase.js";

// Helper function to normalize confession data
// IMPORTANT: Returns combined metrics (fake + real) for display
// Never expose fake_views or fake_upvotes to frontend
const normalizeConfession = (row) => {
  if (!row) return null;
  
  // Calculate combined metrics if fake metrics are available
  const fakeViews = row.fake_views ?? 0;
  const fakeUpvotes = row.fake_upvotes ?? 0;
  const realViews = row.view_count ?? 0;
  const realScore = row.score ?? 0;
  
  // Combined totals for display (use pre-calculated if available, otherwise calculate)
  const totalViews = row.total_views ?? (fakeViews + realViews);
  const totalUpvotes = row.total_upvotes ?? Math.max(0, fakeUpvotes + realScore);
  
  return {
    id: String(row.id),
    content: row.content ?? "",
    alias: row.alias,
    sessionId: row.sessionId ?? row.session_id ?? row.user_id ?? null,
    campus: row.campus ?? 'general',
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    // DISPLAY VALUES: Combined fake + real metrics
    score: totalUpvotes,
    viewCount: totalViews,
    // Keep real score for voting logic (internal use)
    realScore: realScore,
    replies: row.replies_count ?? row.replies ?? 0,
    reactions: row.reactions && typeof row.reactions === "object" ? row.reactions : {},
    poll: row.poll,
    isExplicit: Boolean(row.isExplicit ?? row.is_explicit ?? false),
    engagementScore: row.engagement_score || 0
  };
};

// Fallback function to get confessions from all tables (general confessions aggregation)
// Updated to prioritize the main 'confessions' table, with fallback to legacy tables if needed
const getConfessionsFallback = async (limit, sortBy = 'created_at', filter24h = false) => {
  console.log(`[FALLBACK] Fetching confessions with limit=${limit}, sortBy=${sortBy}, filter24h=${filter24h}`);
  
  // Primary table is 'confessions' (new unified table)
  // Legacy tables removed after migration
  const allTables = [
    'confessions'  // Unified table - all data migrated here
  ];

  const allConfessions = [];
  const cutoffTime = filter24h ? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() : null;

  for (const tableName of allTables) {
    try {
      let query = supabase
        .from(tableName)
        .select("*")
        .order(sortBy, { ascending: false })
        .limit(limit * 2); // Get more to account for filtering

      if (filter24h) {
        query = query.gte('created_at', cutoffTime);
      }

      const { data, error } = await query;

      if (error) {
        console.warn(`[FALLBACK] Error fetching from ${tableName}:`, error.message);
        continue;
      }

      if (Array.isArray(data)) {
        const normalized = data.map(normalizeConfession).filter(Boolean);
        allConfessions.push(...normalized);
      }
    } catch (error) {
      console.warn(`[FALLBACK] Exception fetching from ${tableName}:`, error.message);
    }
  }

  // Sort and limit
  if (sortBy === 'score') {
    allConfessions.sort((a, b) => (b.score || 0) - (a.score || 0));
  } else {
    allConfessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // For fresh drops, randomize
  if (filter24h) {
    // Shuffle array
    for (let i = allConfessions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allConfessions[i], allConfessions[j]] = [allConfessions[j], allConfessions[i]];
    }
  }

  return allConfessions.slice(0, limit);
};

/**
 * Get trending confessions based on engagement score (with combined fake + real metrics)
 * Score = (total_upvotes * 1) + (comment_count * 3)
 * GET /api/confessions/trending
 */
export const getTrendingConfessions = async (req, res) => {
  const startTime = Date.now();
  console.log(`\n[TRENDING] ========================================`);
  console.log(`[TRENDING] Request received at ${new Date().toISOString()}`);
  console.log(`[TRENDING] Query params:`, req.query);

  try {
    const limit = Math.min(Number.parseInt(req.query.limit || "20", 10), 100);
    const daysLookback = req.query.daysLookback 
      ? Number.parseInt(req.query.daysLookback, 10) 
      : null;

    console.log(`[TRENDING] Calling RPC: get_trending_confessions_with_metrics with limit=${limit}, daysLookback=${daysLookback}`);

    // Use new RPC with combined metrics
    const { data, error } = await supabase.rpc("get_trending_confessions_with_metrics", {
      p_limit: limit,
      p_days_lookback: daysLookback
    });

    if (error) {
      console.error(`[TRENDING] ❌ RPC Error Details:`);
      console.error(`[TRENDING]   - Code: ${error.code || 'N/A'}`);
      console.error(`[TRENDING]   - Message: ${error.message}`);
      console.error(`[TRENDING]   - Details: ${error.details || 'N/A'}`);
      console.error(`[TRENDING]   - Hint: ${error.hint || 'N/A'}`);
      console.error(`[TRENDING]   - Full Error:`, JSON.stringify(error, null, 2));

      // Fallback to direct query
      console.log(`[TRENDING] ⚠️  Falling back to direct table queries...`);
      const fallbackData = await getConfessionsFallback(limit, 'score', false);
      
      // Calculate engagement score for fallback data
      const dataWithEngagement = await Promise.all(
        fallbackData.map(async (confession) => {
          // Try to get comment count (simplified - just use replies_count)
          const commentCount = confession.replies || 0;
          const engagementScore = (confession.score || 0) * 1 + commentCount * 3;
          return {
            ...confession,
            engagementScore
          };
        })
      );

      // Sort by engagement score
      dataWithEngagement.sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));

      console.log(`[TRENDING] ✅ Fallback returned ${dataWithEngagement.length} confessions`);
      console.log(`[TRENDING] Completed in ${Date.now() - startTime}ms`);

      return res.json({
        success: true,
        data: dataWithEngagement.slice(0, limit),
        count: dataWithEngagement.length,
        fallback: true
      });
    }

    console.log(`[TRENDING] ✅ RPC Success - Received ${data?.length || 0} confessions`);

    // Normalize the data to match the expected format
    // IMPORTANT: Use combined metrics (total_views, total_upvotes) for display
    const normalizedData = (data || []).map((confession) => ({
      id: confession.id,
      content: confession.content,
      alias: confession.alias,
      sessionId: confession.session_id,
      campus: confession.campus || "general",
      createdAt: confession.created_at,
      // Use combined total_upvotes (fake + real) for display
      score: confession.total_upvotes ?? confession.score ?? 0,
      // Use combined total_views (fake + real) for display
      viewCount: confession.total_views ?? confession.view_count ?? 0,
      replies: confession.replies_count || 0,
      reactions: confession.reactions || {},
      poll: confession.poll,
      isExplicit: confession.is_explicit || false,
      engagementScore: confession.engagement_score || 0
    }));

    console.log(`[TRENDING] ✅ Normalized ${normalizedData.length} confessions with combined metrics`);
    console.log(`[TRENDING] Completed in ${Date.now() - startTime}ms`);

    return res.json({
      success: true,
      data: normalizedData,
      count: normalizedData.length,
      fallback: false
    });
  } catch (error) {
    console.error(`[TRENDING] ❌ Exception in getTrendingConfessions:`);
    console.error(`[TRENDING]   - Type: ${error.constructor.name}`);
    console.error(`[TRENDING]   - Message: ${error.message}`);
    console.error(`[TRENDING]   - Stack:`, error.stack);

    // Try fallback even on exception
    try {
      console.log(`[TRENDING] ⚠️  Attempting fallback after exception...`);
      const fallbackData = await getConfessionsFallback(20, 'score', false);
      const dataWithEngagement = fallbackData.map((confession) => {
        const commentCount = confession.replies || 0;
        const engagementScore = (confession.score || 0) * 1 + commentCount * 3;
        return { ...confession, engagementScore };
      });
      dataWithEngagement.sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0));

      return res.json({
        success: true,
        data: dataWithEngagement.slice(0, 20),
        count: dataWithEngagement.length,
        fallback: true,
        error: error.message
      });
    } catch (fallbackError) {
      console.error(`[TRENDING] ❌ Fallback also failed:`, fallbackError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch trending confessions",
        error: error.message,
        fallbackError: fallbackError.message
      });
    }
  }
};

/**
 * Get fresh confessions (random selection from last 24 hours, with combined metrics)
 * GET /api/confessions/fresh
 */
export const getFreshConfessions = async (req, res) => {
  const startTime = Date.now();
  console.log(`\n[FRESH] ========================================`);
  console.log(`[FRESH] Request received at ${new Date().toISOString()}`);
  console.log(`[FRESH] Query params:`, req.query);

  try {
    const limit = Math.min(Number.parseInt(req.query.limit || "20", 10), 100);

    console.log(`[FRESH] Calling RPC: get_fresh_confessions_with_metrics with limit=${limit}`);

    // Use new RPC with combined metrics
    const { data, error } = await supabase.rpc("get_fresh_confessions_with_metrics", {
      p_limit: limit
    });

    if (error) {
      console.error(`[FRESH] ❌ RPC Error Details:`);
      console.error(`[FRESH]   - Code: ${error.code || 'N/A'}`);
      console.error(`[FRESH]   - Message: ${error.message}`);
      console.error(`[FRESH]   - Details: ${error.details || 'N/A'}`);
      console.error(`[FRESH]   - Hint: ${error.hint || 'N/A'}`);
      console.error(`[FRESH]   - Full Error:`, JSON.stringify(error, null, 2));

      // Fallback to direct query
      console.log(`[FRESH] ⚠️  Falling back to direct table queries (24h filter)...`);
      const fallbackData = await getConfessionsFallback(limit, 'created_at', true);

      console.log(`[FRESH] ✅ Fallback returned ${fallbackData.length} confessions`);
      console.log(`[FRESH] Completed in ${Date.now() - startTime}ms`);

      return res.json({
        success: true,
        data: fallbackData,
        count: fallbackData.length,
        fallback: true
      });
    }

    console.log(`[FRESH] ✅ RPC Success - Received ${data?.length || 0} confessions`);

    // Normalize the data to match the expected format
    // IMPORTANT: Use combined metrics (total_views, total_upvotes) for display
    const normalizedData = (data || []).map((confession) => ({
      id: confession.id,
      content: confession.content,
      alias: confession.alias,
      sessionId: confession.session_id,
      campus: confession.campus || "general",
      createdAt: confession.created_at,
      // Use combined total_upvotes (fake + real) for display
      score: confession.total_upvotes ?? confession.score ?? 0,
      // Use combined total_views (fake + real) for display
      viewCount: confession.total_views ?? confession.view_count ?? 0,
      replies: confession.replies_count || 0,
      reactions: confession.reactions || {},
      poll: confession.poll,
      isExplicit: confession.is_explicit || false
    }));

    console.log(`[FRESH] ✅ Normalized ${normalizedData.length} confessions with combined metrics`);
    console.log(`[FRESH] Completed in ${Date.now() - startTime}ms`);

    return res.json({
      success: true,
      data: normalizedData,
      count: normalizedData.length,
      fallback: false
    });
  } catch (error) {
    console.error(`[FRESH] ❌ Exception in getFreshConfessions:`);
    console.error(`[FRESH]   - Type: ${error.constructor.name}`);
    console.error(`[FRESH]   - Message: ${error.message}`);
    console.error(`[FRESH]   - Stack:`, error.stack);

    // Try fallback even on exception
    try {
      console.log(`[FRESH] ⚠️  Attempting fallback after exception...`);
      const fallbackData = await getConfessionsFallback(20, 'created_at', true);

      return res.json({
        success: true,
        data: fallbackData,
        count: fallbackData.length,
        fallback: true,
        error: error.message
      });
    } catch (fallbackError) {
      console.error(`[FRESH] ❌ Fallback also failed:`, fallbackError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch fresh confessions",
        error: error.message,
        fallbackError: fallbackError.message
      });
    }
  }
};

/**
 * Get top rated confessions (all time, sorted by combined upvotes: fake + real)
 * GET /api/confessions/top
 */
export const getTopRatedConfessions = async (req, res) => {
  const startTime = Date.now();
  console.log(`\n[TOP] ========================================`);
  console.log(`[TOP] Request received at ${new Date().toISOString()}`);
  console.log(`[TOP] Query params:`, req.query);

  try {
    const limit = Math.min(Number.parseInt(req.query.limit || "20", 10), 100);

    console.log(`[TOP] Calling RPC: get_top_rated_confessions_with_metrics with limit=${limit}`);

    // Use new RPC with combined metrics
    const { data, error } = await supabase.rpc("get_top_rated_confessions_with_metrics", {
      p_limit: limit
    });

    if (error) {
      console.error(`[TOP] ❌ RPC Error Details:`);
      console.error(`[TOP]   - Code: ${error.code || 'N/A'}`);
      console.error(`[TOP]   - Message: ${error.message}`);
      console.error(`[TOP]   - Details: ${error.details || 'N/A'}`);
      console.error(`[TOP]   - Hint: ${error.hint || 'N/A'}`);
      console.error(`[TOP]   - Full Error:`, JSON.stringify(error, null, 2));

      // Fallback to direct query
      console.log(`[TOP] ⚠️  Falling back to direct table queries...`);
      const fallbackData = await getConfessionsFallback(limit, 'score', false);

      console.log(`[TOP] ✅ Fallback returned ${fallbackData.length} confessions`);
      console.log(`[TOP] Completed in ${Date.now() - startTime}ms`);

      return res.json({
        success: true,
        data: fallbackData,
        count: fallbackData.length,
        fallback: true
      });
    }

    console.log(`[TOP] ✅ RPC Success - Received ${data?.length || 0} confessions`);

    // Normalize the data to match the expected format
    // IMPORTANT: Use combined metrics (total_views, total_upvotes) for display
    const normalizedData = (data || []).map((confession) => ({
      id: confession.id,
      content: confession.content,
      alias: confession.alias,
      sessionId: confession.session_id,
      campus: confession.campus || "general",
      createdAt: confession.created_at,
      // Use combined total_upvotes (fake + real) for display
      score: confession.total_upvotes ?? confession.score ?? 0,
      // Use combined total_views (fake + real) for display
      viewCount: confession.total_views ?? confession.view_count ?? 0,
      replies: confession.replies_count || 0,
      reactions: confession.reactions || {},
      poll: confession.poll,
      isExplicit: confession.is_explicit || false
    }));

    console.log(`[TOP] ✅ Normalized ${normalizedData.length} confessions with combined metrics`);
    console.log(`[TOP] Completed in ${Date.now() - startTime}ms`);

    return res.json({
      success: true,
      data: normalizedData,
      count: normalizedData.length,
      fallback: false
    });
  } catch (error) {
    console.error(`[TOP] ❌ Exception in getTopRatedConfessions:`);
    console.error(`[TOP]   - Type: ${error.constructor.name}`);
    console.error(`[TOP]   - Message: ${error.message}`);
    console.error(`[TOP]   - Stack:`, error.stack);

    // Try fallback even on exception
    try {
      console.log(`[TOP] ⚠️  Attempting fallback after exception...`);
      const fallbackData = await getConfessionsFallback(20, 'score', false);

      return res.json({
        success: true,
        data: fallbackData,
        count: fallbackData.length,
        fallback: true,
        error: error.message
      });
    } catch (fallbackError) {
      console.error(`[TOP] ❌ Fallback also failed:`, fallbackError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch top rated confessions",
        error: error.message,
        fallbackError: fallbackError.message
      });
    }
  }
};

/**
 * Get all confessions (sorted by combined view count: fake + real)
 * GET /api/confessions/all
 * 
 * This endpoint uses an RPC function that JOINs confessions with fake_metrics
 * to return combined totals sorted by total_views (fake + real) descending.
 * Supports pagination via cursor parameter.
 */
export const getAllConfessions = async (req, res) => {
  const startTime = Date.now();
  console.log(`\n[ALL] ========================================`);
  console.log(`[ALL] Request received at ${new Date().toISOString()}`);
  console.log(`[ALL] Query params:`, JSON.stringify(req.query, null, 2));

  try {
    const limit = Math.min(Number.parseInt(req.query.limit || "30", 10), 100);
    const cursor = Number.parseInt(req.query.cursor || "0", 10);

    console.log(`[ALL] 📋 Calling RPC: get_confessions_with_combined_metrics(limit=${limit}, offset=${cursor})`);
    console.log(`[ALL] 📋 Query details: limit=${limit}, cursor=${cursor}, sorted by total_views DESC (fake + real)`);

    // Use RPC function to get confessions with combined fake + real metrics
    // Sorted by total_views (fake_views + real_views) descending
    const { data, error } = await supabase.rpc('get_confessions_with_combined_metrics', {
      p_limit: limit,
      p_offset: cursor
    });
    
    // Get total count for pagination
    const { data: countData } = await supabase.rpc('get_confessions_total_count');
    const count = countData || 0;

    // Detailed error logging
    if (error) {
      console.error(`[ALL] ❌ Query Error Details:`);
      console.error(`[ALL]   - Code: ${error.code || 'N/A'}`);
      console.error(`[ALL]   - Message: ${error.message}`);
      console.error(`[ALL]   - Details: ${error.details || 'N/A'}`);
      console.error(`[ALL]   - Hint: ${error.hint || 'N/A'}`);
      console.error(`[ALL]   - Full Error Object:`, JSON.stringify(error, null, 2));

      // Fallback to aggregated query from all tables
      console.log(`[ALL] ⚠️  Falling back to aggregated table queries...`);
      const fallbackData = await getConfessionsFallback(limit, 'created_at', false);

      console.log(`[ALL] ✅ Fallback returned ${fallbackData.length} confessions`);
      console.log(`[ALL] Completed in ${Date.now() - startTime}ms`);

      return res.json({
        success: true,
        data: fallbackData,
        count: fallbackData.length,
        fallback: true,
        originalError: error.message
      });
    }

    // Check if data is empty
    const dataLength = data?.length || 0;
    console.log(`[ALL] ✅ Query Success - Received ${dataLength} confessions`);
    
    if (dataLength === 0) {
      console.warn(`[ALL] ⚠️  WARNING: Query returned 0 confessions from 'confessions' table`);
      console.warn(`[ALL] ⚠️  This could mean:`);
      console.warn(`[ALL]     1. The table is empty`);
      console.warn(`[ALL]     2. RLS policies are blocking access`);
      console.warn(`[ALL]     3. Data should be in the 'confessions' table`);
      console.warn(`[ALL] ⚠️  Attempting fallback to aggregated tables...`);
      
      const fallbackData = await getConfessionsFallback(limit, 'created_at', false);
      console.log(`[ALL] ✅ Fallback returned ${fallbackData.length} confessions from aggregated tables`);
      
      return res.json({
        success: true,
        data: fallbackData,
        count: fallbackData.length,
        fallback: true,
        warning: 'Main table returned empty, using aggregated tables'
      });
    }

    // Log sample data for debugging (including combined metrics)
    if (dataLength > 0) {
      console.log(`[ALL] 📊 Sample confession (first item):`, {
        id: data[0]?.id,
        content_preview: data[0]?.content?.substring(0, 50) + '...',
        created_at: data[0]?.created_at,
        real_views: data[0]?.view_count,
        fake_views: data[0]?.fake_views,
        total_views: data[0]?.total_views,
        real_score: data[0]?.score,
        fake_upvotes: data[0]?.fake_upvotes,
        total_upvotes: data[0]?.total_upvotes,
        has_alias: !!data[0]?.alias
      });
    }

    // Normalize the data - this will use combined metrics for display
    // IMPORTANT: fake_views and fake_upvotes are stripped out, only totals are exposed
    const normalizedData = (data || []).map((confession) => {
      const normalized = normalizeConfession(confession);
      if (!normalized) {
        console.warn(`[ALL] ⚠️  Failed to normalize confession:`, confession?.id || 'unknown');
      }
      return normalized;
    }).filter(Boolean);

    // Calculate pagination info
    const totalCount = count || 0;
    const hasMore = cursor + dataLength < totalCount;
    const nextCursor = hasMore ? cursor + dataLength : null;

    console.log(`[ALL] ✅ Normalized ${normalizedData.length} confessions (${dataLength - normalizedData.length} failed normalization)`);
    console.log(`[ALL] ✅ Total count: ${totalCount}, hasMore: ${hasMore}, nextCursor: ${nextCursor}`);
    console.log(`[ALL] ✅ Returning ${normalizedData.length} confessions to client`);
    console.log(`[ALL] Completed in ${Date.now() - startTime}ms`);

    return res.json({
      success: true,
      data: normalizedData,
      count: normalizedData.length,
      totalCount,
      hasMore,
      nextCursor,
      fallback: false
    });
  } catch (error) {
    console.error(`[ALL] ❌ Exception in getAllConfessions:`);
    console.error(`[ALL]   - Type: ${error.constructor.name}`);
    console.error(`[ALL]   - Message: ${error.message}`);
    console.error(`[ALL]   - Stack:`, error.stack);
    console.error(`[ALL]   - Full Error:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    // Try fallback even on exception
    try {
      console.log(`[ALL] ⚠️  Attempting fallback after exception...`);
      const fallbackData = await getConfessionsFallback(20, 'created_at', false);

      console.log(`[ALL] ✅ Fallback returned ${fallbackData.length} confessions`);
      return res.json({
        success: true,
        data: fallbackData,
        count: fallbackData.length,
        fallback: true,
        error: error.message
      });
    } catch (fallbackError) {
      console.error(`[ALL] ❌ Fallback also failed:`, fallbackError.message);
      console.error(`[ALL] ❌ Fallback Error Stack:`, fallbackError.stack);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch all confessions",
        error: error.message,
        fallbackError: fallbackError.message
      });
    }
  }
};