import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createServer } from "http";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import modelRouter from "./routes/chatModels.js";
import chatAiRouter from "./routes/chatAi.js";
import profileRouter from "./routes/profile.js";
import characterRouter from "./routes/character.js";
import announcementsRouter from "./routes/announcements.js";
import progressRouter from "./routes/progress.js";
import viewsRouter from "./routes/views.js";
import authRouter from "./routes/authRoutes.js";
import adminRouter from "./routes/admin.js";
import mfaRouter from "./routes/mfa.js";
import confessionsRouter from "./routes/confessions.js";
// import hangoutRouter from "./routes/hangout.js"; // DISABLED - Coming Soon
import nexusChatsRouter from "./routes/nexusChats.js";
import companionChatRouter from "./routes/companionChat.js";
import companionContextRouter from "./routes/companionContext.js";
import questsRouter from "./routes/quests.js";
import affectionRouter from "./routes/affection.js";
import { categorizeGroupChat, getCategoryIcon, getCategoryColor } from "./utils/groupChatCategorization.js";
import { DarkroomService } from "./services/darkroomService.js";
// import { HangoutRoomsService } from "./services/hangoutRoomsService.js"; // DISABLED - Coming Soon
import { supabase } from "./config/supabase.js";
import { attachRolesFromEnv } from "./middleware/rbac.js";
import { createRequestLogger, logError } from './utils/logger.js';
import { assertRequiredEnv } from './utils/envCheck.js';
import { initMonitoring, captureError } from './utils/monitoring.js';
import { sanitizeBody } from './middleware/sanitize.js';
import { verifyCsrf } from './middleware/csrf.js';

const app = express();

// Trust proxy for Railway deployment (critical for rate limiting and client IP detection)
app.set('trust proxy', true);

// Initialize dark room state - clear existing data for fresh start
const initializeDarkRoomState = async () => {
  try {
    console.log('🗑️ Initializing dark room state - clearing existing data...');

    // Clear in-memory storage
    darkRoomState.roomMetadata = {};
    darkRoomState.roomUserCounts = {};
    darkRoomState.roomMessages = {};

    // Try to clear Supabase data if available
    try {
      const { DarkroomService } = await import('./services/darkroomService.js');

      // Delete all existing rooms (cascade delete will handle messages and users)
      const { error: roomsError } = await supabase
        .from('darkroom_rooms')
        .delete()
        .neq('id', ''); // Delete all rooms

      if (roomsError) {
        console.warn('⚠️ Failed to clear Supabase rooms:', roomsError.message);
      } else {
        console.log('✅ Cleared existing dark room data from Supabase');
      }

    } catch (dbError) {
      console.warn('⚠️ Supabase not available for clearing data:', dbError.message);
    }

    console.log('✅ Dark room state initialized - ready for fresh start');
  } catch (error) {
    console.error('Error initializing dark room state:', error);
  }
};

// Initialize on startup
// FIXME: initializeDarkRoomState() disabled - darkRoomState not declared yet
// initializeDarkRoomState();
const server = createServer(app);

// Fail-fast on missing env in production and init monitoring if configured
assertRequiredEnv();
initMonitoring();

// Process-level error handlers for visibility
process.on('unhandledRejection', (reason) => {
  try { captureError(reason); } catch {}
  console.error('UnhandledRejection', reason);
});
process.on('uncaughtException', (err) => {
  try { captureError(err); } catch {}
  console.error('UncaughtException', err);
});

// Track Socket.IO CORS logs to avoid spam
const socketCorsLogCache = new Map();

// Socket.IO setup for Dark Room (credentialed) - Match Express CORS configuration
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const logSocketCorsOnce = (message, key = 'no-origin') => {
        const now = Date.now();
        const lastLog = socketCorsLogCache.get(key) || 0;
        if (now - lastLog > 60000) { // 1 minute
          console.log(message);
          socketCorsLogCache.set(key, now);
        }
      };

      if (ALLOW_ALL_ORIGINS) {
        logSocketCorsOnce('🔌 Socket.IO: Allowing all origins (development mode)', 'dev-mode');
        return callback(null, true);
      }
      // No origin = direct request - don't log to avoid spam
      if (!origin) {
        return callback(null, true);
      }
      if (CORS_ALLOWLIST.includes(origin)) {
        logSocketCorsOnce(`🔌 Socket.IO: Allowed origin: ${origin}`, origin);
        return callback(null, true);
      }

      // Allow Railway domains (same-origin deployment)
      if (origin.includes('.railway.app') || origin.includes('.up.railway.app')) {
        logSocketCorsOnce(`🔌 Socket.IO: Allowed Railway origin: ${origin}`, origin);
        return callback(null, true);
      }

      // Allow LAN IP patterns (192.168.x.x) for development
      const lanPattern = /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/;
      if (lanPattern.test(origin)) {
        logSocketCorsOnce(`🔌 Socket.IO: Allowed LAN origin: ${origin}`, origin);
        return callback(null, true);
      }

      console.error('🚫 Socket.IO: Blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Optional Redis adapter for scale-out (enable if REDIS_URL provided)
if (process.env.REDIS_URL) {
  (async () => {
    try {
      const { createAdapter } = await import('@socket.io/redis-adapter');
      const { createClient: createRedisClient } = await import('redis');
      const pubClient = createRedisClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      await pubClient.connect();
      await subClient.connect();
      io.adapter(createAdapter(pubClient, subClient));
      console.log('🔌 Socket.IO Redis adapter enabled');
    } catch (e) {
      console.warn('⚠️ Failed to initialize Redis adapter, continuing without clustering:', e.message);
    }
  })();
}

const port = process.env.PORT || 8002;
const host = process.env.HOST || '0.0.0.0'; // Allow access from any network interface

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Cookie parsing (for httpOnly auth cookies)
app.use(cookieParser());

// Global CORS configuration with allowlist (env-driven)
const parseCsv = (v = "") => v.split(',').map(s => s.trim()).filter(Boolean);
const CORS_ALLOWLIST = parseCsv(process.env.CORS_ALLOWLIST ||
  'http://localhost:3000,http://127.0.0.1:3000,' +
  'http://localhost:5173,http://127.0.0.1:5173,' +
  'http://localhost:5174,http://127.0.0.1:5174,' +
  'http://192.168.1.35:3000,http://192.168.1.35:5173,' +
  'http://10.88.60.163:3000,http://10.88.60.163:5173,' +
  'http://10.87.73.163:3000,http://10.87.73.163:5173'
);
const CORS_METHODS = ['GET','POST','PUT','DELETE','OPTIONS'];
const ALLOW_ALL_ORIGINS = process.env.NODE_ENV !== 'production' || process.env.ALLOW_ALL_ORIGINS === 'true';

// Track CORS logs to avoid spam (only log unique origins once per minute)
const corsLogCache = new Map();
const CORS_LOG_INTERVAL = 60000; // 1 minute

const logCorsOnce = (message, origin = 'no-origin') => {
  const now = Date.now();
  const lastLog = corsLogCache.get(origin) || 0;
  if (now - lastLog > CORS_LOG_INTERVAL) {
    console.log(message);
    corsLogCache.set(origin, now);
  }
};

app.use(cors({
  origin: (origin, callback) => {
    if (ALLOW_ALL_ORIGINS) {
      logCorsOnce('🌐 CORS: Allowing all origins (development mode)', 'dev-mode');
      return callback(null, true);
    }

    // No origin = direct request, health checks, or same-origin
    // Don't log these to avoid spam
    if (!origin) {
      return callback(null, true);
    }

    if (CORS_ALLOWLIST.includes(origin)) {
      logCorsOnce(`🌐 CORS: Allowed origin: ${origin}`, origin);
      return callback(null, true);
    }

    // Allow Railway domains (same-origin deployment)
    if (origin.includes('.railway.app') || origin.includes('.up.railway.app')) {
      logCorsOnce(`🌐 CORS: Allowed Railway origin: ${origin}`, origin);
      return callback(null, true);
    }

    // Enhanced LAN IP pattern matching
    const lanPattern = /^https?:\/\/(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)\d{1,3}:\d+$/;
    if (lanPattern.test(origin)) {
      logCorsOnce(`🌐 CORS: Allowed LAN origin: ${origin}`, origin);
      return callback(null, true);
    }

    // Allow public IP addresses in development
    if (process.env.NODE_ENV !== 'production' && origin.match(/^https?:\/\/\d+\.\d+\.\d+\.\d+:\d+$/)) {
      logCorsOnce(`🌐 CORS: Allowed public IP origin (development): ${origin}`, origin);
      return callback(null, true);
    }

    console.error('🚫 CORS: Blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: CORS_METHODS,
  allowedHeaders: ['Content-Type','Authorization','X-CSRF-Token','X-User-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Allow CSRF header in CORS preflight
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-User-ID');
  next();
});

// Rate limiting strategy for 10k concurrent users
// Development: Permissive for testing
// Production: Per-user limits to handle high concurrency
const isDev = process.env.NODE_ENV === 'development';

// Track rate limit warnings to avoid log spam
const rateLimitWarnings = new Map();
const RATE_LIMIT_WARNING_INTERVAL = 30000; // Only log once per 30 seconds per IP

const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  // Railway deployment: Very high limit to handle load balancer traffic
  // Individual routes have their own specific limits
  max: isDev ? 5000 : Number(process.env.RATE_LIMIT_MAX || 1000),
  standardHeaders: true,
  legacyHeaders: false,
  
  // Use user ID or IP for per-user rate limiting in production
  keyGenerator: (req) => {
    // In production, rate limit per user/IP to allow 10k concurrent users
    if (!isDev) {
      // Prefer user ID from auth middleware, fallback to IP
      return req.user?.userId || req.ip || req.headers['x-forwarded-for'] || 'unknown';
    }
    // In development, use single key (effectively disabled)
    return 'dev-key';
  },
  
  skip: (req) => {
    // Skip rate limiting in development for smooth testing
    if (isDev) {
      return true;
    }
    
    // Skip Railway's internal IPs (100.64.0.0/10 CGNAT range)
    const ip = req.ip || req.headers['x-forwarded-for'] || '';
    if (ip.startsWith('100.64.') || ip.startsWith('100.65.') || 
        ip.startsWith('100.66.') || ip.startsWith('100.67.') ||
        ip.startsWith('100.68.') || ip.startsWith('100.69.') ||
        ip.startsWith('100.70.') || ip.startsWith('100.71.') ||
        ip.startsWith('100.72.') || ip.startsWith('100.73.') ||
        ip.startsWith('100.74.') || ip.startsWith('100.75.') ||
        ip.startsWith('100.76.') || ip.startsWith('100.77.')) {
      return true; // Skip Railway internal traffic
    }
    
    // Skip static files (assets, images, etc.)
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      return true;
    }
    
    // In production, skip for high-frequency endpoints that have their own protection
    const skipPaths = [
      '/api/hangout/rooms',
      '/health',
      '/api/v1/chat/companion/history', // History fetching is cached
      '/assets', // Vite build assets
      '/', // Root path for React app
    ];
    
    return skipPaths.some(path => 
      req.path === path || req.path.startsWith(path + '/')
    );
  },
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    const key = req.user?.userId || req.ip || 'unknown';
    const now = Date.now();
    const lastWarning = rateLimitWarnings.get(key) || 0;
    
    // Only log once per interval to avoid Railway log rate limit
    if (now - lastWarning > RATE_LIMIT_WARNING_INTERVAL) {
      console.warn(`⚠️ Rate limit exceeded for ${key}`);
      rateLimitWarnings.set(key, now);
    }
    
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Server is busy as 1000s of users are active right now. Please wait and if the issue persists, you can report it.',
      retryAfter: 60 // seconds
    });
  }
});

app.use(globalLimiter);
// Correlation IDs and safe logging context
app.use(createRequestLogger());

// JSON parser with strict size limits
const JSON_LIMIT = process.env.JSON_LIMIT || '512kb';
app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: JSON_LIMIT }));
// Sanitize all input bodies
app.use(sanitizeBody);
// CSRF protection for state-changing requests (opt-in via env)
app.use(verifyCsrf);
// Attach roles from env RBAC
app.use(attachRolesFromEnv);

// Dark Room state management (fallback to in-memory)
const darkRoomState = {
  roomMessages: {},
  roomUserCounts: {},
  roomMetadata: {},
  activeUsers: new Map()
};

// Socket.IO event handlers for Dark Room
io.use(async (socket, next) => {
  try {
    // 1) Authorization via Bearer token in header or auth payload
    const header = socket.handshake.headers?.authorization || '';
    const tokenFromHeader = header.startsWith('Bearer ') ? header.slice(7) : null;
    const tokenFromAuth = socket.handshake.auth?.token || null;
    const bearer = tokenFromHeader || tokenFromAuth || null;

    if (bearer) {
      try {
        // Verify our own JWT first
        const { default: jwt } = await import('jsonwebtoken');
        if (process.env.JWT_SECRET) {
          try {
            const decoded = jwt.verify(bearer, process.env.JWT_SECRET);
            socket.data.user = decoded;
            return next();
          } catch {}
        }
        // Fallback: verify Supabase JWT
        const { supabase } = await import('./config/supabase.js');
        const { data, error } = await supabase.auth.getUser(bearer);
        if (!error && data?.user) {
          socket.data.user = { id: data.user.id, email: data.user.email, provider: 'supabase' };
          return next();
        }
      } catch {}
    }

    // 2) Cookie-based (legacy)
    const cookie = socket.handshake.headers?.cookie || '';
    const hasAccess = /nxa_access=/.test(cookie || '');
    if (hasAccess) return next();

    // 3) Allow anonymous access for confessions and public features
    // Set anonymous user data
    socket.data.user = { id: 'anonymous', isAnonymous: true };
    return next();
  } catch (e) {
    // Allow connection even on error (for anonymous users)
    socket.data.user = { id: 'anonymous', isAnonymous: true };
    return next();
  }
});

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // Join user to their personal room for character-initiated messages
  const userId = socket.data?.user?.id;
  if (userId && userId !== 'anonymous') {
    socket.join(`user:${userId}`);
    console.log(`📱 User ${userId} joined personal room for character messages`);
  }

  // Listen for character initiative check
  socket.on('check-character-initiative', async (data) => {
    try {
      const { userId, characterId, userTimezone } = data;
      
      if (!userId || !characterId) {
        return socket.emit('initiative-check-error', { error: 'Missing userId or characterId' });
      }

      const InitiativeService = (await import('./services/initiativeService.js')).default;
      const result = await InitiativeService.checkForInitiative(userId, characterId, userTimezone || 'UTC');
      
      if (result.shouldSend) {
        socket.emit('character-initiative', {
          characterId,
          type: result.type,
          message: result.message || result.messages,
          hoursSince: result.hoursSince,
          timeType: result.timeType
        });
      }
    } catch (error) {
      console.error('Error checking character initiative:', error);
      socket.emit('initiative-check-error', { error: error.message });
    }
  });

  // Clear pending initiative messages
  socket.on('clear-pending-messages', async (data) => {
    try {
      const { userId, characterId } = data;
      const InitiativeService = (await import('./services/initiativeService.js')).default;
      await InitiativeService.clearPendingMessages(userId, characterId);
    } catch (error) {
      console.error('Error clearing pending messages:', error);
    }
  });

  // Join Dark Room
  socket.on('join-room', async (data) => {
    // Support legacy payloads where only groupId string was sent
    const groupId = typeof data === 'string' ? data : (data?.groupId || data?.roomId);
    const alias = typeof data === 'object' ? (data?.alias || 'Anonymous') : 'Anonymous';
    
    // Extract user info for tracking (while maintaining anonymous display)
    const userInfo = {
      user_name: data?.userName || data?.user_name || null,
      user_email: data?.userEmail || data?.user_email || null,
      user_id: data?.userId || data?.user_id || socket.handshake.auth?.userId || null
    };

    try {
      // Join the Socket.IO room
      socket.join(groupId);

      // Add user to database with tracking info
      await DarkroomService.addUserToRoom(groupId, socket.id, alias || 'Anonymous', userInfo);

      // Get actual Socket.IO user count (most accurate)
      const roomSockets = io.sockets.adapter.rooms.get(groupId);
      const socketCount = roomSockets ? roomSockets.size : 0;
      
      // Update user count in database with actual Socket.IO count
      const userCountResult = await DarkroomService.updateRoomUserCount(groupId, socketCount);

      // Get room history from database
      const messagesResult = await DarkroomService.getRoomMessages(groupId);
      if (messagesResult.success) {
        socket.emit('room-history', messagesResult.data);
      }

      // Send updated user count to all users in room
      io.to(groupId).emit('user-count-update', {
        roomId: groupId,
        count: socketCount
      });

      // Confirm successful room join to the client
      socket.emit('room-joined', {
        roomId: groupId,
        success: true,
        userCount: userCountResult.userCount || 0
      });

      console.log(`👥 User joined Dark Room: ${groupId} [${alias}] (${userCountResult.userCount || 0} users)`);
      if (userInfo.user_name || userInfo.user_email) {
        console.log(`   📋 Tracked user: ${userInfo.user_name || 'Unknown'} <${userInfo.user_email || 'no email'}>`);
      }
    } catch (error) {
      console.error('Error joining room:', error);

      // Send error confirmation to client
      socket.emit('room-joined', {
        roomId: groupId,
        success: false,
        error: error.message
      });
    }
  });

  // Request room history (for when component mounts and needs to ensure messages are loaded)
  socket.on('request-room-history', async (data) => {
    const { roomId } = data;

    try {
      console.log(`📚 Requesting room history for ${roomId}`);

      // Get room history from database
      const messagesResult = await DarkroomService.getRoomMessages(roomId);
      if (messagesResult.success) {
        socket.emit('room-history', messagesResult.data);
        console.log(`📚 Sent ${messagesResult.data.length} messages for room ${roomId}`);
      } else {
        console.error(`❌ Failed to get room history for ${roomId}:`, messagesResult.error);
      }
    } catch (error) {
      console.error('Error requesting room history:', error);
    }
  });

  // Send message in Dark Room
  socket.on('send-message', async (data) => {
    const { groupId, alias, message, time, userName, userEmail, userId, user_name, user_email, user_id } = data;
    
    if (typeof message !== 'string' || message.length > 2000) {
      return; // drop oversized
    }
    console.log(`📤 [Dark Room] Received message for room ${groupId}: ${alias}: ${message.substring(0, 50)}...`);
    
    const msg = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      room_id: groupId,
      alias,
      message,
      timestamp: time || new Date().toISOString(),
      // Track user info for moderation (not displayed publicly)
      user_name: userName || user_name || null,
      user_email: userEmail || user_email || null,
      user_id: userId || user_id || socket.handshake.auth?.userId || null
    };

    try {
      // Update user activity timestamp (for accurate member count)
      await DarkroomService.updateUserActivity(socket.id);
      
      // 🔧 FIX: Save message to Supabase database (critical for persistence)
      const saveResult = await DarkroomService.saveMessage(msg);
      
      if (saveResult.success) {
        console.log(`✅ [Dark Room] Message saved to database: ${msg.id}`);
        
        // Clean up old messages (keep only last 100)
        await DarkroomService.cleanupOldMessages(groupId);
        
        // 🔧 FIX: Broadcast via Socket.io for immediate delivery (Supabase Realtime will also broadcast)
        // This ensures sender sees their message immediately
        const roomSockets = io.sockets.adapter.rooms.get(groupId);
        const socketCount = roomSockets ? roomSockets.size : 0;

        if (socketCount === 0) {
          console.warn(`⚠️ No sockets found in room ${groupId}, message saved but not broadcasted live`);
        } else {
          console.log(`📡 Broadcasting to room ${groupId} (${socketCount} sockets)`);
          
          // Broadcast to all users in room (including sender)
          io.to(groupId).emit('receive-message', {
            id: msg.id,
            groupId: groupId,
            alias: alias,
            message: message,
            time: msg.timestamp,
            timestamp: Date.now()
          });

          console.log(`✅ [Dark Room] Message broadcasted to ${socketCount} recipients`);
        }
      } else {
        console.error('❌ [Dark Room] Failed to save message to database:', saveResult.error);
        // Still broadcast for immediate delivery even if save fails
        io.to(groupId).emit('receive-message', {
          id: msg.id,
          groupId: groupId,
          alias: alias,
          message: message,
          time: msg.timestamp,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('❌ [Dark Room] Error saving/broadcasting message:', error);
      // Ensure message is at least broadcasted even if save fails
      io.to(groupId).emit('receive-message', {
        id: msg.id,
        groupId: groupId,
        alias: alias,
        message: message,
        time: msg.timestamp,
        timestamp: Date.now()
      });
    }
  });

  // Create new Dark Room
  socket.on('create-room', async (data) => {
    const { roomId, roomName, createdBy, userName, userEmail, userId, user_name, user_email, user_id } = data;
    if (!roomName || String(roomName).length > 128) return;
    try {
      const roomData = {
        id: roomId,
        name: roomName,
        created_by: createdBy,
        user_count: 0,
        // Track creator info for moderation
        creator_user_name: userName || user_name || null,
        creator_user_email: userEmail || user_email || null,
        creator_user_id: userId || user_id || socket.handshake.auth?.userId || null
      };
      
      const result = await DarkroomService.createRoom(roomData);
      
      if (result.success) {
        socket.emit('room-created', result.data);
        console.log(`🏠 New Dark Room created: ${roomName} (${roomId}) by ${createdBy}`);
        if (roomData.creator_user_name || roomData.creator_user_email) {
          console.log(`   📋 Creator tracked: ${roomData.creator_user_name || 'Unknown'} <${roomData.creator_user_email || 'no email'}>`);
        }
      } else {
        console.error('Failed to create room:', result.error);
      }
    } catch (error) {
      console.error('Error creating room:', error);
    }
  });

  // Get room list
  socket.on('get-rooms', async () => {
    try {
      const result = await DarkroomService.getRooms();
      
      if (result.success) {
        socket.emit('room-list', result.data);
      } else {
        console.error('Failed to get rooms:', result.error);
        socket.emit('room-list', []);
      }
    } catch (error) {
      console.error('Error getting rooms:', error);
      socket.emit('room-list', []);
    }
  });

  // User typing indicator
  socket.on('typing-start', ({ groupId, alias }) => {
    socket.to(groupId).emit('user-typing', { groupId, alias, isTyping: true });
  });

  socket.on('typing-stop', ({ groupId, alias }) => {
    socket.to(groupId).emit('user-typing', { groupId, alias, isTyping: false });
  });

  // Confession real-time events
  socket.on('join-confession', (confessionId) => {
    try {
      if (!confessionId || typeof confessionId !== 'string') {
        console.warn('⚠️ Invalid confession ID for join:', confessionId);
        return;
      }

      socket.join(`confession-${confessionId}`);
      console.log(`👥 User joined confession room: confession-${confessionId}`);

      // Confirm successful join
      socket.emit('confession-joined', {
        confessionId,
        success: true
      });
    } catch (error) {
      console.error('❌ Error joining confession room:', error);
      socket.emit('confession-joined', {
        confessionId,
        success: false,
        error: error.message
      });
    }
  });

  socket.on('leave-confession', (confessionId) => {
    try {
      if (!confessionId || typeof confessionId !== 'string') {
        console.warn('⚠️ Invalid confession ID for leave:', confessionId);
        return;
      }

      socket.leave(`confession-${confessionId}`);
      console.log(`👥 User left confession room: confession-${confessionId}`);
    } catch (error) {
      console.error('❌ Error leaving confession room:', error);
    }
  });

  // ============================================
  // HANGOUT ROOMS - DISABLED - Coming Soon
  // ============================================

  /* HANGOUT SOCKET EVENTS DISABLED
  // Join a hangout room/palace
  socket.on('join-hangout-room', async (data) => {
    const { roomId, userId } = data;
    
    if (!roomId || !userId) {
      return socket.emit('error', { message: 'roomId and userId are required' });
    }

    try {
      // Join the Socket.io room
      socket.join(`hangout-${roomId}`);
      
      // Add participant to database
      await HangoutRoomsService.addParticipant(roomId, userId, socket.id);
      
      // Update member count in database
      const memberCountResult = await HangoutRoomsService.updateRoomMemberCount(roomId);
      
      // Get room message history (last 100 messages)
      const messagesResult = await HangoutRoomsService.getRoomMessages(roomId, 100);
      if (messagesResult.success) {
        socket.emit('hangout-room-history', messagesResult.data);
      }
      
      // Notify all users in room about updated member count
      io.to(`hangout-${roomId}`).emit('hangout-member-count-update', {
        roomId,
        count: memberCountResult.memberCount || 0
      });
      
      console.log(`🏰 User ${userId} joined Hangout Room: ${roomId} (${memberCountResult.memberCount || 0} members)`);
    } catch (error) {
      console.error('❌ Error joining hangout room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave a hangout room/palace
  socket.on('leave-hangout-room', async (data) => {
    const { roomId, userId } = data;
    
    if (!roomId || !userId) {
      return;
    }

    try {
      // Leave the Socket.io room
      socket.leave(`hangout-${roomId}`);
      
      // Remove participant from database
      await HangoutRoomsService.removeParticipant(roomId, userId);
      
      // Update member count
      const memberCountResult = await HangoutRoomsService.updateRoomMemberCount(roomId);
      
      // Notify remaining users
      io.to(`hangout-${roomId}`).emit('hangout-member-count-update', {
        roomId,
        count: memberCountResult.memberCount || 0
      });
      
      console.log(`🏰 User ${userId} left Hangout Room: ${roomId}`);
    } catch (error) {
      console.error('❌ Error leaving hangout room:', error);
    }
  });

  // Send message in hangout room (with <2 sec delivery for 10k users)
  socket.on('send-hangout-message', async (data) => {
    const { roomId, userId, content, userName, bubbleSkin, attachments, replyTo } = data;
    
    // Validate message
    if (!roomId || !userId || !content) {
      return socket.emit('error', { message: 'Invalid message data' });
    }
    
    if (typeof content !== 'string' || content.length > 5000) {
      return socket.emit('error', { message: 'Message too long (max 5000 chars)' });
    }

    try {
      // If replying to a message, fetch the original message for full context
      let replyToMessage = null;
      if (replyTo) {
        try {
          const { data: originalMsg, error } = await supabase
            .from('hangout_messages')
            .select('*')
            .eq('id', replyTo)
            .single();
          
          if (!error && originalMsg) {
            replyToMessage = {
              id: originalMsg.id,
              message: originalMsg.message,
              senderId: originalMsg.sender_id,
              senderUsername: originalMsg.sender_username,
              timestamp: originalMsg.created_at
            };
          }
        } catch (error) {
          console.error('❌ Failed to fetch replied message:', error);
        }
      }

      const messageData = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        hangout_id: roomId,
        sender_id: userId,
        sender_username: userName || 'Anonymous',
        message: content.trim(),
        created_at: new Date().toISOString()
      };

      // Save message to database (for persistence)
      console.log('💾 Saving message to database:', messageData.id);
      const saveResult = await HangoutRoomsService.saveMessage({
        messageId: messageData.id,
        hangoutId: messageData.hangout_id,
        userId: messageData.sender_id,
        content: messageData.message,
        senderUsername: messageData.sender_username
      });

      if (saveResult.success) {
        console.log('✅ Message saved to database successfully:', messageData.id);

        // Increment unread count for other participants
        try {
          await HangoutRoomsService.incrementUnreadCount(roomId, userId);
          console.log('✅ Updated unread count for room:', roomId);
        } catch (error) {
          console.error('❌ Failed to update unread count:', error);
        }

        // Clean up old messages periodically (keep last 500)
        if (Math.random() < 0.1) { // 10% chance to trigger cleanup
          try {
            await HangoutRoomsService.cleanupOldMessages(roomId);
            console.log('✅ Cleaned up old messages for room:', roomId);
          } catch (error) {
            console.error('❌ Failed to cleanup old messages:', error);
          }
        }
      } else {
        console.error('❌ Failed to save hangout message:', saveResult.error);
        // Still broadcast the message even if save failed (for real-time delivery)
      }

      // Broadcast message INSTANTLY to all users in room (including sender)
      // This ensures <2 sec delivery for 10k users
      const broadcastMessage = {
        id: messageData.id,
        roomId,
        userId,
        userName: userName || 'Anonymous',
        content: content.trim(),
        timestamp: messageData.created_at,
        isEdited: false,
        replyTo: replyTo || null,
        replyToMessage: replyToMessage,
        bubbleSkin: bubbleSkin || 'liquid',
        attachments: attachments || []
      };

      io.to(`hangout-${roomId}`).emit('receive-hangout-message', broadcastMessage);
      
      console.log(`📨 Message sent in Hangout Room ${roomId} by ${userName || userId} with skin: ${bubbleSkin}`);
    } catch (error) {
      console.error('❌ Error sending hangout message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator for hangout rooms
  socket.on('hangout-typing-start', ({ roomId, userId, userName }) => {
    socket.to(`hangout-${roomId}`).emit('hangout-user-typing', { 
      roomId, 
      userId, 
      userName,
      isTyping: true 
    });
  });

  socket.on('hangout-typing-stop', ({ roomId, userId }) => {
    socket.to(`hangout-${roomId}`).emit('hangout-user-typing', { 
      roomId, 
      userId,
      isTyping: false 
    });
  });

  // Mark messages as read
  socket.on('hangout-mark-read', async ({ roomId, userId, messageId }) => {
    try {
      await HangoutRoomsService.updateLastRead(roomId, userId, messageId);
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  });
  END OF HANGOUT SOCKET EVENTS DISABLED */

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('🔌 Client disconnected:', socket.id);
    
    try {
      // Remove user from database
      const removeResult = await DarkroomService.removeUserFromRoom(socket.id);
      
      if (removeResult.success) {
        // Update user counts for all rooms the user was in
        const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
        
        for (const roomId of rooms) {
          // Get actual Socket.IO user count
          const roomSockets = io.sockets.adapter.rooms.get(roomId);
          const socketCount = roomSockets ? roomSockets.size : 0;
          
          // Update user count in database
          await DarkroomService.updateRoomUserCount(roomId, socketCount);
          
          // Notify remaining users
          io.to(roomId).emit('user-count-update', {
            roomId,
            count: socketCount
          });
        }
      }
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  });
});

// ============================================
// DARK ROOM CLEANUP - Periodic inactive user cleanup
// ============================================

// Clean up inactive users every 1 minute (for accurate member counts)
setInterval(async () => {
  try {
    console.log('🧹 [Dark Room] Running periodic cleanup of inactive users...');
    const result = await DarkroomService.cleanupInactiveUsers();
    
    if (result.success && result.cleaned > 0) {
      console.log(`🧹 [Dark Room] Cleaned up ${result.cleaned} inactive users`);
    }
    
    // Always update user counts for all active rooms (even if no cleanup happened)
    const roomsResult = await DarkroomService.getRooms();
    if (roomsResult.success) {
      for (const room of roomsResult.data) {
        // Get actual Socket.IO user count (most accurate)
        const roomSockets = io.sockets.adapter.rooms.get(room.id);
        const socketCount = roomSockets ? roomSockets.size : 0;
        
        // Update database with accurate count
        await DarkroomService.updateRoomUserCount(room.id, socketCount);
        
        // Broadcast updated counts to all connected clients
        io.emit('user-count-update', {
          roomId: room.id,
          count: socketCount
        });
      }
    }
  } catch (error) {
    console.error('❌ [Dark Room] Error in periodic cleanup:', error);
  }
}, 60 * 1000); // 1 minute (for accurate member counts)

// ============================================
// SUPABASE REALTIME - Cross-Server Message Sync (for horizontal scaling)
// ============================================
// When you have multiple server instances, Supabase Realtime ensures
// messages are synced across all servers instantly

/* HANGOUT SUPABASE REALTIME DISABLED - Coming Soon
const setupSupabaseRealtime = async () => {
  try {
    // Subscribe to hangout messages for real-time cross-server sync
    const messageChannel = supabase
      .channel('hangout-messages-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hangout_messages'
        },
        (payload) => {
          const message = payload.new;
          
          // Broadcast to all Socket.io clients in the hangout across all servers
          // (Redis adapter handles cross-server communication)
          io.to(`hangout-${message.hangout_id}`).emit('receive-hangout-message', {
            id: message.id,
            roomId: message.hangout_id,
            userId: message.sender_id,
            userName: message.sender_username,
            content: message.message,
            timestamp: message.created_at
          });
          
          console.log(`📡 Supabase Realtime: Message synced to hangout ${message.hangout_id}`);
        }
      )
      .subscribe();

    // Subscribe to hangout member updates
    const participantChannel = supabase
      .channel('hangout-members-sync')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'hangout_members'
        },
        async (payload) => {
          const member = payload.new || payload.old;
          
          if (member && member.hangout_id) {
            // Update member count
            const result = await HangoutRoomsService.updateRoomMemberCount(member.hangout_id);
            
            // Broadcast updated count
            io.to(`hangout-${member.hangout_id}`).emit('hangout-member-count-update', {
              roomId: member.hangout_id,
              count: result.memberCount || 0
            });
          }
        }
      )
      .subscribe();

    console.log('✅ Supabase Realtime subscriptions active for Hangout Rooms');
  } catch (error) {
    console.error('❌ Failed to setup Supabase Realtime:', error);
  }
};
END OF HANGOUT SUPABASE REALTIME DISABLED */

// 🔧 FIX: Setup Supabase Realtime for Dark Room Messages
const setupDarkroomRealtime = async () => {
  try {
    console.log('🔄 Setting up Supabase Realtime for Dark Room...');
    
    // Subscribe to darkroom_messages table changes
    const darkroomChannel = supabase
      .channel('darkroom-messages-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'darkroom_messages'
        },
        (payload) => {
          const message = payload.new;
          console.log(`📡 [Supabase Realtime] New Dark Room message in room ${message.room_id}`);
          
          // Broadcast to all Socket.io clients in the room
          io.to(message.room_id).emit('receive-message', {
            id: message.id,
            groupId: message.room_id,
            alias: message.alias,
            message: message.message,
            time: message.timestamp,
            timestamp: new Date(message.timestamp).getTime()
          });
          
          console.log(`✅ [Supabase Realtime] Message synced to room ${message.room_id}`);
        }
      )
      .subscribe();

    // Subscribe to darkroom_rooms table changes (for room creation/deletion)
    const darkroomRoomsChannel = supabase
      .channel('darkroom-rooms-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'darkroom_rooms'
        },
        (payload) => {
          const room = payload.new || payload.old;
          console.log(`📡 [Supabase Realtime] Dark Room change:`, payload.eventType, room.id);
          
          if (payload.eventType === 'INSERT') {
            // Broadcast new room to all clients
            io.emit('room-created', {
              id: room.id,
              name: room.name,
              description: room.description,
              createdBy: room.created_by,
              userCount: room.user_count
            });
          } else if (payload.eventType === 'DELETE') {
            // Broadcast room deletion
            io.emit('room-deleted', {
              id: room.id
            });
          }
        }
      )
      .subscribe();

    console.log('✅ Supabase Realtime subscriptions active for Dark Room');
  } catch (error) {
    console.error('❌ Failed to setup Dark Room Realtime:', error);
  }
};

// Initialize Realtime after server starts
// setupSupabaseRealtime(); // DISABLED - Hangout Coming Soon
setupDarkroomRealtime();

/* HANGOUT PERIODIC CLEANUP DISABLED - Coming Soon
// Periodic cleanup of inactive participants (every 5 minutes)
setInterval(async () => {
  try {
    const result = await HangoutRoomsService.cleanupInactiveParticipants();
    if (result.success && result.cleaned > 0) {
      console.log(`🧹 Cleaned up ${result.cleaned} inactive hangout participants`);
    }
  } catch (error) {
    console.error('❌ Error in periodic cleanup:', error);
  }
}, 5 * 60 * 1000); // 5 minutes
END OF HANGOUT PERIODIC CLEANUP DISABLED */

// Use Express built-in middleware instead of deprecated bodyParser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Remove duplicate permissive CORS block

// Health check endpoint - moved from "/" to "/health" to allow static files at root
// This allows the React app to be served at the root URL
app.get("/health", (req, res) => {
  res.json({ 
    message: "Companion Backend Server", 
    status: "running",
    timestamp: new Date().toISOString(),
    darkRoom: {
      activeRooms: Object.keys(darkRoomState.roomUserCounts).length,
      totalUsers: Object.values(darkRoomState.roomUserCounts).reduce((a, b) => a + b, 0)
    }
  });
});

// Health probe to verify Supabase connectivity
app.get('/api/health', async (_req, res) => {
  try {
    const mod = await import('./config/supabase.js');
    const supabaseClient = mod.supabase;
    const { data, error } = await supabaseClient
      .from('userProfileData')
      .select('id')
      .limit(1);
    return res.json({ ok: true, supabase: !error, rowsSampled: Array.isArray(data) ? data.length : 0 });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// CSRF token endpoint for frontend API calls
app.get('/api/auth/csrf', (req, res) => {
  // Generate a simple CSRF token (in production, use a proper token generation)
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // Set the token as an httpOnly cookie
  res.cookie('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.json({ success: true, token });
});

// Dark Room API endpoints
app.get("/api/v1/darkroom/rooms", async (req, res) => {
  try {
    // First try to get rooms from Supabase
    const { DarkroomService } = await import('./services/darkroomService.js');
    const result = await DarkroomService.getRooms();

    if (result.success && result.data) {
      console.log(`📋 [Dark Room] Retrieved ${result.data.length} rooms from database`);

      // Convert database format to frontend format
      const rooms = result.data.map(room => ({
        id: room.id,
        name: room.name || `Group ${room.id}`,
        description: room.description || 'Anonymous group',
        members: room.user_count || 0,
        messages: [],
        createdBy: room.created_by || 'system',
        createdAt: room.created_at,
        isDeleted: false
      }));

      res.json(rooms);
    } else {
      console.warn('⚠️ [Dark Room] Database query failed, falling back to memory');
      // Fallback to in-memory storage if database fails
      const rooms = Object.values(darkRoomState.roomMetadata || {}).map(room => ({
        ...room,
        userCount: darkRoomState.roomUserCounts?.[room.id] || 0
      }));

      res.json(rooms);
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
    // Fallback to in-memory storage
    const rooms = Object.values(darkRoomState.roomMetadata || {}).map(room => ({
      ...room,
      userCount: darkRoomState.roomUserCounts?.[room.id] || 0
    }));

    res.json(rooms);
  }
});

app.get("/api/v1/darkroom/rooms/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    
    console.log(`📨 [Dark Room] Fetching room details for ${roomId}`);
    
    // Fetch from database first
    const { data: room, error } = await supabase
      .from('darkroom_rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (error || !room) {
      console.error(`❌ [Dark Room] Room ${roomId} not found in database:`, error);
      return res.status(404).json({ error: "Room not found" });
    }
    
    // Get active user count from the room_users table
    const { data: activeUsers } = await supabase
      .from('darkroom_room_users')
      .select('user_id')
      .eq('room_id', roomId)
      .eq('is_active', true);
    
    const userCount = activeUsers?.length || 0;
    
    console.log(`✅ [Dark Room] Found room ${roomId} with ${userCount} active users`);
    
    res.json({
      id: room.id,
      name: room.name,
      description: room.description,
      created_by: room.created_by,
      created_at: room.created_at,
      user_count: userCount,
      is_active: room.is_active
    });
  } catch (error) {
    console.error('❌ [Dark Room] Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Get messages for a specific Dark Room (with database persistence)
app.get("/api/v1/darkroom/rooms/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Cap at 100 for performance
    const offset = Math.max(parseInt(req.query.offset) || 0, 0); // Ensure non-negative offset

    console.log(`📨 [Dark Room] Fetching messages for room ${roomId}, limit: ${limit}, offset: ${offset}`);

    // Validate roomId
    if (!roomId || typeof roomId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID provided'
      });
    }

    // First try to get messages from database (Supabase)
    try {
      const { DarkroomService } = await import('./services/darkroomService.js');
      const result = await DarkroomService.getRoomMessages(roomId, limit);

      if (result.success && result.data && Array.isArray(result.data)) {
        console.log(`✅ [Dark Room] Retrieved ${result.data.length} messages from database for room ${roomId}`);
        
        // Convert database format to frontend format
        const messages = result.data.map(msg => ({
          id: msg.id,
          alias: msg.alias || 'Anonymous',
          message: msg.message || '',
          time: msg.timestamp || msg.time || new Date().toISOString(),
          roomId: msg.room_id || roomId
        }));

        return res.json({
          success: true,
          messages,
          total: messages.length,
          hasMore: messages.length === limit
        });
      }
    } catch (dbError) {
      console.warn('⚠️ [Dark Room] Database fetch failed, falling back to in-memory storage:', dbError.message);
    }

    // Fallback to in-memory storage if database fails
    const inMemoryMessages = darkRoomState.roomMessages?.[roomId] || [];
    const paginatedMessages = inMemoryMessages.slice(offset, offset + limit);

    console.log(`📨 [Dark Room] Retrieved ${paginatedMessages.length} messages from in-memory storage for room ${roomId}`);

    res.json({
      success: true,
      messages: paginatedMessages,
      total: inMemoryMessages.length,
      hasMore: (offset + limit) < inMemoryMessages.length
    });

  } catch (error) {
    console.error('❌ [Dark Room] Error fetching room messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room messages',
      error: error.message
    });
  }
});

// Debug endpoint to test message delivery
app.post("/api/v1/darkroom/debug/test-message", (req, res) => {
  const { roomId, alias, message } = req.body;
  
  if (!roomId || !alias || !message) {
    return res.status(400).json({ error: "Missing required fields: roomId, alias, message" });
  }
  
  const msg = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    groupId: roomId,
    alias,
    message,
    time: new Date().toISOString(),
    timestamp: Date.now()
  };
  
  // Store message in room history
  if (!darkRoomState.roomMessages[roomId]) {
    darkRoomState.roomMessages[roomId] = [];
  }
  darkRoomState.roomMessages[roomId].push(msg);
  
  // Broadcast message to all users in room
  io.in(roomId).emit('receive-message', msg);
  
  console.log(`🧪 Debug message sent to room ${roomId}: ${alias}: ${message}`);
  
  res.json({ 
    success: true, 
    message: "Test message sent",
    roomId,
    socketCount: io.sockets.adapter.rooms.get(roomId)?.size || 0
  });
});

// Debug endpoint to get room status
app.get("/api/v1/darkroom/debug/room-status/:roomId", (req, res) => {
  const { roomId } = req.params;

  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  const socketCount = roomSockets ? roomSockets.size : 0;

  res.json({
    roomId,
    exists: !!darkRoomState.roomMetadata[roomId],
    userCount: darkRoomState.roomUserCounts[roomId] || 0,
    socketCount,
    messageCount: darkRoomState.roomMessages[roomId]?.length || 0,
    metadata: darkRoomState.roomMetadata[roomId] || null,
    messages: darkRoomState.roomMessages[roomId] || [],
    socketsInRoom: roomSockets ? Array.from(roomSockets) : []
  });
});

// Debug endpoint to broadcast a test message to a room
app.post("/api/v1/darkroom/debug/broadcast-test/:roomId", (req, res) => {
  const { roomId } = req.params;
  const { alias = "System", message = "Test message from debug endpoint" } = req.body;

  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  const socketCount = roomSockets ? roomSockets.size : 0;

  if (socketCount === 0) {
    return res.status(404).json({
      error: "No users in room",
      roomId,
      socketCount: 0
    });
  }

  const testMessage = {
    id: `test-${Date.now()}`,
    groupId: roomId,
    alias,
    message,
    time: new Date().toISOString(),
    timestamp: Date.now(),
    isTest: true
  };

  // Broadcast test message
  io.to(roomId).emit('receive-message', testMessage);

  console.log(`🧪 Test message broadcasted to room ${roomId} (${socketCount} recipients)`);

  res.json({
    success: true,
    message: "Test message broadcasted",
    roomId,
    socketCount,
    testMessage
  });
});

// Clear all dark room data (for testing/development)
app.post("/api/v1/darkroom/clear-all", async (req, res) => {
  try {
    // Clear in-memory storage
    darkRoomState.roomMetadata = {};
    darkRoomState.roomUserCounts = {};
    darkRoomState.roomMessages = {};

    // Try to clear Supabase data if available
    try {
      const { DarkroomService } = await import('./services/darkroomService.js');

      // Delete all rooms and their messages (cascade delete will handle messages)
      const { error: roomsError } = await supabase
        .from('darkroom_rooms')
        .delete()
        .neq('id', ''); // Delete all rooms

      if (roomsError) {
        console.warn('⚠️ Failed to clear Supabase rooms:', roomsError.message);
      } else {
        console.log('✅ Cleared all dark room data from Supabase');
      }

      // Also clear room users
      const { error: usersError } = await supabase
        .from('darkroom_room_users')
        .delete()
        .neq('id', ''); // Delete all room users

      if (usersError) {
        console.warn('⚠️ Failed to clear Supabase room users:', usersError.message);
      }

    } catch (dbError) {
      console.warn('⚠️ Supabase not available for clearing data:', dbError.message);
    }

    console.log('🗑️ Cleared all dark room data');
    res.json({ success: true, message: 'All dark room data cleared' });
  } catch (error) {
    console.error('Error clearing dark room data:', error);
    res.status(500).json({ error: 'Failed to clear dark room data' });
  }
});

// Reset dark room IDs to start from 1
app.post("/api/v1/darkroom/reset-ids", async (req, res) => {
  try {
    // Clear all existing data first
    darkRoomState.roomMetadata = {};
    darkRoomState.roomUserCounts = {};
    darkRoomState.roomMessages = {};

    // Try to clear Supabase data if available
    try {
      const { DarkroomService } = await import('./services/darkroomService.js');

      // Delete all rooms and their messages (cascade delete will handle messages)
      const { error: roomsError } = await supabase
        .from('darkroom_rooms')
        .delete()
        .neq('id', ''); // Delete all rooms

      if (roomsError) {
        console.warn('⚠️ Failed to clear Supabase rooms:', roomsError.message);
      } else {
        console.log('✅ Cleared all dark room data from Supabase for ID reset');
      }

    } catch (dbError) {
      console.warn('⚠️ Supabase not available for clearing data:', dbError.message);
    }

    console.log('🔄 Reset dark room IDs - next room will be ren-1');
    res.json({ success: true, message: 'Dark room IDs reset to start from 1' });
  } catch (error) {
    console.error('Error resetting dark room IDs:', error);
    res.status(500).json({ error: 'Failed to reset dark room IDs' });
  }
});

// Create new group chat with automatic categorization
app.post("/api/v1/darkroom/create-group", async (req, res) => {
  const { name, description, tags = [], createdBy, userName, userEmail, userId, user_name, user_email, user_id } = req.body;

  if (!name || !createdBy) {
    return res.status(400).json({ error: "Missing required fields: name, createdBy" });
  }

  try {
    // 🔧 FIX: Query Supabase database to get the actual max ID (prevents reset on server restart)
    const { DarkroomService } = await import('./services/darkroomService.js');
    let maxNumber = 0;
    
    try {
      // Get all rooms from database to find the highest ID
      const roomsResult = await DarkroomService.getRooms();
      if (roomsResult.success && roomsResult.data) {
        const existingRooms = roomsResult.data.filter(room => room.id.startsWith('ren-'));
        if (existingRooms.length > 0) {
          maxNumber = Math.max(...existingRooms.map(room => {
            const num = parseInt(room.id.split('ren-')[1]);
            return isNaN(num) ? 0 : num;
          }));
        }
      }
      console.log(`🔍 [Dark Room] Found max room ID from database: ren-${maxNumber}`);
    } catch (dbError) {
      console.warn('⚠️ [Dark Room] Failed to query database for max ID, falling back to memory:', dbError.message);
      // Fallback to in-memory check
      const existingRooms = Object.values(darkRoomState.roomMetadata || {}).filter(room => room.id.startsWith('ren-'));
      if (existingRooms.length > 0) {
        maxNumber = Math.max(...existingRooms.map(room => parseInt(room.id.split('ren-')[1]) || 0));
      }
    }
    
    const roomId = `ren-${maxNumber + 1}`;
    console.log(`🆕 [Dark Room] Creating new room with ID: ${roomId}`);

    // Automatically categorize the group chat
    const categories = categorizeGroupChat(name, description, tags);
    const primaryCategory = categories.length > 0 ? categories[0] : null;

    // Create room metadata for Supabase
    const roomData = {
      id: roomId,
      name,
      description: description || `Welcome to ${name}!`,
      created_by: createdBy,
      user_count: 0,
      categories: categories.map(cat => cat.id),
      primary_category: primaryCategory?.id || 'community',
      is_active: true,
      // Track creator info for moderation
      creator_user_name: userName || user_name || null,
      creator_user_email: userEmail || user_email || null,
      creator_user_id: userId || user_id || req.user?.id || null
    };

    // Save to Supabase first
    const result = await DarkroomService.createRoom(roomData);

    if (result.success) {
      console.log(`✅ [Dark Room] Created room in database: ${roomId} (${name})`);
      
      // Broadcast room creation event to all connected clients
      io.emit('room-created', {
        id: roomId,
        name,
        description: description || `Welcome to ${name}!`,
        createdBy,
        userCount: 0
      });

      // Also store in memory for immediate access
      const roomMetadata = {
        id: roomId,
        name,
        description: description || `Welcome to ${name}!`,
        createdBy,
        createdAt: new Date().toISOString(),
        userCount: 0,
        categories: categories.map(cat => cat.id),
        primaryCategory: primaryCategory?.id || 'community',
        iconEmoji: primaryCategory ? getCategoryIcon(primaryCategory.id) : '💬',
        banner: primaryCategory ? getCategoryColor(primaryCategory.id) : 'linear-gradient(135deg,#1f2937 0%,#0b0f19 100%)',
        tags: tags
      };

      // Store room metadata
      darkRoomState.roomMetadata[roomId] = roomMetadata;
      darkRoomState.roomUserCounts[roomId] = 0;
      darkRoomState.roomMessages[roomId] = [];

      console.log(`🏗️ Created new group chat: ${name} (${roomId})`);
      console.log(`📂 Categories: ${categories.map(cat => cat.name).join(', ')}`);

      res.json({
        success: true,
        room: roomMetadata,
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          description: cat.description
        }))
      });
    } else {
      throw new Error(result.error || 'Failed to create room in database');
    }
  } catch (error) {
    console.error('Error creating room:', error);

    // Fallback to in-memory storage if database fails
    const existingRooms = Object.values(darkRoomState.roomMetadata || {}).filter(room => room.id.startsWith('ren-'));
    const maxNumber = existingRooms.length > 0
      ? Math.max(...existingRooms.map(room => parseInt(room.id.split('ren-')[1]) || 0))
      : 0;
    const roomId = `ren-${maxNumber + 1}`;
    const categories = categorizeGroupChat(name, description, tags);
    const primaryCategory = categories.length > 0 ? categories[0] : null;

    const roomMetadata = {
      id: roomId,
      name,
      description: description || `Welcome to ${name}!`,
      createdBy,
      createdAt: new Date().toISOString(),
      userCount: 0,
      categories: categories.map(cat => cat.id),
      primaryCategory: primaryCategory?.id || 'community',
      iconEmoji: primaryCategory ? getCategoryIcon(primaryCategory.id) : '💬',
      banner: primaryCategory ? getCategoryColor(primaryCategory.id) : 'linear-gradient(135deg,#1f2937 0%,#0b0f19 100%)',
      tags: tags
    };

    // Store room metadata
    darkRoomState.roomMetadata[roomId] = roomMetadata;
    darkRoomState.roomUserCounts[roomId] = 0;
    darkRoomState.roomMessages[roomId] = [];

    console.log(`🏗️ Created new group chat (memory fallback): ${name} (${roomId})`);
    console.log(`📂 Categories: ${categories.map(cat => cat.name).join(', ')}`);

    res.json({
      success: true,
      room: roomMetadata,
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        description: cat.description
      }))
    });
  }
});

// Get categorized group chats
app.get("/api/v1/darkroom/categories", (req, res) => {
  const { category } = req.query;
  
  let rooms = Object.values(darkRoomState.roomMetadata).map(room => ({
    ...room,
    userCount: darkRoomState.roomUserCounts[room.id] || 0
  }));
  
  // Filter by category if specified
  if (category) {
    rooms = rooms.filter(room => 
      room.categories && room.categories.includes(category)
    );
  }
  
  // Group by category
  const categorizedRooms = {};
  rooms.forEach(room => {
    if (room.categories && room.categories.length > 0) {
      room.categories.forEach(catId => {
        if (!categorizedRooms[catId]) {
          categorizedRooms[catId] = [];
        }
        categorizedRooms[catId].push(room);
      });
    }
  });
  
  res.json({
    categories: categorizedRooms,
    totalRooms: rooms.length
  });
});

// API routes
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/mfa", mfaRouter);
app.use("/api/v1/chat/models", modelRouter);
app.use("/api/v1/chat/ai", chatAiRouter);
app.use("/api/v1/chat/", profileRouter);
app.use("/api/v1/character", characterRouter);
app.use("/api/v1/announcements", announcementsRouter);
app.use("/api/v1/progress", progressRouter);
app.use("/api/v1/views", viewsRouter);
app.use("/api/confessions", confessionsRouter);
// app.use("/api/hangout", hangoutRouter); // DISABLED - Coming Soon
app.use("/api/nexus-chats", nexusChatsRouter);
app.use("/api/v1/chat/companion", companionChatRouter);

// Validate Venice environment on startup
import { validateEnvironmentOnStartup } from './utils/environmentCheck.js';
if (process.env.NODE_ENV !== 'test') {
  validateEnvironmentOnStartup();
}

// TEMPORARY: Debug endpoint to check Railway env vars
app.get('/debug-railway-env', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    node_version: process.version,
    node_env: process.env.NODE_ENV || 'NOT SET',
    has_venice_key: !!process.env.VENICE_API_KEY,
    venice_key_length: process.env.VENICE_API_KEY?.length || 0,
    venice_key_first_8: process.env.VENICE_API_KEY?.substring(0, 8) || 'MISSING',
    venice_key_last_4: process.env.VENICE_API_KEY?.substring(process.env.VENICE_API_KEY.length - 4) || 'MISSING',
    all_venice_vars: Object.keys(process.env).filter(k => k.includes('VENICE')),
    railway_env: process.env.RAILWAY_ENVIRONMENT || 'NOT SET',
    railway_service: process.env.RAILWAY_SERVICE_NAME || 'NOT SET',
    all_env_count: Object.keys(process.env).length,
    cwd: process.cwd(),
    startup_check_passed: !!process.env.VENICE_API_KEY && process.env.VENICE_API_KEY.length > 20
  });
});
app.use("/api/v1/chat/companion/context", companionContextRouter);
app.use("/api/v1/quests", questsRouter);
app.use("/api/v1/affection", affectionRouter);

// Serve static files from React build (for production Railway deployment)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');

console.log('📁 Client dist path:', clientDistPath);

// Serve static assets (JS, CSS, images, etc.) - BEFORE error handlers
app.use(express.static(clientDistPath, {
  maxAge: '1d',
  setHeaders: (res, filepath) => {
    // Set correct MIME types
    if (filepath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filepath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
  fallthrough: true // Allow other middleware to run if file not found
}));

// Error handling middleware (4 parameters - only catches errors)
app.use((err, req, res, next) => {
  logError(err, req);
  try { captureError(err, req); } catch {}
  res.status(500).json({ 
    error: "Something went wrong!",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Smart 404 handler - serves index.html for non-API routes, JSON for API routes
app.use((req, res) => {
  // API routes get JSON 404 response
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: "Route not found" });
  }
  
  // All other routes serve index.html for React Router (SPA fallback)
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      console.error('Tried to serve from:', indexPath);
      res.status(404).send('Frontend not found. Build may have failed.');
    }
  });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  server.listen(port, host, () => {
    console.log(`🚀 Server is running on http://localhost:${port} (listening on ${host})`);
    console.log(`🌐 Network access available on http://[YOUR_IP]:${port}`);
    console.log(`🔌 Socket.IO server ready for Dark Room connections`);
    console.log(`📅 Started at: ${new Date().toISOString()}`);
  });
}

// Export for tests and other modules
export { app, server, io };