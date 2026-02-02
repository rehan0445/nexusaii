/**
 * Centralized WebSocket Configuration
 * Handles Socket.io connections with automatic reconnection and error handling
 */

import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from './config';
import { getApiBaseUrl } from './apiConfig';

interface SocketConfig {
  url?: string;
  userId?: string;
  campusId?: string;
  token?: string;
  options?: any;
}

class SocketManager {
  private readonly sockets: Map<string, Socket> = new Map();
  private readonly reconnectAttempts: Map<string, number> = new Map();
  private readonly maxReconnectAttempts = API_CONFIG.websocket.reconnectAttempts;
  private readonly reconnectDelay = API_CONFIG.websocket.reconnectDelay;
  private sessionBridgePromise: Promise<boolean> | null = null;

  // Get or create a socket connection
  async getSocket(config: SocketConfig = {}): Promise<Socket | null> {
    const {
      url,
      userId = 'anonymous',
      campusId,
      token,
      options = {}
    } = config;

    // Wait for session bridge to complete if needed
    if (this.sessionBridgePromise) {
      console.log('🔄 Waiting for session bridge to complete...');
      try {
        await this.sessionBridgePromise;
        console.log('✅ Session bridge completed, proceeding with socket creation');
      } catch (error) {
        console.warn('⚠️ Session bridge failed, continuing with socket creation');
      }
    }

    // Use provided URL or auto-detect
    const socketUrl = url || getApiBaseUrl();
    const socketKey = `${socketUrl}-${userId}-${campusId || 'default'}`;

    // Return existing socket if available and connected
    const existingSocket = this.sockets.get(socketKey);
    if (existingSocket?.connected) {
      console.log('✅ Reusing existing socket connection');
      return existingSocket;
    }

    // Clean up existing socket if disconnected
    if (existingSocket) {
      existingSocket.disconnect();
      this.sockets.delete(socketKey);
    }

    try {
      // Get authentication token
      let authToken = token;
      if (!authToken) {
        const authData = localStorage.getItem('nexus-auth');
        if (authData) {
          try {
            const parsed = JSON.parse(authData);
            authToken = parsed?.currentSession?.access_token || 
                       parsed?.access_token || 
                       parsed?.session?.access_token;
          } catch (error) {
            console.warn('⚠️ Error parsing auth data for socket:', error);
          }
        }
      }

      // Create new socket with enhanced configuration
      const socketOptions = {
        transports: ['websocket', 'polling'], // Prioritize WebSocket, fallback to polling
        timeout: 20000, // Increased timeout for WebSocket handshake
        forceNew: true, // Force new connection to avoid cached connection issues
        reconnection: API_CONFIG.features.autoReconnect,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: this.reconnectDelay * 5,
        maxReconnectionAttempts: this.maxReconnectAttempts,
        // Enhanced authentication
        auth: async (cb: Function) => {
          try {
            // Wait for session bridge if needed
            if (socketManager.sessionBridgePromise) {
              await socketManager.sessionBridgePromise;
            }

            const authData = localStorage.getItem('nexus-auth');
            if (authData) {
              const parsed = JSON.parse(authData);
              const token = parsed?.currentSession?.access_token ||
                           parsed?.access_token ||
                           parsed?.session?.access_token;

              if (token) {
                console.log('🔑 Using authenticated socket connection');
                cb({ token, userId, campusId });
                return;
              }
            }

            console.log('🔑 Using anonymous socket connection');
            cb({ userId, campusId });
          } catch (error) {
            console.error('❌ Socket auth error:', error);
            cb({ userId, campusId });
          }
        },

        extraHeaders: {
          // Dynamic header function for better auth handling
          get Authorization() {
            try {
              const authData = localStorage.getItem('nexus-auth');
              if (authData) {
                const parsed = JSON.parse(authData);
                const token = parsed?.currentSession?.access_token ||
                             parsed?.access_token ||
                             parsed?.session?.access_token;
                return token ? `Bearer ${token}` : undefined;
              }
            } catch (error) {
              console.warn('⚠️ Error getting auth token for socket headers:', error);
            }
            return undefined;
          }
        },
        // WebSocket-specific options for better connection handling
        upgrade: true,
        rememberUpgrade: true,
        ...options
      };

      console.log(`🔌 Creating socket connection to: ${socketUrl}`);
      console.log(`🔧 Socket options:`, {
        transports: socketOptions.transports,
        timeout: socketOptions.timeout,
        reconnection: socketOptions.reconnection,
        auth: socketOptions.auth ? 'provided' : 'none'
      });

      const socket = io(socketUrl, socketOptions);

      // Set up event handlers
      this.setupSocketHandlers(socket, socketKey);

      // Add connection debugging
      socket.on('connecting', (transport) => {
        console.log(`🔌 Socket connecting with transport: ${transport}`);
      });

      socket.on('connect_attempt', (attemptNumber) => {
        console.log(`🔌 Socket connection attempt ${attemptNumber}`);
      });

      // Store socket
      this.sockets.set(socketKey, socket);

      return socket;
    } catch (error) {
      console.error('❌ Error creating socket connection:', error);
      return null;
    }
  }

  // Set up socket event handlers
  private setupSocketHandlers(socket: Socket, socketKey: string): void {
    socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      this.reconnectAttempts.set(socketKey, 0);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.handleReconnection(socketKey, error);
    });

    socket.on('disconnect', (reason) => {
      console.log('📡 Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, reconnect manually
        setTimeout(() => {
          socket.connect();
        }, this.reconnectDelay);
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts.set(socketKey, 0);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Socket reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
      this.reconnectAttempts.set(socketKey, attemptNumber);
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
      this.handleReconnection(socketKey, error);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after maximum attempts');
      this.cleanupSocket(socketKey);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  // Handle reconnection logic
  private handleReconnection(socketKey: string, error: any): void {
    const attempts = this.reconnectAttempts.get(socketKey) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error('❌ Maximum reconnection attempts reached');
      this.cleanupSocket(socketKey);
      return;
    }

    // Exponential backoff
    const delay = Math.min(this.reconnectDelay * Math.pow(2, attempts), 5000);
    console.log(`🔄 Scheduling reconnection in ${delay}ms (attempt ${attempts + 1})`);
    
    setTimeout(() => {
      const socket = this.sockets.get(socketKey);
      if (socket && !socket.connected) {
        socket.connect();
      }
    }, delay);
  }

  // Clean up socket connection
  private cleanupSocket(socketKey: string): void {
    const socket = this.sockets.get(socketKey);
    if (socket) {
      socket.disconnect();
      this.sockets.delete(socketKey);
      this.reconnectAttempts.delete(socketKey);
      console.log('🧹 Cleaned up socket connection');
    }
  }

  // Disconnect all sockets
  disconnectAll(): void {
    this.sockets.forEach((socket, key) => {
      socket.disconnect();
      this.cleanupSocket(key);
    });
    console.log('🧹 Disconnected all socket connections');
  }

  // Get socket connection status
  getConnectionStatus(socketKey: string): 'connected' | 'disconnected' | 'connecting' | 'unknown' {
    const socket = this.sockets.get(socketKey);
    if (!socket) return 'unknown';
    if (socket.connected) return 'connected';
    if (socket.connecting) return 'connecting';
    return 'disconnected';
  }

  // Get all active socket keys
  getActiveSockets(): string[] {
    return Array.from(this.sockets.keys());
  }

  // Initialize session bridge promise
  async initializeSessionBridge(): Promise<boolean> {
    if (this.sessionBridgePromise) {
      return this.sessionBridgePromise;
    }

    this.sessionBridgePromise = this.performSessionBridge();
    return this.sessionBridgePromise;
  }

  private async performSessionBridge(): Promise<boolean> {
    try {
      const authData = localStorage.getItem('nexus-auth');
      if (!authData) {
        console.log('🔐 No auth data found, skipping session bridge');
        return true;
      }

      const parsed = JSON.parse(authData);
      const token = parsed?.currentSession?.access_token ||
                   parsed?.access_token ||
                   parsed?.session?.access_token;

      if (!token) {
        console.log('🔐 No access token found, skipping session bridge');
        return true;
      }

      console.log('🔐 Performing session bridge...');
      const response = await fetch(`${getApiBaseUrl()}/api/auth/session/bridge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        console.log('✅ Session bridge successful');
        return true;
      } else {
        console.error('❌ Session bridge failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Session bridge error:', error);
      return false;
    }
  }
}

// Create singleton instance
export const socketManager = new SocketManager();

// Export convenience functions
export async function createSocket(config: SocketConfig = {}): Promise<Socket | null> {
  return socketManager.getSocket(config);
}

export function getSocketUrl(): string {
  return getWebSocketUrl();
}

export function disconnectAllSockets(): void {
  socketManager.disconnectAll();
}

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    socketManager.disconnectAll();
  });
}

export default socketManager;
