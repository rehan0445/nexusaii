import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import { rateLimitSimple, sanitizeInput } from "../middleware/authMiddleware.js";
import { supabase } from "../config/supabase.js";
import { io } from "../app.js";
import {
  getTrendingConfessions,
  getFreshConfessions,
  getTopRatedConfessions,
  getAllConfessions
} from "../controllers/engagementController.js";

// ============ ERROR HANDLING UTILITY ============

/**
 * Maps Supabase/PostgreSQL error codes to HTTP status codes and user-friendly messages
 * @param {Error} error - The error object from Supabase
 * @returns {Object} - { statusCode, userMessage, logMessage, errorCode }
 */
const handleSupabaseError = (error) => {
  // Default error response
  let statusCode = 500;
  let userMessage = "An unexpected error occurred. Please try again.";
  let logMessage = error.message || "Unknown error";
  let errorCode = "UNKNOWN_ERROR";

  // Check if it's a Supabase error
  if (error.code) {
    // PostgreSQL error codes
    switch (error.code) {
      // Unique constraint violation
      case "23505":
        statusCode = 409;
        userMessage = "This item already exists. Please try again.";
        errorCode = "DUPLICATE_ENTRY";
        logMessage = `Duplicate entry violation: ${error.message}`;
        break;

      // Foreign key constraint violation
      case "23503":
        statusCode = 400;
        userMessage = "Invalid reference. The related item does not exist.";
        errorCode = "FOREIGN_KEY_VIOLATION";
        logMessage = `Foreign key violation: ${error.message}`;
        break;

      // Not null constraint violation
      case "23502":
        statusCode = 400;
        userMessage = "Required field is missing. Please check your input.";
        errorCode = "NOT_NULL_VIOLATION";
        logMessage = `Not null violation: ${error.message}`;
        break;

      // Check constraint violation
      case "23514":
        statusCode = 400;
        userMessage = "Invalid data provided. Please check your input.";
        errorCode = "CHECK_CONSTRAINT_VIOLATION";
        logMessage = `Check constraint violation: ${error.message}`;
        break;

      // Invalid input syntax
      case "22P02":
      case "42804":
        statusCode = 400;
        userMessage = "Invalid data format. Please check your input.";
        errorCode = "INVALID_INPUT";
        logMessage = `Invalid input syntax: ${error.message}`;
        break;

      // Connection errors
      case "08000":
      case "08003":
      case "08006":
        statusCode = 503;
        userMessage = "Database connection failed. Please try again in a moment.";
        errorCode = "DATABASE_CONNECTION_ERROR";
        logMessage = `Database connection error: ${error.message}`;
        break;

      // Query timeout
      case "57014":
        statusCode = 504;
        userMessage = "Request timed out. Please try again.";
        errorCode = "QUERY_TIMEOUT";
        logMessage = `Query timeout: ${error.message}`;
        break;

      default:
        logMessage = `PostgreSQL error [${error.code}]: ${error.message}`;
        errorCode = `PG_ERROR_${error.code}`;
    }
  } else if (error.message) {
    // Supabase-specific error messages
    const errorMsg = error.message.toLowerCase();

    if (errorMsg.includes("jwt") || errorMsg.includes("auth") || errorMsg.includes("unauthorized")) {
      statusCode = 401;
      userMessage = "Authentication required. Please log in.";
      errorCode = "UNAUTHORIZED";
      logMessage = `Authentication error: ${error.message}`;
    } else if (errorMsg.includes("permission") || errorMsg.includes("policy") || errorMsg.includes("row level security")) {
      statusCode = 403;
      userMessage = "You don't have permission to perform this action.";
      errorCode = "FORBIDDEN";
      logMessage = `Permission denied (RLS): ${error.message}`;
    } else if (errorMsg.includes("network") || errorMsg.includes("connection") || errorMsg.includes("econnrefused")) {
      statusCode = 503;
      userMessage = "Unable to connect to database. Please try again later.";
      errorCode = "NETWORK_ERROR";
      logMessage = `Network error: ${error.message}`;
    } else if (errorMsg.includes("timeout")) {
      statusCode = 504;
      userMessage = "Request timed out. Please try again.";
      errorCode = "TIMEOUT";
      logMessage = `Timeout error: ${error.message}`;
    } else if (errorMsg.includes("not found") || errorMsg.includes("does not exist")) {
      statusCode = 404;
      userMessage = "The requested resource was not found.";
      errorCode = "NOT_FOUND";
      logMessage = `Resource not found: ${error.message}`;
    }
  }

  return {
    statusCode,
    userMessage,
    logMessage,
    errorCode,
    originalError: error
  };
};

/**
 * Wraps async route handlers with comprehensive error handling
 * @param {Function} handler - The async route handler function
 * @returns {Function} - Wrapped handler with error handling
 */
const withErrorHandling = (handler) => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      // Handle Supabase errors
      if (error.code || (error.message && error.message.includes("Supabase"))) {
        const errorInfo = handleSupabaseError(error);
        
        console.error(`❌ [${errorInfo.errorCode}] ${errorInfo.logMessage}`, {
          url: req.url,
          method: req.method,
          error: errorInfo.originalError,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });

        return res.status(errorInfo.statusCode).json({
          success: false,
          error_code: errorInfo.errorCode,
          message: errorInfo.userMessage,
          ...(process.env.NODE_ENV === 'development' && {
            developer_message: errorInfo.logMessage,
            error_details: error.details || error.hint
          })
        });
      }

      // Handle other errors
      console.error("❌ [UNHANDLED_ERROR] Unexpected error:", {
        url: req.url,
        method: req.method,
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error_code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again.",
        ...(process.env.NODE_ENV === 'development' && {
          developer_message: error.message,
          stack: error.stack
        })
      });
    }
  };
};

const router = Router();

// Configure multer for memory storage (for Supabase upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 1
  },
  fileFilter: (req, file, cb) => {
    try {
      const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const ext = (file.originalname.split('.').pop() || '').toLowerCase();
      const isImage = file.mimetype.startsWith('image/');
      if (!isImage || !allowed.includes(ext)) {
        return cb(new Error('Invalid file type. Only images are allowed.'), false);
      }
      cb(null, true);
    } catch {
      cb(new Error('Invalid file'), false);
    }
  }
});

const confessions = [];
const repliesCache = new Map();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FALLBACK_FILE = path.join(__dirname, "../data/confessions_fallback.json");

const MAX_CACHE_SIZE = 500;
const NSFW_WORDS = [
  // English profanity
  "fuck", "fucking", "fucked", "fucker", "shit", "shitty", "bullshit",
  "bitch", "asshole", "damn", "hell", "crap", "piss", "cock", "dick",
  "penis", "vagina", "pussy", "sex", "sexual", "porn", "nude", "naked",
  "masturbate", "orgasm", "breast", "boob", "tits", "nipples", "gay",
  "lesbian", "homo", "queer", "slut", "whore", "rape", "abuse",
  // Indian profanity
  "chutiya", "madarchod", "bhenchod", "lavda", "randi", "chakka",
  "harami", "behen ke laude", "chut", "chutmarika", "chutia", "makichu",
  "saala", "rakhail", "chutkebal", "chodu", "rand", "gaandu", "pataka",
  "chuti", "laundi"
];

let cachePromise = null;

const safeNumber = (value, fallback = 0) => (typeof value === "number" && !Number.isNaN(value) ? value : fallback);

const normalizePoll = (poll) => {
  if (!poll || typeof poll !== "object") return undefined;
  const question = typeof poll.question === "string" ? poll.question : "";
  const options = Array.isArray(poll.options) ? poll.options : [];
  const votes = poll.votes && typeof poll.votes === "object" ? poll.votes : {};
  return { question, options, votes };
};

const normalizeConfession = (row) => {
  if (!row) return null;
  const createdAt = row.created_at; // Always use DB value
  const poll = normalizePoll(row.poll);
  const reactions = row.reactions && typeof row.reactions === "object" ? row.reactions : {};
  const aliasValue = row.alias ?? row.meta?.alias ?? null;
  const repliesValue = safeNumber(row.comment_count ?? row.replies_count ?? row.replies ?? row.meta?.replies, 0);
  
  // Handle combined metrics (fake + real) if available
  const fakeViews = safeNumber(row.fake_views, 0);
  const fakeUpvotes = safeNumber(row.fake_upvotes, 0);
  const realViews = safeNumber(row.view_count ?? row.viewCount, 0);
  const realScore = safeNumber(row.score ?? row.likes ?? row.meta?.likes, 0);
  
  // Use pre-calculated totals if available, otherwise calculate
  const totalViews = row.total_views !== undefined ? safeNumber(row.total_views, 0) : (fakeViews + realViews);
  const totalUpvotes = row.total_upvotes !== undefined ? safeNumber(row.total_upvotes, 0) : Math.max(0, fakeUpvotes + realScore);
  
  return {
    id: String(row.id),
    content: row.content ?? "",
    alias: aliasValue,
    sessionId: row.sessionId ?? row.session_id ?? row.user_id ?? null,
    campus: row.campus ?? 'general',
    createdAt, // Always DB value
    // DISPLAY VALUES: Combined fake + real metrics (never expose breakdown)
    score: totalUpvotes,
    viewCount: totalViews,
    // Keep real score for voting logic (internal use only)
    realScore: realScore,
    reactions,
    replies: repliesValue,
    poll,
    isExplicit: Boolean(row.isExplicit ?? row.is_explicit ?? row.meta?.isExplicit ?? false),
    userName: row.userName ?? row.user_name ?? row.meta?.userName ?? null
  };
};

const normalizeReply = (row) => {
  const aliasValue = typeof row.alias === "string"
    ? row.alias
    : typeof row.alias === "object" && row.alias !== null
      ? row.alias.name ?? JSON.stringify(row.alias)
      : row.alias ?? null;

  return {
    id: String(row.id),
    confessionId: row.confessionId ?? row.confession_id,
    content: row.content ?? "",
    alias: aliasValue,
    sessionId: row.sessionId ?? row.session_id ?? null,
    parentId: row.parentId ?? row.parent_id ?? null,
    campus: row.campus ?? 'general', // Include campus field
    createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
    score: safeNumber(row.score, 0),
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    userVote: safeNumber(row.userVote, 0)
  };
};

// Helper function to fetch user votes for multiple confessions
// Uses the unified confession_votes table (migrated from per-college tables)
const getUserVotesForConfessions = async (confessionIds, sessionId) => {
  if (!sessionId || !Array.isArray(confessionIds) || confessionIds.length === 0) {
    return {};
  }

  try {
    const { data, error } = await supabase
      .from('confession_votes')
      .select('confession_id, vote')
      .eq('voter_session_id', sessionId)
      .in('confession_id', confessionIds);

    if (error) {
      const errorInfo = handleSupabaseError(error);
      console.error(`❌ [${errorInfo.errorCode}] Error fetching user votes:`, {
        sessionId: sessionId,
        confessionCount: confessionIds.length,
        error: errorInfo.logMessage
      });
      return {}; // Return empty map on error, don't fail the request
    }

    // Create a map of confession_id -> vote (-1, 0, or 1)
    // The vote column already stores the value directly (-1, 0, or 1)
    const votesMap = {};
    if (Array.isArray(data)) {
      for (const row of data) {
        votesMap[row.confession_id] = row.vote ?? 0;
      }
    }

    return votesMap;
  } catch (error) {
    const errorInfo = handleSupabaseError(error);
    console.error(`❌ [${errorInfo.errorCode}] Failed to fetch user votes:`, {
      sessionId: sessionId,
      error: errorInfo.logMessage
    });
    return {}; // Return empty map on error, don't fail the request
  }
};

const parseFallbackConfession = (entry) => {
  const normalized = normalizeConfession(entry);
  if (!normalized) return null;
  if (!normalized.createdAt) {
    normalized.createdAt = new Date().toISOString();
  }
  return normalized;
};

const parseFallbackReplies = (fallbackReplies) => {
  if (!fallbackReplies || typeof fallbackReplies !== "object") return new Map();
  const map = new Map();
  for (const [key, value] of Object.entries(fallbackReplies)) {
    if (Array.isArray(value)) {
      map.set(key, value.map((item) => normalizeReply(item)));
    }
  }
  return map;
};

const upsertConfession = (confession) => {
  if (!confession) return;
  const index = confessions.findIndex((c) => c.id === confession.id);
  if (index >= 0) {
    confessions[index] = confession;
  } else {
    confessions.push(confession);
  }
  confessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (confessions.length > MAX_CACHE_SIZE) {
    confessions.length = MAX_CACHE_SIZE;
  }
};

const removeConfession = (id) => {
  const index = confessions.findIndex((c) => c.id === id);
  if (index !== -1) {
    confessions.splice(index, 1);
  }
  repliesCache.delete(id);
};

const detectExplicitContent = (textParts = []) => {
  const combined = textParts.filter(Boolean).join(" ").toLowerCase();
  if (!combined) return false;
  return NSFW_WORDS.some((word) => combined.includes(word));
};

const loadFallback = async () => {
  try {
    const raw = await fs.readFile(FALLBACK_FILE, "utf8");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const source = Array.isArray(parsed) ? parsed : parsed?.confessions;
    if (Array.isArray(source)) {
      confessions.length = 0;
      source.forEach((item) => {
        const normalized = parseFallbackConfession(item);
        if (normalized) upsertConfession(normalized);
      });
    }
    const fallbackReplies = Array.isArray(parsed) ? null : parsed?.replies;
    if (fallbackReplies) {
      const map = parseFallbackReplies(fallbackReplies);
      repliesCache.clear();
      map.forEach((value, key) => repliesCache.set(key, value));
    }
  } catch (error) {
    console.warn("Unable to load confessions fallback:", error.message);
  }
};

const writeFallback = async () => {
  try {
    await fs.mkdir(path.dirname(FALLBACK_FILE), { recursive: true });
    const payload = {
      generatedAt: new Date().toISOString(),
      confessions,
      replies: Object.fromEntries(repliesCache.entries())
    };
    await fs.writeFile(FALLBACK_FILE, JSON.stringify(payload, null, 2), "utf8");
  } catch (error) {
    console.warn("Unable to write confessions fallback:", error.message);
  }
};

const refreshCache = async () => {
  try {
    // Always fetch from main confessions table (general confessions)
    const { data, error } = await supabase
      .from("confessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(MAX_CACHE_SIZE);

    if (error) throw error;

    confessions.length = 0;
    if (Array.isArray(data)) {
      data.forEach((row) => {
        const normalized = normalizeConfession(row);
        if (normalized) upsertConfession(normalized);
      });
    }
    await writeFallback();
  } catch (error) {
    console.error("Failed to refresh confessions from Supabase:", error.message);
    await loadFallback();
  } finally {
    cachePromise = null;
  }
};

const ensureCache = async (force = false) => {
  if (force || (confessions.length === 0 && !cachePromise)) {
    cachePromise = refreshCache();
  }
  if (cachePromise) {
    await cachePromise;
  }
};

const fetchConfessionFromSupabase = async (id) => {
  console.log(`[FETCH CONFESSION] Searching for confession ID: ${id}`);
  console.log(`[FETCH CONFESSION] Querying 'confessions' table`);
  
  try {
    // Query confessions table (all confessions are stored here)
    const { data, error } = await supabase
      .from('confessions')
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      const errorInfo = handleSupabaseError(error);
      console.error(`[FETCH CONFESSION] ❌ [${errorInfo.errorCode}] Error querying confessions:`, {
        confessionId: id,
        error: errorInfo.logMessage,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Fallback to in-memory cache
      const cached = confessions.find((c) => c.id === id);
      if (cached) {
        console.log(`[FETCH CONFESSION] ✅ Found in memory cache as fallback`);
        return cached;
      }
      
      console.warn(`[FETCH CONFESSION] ❌ Confession ${id} not found in database or cache`);
      return null;
    }

    if (data) {
      console.log(`[FETCH CONFESSION] ✅ Found confession in 'confessions' table`);
      console.log(`[FETCH CONFESSION] Confession data keys:`, Object.keys(data));
      console.log(`[FETCH CONFESSION] Confession ID: ${data.id}, Content length: ${data.content?.length || 0}`);
      
      const normalized = normalizeConfession(data);
      if (normalized) {
        upsertConfession(normalized);
        console.log(`[FETCH CONFESSION] ✅ Normalized and cached confession`);
        return normalized;
      } else {
        console.warn(`[FETCH CONFESSION] ⚠️  Confession found but normalization returned null`);
        return null;
      }
    } else {
      console.log(`[FETCH CONFESSION] Not found in 'confessions' table`);
      
      // Fallback to in-memory cache
      const cached = confessions.find((c) => c.id === id);
      if (cached) {
        console.log(`[FETCH CONFESSION] ✅ Found in memory cache as fallback`);
        return cached;
      }
      
      console.warn(`[FETCH CONFESSION] ❌ Confession ${id} not found in database or cache`);
      return null;
    }
  } catch (error) {
    const errorInfo = handleSupabaseError(error);
    console.error(`[FETCH CONFESSION] ❌ [${errorInfo.errorCode}] Exception querying confessions:`, {
      confessionId: id,
      error: errorInfo.logMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Fallback to in-memory cache
    const cached = confessions.find((c) => c.id === id);
    if (cached) {
      console.log(`[FETCH CONFESSION] ✅ Found in memory cache as fallback`);
      return cached;
    }
    
    console.warn(`[FETCH CONFESSION] ❌ Confession ${id} not found after exception`);
    return null;
  }
};

const fetchReplyList = async (confessionId) => {
  try {
    const { data, error } = await supabase
      .from("confession_replies")
      .select("*")
      .eq("confession_id", confessionId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const normalized = Array.isArray(data) ? data.map((row) => normalizeReply(row)) : [];
    repliesCache.set(confessionId, normalized);
    return normalized;
  } catch (error) {
    console.error(`Failed to fetch replies for confession ${confessionId}:`, error.message);
    return repliesCache.get(confessionId) || [];
  }
};

const calculateEngagementScore = (confession) => {
  const upvotes = confession.score || 0;
  const comments = confession.replies || 0;
  const reactions = confession.reactions
    ? Object.values(confession.reactions).reduce((sum, reaction) => sum + (reaction.count || 0), 0)
    : 0;
  return upvotes * 2 + comments * 3 + reactions;
};

// Legacy function for internal use (stats endpoint)
// Renamed to avoid conflict with imported getTrendingConfessions from engagementController
const getLocalTrendingConfessions = async () => {
  await ensureCache(false);
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return confessions
    .filter((c) => new Date(c.createdAt) >= twentyFourHoursAgo)
    .map((c) => ({ ...c, engagementScore: calculateEngagementScore(c) }))
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 10);
};

const getBestConfessionOfDay = async () => {
  await ensureCache(false);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const todaysConfessions = confessions
    .filter((c) => new Date(c.createdAt) >= startOfDay)
    .map((c) => ({ ...c, engagementScore: calculateEngagementScore(c) }))
    .sort((a, b) => b.engagementScore - a.engagementScore);

  return todaysConfessions.length > 0 ? todaysConfessions[0] : null;
};

// Helper: Get all confession tables for aggregation (used by SQL functions)
// Note: All confessions are now in the unified 'confessions' table
const getAllConfessionTables = () => [
  'confessions'  // Unified table - legacy tables removed after migration
];

// Helper: Update confession in database (tries all tables since we aggregate from all)
const updateConfessionInDatabase = async (id, updates) => {
  const allTables = getAllConfessionTables();
  
  // Try main table first (most common)
  let { error } = await supabase
    .from('confessions')
    .update(updates)
    .eq('id', id);
  
  if (!error) {
    return { success: true, table: 'confessions' };
  }
  
  // If not found in main table, try other tables
  for (const table of allTables.slice(1)) {
    const result = await supabase
      .from(table)
      .update(updates)
      .eq('id', id);
    
    if (!result.error) {
      return { success: true, table };
    }
  }
  
  return { success: false, error: 'Confession not found in any table' };
};

// Comments tables - SQL functions handle aggregation from all tables
// These are kept for reference but not used for filtering

const normalizeCommentRecord = (record, parentId = null) => {
  if (!record) return null;
  const aliasValue = typeof record.alias === 'string' ? record.alias : record.alias?.name || record.alias || null;
  return {
    id: String(record.id),
    confessionId: record.confession_id || record.confessionId,
    content: record.content || '',
    alias: aliasValue,
    sessionId: record.session_id || record.sessionId || null,
    parentId: parentId,
    campus: record.campus || null,
    createdAt: record.created_at || record.createdAt || new Date().toISOString(),
    score: safeNumber(record.score, 0),
    metadata: record.metadata && typeof record.metadata === 'object' ? record.metadata : {}
  };
};

const fetchCommentsFromNewTables = async (confessionId) => {
  try {
    // Aggregate comments from all comment tables (general confessions approach)
    const commentTables = [
      'comments',
      'comments_mit_adt',
      'comments_mit_wpu',
      'comments_iict',
      'comments_parul_university',
      'comments_vit_vellore'
    ];
    
    const subCommentTables = [
      'sub_comments',
      'sub_comments_mit_adt',
      'sub_comments_mit_wpu',
      'sub_comments_iict',
      'sub_comments_parul_university',
      'sub_comments_vit_vellore'
    ];

    const rootPromises = commentTables.map(table =>
      supabase.from(table).select('*').eq('confession_id', confessionId).order('created_at', { ascending: true })
    );
    
    const subPromises = subCommentTables.map(table =>
      supabase.from(table).select('*').eq('confession_id', confessionId).order('created_at', { ascending: true })
    );

    const allResults = await Promise.all([...rootPromises, ...subPromises]);
    
    const normalizedRoots = [];
    const normalizedSubs = [];
    
    allResults.forEach((result, index) => {
      if (result.error) {
        console.warn(`Error fetching comments from table ${index}:`, result.error.message);
        return;
      }
      
      if (index < commentTables.length) {
        // Root comments
        const roots = Array.isArray(result.data) ? result.data.map((r) => normalizeCommentRecord(r, null)) : [];
        normalizedRoots.push(...roots);
      } else {
        // Sub comments
        const subs = Array.isArray(result.data) ? result.data.map((s) => normalizeCommentRecord(s, s.comment_id || s.commentId || null)) : [];
        normalizedSubs.push(...subs);
      }
    });

    const combined = [...normalizedRoots, ...normalizedSubs].filter(Boolean);
    // Sort by createdAt for stability
    combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return combined;
  } catch (error) {
    console.error(`Failed to fetch comments for ${confessionId}:`, error.message);
    return null;
  }
};

// ============ ALIAS API ENDPOINTS ============

// Get alias for a session
router.get("/alias/:sessionId", rateLimitSimple(30, 60_000), async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    const { data, error } = await supabase
      .from('user_aliases')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching alias:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch alias' });
    }

    if (!data) {
      return res.status(404).json({ success: false, message: 'Alias not found' });
    }

    const alias = {
      name: data.alias_name,
      emoji: data.alias_emoji,
      color: data.alias_color,
      imageUrl: data.alias_image_url
    };

    return res.json({ success: true, data: alias });
  } catch (error) {
    console.error('Error in GET /alias/:sessionId:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Save or update alias for a session
router.post("/alias", rateLimitSimple(20, 60_000), async (req, res) => {
  try {
    const { sessionId, name, emoji, color, imageUrl } = req.body || {};
    
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid alias name' });
    }

    const aliasData = {
      session_id: sessionId,
      alias_name: name.trim(),
      alias_emoji: emoji || '👤',
      alias_color: color || 'from-gray-500 to-gray-600',
      alias_image_url: imageUrl || null,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_aliases')
      .upsert(aliasData, { onConflict: 'session_id' });

    if (error) {
      console.error('Error saving alias:', error);
      return res.status(500).json({ success: false, message: 'Failed to save alias' });
    }

    console.log(`✅ Alias saved for session: ${sessionId}`);
    return res.json({ 
      success: true, 
      data: {
        name: aliasData.alias_name,
        emoji: aliasData.alias_emoji,
        color: aliasData.alias_color,
        imageUrl: aliasData.alias_image_url
      }
    });
  } catch (error) {
    console.error('Error in POST /alias:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============ IMAGE UPLOAD ENDPOINTS ============

// Upload confession avatar
router.post('/upload-avatar', rateLimitSimple(10, 60_000), upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file = req.file;
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File too large (max 5MB)' });
    }

    // Generate unique filename
    const allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    let fileExt = (file.originalname.split('.').pop() || '').toLowerCase();
    if (!allowedExt.includes(fileExt)) fileExt = 'jpg';
    const fileName = `avatars/${uuidv4()}.${fileExt}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('confession-avatars')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Avatar upload failed:', uploadError);
      return res.status(500).json({ success: false, message: 'Failed to upload avatar' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('confession-avatars')
      .getPublicUrl(fileName);

    if (!urlData || !urlData.publicUrl) {
      return res.status(500).json({ success: false, message: 'Failed to get avatar URL' });
    }

    console.log(`✅ Avatar uploaded: ${fileName}`);
    return res.json({ success: true, data: { url: urlData.publicUrl } });
  } catch (error) {
    console.error('Error in POST /upload-avatar:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Upload confession image
router.post('/upload-image', rateLimitSimple(10, 60_000), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file = req.file;
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File too large (max 5MB)' });
    }

    // Generate unique filename
    const allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    let fileExt = (file.originalname.split('.').pop() || '').toLowerCase();
    if (!allowedExt.includes(fileExt)) fileExt = 'jpg';
    const fileName = `confessions/${uuidv4()}.${fileExt}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('confession-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Image upload failed:', uploadError);
      return res.status(500).json({ success: false, message: 'Failed to upload image' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('confession-images')
      .getPublicUrl(fileName);

    if (!urlData || !urlData.publicUrl) {
      return res.status(500).json({ success: false, message: 'Failed to get image URL' });
    }

    console.log(`✅ Confession image uploaded: ${fileName}`);
    return res.json({ success: true, data: { url: urlData.publicUrl } });
  } catch (error) {
    console.error('Error in POST /upload-image:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ============ CONFESSION CRUD ENDPOINTS ============

router.post(
  "/",
  rateLimitSimple(20, 60_000),
  sanitizeInput(["content"]),
  async (req, res) => {
    await ensureCache();

    const { content, alias, sessionId, poll, userName, userEmail, campus } = req.body || {};
    // Store ALL confessions in general confessions table (single feed)
    const table = 'confessions';
    // Use campus from request or default to null (campus is nullable in general table)
    const campusValue = campus || null;
    console.log(`[CONFESSION CREATE] Using table: ${table}, campus: ${campusValue}`);

    const hasText = content && typeof content === "string" && content.length > 0;
    const hasPoll = poll && poll.question && poll.options && poll.options.length >= 2;

    if (!hasText && !hasPoll) {
      return res.status(400).json({ success: false, message: "At least text or poll content is required" });
    }

    if (hasText && content.length > 5000) {
      return res.status(400).json({ success: false, message: "Text content too long (max 5000 characters)" });
    }

    if (poll) {
      if (!poll.question || typeof poll.question !== "string" || poll.question.length > 200) {
        return res.status(400).json({ success: false, message: "Invalid poll question" });
      }
      if (!Array.isArray(poll.options) || poll.options.length < 2 || poll.options.length > 4) {
        return res.status(400).json({ success: false, message: "Poll must have 2-4 options" });
      }
      for (const option of poll.options) {
        if (!option || typeof option !== "string" || option.length > 100) {
          return res.status(400).json({ success: false, message: "Invalid poll option" });
        }
      }
    }

    const id = uuidv4();
    const timestamp = new Date().toISOString();
    // Normalize alias - ensure it's never null (alias is required in database)
    // Provide default alias if missing
    let normalizedAlias = alias && typeof alias === "object" ? alias : alias ? { name: alias } : null;
    if (!normalizedAlias) {
      // Default alias if none provided
      normalizedAlias = { name: "Anonymous", emoji: "👤" };
    }
    const normalizedPoll = poll ? { question: poll.question, options: poll.options, votes: poll.votes || {} } : undefined;
    const isExplicit = detectExplicitContent([
      typeof content === "string" ? content : "",
      poll?.question,
      ...(Array.isArray(poll?.options) ? poll.options : [])
    ]);

    const confession = {
      id,
      content: content || "",
      alias: normalizedAlias,
      sessionId: sessionId || null,
      campus: campusValue,
      createdAt: timestamp,
      score: 0,
      reactions: {},
      replies: 0,
      poll: normalizedPoll,
      isExplicit,
      userName: userName || null,
      userEmail: userEmail || null
    };

    try {
      // Insert into general confessions table
      // Note: General confessions table doesn't have upvotes, downvotes, comment_count,
      // is_anonymous, is_trending, trending_score, user_name, user_email fields
      const { data: insertedData, error } = await supabase
        .from(table)
        .insert({
          id,
          content: confession.content,
          alias: confession.alias, // Required field - already ensured not null above
          session_id: confession.sessionId,
          campus: campusValue, // Nullable - use from request or null
          created_at: confession.createdAt,
          reactions: confession.reactions,
          poll: confession.poll || null,
          score: confession.score,
          replies_count: 0, // Initialize replies_count (general table uses replies_count, not comment_count)
          is_explicit: confession.isExplicit,
          updated_at: confession.createdAt
        })
        .select()
        .single();

      if (error) {
        const errorInfo = handleSupabaseError(error);
        console.error(`❌ [${errorInfo.errorCode}] Failed to store confession:`, {
          confessionId: id,
          error: errorInfo.logMessage,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return res.status(errorInfo.statusCode).json({
          success: false,
          error_code: errorInfo.errorCode,
          message: errorInfo.userMessage,
          ...(process.env.NODE_ENV === 'development' && {
            developer_message: errorInfo.logMessage,
            error_details: error.details || error.hint
          })
        });
      }

      if (!insertedData) {
        console.error("❌ [INSERT_FAILED] Confession insert returned no data:", id);
        return res.status(500).json({
          success: false,
          error_code: "INSERT_FAILED",
          message: "Failed to create confession. Please try again."
        });
      }

      console.log("✅ Confession stored in confessions table successfully:", id);
    } catch (error) {
      // Handle non-Supabase errors (network, timeout, etc.)
      const errorInfo = handleSupabaseError(error);
      console.error(`❌ [${errorInfo.errorCode}] Unexpected error storing confession:`, {
        confessionId: id,
        error: errorInfo.logMessage,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      return res.status(errorInfo.statusCode).json({
        success: false,
        error_code: errorInfo.errorCode,
        message: errorInfo.userMessage,
        ...(process.env.NODE_ENV === 'development' && {
          developer_message: errorInfo.logMessage
        })
      });
    }

    upsertConfession(confession);
    await writeFallback();

    // Emit real-time update for new confession to ALL connected clients
    io.emit('new-confession', confession);
    console.log(`📢 New confession broadcasted to all clients: ${confession.id}`);

    // Also broadcast to confession-specific room for immediate updates
    io.to(`confession-${confession.id}`).emit('confession-updated', {
      id: confession.id,
      replies: 0
    });

    return res.json({ success: true, data: confession });
  }
);

router.get("/", async (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit || "20", 10), 100);
  const cursor = req.query.cursor ? Number.parseInt(req.query.cursor, 10) : 0;
  const sortBy = req.query.sortBy || 'created_at'; // Default to created_at, can be 'score' for upvotes
  console.log(`[CONFESSION FETCH] sortBy: ${sortBy}`);

  try {
    const rangeFrom = cursor;
    const rangeTo = cursor + limit - 1;

    // Always aggregate from all tables (general confessions)
    const allTables = getAllConfessionTables();
    console.log(`[GENERAL CONFESSIONS] Fetching from tables: ${allTables.join(', ')}`);
    
    // Fetch from all tables and combine results
    const allConfessions = [];
    for (const tableName of allTables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(tableName)
          .select("*")
          .order(sortBy === 'score' ? "score" : "created_at", { ascending: false });
        
        if (tableError) {
          const errorInfo = handleSupabaseError(tableError);
          console.warn(`⚠️ [${errorInfo.errorCode}] Failed to fetch from ${tableName}:`, {
            table: tableName,
            error: errorInfo.logMessage
          });
          // Continue to next table instead of failing entire request
          continue;
        }
        
        if (Array.isArray(tableData)) {
          allConfessions.push(...tableData);
        }
      } catch (error) {
        const errorInfo = handleSupabaseError(error);
        console.warn(`⚠️ [${errorInfo.errorCode}] Error fetching from ${tableName}:`, {
          table: tableName,
          error: errorInfo.logMessage
        });
        // Continue to next table instead of failing entire request
      }
    }
    
    // Sort combined results
    allConfessions.sort((a, b) => {
      if (sortBy === 'score') {
        return (b.score || 0) - (a.score || 0);
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    
    // Apply pagination
    let items = allConfessions.slice(rangeFrom, rangeTo + 1).map((row) => normalizeConfession(row));
    console.log(`[GENERAL CONFESSIONS] Found ${allConfessions.length} total confessions, returning ${items.length}`);

    // Fetch user votes for these confessions
    const sessionId = req.query.sessionId;
    if (sessionId && items.length > 0) {
      const confessionIds = items.map(item => item.id);
      const userVotes = await getUserVotesForConfessions(confessionIds, sessionId);
      
      // Add userVote to each item
      items = items.map(item => ({
        ...item,
        userVote: userVotes[item.id] || 0
      }));
    } else {
      // Ensure userVote field exists even if no sessionId
      items = items.map(item => ({
        ...item,
        userVote: 0
      }));
    }

    items.forEach((item) => upsertConfession(item));
    await writeFallback();

    const nextCursor = items.length === limit ? String(cursor + limit) : null;
    return res.json({ success: true, data: { items, nextCursor } });
  } catch (error) {
    const errorInfo = handleSupabaseError(error);
    console.error(`❌ [${errorInfo.errorCode}] Failed to load confessions:`, {
      error: errorInfo.logMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Fallback to cache if available
    try {
      await ensureCache(false);
      const items = confessions.slice(cursor, cursor + limit);
      const nextCursor = cursor + limit < confessions.length ? String(cursor + limit) : null;
      console.log(`⚠️ Using cached confessions as fallback (${items.length} items)`);
      return res.json({ success: true, data: { items, nextCursor }, from_cache: true });
    } catch (cacheError) {
      // If cache also fails, return error
      return res.status(errorInfo.statusCode).json({
        success: false,
        error_code: errorInfo.errorCode,
        message: errorInfo.userMessage,
        ...(process.env.NODE_ENV === 'development' && {
          developer_message: errorInfo.logMessage
        })
      });
    }
  }
});

router.post("/:id/vote", rateLimitSimple(60, 60_000), async (req, res) => {
  const { id } = req.params;
  const { direction, sessionId } = req.body || {};
  if (![1, -1].includes(direction)) {
    return res.status(400).json({ success: false, message: "Invalid vote direction" });
  }
  const voter = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : null;
  if (!voter) {
    return res.status(400).json({ success: false, message: "Missing sessionId" });
  }

  await ensureCache();
  let confession = confessions.find((item) => item.id === id);
  if (!confession) {
    confession = await fetchConfessionFromSupabase(id);
  }
  if (!confession) {
    return res.status(404).json({ success: false, message: "Confession not found" });
  }

  // Read previous vote from unified confession_votes table
  // This table was introduced during the database migration to a single confessions table
  let previousVote = 0;
  try {
    const { data: existing, error: selectError } = await supabase
      .from('confession_votes')
      .select('vote')
      .eq('confession_id', id)
      .eq('voter_session_id', voter)
      .maybeSingle();
    
    // PGRST116 = not found, which is OK (user hasn't voted yet)
    if (selectError && selectError.code !== 'PGRST116') {
      const errorInfo = handleSupabaseError(selectError);
      console.error(`❌ [${errorInfo.errorCode}] Failed to load previous vote:`, {
        confessionId: id,
        sessionId: voter,
        error: errorInfo.logMessage
      });
      // Don't fail the request, just log and continue (user can still vote)
    } else {
      // confession_votes.vote is stored as -1, 0, or 1 directly
      previousVote = existing?.vote ?? 0;
    }
  } catch (error) {
    const errorInfo = handleSupabaseError(error);
    console.error(`❌ [${errorInfo.errorCode}] Unexpected error loading previous vote:`, {
      confessionId: id,
      sessionId: voter,
      error: errorInfo.logMessage
    });
    // Don't fail the request, just log and continue
  }

  // Compute new vote value based on toggle logic
  // If user clicks same vote direction again, toggle it off (set to 0)
  // Otherwise, set to the new direction
  let newVote = 0;
  if (direction === 1) {
    // Upvote clicked
    if (previousVote === 1) {
      // Toggle off: remove upvote
      newVote = 0;
    } else {
      // Add upvote (replaces any existing downvote)
      newVote = 1;
    }
  } else if (direction === -1) {
    // Downvote clicked
    if (previousVote === -1) {
      // Toggle off: remove downvote
      newVote = 0;
    } else {
      // Add downvote (replaces any existing upvote)
      newVote = -1;
    }
  }

  // Upsert vote in the unified confession_votes table
  // The table uses (confession_id, voter_session_id) as composite primary key
  try {
    const { error: upsertError } = await supabase
      .from('confession_votes')
      .upsert({ 
        confession_id: id, 
        voter_session_id: voter,
        vote: newVote,
        updated_at: new Date().toISOString()
      }, { onConflict: 'confession_id,voter_session_id' });
    
    if (upsertError) {
      const errorInfo = handleSupabaseError(upsertError);
      console.error(`❌ [${errorInfo.errorCode}] Failed to upsert vote:`, {
        confessionId: id,
        sessionId: voter,
        vote: newVote,
        error: errorInfo.logMessage,
        details: upsertError.details,
        hint: upsertError.hint,
        code: upsertError.code
      });
      return res.status(errorInfo.statusCode).json({
        success: false,
        error_code: errorInfo.errorCode,
        message: errorInfo.userMessage,
        ...(process.env.NODE_ENV === 'development' && {
          developer_message: errorInfo.logMessage,
          error_details: upsertError.details || upsertError.hint
        })
      });
    }
    console.log(`✅ Saved vote ${newVote} for confession ${id} by session ${voter}`);
  } catch (error) {
    const errorInfo = handleSupabaseError(error);
    console.error(`❌ [${errorInfo.errorCode}] Unexpected error saving vote:`, {
      confessionId: id,
      sessionId: voter,
      error: errorInfo.logMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return res.status(errorInfo.statusCode).json({
      success: false,
      error_code: errorInfo.errorCode,
      message: errorInfo.userMessage,
      ...(process.env.NODE_ENV === 'development' && {
        developer_message: errorInfo.logMessage
      })
    });
  }

  // Update score atomically using RPC function to prevent race conditions
  try {
    // Calculate score delta based on vote change
    // If user previously upvoted (+1) and now removes it, delta = -1
    // If user previously downvoted (-1) and now removes it, delta = +1
    // If user adds upvote, delta = +1
    // If user adds downvote, delta = -1
    let scoreDelta = 0;
    if (previousVote === 1 && newVote === 0) scoreDelta = -1; // Remove upvote
    else if (previousVote === -1 && newVote === 0) scoreDelta = 1; // Remove downvote
    else if (previousVote === 0 && newVote === 1) scoreDelta = 1; // Add upvote
    else if (previousVote === 0 && newVote === -1) scoreDelta = -1; // Add downvote
    else if (previousVote === -1 && newVote === 1) scoreDelta = 2; // Change downvote to upvote (+1 for upvote, +1 to remove downvote)
    else if (previousVote === 1 && newVote === -1) scoreDelta = -2; // Change upvote to downvote (-1 for downvote, -1 to remove upvote)
    
    // Use atomic RPC function to update score in database
    const { data: newScoreResult, error: rpcError } = await supabase
      .rpc('update_confession_score', {
        p_confession_id: id,
        p_score_delta: scoreDelta
      });
    
    if (rpcError) {
      const errorInfo = handleSupabaseError(rpcError);
      console.error(`❌ [${errorInfo.errorCode}] Failed to update score atomically:`, {
        confessionId: id,
        scoreDelta,
        error: errorInfo.logMessage,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code
      });
      return res.status(errorInfo.statusCode).json({
        success: false,
        error_code: errorInfo.errorCode,
        message: errorInfo.userMessage,
        ...(process.env.NODE_ENV === 'development' && {
          developer_message: errorInfo.logMessage,
          error_details: rpcError.details || rpcError.hint
        })
      });
    }
    
    // RPC function returns the new score, or NULL if confession not found
    if (newScoreResult === null || newScoreResult === undefined) {
      console.error(`❌ [NOT_FOUND] Confession ${id} not found for score update`);
      return res.status(404).json({
        success: false,
        error_code: "NOT_FOUND",
        message: "Confession not found. It may have been deleted."
      });
    }
    
    const newScore = safeNumber(newScoreResult, 0);
    
    console.log(`✅ Atomically updated score for confession ${id}: score=${newScore} (delta=${scoreDelta}, previous=${previousVote}, new=${newVote})`);
    
    // Update local cache with new score from database
    confession.score = newScore;
    upsertConfession(confession);
    
    await writeFallback();

    // Fetch the updated confession to get accurate score (in case of concurrent updates)
    let finalScore = newScore;
    try {
      const { data: updatedConfession, error: fetchError } = await supabase
        .from('confessions')
        .select('score')
        .eq('id', id)
        .maybeSingle();
      
      if (!fetchError && updatedConfession) {
        finalScore = safeNumber(updatedConfession.score, newScore);
      }
    } catch (error) {
      // If fetch fails, use the score from RPC function
      console.warn('Could not fetch updated confession score, using RPC result');
    }

    // Emit real-time vote update with score and voter's sessionId
    io.to(`confession-${id}`).emit('vote-update', { 
      id: id,
      confessionId: id, 
      score: finalScore,
      sessionId: voter,
      userVote: newVote 
    });
    console.log(`📊 Vote update broadcasted for confession: ${id}, newVote: ${newVote}, score: ${finalScore}`);

    return res.json({ 
      success: true, 
      data: { 
        score: finalScore,
        userVote: newVote 
      } 
    });
  } catch (error) {
    const errorInfo = handleSupabaseError(error);
    console.error(`❌ [${errorInfo.errorCode}] Unexpected error updating vote counts:`, {
      confessionId: id,
      error: errorInfo.logMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return res.status(errorInfo.statusCode).json({
      success: false,
      error_code: errorInfo.errorCode,
      message: errorInfo.userMessage,
      ...(process.env.NODE_ENV === 'development' && {
        developer_message: errorInfo.logMessage
      })
    });
  }
});

router.post("/:id/react", rateLimitSimple(60, 60_000), async (req, res) => {
  const { id } = req.params;
  const { reaction, sessionId } = req.body || {};

  // Validate inputs
  if (!reaction || typeof reaction !== "string") {
    return res.status(400).json({ success: false, message: "Invalid reaction" });
  }
  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ success: false, message: "Session ID required" });
  }

  // Verify confession exists
  await ensureCache();
  let confession = confessions.find((item) => item.id === id);
  if (!confession) {
    confession = await fetchConfessionFromSupabase(id);
  }
  if (!confession) {
    return res.status(404).json({ success: false, message: "Confession not found" });
  }

  try {
    // Create a unique hash for this user (for privacy)
    const crypto = await import('crypto');
    const userHash = crypto.createHash('sha256').update(sessionId).digest('hex').substring(0, 16);

    // Check if user already has a reaction for this confession
    const { data: existingReactions, error: fetchError } = await supabase
      .from('confession_reactions')
      .select('reaction')
      .eq('confession_id', id)
      .eq('user_hash', userHash);

    if (fetchError) {
      console.error('Error fetching existing reactions:', fetchError);
      throw fetchError;
    }

    const existingReaction = existingReactions && existingReactions.length > 0 ? existingReactions[0].reaction : null;

    // If user clicked same reaction, remove it (toggle off)
    if (existingReaction === reaction) {
      const { error: deleteError } = await supabase
        .from('confession_reactions')
        .delete()
        .eq('confession_id', id)
        .eq('user_hash', userHash)
        .eq('reaction', reaction);

      if (deleteError) {
        console.error('Error deleting reaction:', deleteError);
        throw deleteError;
      }
      console.log(`✅ Removed reaction "${reaction}" from confession ${id}`);
    } else {
      // If user had a different reaction, delete it first
      if (existingReaction) {
        await supabase
          .from('confession_reactions')
          .delete()
          .eq('confession_id', id)
          .eq('user_hash', userHash);
      }

      // Insert new reaction
      const { error: insertError } = await supabase
        .from('confession_reactions')
        .insert({
          confession_id: id,
          user_hash: userHash,
          reaction: reaction
        });

      if (insertError) {
        console.error('Error inserting reaction:', insertError);
        throw insertError;
      }
      console.log(`✅ Added reaction "${reaction}" to confession ${id}`);
    }

    // Fetch aggregated reactions for this confession
    const { data: allReactions, error: aggregateError } = await supabase
      .from('confession_reactions')
      .select('reaction, user_hash')
      .eq('confession_id', id);

    if (aggregateError) {
      console.error('Error fetching aggregated reactions:', aggregateError);
      throw aggregateError;
    }

    // Build reactions object with counts and user's reaction status
    const reactions = {};
    if (Array.isArray(allReactions)) {
      allReactions.forEach(r => {
        if (!reactions[r.reaction]) {
          reactions[r.reaction] = { count: 0, userReacted: false };
        }
        reactions[r.reaction].count += 1;
        if (r.user_hash === userHash) {
          reactions[r.reaction].userReacted = true;
        }
      });
    }

    // Update cache
    confession.reactions = reactions;
    upsertConfession(confession);

    // Also update JSONB field for backward compatibility (store aggregated counts only)
    try {
      const result = await updateConfessionInDatabase(id, { reactions: reactions });
      if (result.success) {
        console.log(`✅ Updated JSONB reactions in ${result.table} for confession ${id}`);
      } else {
        console.warn('Error updating JSONB reactions (non-critical):', result.error);
      }
    } catch (jsonbError) {
      console.error('Error updating JSONB reactions (non-critical):', jsonbError);
    }

    await writeFallback();
    
    // Emit real-time reaction update to all users
    io.to(`confession-${id}`).emit('reaction-update', { 
      confessionId: id, 
      reactions,
      sessionId: userHash // Send hashed ID so other clients can't identify users
    });
    console.log(`🎭 Reaction update broadcasted for confession: ${id}`, reactions);
    
    return res.json({ success: true, data: { reactions } });
    
  } catch (error) {
    console.error(`❌ Failed to process reaction for confession ${id}:`, error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to process reaction",
      error: error.message 
    });
  }
});

router.post("/:id/poll-vote", rateLimitSimple(60, 60_000), async (req, res) => {
  const { id } = req.params;
  const { option, userId } = req.body || {};

  if (!option || typeof option !== "string") {
    return res.status(400).json({ success: false, message: "Invalid poll option" });
  }
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  await ensureCache();
  let confession = confessions.find((item) => item.id === id);
  if (!confession) {
    confession = await fetchConfessionFromSupabase(id);
  }
  if (!confession) {
    return res.status(404).json({ success: false, message: "Confession not found" });
  }
  if (!confession.poll) {
    return res.status(400).json({ success: false, message: "This confession has no poll" });
  }
  if (!confession.poll.options.includes(option)) {
    return res.status(400).json({ success: false, message: "Invalid poll option" });
  }

  // Check if user already voted
  let existingVote = null;
  try {
    const { data, error } = await supabase
      .from('confession_poll_votes')
      .select('option')
      .eq('confession_id', id)
      .eq('voter_session_id', userId)
      .maybeSingle();
    if (error) throw error;
    existingVote = data?.option || null;
  } catch (error) {
    console.error(`Failed to fetch existing poll vote for ${id}:`, error.message);
  }

  // Toggle vote: if clicking same option, remove vote; otherwise, change vote
  if (existingVote === option) {
    // User is removing their vote
    try {
      const { error } = await supabase
        .from('confession_poll_votes')
        .delete()
        .eq('confession_id', id)
        .eq('voter_session_id', userId);
      if (error) throw error;
      console.log(`✅ Poll vote removed for user ${userId} on confession ${id}`);
    } catch (error) {
      console.error(`Failed to delete poll vote:`, error.message);
    }
  } else {
    // User is adding or changing their vote
    try {
      const { error } = await supabase
        .from('confession_poll_votes')
        .upsert({
          confession_id: id,
          voter_session_id: userId,
          option: option,
          voted_at: new Date().toISOString()
        }, { onConflict: 'confession_id,voter_session_id' });
      if (error) throw error;
      console.log(`✅ Poll vote saved for user ${userId} on confession ${id}: ${option}`);
    } catch (error) {
      console.error(`Failed to upsert poll vote:`, error.message);
    }
  }

  // Fetch aggregated votes from confession_poll_votes table
  let aggregatedVotes = {};
  try {
    const { data, error } = await supabase
      .from('confession_poll_votes')
      .select('voter_session_id, option')
      .eq('confession_id', id);
    if (error) throw error;
    
    // Build votes map: { userId: option }
    if (Array.isArray(data)) {
      data.forEach(row => {
        aggregatedVotes[row.voter_session_id] = row.option;
      });
    }
  } catch (error) {
    console.error(`Failed to aggregate poll votes for ${id}:`, error.message);
  }

  // Update confession poll with aggregated votes
  confession.poll.votes = aggregatedVotes;
  upsertConfession(confession);

  // Also update JSONB poll.votes in database for backward compatibility
  try {
    console.log(`📊 Updating poll for confession: ${id}`);
    
    const result = await updateConfessionInDatabase(id, { poll: confession.poll });
    if (!result.success) {
      console.error(`❌ Failed to update poll:`, result.error);
      throw new Error(result.error);
    }
    console.log(`✅ Poll updated successfully in ${result.table}`);
  } catch (error) {
    console.error(`Failed to update poll for confession ${id}:`, error.message, error);
  }

  await writeFallback();

  // Emit real-time poll update with aggregated votes
  io.to(`confession-${id}`).emit('poll-update', { id, poll: confession.poll });
  console.log(`📊 Poll update broadcasted for confession: ${id}, total votes: ${Object.keys(aggregatedVotes).length}`);

  return res.json({ success: true, data: { poll: confession.poll } });
});

router.post(
  "/:id/reply",
  rateLimitSimple(30, 60_000),
  sanitizeInput(["content"]),
  async (req, res) => {
    const { id } = req.params;
    const { content, alias, sessionId, parentCommentId } = req.body || {};

    if (!content || typeof content !== "string" || content.length === 0 || content.length > 1000) {
      return res.status(400).json({ success: false, message: "Invalid reply content" });
    }

    await ensureCache();
    let confession = confessions.find((item) => item.id === id);
    if (!confession) {
      confession = await fetchConfessionFromSupabase(id);
    }
    if (!confession) {
      return res.status(404).json({ success: false, message: "Confession not found" });
    }

    const replyId = uuidv4();
    const timestamp = new Date().toISOString();
    const replyAlias = typeof alias === "string" ? alias : alias?.name ?? alias ?? null;

    const reply = {
      id: replyId,
      confessionId: id,
      content: content, // Preserve original formatting including spaces and line breaks
      alias: replyAlias,
      sessionId: sessionId || null,
      parentId: parentCommentId || null,
      campus: 'general', // Always general confessions
      createdAt: timestamp,
      score: 0,
      metadata: {}
    };

    try {
      console.log(`📝 Storing comment in confession_replies: confessionId=${id}, parentId=${reply.parentId || 'none'}`);
      
      // Store comment in confession_replies table (unified table with proper RLS policies)
      // Ensure alias is never null (required field in confession_replies)
      let aliasData = typeof reply.alias === 'string' ? { name: reply.alias } : reply.alias;
      if (!aliasData || (typeof aliasData === 'object' && !aliasData.name)) {
        aliasData = { name: 'Anonymous', emoji: '👤' }; // Default fallback
      }
      
      const { data: insertedComment, error: commentError } = await supabase
        .from("confession_replies")
        .insert({
          id: reply.id,
          confession_id: reply.confessionId,
          content: reply.content,
          alias: aliasData, // JSONB field, required
          session_id: reply.sessionId,
          parent_id: reply.parentId || null, // Map parent_comment_id to parent_id
          created_at: reply.createdAt,
          score: reply.score,
          campus: reply.campus || null,
          metadata: reply.metadata || {}
        })
        .select()
        .single();
      
      if (commentError) {
        const errorInfo = handleSupabaseError(commentError);
        console.error(`❌ [${errorInfo.errorCode}] Failed to insert comment:`, {
          commentId: reply.id,
          confessionId: id,
          error: errorInfo.logMessage,
          details: commentError.details,
          hint: commentError.hint,
          code: commentError.code
        });
        return res.status(errorInfo.statusCode).json({
          success: false,
          error_code: errorInfo.errorCode,
          message: errorInfo.userMessage,
          ...(process.env.NODE_ENV === 'development' && {
            developer_message: errorInfo.logMessage,
            error_details: commentError.details || commentError.hint
          })
        });
      }

      if (!insertedComment) {
        console.error("❌ [INSERT_FAILED] Comment insert returned no data:", reply.id);
        return res.status(500).json({
          success: false,
          error_code: "INSERT_FAILED",
          message: "Failed to create comment. Please try again."
        });
      }

      console.log(`✅ Stored comment in confession_replies`);

      // Update replies_count in confessions table
      try {
        const { data: currentConfession, error: fetchError } = await supabase
          .from("confessions")
          .select("replies_count")
          .eq("id", id)
          .maybeSingle();
        
        if (fetchError) {
          const fetchErrorInfo = handleSupabaseError(fetchError);
          console.warn(`⚠️ [${fetchErrorInfo.errorCode}] Failed to fetch confession for comment count update:`, {
            confessionId: id,
            error: fetchErrorInfo.logMessage
          });
          // Don't fail the request, just log the warning
        } else if (currentConfession) {
          const newRepliesCount = safeNumber(currentConfession.replies_count, 0) + 1;
          
          const { error: updateError } = await supabase
            .from("confessions")
            .update({ 
              replies_count: newRepliesCount,
              updated_at: new Date().toISOString()
            })
            .eq("id", id);
          
          if (updateError) {
            const updateErrorInfo = handleSupabaseError(updateError);
            console.error(`❌ [${updateErrorInfo.errorCode}] Failed to update comment_count:`, {
              confessionId: id,
              error: updateErrorInfo.logMessage
            });
            // Don't fail the request, comment was already inserted
          } else {
            console.log(`✅ Updated replies_count for confession ${id}: ${newRepliesCount}`);
          }
        } else {
          console.warn(`⚠️ [NOT_FOUND] Confession ${id} not found in confessions for replies_count update`);
          // Don't fail the request, comment was already inserted
        }
      } catch (countUpdateError) {
        // Log but don't fail - comment was successfully inserted
        const countErrorInfo = handleSupabaseError(countUpdateError);
        console.error(`❌ [${countErrorInfo.errorCode}] Error updating comment count (non-critical):`, {
          confessionId: id,
          error: countErrorInfo.logMessage
        });
      }
    } catch (error) {
      const errorInfo = handleSupabaseError(error);
      console.error(`❌ [${errorInfo.errorCode}] Unexpected error storing comment:`, {
        commentId: reply.id,
        confessionId: id,
        error: errorInfo.logMessage,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      return res.status(errorInfo.statusCode).json({
        success: false,
        error_code: errorInfo.errorCode,
        message: errorInfo.userMessage,
        ...(process.env.NODE_ENV === 'development' && {
          developer_message: errorInfo.logMessage
        })
      });
    }

    // Update local confession cache
    const localConfession = confessions.find(c => c.id === id);
    const updatedRepliesCount = safeNumber(localConfession?.replies, 0) + 1;
    if (localConfession) {
      localConfession.replies = updatedRepliesCount;
      upsertConfession(localConfession);
    }

    const existingReplies = repliesCache.get(id) || [];
    repliesCache.set(id, [...existingReplies, reply]);

    await writeFallback();

    // Emit real-time update for new comment/reply
    io.to(`confession-${id}`).emit('new-comment', reply);
    io.to(`confession-${id}`).emit('confession-updated', { 
      id, 
      replies: updatedRepliesCount,
      commentsCount: updatedRepliesCount 
    });
    console.log(`📢 New comment broadcasted for confession: ${id}, new count: ${updatedRepliesCount}`);

    return res.json({ success: true, data: reply });
  }
);

router.get("/:id/replies", async (req, res) => {
  const { id } = req.params;
  
  try {
    // Fetch comments from confession_replies (unified table with proper RLS policies)
    const { data: comments, error } = await supabase
      .from('confession_replies')
      .select('*')
      .eq('confession_id', id)
      .order('created_at', { ascending: true });
    
    if (error) {
      const errorInfo = handleSupabaseError(error);
      console.error(`❌ [${errorInfo.errorCode}] Failed to fetch comments:`, {
        confessionId: id,
        error: errorInfo.logMessage,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return res.status(errorInfo.statusCode).json({
        success: false,
        error_code: errorInfo.errorCode,
        message: errorInfo.userMessage,
        ...(process.env.NODE_ENV === 'development' && {
          developer_message: errorInfo.logMessage,
          error_details: error.details || error.hint
        })
      });
    }
    
    // Normalize comments (map parent_id to parentId for compatibility)
    const normalized = Array.isArray(comments) ? comments.map((row) => normalizeCommentRecord(row, row.parent_id)) : [];
    
    return res.json({ success: true, data: normalized });
  } catch (error) {
    const errorInfo = handleSupabaseError(error);
    console.error(`❌ [${errorInfo.errorCode}] Unexpected error fetching comments:`, {
      confessionId: id,
      error: errorInfo.logMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return res.status(errorInfo.statusCode).json({
      success: false,
      error_code: errorInfo.errorCode,
      message: errorInfo.userMessage,
      ...(process.env.NODE_ENV === 'development' && {
        developer_message: errorInfo.logMessage
      })
    });
  }
});

router.post("/:id/reply/:replyId/vote", rateLimitSimple(60, 60_000), async (req, res) => {
  const { id, replyId } = req.params;
  const { direction } = req.body || {};

  if (![1, -1].includes(direction)) {
    return res.status(400).json({ success: false, message: "Invalid vote direction" });
  }

  let replies = repliesCache.get(id);
  if (!replies) {
    replies = await fetchReplyList(id);
  }

  const reply = replies?.find((item) => item.id === replyId);
  if (!reply) {
    return res.status(404).json({ success: false, message: "Reply not found" });
  }

  reply.score = Math.max(0, (reply.score || 0) + direction);
  repliesCache.set(id, replies);

  try {
    const { error } = await supabase
      .from("confession_replies")
      .update({ score: reply.score })
      .eq("id", replyId);
    if (error) throw error;
  } catch (error) {
    console.error(`Failed to update reply ${replyId} score:`, error.message);
  }

  await writeFallback();

  // Emit real-time reply vote update
  io.to(`confession-${id}`).emit('comment-vote-update', { id: replyId, confessionId: id, score: reply.score, direction });
  console.log(`📊 Comment vote update broadcasted for reply: ${replyId}`);

  return res.json({ success: true, data: { score: reply.score } });
});

router.put(
  "/:id/reply/:replyId/edit",
  rateLimitSimple(30, 60_000),
  sanitizeInput(["content"]),
  async (req, res) => {
    const { id, replyId } = req.params;
    const { content, sessionId } = req.body || {};

    if (!content || typeof content !== "string" || content.trim().length === 0 || content.length > 1000) {
      return res.status(400).json({ success: false, message: "Invalid reply content" });
    }

    let replies = repliesCache.get(id);
    if (!replies) {
      replies = await fetchReplyList(id);
    }
    const reply = replies?.find((item) => item.id === replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: "Reply not found" });
    }

    if (!reply.sessionId || reply.sessionId !== sessionId) {
      return res.status(403).json({ success: false, message: "You can only edit your own replies" });
    }

    reply.content = content.trim();
    reply.metadata = { ...reply.metadata, editedAt: new Date().toISOString(), isEdited: true };
    repliesCache.set(id, replies);

    try {
      const { error } = await supabase
        .from("confession_replies")
        .update({
          content: reply.content,
          metadata: reply.metadata
        })
        .eq("id", replyId);
      if (error) throw error;
    } catch (error) {
      console.error(`Failed to update reply ${replyId}:`, error.message);
    }

    await writeFallback();
    return res.json({ success: true, data: reply });
  }
);

router.delete("/:id", rateLimitSimple(10, 60_000), async (req, res) => {
  const { id } = req.params;
  const { sessionId } = req.body || {};

  await ensureCache();
  let confession = confessions.find((item) => item.id === id);
  if (!confession) {
    confession = await fetchConfessionFromSupabase(id);
  }

  if (!confession) {
    return res.status(404).json({ success: false, message: "Confession not found" });
  }

  if (!confession.sessionId || confession.sessionId !== sessionId) {
    return res.status(403).json({ success: false, message: "You can only delete your own confessions" });
  }

  const now = new Date();
  const postedAt = new Date(confession.createdAt);
  const hoursSincePosted = (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60);

  if (hoursSincePosted >= 24) {
    return res.status(410).json({
      success: false,
      message: "Deletion window expired. Confessions can only be deleted within 24 hours of posting.",
      deletionWindowExpired: true,
      hoursExpired: Math.floor(hoursSincePosted - 24)
    });
  }

  try {
    const { error: deleteError } = await supabase
      .from("confessions")
      .delete()
      .eq("id", id);
    
    if (deleteError) {
      const errorInfo = handleSupabaseError(deleteError);
      console.error(`❌ [${errorInfo.errorCode}] Failed to delete confession:`, {
        confessionId: id,
        error: errorInfo.logMessage,
        details: deleteError.details,
        hint: deleteError.hint,
        code: deleteError.code
      });
      return res.status(errorInfo.statusCode).json({
        success: false,
        error_code: errorInfo.errorCode,
        message: errorInfo.userMessage,
        ...(process.env.NODE_ENV === 'development' && {
          developer_message: errorInfo.logMessage,
          error_details: deleteError.details || deleteError.hint
        })
      });
    }
    
    console.log(`✅ Confession ${id} deleted successfully from confessions`);
  } catch (error) {
    const errorInfo = handleSupabaseError(error);
    console.error(`❌ [${errorInfo.errorCode}] Unexpected error deleting confession:`, {
      confessionId: id,
      error: errorInfo.logMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return res.status(errorInfo.statusCode).json({
      success: false,
      error_code: errorInfo.errorCode,
      message: errorInfo.userMessage,
      ...(process.env.NODE_ENV === 'development' && {
        developer_message: errorInfo.logMessage
      })
    });
  }

  removeConfession(id);
  await writeFallback();

  const hoursRemaining = 24 - hoursSincePosted;
  return res.json({
    success: true,
    message: "Confession deleted successfully",
    deletionInfo: {
      hoursRemaining: Math.floor(hoursRemaining),
      minutesRemaining: Math.floor((hoursRemaining % 1) * 60)
    }
  });
});

// Old /trending route removed - now using the new engagement controller route at line 1680

router.get("/best", async (req, res) => {
  const best = await getBestConfessionOfDay();
  return res.json({ success: true, data: best });
});

router.get("/stats", async (_req, res) => {
  try {
    await ensureCache();

    const { data, error } = await supabase
      .from("confession_replies")
      .select("confession_id, count(*)")
      .group("confession_id");

    if (error) throw error;

    const replyCountMap = new Map(
      Array.isArray(data)
        ? data.map((row) => [String(row.confession_id), Number(row.count)])
        : []
    );

    const totalConfessions = confessions.length;
    const totalReplies = Array.from(replyCountMap.values()).reduce((sum, count) => sum + count, 0);
    const trending = await getLocalTrendingConfessions();
    const best = await getBestConfessionOfDay();

    return res.json({
      success: true,
      data: {
        totalConfessions,
        totalReplies,
        trendingCount: trending.length,
        hasBestConfession: Boolean(best),
        bestConfessionId: best?.id ?? null
      }
    });
  } catch (error) {
    console.error("Failed to gather confession stats:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * GET /api/confessions/activity?sessionId=xxx
 * Returns user's feed activity: confessions they posted + confessions they commented on.
 * Each item has confession (preview), activityAt (timestamp), activityType ('posted' | 'commented').
 * Sorted by most recent activity first.
 */
router.get("/activity", rateLimitSimple(30, 60_000), async (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ success: false, message: "sessionId required" });
  }

  try {
    const activityMap = new Map(); // confessionId -> { confession, activityAt, activityType }

    // 1. User's posted confessions (session_id = sessionId)
    const { data: postedRows, error: postedError } = await supabase
      .from("confessions")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (postedError) {
      console.error("Activity: error fetching posted confessions:", postedError.message);
    } else if (Array.isArray(postedRows)) {
      for (const row of postedRows) {
        const norm = normalizeConfession(row);
        if (norm) {
          activityMap.set(String(norm.id), {
            confession: norm,
            activityAt: norm.createdAt,
            activityType: "posted"
          });
        }
      }
    }

    // 2. Confessions user commented on: get confession_id and latest created_at per confession from confession_replies
    const { data: replyRows, error: replyError } = await supabase
      .from("confession_replies")
      .select("confession_id, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (replyError) {
      console.error("Activity: error fetching replies:", replyError.message);
    } else if (Array.isArray(replyRows)) {
      const latestByConfession = new Map();
      for (const r of replyRows) {
        const cid = String(r.confession_id);
        if (!latestByConfession.has(cid)) {
          latestByConfession.set(cid, r.created_at);
        }
      }
      const commentedIds = Array.from(latestByConfession.keys());
      for (const cid of commentedIds) {
        if (activityMap.has(cid)) {
          const existing = activityMap.get(cid);
          const commentAt = latestByConfession.get(cid);
          if (new Date(commentAt) > new Date(existing.activityAt)) {
            existing.activityAt = commentAt;
            existing.activityType = "commented";
          }
          continue;
        }
        const confession = await fetchConfessionFromSupabase(cid);
        if (confession) {
          activityMap.set(cid, {
            confession,
            activityAt: latestByConfession.get(cid),
            activityType: "commented"
          });
        }
      }
    }

    const items = Array.from(activityMap.values())
      .sort((a, b) => new Date(b.activityAt) - new Date(a.activityAt));

    return res.json({ success: true, data: items });
  } catch (error) {
    console.error("Activity: unexpected error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/:id/deletion-status", rateLimitSimple(30, 60_000), async (req, res) => {
  const { id } = req.params;
  const { sessionId } = req.query;

  await ensureCache();
  let confession = confessions.find((item) => item.id === id);
  if (!confession) {
    confession = await fetchConfessionFromSupabase(id);
  }
  if (!confession) {
    return res.status(404).json({ success: false, message: "Confession not found" });
  }

  const canDelete = confession.sessionId && confession.sessionId === sessionId;
  if (!canDelete) {
    return res.json({
      success: true,
      data: {
        canDelete: false,
        reason: "not_owner",
        message: "You can only delete your own confessions"
      }
    });
  }

  const now = new Date();
  const postedAt = new Date(confession.createdAt);
  const hoursSincePosted = (now.getTime() - postedAt.getTime()) / (1000 * 60 * 60);

  if (hoursSincePosted >= 24) {
    return res.json({
      success: true,
      data: {
        canDelete: false,
        reason: "window_expired",
        message: "Deletion window expired. Confessions can only be deleted within 24 hours of posting.",
        hoursExpired: Math.floor(hoursSincePosted - 24)
      }
    });
  }

  const hoursRemaining = 24 - hoursSincePosted;
  return res.json({
    success: true,
    data: {
      canDelete: true,
      hoursRemaining: Math.floor(hoursRemaining),
      minutesRemaining: Math.floor((hoursRemaining % 1) * 60),
      timeRemaining: hoursRemaining < 1 ? `${Math.floor(hoursRemaining * 60)}m` : `${Math.floor(hoursRemaining)}h`
    }
  });
});

router.post("/:id/report", rateLimitSimple(10, 60_000), (_req, res) => {
  return res.json({ success: true, message: "Reported" });
});

// ============ VIEW TRACKING ============

/**
 * Track confession view for both authenticated and anonymous users
 * POST /api/confessions/track-view
 * Body: { confessionId: string, userId?: string, anonymousId?: string }
 */
router.post("/track-view", rateLimitSimple(60, 60_000), async (req, res) => {
  const startTime = Date.now();
  console.log(`\n[TRACK-VIEW] ========================================`);
  console.log(`[TRACK-VIEW] Request received at ${new Date().toISOString()}`);
  
  try {
    const { confessionId, userId, anonymousId } = req.body || {};
    
    console.log(`[TRACK-VIEW] Input:`, { confessionId, userId, anonymousId });
    
    // Validate input
    if (!confessionId || typeof confessionId !== 'string') {
      console.log(`[TRACK-VIEW] ❌ Invalid confession ID`);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid confession ID' 
      });
    }
    
    // Either userId or anonymousId must be provided
    if (!userId && !anonymousId) {
      console.log(`[TRACK-VIEW] ❌ Either userId or anonymousId must be provided`);
      return res.status(400).json({ 
        success: false, 
        message: 'Either userId or anonymousId must be provided' 
      });
    }
    
    // Only one should be provided
    if (userId && anonymousId) {
      console.log(`[TRACK-VIEW] ❌ Only one of userId or anonymousId should be provided`);
      return res.status(400).json({ 
        success: false, 
        message: 'Only one of userId or anonymousId should be provided' 
      });
    }
    
    // Call the database function to track view
    const { data, error } = await supabase.rpc('track_confession_view', {
      p_confession_id: confessionId,
      p_user_id: userId || null,
      p_anonymous_id: anonymousId || null
    });
    
    if (error) {
      console.error(`[TRACK-VIEW] ❌ RPC Error:`, error);
      
      // Handle specific errors
      if (error.message.includes('Confession not found')) {
        return res.status(404).json({ 
          success: false, 
          message: 'Confession not found' 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to track view',
        error: error.message 
      });
    }
    
    console.log(`[TRACK-VIEW] ✅ Success:`, data);
    console.log(`[TRACK-VIEW] Completed in ${Date.now() - startTime}ms`);
    
    return res.json({
      success: true,
      data: {
        alreadyViewed: data?.already_viewed || false,
        newViewCount: data?.new_view_count || 0
      }
    });
  } catch (error) {
    console.error(`[TRACK-VIEW] ❌ Exception:`, error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// ============ ADMIN ROUTES ============

/**
 * Generate fake metrics for all confessions
 * POST /api/confessions/admin/generate-fake-metrics
 * 
 * This is an admin endpoint to populate fake views and upvotes for confessions.
 * Should be run once initially and periodically for new confessions.
 */
router.post("/admin/generate-fake-metrics", rateLimitSimple(5, 60_000), async (req, res) => {
  const startTime = Date.now();
  console.log(`\n[ADMIN] ========================================`);
  console.log(`[ADMIN] Generate fake metrics request received`);
  
  try {
    // Call the database function to generate fake metrics for all confessions
    const { data, error } = await supabase.rpc('generate_fake_metrics_for_all_confessions');
    
    if (error) {
      console.error(`[ADMIN] ❌ Error generating fake metrics:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate fake metrics',
        error: error.message
      });
    }
    
    console.log(`[ADMIN] ✅ Fake metrics generated:`, data);
    console.log(`[ADMIN] Completed in ${Date.now() - startTime}ms`);
    
    return res.json({
      success: true,
      message: 'Fake metrics generated successfully',
      data: data
    });
  } catch (error) {
    console.error(`[ADMIN] ❌ Exception:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Generate fake metrics for a single confession
 * POST /api/confessions/admin/generate-fake-metrics/:id
 */
router.post("/admin/generate-fake-metrics/:id", rateLimitSimple(10, 60_000), async (req, res) => {
  const { id } = req.params;
  console.log(`\n[ADMIN] Generate fake metrics for confession: ${id}`);
  
  try {
    // First, get the confession to get its stats
    const { data: confession, error: confessionError } = await supabase
      .from('confessions')
      .select('id, replies_count, score, created_at')
      .eq('id', id)
      .single();
    
    if (confessionError || !confession) {
      return res.status(404).json({
        success: false,
        message: 'Confession not found'
      });
    }
    
    // Generate fake metrics
    const { data, error } = await supabase.rpc('generate_fake_metrics_for_confession', {
      p_confession_id: id,
      p_comment_count: confession.replies_count || 0,
      p_upvote_count: confession.score || 0,
      p_created_at: confession.created_at
    });
    
    if (error) {
      console.error(`[ADMIN] ❌ Error generating fake metrics:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate fake metrics',
        error: error.message
      });
    }
    
    console.log(`[ADMIN] ✅ Fake metrics generated for confession ${id}:`, data);
    
    return res.json({
      success: true,
      message: 'Fake metrics generated for confession',
      data: data
    });
  } catch (error) {
    console.error(`[ADMIN] ❌ Exception:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ============ ENGAGEMENT FEATURES ROUTES ============

// All confessions (newest first, default view)
router.get("/all", rateLimitSimple(30, 60_000), getAllConfessions);

// Trending confessions (engagement score based)
router.get("/trending", rateLimitSimple(30, 60_000), getTrendingConfessions);

// Fresh drops (random from last 24h)
router.get("/fresh", rateLimitSimple(30, 60_000), getFreshConfessions);

// Top rated (all time, sorted by upvotes)
router.get("/top", rateLimitSimple(30, 60_000), getTopRatedConfessions);

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const startTime = Date.now();
  
  console.log(`\n[GET /:id] ========================================`);
  console.log(`[GET /:id] Request received for confession ID: ${id}`);
  console.log(`[GET /:id] Query params:`, req.query);

  if (["trending", "best", "stats"].includes(id) || id.includes("deletion-status")) {
    console.log(`[GET /:id] ❌ Blocked reserved route: ${id}`);
    return res.status(404).json({ success: false, message: "Not found" });
  }

  try {
    // Use RPC to get confession with combined metrics
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_confession_with_metrics', {
      p_confession_id: id
    });
    
    let confession = null;
    
    if (!rpcError && rpcData && rpcData.length > 0) {
      const row = rpcData[0];
      // Normalize with combined metrics
      confession = normalizeConfession(row);
      console.log(`[GET /:id] ✅ Found via RPC with combined metrics:`, {
        id: confession.id,
        total_views: row.total_views,
        total_upvotes: row.total_upvotes
      });
    }
    
    // Fallback to cache if RPC fails
    if (!confession) {
      await ensureCache();
      confession = confessions.find((item) => item.id === id);
      if (confession) {
        console.log(`[GET /:id] ✅ Found in memory cache (fallback)`);
      } else {
        console.log(`[GET /:id] Not in cache, searching database...`);
        confession = await fetchConfessionFromSupabase(id);
      }
    }
    
    if (!confession) {
      console.error(`[GET /:id] ❌ Confession ${id} not found`);
      console.log(`[GET /:id] Completed in ${Date.now() - startTime}ms`);
      return res.status(404).json({ 
        success: false,
        error_code: "NOT_FOUND",
        message: "Confession not found. It may have been deleted or doesn't exist.",
        searchedTable: 'confessions',
        searchedCache: true
      });
    }

    console.log(`[GET /:id] ✅ Confession found:`, {
      id: confession.id,
      contentLength: confession.content?.length || 0,
      hasAlias: !!confession.alias,
      score: confession.score,
      viewCount: confession.viewCount,
      replies: confession.replies
    });

    // Fetch user's vote for this confession from unified confession_votes table
    const sessionId = req.query.sessionId;
    let userVote = 0;
    if (sessionId) {
      try {
        console.log(`[GET /:id] Fetching user vote for sessionId: ${sessionId}`);
        const { data, error } = await supabase
          .from('confession_votes')
          .select('vote')
          .eq('confession_id', id)
          .eq('voter_session_id', sessionId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          const errorInfo = handleSupabaseError(error);
          console.warn(`⚠️ [${errorInfo.errorCode}] Error fetching user vote:`, {
            confessionId: id,
            sessionId: sessionId,
            error: errorInfo.logMessage
          });
        } else if (data) {
          userVote = data.vote ?? 0;
          console.log(`[GET /:id] User vote: ${userVote}`);
        }
      } catch (voteError) {
        const errorInfo = handleSupabaseError(voteError);
        console.error(`❌ [${errorInfo.errorCode}] Exception fetching user vote:`, {
          confessionId: id,
          sessionId: sessionId,
          error: errorInfo.logMessage
        });
      }
    }

    console.log(`[GET /:id] ✅ Returning confession with userVote: ${userVote}`);
    console.log(`[GET /:id] Completed in ${Date.now() - startTime}ms`);

    return res.json({ success: true, data: { ...confession, userVote } });
  } catch (error) {
    console.error(`[GET /:id] ❌ Exception:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;


