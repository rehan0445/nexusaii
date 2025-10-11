import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { ChatRoom, ChatMessage, User, ModerationAction } from '../services/hangoutService';

interface HangoutContextType {
  // State
  rooms: ChatRoom[];
  selectedRoom: ChatRoom | null;
  messages: ChatMessage[];
  onlineUsers: User[];
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;

  // Actions
  selectRoom: (room: ChatRoom) => void;
  createRoom: (roomData: any) => Promise<boolean>;
  joinRoom: (roomId: string) => Promise<boolean>;
  leaveRoom: (roomId: string) => Promise<boolean>;
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void;
  sendMessage: (content: string, characterId?: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string, emoji: string) => void;
  reportContent: (report: any) => Promise<boolean>;
  takeModerationAction: (action: any) => Promise<boolean>;

  // Moderation
  moderationActions: ModerationAction[];
  isModerator: boolean;
  // Requests
  joinRequests: Array<{ id: string; roomId: string; userId: string; name: string; info?: string }>;
  requestJoin: (roomId: string) => Promise<boolean>;
  approveJoin: (requestId: string) => Promise<boolean>;
  rejectJoin: (requestId: string) => Promise<boolean>;

  // Utility methods
  clearError: () => void;
  isInRoom: (roomId: string) => boolean;
}

const HangoutContext = createContext<HangoutContextType | undefined>(undefined);

export const useHangout = () => {
  const context = useContext(HangoutContext);
  if (!context) {
    throw new Error('useHangout must be used within a HangoutProvider');
  }
  return context;
};

interface HangoutProviderProps {
  children: ReactNode;
}

export const HangoutProvider: React.FC<HangoutProviderProps> = ({ children }) => {
  // ============================================
  // HANGOUT DISABLED - Coming Soon
  // All socket connections and API calls are disabled
  // ============================================
  
  // State (all empty/disabled)
  const [rooms] = useState<ChatRoom[]>([]);
  const [selectedRoom] = useState<ChatRoom | null>(null);
  const [messages] = useState<ChatMessage[]>([]);
  const [onlineUsers] = useState<User[]>([]);
  const [moderationActions] = useState<ModerationAction[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [isModerator] = useState(false);
  const [isLoadingMessages] = useState(false);
  const [joinRequests] = useState<Array<{ id: string; roomId: string; userId: string; name: string; info?: string }>>([]);

  // Disabled Actions (all return empty/false)
  const selectRoom = useCallback(() => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
  }, []);

  const createRoom = useCallback(async () => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
    return false;
  }, []);

  const joinRoom = useCallback(async () => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
    return false;
  }, []);

  const requestJoin = useCallback(async () => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
    return false;
  }, []);

  const approveJoin = useCallback(async () => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
    return false;
  }, []);

  const rejectJoin = useCallback(async () => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
    return false;
  }, []);

  const leaveRoom = useCallback(async () => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
    return false;
  }, []);

  const sendMessage = useCallback(() => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
  }, []);

  const addReaction = useCallback(() => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
  }, []);

  const removeReaction = useCallback(() => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
  }, []);

  const reportContent = useCallback(async () => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
      return false;
  }, []);

  const takeModerationAction = useCallback(async () => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
      return false;
  }, []);

  const updateRoom = useCallback(() => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
  }, []);

  const clearError = useCallback(() => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
  }, []);

  const isInRoom = useCallback(() => {
    console.log('⚠️ Hangout is disabled - Coming Soon');
    return false;
  }, []);

  const value: HangoutContextType = useMemo(() => ({
    // State
    rooms,
    selectedRoom,
    messages,
    onlineUsers,
    isLoading,
    isLoadingMessages,
    error,

    // Actions
    selectRoom,
    createRoom,
    joinRoom,
    leaveRoom,
    updateRoom,
    sendMessage,
    addReaction,
    removeReaction,
    reportContent,
    takeModerationAction,

    // Moderation
    moderationActions,
    isModerator,
    // Requests
    joinRequests,
    requestJoin,
    approveJoin,
    rejectJoin,

    // Utility methods
    clearError,
    isInRoom
  }), [
    rooms,
    selectedRoom,
    messages,
    onlineUsers,
    isLoading,
    isLoadingMessages,
    error,
    selectRoom,
    createRoom,
    joinRoom,
    leaveRoom,
    updateRoom,
    sendMessage,
    addReaction,
    removeReaction,
    reportContent,
    takeModerationAction,
    moderationActions,
    isModerator,
    joinRequests,
    requestJoin,
    approveJoin,
    rejectJoin,
    clearError,
    isInRoom
  ]);

  return (
    <HangoutContext.Provider value={value}>
      {children}
    </HangoutContext.Provider>
  );
};
