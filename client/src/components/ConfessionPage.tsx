import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { apiFetch } from '../lib/utils';

// Get the server URL for API calls
const getServerUrl = () => {
  return import.meta.env.VITE_SERVER_URL || window.location.origin;
};
import { 
  Send, 
  Shield, 
  MessageCircle, 
  EyeOff, 
  Lock,
  ChevronUp,
  ChevronDown,
  Plus,
  ArrowLeft,
  BarChart3,
  AlertTriangle,
  Menu,
  Search,
} from 'lucide-react';

// Utility function to check if content exceeds 4 lines
const shouldShowMore = (content: string): boolean => {
  if (!content) return false;
  
  // Split content into lines and count
  const lines = content.split('\n');
  
  // If there are more than 4 lines, show "show more"
  if (lines.length > 4) return true;
  
  // Also check if any single line is very long (more than ~80 characters)
  // which would likely wrap to multiple lines
  const hasLongLines = lines.some(line => line.length > 80);
  
  return hasLongLines;
};

// Utility function to truncate content to 4 lines
const truncateContent = (content: string): string => {
  if (!content) return '';
  
  const lines = content.split('\n');
  
  if (lines.length <= 4) {
    // If content is 4 lines or less, check if any line is too long
    const truncatedLines = lines.map(line => {
      if (line.length > 80) {
        return line.substring(0, 80) + '...';
      }
      return line;
    });
    return truncatedLines.join('\n');
  }
  
  // Take first 4 lines and add ellipsis
  return lines.slice(0, 4).join('\n') + '\n...';
};
import { ConfessionComposer } from './ConfessionComposer';
import { ConfessionDetailPage } from './ConfessionDetailPage';
import { useAuth } from '../contexts/AuthContext';
import { ConfessionSidebarMenu } from './ConfessionSidebarMenu';
import { ConfessionFeed } from './ConfessionFeed';

interface Confession {
  id: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: number;
  isLiked?: boolean;
  category: string;
  mood: 'happy' | 'sad' | 'anxious' | 'excited' | 'neutral';
  isBookmarked?: boolean;
  repliesList?: Reply[];
  characterCount: number;
  authorAlias: AliasInfo;
  score: number;
  userVote: -1 | 0 | 1;
  reactions?: Record<string, { count: number; userReacted: boolean }>;
  backgroundImageUrl?: string | null;
  creatorSessionId?: string | null;
  isBestConfession?: boolean;
  isTrending?: boolean;
  engagementScore?: number;
  poll?: {
    question: string;
    options: string[];
    votes?: Record<string, string>; // userId -> selectedOption
  };
  isExplicit?: boolean;
}

interface Reply {
  id: string;
  content: string;
  timestamp: Date;
  authorAlias: AliasInfo;
  score?: number;
  userVote?: -1 | 0 | 1;
}

// Removed CampusStats UI

interface ConfessionPageProps {
  readonly onBack: () => void;
  readonly universityId?: string;
  readonly collegeName?: string;
  readonly collegeFullName?: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  pfpColor: string;
  requirement: {
    type: 'confessions' | 'engagement';
    count?: number;
    minEngagement?: number;
  };
}

interface AliasInfo {
  name: string;
  emoji: string;
  color: string;
  imageUrl?: string | null;
  badge?: Badge;
  stats?: {
    totalConfessions: number;
    totalEngagement: number; // upvotes + comments
  };
}

const emojis = ['🎭', '🎨', '🎪', '🎯', '🎲', '🎸', '🎹', '🎺', '🎤', '🎧', '🎬', '🎮', '✨', '⭐', '💫', '🌟', '💎', '🔮', '🎁', '🎀', '🎊', '🎉', '🏆', '🎖️', '😎', '🤖', '👤', '🦸', '🦹', '👽', '🤡', '🧙', '🧚', '🧛', '🧜', '🌙', '🌈', '🌸', '🌺', '🌻', '🌷', '🌹', '🍀', '🌿', '🍕', '🍔', '🍟', '🍰', '🍫', '🍭', '🍬', '🍪', '🥨', '🧁', '🎂', '🍩', '🕹️', '💻', '📱'];

// Badge system
const confessionBadges: Badge[] = [
  {
    id: 'first_whisper',
    name: 'First Whisper',
    description: 'Posted your first confession',
    icon: '🌟',
    color: 'text-yellow-400',
    pfpColor: 'from-gray-600 to-gray-700', // Same as default
    requirement: { type: 'confessions', count: 1 }
  },
  {
    id: 'silent_streamer',
    name: 'Silent Streamer',
    description: 'Posted 10 confessions',
    icon: '💚',
    color: 'text-green-400',
    pfpColor: 'from-softgold-500 to-softgold-600',
    requirement: { type: 'confessions', count: 10 }
  },
  {
    id: 'confession_machine',
    name: 'Confession Machine',
    description: 'Posted 50+ confessions',
    icon: '🔵',
    color: 'text-blue-400',
    pfpColor: 'from-softgold-600 to-softgold-700',
    requirement: { type: 'confessions', count: 50 }
  },
  {
    id: 'golden_confesser',
    name: 'Golden Confesser',
    description: 'Posted 300+ confessions',
    icon: '👑',
    color: 'text-[#b76e79]',
    pfpColor: 'from-[#b76e79] to-[#b76e79]',
    requirement: { type: 'confessions', count: 300 }
  },
  {
    id: 'phantom_writer',
    name: 'Phantom Writer',
    description: 'High engagement anonymous writer',
    icon: '👻',
    color: 'text-purple-400',
    pfpColor: 'from-softgold-700 to-softgold-800',
    requirement: { type: 'engagement', minEngagement: 500 }
  }
];

const calculateUserBadge = (stats: { totalConfessions: number; totalEngagement: number }): Badge | undefined => {
  // Check for Phantom Writer first (special engagement badge)
  if (stats.totalEngagement >= 500) {
    return confessionBadges.find(b => b.id === 'phantom_writer');
  }
  
  // Check confession count badges (highest first)
  if (stats.totalConfessions >= 300) {
    return confessionBadges.find(b => b.id === 'golden_confesser');
  } else if (stats.totalConfessions >= 50) {
    return confessionBadges.find(b => b.id === 'confession_machine');
  } else if (stats.totalConfessions >= 10) {
    return confessionBadges.find(b => b.id === 'silent_streamer');
  } else if (stats.totalConfessions >= 1) {
    return confessionBadges.find(b => b.id === 'first_whisper');
  }
  
  return undefined;
};

// NSFW/Explicit content detection
const nsfwWords = [
  // English profanity
  'fuck', 'fucking', 'fucked', 'fucker', 'fucks', 'f*ck', 'f**k',
  'shit', 'shitting', 'shitty', 'bullshit', 'sh*t', 's**t',
  'bitch', 'bitches', 'bitching', 'b*tch', 'b**ch',
  'ass', 'asshole', 'asses', 'a*s', 'a**hole',
  'damn', 'damned', 'goddamn', 'd*mn',
  'hell', 'hells', 'h*ll',
  'crap', 'crappy', 'c*ap',
  'piss', 'pissed', 'pissing', 'p*ss',
  'cock', 'dick', 'penis', 'vagina', 'pussy', 'c*ck', 'd*ck',
  'sex', 'sexual', 'sexy', 'porn', 'pornography', 'nude', 'naked',
  'masturbate', 'masturbation', 'orgasm', 'climax',
  'breast', 'boobs', 'tits', 'nipple', 'nipples',
  'gay', 'lesbian', 'homo', 'queer', 'faggot', 'fag',
  'whore', 'slut', 'prostitute', 'hooker',
  'rape', 'rapist', 'molest', 'abuse', 'assault',
  // Indian profanity
  'chutiya', 'madarchod', 'bhenchod', 'lavda', 'randi', 'chakka',
  'harami', 'behen ke laude', 'chut', 'chutmarika', 'chutia', 'makichu',
  'saala', 'rakhail', 'chutkebal', 'chodu', 'rand', 'gaandu', 'pataka',
  'chuti', 'laundi'
];

const detectExplicitContent = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return nsfwWords.some(word => {
    // Check for exact word matches (with word boundaries)
    const regex = new RegExp(`\\b${word.replace(/\*/g, '.')}\\b`, 'i');
    return regex.test(lowerText);
  });
};

// Extended emoji list for reactions
const reactionEmojis = [
  // Emotions
  { emoji: '❤️', name: 'love', category: 'emotions' },
  { emoji: '😂', name: 'funny', category: 'emotions' },
  { emoji: '🔥', name: 'fire', category: 'emotions' },
  { emoji: '😮', name: 'wow', category: 'emotions' },
  { emoji: '😭', name: 'cry', category: 'emotions' },
  { emoji: '😍', name: 'heart_eyes', category: 'emotions' },
  { emoji: '🥺', name: 'pleading', category: 'emotions' },
  { emoji: '😤', name: 'huffing', category: 'emotions' },
  { emoji: '🤔', name: 'thinking', category: 'emotions' },
  { emoji: '😊', name: 'happy', category: 'emotions' },
  { emoji: '😢', name: 'sad', category: 'emotions' },
  { emoji: '😡', name: 'angry', category: 'emotions' },
  { emoji: '🤯', name: 'mind_blown', category: 'emotions' },
  { emoji: '🥰', name: 'loving', category: 'emotions' },
  { emoji: '😘', name: 'kiss', category: 'emotions' },
  
  // Gestures
  { emoji: '👍', name: 'thumbs_up', category: 'gestures' },
  { emoji: '👎', name: 'thumbs_down', category: 'gestures' },
  { emoji: '👏', name: 'clap', category: 'gestures' },
  { emoji: '🙌', name: 'praise', category: 'gestures' },
  { emoji: '💪', name: 'strong', category: 'gestures' },
  { emoji: '🤝', name: 'handshake', category: 'gestures' },
  { emoji: '🫶', name: 'heart_hands', category: 'gestures' },
  
  // Objects & Symbols
  { emoji: '💯', name: 'hundred', category: 'symbols' },
  { emoji: '⚡', name: 'lightning', category: 'symbols' },
  { emoji: '✨', name: 'sparkles', category: 'symbols' },
  { emoji: '💎', name: 'diamond', category: 'symbols' },
  { emoji: '🎉', name: 'party', category: 'symbols' },
  { emoji: '🚀', name: 'rocket', category: 'symbols' },
  { emoji: '💀', name: 'skull', category: 'symbols' },
  { emoji: '👑', name: 'crown', category: 'symbols' },
  { emoji: '🎯', name: 'target', category: 'symbols' },
  { emoji: '🔮', name: 'crystal_ball', category: 'symbols' },
];
const colors = [
  'from-softgold-400 to-softgold-600',
  'from-softgold-500 to-softgold-700',
  'from-softgold-600 to-softgold-800',
  'from-softgold-300 to-softgold-500',
  'from-softgold-700 to-softgold-900',
  'from-softgold-400 to-softgold-700',
  'from-softgold-500 to-softgold-800',
  'from-softgold-600 to-softgold-900'
];

const famousAliasNames = [
  'CampusCrusader',
  'MidnightWhisper',
  'ConfessionKing',
  'AnonymousOwl',
  'MysteryFox',
  'ShadowScholar',
  'SilentScribe',
  'HiddenHeart',
  'SereneSpecter',
  'SecretSparrow',
  'VioletVigil',
  'WhisperingWillow'
];

// Tags removed from UI

export function ConfessionPage({ onBack, universityId, collegeName, collegeFullName }: ConfessionPageProps) {
  const { currentUser } = useAuth();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [openReplyEmojiPickerId, setOpenReplyEmojiPickerId] = useState<string | null>(null);
  const [replyEmojiPickerSide, setReplyEmojiPickerSide] = useState<'left' | 'right' | 'center'>('left');
  const [newConfession, setNewConfession] = useState('');
  const [showComposerPage, setShowComposerPage] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const [loadingReplies, setLoadingReplies] = useState<{ [key: string]: boolean }>({});
  const [postingReply, setPostingReply] = useState<{ [key: string]: boolean }>({});
  const [showAliasPrompt, setShowAliasPrompt] = useState(true); // Start with alias prompt
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'text' | 'image' | 'poll'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Love confession',
    'Exam stress',
    'Roommate problems',
    'Career advice',
    'Friendship issues'
  ]);

  // Engagement features state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'trending' | 'fresh' | 'top' | 'default'>('all');

  // Auto-sorting state removed - no more auto-refresh functionality

  // Filter categories for confessions
  const filterCategories = [
    { id: 'love', name: 'Love & Relationships', count: 25 },
    { id: 'academic', name: 'Academic Stress', count: 18 },
    { id: 'social', name: 'Social Life', count: 22 },
    { id: 'career', name: 'Career & Future', count: 15 },
    { id: 'family', name: 'Family Issues', count: 12 },
    { id: 'mental-health', name: 'Mental Health', count: 8 },
    { id: 'hobbies', name: 'Hobbies & Interests', count: 10 },
    { id: 'random', name: 'Random Thoughts', count: 30 }
  ];
  const [selectedConfessionId, setSelectedConfessionId] = useState<string | null>(null);
  const [revealedContent, setRevealedContent] = useState<{ [key: string]: boolean }>({});
  const [alias, setAlias] = useState<AliasInfo>({
    name: famousAliasNames[Math.floor(Math.random() * famousAliasNames.length)],
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
    imageUrl: null,
    stats: {
      totalConfessions: 0,
      totalEngagement: 0
    }
  });
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    const SESSION_KEY = 'confession_session_id';
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      const newId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try { localStorage.setItem(SESSION_KEY, newId); } catch {}
      id = newId;
    }
    return id;
  });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const confessionsLengthRef = useRef(0);
  const socketRef = useRef<Socket | null>(null);

  // Helper: map display name to campus code
  const CAMPUS_CODE_MAP: Record<string, string> = {
    'General Confessions': 'general',
    'MIT ADT': 'mit-adt',
    'MIT WPU': 'mit-wpu',
    'VIT Vellore': 'vit-vellore',
    'Parul University': 'parul-university',
    'IIST': 'iist',
  };

  // Fetch user alias from backend on mount
  useEffect(() => {
    const fetchAlias = async () => {
      if (!sessionId) return;
      
      try {
        const response = await apiFetch(`${getServerUrl()}/api/confessions/alias/${sessionId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('✅ Fetched alias from backend:', result.data);
          setAlias(prev => ({
            ...prev,
            name: result.data.name,
            emoji: result.data.emoji,
            color: result.data.color,
            imageUrl: result.data.imageUrl
          }));
          // Always show identity prompt first, even if alias exists
          // User can update their identity or continue with existing one
        }
      } catch (error) {
        // If alias doesn't exist yet, that's okay - identity prompt will show
        console.log('No saved alias found, will show identity prompt');
      }
    };
    
    fetchAlias();
  }, [sessionId]);

  // Load user stats from localStorage (college-specific)
  useEffect(() => {
    const loadUserStats = () => {
      try {
        const statsKey = `user_stats_${universityId || 'general'}_${sessionId}`;
        const savedStats = localStorage.getItem(statsKey);
        if (savedStats) {
          const stats = JSON.parse(savedStats);
          const badge = calculateUserBadge(stats);
          setAlias(prev => ({
            ...prev,
            stats,
            badge,
            color: badge?.pfpColor || prev.color
          }));
        }
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    };

    if (sessionId) {
      loadUserStats();
    }
  }, [sessionId, universityId]);

  const updateUserStats = (newStats: { totalConfessions: number; totalEngagement: number }) => {
    try {
      const statsKey = `user_stats_${universityId || 'general'}_${sessionId}`;
      localStorage.setItem(statsKey, JSON.stringify(newStats));
      const badge = calculateUserBadge(newStats);
      setAlias(prev => ({
        ...prev,
        stats: newStats,
        badge,
        color: badge?.pfpColor || prev.color
      }));
    } catch (error) {
      console.error('Error saving user stats:', error);
    }
  };

  const generateNewAlias = () => {
    setAlias(prev => ({
      ...prev,
      name: famousAliasNames[Math.floor(Math.random() * famousAliasNames.length)],
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      color: prev.badge?.pfpColor || colors[Math.floor(Math.random() * colors.length)]
    }));
  };

  const revealSensitiveContent = (confessionId: string) => {
    setRevealedContent(prev => ({
      ...prev,
      [confessionId]: true
    }));
  };

  // Calculate engagement score based on upvotes, comments, and reactions
  const calculateEngagementScore = useCallback((confession: Confession): number => {
    const upvotes = confession.score;
    const comments = confession.replies;
    const reactions = confession.reactions ? 
      Object.values(confession.reactions).reduce((sum, reaction) => sum + reaction.count, 0) : 0;
    
    return upvotes * 2 + comments * 3 + reactions * 1;
  }, []);

  // Shuffle confessions

  // Load more confessions for infinite scroll
  const loadMoreConfessions = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${getServerUrl()}/api/confessions?cursor=${cursor}&limit=10&campus=${universityId}&sessionId=${encodeURIComponent(sessionId)}`);
      const result = await response.json();
      
      if (result.success && result.data.items.length > 0) {
        const newConfessions = result.data.items.map((c: any) => {
          const formatted = formatConfessionFromServer(c);
          return {
            ...formatted,
            engagementScore: calculateEngagementScore(formatted),
          isBestConfession: false,
          isTrending: false
          };
        });
        
        setConfessions(prev => [...prev, ...newConfessions]);
        setCursor(prev => prev + result.data.items.length);
        setHasMore(result.data.nextCursor !== null);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more confessions:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, hasMore]);

  // Load trending and best confession data
  const loadTrendingAndBestData = useCallback(async () => {
    try {
      const [trendingResponse, bestResponse] = await Promise.all([
        fetch(`${getServerUrl()}/api/confessions/trending?campus=${universityId}`),
        fetch(`${getServerUrl()}/api/confessions/best?campus=${universityId}`)
      ]);
      
      const trendingResult = await trendingResponse.json();
      const bestResult = await bestResponse.json();
      
      if (trendingResult.success && bestResult.success) {
        const trendingIds = new Set(trendingResult.data.map((c: any) => c.id));
        const bestId = bestResult.data?.id;
        
        setConfessions(prev => prev.map(confession => ({
          ...confession,
          isTrending: trendingIds.has(confession.id),
          isBestConfession: confession.id === bestId
        })));
      }
    } catch (error) {
      console.error('Error loading trending/best data:', error);
    }
  }, []);

  const handleAliasContinue = async () => {
    if (alias.name.trim()) {
      // Ensure a stable session id for this device/session so users can delete their own confessions
      const SESSION_KEY = 'confession_session_id';
      let id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        const newId: string = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
          ? (crypto as any).randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        try { localStorage.setItem(SESSION_KEY, newId); } catch {}
        id = newId;
      }
      setSessionId(id);
      
      // Save alias to backend
      try {
        const response = await apiFetch(`${getServerUrl()}/api/confessions/alias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: id,
            name: alias.name,
            emoji: alias.emoji,
            color: alias.color,
            imageUrl: alias.imageUrl
          })
        });
        const result = await response.json();
        if (result.success) {
          console.log('✅ Alias saved to backend');
        }
      } catch (error) {
        console.error('Failed to save alias to backend:', error);
        // Continue anyway - alias is stored locally
      }
      
      setShowAliasPrompt(false);
      setShowDisclaimer(true);
    }
  };

  const STORAGE_KEY = `nexus_confessions_${universityId || 'general'}_v1`;

const formatConfessionFromServer = (serverConfession: any): Confession => {
    const timestampValue = serverConfession.createdAt || serverConfession.created_at;
    const aliasValue = serverConfession.alias || serverConfession.meta?.alias || {
          name: 'Anonymous',
          emoji: '👤',
          color: 'from-gray-500 to-gray-600'
    };
    const reactionsValue = serverConfession.reactions && typeof serverConfession.reactions === 'object'
      ? serverConfession.reactions
      : {};
    const pollValue = serverConfession.poll && typeof serverConfession.poll === 'object'
      ? {
          question: serverConfession.poll.question || '',
          options: Array.isArray(serverConfession.poll.options) ? serverConfession.poll.options : [],
          votes: serverConfession.poll.votes && typeof serverConfession.poll.votes === 'object'
            ? serverConfession.poll.votes
            : {}
        }
      : undefined;

    return {
      id: serverConfession.id,
      content: serverConfession.content || '',
      timestamp: new Date(timestampValue),
      likes: serverConfession.likes || serverConfession.score || 0,
      replies: serverConfession.replies || serverConfession.replies_count || 0,
      category: serverConfession.category || 'random',
      mood: serverConfession.mood || 'neutral',
      characterCount: (serverConfession.content || '').length,
      authorAlias: aliasValue,
      score: serverConfession.score || 0,
      userVote: typeof serverConfession.userVote === 'number' ? serverConfession.userVote : 0,
      reactions: reactionsValue,
      backgroundImageUrl: serverConfession.backgroundImageUrl || null,
      creatorSessionId: serverConfession.sessionId || serverConfession.session_id || null,
      isBestConfession: Boolean(serverConfession.isBestConfession),
      isTrending: Boolean(serverConfession.isTrending),
      engagementScore: 0,
      poll: pollValue,
      isExplicit: Boolean(serverConfession.isExplicit)
    };
  };

  const mergeServerConfession = (local: Confession, server: any): Confession => {
    const formatted = formatConfessionFromServer(server);
    return {
      ...local,
      id: formatted.id,
      timestamp: formatted.timestamp,
      score: formatted.score,
      replies: formatted.replies,
      reactions: formatted.reactions,
      poll: formatted.poll,
      isExplicit: formatted.isExplicit,
      authorAlias: formatted.authorAlias,
      creatorSessionId: formatted.creatorSessionId
    };
  };

  const formatReplyFromServer = (reply: any): Reply => ({
    id: reply.id,
    content: reply.content || '',
    timestamp: new Date(reply.createdAt || reply.created_at || Date.now()),
        authorAlias: {
      name: typeof reply.alias === 'string' ? reply.alias : reply.alias?.name || reply.alias || 'Anonymous',
      emoji: '👤',
      color: 'from-blue-500 to-indigo-500'
    },
    score: reply.score || 0,
    userVote: reply.userVote || 0
  });

  const loadConfessionsFromServer = useCallback(async () => {
    setLoading(true);
    try {
      // Map display name to code if needed
      let campusCode = universityId;
      if (CAMPUS_CODE_MAP[universityId]) campusCode = CAMPUS_CODE_MAP[universityId];
      const validCampuses = Object.values(CAMPUS_CODE_MAP);
      if (!campusCode || !validCampuses.includes(campusCode)) {
        setConfessions([]);
        setHasMore(false);
        setCursor(0);
        setLoading(false);
        alert('Please select a valid college/campus.');
        return;
      }
      // Pass sessionId to get user's vote status
      const response = await apiFetch(`${getServerUrl()}/api/confessions?cursor=0&limit=10&campus=${campusCode}&sessionId=${encodeURIComponent(sessionId)}`);
      const result = await response.json();

      if (result.success && result.data.items.length > 0) {
        const formatted = result.data.items.map((c: any) => formatConfessionFromServer(c));

        const confessionsWithEngagement = formatted.map(confession => ({
          ...confession,
          engagementScore: calculateEngagementScore(confession)
        }));

        setConfessions(confessionsWithEngagement);
        setHasMore(result.data.nextCursor !== null);
        setCursor(result.data.items.length);

        // Save to localStorage for persistence across refreshes
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            confessions: confessionsWithEngagement,
            cursor: result.data.items.length,
            hasMore: result.data.nextCursor !== null,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.warn('Failed to save confessions to localStorage:', error);
        }
      } else {
        setConfessions([]);
        setHasMore(false);
        setCursor(0);
      }
    } catch (error) {
      console.error('Error loading confessions from server:', error);
      setConfessions([]);
      setCursor(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [calculateEngagementScore]);

  useEffect(() => {
    // Try to load from localStorage first, then from server
    const loadCachedConfessions = async () => {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const cacheAge = Date.now() - parsed.timestamp;

          // Use cache if it's less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            console.log('📦 Loading confessions from localStorage cache');
            setConfessions(parsed.confessions);
            setCursor(parsed.cursor);
            setHasMore(parsed.hasMore);
            return;
          } else {
            console.log('📦 Cache expired, loading from server');
          }
        }
      } catch (error) {
        console.warn('Failed to load confessions from localStorage:', error);
      }

      // Load from server if no cache or cache expired
      await loadConfessionsFromServer();
    };

    loadCachedConfessions();
  }, []); // Remove dependency on loadConfessionsFromServer to avoid circular dependency

  useEffect(() => {
    confessionsLengthRef.current = confessions.length;
  }, [confessions.length]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (isFetchingRef.current || document.hidden) return;

      isFetchingRef.current = true;
      try {
        const response = await apiFetch(`${getServerUrl()}/api/confessions?cursor=0&limit=${Math.max(confessionsLengthRef.current, 10)}&campus=${universityId}&sessionId=${encodeURIComponent(sessionId)}`);
        const result = await response.json();

        if (result.success && result.data.items.length >= confessionsLengthRef.current) {
        const limitedItems = confessionsLengthRef.current > 0
          ? result.data.items.slice(0, confessionsLengthRef.current)
          : result.data.items;

        const formatted = limitedItems.map((c: any) => formatConfessionFromServer(c));
        const confessionsWithEngagement = formatted.map(confession => ({
          ...confession,
          engagementScore: calculateEngagementScore(confession)
        }));

        setConfessions(confessionsWithEngagement);
        setHasMore(result.data.nextCursor !== null);
        setCursor(limitedItems.length);

        // Save to localStorage for persistence across refreshes
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            confessions: confessionsWithEngagement,
            cursor: limitedItems.length,
            hasMore: result.data.nextCursor !== null,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.warn('Failed to save confessions to localStorage in background refresh:', error);
        }
        }
      } catch (error) {
        // Only log errors in development, don't spam the console in production
        if (import.meta.env.DEV) {
          console.warn('Background refresh failed:', error);
        }
      } finally {
        isFetchingRef.current = false;
      }
    }, 2000); // Auto-refresh every 2 seconds

    return () => clearInterval(interval);
  }, [calculateEngagementScore]);

  // Socket.IO real-time updates for new confessions
  useEffect(() => {
    const initializeSocket = async () => {
      const token = (localStorage.getItem('nexus-auth') && JSON.parse(localStorage.getItem('nexus-auth')||'{}')?.currentSession?.access_token) || null;
      const { createSocket } = await import('../lib/socketConfig');
      
      const socket = await createSocket({
        url: getServerUrl(),
        token,
        options: {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        }
      });
      socketRef.current = socket;
    };

    initializeSocket().then(() => {
      const socket = socketRef.current;
      if (socket) {
        socket.on('connect', () => {
          console.log('🔌 Socket.IO connected successfully');
          // Join confession rooms for existing confessions to receive poll updates
          confessions.forEach(confession => {
            if (confession.id) {
              socket.emit('join-confession', confession.id);
              console.log(`👥 Joined confession room: confession-${confession.id}`);
            }
          });
        });

        socket.on('connect_error', (error) => {
          console.error('❌ Socket.IO connection error:', error);
        });

        socket.on('disconnect', (reason) => {
          console.log('🔌 Socket.IO disconnected:', reason);
        });
      }
    });

    return () => {
      const socket = socketRef.current;
      if (socket) {
        socket.disconnect();
      }
    };
  }, [confessions]);

  // Auto-refresh votes every 2 seconds
  useEffect(() => {
    const refreshVotes = async () => {
      // Only refresh if we have confessions loaded
      if (confessions.length === 0) return;
      
      try {
        // Fetch latest confession data to get updated vote counts
        const confessionIds = confessions.map(c => c.id).slice(0, 20); // Limit to first 20 for performance
        
        // Fetch each confession's current vote state from the server
        for (const id of confessionIds) {
          try {
            const response = await apiFetch(`${getServerUrl()}/api/confessions/${id}`, {
              method: 'GET'
            });
            const result = await response.json();
            
            if (result.success && result.data) {
              // Update the confession with fresh vote data
              setConfessions(prev => prev.map(c => 
                c.id === id 
                  ? { ...c, score: result.data.score, userVote: result.data.userVote ?? c.userVote }
                  : c
              ));
            }
          } catch (error) {
            // Silently fail for individual confessions
            console.debug(`Failed to refresh votes for confession ${id}`);
          }
        }
      } catch (error) {
        console.debug('Auto-refresh votes failed:', error);
      }
    };

    // Initial refresh
    refreshVotes();

    // Set up interval for auto-refresh every 2 seconds
    const intervalId = setInterval(refreshVotes, 2000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [confessions.length]); // Re-run when confession count changes

  // Socket.IO event handlers (run once on mount)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Handle new confessions
    socket.on('new-confession', (confession) => {
      console.log('📨 New confession received:', confession);

      // Format the new confession
      const formattedConfession = formatConfessionFromServer(confession);
      const enhancedConfession = {
        ...formattedConfession,
        engagementScore: calculateEngagementScore(formattedConfession)
      };

      // Add to the beginning of the list
      setConfessions(prevConfessions => {
        // Check if confession already exists to avoid duplicates
        const exists = prevConfessions.some(c => c.id === confession.id);
        if (exists) return prevConfessions;

        const updatedConfessions = [enhancedConfession, ...prevConfessions];

        // Update localStorage cache
        try {
          localStorage.setItem('confessions_cache', JSON.stringify({
            confessions: updatedConfessions,
            cursor: confessionsLengthRef.current + 1,
            hasMore: hasMore,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.warn('Failed to update confessions cache in localStorage:', error);
        }

        return updatedConfessions;
      });

      // Update length ref
      confessionsLengthRef.current += 1;

      // Join the new confession room
      socket.emit('join-confession', confession.id);
    });

    // Handle poll updates
    socket.on('poll-update', (data) => {
      try {
        console.log('📊 Poll update received:', data);
        if (data && typeof data === 'object' && data.id && data.poll) {
          setConfessions(prevConfessions =>
            prevConfessions.map(confession =>
              confession.id === data.id
                ? { ...confession, poll: data.poll }
                : confession
            )
          );
        }
      } catch (error) {
        console.error('Error handling poll update:', error);
      }
    });

    // Handle vote updates
    socket.on('vote-update', (data) => {
      try {
        console.log('📊 Vote update received:', data);
        if (data && typeof data === 'object' && data.confessionId && typeof data.score === 'number') {
          setConfessions(prevConfessions =>
            prevConfessions.map(confession => {
              if (confession.id === data.confessionId) {
                // Update score for everyone, but only update userVote if it's this user's vote
                const updates: any = { score: data.score };
                if (data.sessionId === sessionId && typeof data.userVote === 'number') {
                  updates.userVote = data.userVote;
                }
                return { ...confession, ...updates };
              }
              return confession;
            })
          );
        }
      } catch (error) {
        console.error('Error handling vote update:', error);
      }
    });

    // Handle reaction updates
    socket.on('reaction-update', (data) => {
      try {
        console.log('🎭 Reaction update received:', data);
        if (data && typeof data === 'object' && data.confessionId && data.reactions) {
          setConfessions(prevConfessions =>
            prevConfessions.map(confession =>
              confession.id === data.confessionId
                ? { ...confession, reactions: data.reactions }
                : confession
            )
          );
        }
      } catch (error) {
        console.error('Error handling reaction update:', error);
      }
    });

    // Handle new comments
    socket.on('new-comment', (comment) => {
      try {
        console.log('📨 New comment received:', comment);
        if (comment && typeof comment === 'object' && comment.confessionId) {
          setConfessions(prevConfessions =>
            prevConfessions.map(confession =>
              confession.id === comment.confessionId
                ? { ...confession, replies: (confession.replies || 0) + 1 }
                : confession
            )
          );
        }
      } catch (error) {
        console.error('Error handling new comment:', error);
      }
    });

    // Handle comment vote updates
    socket.on('comment-vote-update', (data) => {
      try {
        console.log('📊 Comment vote update received:', data);
        if (data && typeof data === 'object' && data.id && typeof data.score === 'number') {
          // Update the replies list if it exists for the confession
          setConfessions(prevConfessions =>
            prevConfessions.map(confession =>
              confession.id === data.confessionId
                ? {
                    ...confession,
                    repliesList: confession.repliesList?.map(reply =>
                      reply.id === data.id
                        ? { ...reply, score: data.score }
                        : reply
                    )
                  }
                : confession
            )
          );
        }
      } catch (error) {
        console.error('Error handling comment vote update:', error);
      }
    });

    // Handle confession updates (like reply count changes)
    socket.on('confession-updated', (data) => {
      try {
        console.log('📝 Confession updated:', data);
        if (data && typeof data === 'object' && data.id && typeof data.replies === 'number') {
          setConfessions(prevConfessions =>
            prevConfessions.map(confession =>
              confession.id === data.id
                ? { ...confession, replies: data.replies }
                : confession
            )
          );
        }
      } catch (error) {
        console.error('Error handling confession update:', error);
      }
    });

    return () => {
      socket.off('new-confession');
      socket.off('poll-update');
      socket.off('vote-update');
      socket.off('new-comment');
      socket.off('comment-vote-update');
      socket.off('confession-updated');
    };
  }, [calculateEngagementScore]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreConfessions();
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [loadMoreConfessions]);


  // Load trending and best confession data
  useEffect(() => {
    if (confessions.length > 0) {
      loadTrendingAndBestData();
    }
  }, [confessions.length, loadTrendingAndBestData]);


  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterMenu && filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    if (showFilterMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showFilterMenu]);


  const handleComposerSubmit = async (data: {
    content: string;
    image?: File | null;
    poll?: {
      question: string;
      options: string[];
    } | null;
  }) => {
    setIsPosting(true);
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const SESSION_KEY = 'confession_session_id';
      const newSessionId = localStorage.getItem(SESSION_KEY) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try { localStorage.setItem(SESSION_KEY, newSessionId); } catch {}
      setSessionId(newSessionId);
      currentSessionId = newSessionId;
    }

    // Detect explicit content
    const contentToCheck = `${data.content || ''} ${data.poll?.question || ''} ${data.poll?.options.join(' ') || ''}`;
    const isExplicit = detectExplicitContent(contentToCheck);

    // Create confession locally first (optimistic update)
    const newConfessionObj: Confession = {
      id: `local-${Date.now()}`,
      content: data.content || '', // Allow empty content if other media is present
      timestamp: new Date(),
      likes: 0,
      replies: 0,
      isLiked: false,
      category: 'random',
      mood: 'neutral',
      characterCount: (data.content || '').length,
      repliesList: [],
      authorAlias: alias,
      score: 0,
      userVote: 0,
      reactions: {},
      backgroundImageUrl: data.image ? URL.createObjectURL(data.image) : null,
      creatorSessionId: currentSessionId,
      engagementScore: 0,
      isBestConfession: false,
      isTrending: false,
      isExplicit,
      poll: data.poll ? {
        question: data.poll.question,
        options: data.poll.options,
        votes: {}
      } : undefined
    };

    // Add locally first
    setConfessions(prev => {
      const updated = [newConfessionObj, ...prev];
      // Also save to localStorage (college-specific)
      try {
        const storageKey = `nexus_confessions_${universityId || 'general'}_v1`;
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
      return updated;
    });
    
    // Update user stats (increment confession count)
    const currentStats = alias.stats || { totalConfessions: 0, totalEngagement: 0 };
    const newStats = {
      ...currentStats,
      totalConfessions: currentStats.totalConfessions + 1
    };
    updateUserStats(newStats);
    
    setShowComposerPage(false);

    try {
      console.log('📤 Posting confession to server:', {
        content: data.content?.substring(0, 50) + '...',
        alias: alias.name,
        sessionId: currentSessionId,
        hasPoll: !!data.poll
      });

      // Map display name to code if needed
      let campusCode = universityId;
      if (CAMPUS_CODE_MAP[universityId]) campusCode = CAMPUS_CODE_MAP[universityId];
      const validCampuses = Object.values(CAMPUS_CODE_MAP);
      if (!campusCode || !validCampuses.includes(campusCode)) {
        alert('Please select a valid college/campus before posting a confession.');
        return;
      }

      const response = await apiFetch(`${getServerUrl()}/api/confessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data.content || '',
          alias: alias,
          sessionId: currentSessionId,
          poll: data.poll,
          campus: campusCode, // Always send valid code
          userName: (currentUser?.displayName) || alias?.name || null,
          userEmail: (JSON.parse(localStorage.getItem('nexus-auth')||'{}')?.user?.email) || null,
          anonymousName: alias?.name || null,
          avatar: alias || null,
          uploads: data?.uploads || null,
          searchHistory: recentSearches || []
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Confession POST failed:', response.status, errorText);
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Confession created successfully:', result);
      
      if (result.success) {
        // Update with server response
        setConfessions(prev => prev.map(c => 
          c.id === newConfessionObj.id ? { ...c, id: result.data.id } : c
        ));
        console.log('✅ Confession added to local state with ID:', result.data.id);
      } else {
        console.error('❌ Failed to post confession:', result.message || 'Unknown error');
        // Remove the optimistic update
        setConfessions(prev => prev.filter(c => c.id !== newConfessionObj.id));
      }
    } catch (error) {
      console.error('❌ Error posting confession:', error);
      // Remove the optimistic update
      setConfessions(prev => prev.filter(c => c.id !== newConfessionObj.id));
      // Show user-friendly error
      alert('Failed to post confession. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handlePost = async () => {
    if (!newConfession.trim() || isPosting) return;
    
    setIsPosting(true);
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const SESSION_KEY = 'confession_session_id';
      const newSessionId = localStorage.getItem(SESSION_KEY) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try { localStorage.setItem(SESSION_KEY, newSessionId); } catch {}
      setSessionId(newSessionId);
      currentSessionId = newSessionId;
    }

    // Create confession locally first (optimistic update)
    const newConfessionObj: Confession = {
      id: `local-${Date.now()}`,
      content: newConfession,
      timestamp: new Date(),
      likes: 0,
      replies: 0,
      isLiked: false,
      category: 'random',
      mood: 'neutral',
      characterCount: newConfession.length,
      repliesList: [],
      authorAlias: alias,
      score: 0,
      userVote: 0,
      reactions: {},
      backgroundImageUrl,
      creatorSessionId: currentSessionId,
      engagementScore: 0,
      isBestConfession: false,
      isTrending: false
    };

    // Add locally first
    setConfessions(prev => [newConfessionObj, ...prev]);
    setNewConfession('');
    setShowComposerPage(false);
    setBackgroundImageUrl(null);

    try {
      // Try to save to backend
      const res = await apiFetch(`${getServerUrl()}/api/confessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newConfessionObj.content, 
          alias: alias, 
          sessionId: currentSessionId,
          campus: CAMPUS_CODE_MAP[universityId] || universityId,
          userName: (currentUser?.displayName) || alias?.name || null,
          userEmail: (JSON.parse(localStorage.getItem('nexus-auth')||'{}')?.user?.email) || null,
          anonymousName: alias?.name || null,
          avatar: alias || null,
          uploads: null,
          searchHistory: recentSearches || []
        })
      });
      const json = await res.json();
      if (json.success) {
        // Update with backend ID
        setConfessions(prev => prev.map(c => 
          c.id === newConfessionObj.id 
            ? { ...c, id: json.data.id }
            : c
        ));
      }
    } catch (error) {
      console.error('Failed to save confession to backend (keeping local copy):', error);
      // Confession is already added locally, so no need to revert
    } finally {
      setIsPosting(false);
    }
  };

  const deleteConfession = async (confessionId: string) => {
    try {
      const response = await apiFetch(`${getServerUrl()}/api/confessions/${confessionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Remove from local state
        setConfessions(prev => prev.filter(c => c.id !== confessionId));
      } else {
        // Show error message
        console.error('Failed to delete confession:', result.message);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error deleting confession:', error);
      // Fallback: still remove from local state for better UX
      setConfessions(prev => prev.filter(c => c.id !== confessionId));
    }
  };

  // Helper function to get accurate comment count
  const getCommentCount = (confession: Confession) => {
    return confession.repliesList ? confession.repliesList.length : (confession.replies || 0);
  };

  // Search and filter handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Add to recent searches if not already present
    if (query.trim() && !recentSearches.includes(query.trim())) {
      setRecentSearches(prev => [query.trim(), ...prev.slice(0, 4)]);
    }
  };

  const handleFilter = (filters: { categories: string[]; tags: string[] }) => {
    // Update the filter type based on filter selection
    if (filters.categories.length > 0) {
      // Map confession categories to filter types
      const categoryMap: Record<string, 'all' | 'text' | 'image' | 'poll'> = {
        'love': 'text',
        'academic': 'text',
        'social': 'text',
        'career': 'text',
        'family': 'text',
        'mental-health': 'text',
        'hobbies': 'text',
        'random': 'all'
      };
      setFilterType(categoryMap[filters.categories[0]] || 'all');
    } else {
      setFilterType('all');
    }
  };

  // Likes toggle removed in redesign

  const toggleVote = async (confessionId: string, direction: 1 | -1) => {
    // Optimistic local update
    let nextVoteForRequest: -1 | 0 | 1 = 0;
    setConfessions(previousConfessions => previousConfessions.map(confession => {
      if (confession.id !== confessionId) return confession;
      const currentVote = confession.userVote;
      let nextVote: -1 | 0 | 1 = currentVote;
      let scoreDelta = 0;
      if (direction === 1) {
        nextVote = currentVote === 1 ? 0 : 1;
      } else {
        nextVote = currentVote === -1 ? 0 : -1;
      }
      scoreDelta = nextVote - currentVote;
      nextVoteForRequest = nextVote;
      return { ...confession, userVote: nextVote, score: Math.max(0, confession.score + scoreDelta) };
    }));

    try {
      const SESSION_KEY = 'confession_session_id';
      const currentSessionId = localStorage.getItem(SESSION_KEY) || sessionId || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try { localStorage.setItem(SESSION_KEY, currentSessionId); } catch {}
      await apiFetch(`${getServerUrl()}/api/confessions/${confessionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, sessionId: currentSessionId })
      });
    } catch (err) {
      if (import.meta.env.DEV) console.warn('vote API failed', err);
    }
  };

  const toggleReaction = (confessionId: string, reactionType: string) => {
    console.log('toggleReaction called:', { confessionId, reactionType });
    
    setConfessions(previousConfessions => previousConfessions.map(confession => {
      if (confession.id !== confessionId) return confession;
      
      console.log('Processing confession:', confession.id, 'current reactions:', confession.reactions);
      
      const reactions = { ...(confession.reactions || {}) } as Record<string, { count: number; userReacted: boolean }>;
      
      // Check if user is already reacting with this type
      const current = reactions[reactionType] || { count: 0, userReacted: false };
      
      console.log('Current reaction state:', { reactionType, current });
      
      if (current.userReacted) {
        // User is removing their reaction
        reactions[reactionType] = { count: Math.max(0, current.count - 1), userReacted: false };
        console.log('Removing reaction');
      } else {
        // User is adding a new reaction - first remove any existing reactions
        Object.keys(reactions).forEach(key => {
          if (reactions[key].userReacted) {
            reactions[key] = { count: Math.max(0, reactions[key].count - 1), userReacted: false };
          }
        });
        
        // Then add the new reaction
        reactions[reactionType] = { count: current.count + 1, userReacted: true };
        console.log('Adding reaction');
      }
      
      console.log('Updated reactions:', reactions);
      
      // Send reaction to server with sessionId
      apiFetch(`${getServerUrl()}/api/confessions/${confessionId}/react`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          reaction: reactionType,
          sessionId: sessionId || 'anonymous' 
        }) 
      }).then(response => response.json())
        .then(result => {
          console.log('✅ Reaction server response:', result);
          // Update with server-side aggregated reactions
          if (result.success && result.data.reactions) {
            setConfessions(prev => prev.map(c => 
              c.id === confessionId ? { ...c, reactions: result.data.reactions } : c
            ));
          }
        })
        .catch(error => console.error('❌ Reaction API error:', error));
      
      return { ...confession, reactions };
    }));
    
  };

  const getUserReactionName = (confession: any): string | null => {
    const entries = Object.entries(confession.reactions || {}) as [string, { count: number; userReacted: boolean }][];
    const found = entries.find(([_, data]) => data.userReacted);
    return found ? found[0] : null;
  };

  const handlePollVote = (confessionId: string, optionIndex: number) => {
    setConfessions(previousConfessions => previousConfessions.map(confession => {
      if (confession.id !== confessionId || !confession.poll) return confession;
      
      const currentUserId = sessionId || 'anonymous';
      const selectedOption = confession.poll.options[optionIndex];
      const updatedVotes = { ...(confession.poll.votes || {}) };
      
      // Check if user already voted for this option
      if (updatedVotes[currentUserId] === selectedOption) {
        // Remove vote
        delete updatedVotes[currentUserId];
      } else {
        // Add/change vote
        updatedVotes[currentUserId] = selectedOption;
      }
      
      const updatedPoll = {
        ...confession.poll,
        votes: updatedVotes
      };
      
      // Fire-and-forget to server; optimistic
      apiFetch(`${getServerUrl()}/api/confessions/${confessionId}/poll-vote`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ option: selectedOption, userId: currentUserId }) 
      }).catch(()=>{});
      
      return { ...confession, poll: updatedPoll };
    }));
  };

  const addReply = async (confessionId: string, replyContent: string) => {
    if (!replyContent.trim() || postingReply[confessionId]) return;
    
    setPostingReply(prev => ({ ...prev, [confessionId]: true }));
    
    // Create reply object
    const newReply: Reply = {
      id: `${confessionId}-${Date.now()}`,
      content: replyContent.trim(),
      timestamp: new Date(),
      authorAlias: alias,
      score: 0,
      userVote: 0
    };

    // Add reply locally first (optimistic update)
    setConfessions(prev => prev.map(confession => 
      confession.id === confessionId 
        ? { 
            ...confession, 
            replies: confession.replies + 1,
            repliesList: [...(confession.repliesList || []), newReply]
          }
        : confession
    ));
    
    try {
      // Try to save to backend
      const response = await apiFetch(`${getServerUrl()}/api/confessions/${confessionId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent.trim(),
          alias: alias.name,
          sessionId: sessionId,
          campus: universityId // Add campus field for replies
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update with backend ID if successful
        setConfessions(prev => prev.map(confession => 
          confession.id === confessionId 
            ? { 
                ...confession, 
                repliesList: confession.repliesList?.map(reply => 
                  reply.id === newReply.id 
                    ? { ...reply, id: result.data.id }
                    : reply
                ) || []
              }
            : confession
        ));
      }
    } catch (error) {
      console.error('Failed to save reply to backend (keeping local copy):', error);
      // Reply is already added locally, so no need to revert
    } finally {
      setPostingReply(prev => ({ ...prev, [confessionId]: false }));
    }
  };

  const loadReplies = async (confessionId: string) => {
    if (loadingReplies[confessionId]) return;
    
    setLoadingReplies(prev => ({ ...prev, [confessionId]: true }));
    
    try {
      // Try to load from backend first
      const response = await apiFetch(`${getServerUrl()}/api/confessions/${confessionId}/replies?campus=${universityId}`);
      const result = await response.json();
      
      if (result.success) {
        const replies: Reply[] = result.data.map((r: any) => ({
          id: String(r.id),
          content: String(r.content || ''),
          timestamp: r.createdAt ? new Date(r.createdAt) : new Date(),
          authorAlias: typeof r.alias === 'string'
            ? { name: r.alias, emoji: '👤', color: 'from-gray-500 to-gray-600' }
            : {
                name: r.alias?.name || 'Anonymous',
                emoji: r.alias?.emoji || '👤',
                color: r.alias?.color || 'from-gray-500 to-gray-600'
              },
          score: Number(r.score) || 0,
          userVote: Number(r.userVote) || 0
        }));
        
        setConfessions(prev => prev.map(confession => 
          confession.id === confessionId 
            ? { ...confession, repliesList: replies }
            : confession
        ));
      }
    } catch (error) {
      console.error('Error loading replies (using local fallback):', error);
      // Fallback: replies are already loaded from localStorage or mock data
      // No need to show error to user, just use existing repliesList
    } finally {
      setLoadingReplies(prev => ({ ...prev, [confessionId]: false }));
    }
  };

  const toggleRepliesVisibility = (confessionId: string) => {
    const isCurrentlyShowing = showReplies[confessionId];
    
    setShowReplies(prev => ({
      ...prev,
      [confessionId]: !isCurrentlyShowing
    }));
    
    // Only try to load from backend if replies list is empty and we're showing
    if (!isCurrentlyShowing) {
      const confession = confessions.find(c => c.id === confessionId);
      if (!confession?.repliesList || confession.repliesList.length === 0) {
        loadReplies(confessionId);
      }
    }
  };

  const toggleReplyVote = async (confessionId: string, replyId: string, direction: 1 | -1) => {
    // Optimistic update
    setConfessions(previousConfessions => previousConfessions.map(confession => {
      if (confession.id !== confessionId) return confession;
      const updatedReplies = (confession.repliesList || []).map(reply => {
        if (reply.id !== replyId) return reply;
        const currentVote = (reply.userVote ?? 0) as -1 | 0 | 1;
        let nextVote: -1 | 0 | 1 = currentVote;
        let scoreDelta = 0;
        if (direction === 1) {
          if (currentVote === 1) { nextVote = 0; scoreDelta = -1; }
          else if (currentVote === 0) { nextVote = 1; scoreDelta = 1; }
          else if (currentVote === -1) { nextVote = 1; scoreDelta = 1; }
        } else {
          if (currentVote === -1) { nextVote = 0; scoreDelta = 1; }
          else if (currentVote === 0) { nextVote = -1; scoreDelta = -1; }
          else if (currentVote === 1) { nextVote = -1; scoreDelta = -1; }
        }
        const currentScore = (reply.score ?? 0) as number;
        return { ...reply, userVote: nextVote, score: Math.max(0, currentScore + scoreDelta) };
      });
      return { ...confession, repliesList: updatedReplies };
    }));

    // Send to backend
    try {
      const response = await apiFetch(`${getServerUrl()}/api/confessions/${confessionId}/reply/${replyId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
      });
      
      const result = await response.json();
      if (!result.success) {
        console.error('Failed to vote on reply:', result.message);
        // Could revert optimistic update here if needed
      }
    } catch (error) {
      console.error('Error voting on reply:', error);
      // Could revert optimistic update here if needed
    }
  };

  const formatTimeAgo = (dateInput: Date | string | number | null | undefined) => {
    try {
      // Handle null, undefined, or empty values
      if (!dateInput) {
        return 'Just now';
      }

      // Convert input to a valid Date object
      let date: Date;

      if (typeof dateInput === 'string') {
        // Handle ISO date strings or other date string formats
        date = new Date(dateInput);
      } else if (typeof dateInput === 'number') {
        // Handle Unix timestamps
        date = new Date(dateInput);
      } else if (dateInput instanceof Date) {
        // Already a Date object
        date = dateInput;
      } else {
        // Fallback for any other type
        console.warn('formatTimeAgo received invalid date input:', dateInput);
        return 'Just now';
      }

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('formatTimeAgo received invalid date:', dateInput);
        return 'Just now';
      }

      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInSeconds = Math.floor(diffInMs / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      // Return appropriate time format
      if (diffInSeconds < 60) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInDays < 7) return `${diffInDays}d ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
      if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;

      return `${Math.floor(diffInDays / 365)}y ago`;
    } catch (error) {
      console.error('Error in formatTimeAgo:', error, 'with input:', dateInput);
      return 'Just now';
    }
  };

  const canDeleteConfession = (confession: Confession) => {
    if (!confession.creatorSessionId || confession.creatorSessionId !== sessionId) {
      return false;
    }
    
    const now = new Date();
    const confessionTime = new Date(confession.timestamp);
    const hoursSincePosted = (now.getTime() - confessionTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSincePosted < 24;
  };

  const getDeletionTimeRemaining = (confession: Confession) => {
    const now = new Date();
    const confessionTime = new Date(confession.timestamp);
    const hoursSincePosted = (now.getTime() - confessionTime.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = 24 - hoursSincePosted;
    
    if (hoursRemaining <= 0) return null;
    
    if (hoursRemaining < 1) {
      const minutesRemaining = Math.floor(hoursRemaining * 60);
      return `${minutesRemaining}m`;
    }
    
    return `${Math.floor(hoursRemaining)}h`;
  };


  // Filter and search confessions
  const filteredConfessions = confessions.filter(confession => {
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesContent = confession.content.toLowerCase().includes(query);
      const matchesAuthor = confession.authorAlias?.name?.toLowerCase().includes(query) || false;
      const matchesPoll = confession.poll?.question.toLowerCase().includes(query) || 
                         confession.poll?.options.some(option => option.toLowerCase().includes(query));
      
      if (!matchesContent && !matchesAuthor && !matchesPoll) {
        return false;
      }
    }

    // Apply type filter
    if (filterType !== 'all') {
      switch (filterType) {
        case 'text':
          return confession.content.trim().length > 0 && !confession.backgroundImageUrl && !confession.poll;
        case 'image':
          return !!confession.backgroundImageUrl;
        case 'poll':
          return !!confession.poll;
        default:
          return true;
      }
    }

    return true;
  });

  // Show confession detail page
  if (selectedConfessionId) {
    return (
      <ConfessionDetailPage
        confessionId={selectedConfessionId}
        onBack={() => setSelectedConfessionId(null)}
        universityId={universityId}
      />
    );
  }

  // Show composer page
  if (showComposerPage) {
    return (
      <ConfessionComposer
        onBack={() => setShowComposerPage(false)}
        onSubmit={handleComposerSubmit}
        alias={alias}
      />
    );
  }

  if (showAliasPrompt) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 z-50">
        
        <div className="relative bg-black/80 backdrop-blur-2xl border-2 border-rosegold-500 rounded-3xl p-8 w-full max-w-md">
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              {/* Avatar */}
              <div className="relative mx-auto mb-6 w-24 h-24">
                {alias.imageUrl ? (
                  <img 
                    src={alias.imageUrl} 
                    alt="Alias avatar" 
                    className="relative w-24 h-24 rounded-3xl object-cover border-2 border-[#b76e79]/30 " 
                  />
                ) : (
                  <div className={`relative w-24 h-24 bg-gradient-to-br ${alias.color} rounded-3xl flex items-center justify-center text-4xl border-2 border-[#b76e79]/30 `}>
                    {alias.emoji}
                  </div>
                )}
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-3">
                Create Your Identity
              </h2>
              <p className="text-[#a1a1aa] text-sm leading-relaxed px-2">
                Choose an anonymous identity for this session.<br/>
                <span className="text-[#b76e79]/80">Complete privacy guaranteed.</span>
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Name Input */}
              <div>
                <label htmlFor="alias-name" className="text-white font-semibold mb-3 block text-sm">
                  Anonymous Name
                </label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      id="alias-name"
                      type="text"
                      value={alias.name}
                      onChange={(e) => setAlias(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your alias..."
                      maxLength={20}
                      className="w-full bg-black/50 backdrop-blur-sm border border-[#b76e79]/20 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 focus:border-[#b76e79]/50 focus:outline-none focus:ring-2 focus:ring-[#b76e79]/20 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#b76e79]/5 to-transparent rounded-2xl pointer-events-none"></div>
                  </div>
                  <button
                    onClick={generateNewAlias}
                    className="w-12 h-12 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-[#b76e79] hover:text-[#b76e79] rounded-2xl transition-all duration-300 border border-[#b76e79]/20 hover:border-[#b76e79]/40 flex items-center justify-center group"
                    title="Generate random alias"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform duration-200">🎲</span>
                  </button>
                </div>
                <p className="mt-3 text-zinc-500 text-xs flex items-center gap-2">
                  <Lock className="w-3 h-3" />
                  Completely anonymous and temporary
                </p>
              </div>

              {/* Avatar Upload */}
              <div>
                <label className="text-white font-semibold mb-3 block text-sm">
                  Avatar (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    id="alias-avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          // Upload to backend
                          const formData = new FormData();
                          formData.append('avatar', file);
                          
                          const response = await fetch(`${getServerUrl()}/api/confessions/upload-avatar`, {
                            method: 'POST',
                            body: formData
                          });
                          
                          const result = await response.json();
                          if (result.success && result.data.url) {
                            console.log('✅ Avatar uploaded:', result.data.url);
                            setAlias(prev => ({ ...prev, imageUrl: result.data.url }));
                          } else {
                            console.error('Failed to upload avatar');
                            alert('Failed to upload avatar. Please try again.');
                          }
                        } catch (error) {
                          console.error('Error uploading avatar:', error);
                          alert('Failed to upload avatar. Please try again.');
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => document.getElementById('alias-avatar-input')?.click()}
                    className="flex-1 px-4 py-3 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-[#b76e79] rounded-2xl border border-[#b76e79]/20 hover:border-[#b76e79]/40 transition-all duration-300 text-sm font-medium"
                  >
                    📸 Upload Photo
                  </button>
                  {alias.imageUrl && (
                    <button
                      onClick={() => setAlias(prev => ({ ...prev, imageUrl: null }))}
                      className="px-4 py-3 text-[#a1a1aa] hover:text-red-400 transition-colors text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="mt-3 text-zinc-500 text-xs">
                  Random emoji avatar will be used if not uploaded
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                <button
                  onClick={onBack}
                  className="text-[#a1a1aa] hover:text-white transition-colors text-sm flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-[#27272a]/30"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleAliasContinue}
                  disabled={!alias.name.trim()}
                  className="relative bg-gradient-to-r from-[#b76e79] to-[#b76e79] hover:from-[#b76e79] hover:to-[#b76e79] text-black px-8 py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 disabled:hover:scale-100"
                >
                  <span className="relative z-10">Enter Anonymously</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showDisclaimer) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-black border border-[#b76e79]/30 rounded-2xl p-8 max-w-2xl w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#b76e79]/30 flex items-center justify-center border border-[#b76e79]/30">
              <Shield className="w-6 h-6 text-[#b76e79]" />
            </div>
            <h3 className="text-2xl font-bold text-white">Complete Anonymity Guaranteed</h3>
          </div>
          <div className="bg-[#b76e79]/10 border border-[#b76e79]/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center border border-red-500/30 flex-shrink-0 mt-0.5">
                <span className="text-red-400 text-sm">⚠️</span>
              </div>
              <div>
                <h4 className="text-[#b76e79] font-semibold mb-2">Important Reminder</h4>
                <p className="text-zinc-300 leading-relaxed">
                  This is a safe space for sharing thoughts. Please be respectful and kind. 
                  Harassment, bullying, or harmful content is not tolerated. 
                  Remember that real people are behind these anonymous confessions.
                </p>
              </div>
            </div>
          </div>
          <p className="text-zinc-300 leading-relaxed mb-6">
            Your identity is completely protected. No IP tracking, no account linking, no digital fingerprints. Share your thoughts freely while maintaining complete privacy.
          </p>
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowDisclaimer(false)}
              className="bg-rosegold-500 hover:bg-rosegold-600 text-white px-6 py-2 rounded-lg font-medium shadow-button transition-colors"
            >
              I understand
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="campus-theme flex flex-col h-full bg-black relative overflow-hidden">
      
      {/* Sidebar Menu */}
      <ConfessionSidebarMenu
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeView={activeView === 'default' ? 'all' : activeView}
        onViewChange={(view) => {
          setActiveView(view);
          setIsSidebarOpen(false);
        }}
      />

      {/* Modern Header */}
      {/* Header Section */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-2xl border-b border-[#F4E3B5]/10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Hamburger, Back Button and Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-xl hover:bg-[#F4E3B5]/10 text-[#F4E3B5] hover:text-[#F4E3B5]/80 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                onClick={onBack}
                className="text-[#F4E3B5] hover:text-[#F4E3B5]/80 transition-colors p-2 rounded-xl hover:bg-[#F4E3B5]/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="serif-title text-2xl font-semibold text-white">
                  {collegeName === 'General Confessions' ? 'Confessions' : `${collegeName} Confessions`}
                </h1>
                {activeView !== 'default' && (
                  <p className="text-xs text-[#a1a1aa] mt-1">
                    {activeView === 'all' && '📋 All Confessions'}
                    {activeView === 'trending' && '🔥 Trending Now'}
                    {activeView === 'fresh' && '✨ Fresh Drops'}
                    {activeView === 'top' && '🏆 Top Rated'}
                  </p>
                )}
              </div>
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowComposerPage(true)}
                className="flex items-center justify-center w-9 h-9 bg-[#000000]/50 hover:bg-[#000000]/70 text-[#F4E3B5] hover:text-[#F4E3B5]/80 rounded-lg border border-[#F4E3B5]/20 hover:border-[#F4E3B5]/40 transition-all duration-200"
                title="Create"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSearch('')}
                className="flex items-center justify-center w-9 h-9 bg-[#000000]/50 hover:bg-[#000000]/70 text-[#F4E3B5] hover:text-[#F4E3B5]/80 rounded-lg border border-[#F4E3B5]/20 hover:border-[#F4E3B5]/40 transition-all duration-200"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Engagement Feed Views */}
          {activeView !== 'default' ? (
            <ConfessionFeed
              activeView={activeView === 'default' ? 'all' : activeView}
              onConfessionClick={(confession) => {
                console.log('[ConfessionPage] onConfessionClick called:', {
                  id: confession.id,
                  hasId: !!confession.id,
                  confessionKeys: Object.keys(confession)
                });
                
                if (!confession.id) {
                  console.error('[ConfessionPage] ❌ Cannot navigate - confession ID is missing!', confession);
                  return;
                }
                
                console.log(`[ConfessionPage] ✅ Navigating to confession detail: ${confession.id}`);
                setSelectedConfessionId(confession.id);
              }}
            />
          ) : (
            <>
              {/* Confessions List */}
              <div className="space-y-0">
            {filteredConfessions.map((confession, index) => (
              <div key={confession.id} className={`relative group py-6 px-2 ${confession.isExplicit ? 'border-2 border-red-500/40 rounded-3xl bg-red-900/5 backdrop-blur-sm' : ''}`}>

                {/* Author Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {confession.authorAlias?.imageUrl ? (
                        <img 
                          src={confession.authorAlias?.imageUrl} 
                          alt="Author avatar" 
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#b76e79]/20 " 
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${confession.authorAlias?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white text-lg font-bold  border-2 border-[#b76e79]/20`}>
                          {confession.authorAlias?.emoji || '👤'}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center border border-[#b76e79]/30">
                        <EyeOff className="w-2.5 h-2.5 text-[#b76e79]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold text-sm">{confession.authorAlias?.name || ''}</span>
                        {confession.authorAlias?.badge && (
                          <div className={`flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10 ${confession.authorAlias.badge.color}`}>
                            <span className="text-xs">{confession.authorAlias.badge.icon}</span>
                            <span>{confession.authorAlias.badge.name}</span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
                </div>

                {/* Confession Content */}
                <div className="flex gap-6">
                  {/* Desktop Vote sidebar */}
                {(!confession.isExplicit || revealedContent[confession.id]) && (
                  <div className="hidden md:flex flex-col items-center self-start gap-3">
                    <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-3 border border-[#b76e79]/10 ">
                      <button
                        onClick={() => toggleVote(confession.id, 1)}
                        className={`p-2.5 rounded-2xl transition-all duration-300 group ${
                          confession.userVote === 1 
                            ? 'text-blue-400 bg-blue-400/20  shadow-blue-400/20' 
                            : 'text-[#a1a1aa] hover:text-blue-400 hover:bg-blue-400/10'
                        }`}
                        title="Upvote"
                      >
                        <ChevronUp className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                      </button>
                      <div className="text-lg font-bold text-white py-2 px-1 min-w-[2rem] text-center">
                        {confession.score}
                      </div>
                      <button
                        onClick={() => toggleVote(confession.id, -1)}
                        className={`p-2.5 rounded-2xl transition-all duration-300 group ${
                          confession.userVote === -1 
                            ? 'text-red-400 bg-red-400/20  shadow-red-400/20' 
                            : 'text-[#a1a1aa] hover:text-red-400 hover:bg-red-400/10'
                        }`}
                        title="Downvote"
                      >
                        <ChevronDown className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                      </button>
                    </div>
                    
                  </div>
                )}
                  
                  {/* Main content area */}
                  <div className={`flex-1 ${confession.isExplicit ? 'relative' : ''}`}>
                    {/* Explicit Content Warning */}
                    {confession.isExplicit && (
                      <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">Explicit Content</span>
                        <span className="text-xs text-red-300">This confession contains mature language</span>
                      </div>
                    )}
                    <div className="relative">
                      {confession.backgroundImageUrl ? (
                        <div 
                          className={`rounded-3xl overflow-hidden border border-[#b76e79]/10 mb-6 cursor-pointer hover:border-[#b76e79]/20 transition-all duration-300 group ${
                            confession.isExplicit && !revealedContent[confession.id] ? 'blur-lg' : ''
                          }`}
                          onClick={() => setSelectedConfessionId(confession.id)}
                        >
                          <div className="relative h-48 sm:h-64 md:h-72 bg-[#27272a]">
                            <img 
                              src={confession.backgroundImageUrl} 
                              alt="background" 
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute inset-0 p-6 flex items-end">
                              <div className="w-full">
                                <p className="text-white drop-shadow-2xl leading-relaxed text-lg md:text-xl font-medium tracking-wide whitespace-pre-wrap">
                                  {shouldShowMore(confession.content) 
                                    ? truncateContent(confession.content)
                                    : confession.content
                                  }
                                </p>
                                {shouldShowMore(confession.content) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedConfessionId(confession.id);
                                    }}
                                    className="mt-3 text-white/80 hover:text-white font-medium text-sm transition-colors duration-200 flex items-center gap-1 drop-shadow-lg"
                                  >
                                    Show more
                                    <ArrowLeft className="w-3 h-3 rotate-90" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={`mb-6 hover:bg-[#b76e79]/5 rounded-2xl p-4 -m-4 transition-all duration-300 ${
                            confession.isExplicit && !revealedContent[confession.id] ? 'blur-lg' : ''
                          }`}
                        >
                          {confession.content ? (
                            <div>
                              <p className="text-zinc-100 leading-relaxed text-lg md:text-xl font-medium tracking-wide whitespace-pre-wrap">
                                {shouldShowMore(confession.content) 
                                  ? truncateContent(confession.content)
                                  : confession.content
                                }
                              </p>
                              {shouldShowMore(confession.content) && (
                                <button
                                  onClick={() => setSelectedConfessionId(confession.id)}
                                  className="mt-3 text-[#b76e79] hover:text-white font-medium text-sm transition-colors duration-200 flex items-center gap-1"
                                >
                                  Show more
                                  <ArrowLeft className="w-3 h-3 rotate-90" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <p className="text-[#a1a1aa] leading-relaxed text-lg md:text-xl font-medium tracking-wide italic">
                              {confession.poll ? 'Poll only confession' : 'Media only confession'}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Sensitive Content Overlay */}
                      {confession.isExplicit && !revealedContent[confession.id] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl">
                          <div className="text-center p-4 bg-black/95 backdrop-blur-xl rounded-xl border border-red-500/50 shadow-2xl max-w-xs mx-2">
                            <div className="w-10 h-10 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/40">
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                            </div>
                            <h3 className="text-white font-semibold text-base mb-2">Sensitive Content</h3>
                            <p className="text-[#a1a1aa] text-xs mb-4 leading-relaxed">
                              This confession might contain sensitive content including mature language or adult themes.
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                revealSensitiveContent(confession.id);
                              }}
                              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105  shadow-red-500/25 text-sm"
                            >
                              IDGF
                            </button>
                            <p className="text-xs text-[#a1a1aa] mt-2">
                              Click to view content anyway
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Poll Section */}
                    {confession.poll && (
                      <div className={`mb-6 relative bg-black/50 backdrop-blur-sm rounded-3xl p-6 border border-[#b76e79]/10  z-10 ${
                        confession.isExplicit && !revealedContent[confession.id] ? 'blur-lg' : ''
                      }`}>
                        {/* Glassmorphism overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
                        
                        <div className="relative z-10">
                          {/* Poll Header */}
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-[#b76e79]/20 rounded-2xl flex items-center justify-center">
                              <BarChart3 className="w-5 h-5 text-[#b76e79]" />
                            </div>
                            <div>
                              <h4 className="text-white font-semibold text-lg">Poll</h4>
                              <p className="text-zinc-300 text-sm">{confession.poll.question}</p>
                            </div>
                          </div>
                          
                          {/* Poll Options */}
                          <div className="space-y-3">
                            {confession.poll.options.map((option, index) => {
                              const votes = confession.poll?.votes || {};
                              const totalVotes = Object.keys(votes).length;
                              const optionVotes = Object.values(votes).filter(vote => vote === option).length;
                              const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
                              const currentUserId = sessionId || 'anonymous';
                              const isSelected = votes[currentUserId] === option;
                              
                              return (
                                <button
                                  key={`${confession.id}-poll-option-${index}`}
                                  onClick={() => handlePollVote(confession.id, index)}
                                  className={`w-full group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                                    isSelected
                                      ? 'border-[#b76e79]/50 bg-[#b76e79]/20 '
                                      : 'border-[#b76e79]/20 hover:border-[#b76e79]/40 hover:bg-[#b76e79]/10'
                                  }`}
                                >
                                  {/* Progress bar background */}
                                  <div 
                                    className={`absolute inset-0 transition-all duration-700 ${
                                      isSelected 
                                        ? 'bg-gradient-to-r from-[#b76e79]/30 to-[#b76e79]/20' 
                                        : 'bg-gradient-to-r from-[#b76e79]/10 to-transparent'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                  
                                  {/* Option content */}
                                  <div className="relative z-10 flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                                        isSelected 
                                          ? 'border-[#b76e79] bg-[#b76e79]' 
                                          : 'border-zinc-400 group-hover:border-[#b76e79]'
                                      }`}>
                                        {isSelected && (
                                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                                        )}
                                      </div>
                                      <span className={`font-medium transition-colors duration-300 ${
                                        isSelected ? 'text-[#b76e79]' : 'text-zinc-200 group-hover:text-[#b76e79]'
                                      }`}>
                                        {option}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                      <span className={`text-sm font-semibold transition-colors duration-300 ${
                                        isSelected ? 'text-[#b76e79]' : 'text-[#a1a1aa] group-hover:text-[#b76e79]'
                                      }`}>
                                        {percentage.toFixed(0)}%
                                      </span>
                                      <span className={`text-xs transition-colors duration-300 ${
                                        isSelected ? 'text-[#b76e79]' : 'text-zinc-500 group-hover:text-[#b76e79]'
                                      }`}>
                                        ({optionVotes})
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Poll Stats */}
                          <div className="mt-4 pt-4 border-t border-[#b76e79]/10">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#a1a1aa]">
                                {Object.keys(confession.poll.votes || {}).length} total votes
                              </span>
                              <span className="text-zinc-500 text-xs">
                                Click to vote • Vote again to change
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Modern Reactions Section */}
                    <div className="flex justify-between items-center mb-6">
                      {/* Existing reactions */}
                      <div className="flex gap-3 flex-wrap">
                        {(() => {
                          const reactions = confession.reactions || {};
                          const reactionEntries = Object.entries(reactions).filter(([_, data]) => data.count > 0);
                          
                          // Sort by count (descending)
                          const sortedReactions = reactionEntries.sort((a, b) => b[1].count - a[1].count);
                          
                          // Get top 4 reactions
                          const top4 = sortedReactions.slice(0, 4);
                          
                          // Find user's reaction if it exists and isn't in top 4
                          const userReaction = reactionEntries.find(([_, data]) => data.userReacted);
                          const userReactionInTop4 = userReaction && top4.some(([type]) => type === userReaction[0]);
                          
                          // Combine top 4 + user's reaction (if different), max 5 total
                          let displayReactions = [...top4];
                          if (userReaction && !userReactionInTop4 && displayReactions.length < 5) {
                            displayReactions.push(userReaction);
                          }
                          
                          return displayReactions.map(([type, data]) => {
                            const emojiData = reactionEmojis.find(r => r.name === type);
                            return (
                              <button
                                key={type}
                                onClick={() => toggleReaction(confession.id, type)}
                                className={`group flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm border transition-all duration-300 hover:scale-105 ${
                                  data.userReacted 
                                    ? 'border-[#b76e79]/50 text-[#b76e79] bg-[#b76e79]/20 ' 
                                    : 'border-[#b76e79]/20 text-zinc-300 hover:border-[#b76e79]/40 hover:bg-[#b76e79]/10 hover:text-[#b76e79]'
                                }`}
                                title={`React with ${emojiData?.emoji || type}`}
                              >
                                <span className="text-xl group-hover:scale-110 transition-transform duration-200">
                                  {emojiData?.emoji || '❤️'}
                                </span>
                                <span className="font-semibold">{data.count}</span>
                              </button>
                            );
                          });
                        })()}
                      </div>
                      
                    </div>
                  </div>
                </div>
                
                {/* Modern Footer */}
                {(!confession.isExplicit || revealedContent[confession.id]) && (
                <div className="flex items-center justify-between pt-6 border-t border-[#b76e79]/5 relative">
                  <div className="flex items-center gap-6">
                    {/* Mobile vote controls */}
                    <div className="flex md:hidden items-center gap-3">
                      <div className="flex items-center gap-3 bg-black/50 backdrop-blur-sm rounded-2xl p-2 border border-[#b76e79]/10">
                        <button 
                          onClick={() => toggleVote(confession.id, 1)} 
                          className={`p-2 rounded-xl transition-all duration-300 group ${
                            confession.userVote === 1 
                              ? 'text-blue-400 bg-blue-400/20  shadow-blue-400/20' 
                              : 'text-[#a1a1aa] hover:text-blue-400 hover:bg-blue-400/10'
                          }`} 
                          title="Upvote"
                        >
                          <ChevronUp className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                        <span className="text-white font-bold text-sm min-w-[1.5rem] text-center">
                          {confession.score}
                        </span>
                        <button 
                          onClick={() => toggleVote(confession.id, -1)} 
                          className={`p-2 rounded-xl transition-all duration-300 group ${
                            confession.userVote === -1 
                              ? 'text-red-400 bg-red-400/20  shadow-red-400/20' 
                              : 'text-[#a1a1aa] hover:text-red-400 hover:bg-red-400/10'
                          }`} 
                          title="Downvote"
                        >
                          <ChevronDown className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                        </button>
                      </div>
                      
                    </div>
                    
                    {/* Reply button */}
                    <button 
                      onClick={() => setSelectedConfessionId(confession.id)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-zinc-300 hover:text-[#b76e79] hover:bg-[#b76e79]/10 transition-all duration-300 border border-[#b76e79]/10 hover:border-[#b76e79]/20 group hover:scale-105"
                    >
                      <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                      <span className="font-medium">{getCommentCount(confession)}</span>
                      <span className="hidden sm:inline text-sm">comments</span>
                    </button>
                  </div>
                </div>
                )}

                {/* Modern Reply Section */}
                {showReplies[confession.id] && (
                  <div className="mt-6 pt-6 border-t border-[#b76e79]/10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#b76e79]/20 rounded-2xl flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-[#b76e79]" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">Anonymous Replies</h4>
                          <p className="text-[#a1a1aa] text-xs">Join the conversation anonymously</p>
                        </div>
                      </div>
                      {loadingReplies[confession.id] && (
                        <div className="w-6 h-6 border-2 border-[#b76e79] border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    
                    {/* Replies List */}
                    <div className="space-y-4 mb-6">
                      {confession.repliesList && confession.repliesList.length > 0 ? confession.repliesList.map((reply, index) => (
                        <div key={reply.id} className="group">
                          <div className="flex gap-4">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              {reply.authorAlias?.imageUrl ? (
                                <img 
                                  src={reply.authorAlias.imageUrl} 
                                  alt="Reply author avatar" 
                                  className="w-10 h-10 rounded-full object-cover border-2 border-[#b76e79]/20 " 
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#b76e79] to-[#b76e79] flex items-center justify-center text-black text-sm font-bold border-2 border-[#b76e79]/20 ">
                                  {reply.authorAlias?.emoji || '👤'}
                                </div>
                              )}
                              {/* Connection line for threading */}
                              {index < (confession.repliesList?.length || 0) - 1 && (
                                <div className="absolute top-12 left-1/2 w-0.5 h-8 bg-gradient-to-b from-[#b76e79]/20 to-transparent transform -translate-x-px"></div>
                              )}
                            </div>
                            
                            {/* Reply Content */}
                            <div className="flex-1 min-w-0">
                              {/* Reply Bubble */}
                              <div className="relative bg-[#27272a]/40 backdrop-blur-sm border border-[#b76e79]/10 rounded-3xl rounded-tl-lg p-4  group-hover:shadow-[#b76e79]/5 transition-all duration-300">
                                {/* Glassmorphism overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                <div className="relative z-10">
                                  <p className="text-zinc-100 text-sm leading-relaxed">{reply.content}</p>
                                </div>
                              </div>
                              
                              {/* Reply Meta */}
                              <div className="flex items-center justify-between mt-3 px-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-zinc-300 text-xs font-medium">{reply.authorAlias?.name || 'Anonymous'}</span>
                                  <div className="w-1 h-1 bg-zinc-600 rounded-full"></div>
                                </div>
                                
                                {/* Reply Voting */}
                                <div className="flex items-center gap-2 bg-[#27272a]/30 backdrop-blur-sm rounded-2xl p-1 border border-[#b76e79]/10">
                                  <button
                                    onClick={() => toggleReplyVote(confession.id, reply.id, 1)}
                                    className={`p-1.5 rounded-xl transition-all duration-300 group ${
                                      (reply.userVote ?? 0) === 1 
                                        ? 'text-[#b76e79] bg-[#b76e79]/20 ' 
                                        : 'text-[#a1a1aa] hover:text-[#b76e79] hover:bg-[#b76e79]/10'
                                    }`}
                                    title="Upvote reply"
                                  >
                                    <ChevronUp className="w-3 h-3 group-hover:scale-110 transition-transform duration-200" />
                                  </button>
                                  <span className="text-white font-semibold text-xs min-w-[1rem] text-center">
                                    {reply.score ?? 0}
                                  </span>
                                  <button
                                    onClick={() => toggleReplyVote(confession.id, reply.id, -1)}
                                    className={`p-1.5 rounded-xl transition-all duration-300 group ${
                                      (reply.userVote ?? 0) === -1 
                                        ? 'text-[#b76e79] bg-[#b76e79]/20 ' 
                                        : 'text-[#a1a1aa] hover:text-[#b76e79] hover:bg-[#b76e79]/10'
                                    }`}
                                    title="Downvote reply"
                                  >
                                    <ChevronDown className="w-3 h-3 group-hover:scale-110 transition-transform duration-200" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-12 bg-black/40 backdrop-blur-sm rounded-3xl border border-[#b76e79]/10">
                          <div className="w-16 h-16 bg-[#b76e79]/10 rounded-3xl mx-auto mb-4 flex items-center justify-center">
                            <MessageCircle className="w-8 h-8 text-[#b76e79]/60" />
                          </div>
                          <p className="text-zinc-300 font-medium mb-2">No replies yet</p>
                          <p className="text-zinc-500 text-sm">Be the first to share your thoughts anonymously</p>
                        </div>
                      )}
                    </div>

                    {/* Modern Reply Input */}
                    <div className="bg-black/40 backdrop-blur-sm rounded-3xl p-4 border border-[#b76e79]/10">
                          <div className="flex items-end gap-4" data-reply-input>
                        {/* User Avatar */}
                        <div className="flex-shrink-0">
                          {alias.imageUrl ? (
                            <img 
                              src={alias.imageUrl} 
                              alt="Your avatar" 
                              className="w-10 h-10 rounded-full object-cover border-2 border-[#b76e79]/20 " 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#b76e79] to-[#b76e79] flex items-center justify-center text-black text-sm font-bold border-2 border-[#b76e79]/20 ">
                              {alias.emoji}
                            </div>
                          )}
                        </div>
                        
                        {/* Input Area */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-2xl border border-[#b76e79]/10 p-1">
                            <input
                              type="text"
                              placeholder="Share your anonymous thoughts..."
                              className="flex-1 min-w-0 bg-transparent px-4 py-3 text-white placeholder-zinc-400 focus:outline-none text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim() && !postingReply[confession.id]) {
                                  addReply(confession.id, e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                            />
                            {/* Emoji button for reply input */}
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const trigger = e.currentTarget as HTMLButtonElement;
                                  const rect = trigger.getBoundingClientRect();
                                  const estimatedWidth = 5 * 40 + 4 * 8 + 16;
                                  const margin = 12;
                                  if (rect.left < margin && rect.right + estimatedWidth < window.innerWidth - margin) {
                                    setReplyEmojiPickerSide('left');
                                  } else if (rect.right + estimatedWidth > window.innerWidth - margin) {
                                    setReplyEmojiPickerSide('right');
                                  } else {
                                    setReplyEmojiPickerSide('center');
                                  }
                                  setOpenReplyEmojiPickerId(prev => prev === confession.id ? null : confession.id);
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-xl text-zinc-300 hover:text-[#b76e79] hover:bg-[#b76e79]/10 transition-colors"
                                aria-label="Insert emoji"
                              >
                                🙂
                              </button>

                              {openReplyEmojiPickerId === confession.id && (
                                <div className={`absolute z-50 mt-2 top-full bg-black/90 border border-[#b76e79]/20 rounded-2xl p-2 shadow-xl backdrop-blur-sm max-w-[calc(100vw-24px)] ${
                                  replyEmojiPickerSide === 'right' ? 'right-0' : replyEmojiPickerSide === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'
                                }`}>
                                  <div className="flex gap-2">
                                    {['love','funny','fire','wow','cry'].map((name) => {
                                      const item = reactionEmojis.find(r => r.name === name)!;
                                      return (
                                        <button
                                          key={name}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const input = ((e.currentTarget.closest('[data-reply-input]') as HTMLElement)?.querySelector('input')) as HTMLInputElement | null;
                                            if (input) {
                                              input.value = (input.value || '') + item.emoji;
                                              input.focus();
                                            }
                                            setOpenReplyEmojiPickerId(null);
                                          }}
                                          className="w-10 h-10 flex items-center justify-center text-xl rounded-xl hover:bg-white/10 transition-colors"
                                          title={`Insert ${item.emoji}`}
                                        >
                                          {item.emoji}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement) || null;
                                if (input && input.value.trim() && !postingReply[confession.id]) {
                                  addReply(confession.id, input.value);
                                  input.value = '';
                                }
                              }}
                              disabled={postingReply[confession.id]}
                              className={`relative w-12 h-12 bg-gradient-to-r from-[#b76e79] to-[#b76e79] hover:from-[#b76e79] hover:to-[#b76e79] text-black rounded-2xl flex items-center justify-center transition-all duration-300   hover:scale-105 group ${
                                postingReply[confession.id] ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
                              }`}
                              aria-label="Send reply"
                            >
                              {postingReply[confession.id] ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Send className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </button>
                          </div>
                          <p className="text-zinc-500 text-xs mt-2 px-4">
                            Press Enter to send • Your identity remains anonymous
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Separator line */}
                {index < filteredConfessions.length - 1 && (
                  <div className="border-b border-[#b76e79]/20 mt-8 mb-2"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Modern Loading States */}
          {loading && (
            <div className="flex flex-col items-center py-12">
              {/* Animated loading orb */}
              <div className="relative mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#b76e79] to-[#b76e79] rounded-full"></div>
                <div className="absolute inset-0 w-12 h-12 border-4 border-[#b76e79]/30 border-t-[#b76e79] rounded-full animate-spin"></div>
              </div>
              <p className="text-[#a1a1aa] font-medium">Loading confessions...</p>
            </div>
          )}
          
          {/* Load more trigger with subtle indicator */}
          {hasMore && !loading && (
            <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
              <div className="w-2 h-2 bg-[#b76e79]/30 rounded-full"></div>
            </div>
          )}
          
          {/* End of feed indicator */}
          {!hasMore && !loading && filteredConfessions.length > 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#b76e79]/10 rounded-3xl mx-auto mb-4 flex items-center justify-center">
                <div className="text-2xl">✨</div>
              </div>
              <p className="text-[#a1a1aa] font-medium mb-2">You've reached the end</p>
              <p className="text-zinc-500 text-sm">All confessions have been revealed</p>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* Floating Confess Button */}
      <button
        onClick={() => setShowComposerPage(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#b76e79] hover:bg-[#b76e79]/90 text-[#18181b] rounded-full shadow-lg shadow-[#b76e79]/50 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        title="Create confession"
      >
        <Plus className="w-6 h-6 text-black group-hover:rotate-90 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>

      {/* Old modal composer removed - now using full page composer */}
    </div>
  );
}