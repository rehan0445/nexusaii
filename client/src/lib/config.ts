/**
 * Application Configuration
 * Centralized configuration management with environment variable support
 */

// Backend API Configuration
export const API_CONFIG = {
  // Enhanced server URL detection for better network compatibility
  getServerUrl: (): string => {
    const explicitUrl = import.meta.env.VITE_SERVER_URL;
    if (explicitUrl) {
      return explicitUrl;
    }

    // Auto-detect based on current location with better network handling
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;

    // Handle localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:8002`;
    }

    // Handle private network IPs (10.x.x.x, 192.168.x.x)
    if (hostname.match(/^(10\.|192\.168\.)/)) {
      return `${protocol}//${hostname}:8002`;
    }

    // Handle public IPs and domains
    if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      return `${protocol}//${hostname}:8002`;
    }

    // Production deployment (Railway, Vercel, etc.) - same domain for frontend & backend
    // Don't add port number, use the same origin
    if (hostname.includes('railway.app') || hostname.includes('vercel.app') || !port || port === '80' || port === '443') {
      return `${protocol}//${hostname}`;
    }

    // Default fallback
    return `${protocol}//${hostname}:8002`;
  },

  // WebSocket Configuration
  websocket: {
    timeout: Number(import.meta.env.VITE_WS_TIMEOUT) || 10000,
    reconnectAttempts: Number(import.meta.env.VITE_WS_RECONNECT_ATTEMPTS) || 5,
    reconnectDelay: Number(import.meta.env.VITE_WS_RECONNECT_DELAY) || 1000,
    transports: ['websocket', 'polling'] as const,
  },

  // Message Persistence Configuration
  messagePersistence: {
    cacheSize: Number(import.meta.env.VITE_MESSAGE_CACHE_SIZE) || 100,
    cacheExpiry: Number(import.meta.env.VITE_MESSAGE_CACHE_EXPIRY) || 5 * 60 * 1000, // 5 minutes
    autoSaveInterval: 30 * 1000, // 30 seconds
  },

  // Development Settings
  debug: {
    enabled: import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.DEV,
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
    showNetworkErrors: import.meta.env.DEV,
  },

  // Feature Flags
  features: {
    messagePersistence: true,
    autoReconnect: true,
    offlineSupport: true,
    messageCaching: true,
  },
};

// Network Configuration
export const NETWORK_CONFIG = {
  // Request timeouts
  apiTimeout: 45000, // Increased to 45s for AI generation
  socketTimeout: 10000,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  
  // CORS and security
  allowCredentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-User-ID'],
};

// UI Configuration
export const UI_CONFIG = {
  // Animation durations
  animations: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  
  // Loading states
  loading: {
    messageTimeout: 5000,
    connectionTimeout: 10000,
  },
  
  // Error messages
  messages: {
    connectionLost: 'Connection lost. Attempting to reconnect...',
    connectionRestored: 'Connection restored!',
    messageFailed: 'Failed to send message. Please try again.',
    loadFailed: 'Failed to load messages. Please refresh the page.',
  },
};

// Export default configuration
export default {
  api: API_CONFIG,
  network: NETWORK_CONFIG,
  ui: UI_CONFIG,
};

// Utility function to get current configuration
export function getConfig() {
  return {
    serverUrl: API_CONFIG.getServerUrl(),
    websocketUrl: API_CONFIG.getServerUrl().replace(/^http/, 'ws'),
    debug: API_CONFIG.debug.enabled,
    features: API_CONFIG.features,
  };
}

// Log configuration on startup
if (API_CONFIG.debug.enabled) {
  console.log('🔧 Application Configuration:', getConfig());
}
