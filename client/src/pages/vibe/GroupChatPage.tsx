import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, 
  Send, 
  Users, 
  Info, 
  MoreVertical, 
  Smile, 
  X,
  CheckCircle2,
  LogOut,
  Palette,
  Gamepad2,
  MessageCircle,
  Star,
  Crown,
  Shield,
  UserPlus,
  UserMinus,
  Ban,
  Edit3,
  Trash2,
  AlertTriangle,
  Lock,
  Unlock
} from "lucide-react";
import io from "socket.io-client";
import ShareMediaModal from '../../components/ShareMediaModal';
import MobileRoleManagement from '../../components/MobileRoleManagement';

// Enhanced types for group chat system
type UserRole = 'admin' | 'co-admin' | 'member';

type GroupMember = {
  id: string;
  username: string;
  role: UserRole;
  joinedAt: Date;
  lastActive: Date;
  isBanned: boolean;
  customTitle?: string;
  customRole?: string;
};

type GroupChat = {
  id: string;
  name: string;
  description: string;
  banner?: string;
  icon?: string;
  rules: string[];
  maxMembers: number;
  currentMembers: number;
  createdAt: Date;
  adminId: string;
  coAdminIds: string[];
  isPrivate: boolean;
  joinRequests: JoinRequest[];
};

type JoinRequest = {
  id: string;
  userId: string;
  username: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
};

type Announcement = {
  id: string;
  content: string;
  type: 'text' | 'image' | 'poll';
  authorId: string;
  authorName: string;
  createdAt: Date;
  reactions: { [emoji: string]: string[] }; // emoji -> user IDs
};

type ChatMessage = {
  id: string;
  alias: string;
  message: string;
  timestamp: number;
  userId: string;
  userRole: UserRole;
  customTitle?: string;
  bubbleSkin?: string;
};

type CustomRole = {
  id: string;
  name: string;
  permissions: string[];
  color: string;
};

const socket = io(import.meta.env.VITE_SERVER_URL || window.location.origin, { transports: ["websocket"] });

// Theme configurations with image paths
const themes = [
  { id: 'theme1', name: 'Theme 1', colors: { primary: '#60A5FA', background: 'transparent', surface: '#F0F8FF' }, image: '/themes/IMG-20250809-WA0018.jpg' },
  { id: 'theme2', name: 'Theme 2', colors: { primary: '#FF6B6B', background: 'transparent', surface: '#2C0F0F' }, image: '/themes/IMG-20250809-WA0019.jpg' },
  { id: 'theme3', name: 'Theme 3', colors: { primary: '#06b6d4', background: 'transparent', surface: '#0e7490' }, image: '/themes/IMG-20250809-WA0021.jpg' },
  { id: 'theme4', name: 'Theme 4', colors: { primary: '#10b981', background: 'transparent', surface: '#065f46' }, image: '/themes/IMG-20250811-WA0015.jpg' },
  { id: 'theme5', name: 'Theme 5', colors: { primary: '#8b5cf6', background: 'transparent', surface: '#581c87' }, image: '/themes/IMG-20250811-WA0039.jpg' },
  { id: 'theme6', name: 'Theme 6', colors: { primary: '#dc2626', background: 'transparent', surface: '#7f1d1d' }, image: '/themes/IMG-20250811-WA0052.jpg' },
  { id: 'theme7', name: 'Theme 7', colors: { primary: '#f59e0b', background: '#451a03', surface: '#92400e' }, image: '/themes/IMG-20250812-WA0031.jpg' },
  { id: 'theme8', name: 'Theme 8', colors: { primary: '#ec4899', background: '#831843', surface: '#be185d' }, image: '/themes/IMG-20250812-WA0032.jpg' },
  { id: 'theme9', name: 'Theme 9', colors: { primary: '#14b8a6', background: '#134e4a', surface: '#0f766e' }, image: '/themes/IMG-20250812-WA0038.jpg' },
  { id: 'theme10', name: 'Theme 10', colors: { primary: '#f97316', background: '#7c2d12', surface: '#ea580c' }, image: '/themes/IMG-20250812-WA0045.jpg' },
  { id: 'theme11', name: 'Theme 11', colors: { primary: '#8b5cf6', background: '#4c1d95', surface: '#7c3aed' }, image: '/themes/IMG-20250812-WA0046.jpg' },
  { id: 'theme12', name: 'Theme 12', colors: { primary: '#06b6d4', background: '#164e63', surface: '#0891b2' }, image: '/themes/IMG-20250813-WA0009.jpg' },
  { id: 'theme13', name: 'Theme 13', colors: { primary: '#10b981', background: '#065f46', surface: '#047857' }, image: '/themes/IMG-20250813-WA0010.jpg' },
  { id: 'theme14', name: 'Theme 14', colors: { primary: '#f59e0b', background: '#92400e', surface: '#d97706' }, image: '/themes/IMG-20250813-WA0021.jpg' },
  { id: 'theme15', name: 'Theme 15', colors: { primary: '#ef4444', background: '#7f1d1d', surface: '#dc2626' }, image: '/themes/IMG-20250813-WA0023.jpg' },
  { id: 'theme16', name: 'Theme 16', colors: { primary: '#8b5cf6', background: '#4c1d95', surface: '#7c3aed' }, image: '/themes/IMG-20250813-WA0024.jpg' },
  { id: 'theme17', name: 'Theme 17', colors: { primary: '#06b6d4', background: '#164e63', surface: '#0891b2' }, image: '/themes/IMG-20250813-WA0033.jpg' },
  { id: 'theme18', name: 'Theme 18', colors: { primary: '#f59e0b', background: '#92400e', surface: '#d97706' }, image: '/themes/IMG-20250815-WA0003.jpg' },
  { id: 'theme19', name: 'Theme 19', colors: { primary: '#ec4899', background: 'transparent', surface: '#be185d' }, image: '/themes/WhatsApp%20Image%202025-08-01%20at%2021.37.26_bd94a426.jpg' },
  { id: 'theme20', name: 'Theme 20', colors: { primary: '#14b8a6', background: 'transparent', surface: '#0f766e' }, image: '/themes/WhatsApp%20Image%202025-08-02%20at%2022.57.25_d5e5a6ec.jpg' },
  { id: 'theme21', name: 'Theme 21', colors: { primary: '#f97316', background: 'transparent', surface: '#ea580c' }, image: '/themes/WhatsApp%20Image%202025-08-06%20at%2022.50.29_33150246.jpg' }
];

// Fallback theme to prevent errors when themes array is empty
const fallbackTheme = { id: 'fallback', name: 'Fallback', colors: { primary: '#60A5FA', background: '#F0F8FF', surface: '#F0F8FF' } };

// Emoji categories
const emojiCategories = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔'] },
  { name: 'Animals', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'] },
  { name: 'Food', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒'] }
];

// Game options
const gameOptions = [
  { id: 'tictactoe', name: 'Tic Tac Toe', icon: '⭕' },
  { id: 'hangman', name: 'Hangman', icon: '🎯' },
  { id: 'wordle', name: 'Wordle', icon: '📝' },
  { id: 'trivia', name: 'Trivia', icon: '🧠' }
];


const GroupChatPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Core chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  
  // Group chat state
  const [groupChat, setGroupChat] = useState<GroupChat | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 'ann-1',
      content: 'Welcome to our group! Please read the rules and enjoy your stay.',
      type: 'text',
      authorId: 'admin-1',
      authorName: 'Group Admin',
      createdAt: new Date(),
      reactions: { '❤️': ['user-1'], '👍': ['user-2', 'user-3'] }
    },
    {
      id: 'ann-2',
      content: 'New features have been added! Check out the emoji reactions and custom stickers.',
      type: 'text',
      authorId: 'co-admin-1',
      authorName: 'JaneSmith',
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      reactions: { '🎉': ['user-1', 'user-2'], '🔥': ['user-3'] }
    }
  ]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([
    {
      id: 'req-1',
      userId: 'user-1',
      username: 'JohnDoe123',
      requestedAt: new Date(),
      status: 'pending',
      message: 'I would like to join this group to participate in discussions.'
    },
    {
      id: 'req-2',
      userId: 'user-2',
      username: 'JaneSmith456',
      requestedAt: new Date(Date.now() - 86400000), // 1 day ago
      status: 'pending',
      message: 'Interested in joining the community!'
    }
  ]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([
    {
      id: 'role-1',
      name: 'Moderator',
      permissions: ['Manage Messages', 'Ban Users'],
      color: '#3B82F6'
    },
    {
      id: 'role-2',
      name: 'Recruiter',
      permissions: ['Approve Requests'],
      color: '#10B981'
    }
  ]);
  
  // Current user state
  const [currentUser, setCurrentUser] = useState<GroupMember | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('member');
  
  // UI state
  const [showInfo, setShowInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [showShareMedia, setShowShareMedia] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomRoles, setShowCustomRoles] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(0);
  const [currentTheme, setCurrentTheme] = useState('theme21');
  const [bubbleSkin, setBubbleSkin] = useState(() => {
    return localStorage.getItem('selectedBubbleSkin') || 'default';
  });
  
  // Modal states
  const [showAddMember, setShowAddMember] = useState(false);
  const [showBanUser, setShowBanUser] = useState(false);
  const [showTransferOwnership, setShowTransferOwnership] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [showCoAdminManagement, setShowCoAdminManagement] = useState(false);
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);
  

  // Mock current user - in real app, this would come from auth context
  const mockCurrentUser = {
    id: 'current-user-id',
    username: 'CurrentUser',
    role: 'admin' as UserRole,
    joinedAt: new Date(),
    lastActive: new Date(),
    isBanned: false
  };

  useEffect(() => {
    if (!groupId) return;

    // Set current user
    setCurrentUser(mockCurrentUser);
    setUserRole(mockCurrentUser.role);
    setHistoryLoaded(false);

    // Mock group chat data
    const mockGroupChat: GroupChat = {
      id: groupId,
      name: `Group ${groupId}`,
      description: 'A vibrant community for sharing ideas and discussions.',
      rules: [
        'Be respectful to all members',
        'Keep discussions relevant and constructive',
        'No hate speech or bullying',
        'Share content with proper credits'
      ],
      maxMembers: 2000,
      currentMembers: 150,
      createdAt: new Date(),
      adminId: 'current-user-id',
      coAdminIds: ['co-admin-1', 'co-admin-2'],
      isPrivate: false,
      joinRequests: []
    };

    const mockMembers: GroupMember[] = [
      mockCurrentUser,
      {
        id: 'member-1',
        username: 'JohnDoe',
        role: 'member',
        joinedAt: new Date(),
        lastActive: new Date(),
        isBanned: false,
        customTitle: 'Recruiter'
      },
      {
        id: 'co-admin-1',
        username: 'JaneSmith',
        role: 'co-admin',
        joinedAt: new Date(),
        lastActive: new Date(),
        isBanned: false
      }
    ];

    setGroupChat(mockGroupChat);
    setMembers(mockMembers);

    // Socket connection (send proper payload)
    const aliasForJoin = mockCurrentUser.username || "Guest";
    socket.emit("join-room", { groupId, alias: aliasForJoin });

    // Fallback: if history doesn't arrive in ~1s, explicitly request it
    let historyFallbackTimer: any = setTimeout(() => {
      if (!historyLoaded) {
        socket.emit('request-room-history', { roomId: groupId });
      }
    }, 800);

    socket.on("room-joined", (info: any) => {
      if (!info?.success && info?.error) {
        console.warn('Room join failed:', info.error);
      }
    });

    socket.on("room-history", (history: ChatMessage[]) => {
      setHistoryLoaded(true);
      setMessages(history as any);
    });
    socket.on("receive-message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on("member-update", (updatedMembers: GroupMember[]) => setMembers(updatedMembers));
    socket.on("announcement-update", (updatedAnnouncements: Announcement[]) => setAnnouncements(updatedAnnouncements));
    socket.on("join-request-update", (requests: JoinRequest[]) => setJoinRequests(requests));

    return () => {
      clearTimeout(historyFallbackTimer);
      socket.off("room-history");
      socket.off("receive-message");
      socket.off("member-update");
      socket.off("announcement-update");
      socket.off("join-request-update");
      socket.off("room-joined");
    };
  }, [groupId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = () => {
    if (!groupId || !input.trim()) return;
    
    // Create the message object
    const newMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      alias: currentUser?.username || "You",
      message: input.trim(),
      timestamp: Date.now(),
      userId: currentUser?.id,
      userRole: userRole,
      bubbleSkin: bubbleSkin
    };
    
    // Add message locally for immediate feedback
    setMessages(prev => [...prev, newMessage]);
    
    // Send to server
    const messageData = {
      groupId,
      alias: currentUser?.username || "You",
      message: input.trim(),
      time: new Date().toISOString(),
      userId: currentUser?.id,
      userRole: userRole,
      bubbleSkin: bubbleSkin
    };
    socket.emit("send-message", messageData);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleBubbleSkinChange = (skin: string) => {
    setBubbleSkin(skin);
    // Save to localStorage for persistence
    localStorage.setItem('selectedBubbleSkin', skin);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };




  const handleMediaShared = (mediaData: any) => {
    console.log('Media shared in chat:', mediaData);
    
    // Create a message with the shared media
    let messageContent = '';
    
    switch (mediaData.type) {
      case 'image':
      case 'camera':
        if (mediaData.files && mediaData.files.length > 0) {
          messageContent = `📷 Shared ${mediaData.files.length} image(s)`;
        }
        break;
      case 'document':
        if (mediaData.files && mediaData.files.length > 0) {
          messageContent = `📄 Shared ${mediaData.files.length} document(s)`;
        }
        break;
      case 'location':
        if (mediaData.location) {
          messageContent = `📍 Shared location: ${mediaData.location.address}`;
        }
        break;
      case 'poll':
        if (mediaData.poll) {
          messageContent = `📊 Poll: ${mediaData.poll.question}`;
        }
        break;
    }
    
    if (mediaData.content) {
      messageContent = mediaData.content + (messageContent ? `\n\n${messageContent}` : '');
    }
    
    if (messageContent) {
      setInput(messageContent);
    }
  };

  const handleGameSelect = (gameId: string) => {
    setShowGames(false);
    console.log(`Starting game: ${gameId}`);
  };

  const handleLeaveGroup = () => {
    if (window.confirm('Are you sure you want to leave this group chat?')) {
      navigate('/vibe');
    }
  };

  // Administrative functions
  const handleJoinRequest = (requestId: string, action: 'approve' | 'reject') => {
    const request = joinRequests.find(req => req.id === requestId);
    const actionText = action === 'approve' ? 'approved' : 'rejected';
    
    socket.emit('handle-join-request', { groupId, requestId, action });
    
    // Add confirmation message to chat
    const confirmationMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      alias: 'System',
      message: `Join request from ${request?.username || 'a user'} has been ${actionText} by ${currentUser?.username || 'an administrator'}.`,
      timestamp: Date.now(),
      userId: 'system',
      userRole: 'member'
    };
    setMessages(prev => [...prev, confirmationMessage]);
    
    // Update local state
    setJoinRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' } : req
    ));
  };

  const handleRemoveMember = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (window.confirm(`Are you sure you want to remove ${member?.username || 'this member'} from the group?`)) {
      socket.emit('remove-member', { groupId, memberId });
      // Add confirmation message to chat
      const confirmationMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        alias: 'System',
        message: `${member?.username || 'A member'} has been removed from the group by ${currentUser?.username || 'an administrator'}.`,
        timestamp: Date.now(),
        userId: 'system',
        userRole: 'member'
      };
      setMessages(prev => [...prev, confirmationMessage]);
    }
  };

  const handleBanUser = (memberId: string, duration: number) => {
    const member = members.find(m => m.id === memberId);
    const durationText = duration === 0 ? 'permanently' : `for ${Math.floor(duration / (1000 * 60 * 60))} hours`;
    
    if (window.confirm(`Are you sure you want to ban ${member?.username || 'this member'} ${durationText}?`)) {
      socket.emit('ban-user', { groupId, memberId, duration });
      
      // Add confirmation message to chat
      const confirmationMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        alias: 'System',
        message: `${member?.username || 'A member'} has been banned ${durationText} by ${currentUser?.username || 'an administrator'}.`,
        timestamp: Date.now(),
        userId: 'system',
        userRole: 'member'
      };
      setMessages(prev => [...prev, confirmationMessage]);
    }
  };

  const handleAppointCoAdmin = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (window.confirm(`Are you sure you want to appoint ${member?.username || 'this member'} as a co-administrator?`)) {
      socket.emit('appoint-co-admin', { groupId, memberId });
      // Add confirmation message to chat
      const confirmationMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        alias: 'System',
        message: `${member?.username || 'A member'} has been appointed as co-administrator by ${currentUser?.username || 'the administrator'}.`,
        timestamp: Date.now(),
        userId: 'system',
        userRole: 'member'
      };
      setMessages(prev => [...prev, confirmationMessage]);
    }
  };

  const handleTransferOwnership = (newAdminId: string) => {
    const newAdmin = members.find(m => m.id === newAdminId);
    if (window.confirm(`Are you sure you want to transfer ownership to ${newAdmin?.username || 'this member'}? This action cannot be undone and you will become a regular member.`)) {
      socket.emit('transfer-ownership', { groupId, newAdminId });
      // Add confirmation message to chat
      const confirmationMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        alias: 'System',
        message: `Group ownership has been transferred to ${newAdmin?.username || 'a member'} by ${currentUser?.username || 'the administrator'}.`,
        timestamp: Date.now(),
        userId: 'system',
        userRole: 'member'
      };
      setMessages(prev => [...prev, confirmationMessage]);
    }
  };

  const handleCreateAnnouncement = (content: string, type: 'text' | 'image' | 'poll') => {
    socket.emit('create-announcement', { groupId, content, type });
  };

  const handleCreateCustomRole = (role: Omit<CustomRole, 'id'>) => {
    const newRole: CustomRole = {
      id: `role-${Date.now()}`,
      ...role
    };
    setCustomRoles(prev => [...prev, newRole]);
    socket.emit('create-custom-role', { groupId, role: newRole });
    
    // Add confirmation message to chat
    const confirmationMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      alias: 'System',
      message: `Custom role "${role.name}" has been created by ${currentUser?.username || 'an administrator'}.`,
      timestamp: Date.now(),
      userId: 'system',
      userRole: 'member'
    };
    setMessages(prev => [...prev, confirmationMessage]);
  };

  const handleDeleteCustomRole = (roleId: string) => {
    const role = customRoles.find(r => r.id === roleId);
    if (window.confirm(`Are you sure you want to delete the custom role "${role?.name}"?`)) {
      setCustomRoles(prev => prev.filter(r => r.id !== roleId));
      socket.emit('delete-custom-role', { groupId, roleId });
      
      // Add confirmation message to chat
      const confirmationMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        alias: 'System',
        message: `Custom role "${role?.name}" has been deleted by ${currentUser?.username || 'an administrator'}.`,
        timestamp: Date.now(),
        userId: 'system',
        userRole: 'member'
      };
      setMessages(prev => [...prev, confirmationMessage]);
    }
  };

  const handleAssignCustomTitle = (memberId: string, title: string) => {
    const member = members.find(m => m.id === memberId);
    socket.emit('assign-custom-title', { groupId, memberId, title });
    // Add confirmation message to chat
    const confirmationMessage: ChatMessage = {
      id: `system-${Date.now()}`,
      alias: 'System',
      message: `${member?.username || 'A member'} has been assigned the custom title "${title}" by ${currentUser?.username || 'an administrator'}.`,
      timestamp: Date.now(),
      userId: 'system',
      userRole: 'member'
    };
    setMessages(prev => [...prev, confirmationMessage]);
  };

  const handleDeleteGroup = () => {
    if (window.confirm('Are you sure you want to delete this group chat? This action cannot be undone and all members will be removed.')) {
      socket.emit('delete-group', { groupId });
      navigate('/vibe');
    }
  };

  const handleRemoveCoAdmin = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (window.confirm(`Are you sure you want to remove ${member?.username || 'this member'} as a co-administrator?`)) {
      socket.emit('remove-co-admin', { groupId, memberId });
      // Add confirmation message to chat
      const confirmationMessage: ChatMessage = {
        id: `system-${Date.now()}`,
        alias: 'System',
        message: `${member?.username || 'A co-administrator'} has been removed from co-administrator role by ${currentUser?.username || 'the administrator'}.`,
        timestamp: Date.now(),
        userId: 'system',
        userRole: 'member'
      };
      setMessages(prev => [...prev, confirmationMessage]);
    }
  };

  // Permission checks
  const canManageMembers = userRole === 'admin' || userRole === 'co-admin';
  const canBanUsers = userRole === 'admin';
  const canTransferOwnership = userRole === 'admin';
  const canCreateAnnouncements = userRole === 'admin' || userRole === 'co-admin';
  const canManageRoles = userRole === 'admin';
  const canModifyGroupSettings = userRole === 'admin';

  // Track recent groups and progress for "Continue chatting" rail
  useEffect(() => {
    if (!groupId) return;
    try {
      const stateAny = (location.state as any) || {};
      const room = stateAny.room || {};
      if (room?.name) setGroupChat(prev => prev ? { ...prev, name: room.name } : null);
      const raw = localStorage.getItem("vibe_recent_groups");
      const arr: Array<any> = raw ? JSON.parse(raw) : [];
      const existingIndex = arr.findIndex((r) => r.id === groupId);
      const newEntry = {
        id: groupId,
        name: groupChat?.name || `Group: ${groupId}`,
        banner: room?.banner,
        description: groupChat?.description,
        userCount: groupChat?.currentMembers,
        lastVisited: Date.now(),
        progress: Math.min(0.95, Math.max(0.1, messages.length / 25)),
      };
      if (existingIndex >= 0) arr.splice(existingIndex, 1);
      arr.unshift(newEntry);
      localStorage.setItem("vibe_recent_groups", JSON.stringify(arr.slice(0, 24)));
    } catch {}
  }, [groupId, messages.length, groupChat]);

  const currentThemeData = themes.find(t => t.id === currentTheme) || fallbackTheme;

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'co-admin': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <Users className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'text-yellow-500';
      case 'co-admin': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

      return (
      <div 
        className="h-screen w-full flex flex-col relative"
        style={{ 
          backgroundColor: currentThemeData.image ? 'transparent' : currentThemeData.colors.background
        }}
      >
        {/* Background Image */}
        {currentThemeData.image && (
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${currentThemeData.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.5
            }}
          />
        )}
              {/* Enhanced Header Section - Mobile Responsive */}
        <div 
          className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10 z-20 flex-shrink-0 relative backdrop-blur-md"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        >
        {/* Left side - Back button and group info */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
          <button 
            onClick={() => navigate(-1)} 
            className="px-2 py-1 rounded-lg border border-white/15 text-xs sm:text-sm text-zinc-200 hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1" /> 
            <span className="hidden sm:inline">Back</span>
          </button>
          
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white text-sm sm:text-base truncate">
                {groupChat?.name || `Group: ${groupId}`}
              </div>
              <div className="text-xs text-zinc-400 flex items-center gap-1">
                <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="truncate">
                  {groupChat?.currentMembers || 0}/{groupChat?.maxMembers || 2000} members
                </span>
                {groupChat?.isPrivate && <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />}
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Role indicator and action buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Role indicator - hidden on very small screens */}
          <div className={`hidden sm:flex items-center space-x-1 px-2 py-1 rounded text-xs ${getRoleColor(userRole)}`}>
            {getRoleIcon(userRole)}
            <span className="capitalize">{userRole}</span>
          </div>

          <button
            onClick={() => setShowAnnouncements(true)}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Announcements"
          >
            <MessageCircle className="w-4 h-4 text-white" />
          </button>

          <button
            onClick={() => setShowInfo(true)}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Group Info"
          >
            <Info className="w-4 h-4 text-white" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="More Options"
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 z-50">
                {/* GC-ID Display */}
                <div className="px-3 sm:px-4 py-3 border-b border-zinc-700">
                  <div className="text-xs text-zinc-400 mb-1">Group Chat ID</div>
                  <div className="flex items-center space-x-2">
                    <div className="text-white font-mono text-xs sm:text-sm bg-zinc-700 px-2 py-1 rounded flex-1 truncate">
                      {groupId}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(groupId || '');
                        // Show temporary success message
                        const originalText = 'Copy ID';
                        const button = event?.target as HTMLButtonElement;
                        if (button) {
                          button.textContent = 'Copied!';
                          setTimeout(() => {
                            button.textContent = originalText;
                          }, 2000);
                        }
                      }}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex-shrink-0"
                      title="Copy Group Chat ID"
                    >
                      Copy ID
                    </button>
                  </div>
                </div>

                {/* Members List */}
                <button
                  onClick={() => {
                    setShowMembers(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 sm:px-4 py-3 text-left text-white hover:bg-zinc-700 flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Members List ({members.length})</span>
                </button>

                {/* Admin Panel - Only for admins */}
                {userRole === 'admin' && (
                  <div className="border-t border-zinc-700">
                    <div className="px-4 py-2 text-xs text-zinc-400 bg-zinc-700/50">
                      ADMIN PANEL
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowJoinRequests(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700 flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Approval List</span>
                      {joinRequests.filter(req => req.status === 'pending').length > 0 && (
                        <div className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {joinRequests.filter(req => req.status === 'pending').length}
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setShowMembers(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700 flex items-center space-x-2"
                    >
                      <UserMinus className="w-4 h-4" />
                      <span>User List (Remove)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowCoAdminManagement(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700 flex items-center space-x-2"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Manage Co-Admins</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowCustomRoles(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700 flex items-center space-x-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Custom Roles/Titles</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowTransferOwnership(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700 flex items-center space-x-2"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Transfer Ownership</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowDeleteGroup(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-red-400 hover:bg-zinc-700 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Group Chat</span>
                    </button>
                  </div>
                )}

                {/* Co-Admin Options */}
                {userRole === 'co-admin' && (
                  <div className="border-t border-zinc-700">
                    <div className="px-4 py-2 text-xs text-zinc-400 bg-zinc-700/50">
                      CO-ADMIN PANEL
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowJoinRequests(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700 flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Approval List</span>
                      {joinRequests.filter(req => req.status === 'pending').length > 0 && (
                        <div className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {joinRequests.filter(req => req.status === 'pending').length}
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setShowMembers(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700 flex items-center space-x-2"
                    >
                      <UserMinus className="w-4 h-4" />
                      <span>User List (Remove)</span>
                    </button>
                  </div>
                )}

                {/* General Options */}
                <div className="border-t border-zinc-700">
                  <button
                    onClick={() => {
                      setShowThemeSelector(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-zinc-700 flex items-center space-x-2"
                  >
                    <Palette className="w-4 h-4" />
                    <span>Theme Selection</span>
                  </button>

                  <button
                    onClick={() => {
                      handleLeaveGroup();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-zinc-700 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Leave Group Chat</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

              {/* Chat Display Area - Mobile Responsive */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 relative z-10">
        {messages.map((m) => {
          const isOwn = (m.userId && m.userId === currentUser?.id) || (!m.userId && m.alias === currentUser?.username);
          const skinToUse = isOwn ? (m.bubbleSkin || bubbleSkin || 'default') : 'default';
          return (
            <div key={m.id} className={`max-w-[40%] sm:max-w-[35%] ${isOwn ? 'ml-auto' : ''}`}>
              <div 
                className={`px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-lg chat-bubble-skin-${skinToUse}`}
              >
                {!isOwn && (
                  <div className="text-[10px] opacity-75 mb-0.5">{m.alias || 'User'}</div>
                )}
                <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">{m.message}</div>
                <div className="text-[8px] sm:text-[10px] opacity-70 mt-0.5">
                  {new Date(m.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

              {/* Enhanced Bottom Bar - Mobile Responsive */}
        <div 
          className="p-2 sm:p-4 border-t border-white/10 flex-shrink-0 relative z-20 backdrop-blur-md"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        >
        <div className="flex items-center w-full gap-2">
          {/* Left side - Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 sm:p-3 transition-colors hover:opacity-80"
              title="React"
            >
              <Smile className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
            <button
              onClick={() => setShowGames(!showGames)}
              className="p-2 sm:p-3 transition-colors hover:opacity-80 relative"
              title="Games & Customization"
            >
              <span className="text-gold font-cursive text-lg sm:text-xl font-bold drop-shadow-[0_0_8px_rgba(255,215,0,0.6)] animate-pulse">N</span>
            </button>
          </div>

          {/* Text Input - Flexible width */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/20 text-white placeholder-zinc-300 focus:outline-none focus:ring-2 border border-white/30 text-sm sm:text-base transition-all"
              style={{ 
                '--tw-ring-color': currentThemeData.colors.primary,
                '--tw-ring-opacity': '0.5'
              } as React.CSSProperties}
            />
          </div>

          {/* Send Button */}
          <div className="flex-shrink-0">
            <button
              onClick={send}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ backgroundColor: currentThemeData.colors.primary }}
              title="Send"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Emoji Picker - Mobile Responsive */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-2 sm:left-4 right-2 sm:right-auto bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 p-3 sm:p-4 z-50 max-w-sm sm:max-w-none">
          <div className="flex space-x-1 sm:space-x-2 mb-3 overflow-x-auto">
            {emojiCategories.map((category, index) => (
              <button
                key={category.name}
                onClick={() => setSelectedEmojiCategory(index)}
                className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm whitespace-nowrap ${
                  selectedEmojiCategory === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2 mb-3">
            {emojiCategories[selectedEmojiCategory].emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiSelect(emoji)}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-zinc-700 rounded text-base sm:text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
          
        </div>
      )}

      {/* Games Menu - Mobile Responsive */}
      {showGames && (
        <div className="absolute bottom-20 left-2 sm:left-4 right-2 sm:right-auto bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 p-3 sm:p-4 z-50 w-72 sm:w-64 max-w-sm sm:max-w-none">
          <h3 className="text-white font-semibold mb-3 flex items-center text-sm sm:text-base">
            <Gamepad2 className="w-4 h-4 mr-2" />
            In-Chat Games
          </h3>
          <div className="space-y-2">
            {gameOptions.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className="w-full flex items-center space-x-2 sm:space-x-3 p-2 rounded hover:bg-zinc-700 text-white"
              >
                <span className="text-base sm:text-lg">{game.icon}</span>
                <span className="text-xs sm:text-sm">{game.name}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-zinc-700 mt-3 pt-3">
            <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">Chat Bubble Skins</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
              {[
                { name: 'Default', color: 'bg-zinc-600', textColor: 'text-white' },
                { name: 'Bubble', color: 'bg-blue-500', textColor: 'text-white' },
                { name: 'Neon', color: 'bg-cyan-400', textColor: 'text-black' },
                { name: 'Gradient', color: 'bg-gradient-to-r from-red-500 via-purple-500 to-blue-500', textColor: 'text-white' },
                { name: 'Love', color: 'bg-pink-600', textColor: 'text-white' },
                { name: 'Ice', color: 'bg-cyan-300', textColor: 'text-black' },
                { name: 'Forest', color: 'bg-green-600', textColor: 'text-white' },
                { name: 'Creepy', color: 'bg-gradient-to-r from-red-800 to-black', textColor: 'text-white' },
                { name: 'Victory', color: 'bg-gradient-to-r from-yellow-400 to-softgold-500', textColor: 'text-black' }
              ].map((skin) => (
                <button
                  key={skin.name}
                  className={`p-2 rounded ${skin.color} hover:opacity-80 ${skin.textColor} text-xs font-medium transition-all duration-200 ${
                    bubbleSkin === skin.name.toLowerCase() ? 'ring-2 ring-white ring-opacity-50' : ''
                  }`}
                  onClick={() => handleBubbleSkinChange(skin.name.toLowerCase())}
                >
                  {skin.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}



      {/* Enhanced Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Group Info</h2>
              <button
                onClick={() => setShowInfo(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{groupChat?.name || `Group: ${groupId}`}</h3>
                  <p className="text-sm text-zinc-400">{groupChat?.currentMembers}/{groupChat?.maxMembers} members</p>
                  {groupChat?.isPrivate && (
                    <div className="flex items-center space-x-1 text-xs text-yellow-400">
                      <Lock className="w-3 h-3" />
                      <span>Private Group</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">Description</h4>
                <p className="text-zinc-300 text-sm">
                  {groupChat?.description || 'A vibrant community for sharing ideas, discussions, and connecting with like-minded individuals.'}
                </p>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">Rules</h4>
                <ul className="text-zinc-300 text-sm space-y-1">
                  {groupChat?.rules.map((rule, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-2">Administration</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="text-zinc-300 text-sm">Admin: {members.find(m => m.id === groupChat?.adminId)?.username}</span>
                  </div>
                  {groupChat?.coAdminIds.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="text-zinc-300 text-sm">
                        Co-Admins: {groupChat.coAdminIds.map(id => members.find(m => m.id === id)?.username).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members Management Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Manage Members</h2>
              <button
                onClick={() => setShowMembers(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(member.role)}
                      <span className="text-white font-medium">{member.username}</span>
                      {member.customTitle && (
                        <span className="text-blue-400 text-sm">[{member.customTitle}]</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400">
                      Joined {member.joinedAt.toLocaleDateString()}
                    </div>
                  </div>
                  
                  {canManageMembers && member.id !== currentUser?.id && (
                    <div className="flex items-center space-x-2">
                      {member.role === 'member' && canManageMembers && (
                        <button
                          onClick={() => handleAppointCoAdmin(member.id)}
                          className="p-1 rounded hover:bg-zinc-600 text-blue-400"
                          title="Appoint Co-Admin"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                      
                      {canBanUsers && !member.isBanned && (
                        <button
                          onClick={() => setShowBanUser(true)}
                          className="p-1 rounded hover:bg-zinc-600 text-red-400"
                          title="Ban User"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      
                      {member.isBanned && (
                        <button
                          onClick={() => handleBanUser(member.id, 0)} // Unban
                          className="p-1 rounded hover:bg-zinc-600 text-green-400"
                          title="Unban User"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1 rounded hover:bg-zinc-600 text-red-400"
                        title="Remove Member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Join Requests Modal */}
      {showJoinRequests && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Join Requests</h2>
              <button
                onClick={() => setShowJoinRequests(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {joinRequests.filter(req => req.status === 'pending').map((request) => (
                <div key={request.id} className="p-3 bg-zinc-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{request.username}</span>
                    <span className="text-xs text-zinc-400">
                      {request.requestedAt.toLocaleDateString()}
                    </span>
                  </div>
                  {request.message && (
                    <p className="text-zinc-300 text-sm mb-3">{request.message}</p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleJoinRequest(request.id, 'approve')}
                      className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleJoinRequest(request.id, 'reject')}
                      className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              
              {joinRequests.filter(req => req.status === 'pending').length === 0 && (
                <p className="text-zinc-400 text-center py-4">No pending join requests</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      {showThemeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Theme Selection</h2>
              <button
                onClick={() => setShowThemeSelector(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setCurrentTheme(theme.id);
                    setShowThemeSelector(false);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    currentTheme === theme.id
                      ? 'border-blue-500 bg-zinc-700'
                      : 'border-zinc-600 bg-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <div className="w-full h-16 rounded mb-3 overflow-hidden">
                    <img
                      src={theme.image}
                      alt={`${theme.name} theme preview`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to color if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.style.backgroundColor = theme.colors.primary;
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{theme.name}</span>
                    {currentTheme === theme.id && (
                      <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Announcements Modal */}
      {showAnnouncements && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Announcements</h2>
              <button
                onClick={() => setShowAnnouncements(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-3 bg-zinc-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-medium">{announcement.authorName}</span>
                    <span className="text-xs text-zinc-400">
                      {announcement.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-zinc-300 text-sm mb-2">{announcement.content}</p>
                  <div className="flex space-x-2">
                    {Object.entries(announcement.reactions).map(([emoji, userIds]) => (
                      <button
                        key={emoji}
                        className="px-2 py-1 bg-zinc-600 rounded text-sm hover:bg-zinc-500"
                      >
                        {emoji} {userIds.length}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              {announcements.length === 0 && (
                <p className="text-zinc-400 text-center py-4">No announcements yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Co-Admin Management Modal */}
      {showCoAdminManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Manage Co-Administrators</h2>
              <button
                onClick={() => setShowCoAdminManagement(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-3">Current Co-Administrators</h3>
                <div className="space-y-2">
                  {members.filter(member => member.role === 'co-admin').map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-white font-medium">{member.username}</span>
                        <span className="text-xs text-zinc-400">
                          Appointed {member.joinedAt.toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveCoAdmin(member.id)}
                        className="p-2 rounded hover:bg-zinc-600 text-red-400"
                        title="Remove Co-Admin"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {members.filter(member => member.role === 'co-admin').length === 0 && (
                    <p className="text-zinc-400 text-center py-4">No co-administrators appointed</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-3">Appoint New Co-Administrator</h3>
                <div className="space-y-2">
                  {members.filter(member => member.role === 'member').map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-white font-medium">{member.username}</span>
                        <span className="text-xs text-zinc-400">
                          Member since {member.joinedAt.toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAppointCoAdmin(member.id)}
                        className="p-2 rounded hover:bg-zinc-600 text-blue-400"
                        title="Appoint Co-Admin"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {members.filter(member => member.role === 'member').length === 0 && (
                    <p className="text-zinc-400 text-center py-4">No members available to promote</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirmation Modal */}
      {showDeleteGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Delete Group Chat</h2>
              <button
                onClick={() => setShowDeleteGroup(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <h3 className="text-white font-semibold">Warning</h3>
                  <p className="text-zinc-300 text-sm">
                    This action cannot be undone. All members will be removed and the group chat will be permanently deleted.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-zinc-300 text-sm">
                  <strong>Group:</strong> {groupChat?.name}
                </p>
                <p className="text-zinc-300 text-sm">
                  <strong>Members:</strong> {groupChat?.currentMembers}
                </p>
                <p className="text-zinc-300 text-sm">
                  <strong>Created:</strong> {groupChat?.createdAt.toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowDeleteGroup(false)}
                  className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteGroup();
                    setShowDeleteGroup(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Delete Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Role Management Modal */}
      <MobileRoleManagement
        isOpen={showCustomRoles}
        onClose={() => setShowCustomRoles(false)}
        customRoles={customRoles}
        members={members}
        onCreateRole={handleCreateCustomRole}
        onDeleteRole={handleDeleteCustomRole}
        onAssignTitle={handleAssignCustomTitle}
      />

      {/* Transfer Ownership Modal */}
      {showTransferOwnership && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Transfer Ownership</h2>
              <button
                onClick={() => setShowTransferOwnership(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <Crown className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="text-white font-semibold">Transfer Group Ownership</h3>
                  <p className="text-zinc-300 text-sm">
                    You will become a regular member after transferring ownership.
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Select New Owner</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {members.filter(member => member.id !== currentUser?.id).map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        handleTransferOwnership(member.id);
                        setShowTransferOwnership(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 bg-zinc-700 hover:bg-zinc-600 rounded text-left"
                    >
                      {getRoleIcon(member.role)}
                      <span className="text-white font-medium">{member.username}</span>
                      <span className="text-xs text-zinc-400 capitalize">({member.role})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Ban User</h2>
              <button
                onClick={() => setShowBanUser(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <Ban className="w-5 h-5 text-red-400" />
                <div>
                  <h3 className="text-white font-semibold">Ban User</h3>
                  <p className="text-zinc-300 text-sm">
                    Select the duration for the ban. Banned users cannot send messages or participate in the group.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm text-zinc-400 mb-2">Ban Duration</label>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleBanUser('selected-member-id', 1 * 60 * 60 * 1000); // 1 hour
                      setShowBanUser(false);
                    }}
                    className="w-full p-3 bg-zinc-700 hover:bg-zinc-600 rounded text-left"
                  >
                    <div className="text-white font-medium">1 Hour</div>
                    <div className="text-xs text-zinc-400">Temporary ban for 1 hour</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleBanUser('selected-member-id', 24 * 60 * 60 * 1000); // 24 hours
                      setShowBanUser(false);
                    }}
                    className="w-full p-3 bg-zinc-700 hover:bg-zinc-600 rounded text-left"
                  >
                    <div className="text-white font-medium">24 Hours</div>
                    <div className="text-xs text-zinc-400">Temporary ban for 24 hours</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleBanUser('selected-member-id', 7 * 24 * 60 * 60 * 1000); // 7 days
                      setShowBanUser(false);
                    }}
                    className="w-full p-3 bg-zinc-700 hover:bg-zinc-600 rounded text-left"
                  >
                    <div className="text-white font-medium">7 Days</div>
                    <div className="text-xs text-zinc-400">Temporary ban for 7 days</div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleBanUser('selected-member-id', 0); // Permanent
                      setShowBanUser(false);
                    }}
                    className="w-full p-3 bg-red-900/20 hover:bg-red-900/30 rounded text-left border border-red-500/30"
                  >
                    <div className="text-red-400 font-medium">Permanent Ban</div>
                    <div className="text-xs text-red-300">Permanent ban (can be reversed by admin)</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Media Modal */}
      <ShareMediaModal
        isOpen={showShareMedia}
        onClose={() => setShowShareMedia(false)}
        onMediaShared={handleMediaShared}
        context="chat"
      />
    </div>
  );
};

export default GroupChatPage;


