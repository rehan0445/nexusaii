/**
 * Message Persistence Service
 * Handles loading, caching, and persisting chat messages for room re-entry and page refresh
 */

interface Message {
  id: string;
  roomId: string;
  content: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  isEdited?: boolean;
  replyTo?: string;
  reactions?: Record<string, number>;
}

interface CachedRoom {
  messages: Message[];
  lastUpdated: number;
  messageCount: number;
}

// Import configuration
import { API_CONFIG } from '../lib/config';

class MessagePersistenceService {
  private cache: Map<string, CachedRoom> = new Map();
  private readonly CACHE_EXPIRY = API_CONFIG.messagePersistence.cacheExpiry;
  private readonly MAX_CACHED_MESSAGES = API_CONFIG.messagePersistence.cacheSize;

  // Check if authentication is available
  private isAuthenticated(): boolean {
    try {
      const authData = localStorage.getItem('nexus-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        const token = parsed?.currentSession?.access_token || parsed?.access_token || parsed?.session?.access_token;
        return !!token;
      }
    } catch (error) {
      console.warn('⚠️ Error checking authentication:', error);
    }
    return false;
  }

  // Load messages for a room (from cache or API)
  async loadMessages(roomId: string, roomType: 'darkroom' | 'hangout' = 'hangout', forceRefresh: boolean = false): Promise<Message[]> {
    console.log(`🔵 [MSG_PERSISTENCE] loadMessages START - roomId: ${roomId}, type: ${roomType}, forceRefresh: ${forceRefresh}, timestamp: ${new Date().toISOString()}`);
    
    try {
      // If not forcing refresh, check cache first
      if (!forceRefresh) {
        const cached = this.getFromCache(roomId);
        if (cached) {
          console.log(`📦 [MSG_PERSISTENCE] Loading ${cached.messages.length} messages from cache for room ${roomId}`);
          console.log(`✅ [MSG_PERSISTENCE] loadMessages END (from cache) - returned ${cached.messages.length} messages`);
          return cached.messages;
        }
      } else {
        console.log(`🔄 [MSG_PERSISTENCE] Force refreshing messages for room ${roomId}`);
      }

      // Check authentication before attempting API call
      if (!this.isAuthenticated()) {
        console.warn('⚠️ No authentication token available - cannot load messages from API');
        console.warn('🔄 Attempting to load from cache or localStorage as fallback...');
        
        // Try cache first
        const cached = this.getFromCache(roomId);
        if (cached && cached.messages.length > 0) {
          console.log(`📦 Using cached messages as fallback: ${cached.messages.length} messages`);
          return cached.messages;
        }
        
        // Try localStorage as last resort
        const localStorageMessages = this.loadRoomFromLocalStorage(roomId);
        if (localStorageMessages.length > 0) {
          console.log(`💾 Using localStorage messages as fallback: ${localStorageMessages.length} messages`);
          return localStorageMessages;
        }
        
        console.log('📭 No cached messages available, returning empty array (room may be new)');
        return [];
      }

      // Load from API
      const messages = await this.loadFromAPI(roomId, roomType);
      
      // Cache the messages
      this.setCache(roomId, messages);
      
      console.log(`📥 [MSG_PERSISTENCE] Loaded ${messages.length} messages from API for room ${roomId}`);
      console.log(`✅ [MSG_PERSISTENCE] loadMessages END (from API) - returned ${messages.length} messages`);
      return messages;
    } catch (error) {
      console.error('❌ [MSG_PERSISTENCE] Error loading messages:', error);
      console.log(`❌ [MSG_PERSISTENCE] loadMessages END (error) - returning empty array`);
      return [];
    }
  }

  // Load messages from API
  private async loadFromAPI(roomId: string, roomType: 'darkroom' | 'hangout'): Promise<Message[]> {
    console.log(`🌐 [MSG_PERSISTENCE_API] loadFromAPI START - roomId: ${roomId}, type: ${roomType}`);
    const { apiClient } = await import('../lib/apiConfig');
    
    try {
      const endpoint = roomType === 'darkroom' 
        ? `/api/v1/darkroom/rooms/${roomId}/messages`
        : `/api/hangout/rooms/${roomId}/messages`;
      
      console.log(`📨 [MSG_PERSISTENCE_API] Fetching from endpoint: ${endpoint}`);
      const response = await apiClient.get(endpoint);
      
      // Check if response is successful
      if (!response || !response.data) {
        console.warn(`⚠️ [MSG_PERSISTENCE_API] Empty response for room ${roomId}`);
        console.log(`⚠️ [MSG_PERSISTENCE_API] loadFromAPI END - returning empty array (no response data)`);
        return [];
      }

      // Handle both direct messages array and nested messages
      const messages = response.data.messages || response.data || [];
      
      if (Array.isArray(messages)) {
        console.log(`✅ [MSG_PERSISTENCE_API] Successfully loaded ${messages.length} messages from API`);
        
        // Valid response but no messages - this is OK, room is just empty
        if (messages.length === 0) {
          console.log(`📭 [MSG_PERSISTENCE_API] Room ${roomId} has no messages yet (empty but valid)`);
        }
        
        console.log(`✅ [MSG_PERSISTENCE_API] loadFromAPI END - returning ${messages.length} messages`);
        return messages;
      } else {
        console.warn(`⚠️ [MSG_PERSISTENCE_API] Messages is not an array for room ${roomId}`, typeof messages);
        console.log(`⚠️ [MSG_PERSISTENCE_API] loadFromAPI END - returning empty array (invalid data type)`);
        return [];
      }
    } catch (error) {
      console.error(`❌ [MSG_PERSISTENCE_API] Failed to load messages from API for ${roomType} room ${roomId}:`, error);
      
      // Log detailed error information for debugging
      if (error.response) {
        console.error('❌ API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url,
          method: error.config?.method
        });
        
        // Handle specific error cases
        if (error.response.status === 401) {
          console.error('🔐 Authentication failed - messages cannot be loaded from API');
          console.error('💡 This is likely the cause of messages disappearing when rejoining rooms');
          
          // Try to load from cache as fallback
          const cached = this.getFromCache(roomId);
          if (cached && cached.messages.length > 0) {
            console.log(`📦 Falling back to cached messages: ${cached.messages.length} messages`);
            return cached.messages;
          }
          
          // If no cache, try to load from localStorage as last resort
          const localStorageMessages = this.loadRoomFromLocalStorage(roomId);
          if (localStorageMessages.length > 0) {
            console.log(`💾 Falling back to localStorage messages: ${localStorageMessages.length} messages`);
            return localStorageMessages;
          }
          
          console.error('❌ No fallback messages available - UI will show empty');
        }
      }
      
      // For non-401 errors, try cache fallback
      const cached = this.getFromCache(roomId);
      if (cached && cached.messages.length > 0) {
        console.log(`📦 [MSG_PERSISTENCE_API] Falling back to cached messages for non-auth error: ${cached.messages.length} messages`);
        console.log(`📦 [MSG_PERSISTENCE_API] loadFromAPI END (cache fallback) - returning ${cached.messages.length} messages`);
        return cached.messages;
      }
      
      console.log(`❌ [MSG_PERSISTENCE_API] loadFromAPI END (error, no fallback) - returning empty array`);
      return [];
    }
  }

  // Add a new message to cache
  // Clear cache for a specific room (useful for refresh scenarios)
  clearCache(roomId: string): void {
    this.cache.delete(roomId);
    console.log(`🗑️ Cleared cache for room ${roomId}`);
  }

  // Clear all cache
  clearAllCache(): void {
    this.cache.clear();
    console.log('🗑️ Cleared all message cache');
  }

  addMessage(roomId: string, message: Message): void {
    const cached = this.cache.get(roomId);
    if (cached) {
      // Check if message already exists to avoid duplicates
      const exists = cached.messages.some(m => m.id === message.id);
      if (!exists) {
        cached.messages.push(message);
        
        // Keep only the most recent messages
        if (cached.messages.length > this.MAX_CACHED_MESSAGES) {
          cached.messages = cached.messages.slice(-this.MAX_CACHED_MESSAGES);
        }
        
        cached.lastUpdated = Date.now();
        cached.messageCount = cached.messages.length;
        
        console.log(`➕ Added message to cache for room ${roomId} (${cached.messages.length} total)`);
      }
    } else {
      // Create new cache entry
      this.setCache(roomId, [message]);
    }
  }

  // Update a message in cache
  updateMessage(roomId: string, messageId: string, updates: Partial<Message>): void {
    const cached = this.cache.get(roomId);
    if (cached) {
      const index = cached.messages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        cached.messages[index] = { ...cached.messages[index], ...updates };
        cached.lastUpdated = Date.now();
        console.log(`✏️ Updated message in cache for room ${roomId}`);
      }
    }
  }

  // Remove a message from cache
  removeMessage(roomId: string, messageId: string): void {
    const cached = this.cache.get(roomId);
    if (cached) {
      const index = cached.messages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        cached.messages.splice(index, 1);
        cached.lastUpdated = Date.now();
        cached.messageCount = cached.messages.length;
        console.log(`🗑️ Removed message from cache for room ${roomId}`);
      }
    }
  }

  // Get messages from cache
  private getFromCache(roomId: string): CachedRoom | null {
    const cached = this.cache.get(roomId);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.lastUpdated > this.CACHE_EXPIRY) {
      console.log(`⏰ Cache expired for room ${roomId}, removing`);
      this.cache.delete(roomId);
      return null;
    }

    return cached;
  }

  // Set cache for a room
  private setCache(roomId: string, messages: Message[]): void {
    this.cache.set(roomId, {
      messages: [...messages],
      lastUpdated: Date.now(),
      messageCount: messages.length
    });
  }

  // Clear cache for a specific room
  clearRoomCache(roomId: string): void {
    this.cache.delete(roomId);
    console.log(`🧹 Cleared cache for room ${roomId}`);
  }


  // Get cache statistics
  getCacheStats(): { roomCount: number; totalMessages: number; rooms: string[] } {
    const rooms = Array.from(this.cache.keys());
    const totalMessages = Array.from(this.cache.values())
      .reduce((sum, room) => sum + room.messageCount, 0);

    return {
      roomCount: rooms.length,
      totalMessages,
      rooms
    };
  }

  // Preload messages for multiple rooms (useful for navigation)
  async preloadRooms(roomIds: string[], roomType: 'darkroom' | 'hangout' = 'hangout'): Promise<void> {
    const loadPromises = roomIds.map(roomId => this.loadMessages(roomId, roomType));
    
    try {
      await Promise.all(loadPromises);
      console.log(`📦 Preloaded messages for ${roomIds.length} rooms`);
    } catch (error) {
      console.error('❌ Error preloading room messages:', error);
    }
  }

  // Save messages to localStorage as backup
  saveToLocalStorage(): void {
    try {
      const cacheData = Object.fromEntries(this.cache);
      localStorage.setItem('nexus-message-cache', JSON.stringify(cacheData));
      console.log('💾 Saved message cache to localStorage');
    } catch (error) {
      console.error('❌ Error saving message cache to localStorage:', error);
    }
  }

  // Load messages from localStorage backup
  loadFromLocalStorage(): void {
    try {
      const cacheData = localStorage.getItem('nexus-message-cache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        this.cache = new Map(Object.entries(parsed));
        console.log('📦 Loaded message cache from localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading message cache from localStorage:', error);
    }
  }

  // Load messages for a specific room from localStorage
  loadRoomFromLocalStorage(roomId: string): Message[] {
    try {
      const cacheData = localStorage.getItem('nexus-message-cache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        const roomData = parsed[roomId];
        if (roomData && roomData.messages) {
          console.log(`💾 Loaded ${roomData.messages.length} messages from localStorage for room ${roomId}`);
          return roomData.messages;
        }
      }
    } catch (error) {
      console.error(`❌ Error loading messages from localStorage for room ${roomId}:`, error);
    }
    return [];
  }
}

// Create singleton instance
export const messagePersistence = new MessagePersistenceService();

// Auto-save to localStorage periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    messagePersistence.saveToLocalStorage();
  }, API_CONFIG.messagePersistence.autoSaveInterval);

  // Load from localStorage on startup
  messagePersistence.loadFromLocalStorage();
}

export default messagePersistence;
