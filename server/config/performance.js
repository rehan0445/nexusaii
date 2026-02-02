/**
 * Performance Configuration for 10k+ Concurrent Users
 * Database pooling, caching, and rate limiting
 */

// Database Connection Pool Settings
export const DB_POOL_CONFIG = {
  // Supabase handles connection pooling automatically
  // But we can configure client-side pooling for better performance
  max: 100, // Maximum number of clients in the pool
  min: 10, // Minimum number of clients
  idle: 10000, // How long a client is allowed to remain idle before being closed
  acquireTimeoutMillis: 30000, // Maximum time to wait for a connection
  createTimeoutMillis: 30000, // Maximum time to wait creating a new connection
  destroyTimeoutMillis: 5000, // Maximum time to wait destroying a connection
  propagateCreateError: false, // Do not propagate connection errors
};

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  // Global rate limit (per IP)
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Auth endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 50, // 50 requests per 15 minutes
    message: 'Too many authentication attempts, please try again later',
  },
  
  // API endpoints (moderate)
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Rate limit exceeded, please slow down',
  },
  
  // Public endpoints (lenient)
  public: {
    windowMs: 1 * 60 * 1000,
    max: 300, // 300 requests per minute
    message: 'Rate limit exceeded',
  },
};

// Caching Configuration
export const CACHE_CONFIG = {
  // In-memory cache TTL (Time To Live)
  userProfile: 5 * 60 * 1000, // 5 minutes
  characters: 10 * 60 * 1000, // 10 minutes
  rooms: 2 * 60 * 1000, // 2 minutes
  messages: 1 * 60 * 1000, // 1 minute
  
  // Cache sizes (number of items)
  maxUserProfiles: 10000,
  maxCharacters: 5000,
  maxRooms: 1000,
  maxMessages: 50000,
};

// Performance Monitoring Thresholds
export const PERFORMANCE_THRESHOLDS = {
  slowQueryMs: 1000, // Log queries taking longer than 1 second
  highMemoryMB: 1024, // Alert if memory usage exceeds 1GB
  highCpuPercent: 80, // Alert if CPU usage exceeds 80%
  maxConcurrentConnections: 10000, // Maximum concurrent socket connections
};

// Compression Settings
export const COMPRESSION_CONFIG = {
  level: 6, // Compression level (0-9, higher = more compression)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress for WebSocket upgrade requests
    if (req.headers['upgrade']) return false;
    // Use compression middleware's default filter
    return true;
  },
};

export default {
  DB_POOL_CONFIG,
  RATE_LIMIT_CONFIG,
  CACHE_CONFIG,
  PERFORMANCE_THRESHOLDS,
  COMPRESSION_CONFIG,
};

