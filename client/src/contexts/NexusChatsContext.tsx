import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

export interface NexusChat {
  id: string;
  type: 'hangout_palace' | 'hangout_room' | 'companion';
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  route: string;
}

interface NexusChatsContextType {
  chats: NexusChat[];
  isLoading: boolean;
  totalUnread: number;
  error: string | null;
  refreshChats: (force?: boolean) => Promise<void>;
  markAsRead: (chatId: string, chatType: string) => Promise<void>;
  updateCompanionChat: (characterId: string, characterName: string, characterAvatar: string, lastMessage: string) => Promise<void>;
  isOpen: boolean;
  openChats: () => void;
  closeChats: () => void;
  toggleChats: () => void;
  clearError: () => void;
  isInRoom: (roomId: string) => boolean;
}

const NexusChatsContext = createContext<NexusChatsContextType | undefined>(undefined);

export const useNexusChats = () => {
  const context = useContext(NexusChatsContext);
  if (!context) {
    throw new Error('useNexusChats must be used within NexusChatsProvider');
  }
  return context;
};

interface NexusChatsProviderProps {
  children: React.ReactNode;
}

export const NexusChatsProvider: React.FC<NexusChatsProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<NexusChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple caching mechanism to prevent redundant API calls
  const lastFetchRef = React.useRef<{ timestamp: number; userId: string | null }>({
    timestamp: 0,
    userId: null
  });
  const CACHE_DURATION = 30000; // 30 seconds cache

  const refreshChats = useCallback(async (force = false) => {
    if (!currentUser) {
      setChats([]);
      setTotalUnread(0);
      return;
    }

    // Check if we should use cached data (unless forced refresh)
    const now = Date.now();
    const lastFetch = lastFetchRef.current;

    if (!force && lastFetch.userId === currentUser.uid && (now - lastFetch.timestamp) < CACHE_DURATION) {
      console.log('📋 Using cached nexus chats data');
      return;
    }

    console.log('🔄 Fetching fresh nexus chats data');
    setIsLoading(true);
    setError(null);

    try {
      // Check if server is reachable first
      const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
      try {
        await axios.get(`${serverUrl}/api/health`, { timeout: 5000 });
      } catch (healthError) {
        console.warn('⚠️ Backend server health check failed:', healthError.message);
        setError('Backend server is not responding. Please ensure the server is running on port 8002.');
        return;
      }

      const response = await axios.get('/api/nexus-chats', {
        headers: {
          'x-user-id': currentUser.uid
        },
        timeout: 10000
      });

      if (response.data.success) {
        setChats(response.data.chats);
        setTotalUnread(response.data.totalUnread);
        setError(null);

        // Update cache timestamp
        lastFetchRef.current = {
          timestamp: Date.now(),
          userId: currentUser.uid
        };
      } else {
        setError(response.data.message || 'Failed to fetch chats');
      }
    } catch (error) {
      console.error('❌ Error fetching nexus chats:', error);

      // Provide user-friendly error messages
      if (error.code === 'ECONNREFUSED') {
        setError('Unable to connect to backend server. Please ensure the server is running on port 8002.');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        setError('Network connection failed. Please check your internet connection.');
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 404) {
        setError('Chat service not found. Please contact support.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to load chats. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const markAsRead = useCallback(async (chatId: string, chatType: string) => {
    if (!currentUser) return;

    try {
      await axios.post('/api/nexus-chats/mark-read', {
        chatId,
        chatType
      }, {
        headers: {
          'x-user-id': currentUser.uid
        },
        timeout: 10000
      });

      // Update local state
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
        )
      );

      // Recalculate total unread
      setTotalUnread(prev => {
        const chat = chats.find(c => c.id === chatId);
        return Math.max(0, prev - (chat?.unreadCount || 0));
      });

      setError(null);
    } catch (error) {
      console.error('❌ Error marking chat as read:', error);

      // Provide user-friendly error messages for mark as read
      if (error.code === 'ECONNREFUSED') {
        setError('Unable to connect to server. Please ensure the backend server is running.');
      } else if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Failed to mark chat as read. Please try again.');
      }
    }
  }, [currentUser, chats]);

  const updateCompanionChat = useCallback(async (
    characterId: string, 
    characterName: string, 
    characterAvatar: string, 
    lastMessage: string
  ) => {
    if (!currentUser) return;

    try {
      await axios.post('/api/nexus-chats/update-companion-chat', {
        characterId,
        characterName,
        characterAvatar,
        lastMessage
      }, {
        headers: {
          'x-user-id': currentUser.uid
        }
      });

      // Refresh chats to show updated info
      await refreshChats();
    } catch (error) {
      console.error('Error updating companion chat:', error);
    }
  }, [currentUser, refreshChats]);

  const openChats = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChats = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChats = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isInRoom = useCallback((roomId: string): boolean => {
    // For nexus chats context, we don't track rooms, so always return false
    // This is mainly used by hangout context
    return false;
  }, []);

  // Load chats on mount and when user changes
  // Note: We rely on real-time updates instead of polling
  useEffect(() => {
    if (currentUser) {
      refreshChats(true); // Force refresh on user change
    }
  }, [currentUser, refreshChats]);

  const value = useMemo<NexusChatsContextType>(() => ({
    chats,
    isLoading,
    totalUnread,
    error,
    refreshChats,
    markAsRead,
    updateCompanionChat,
    isOpen,
    openChats,
    closeChats,
    toggleChats,
    clearError,
    isInRoom
  }), [chats, isLoading, totalUnread, error, refreshChats, markAsRead, updateCompanionChat, isOpen, openChats, closeChats, toggleChats, clearError, isInRoom]);

  return (
    <NexusChatsContext.Provider value={value}>
      {children}
    </NexusChatsContext.Provider>
  );
};

export default NexusChatsContext;

