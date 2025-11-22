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
  const repliesValue = safeNumber(row.replies_count ?? row.replies ?? row.meta?.replies, 0);
  const scoreValue = safeNumber(row.score ?? row.likes ?? row.meta?.likes, 0);
  return {
    id: String(row.id),
    content: row.content ?? "",
    alias: aliasValue,
    sessionId: row.sessionId ?? row.session_id ?? row.user_id ?? null,
    campus: row.campus ?? 'general',
    createdAt, // Always DB value
    score: scoreValue,
    reactions,
    replies: repliesValue,
    poll,
    isExplicit: Boolean(row.isExplicit ?? row.is_explicit ?? row.meta?.isExplicit ?? false)
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
      console.error('Error fetching user votes:', error);
      return {};
    }

    // Create a map of confession_id -> vote
    const votesMap = {};
    if (Array.isArray(data)) {
      data.forEach(row => {
        votesMap[row.confession_id] = safeNumber(row.vote, 0);
      });
    }

    return votesMap;
  } catch (error) {
    console.error('Failed to fetch user votes:', error);
    return {};
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
  console.log(`[FETCH CONFESSION] Querying main 'confessions' table only`);
  
  try {
    // Query only the main confessions table
    const { data, error } = await supabase
      .from('confessions')
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`[FETCH CONFESSION] ❌ Error querying confessions table:`, error.message);
      console.error(`[FETCH CONFESSION] Error details:`, {
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
    console.error(`[FETCH CONFESSION] ❌ Exception querying confessions table:`, error.message);
    console.error(`[FETCH CONFESSION] Exception stack:`, error.stack);
    
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
// Note: SQL functions aggregate from all tables for "general" confessions
const getAllConfessionTables = () => [
  'confessions',
  'confessions_mit_adt',
  'confessions_mit_wpu',
  'confessions_vit_vellore',
  'confessions_parul_university',
  'confessions_iict'
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

    const { content, alias, sessionId, poll, userName, userEmail, anonymousName, avatar, uploads, searchHistory } = req.body || {};
    // Always use main confessions table (general confessions)
    const table = 'confessions';
    const campusCode = 'general'; // Always general confessions
    console.log(`[CONFESSION CREATE] Using table: ${table}`);

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
    const normalizedAlias = alias && typeof alias === "object" ? alias : alias ? { name: alias } : null;
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
      campus: campusCode,
      createdAt: timestamp,
      score: 0,
      reactions: {},
      replies: 0,
      poll: normalizedPoll,
      isExplicit,
      userName: userName || null,
      userEmail: userEmail || null,
      anonymousName: anonymousName || (normalizedAlias?.name || null),
      avatar: avatar || null,
      uploads: uploads || null,
      searchHistory: searchHistory || null
    };

    try {
      const { error } = await supabase.from(table).insert({
        id,
        content: confession.content,
        alias: confession.alias,
        session_id: confession.sessionId,
        campus: confession.campus,
        created_at: confession.createdAt,
        reactions: confession.reactions,
        poll: confession.poll || null,
        score: confession.score,
        replies_count: confession.replies,
        is_explicit: confession.isExplicit,
        user_name: confession.userName,
        user_email: confession.userEmail,
        anonymous_name: confession.anonymousName,
        avatar: confession.avatar,
        uploads: confession.uploads,
        search_history: confession.searchHistory
      });
      if (error) {
        console.error("❌ Failed to store confession in Supabase:", error.message, error);
        throw error;
      }
      console.log("✅ Confession stored in Supabase successfully:", id);
    } catch (error) {
      console.error("❌ Failed to store confession in Supabase:", error.message);
      // Don't fail the request if Supabase insert fails - still cache it
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
          console.warn(`Failed to fetch from ${tableName}:`, tableError.message);
          continue;
        }
        
        if (Array.isArray(tableData)) {
          allConfessions.push(...tableData);
        }
      } catch (error) {
        console.warn(`Error fetching from ${tableName}:`, error.message);
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
    console.error("Failed to load confessions from Supabase:", error.message);
    await ensureCache(false);
    const items = confessions.slice(cursor, cursor + limit);
    const nextCursor = cursor + limit < confessions.length ? String(cursor + limit) : null;
    return res.json({ success: true, data: { items, nextCursor } });
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

  // Read previous vote
  let previousVote = 0;
  try {
    const { data: existing, error: selectError } = await supabase
      .from('confession_votes')
      .select('vote')
      .eq('confession_id', id)
      .eq('voter_session_id', voter)
      .maybeSingle();
    if (selectError) throw selectError;
    previousVote = safeNumber(existing?.vote, 0);
  } catch (error) {
    console.error(`Failed to load previous vote for confession ${id}:`, error.message);
  }

  // Compute new vote and score delta
  let newVote = previousVote;
  if (direction === 1) {
    newVote = previousVote === 1 ? 0 : 1;
  } else if (direction === -1) {
    newVote = previousVote === -1 ? 0 : -1;
  }
  const scoreDelta = newVote - previousVote; // ensures +-1 per user

  // Upsert vote row
  try {
    const { error: upsertError } = await supabase
      .from('confession_votes')
      .upsert({ confession_id: id, voter_session_id: voter, vote: newVote, updated_at: new Date().toISOString() }, { onConflict: 'confession_id,voter_session_id' });
    if (upsertError) throw upsertError;
  } catch (error) {
    console.error(`Failed to upsert vote for confession ${id}:`, error.message);
  }

  // Update confession score
  const nextScore = Math.max(0, safeNumber(confession.score, 0) + scoreDelta);
  confession.score = nextScore;
  upsertConfession(confession);

  try {
    const result = await updateConfessionInDatabase(id, { score: confession.score });
    if (!result.success) {
      console.warn(`Failed to update confession ${id} score:`, result.error);
    }
  } catch (error) {
    console.error(`Failed to update confession ${id} score:`, error.message);
  }

  await writeFallback();

  // Emit real-time vote update with score and voter's sessionId
  io.to(`confession-${id}`).emit('vote-update', { 
    confessionId: id, 
    score: confession.score,
    sessionId: voter,
    userVote: newVote 
  });
  console.log(`📊 Vote update broadcasted for confession: ${id}, newVote: ${newVote}, score: ${confession.score}`);

  return res.json({ success: true, data: { score: confession.score, userVote: newVote } });
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
      console.log(`📝 Storing comment: confessionId=${id}, parentId=${reply.parentId || 'none'}`);
      
      // Store reply in legacy table
      const { error } = await supabase.from("confession_replies").insert({
        id: reply.id,
        confession_id: reply.confessionId,
        content: reply.content,
        alias: reply.alias,
        session_id: reply.sessionId,
        parent_id: reply.parentId,
        campus: 'general',
        created_at: reply.createdAt,
        score: reply.score,
        metadata: reply.metadata
      });
      if (error) {
        console.error(`❌ Failed to insert into confession_replies:`, error);
        throw error;
      }
      console.log(`✅ Stored in legacy confession_replies table`);

      // Store in main comments table (general confessions)
      if (reply.parentId) {
        // Sub-comment
        const { error: subError } = await supabase.from("sub_comments").insert({
          id: reply.id,
          comment_id: reply.parentId,
          confession_id: reply.confessionId,
          campus: 'general',
          content: reply.content,
          alias: typeof reply.alias === 'string' ? { name: reply.alias } : reply.alias,
          session_id: reply.sessionId,
          created_at: reply.createdAt,
          score: reply.score,
          metadata: reply.metadata
        });
        if (subError) {
          console.error(`❌ Failed to insert sub-comment:`, subError);
          throw subError;
        }
        console.log(`✅ Stored sub-comment`);
      } else {
        // Root comment
        const { error: commentError } = await supabase.from("comments").insert({
          id: reply.id,
          confession_id: reply.confessionId,
          campus: 'general',
          content: reply.content,
          alias: typeof reply.alias === 'string' ? { name: reply.alias } : reply.alias,
          session_id: reply.sessionId,
          created_at: reply.createdAt,
          score: reply.score,
          metadata: reply.metadata
        });
        if (commentError) {
          console.error(`❌ Failed to insert root comment:`, commentError);
          throw commentError;
        }
        console.log(`✅ Stored root comment`);
      }

      // Update reply count - try to find confession in all tables
      const allTables = getAllConfessionTables();
      let currentConfession = null;
      let foundTable = null;
      
      // Find the confession in any table
      for (const table of allTables) {
        const { data, error } = await supabase
          .from(table)
          .select("replies_count")
          .eq("id", id)
          .maybeSingle();
        
        if (!error && data) {
          currentConfession = data;
          foundTable = table;
          break;
        }
      }
      
      if (!currentConfession) {
        console.warn(`⚠️ Confession ${id} not found in any table for reply count update`);
      } else {
        const newCount = safeNumber(currentConfession.replies_count, 0) + 1;
        const result = await updateConfessionInDatabase(id, { replies_count: newCount });
        if (result.success) {
          console.log(`✅ Updated replies_count for confession ${id} in ${result.table}: ${newCount}`);
        } else {
          console.error(`❌ Failed to update replies_count:`, result.error);
        }
      }
    } catch (error) {
      console.error(`❌ Failed to store reply for confession ${id}:`, error.message, error);
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
  // Always aggregate from all comment tables (general confessions)
  const combined = await fetchCommentsFromNewTables(id);
  if (combined) {
    return res.json({ success: true, data: combined });
  }
  // Fallback to legacy replies table
  const replies = await fetchReplyList(id, campus);
  return res.json({ success: true, data: replies });
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
    const { error } = await supabase.from("confessions").delete().eq("id", id);
    if (error) throw error;
  } catch (error) {
    console.error(`Failed to delete confession ${id}:`, error.message);
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

  await ensureCache();
  
  // Try in-memory cache first
  let confession = confessions.find((item) => item.id === id);
  if (confession) {
    console.log(`[GET /:id] ✅ Found in memory cache`);
  } else {
    console.log(`[GET /:id] Not in cache, searching database...`);
    confession = await fetchConfessionFromSupabase(id);
  }
  
  if (!confession) {
    console.error(`[GET /:id] ❌ Confession ${id} not found after searching all tables and cache`);
    console.log(`[GET /:id] Completed in ${Date.now() - startTime}ms`);
    return res.status(404).json({ 
      success: false, 
      message: "Confession not found",
      searchedTable: 'confessions',
      searchedCache: true
    });
  }

  console.log(`[GET /:id] ✅ Confession found:`, {
    id: confession.id,
    contentLength: confession.content?.length || 0,
    hasAlias: !!confession.alias,
    score: confession.score,
    replies: confession.replies
  });

  // Fetch user's vote for this confession
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

      if (!error && data) {
        userVote = safeNumber(data.vote, 0);
        console.log(`[GET /:id] User vote: ${userVote}`);
      } else if (error) {
        console.warn(`[GET /:id] Error fetching user vote:`, error.message);
      }
    } catch (error) {
      console.error('[GET /:id] Exception fetching user vote:', error);
    }
  }

  console.log(`[GET /:id] ✅ Returning confession with userVote: ${userVote}`);
  console.log(`[GET /:id] Completed in ${Date.now() - startTime}ms`);

  return res.json({ success: true, data: { ...confession, userVote } });
});

export default router;


