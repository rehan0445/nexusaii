import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

// Types
export interface GroupChat {
  id: string;
  name: string;
  description: string;
  icon: string;
  banner: string;
  memberCount: number;
  maxMembers: number;
  rules: string[];
  admin: {
    id: string;
    name: string;
    avatar: string;
  };
  coAdmins: Array<{
    id: string;
    name: string;
    avatar: string;
  }>;
  isPrivate: boolean;
  joinRequestRequired: boolean;
  customRoles: Array<{
    id: string;
    name: string;
    permissions: string[];
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    author: string;
    timestamp: Date;
    type: 'text' | 'image' | 'poll';
  }>;
  tags: string[];
  createdAt: Date;
  lastActivity: Date;
}

export interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  groupId: string;
  timestamp: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface GroupMember {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  role: 'admin' | 'co-admin' | 'member';
  customRole?: string;
  joinedAt: Date;
  lastActive: Date;
  isBanned: boolean;
  banExpiry?: Date;
}

interface GroupChatContextType {
  groupChats: GroupChat[];
  joinRequests: JoinRequest[];
  currentGroupChat: GroupChat | null;
  members: GroupMember[];
  isLoading: boolean;
  error: string | null;
  
  // Group Chat Management
  createGroupChat: (data: Partial<GroupChat>) => Promise<boolean>;
  updateGroupChat: (id: string, data: Partial<GroupChat>) => Promise<boolean>;
  deleteGroupChat: (id: string) => Promise<boolean>;
  
  // Join/Leave Management
  requestToJoin: (groupId: string) => Promise<boolean>;
  approveJoinRequest: (requestId: string) => Promise<boolean>;
  rejectJoinRequest: (requestId: string) => Promise<boolean>;
  joinGroupChat: (groupId: string) => Promise<boolean>;
  leaveGroupChat: (groupId: string) => Promise<boolean>;
  
  // Member Management
  addMember: (groupId: string, userId: string) => Promise<boolean>;
  removeMember: (groupId: string, userId: string) => Promise<boolean>;
  promoteToCoAdmin: (groupId: string, userId: string) => Promise<boolean>;
  demoteFromCoAdmin: (groupId: string, userId: string) => Promise<boolean>;
  transferOwnership: (groupId: string, userId: string) => Promise<boolean>;
  banMember: (groupId: string, userId: string, duration?: number) => Promise<boolean>;
  unbanMember: (groupId: string, userId: string) => Promise<boolean>;
  
  // Role Management
  createCustomRole: (groupId: string, roleName: string, permissions: string[]) => Promise<boolean>;
  assignCustomRole: (groupId: string, userId: string, roleId: string) => Promise<boolean>;
  
  // Announcements
  createAnnouncement: (groupId: string, announcement: Partial<GroupChat['announcements'][0]>) => Promise<boolean>;
  deleteAnnouncement: (groupId: string, announcementId: string) => Promise<boolean>;
  
  // Utility
  getGroupChat: (id: string) => GroupChat | null;
  getMembers: (groupId: string) => GroupMember[];
  getUserRole: (groupId: string, userId: string) => string | null;
  canUserJoin: (groupId: string, userId: string) => boolean;
}

const GroupChatContext = createContext<GroupChatContextType | undefined>(undefined);

export const useGroupChat = () => {
  const context = useContext(GroupChatContext);
  if (!context) {
    throw new Error('useGroupChat must be used within a GroupChatProvider');
  }
  return context;
};

// Mock data for development
const mockGroupChats: GroupChat[] = [
  {
    id: 'gc1',
    name: 'Tech Enthusiasts',
    description: 'A community for technology lovers, developers, and innovators to share knowledge and collaborate on projects.',
    icon: '💻',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800',
    memberCount: 1247,
    maxMembers: 2000,
    rules: [
      'Be respectful to all members',
      'No spam or self-promotion',
      'Keep discussions relevant to technology',
      'No NSFW content',
      'Follow community guidelines'
    ],
    admin: {
      id: 'admin1',
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
    },
    coAdmins: [
      {
        id: 'coadmin1',
        name: 'Sarah Johnson',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100'
      },
      {
        id: 'coadmin2',
        name: 'Mike Wilson',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
      }
    ],
    isPrivate: false,
    joinRequestRequired: false,
    customRoles: [
      {
        id: 'role1',
        name: 'Mentor',
        permissions: ['help_members', 'moderate_discussions']
      },
      {
        id: 'role2',
        name: 'Recruiter',
        permissions: ['share_jobs', 'connect_members']
      }
    ],
    announcements: [
      {
        id: 'ann1',
        title: 'Welcome to Tech Enthusiasts!',
        content: 'Welcome to our amazing community! Please read the rules and introduce yourself.',
        author: 'Alex Chen',
        timestamp: new Date('2024-01-15'),
        type: 'text'
      }
    ],
    tags: ['technology', 'programming', 'innovation', 'startup'],
    createdAt: new Date('2024-01-01'),
    lastActivity: new Date()
  },
  {
    id: 'gc2',
    name: 'Gaming Squad',
    description: 'Join our gaming community for tournaments, discussions, and finding teammates for your favorite games.',
    icon: '🎮',
    banner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    memberCount: 892,
    maxMembers: 2000,
    rules: [
      'Respect all players',
      'No cheating or hacking discussions',
      'Keep it family-friendly',
      'No toxic behavior',
      'Share gaming content responsibly'
    ],
    admin: {
      id: 'admin2',
      name: 'Gamer Pro',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
    },
    coAdmins: [
      {
        id: 'coadmin3',
        name: 'Luna Star',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100'
      }
    ],
    isPrivate: false,
    joinRequestRequired: true,
    customRoles: [
      {
        id: 'role3',
        name: 'Tournament Organizer',
        permissions: ['organize_events', 'manage_tournaments']
      }
    ],
    announcements: [],
    tags: ['gaming', 'esports', 'tournaments', 'multiplayer'],
    createdAt: new Date('2024-01-10'),
    lastActivity: new Date()
  }
];

export const GroupChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [currentGroupChat] = useState<GroupChat | null>(null);
  const [members] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch group chats from backend on component mount
  useEffect(() => {
    const fetchGroupChats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to fetch from Dark Room API first
        const response = await fetch('/api/v1/darkroom/rooms');
        if (response.ok) {
          const data = await response.json();
          // Convert Dark Room data to GroupChat format
          const convertedChats: GroupChat[] = data.map((room: any) => ({
            id: room.id,
            name: room.name,
            description: room.description || '',
            icon: room.iconEmoji || '💬',
            banner: room.banner || '',
            memberCount: room.userCount || 0,
            maxMembers: 2000,
            rules: [],
            admin: {
              id: room.createdBy || 'unknown',
              name: room.createdBy || 'Unknown',
              avatar: ''
            },
            coAdmins: [],
            isPrivate: false,
            joinRequestRequired: false,
            customRoles: [],
            announcements: [],
            tags: room.tags || [],
            createdAt: new Date(room.createdAt),
            lastActivity: new Date()
          }));
          
          setGroupChats(convertedChats);
        } else {
          // Fallback to mock data if API fails
          console.warn('Failed to fetch from Dark Room API, using mock data');
          setGroupChats(mockGroupChats);
        }
      } catch (err) {
        console.error('Failed to fetch group chats:', err);
        setError('Failed to load group chats');
        // Fallback to mock data
        setGroupChats(mockGroupChats);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupChats();
  }, []);

  // Group Chat Management
  const createGroupChat = async (data: Partial<GroupChat>): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Try to create in backend first
      try {
        const response = await fetch('/api/v1/darkroom/create-group', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name || 'New Group Chat',
            description: data.description || '',
            tags: data.tags || [],
            createdBy: 'current-user' // You might want to get this from auth context
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          // Refresh the group chats list
          const refreshResponse = await fetch('/api/v1/darkroom/rooms');
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const convertedChats: GroupChat[] = refreshData.map((room: any) => ({
              id: room.id,
              name: room.name,
              description: room.description || '',
              icon: room.iconEmoji || '💬',
              banner: room.banner || '',
              memberCount: room.userCount || 0,
              maxMembers: 2000,
              rules: [],
              admin: {
                id: room.createdBy || 'unknown',
                name: room.createdBy || 'Unknown',
                avatar: ''
              },
              coAdmins: [],
              isPrivate: false,
              joinRequestRequired: false,
              customRoles: [],
              announcements: [],
              tags: room.tags || [],
              createdAt: new Date(room.createdAt),
              lastActivity: new Date()
            }));
            setGroupChats(convertedChats);
          }
          return true;
        }
      } catch (backendErr) {
        console.warn('Backend creation failed, creating locally:', backendErr);
      }
      
      // Fallback to local creation
      const newGroupChat: GroupChat = {
        id: `gc-${Date.now()}`,
        name: data.name || 'New Group Chat',
        description: data.description || '',
        icon: data.icon || '💬',
        banner: data.banner || '',
        memberCount: 1,
        maxMembers: 2000,
        rules: data.rules || [],
        admin: data.admin || { id: 'current-user', name: 'You', avatar: '' },
        coAdmins: [],
        isPrivate: data.isPrivate || false,
        joinRequestRequired: data.joinRequestRequired || false,
        customRoles: [],
        announcements: [],
        tags: data.tags || [],
        createdAt: new Date(),
        lastActivity: new Date()
      };
      
      setGroupChats(prev => [newGroupChat, ...prev]);
      return true;
    } catch (err) {
      setError('Failed to create group chat');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateGroupChat = async (id: string, data: Partial<GroupChat>): Promise<boolean> => {
    try {
      setGroupChats(prev => 
        prev.map(gc => gc.id === id ? { ...gc, ...data } : gc)
      );
      return true;
    } catch (err) {
      setError('Failed to update group chat');
      return false;
    }
  };

  const deleteGroupChat = async (id: string): Promise<boolean> => {
    try {
      setGroupChats(prev => prev.filter(gc => gc.id !== id));
      return true;
    } catch (err) {
      setError('Failed to delete group chat');
      return false;
    }
  };

  // Join/Leave Management
  const requestToJoin = async (groupId: string): Promise<boolean> => {
    try {
      const newRequest: JoinRequest = {
        id: `req-${Date.now()}`,
        userId: 'current-user',
        userName: 'Current User',
        userAvatar: '',
        groupId,
        timestamp: new Date(),
        status: 'pending'
      };
      
      setJoinRequests(prev => [newRequest, ...prev]);
      return true;
    } catch (err) {
      setError('Failed to send join request');
      return false;
    }
  };

  const approveJoinRequest = async (requestId: string): Promise<boolean> => {
    try {
      setJoinRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, status: 'approved' } : req)
      );
      return true;
    } catch (err) {
      setError('Failed to approve join request');
      return false;
    }
  };

  const rejectJoinRequest = async (requestId: string): Promise<boolean> => {
    try {
      setJoinRequests(prev => 
        prev.map(req => req.id === requestId ? { ...req, status: 'rejected' } : req)
      );
      return true;
    } catch (err) {
      setError('Failed to reject join request');
      return false;
    }
  };

  const joinGroupChat = async (groupId: string): Promise<boolean> => {
    try {
      setGroupChats(prev => 
        prev.map(gc => 
          gc.id === groupId 
            ? { ...gc, memberCount: gc.memberCount + 1, lastActivity: new Date() }
            : gc
        )
      );
      return true;
    } catch (err) {
      setError('Failed to join group chat');
      return false;
    }
  };

  const leaveGroupChat = async (groupId: string): Promise<boolean> => {
    try {
      setGroupChats(prev => 
        prev.map(gc => 
          gc.id === groupId 
            ? { ...gc, memberCount: Math.max(0, gc.memberCount - 1), lastActivity: new Date() }
            : gc
        )
      );
      return true;
    } catch (err) {
      setError('Failed to leave group chat');
      return false;
    }
  };

  // Utility functions
  const getGroupChat = (id: string): GroupChat | null => {
    return groupChats.find(gc => gc.id === id) || null;
  };

  const getMembers = (groupId: string): GroupMember[] => {
    return members.filter(member => member.id === groupId);
  };

  const getUserRole = (groupId: string, userId: string): string | null => {
    const member = members.find(m => m.id === groupId && m.userId === userId);
    return member ? member.role : null;
  };

  const canUserJoin = (groupId: string, userId: string): boolean => {
    const groupChat = getGroupChat(groupId);
    if (!groupChat) return false;
    
    return groupChat.memberCount < groupChat.maxMembers;
  };

  // Placeholder functions for other methods
  const addMember = async (groupId: string, userId: string): Promise<boolean> => true;
  const removeMember = async (groupId: string, userId: string): Promise<boolean> => true;
  const promoteToCoAdmin = async (groupId: string, userId: string): Promise<boolean> => true;
  const demoteFromCoAdmin = async (groupId: string, userId: string): Promise<boolean> => true;
  const transferOwnership = async (groupId: string, userId: string): Promise<boolean> => true;
  const banMember = async (groupId: string, userId: string, duration?: number): Promise<boolean> => true;
  const unbanMember = async (groupId: string, userId: string): Promise<boolean> => true;
  const createCustomRole = async (groupId: string, roleName: string, permissions: string[]): Promise<boolean> => true;
  const assignCustomRole = async (groupId: string, userId: string, roleId: string): Promise<boolean> => true;
  const createAnnouncement = async (groupId: string, announcement: Partial<GroupChat['announcements'][0]>): Promise<boolean> => true;
  const deleteAnnouncement = async (groupId: string, announcementId: string): Promise<boolean> => true;

  const value: GroupChatContextType = useMemo(() => ({
    groupChats,
    joinRequests,
    currentGroupChat,
    members,
    isLoading,
    error,
    createGroupChat,
    updateGroupChat,
    deleteGroupChat,
    requestToJoin,
    approveJoinRequest,
    rejectJoinRequest,
    joinGroupChat,
    leaveGroupChat,
    addMember,
    removeMember,
    promoteToCoAdmin,
    demoteFromCoAdmin,
    transferOwnership,
    banMember,
    unbanMember,
    createCustomRole,
    assignCustomRole,
    createAnnouncement,
    deleteAnnouncement,
    getGroupChat,
    getMembers,
    getUserRole,
    canUserJoin
  }), [groupChats, joinRequests, currentGroupChat, members, isLoading, error]);

  return (
    <GroupChatContext.Provider value={value}>
      {children}
    </GroupChatContext.Provider>
  );
};
