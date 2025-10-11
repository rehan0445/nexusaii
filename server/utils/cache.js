/**
 * Simple In-Memory Cache for High-Traffic Endpoints
 * Reduces database load for frequently accessed data
 */

class SimpleCache {
  constructor(maxSize = 1000, ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl; // Time to live in milliseconds
  }

  set(key, value, customTTL = null) {
    const expiresAt = Date.now() + (customTTL || this.ttl);
    
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Export pre-configured cache instances
export const userProfileCache = new SimpleCache(10000, 5 * 60 * 1000); // 10k users, 5 min TTL
export const characterCache = new SimpleCache(5000, 10 * 60 * 1000); // 5k characters, 10 min TTL
export const roomCache = new SimpleCache(1000, 2 * 60 * 1000); // 1k rooms, 2 min TTL

// Periodic cleanup (every 5 minutes)
setInterval(() => {
  userProfileCache.cleanup();
  characterCache.cleanup();
  roomCache.cleanup();
}, 5 * 60 * 1000);

export default SimpleCache;

