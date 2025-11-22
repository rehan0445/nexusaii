export interface MiniChat {
  id: string;
  name: string;
  roomId: string;
  creator: string;
  creatorId: string;
  members: ChatMember[];
  lastActivity: Date;
  description?: string;
  isPrivate: boolean;
  messages: Message[];
  category: string;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  unreadCount: number;
  chatColor: string;
  settings: ChatSettings;
  isArchived: boolean;
  expiresAt?: Date;
}

export interface ChatMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'member';
  isOnline: boolean;
  lastSeen: Date;
  joinedAt: Date;
  permissions: string[];
}

export interface Message {
  id: string;
  content: string;
  author: string;
  authorId: string;
  timestamp: Date;
  isSystem?: boolean;
  isEdited?: boolean;
  editedAt?: Date;
  replyTo?: string;
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
  type: 'text' | 'file' | 'voice' | 'system' | 'poll';
  isDeleted?: boolean;
  readBy: string[];
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file' | 'audio' | 'video';
  size: number;
}

export interface ChatSettings {
  allowFileUploads: boolean;
  allowVoiceMessages: boolean;
  moderationLevel: 'low' | 'medium' | 'high';
  maxMessageLength: number;
  readReceipts: boolean;
  typingIndicators: boolean;
  messageEncryption: boolean;
}

export interface TypingUser {
  id: string;
  name: string;
}

export interface StudySession {
  id: string;
  name: string;
  duration: number;
  isActive: boolean;
  participants: string[];
  startTime?: Date;
}

export interface ChatFilter {
  type: 'all' | 'unread' | 'favorites' | 'archived';
  category?: string;
  tags?: string[];
}

export interface ChatSort {
  by: 'activity' | 'name' | 'members' | 'created';
  direction: 'asc' | 'desc';
}

// Legacy compatibility interfaces for existing components
export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  messages: ChatMessage[];
  timeSpent?: number;
  trending?: number;
  activeNow?: number;
  lastActive?: Date;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  avatar?: string;
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  poll?: {
    id: string;
    question: string;
    options: string[];
    votes: Record<string, string>;
    createdBy: string;
    timestamp: Date;
  };
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export const CHAT_CATEGORIES = [
  'Study', 'Project', 'Social', 'Computer Science', 'Mathematics', 
  'Physics', 'Biology', 'Chemistry', 'Engineering', 'Business', 
  'Arts', 'Other'
] as const;

export const EMOJI_OPTIONS = [
  '👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '🎉', '💯', '🚀'
] as const;

export const CHAT_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', 
  '#ef4444', '#ec4899', '#06b6d4'
] as const; 