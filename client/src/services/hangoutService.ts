import { io, Socket } from 'socket.io-client';
import { apiFetch } from '../lib/utils';

// Types
export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  maxMembers?: number;
  isPrivate: boolean;
  isOfficial: boolean;
  roomType: 'palace' | 'room'; // New field: 'palace' for open rooms, 'room' for admin-controlled
  createdAt: Date;
  lastActivity: Date;
  moderators: string[];
  tags: string[];
  icon?: string;
  banner?: string;
  profilePicture?: string;
  campusId?: string;
  createdBy?: string;
  
  // Enhanced group chat features
  admin?: {
    id: string;
    name: string;
    avatar: string;
    lastActive: Date;
  };
  coAdmins?: Array<{
    id: string;
    name: string;
    avatar: string;
    lastActive: Date;
    assignedBy: string; // Admin who assigned this co-admin
    assignedAt: Date;
  }>;
  members?: Array<{
    id: string;
    name: string;
    avatar: string;
    role: 'admin' | 'co-admin' | 'member';
    joinedAt: Date;
    lastActive: Date;
    isBanned?: boolean;
    banExpiry?: Date;
    bannedBy?: string;
    bannedAt?: Date;
  }>;
  rules?: string[];
  announcements?: Array<{
    id: string;
    title: string;
    content: string;
    author: string;
    timestamp: Date;
    type: 'text' | 'image' | 'poll';
  }>;
  customRoles?: Array<{
    id: string;
    name: string;
    permissions: string[];
  }>;
  joinRequestRequired?: boolean;
  pendingRequests?: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    requestedAt: Date;
    message?: string;
  }>;
  maxCoAdmins?: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: Date;
  reactions: { [emoji: string]: string[] };
  isEdited: boolean;
  replyTo?: string;
  characterId?: string;
  isPinned?: boolean;
  pinnedBy?: string;
  pinnedAt?: Date;
  pinDuration?: '1day' | '7days' | '30days' | '45days' | 'permanent';
  pinExpiresAt?: Date;
  isDeleted?: boolean;
  deletedBy?: string;
  deletedByAdmin?: boolean;
  // Message locking and restriction fields
  isLocked?: boolean;
  lockedBy?: string;
  lockedAt?: string;
  lockReason?: string;
  deletionRestricted?: boolean;
  restrictedBy?: string;
  restrictionReason?: string;
  canBeDeletedByAuthor?: boolean;
}

export interface User {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  role: 'member' | 'moderator' | 'admin';
  campusId?: string;
  characterId?: string;
}

export interface ModerationAction {
  id: string;
  type: 'warn' | 'mute' | 'ban' | 'kick' | 'delete';
  targetUserId: string;
  targetUsername: string;
  reason: string;
  moderatorId: string;
  moderatorName: string;
  timestamp: Date;
  duration?: number;
}

class HangoutService {
  private socket: Socket | null = null;
  private currentUser: any = null;
  private currentCampus: any = null;
  private realtimeSubscriptions: Map<string, any> = new Map();
  private activeRooms: Set<string> = new Set(); // Track which rooms user is currently in

  // Return true if this room already has an active realtime subscription and socket presence
  public isRoomActive(roomId: string): boolean {
    const isActive = this.activeRooms.has(roomId) || this.realtimeSubscriptions.has(roomId);
    if (isActive) {
      console.log(`📡 [HangoutService] Room ${roomId} already active/subscribed. Skipping duplicate setup.`);
    }
    return isActive;
  }

  // Initialize socket connection with proper authentication
  async initializeSocket(userId: string, campusId?: string): Promise<Socket | null> {
    this.currentUser = { id: userId };
    this.currentCampus = campusId ? { id: campusId } : null;

    try {
      // Use centralized socket manager
      const { createSocket } = await import('../lib/socketConfig');
      
      this.socket = await createSocket({
        userId,
        campusId,
        options: {
          timeout: 10000,
          transports: ['websocket', 'polling']
        }
      });

      if (!this.socket) {
        console.error('❌ Failed to create socket connection');
        this.logError('Socket Initialization - Connection Failed', new Error('Socket creation returned null'));
        return null;
      }

      this.socket.on('connect', () => {
        console.log('✅ Connected to hangout server');
        this.logSuccess('Socket Connected', { userId, campusId });
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        this.logError('Socket Connection Error', error, { userId, campusId });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('📡 Disconnected from hangout server:', reason);
        this.logSuccess('Socket Disconnected', { reason, userId, campusId });
      });

      this.socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
        this.logError('Socket Error', error, { userId, campusId });
      });

      return this.socket;
    } catch (error) {
      console.error('❌ Error initializing socket:', error);
      this.logError('Socket Initialization Error', error, { userId, campusId });
      return null;
    }
  }

  // Room management
  async getRooms(campusId?: string): Promise<ChatRoom[]> {
    // Declare url outside try block to avoid ReferenceError in catch
    const url = campusId ? `/api/hangout/rooms?campusId=${campusId}` : '/api/hangout/rooms';
    
    try {
      // Validate session before making API call
      const { supabase } = await import('../lib/supabase');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        console.warn('⚠️ No valid Supabase session found, attempting to use fallback rooms');
        const fallbackRooms = this.getFallbackRooms();
        if (fallbackRooms.length > 0) {
          console.log('📦 Using fallback rooms from localStorage (no session)');
          return fallbackRooms;
        }
        console.error('❌ No session and no fallback rooms available');
        return [];
      }

      console.log('✅ Valid session found, fetching rooms from API');
      
      const { apiClient } = await import('../lib/apiConfig');
      console.log('🔍 Fetching rooms from:', url);

      const response = await apiClient.get(url);
      console.log('📡 Response status:', response.status);

      const data = response.data;
      console.log('📦 Received data:', data);
      console.log('📊 Number of rooms:', data.rooms?.length || 0);
      
      if (!data.rooms || !Array.isArray(data.rooms)) {
        console.error('❌ Invalid data format:', data);
        return this.getFallbackRooms();
      }
      
      const rooms = data.rooms.map((room: any) => {
        // Safely parse dates
        const createdAt = room.createdAt ? new Date(room.createdAt) : new Date();
        const lastActivity = room.lastActivity ? new Date(room.lastActivity) : createdAt;
        
        return {
          ...room,
          createdAt,
          lastActivity
        };
      });
      
      // Cache rooms for fallback
      this.cacheFallbackRooms(rooms);
      
      console.log('✅ Mapped rooms:', rooms);
      return rooms;
    } catch (error: any) {
      console.error('❌ Error fetching rooms:', error);
      
      // Enhanced error logging with proper context
      const errorContext = { 
        campusId, 
        url,
        status: error?.response?.status,
        message: error?.message
      };
      
      // Handle 401 Unauthorized specifically
      if (error?.response?.status === 401) {
        console.error('🚨 401 Unauthorized: Session expired or invalid');
        console.error('💡 User needs to log in again or session needs refresh');
        
        // Try to refresh session
        try {
          const { supabase } = await import('../lib/supabase');
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (!refreshError && session) {
            console.log('✅ Session refreshed successfully, retrying room fetch...');
            // Retry the request once with new session
            const { apiClient } = await import('../lib/apiConfig');
            const retryResponse = await apiClient.get(url);
            const retryData = retryResponse.data;
            
            if (retryData.rooms && Array.isArray(retryData.rooms)) {
              const rooms = retryData.rooms.map((room: any) => ({
                ...room,
                createdAt: new Date(room.createdAt),
                lastActivity: new Date(room.lastActivity)
              }));
              this.cacheFallbackRooms(rooms);
              console.log('✅ Rooms fetched successfully after session refresh');
              return rooms;
            }
          } else {
            console.error('❌ Session refresh failed, user needs to re-login');
          }
        } catch (refreshError) {
          console.error('❌ Session refresh attempt failed:', refreshError);
        }
      }
      
      this.logError('Get Rooms - Exception', error, errorContext);
      
      // Try fallback to local storage if available
      const fallbackRooms = this.getFallbackRooms();
      if (fallbackRooms.length > 0) {
        console.log('📦 Using fallback rooms from localStorage');
        return fallbackRooms;
      }
      
      console.warn('⚠️ No fallback rooms available, returning empty array');
      return [];
    }
  }

  async createRoom(roomData: {
    name: string;
    description: string;
    bio?: string;
    rules?: string[];
    category: string;
    isPrivate: boolean;
    roomType: 'palace' | 'room';
    profilePicture?: string;
    tags: string[];
    createdBy?: string;
    campusId?: string;
    // Role management settings
    maxCoAdmins?: number;
    defaultBanDuration?: '1hour' | '1day' | '1week';
    allowMemberRequests?: boolean;
    allowAdminInvites?: boolean;
    autoTransferOnInactivity?: boolean;
    inactivityDays?: number;
  }): Promise<ChatRoom | null> {
    try {
      console.log('hangoutService.createRoom called with:', roomData);
      
      const requestBody = {
        ...roomData,
        createdBy: roomData.createdBy || this.currentUser?.id
      };
      
      console.log('Request body:', requestBody);
      
      const response = await apiFetch('/api/hangout/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        return {
          ...data.room,
          createdAt: new Date(data.room.createdAt),
          lastActivity: new Date(data.room.lastActivity)
        };
      } else {
        const errorText = await response.text();
        console.error('Response not ok:', response.status, errorText);
      }
      return null;
    } catch (error) {
      console.error('Error creating room:', error);
      return null;
    }
  }


  // Role management methods
  async assignCoAdmin(roomId: string, userId: string): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/co-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      return response.ok;
    } catch (error) {
      console.error('Error assigning co-admin:', error);
      return false;
    }
  }

  async removeCoAdmin(roomId: string, userId: string): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/co-admin/${userId}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Error removing co-admin:', error);
      return false;
    }
  }

  async transferOwnership(roomId: string, newAdminId: string): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newAdminId })
      });
      return response.ok;
    } catch (error) {
      console.error('Error transferring ownership:', error);
      return false;
    }
  }

  async banUser(roomId: string, userId: string, duration?: number, reason?: string): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, duration, reason })
      });
      return response.ok;
    } catch (error) {
      console.error('Error banning user:', error);
      return false;
    }
  }

  async unbanUser(roomId: string, userId: string): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/unban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });
      return response.ok;
    } catch (error) {
      console.error('Error unbanning user:', error);
      return false;
    }
  }

  async removeMember(roomId: string, userId: string): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/members/${userId}`, {
        method: 'DELETE'
      });
      return response.ok;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  }

  async updateRoomSettings(roomId: string, settings: {
    name?: string;
    description?: string;
    rules?: string[];
    banner?: string;
    icon?: string;
  }): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating room settings:', error);
      return false;
    }
  }

  async getRoomMembers(roomId: string): Promise<any[]> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/members`);
      if (response.ok) {
        const data = await response.json();
        return data.members || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching room members:', error);
      return [];
    }
  }

  async getPendingRequests(roomId: string): Promise<any[]> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/requests`);
      if (response.ok) {
        const data = await response.json();
        return data.requests || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }
  }

  async handleJoinRequest(roomId: string, requestId: string, action: 'accept' | 'reject'): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/requests/${requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action })
      });
      return response.ok;
    } catch (error) {
      console.error('Error handling join request:', error);
      return false;
    }
  }

  async requestToJoin(roomId: string, message?: string): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/request-join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });
      return response.ok;
    } catch (error) {
      console.error('Error requesting to join:', error);
      return false;
    }
  }

  async checkUserRole(roomId: string, userId: string): Promise<'admin' | 'co-admin' | 'member' | null> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/user-role/${userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.role;
      }
      return null;
    } catch (error) {
      console.error('Error checking user role:', error);
      return null;
    }
  }

  async checkUserPermissions(roomId: string, userId: string): Promise<string[]> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/permissions/${userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.permissions || [];
      }
      return [];
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return [];
    }
  }

  async getRoomDetails(roomId: string): Promise<any> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        return data.room;
      }
      return null;
    } catch (error) {
      console.error('Error fetching room details:', error);
      return null;
    }
  }

  async initiateOwnershipTransfer(roomId: string, newAdminId: string): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/initiate-transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newAdminId })
      });
      return response.ok;
    } catch (error) {
      console.error('Error initiating ownership transfer:', error);
      return false;
    }
  }

  async acceptOwnershipTransfer(roomId: string): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/accept-transfer`, {
        method: 'POST'
      });
      return response.ok;
    } catch (error) {
      console.error('Error accepting ownership transfer:', error);
      return false;
    }
  }

  async inviteUser(roomId: string, userId: string, message?: string): Promise<boolean> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, message })
      });
      return response.ok;
    } catch (error) {
      console.error('Error inviting user:', error);
      return false;
    }
  }



  // Message management
  async getMessages(roomId: string, limit = 50, offset = 0): Promise<ChatMessage[]> {
    // Inner function for retry logic (Problem 4 fix)
    const attemptFetch = async (retryCount: number = 0): Promise<ChatMessage[]> => {
      try {
        console.log(`📨 [Attempt ${retryCount + 1}] Fetching messages for room ${roomId}, limit: ${limit}, offset: ${offset}`);

        if (!roomId || typeof roomId !== 'string') {
          console.error('❌ Invalid roomId:', roomId);
          this.logError('Get Messages - Invalid RoomId', new Error('Invalid roomId'), { roomId, limit, offset });
          return [];
        }

        // Use centralized apiClient for consistent authentication
        const { apiClient } = await import('../lib/apiConfig');
        const endpoint = `/api/hangout/rooms/${roomId}/messages?limit=${limit}&offset=${offset}`;
        
        console.log(`🔧 GET ${endpoint}`);
        const response = await apiClient.get(endpoint);

        if (response.status !== 200) {
          throw new Error(`API returned status ${response.status}`);
        }

        const data = response.data;

        // Handle different possible response structures
        const messagesArray = data.messages || data.data || data;

        if (!Array.isArray(messagesArray)) {
          console.warn('⚠️ Response is not an array:', typeof messagesArray);
          return [];
        }

        if (messagesArray.length === 0) {
          console.log('📭 No messages found for room:', roomId);
          return [];
        }

        // Safely map messages with error handling for each message
        const messages = messagesArray
          .filter((msg: any) => msg && (msg.id || msg.content))
          .map((msg: any) => {
            try {
              return {
                id: msg.id || `temp-${Date.now()}-${Math.random()}`,
                content: msg.content || '',
                authorId: msg.authorId || msg.user_id || msg.userId || 'unknown',
                authorName: msg.authorName || msg.user_name || msg.userName || 'Anonymous',
                authorAvatar: msg.authorAvatar || msg.author_avatar || msg.avatar,
                timestamp: msg.timestamp ? new Date(msg.timestamp) :
                          msg.created_at ? new Date(msg.created_at) :
                          msg.createdAt ? new Date(msg.createdAt) : new Date(),
                reactions: msg.reactions || {},
                isEdited: msg.isEdited || msg.is_edited || false,
                replyTo: msg.replyTo || msg.reply_to,
                characterId: msg.characterId || msg.character_id,
                isPinned: msg.isPinned || msg.is_pinned || false,
                pinnedBy: msg.pinnedBy || msg.pinned_by,
                pinnedAt: msg.pinnedAt || msg.pinned_at,
                pinDuration: msg.pinDuration || msg.pin_duration,
                pinExpiresAt: msg.pinExpiresAt || msg.pin_expires_at,
                isDeleted: msg.isDeleted || msg.is_deleted || false,
                deletedBy: msg.deletedBy || msg.deleted_by,
                deletedByAdmin: msg.deletedByAdmin || msg.deleted_by_admin || false
              };
            } catch (msgError) {
              console.error('❌ Error mapping individual message:', msgError, msg);
              return {
                id: msg.id || `error-${Date.now()}-${Math.random()}`,
                content: msg.content || 'Error loading message',
                authorId: 'system',
                authorName: 'System',
                timestamp: new Date(),
                reactions: {},
                isEdited: false
              };
            }
          });

        console.log(`✅ Successfully fetched ${messages.length} messages`);
        return messages;
        
      } catch (error: any) {
        // Enhanced error logging (Problem 4 fix)
        console.error(`❌ [Attempt ${retryCount + 1}] Failed to fetch messages:`, {
          roomId,
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          code: error.code
        });
        
        // Retry once on network errors or server errors (Problem 4 fix)
        if (retryCount === 0 && (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || (error.response?.status >= 500))) {
          console.log('🔄 Retrying after network/server error...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return attemptFetch(1);
        }
        
        return [];
      }
    };
    
    return attemptFetch();
  }

  async sendMessage(
    roomId: string, 
    content: string, 
    userName?: string, 
    replyTo?: string, 
    bubbleSkin?: string,
    attachments?: string[]
  ): Promise<void> {
    if (this.socket && this.currentUser) {
      // Get user's preferred bubble skin from localStorage
      const storedBubbleSkin = localStorage.getItem(`hangout-bubble-skin-${this.currentUser.id}`) || 'liquid';
      const skinToUse = bubbleSkin || storedBubbleSkin;

      console.log('📤 [HangoutService] Sending message via Socket.io with bubble skin:', skinToUse);
      
      // CRITICAL FIX: Don't cache the message here - let the real-time subscription handle it
      // This prevents the service cache + real-time subscription duplication
      
      // Emit to socket - the real-time subscription will handle adding to UI
      this.socket.emit('send-hangout-message', {
        roomId,
        userId: this.currentUser.id,
        userName: userName || this.currentUser.username || 'Anonymous',
        content,
        replyTo,
        bubbleSkin: skinToUse,
        attachments: attachments || []
      });
      
      console.log('📤 [HangoutService] Message emitted to socket - real-time subscription will add to UI');
    }
  }

  async joinRoomById(joinId: string): Promise<{ success: boolean; room?: any; error?: string }> {
    try {
      const response = await apiFetch('/api/hangout/join-by-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ joinId })
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, room: data.room };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to join room' };
      }
    } catch (error) {
      console.error('Error joining room by ID:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async getRoomParticipants(roomId: string): Promise<any[]> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/participants`);
      
      if (response.ok) {
        const data = await response.json();
        return data.participants || [];
      } else {
        console.error('Failed to fetch participants:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching room participants:', error);
      return [];
    }
  }

  async validateSession(): Promise<boolean> {
    try {
      const response = await apiFetch('/api/hangout/session');
      return response.ok;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  addReaction(messageId: string, emoji: string): void {
    if (this.socket) {
      this.socket.emit('add_reaction', {
        messageId,
        emoji,
        userId: this.currentUser?.id
      });
    }
  }

  removeReaction(messageId: string, emoji: string): void {
    if (this.socket) {
      this.socket.emit('remove_reaction', {
        messageId,
        emoji,
        userId: this.currentUser?.id
      });
    }
  }

  // Moderation
  async getModerationActions(roomId: string): Promise<ModerationAction[]> {
    try {
      const response = await apiFetch(`/api/hangout/rooms/${roomId}/moderation`);
      
      // If endpoint doesn't exist or returns error, just return empty array
      if (!response.ok) {
        console.log(`ℹ️ Moderation endpoint not available for room ${roomId}`);
        return [];
      }
      
      const data = await response.json();
      return data.actions?.map((action: any) => ({
        ...action,
        timestamp: new Date(action.timestamp)
      })) || [];
    } catch (error) {
      console.log('ℹ️ Moderation actions not available:', error);
      return [];
    }
  }

  async takeModerationAction(action: {
    type: 'warn' | 'mute' | 'ban' | 'kick';
    targetUserId: string;
    reason: string;
    duration?: number;
  }): Promise<boolean> {
    try {
      const response = await apiFetch('/api/hangout/moderation/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...action,
          moderatorId: this.currentUser?.id
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Error taking moderation action:', error);
      return false;
    }
  }

  // Reporting
  async reportContent(report: {
    targetType: 'message' | 'user' | 'room';
    targetId: string;
    category: string;
    reason: string;
    details?: string;
  }): Promise<boolean> {
    try {
      const response = await apiFetch('/api/hangout/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...report,
          reporterId: this.currentUser?.id
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Error submitting report:', error);
      return false;
    }
  }

  // Socket event handlers (updated for hangout rooms)
  onMessage(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('receive-hangout-message', async (message) => {
        // Cache the incoming message
        const { messagePersistence } = await import('./messagePersistence');
        messagePersistence.addMessage(message.roomId, message);
        
        // Call the original callback
        callback(message);
      });
    }
  }

  onRoomHistory(callback: (messages: any[]) => void): void {
    if (this.socket) {
      this.socket.on('hangout-room-history', async (messages) => {
        // Cache the room history messages
        if (messages && messages.length > 0) {
          const { messagePersistence } = await import('./messagePersistence');
          const roomId = messages[0]?.roomId;
          if (roomId) {
            // Clear existing cache and add all messages
            messagePersistence.clearRoomCache(roomId);
            messages.forEach(message => {
              messagePersistence.addMessage(roomId, message);
            });
            console.log(`📦 Cached ${messages.length} room history messages for room ${roomId}`);
          }
        }
        
        // Call the original callback
        callback(messages);
      });
    }
  }

  onMemberCountUpdate(callback: (data: { roomId: string; count: number }) => void): void {
    if (this.socket) {
      this.socket.on('hangout-member-count-update', callback);
    }
  }

  onTyping(callback: (data: { roomId: string; userId: string; userName?: string; isTyping: boolean }) => void): void {
    if (this.socket) {
      this.socket.on('hangout-user-typing', callback);
    }
  }

  onUserJoin(callback: (user: User) => void): void {
    if (this.socket) {
      this.socket.on('user_join', callback);
    }
  }

  onUserLeave(callback: (userId: string) => void): void {
    if (this.socket) {
      this.socket.on('user_leave', callback);
    }
  }

  // Typing indicators
  startTyping(roomId: string, userName?: string): void {
    if (this.socket && this.currentUser) {
      this.socket.emit('hangout-typing-start', {
        roomId,
        userId: this.currentUser.id,
        userName: userName || this.currentUser.username || 'Anonymous'
      });
    }
  }

  stopTyping(roomId: string): void {
    if (this.socket && this.currentUser) {
      this.socket.emit('hangout-typing-stop', {
        roomId,
        userId: this.currentUser.id
      });
    }
  }

  // Mark messages as read
  markAsRead(roomId: string, messageId: string): void {
    if (this.socket && this.currentUser) {
      this.socket.emit('hangout-mark-read', {
        roomId,
        userId: this.currentUser.id,
        messageId
      });
    }
  }


  onReaction(callback: (data: { messageId: string; emoji: string; userId: string; action: 'add' | 'remove' }) => void): void {
    if (this.socket) {
      this.socket.on('reaction_update', callback);
    }
  }

  onModerationAction(callback: (action: ModerationAction) => void): void {
    if (this.socket) {
      this.socket.on('moderation_action', callback);
    }
  }

  // Join request realtime helpers
  emitJoinRequest(event: { roomId: string; requestId: string; userId: string; userName?: string }): void {
    if (this.socket) {
      this.socket.emit('join_request', event);
    }
  }

  onJoinRequest(callback: (event: { roomId: string; requestId: string; userId: string; userName?: string }) => void): void {
    if (this.socket) {
      this.socket.on('join_request', callback);
    }
  }

  emitJoinRequestHandled(event: { roomId: string; requestId: string; userId: string; action: 'accept' | 'reject' }): void {
    if (this.socket) {
      this.socket.emit('join_request_handled', event);
    }
  }

  onJoinRequestHandled(callback: (event: { roomId: string; requestId: string; userId: string; action: 'accept' | 'reject' }) => void): void {
    if (this.socket) {
      this.socket.on('join_request_handled', callback);
    }
  }

  // Track pending subscriptions to prevent race conditions
  private pendingSubscriptions: Set<string> = new Set();

  // Set up Supabase Realtime subscription for room messages
  private async setupRealtimeSubscription(roomId: string): Promise<void> {
    try {
      // CRITICAL FIX: Check if subscription already exists OR is pending
      if (this.realtimeSubscriptions.has(roomId)) {
        console.log(`📡 Realtime subscription already exists for room ${roomId}, skipping duplicate setup`);
        return;
      }

      if (this.pendingSubscriptions.has(roomId)) {
        console.log(`⏳ Realtime subscription setup already in progress for room ${roomId}, skipping duplicate`);
        return;
      }

      console.log(`📡 Setting up realtime subscription for room: ${roomId}`);
      
      // Mark as pending to prevent duplicate calls
      this.pendingSubscriptions.add(roomId);

      // Import supabase client dynamically to avoid issues if not available
      const { supabase } = await import('../lib/supabase');
      
      const channelName = `room-messages-${roomId}`;

      // CRITICAL FIX: Remove existing channel if it exists to prevent "subscribe called multiple times" error
      const existingChannel = supabase.getChannels().find(ch => ch.topic === channelName);
      if (existingChannel) {
        console.log(`🧹 Removing existing channel ${channelName} to prevent duplicates`);
        await supabase.removeChannel(existingChannel);
        // Also remove from our tracking map
        this.realtimeSubscriptions.delete(roomId);
      }

      // Create a fresh channel instance
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: true }
        }
      });

      // CRITICAL FIX: Set up the subscription with improved error handling
      channel
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'hangout_messages', // Updated to use new table name
            filter: `hangout_id=eq.${roomId}` // Column filter for new schema
          },
          (payload) => {
            console.log('📡 Realtime message received:', {
              roomId,
              messageId: payload.new?.id,
              content: payload.new?.message?.substring(0, 50) + '...',
              timestamp: payload.new?.created_at
            });

            if (payload.new && payload.new.id && payload.new.message) {
              const message = {
                id: payload.new.id,
                content: payload.new.message,
                userId: payload.new.sender_id,
                userName: payload.new.sender_username || 'Anonymous',
                timestamp: payload.new.created_at,
                isEdited: false,
                replyTo: null,
                replyToMessage: null,
                bubbleSkin: 'liquid',
                attachments: []
              };

              // Emit through socket for consistency with existing flow
              if (this.socket && this.socket.connected) {
                this.socket.emit('receive-hangout-message', message);
              }
            }
          }
        )
        .subscribe((status, error) => {
          console.log(`📡 Realtime subscription status for room ${roomId}:`, status);

          if (status === 'SUBSCRIBED') {
            console.log(`✅ [Realtime] Channel subscribed for room: ${roomId}`);
            // Remove from pending on successful subscription
            this.pendingSubscriptions.delete(roomId);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ Realtime subscription error for room ${roomId}:`, status, error);
            console.error(`💡 Possible causes: 
              1. Realtime not enabled for 'hangout_messages' table in Supabase Dashboard > Database > Replication
              2. RLS policies blocking realtime events
              3. Invalid hangout_id filter`);
            // Clean up failed subscription
            this.realtimeSubscriptions.delete(roomId);
            this.pendingSubscriptions.delete(roomId);
            this.logError('Realtime Subscription - Channel Error', error || new Error(status), { roomId, status });
          } else if (status === 'TIMED_OUT') {
            console.warn(`⚠️ Realtime subscription timed out for room ${roomId}`);
            // Clean up timed out subscription
            this.realtimeSubscriptions.delete(roomId);
            this.pendingSubscriptions.delete(roomId);
            this.logError('Realtime Subscription - Timeout', new Error('Subscription timed out'), { roomId });
          } else if (status === 'CLOSED') {
            console.log(`📡 [Realtime] Channel unsubscribed/closed for room: ${roomId}`);
            // Clean up the subscription from our map
            this.realtimeSubscriptions.delete(roomId);
            this.pendingSubscriptions.delete(roomId);
          }
        });

      // Store the channel (not the subscription) for later cleanup
      this.realtimeSubscriptions.set(roomId, channel);
      console.log(`✅ Set up realtime subscription for room: ${roomId}`);
    } catch (error) {
      console.error('❌ Error setting up realtime subscription:', error);
      // Clean up pending status on error
      this.pendingSubscriptions.delete(roomId);
      this.logError('Realtime Setup Error', error, { roomId });
    }
  }

  // Clean up realtime subscription for a room
  private async cleanupRealtimeSubscription(roomId: string): Promise<void> {
    try {
      const channel = this.realtimeSubscriptions.get(roomId);
      if (channel) {
        console.log(`🧹 Cleaning up realtime subscription for room: ${roomId}`);

        // Unsubscribe and remove the channel
        const { supabase } = await import('../lib/supabase');
        await supabase.removeChannel(channel);
        console.log(`✅ [Realtime] Channel unsubscribed for room: ${roomId}`);

        // Remove from our tracking maps
        this.realtimeSubscriptions.delete(roomId);
        this.pendingSubscriptions.delete(roomId);

        console.log(`✅ Cleaned up realtime subscription for room: ${roomId}`);
      } else {
        console.log(`📡 No subscription found for room ${roomId}, nothing to clean up`);
        // Still clean up pending status in case it's stuck
        this.pendingSubscriptions.delete(roomId);
      }
    } catch (error) {
      console.error(`❌ Error cleaning up realtime subscription for room ${roomId}:`, error);
      // Clean up tracking even on error
      this.realtimeSubscriptions.delete(roomId);
      this.pendingSubscriptions.delete(roomId);
      this.logError('Realtime Cleanup Error', error, { roomId });
    }
  }

  // Remove all realtime channels (useful on logout)
  public cleanupAllRealtime(): void {
    try {
      const roomIds = Array.from(this.realtimeSubscriptions.keys());
      if (roomIds.length === 0 && this.pendingSubscriptions.size === 0) return;
      console.log(`🧹 [Realtime] Cleaning up ALL channels: ${roomIds.join(', ')}`);
      roomIds.forEach((rid) => this.cleanupRealtimeSubscription(rid));
      // Also clear all pending subscriptions
      this.pendingSubscriptions.clear();
      console.log(`✅ [Realtime] All channels and pending subscriptions cleared`);
    } catch (error) {
      console.error('❌ Error cleaning up all realtime channels:', error);
      // Force clear all tracking
      this.realtimeSubscriptions.clear();
      this.pendingSubscriptions.clear();
    }
  }

  // Clear message cache for a room (useful for refresh scenarios)
  async clearMessageCache(roomId: string): Promise<void> {
    try {
      const { messagePersistence } = await import('./messagePersistence');
      messagePersistence.clearCache(roomId);
      console.log(`🗑️ Cleared message cache for room ${roomId}`);
    } catch (error) {
      console.error('❌ Error clearing message cache:', error);
    }
  }

  // Join room with realtime setup (ensures only one active connection per room)
  async joinRoom(roomId: string): Promise<boolean> {
    try {
      if (!this.socket || !this.currentUser) {
        console.error('❌ Socket or user not initialized');
        this.logError('Join Room - Not Initialized', new Error('Socket or user not initialized'), { roomId });
        return false;
      }

      if (!roomId || typeof roomId !== 'string') {
        console.error('❌ Invalid roomId provided to joinRoom:', roomId);
        this.logError('Join Room - Invalid RoomId', new Error('Invalid roomId'), { roomId });
        return false;
      }

      // CRITICAL FIX (Problem 2): Always cleanup old subscription before rejoin
      if (this.realtimeSubscriptions.has(roomId)) {
        console.log('🧹 [REJOIN] Cleaning up existing subscription before rejoin');
        const oldChannel = this.realtimeSubscriptions.get(roomId);
        if (oldChannel) {
          const { supabase } = await import('../lib/supabase');
          await supabase.removeChannel(oldChannel);
          this.realtimeSubscriptions.delete(roomId);
          this.pendingSubscriptions.delete(roomId);
          console.log('✅ [REJOIN] Old subscription cleaned up');
        }
      }

      // Check if already in this room (after cleanup)
      if (this.activeRooms.has(roomId)) {
        console.log(`🏠 User ${this.currentUser.id} is already in room ${roomId}, refreshing connection`);
        // Even if already active, we've cleaned up subscriptions above, so continue to set up fresh ones
      }

      console.log(`🏠 User ${this.currentUser.id} joining room ${roomId}...`);
      console.log(`📊 Active rooms before join: [${Array.from(this.activeRooms).join(', ')}]`);

      // Load messages from database (force refresh to ensure fresh data)
      const { messagePersistence } = await import('./messagePersistence');
      const messages = await messagePersistence.loadMessages(roomId, 'hangout', true); // Force refresh
      
      if (messages.length > 0) {
        console.log(`📦 Loaded ${messages.length} messages from database for room ${roomId}`);
        // Emit messages to UI immediately
        this.socket?.emit('hangout-room-history', messages);
      } else {
        console.log(`📦 No messages found for room ${roomId}`);
      }

      // Set up fresh Supabase Realtime subscription for this room (Problem 2 fix)
      console.log('📡 [JOIN] Setting up fresh realtime subscription');
      await this.setupRealtimeSubscription(roomId);

      // Emit join event to Socket.io (for real-time)
      if (this.socket.connected) {
        this.socket.emit('join-hangout-room', {
          roomId,
          userId: this.currentUser.id
        });

        // Track this room as active
        this.activeRooms.add(roomId);

        console.log(`✅ Successfully joined room ${roomId} via Socket.io`);
        console.log(`📊 Active rooms after join: [${Array.from(this.activeRooms).join(', ')}]`);
        this.logSuccess('Joined Room', {
          roomId,
          activeRoomsCount: this.activeRooms.size,
          activeRooms: Array.from(this.activeRooms)
        });
      } else {
        console.warn(`⚠️ Socket not connected, cannot join room ${roomId}`);
        this.logError('Join Room - Socket Not Connected', new Error('Socket not connected'), { roomId });
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error joining room:', error);
      this.logError('Join Room Error', error, { roomId });
      return false;
    }
  }

  // Leave room with cleanup (handles both Socket.io and Supabase realtime)
  leaveRoom(roomId: string): void {
    try {
      if (!roomId || typeof roomId !== 'string') {
        console.error('❌ Invalid roomId provided to leaveRoom:', roomId);
        return;
      }

      console.log(`👋 User ${this.currentUser?.id || 'unknown'} leaving room ${roomId}...`);
      console.log(`📊 Active rooms before leave: [${Array.from(this.activeRooms).join(', ')}]`);

      // Check if we're actually in this room
      if (!this.activeRooms.has(roomId)) {
        console.log(`🏠 User ${this.currentUser?.id || 'unknown'} is not in room ${roomId}, nothing to leave`);
        return;
      }

      // Clean up realtime subscription
      this.cleanupRealtimeSubscription(roomId);

      // Emit leave event to Socket.io
      if (this.socket && this.currentUser) {
        this.socket.emit('leave-hangout-room', {
          roomId,
          userId: this.currentUser.id
        });

        // Remove this room from active rooms
        this.activeRooms.delete(roomId);

        console.log(`✅ Successfully left room ${roomId} via Socket.io`);
        console.log(`📊 Active rooms after leave: [${Array.from(this.activeRooms).join(', ')}]`);
        this.logSuccess('Left Room', {
          roomId,
          activeRoomsCount: this.activeRooms.size,
          activeRooms: Array.from(this.activeRooms)
        });
      } else {
        console.warn(`⚠️ Socket not available, removing room ${roomId} from active list only`);
        this.activeRooms.delete(roomId);
        console.log(`📊 Active rooms after cleanup: [${Array.from(this.activeRooms).join(', ')}]`);
      }
    } catch (error) {
      console.error('❌ Error leaving room:', error);
      this.logError('Leave Room Error', error, { roomId });
    }
  }

  // Cleanup (disconnect and clean up all resources)
  disconnect(): void {
    console.log(`🔌 Disconnecting user ${this.currentUser?.id || 'unknown'} from hangout service...`);

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('✅ Socket disconnected');
    }

    // Clean up all realtime subscriptions
    console.log(`🧹 Cleaning up ${this.realtimeSubscriptions.size} realtime subscriptions...`);
    this.realtimeSubscriptions.forEach((subscription, roomId) => {
      this.cleanupRealtimeSubscription(roomId);
    });
    this.realtimeSubscriptions.clear();

    // Clear active rooms tracking
    const activeRoomsCount = this.activeRooms.size;
    this.activeRooms.clear();
    console.log(`✅ Cleaned up ${activeRoomsCount} active room connections`);

    // Reset user state
    this.currentUser = null;
    this.currentCampus = null;

    console.log('✅ Hangout service fully disconnected and cleaned up');
  }

  // Get current user info
  getCurrentUser() {
    return this.currentUser;
  }

  // Get current campus info
  getCurrentCampus() {
    return this.currentCampus;
  }

  // Ensure database tables exist (client-side check)
  async ensureDatabaseSetup(): Promise<boolean> {
    try {
      console.log('🔍 Checking database setup for hangout features...');

      // Try to fetch rooms to test if database is accessible
      const rooms = await this.getRooms();
      if (rooms && Array.isArray(rooms)) {
        console.log('✅ Database appears to be properly set up');
        return true;
      }

      console.warn('⚠️ Database may not be properly configured');
      return false;
    } catch (error) {
      console.error('❌ Database setup check failed:', error);
      return false;
    }
  }

  // Refresh Supabase session token if needed
  private async refreshAuthToken(): Promise<string | null> {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('❌ Error refreshing auth token:', error);
        this.logError('Token Refresh Error', error);
        return null;
      }

      if (session?.access_token) {
        console.log('✅ Auth token refreshed successfully');
        return session.access_token;
      }

      return null;
    } catch (error) {
      console.error('❌ Exception refreshing auth token:', error);
      this.logError('Token Refresh Exception', error);
      return null;
    }
  }

  // Get current valid access token
  private async getCurrentAccessToken(): Promise<string | null> {
    try {
      // First try to get from current Supabase session
      const { supabase } = await import('../lib/supabase');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('⚠️ Error getting session:', error);
      }

      if (session?.access_token) {
        return session.access_token;
      }

      // Fallback to localStorage
      const authStorage = typeof window !== 'undefined' ? localStorage.getItem('nexus-auth') : null;
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          const token = parsed?.currentSession?.access_token || parsed?.access_token || parsed?.session?.access_token;
          if (token) {
            console.log('✅ Using token from localStorage');
            return token;
          }
        } catch (parseError) {
          console.warn('⚠️ Error parsing auth storage:', parseError);
        }
      }

      console.warn('⚠️ No valid access token found');
      return null;
    } catch (error) {
      console.error('❌ Error getting access token:', error);
      return null;
    }
  }

  // Enhanced API call with authentication and retry logic
  private async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      let token = await this.getCurrentAccessToken();

      // If no token, try to refresh
      if (!token) {
        console.log('🔄 No token found, attempting to refresh...');
        token = await this.refreshAuthToken();
      }

      const headers = new Headers(options.headers || {});

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      } else {
        console.warn('⚠️ Making API call without authentication token');
      }

      if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });

      // If we get 401, try refreshing token and retry once
      if (response.status === 401 && token) {
        console.log('🔄 Got 401, attempting token refresh and retry...');
        const newToken = await this.refreshAuthToken();

        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`);
          const retryResponse = await fetch(url, {
            ...options,
            headers,
            credentials: 'include'
          });

          if (retryResponse.ok) {
            console.log('✅ API call succeeded after token refresh');
            return retryResponse;
          }
        }
      }

      return response;
    } catch (error) {
      console.error('❌ Authenticated fetch error:', error);
      this.logError('Authenticated Fetch Error', error, { url });
      throw error;
    }
  }

  // Enhanced error logging for debugging
  private async logError(context: string, error: any, additionalData?: any): Promise<void> {
    const hasToken = await this.getCurrentAccessToken() ? true : false;
    console.error(`❌ HangoutService ${context}:`, {
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      additionalData,
      userId: this.currentUser?.id,
      campusId: this.currentCampus?.id,
      hasToken
    });
  }

  // Enhanced success logging
  private logSuccess(context: string, data?: any): void {
    console.log(`✅ HangoutService ${context}:`, {
      timestamp: new Date().toISOString(),
      data,
      userId: this.currentUser?.id
    });
  }

  // Fallback room management for offline/error scenarios
  private getFallbackRooms(): ChatRoom[] {
    try {
      const cached = localStorage.getItem('hangout-rooms-cache');
      if (!cached) {
        console.log('📦 No cached rooms in localStorage');
        return [];
      }
      
      const parsed = JSON.parse(cached);
      if (!Array.isArray(parsed.rooms)) {
        console.warn('⚠️ Invalid cached rooms format');
        return [];
      }
      
      // Check if cache is expired (24 hours)
      const cacheAge = Date.now() - (parsed.timestamp || 0);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheAge > maxAge) {
        console.log('📦 Cached rooms expired, clearing cache');
        localStorage.removeItem('hangout-rooms-cache');
        return [];
      }
      
      // Map cached rooms back to ChatRoom objects with proper dates
      const rooms = parsed.rooms.map((room: any) => ({
        ...room,
        createdAt: new Date(room.createdAt),
        lastActivity: new Date(room.lastActivity)
      }));
      
      console.log(`📦 Loaded ${rooms.length} rooms from cache`);
      return rooms;
    } catch (error) {
      console.error('❌ Error loading fallback rooms:', error);
      return [];
    }
  }

  private cacheFallbackRooms(rooms: ChatRoom[]): void {
    try {
      const cacheData = {
        rooms: rooms.map(room => {
          // Safely handle date conversion
          const createdAt = room.createdAt instanceof Date && !isNaN(room.createdAt.getTime()) 
            ? room.createdAt.toISOString() 
            : new Date().toISOString();
          
          const lastActivity = room.lastActivity instanceof Date && !isNaN(room.lastActivity.getTime())
            ? room.lastActivity.toISOString()
            : createdAt; // Fallback to createdAt if lastActivity is invalid
          
          return {
            ...room,
            createdAt,
            lastActivity
          };
        }),
        timestamp: Date.now()
      };
      
      localStorage.setItem('hangout-rooms-cache', JSON.stringify(cacheData));
      console.log(`💾 Cached ${rooms.length} rooms to localStorage`);
    } catch (error) {
      console.error('❌ Error caching fallback rooms:', error);
      // Don't throw - caching is optional
    }
  }

  // Debug method to check current state (comprehensive debugging info)
  debugState(): any {
    return {
      // Connection status
      socketConnected: this.socket?.connected || false,
      socketId: this.socket?.id || null,

      // User info
      currentUser: this.currentUser?.id || null,
      currentCampus: this.currentCampus?.id || null,

      // Room tracking
      activeRooms: Array.from(this.activeRooms),
      activeRoomsCount: this.activeRooms.size,

      // Realtime subscriptions
      realtimeSubscriptionsCount: this.realtimeSubscriptions.size,
      realtimeSubscriptions: Array.from(this.realtimeSubscriptions.keys()),

      // System info
      timestamp: new Date().toISOString(),
      hasValidUser: !!(this.socket && this.currentUser),
      canJoinRooms: !!(this.socket?.connected && this.currentUser)
    };
  }
}

export const hangoutService = new HangoutService();
