import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Get the server URL for API calls
const getServerUrl = () => {
  return import.meta.env.VITE_SERVER_URL || window.location.origin;
};
import { 
  ArrowLeft, 
  MessageCircle, 
  ChevronUp,
  ChevronDown,
  Reply,
  Send,
  Clock,
  EyeOff,
  Calendar,
  Star,
  Flame,
  Edit3,
  Check,
  X,
  AlertTriangle,
  Menu
} from 'lucide-react';

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

interface Comment {
  id: string;
  content: string;
  authorAlias: {
    name: string;
    emoji: string;
    color: string;
    imageUrl?: string | null;
  };
  timestamp: Date;
  score: number;
  userVote: -1 | 0 | 1;
  reactions?: Record<string, { count: number; userReacted: boolean }>;
  replies?: Comment[];
  parentId?: string;
  mentions?: string[]; // Tagged users
  replyingTo?: string; // Username being replied to
  depth: number; // For nested comment styling
  editedAt?: Date; // When comment was last edited
  isEdited?: boolean; // Whether comment has been edited
  sessionId?: string; // Session ID of the comment author for edit permissions
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

interface Confession {
  id: string;
  content: string;
  timestamp: Date;
  authorAlias: {
    name: string;
    emoji: string;
    color: string;
    imageUrl?: string | null;
    badge?: Badge;
    stats?: {
      totalConfessions: number;
      totalEngagement: number;
    };
  };
  score: number;
  userVote: -1 | 0 | 1;
  reactions?: Record<string, { count: number; userReacted: boolean }>;
  backgroundImageUrl?: string | null;
  poll?: {
    question: string;
    options: string[];
    votes?: Record<string, string>;
  };
  commentsCount: number;
  isExplicit?: boolean;
}

interface ConfessionDetailPageProps {
  confessionId: string;
  onBack: () => void;
  universityId?: string;
}

const reactionEmojis = [
  { emoji: '❤️', name: 'love' },
  { emoji: '😂', name: 'laugh' },
  { emoji: '👍', name: 'thumbs_up' },
  { emoji: '😮', name: 'wow' },
  { emoji: '😢', name: 'sad' },
  { emoji: '😡', name: 'angry' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '💯', name: 'hundred' },
  { emoji: '😍', name: 'heart_eyes' },
  { emoji: '😎', name: 'cool' },
  { emoji: '🤯', name: 'mind_blown' },
  { emoji: '😭', name: 'cry_loudly' },
  { emoji: '🤔', name: 'thinking' },
  { emoji: '🙌', name: 'praise' },
  { emoji: '✨', name: 'sparkles' },
  { emoji: '🎉', name: 'party' },
  { emoji: '🤝', name: 'handshake' },
  { emoji: '👌', name: 'ok' },
  { emoji: '🥳', name: 'party_face' },
  { emoji: '🤩', name: 'star_eyes' },
  { emoji: '😴', name: 'sleep' },
  { emoji: '🤤', name: 'drool' },
  { emoji: '😇', name: 'innocent' },
  { emoji: '🤗', name: 'hug' },
  { emoji: '😏', name: 'smirk' },
  { emoji: '🤪', name: 'zany' },
  { emoji: '😜', name: 'winky_tongue' },
  { emoji: '😌', name: 'relieved' },
  { emoji: '😉', name: 'winky' },
  { emoji: '🫶', name: 'hearts_hands' }
];

type SortOption = 'popularity' | 'new' | 'old' | 'best';

export function ConfessionDetailPage({ confessionId, onBack, universityId }: ConfessionDetailPageProps) {
  const [confession, setConfession] = useState<Confession | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  
  // Get session ID for fetching persistent alias
  const [sessionId] = useState(() => {
    const SESSION_KEY = 'confession_session_id';
    return localStorage.getItem(SESSION_KEY) || '';
  });

  // User alias for comments - fetch from backend
  const [alias, setAlias] = useState({
    name: 'Anonymous',
    emoji: '👤',
    color: 'from-gray-500 to-gray-600',
    imageUrl: null as string | null
  });
  
  // Fetch user alias from backend on mount
  useEffect(() => {
    const fetchAlias = async () => {
      if (!sessionId) return;
      
      try {
        const response = await fetch(`${getServerUrl()}/api/confessions/alias/${sessionId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('✅ Fetched alias from backend:', result.data);
          setAlias({
            name: result.data.name,
            emoji: result.data.emoji,
            color: result.data.color,
            imageUrl: result.data.imageUrl
          });
        }
      } catch (error) {
        // If alias doesn't exist yet, use default
        console.log('No saved alias found, using default');
      }
    };
    
    fetchAlias();
  }, [sessionId]);
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
  const [showReplyInput, setShowReplyInput] = useState<{ [key: string]: boolean }>({});
  const [sortOption, setSortOption] = useState<SortOption>('new');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editTexts, setEditTexts] = useState<{ [key: string]: string }>({});
  const [revealedContent, setRevealedContent] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Emoji picker for main comment box
  const [openCommentEmojiPicker, setOpenCommentEmojiPicker] = useState(false);
  const [commentEmojiSide, setCommentEmojiSide] = useState<'left' | 'right' | 'center'>('left');
  const [commentEmojiButton, setCommentEmojiButton] = useState('🙂');
  const commentEmojiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!commentEmojiContainerRef.current) return;
      if (!commentEmojiContainerRef.current.contains(e.target as Node)) {
        setOpenCommentEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Helper function to get accurate comment count (including nested replies)
  const getCommentCount = (confession: Confession) => {
    // Recursively count all comments and replies
    const countCommentsRecursively = (commentsList: Comment[]): number => {
      let count = 0;
      for (const comment of commentsList) {
        count++; // Count this comment
        if (comment.replies && comment.replies.length > 0) {
          count += countCommentsRecursively(comment.replies); // Count nested replies
        }
      }
      return count;
    };
    
    // Use the actual comments array if available, otherwise use stored count
    const actualCount = comments.length > 0 ? countCommentsRecursively(comments) : (confession.commentsCount || 0);
    console.log('📊 Comment count:', { 
      rootComments: comments.length, 
      totalWithReplies: actualCount, 
      storedCount: confession.commentsCount 
    });
    return actualCount;
  };

  // Load specific confession and its comments
  useEffect(() => {
    const loadConfessionData = async () => {
      setLoading(true);
      
      try {
        // First, find the confession from the main confessions list (stored in localStorage)
        const storageKey = `nexus_confessions_${universityId || 'general'}_v1`;
        const storedConfessions = localStorage.getItem(storageKey);
        let foundConfession = null;
        
        if (storedConfessions) {
          try {
            const parsed = JSON.parse(storedConfessions);
            const list = Array.isArray(parsed)
              ? parsed
              : (Array.isArray(parsed?.confessions) ? parsed.confessions : []);
            if (Array.isArray(list)) {
              foundConfession = list.find((c: any) => c && c.id === confessionId) || null;
            }
          } catch (parseError) {
            console.error('Error parsing stored confessions:', parseError);
            // Continue to try fetching from server
          }
        }
        
        // If not found locally, try to fetch from server
        if (!foundConfession) {
          try {
            const response = await fetch(`${getServerUrl()}/api/confessions/${confessionId}?sessionId=${encodeURIComponent(sessionId)}`);
            const result = await response.json();
            if (result.success) {
              foundConfession = result.data;
            }
          } catch (error) {
            console.error('Error fetching confession from server:', error);
          }
        }
        
        if (foundConfession) {
          // Detect explicit content if not already set
          const contentToCheck = `${foundConfession.content || ''} ${foundConfession.poll?.question || ''} ${foundConfession.poll?.options?.join(' ') || ''}`;
          const isExplicit = foundConfession.isExplicit !== undefined ? foundConfession.isExplicit : detectExplicitContent(contentToCheck);
          
          // Normalize alias into a displayable authorAlias
          const aliasSource = (foundConfession.authorAlias ?? foundConfession.alias) as any;
          const normalizedAuthorAlias = typeof aliasSource === 'string'
            ? { name: aliasSource, emoji: '👤', color: 'from-gray-500 to-gray-600' }
            : aliasSource && typeof aliasSource === 'object'
              ? {
                  name: aliasSource.name || 'Anonymous',
                  emoji: aliasSource.emoji || '👤',
                  color: aliasSource.color || 'from-gray-500 to-gray-600',
                  imageUrl: aliasSource.imageUrl || undefined,
                }
              : { name: 'Anonymous', emoji: '👤', color: 'from-gray-500 to-gray-600' };

          // Convert the confession data to match our interface
          setConfession({
            id: foundConfession.id,
            content: foundConfession.content || '',
            timestamp: new Date(foundConfession.timestamp || foundConfession.createdAt),
            authorAlias: normalizedAuthorAlias,
            score: foundConfession.score || 0,
            userVote: typeof foundConfession.userVote === 'number' ? foundConfession.userVote : 0,
            reactions: foundConfession.reactions || {},
            backgroundImageUrl: foundConfession.backgroundImageUrl,
            poll: foundConfession.poll,
            commentsCount: foundConfession.replies || 0,
            isExplicit
          });
          
          // Load comments/replies for this confession
          try {
            const CAMPUS_CODE_MAP: Record<string, string> = {
              'MIT ADT': 'mit-adt',
              'MIT WPU': 'mit-wpu',
              'VIT Vellore': 'vit-vellore',
              'Parul University': 'parul-university',
              'IIST': 'iist',
            };
            const campusCode = CAMPUS_CODE_MAP[universityId as string] || universityId || 'mit-adt';
            const repliesResponse = await fetch(`${getServerUrl()}/api/confessions/${confessionId}/replies?campus=${campusCode}`);
            if (!repliesResponse.ok) {
              throw new Error(`Failed to fetch comments: ${repliesResponse.status} ${repliesResponse.statusText}`);
            }
            const repliesResult = await repliesResponse.json();

            if (!repliesResult || typeof repliesResult !== 'object') {
              throw new Error('Invalid response format when loading comments');
            }

              if (repliesResult.success && Array.isArray(repliesResult.data)) {
              const buildCommentTree = (comments: any[]): Comment[] => {
                const commentMap = new Map<string, Comment>();
                const rootComments: Comment[] = [];

                // First pass: create all comment objects
                comments.forEach((reply: any) => {
                  // Validate required fields (only require id; coerce content to string)
                  if (!reply || typeof reply !== 'object' || !reply.id) {
                    console.warn('Skipping invalid comment data (missing id/object):', reply);
                    return;
                  }

                  // Handle both string and object alias formats
                  let authorAlias;
                  if (typeof reply.alias === 'string') {
                    authorAlias = {
                      name: reply.alias,
                      emoji: '👤',
                      color: 'from-blue-500 to-indigo-500'
                    };
                  } else if (reply.alias && typeof reply.alias === 'object') {
                    authorAlias = {
                      name: reply.alias.name || 'Anonymous',
                      emoji: reply.alias.emoji || '👤',
                      color: reply.alias.color || 'from-blue-500 to-indigo-500'
                    };
                  } else {
                    authorAlias = {
                      name: 'Anonymous',
                      emoji: '👤',
                      color: 'from-blue-500 to-indigo-500'
                    };
                  }

                  const comment: Comment = {
                    id: String(reply.id),
                    content: String(reply.content || ''),
                    authorAlias: authorAlias as { name: string; emoji: string; color: string; imageUrl?: string },
                    timestamp: reply.createdAt ? new Date(reply.createdAt) : new Date(),
                    score: Number(reply.score) || 0,
                    userVote: Number(reply.userVote) || 0,
                    reactions: reply.reactions && typeof reply.reactions === 'object' ? reply.reactions : {},
                    depth: 0,
                    replies: [],
                    parentId: reply.parentId,
                    sessionId: reply.sessionId
                  };

                  commentMap.set(comment.id, comment);
                });

                // Second pass: build the tree structure
                comments.forEach((reply: any) => {
                  if (!reply || !reply.id) return;
                  const comment = commentMap.get(String(reply.id));
                  if (!comment) return; // was filtered in first pass

                  const parentId = reply.parentId ? String(reply.parentId) : null;
                  if (parentId && commentMap.has(parentId)) {
                    // This is a reply to another comment
                    const parentComment = commentMap.get(parentId)!;
                    parentComment.replies = parentComment.replies || [];
                    parentComment.replies.push(comment);
                    comment.depth = (parentComment.depth || 0) + 1;
                  } else {
                    // This is a root comment
                    rootComments.push(comment);
                  }
                });

                return rootComments;
              };

              const formattedComments = buildCommentTree(repliesResult.data);
              setComments(formattedComments);
            } else {
              setComments([]);
            }
          } catch (error) {
            console.error('Error loading comments:', error);
            setComments([]);
          }
        } else {
          console.error('Confession not found:', confessionId);
          setConfession(null);
        }
      } catch (error) {
        console.error('Error loading confession data:', error);
        setConfession(null);
      } finally {
        setLoading(false);
      }
    };

    loadConfessionData();
  }, [confessionId, universityId]);

  // Auto-refresh comments every 3 seconds with campus scoping and local cache persistence
  useEffect(() => {
    let isCancelled = false;

    const fetchComments = async () => {
      try {
        const CAMPUS_CODE_MAP: Record<string, string> = {
          'MIT ADT': 'mit-adt',
          'MIT WPU': 'mit-wpu',
          'VIT Vellore': 'vit-vellore',
          'Parul University': 'parul-university',
          'IICT': 'iict',
        };
        const campusCode = CAMPUS_CODE_MAP[universityId as string] || universityId || 'mit-adt';
        const res = await fetch(`${getServerUrl()}/api/confessions/${confessionId}/replies?campus=${campusCode}`);
        const json = await res.json();
        if (!isCancelled && json?.success && Array.isArray(json.data)) {
          // Build flat comments (keep existing tree builder logic minimal for poll)
          const buildCommentTree = (comments: any[]): Comment[] => {
            const byId = new Map<string, Comment>();
            const roots: Comment[] = [];
            for (const reply of comments) {
              if (!reply?.id) continue;
              const node: Comment = {
                id: String(reply.id),
                content: String(reply.content || ''),
                authorAlias: { name: typeof reply.alias === 'string' ? reply.alias : (reply.alias?.name || 'Anonymous'), emoji: '👤', color: 'from-blue-500 to-indigo-500' },
                timestamp: reply.createdAt ? new Date(reply.createdAt) : new Date(),
                score: Number(reply.score) || 0,
                userVote: 0,
                reactions: {},
                depth: 0,
                replies: [],
                parentId: reply.parentId,
                sessionId: reply.sessionId
              };
              byId.set(node.id, node);
            }
            for (const node of byId.values()) {
              if (node.parentId && byId.has(node.parentId)) {
                const parent = byId.get(node.parentId)!;
                node.depth = parent.depth + 1;
                parent.replies = [...(parent.replies || []), node];
              } else {
                roots.push(node);
              }
            }
            // Newest first for roots
            roots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            return roots;
          };
          const fetchedComments = buildCommentTree(json.data);
          
          // Merge with existing comments, preserving optimistic updates (including nested replies)
          setComments(prev => {
            // Keep optimistic root comments (IDs starting with 'new-' or 'reply-')
            const optimisticRoots = prev.filter(c => c.id.startsWith('new-') || c.id.startsWith('reply-'));
            
            // Helper to collect all optimistic replies from nested comments
            const collectOptimisticReplies = (comments: Comment[]): Comment[] => {
              const optimistic: Comment[] = [];
              for (const comment of comments) {
                if (comment.replies) {
                  const optimisticNested = comment.replies.filter(r => 
                    r.id.startsWith('new-') || r.id.startsWith('reply-')
                  );
                  optimistic.push(...optimisticNested);
                  optimistic.push(...collectOptimisticReplies(comment.replies));
                }
              }
              return optimistic;
            };
            
            const optimisticNested = collectOptimisticReplies(prev);
            
            // Merge fetched with optimistic
            const fetchedIds = new Set(fetchedComments.map(c => c.id));
            const mergedRoots = [...optimisticRoots.filter(c => !fetchedIds.has(c.id)), ...fetchedComments];
            
            // Re-attach optimistic nested replies to their parent comments
            const attachOptimisticReplies = (comments: Comment[]): Comment[] => {
              return comments.map(comment => {
                const matchingOptimistic = optimisticNested.filter(r => {
                  // Find optimistic replies that belong to this comment
                  const findInPrev = (prevComments: Comment[], targetId: string): boolean => {
                    for (const pc of prevComments) {
                      if (pc.id === targetId) {
                        return pc.replies?.some(r => r.id === comment.id) || false;
                      }
                      if (pc.replies && findInPrev(pc.replies, targetId)) return true;
                    }
                    return false;
                  };
                  return findInPrev(prev, comment.id);
                });
                
                const currentRepliesIds = new Set((comment.replies || []).map(r => r.id));
                const newOptimisticReplies = matchingOptimistic.filter(r => !currentRepliesIds.has(r.id));
                
                return {
                  ...comment,
                  replies: attachOptimisticReplies([
                    ...(comment.replies || []),
                    ...newOptimisticReplies
                  ])
                };
              });
            };
            
            const merged = attachOptimisticReplies(mergedRoots);
            
            // Sort by timestamp (newest first)
            merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            
            return merged;
          });
          
          try {
            const cacheKey = `nexus_comments_${(universityId||'general')}_${confessionId}`;
            localStorage.setItem(cacheKey, JSON.stringify({ comments: fetchedComments, ts: Date.now() }));
          } catch {}
        }
      } catch {}
    };

    const interval = setInterval(fetchComments, 3000);
    fetchComments();
    return () => { isCancelled = true; clearInterval(interval); };
  }, [confessionId, universityId]);

  // Socket.IO real-time updates
  useEffect(() => {
    const initializeSocket = async () => {
      const token = (localStorage.getItem('nexus-auth') && JSON.parse(localStorage.getItem('nexus-auth')||'{}')?.currentSession?.access_token) || null;
      const { createSocket } = await import('../lib/socketConfig');
      
      const socket = await createSocket({
        url: getServerUrl(),
        token,
        options: {
          withCredentials: true,
          transports: ['websocket', 'polling']
        }
      });
      socketRef.current = socket;
    };

    initializeSocket().then(() => {
      const socket = socketRef.current;
      if (socket) {
        // Join the confession room
        socket.emit('join-confession', confessionId);

        // Handle confession room join confirmation
        socket.on('confession-joined', (data) => {
          if (data.confessionId === confessionId) {
            if (data.success) {
              console.log(`✅ Successfully joined confession room: ${confessionId}`);
            } else {
              console.error(`❌ Failed to join confession room: ${confessionId} - ${data.error}`);
            }
          }
        });

        // Handle new comments
        socket.on('new-comment', (comment) => {
      try {
        console.log('📨 New comment received:', comment);

        // Validate comment data
        if (!comment || typeof comment !== 'object' || !comment.id || !comment.content) {
          console.warn('Invalid comment data received:', comment);
          return;
        }

        // Skip if this is our own optimistic comment (same sessionId and recent content)
        const mySession = localStorage.getItem('confession_session_id');
        if (comment.sessionId && mySession && comment.sessionId === mySession) {
          return; // already added optimistically
        }

        setComments(prevComments => {
          // Check if comment already exists to avoid duplicates
          const exists = prevComments.some(c => c.id === comment.id);
          if (exists) return prevComments;

          // Create new comment object
          const newComment: Comment = {
            id: String(comment.id),
            content: String(comment.content || ''),
            authorAlias: {
              name: String(comment.alias || 'Anonymous'),
              emoji: '👤',
              color: 'from-blue-500 to-indigo-500'
            },
            timestamp: comment.createdAt ? new Date(comment.createdAt) : new Date(),
            score: Number(comment.score) || 0,
            userVote: 0,
            reactions: {},
            depth: 0,
            replies: [],
            parentId: comment.parentId,
            sessionId: comment.sessionId
          };

          // If this is a reply to another comment, add it to the parent's replies
          if (comment.parentId) {
            const addReplyToParent = (comments: Comment[]): Comment[] => {
              return comments.map(c => {
                if (c.id === comment.parentId) {
                  return {
                    ...c,
                    replies: [...(c.replies || []), { ...newComment, depth: c.depth + 1 }]
                  };
                }
                if (c.replies) {
                  return { ...c, replies: addReplyToParent(c.replies) };
                }
                return c;
              });
            };
            return addReplyToParent(prevComments);
          } else {
            // This is a root comment, add to the beginning
            return [newComment, ...prevComments];
          }
        });

        // Update confession comment count
        if (confession) {
          setConfession(prev => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null);
        }
      } catch (error) {
        console.error('Error handling new comment:', error);
      }
    });

    // Handle vote updates
    socket.on('vote-update', (data) => {
      try {
        console.log('📊 Vote update received:', data);
        if (data && typeof data === 'object' && data.id && typeof data.score === 'number') {
          setConfession(prev => prev && prev.id === data.id ? { ...prev, score: data.score } : prev);
        }
      } catch (error) {
        console.error('Error handling vote update:', error);
      }
    });

    // Handle reaction updates
    socket.on('reaction-update', (data) => {
      try {
        console.log('🎭 Reaction update received:', data);
        if (data && typeof data === 'object' && data.id && data.reactions) {
          setConfession(prev => prev && prev.id === data.id ? { ...prev, reactions: data.reactions } : prev);
        }
      } catch (error) {
        console.error('Error handling reaction update:', error);
      }
    });

    // Handle comment vote updates
    socket.on('comment-vote-update', (data) => {
      try {
        console.log('📊 Comment vote update received:', data);
        if (data && typeof data === 'object' && data.id && typeof data.score === 'number') {
          setComments(prevComments =>
            prevComments.map(comment =>
              comment.id === data.id
                ? { ...comment, score: data.score }
                : comment
            )
          );
        }
      } catch (error) {
        console.error('Error handling comment vote update:', error);
      }
    });

    // Handle poll updates
    socket.on('poll-update', (data) => {
      try {
        console.log('📊 Poll update received:', data);
        if (data && typeof data === 'object' && data.id && data.poll) {
          setConfession(prev => prev && prev.id === data.id ? { ...prev, poll: data.poll } : prev);
        }
      } catch (error) {
        console.error('Error handling poll update:', error);
      }
    });

    // Handle confession updates
    socket.on('confession-updated', (data) => {
      try {
        console.log('📝 Confession updated:', data);
        if (data && typeof data === 'object' && data.id && typeof data.replies === 'number') {
          setConfession(prev => prev && prev.id === data.id ? { ...prev, replies: data.replies } : prev);
        }
      } catch (error) {
        console.error('Error handling confession update:', error);
      }
    });

      }
    });

    // Cleanup on unmount
    return () => {
      const socket = socketRef.current;
      if (socket) {
        socket.off('confession-joined');
        socket.off('new-comment');
        socket.off('vote-update');
        socket.off('comment-vote-update');
        socket.off('poll-update');
        socket.off('confession-updated');
        socket.emit('leave-confession', confessionId);
        socket.disconnect();
      }
    };
  }, [confessionId, confession]);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSortMenu && sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };

    if (showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSortMenu]);

  const handleVoteConfession = async (direction: 1 | -1) => {
    if (!confession) return;

    const currentVote = confession.userVote;
    const nextVote = direction === 1 ? (currentVote === 1 ? 0 : 1) : (currentVote === -1 ? 0 : -1);
    const scoreDelta = nextVote - currentVote;

    setConfession(prev => prev ? {
      ...prev,
      userVote: nextVote,
      score: Math.max(0, prev.score + scoreDelta)
    } : null);

    try {
      const SESSION_KEY = 'confession_session_id';
      const currentSessionId = localStorage.getItem(SESSION_KEY) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try { localStorage.setItem(SESSION_KEY, currentSessionId); } catch {}
      await fetch(`${getServerUrl()}/api/confessions/${confession.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, sessionId: currentSessionId })
      });
    } catch (err) {
      if (import.meta.env.DEV) console.warn('vote API failed', err);
    }
  };

  const handleVoteComment = (commentId: string, direction: 1 | -1) => {
    const updateComments = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          const currentVote = comment.userVote;
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

          return {
            ...comment,
            userVote: nextVote,
            score: Math.max(0, comment.score + scoreDelta)
          };
        }
        
        if (comment.replies) {
          return { ...comment, replies: updateComments(comment.replies) };
        }
        
        return comment;
      });
    };

    setComments(updateComments);
  };

  const handleReaction = (targetId: string, reactionType: string, isConfession = false) => {
    console.log('handleReaction called:', { targetId, reactionType, isConfession });
    
    if (isConfession && confession) {
      const reactions = { ...(confession.reactions || {}) };
      const current = reactions[reactionType] || { count: 0, userReacted: false };
      
      console.log('Confession reaction - current state:', current);
      
      if (current.userReacted) {
        reactions[reactionType] = { count: Math.max(0, current.count - 1), userReacted: false };
      } else {
        // Remove other reactions first
        Object.keys(reactions).forEach(key => {
          if (reactions[key].userReacted) {
            reactions[key] = { count: Math.max(0, reactions[key].count - 1), userReacted: false };
          }
        });
        reactions[reactionType] = { count: current.count + 1, userReacted: true };
      }
      
      console.log('Updated confession reactions:', reactions);
      
      // API call for confession reaction
      fetch(`${getServerUrl()}/api/confessions/${targetId}/react`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ reaction: reactionType }) 
      }).then(response => response.json())
        .then(result => console.log('Confession reaction API response:', result))
        .catch(error => console.error('Confession reaction API error:', error));
      
      setConfession({ ...confession, reactions });
    } else {
      // Handle comment reactions
      console.log('Processing comment reaction for:', targetId);
      
      const updateComments = (comments: Comment[]): Comment[] => {
        return comments.map(comment => {
          if (comment.id === targetId) {
            const reactions = { ...(comment.reactions || {}) };
            const current = reactions[reactionType] || { count: 0, userReacted: false };
            
            console.log('Comment reaction - current state:', current);
            
            if (current.userReacted) {
              reactions[reactionType] = { count: Math.max(0, current.count - 1), userReacted: false };
            } else {
              Object.keys(reactions).forEach(key => {
                if (reactions[key].userReacted) {
                  reactions[key] = { count: Math.max(0, reactions[key].count - 1), userReacted: false };
                }
              });
              reactions[reactionType] = { count: current.count + 1, userReacted: true };
            }
            
            console.log('Updated comment reactions:', reactions);
            return { ...comment, reactions };
          }
          
          if (comment.replies) {
            return { ...comment, replies: updateComments(comment.replies) };
          }
          
          return comment;
        });
      };

      setComments(updateComments);
    }
    
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `new-${Date.now()}`,
      content: replyingTo ? `@${replyingTo.username} ${newComment}` : newComment,
      authorAlias: { name: alias.name, emoji: alias.emoji, color: alias.color },
      timestamp: new Date(),
      score: 0,
      userVote: 0,
      reactions: {},
      depth: replyingTo ? 1 : 0,
      replyingTo: replyingTo?.username,
      mentions: replyingTo ? [replyingTo.username] : []
    };

    // Add comment locally first (optimistic update)
    if (replyingTo) {
      // Add as reply to existing comment
      const updateComments = (comments: Comment[]): Comment[] => {
        return comments.map(c => {
          if (c.id === replyingTo.commentId) {
            return {
              ...c,
              replies: [...(c.replies || []), { ...comment, depth: c.depth + 1, sessionId: localStorage.getItem('confession_session_id') || undefined }]
            };
          }
          if (c.replies) {
            return { ...c, replies: updateComments(c.replies) };
          }
          return c;
        });
      };
      setComments(prev => updateComments(prev));
    } else {
      // Add as top-level comment
      setComments(prev => [{ ...comment, sessionId: localStorage.getItem('confession_session_id') || undefined }, ...prev]);
    }

    // Update confession comment count
    if (confession) {
      setConfession(prev => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null);
    }

    // Clear input
    setNewComment('');
    setReplyingTo(null);

    // Send to backend
    try {
      // Get campus code for proper table routing
      const CAMPUS_CODE_MAP: Record<string, string> = {
        'General Confessions': 'general',
        'MIT ADT': 'mit-adt',
        'MIT WPU': 'mit-wpu',
        'VIT Vellore': 'vit-vellore',
        'Parul University': 'parul-university',
        'IICT': 'iict',
      };
      const campusCode = CAMPUS_CODE_MAP[universityId as string] || universityId || 'mit-adt';

      const response = await fetch(`${getServerUrl()}/api/confessions/${confessionId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: comment.content,
          alias: comment.authorAlias.name,
          sessionId: localStorage.getItem('confession_session_id'),
          campus: campusCode,
          parentCommentId: replyingTo?.commentId || null
        })
      });

      const result = await response.json();
      if (result.success) {
        // Update comment with server ID
        if (replyingTo) {
          const updateCommentsWithId = (comments: Comment[]): Comment[] => {
            return comments.map(c => {
              if (c.id === replyingTo.commentId) {
                return {
                  ...c,
                  replies: (c.replies || []).map(r => 
                    r.id.startsWith('new-') ? { ...r, id: String(result.data.id) } : r
                  )
                };
              }
              if (c.replies) return { ...c, replies: updateCommentsWithId(c.replies) };
              return c;
            });
          };
          setComments(prev => updateCommentsWithId(prev));
        } else {
          setComments(prev => prev.map(r => r.id.startsWith('new-') ? { ...r, id: String(result.data.id) } : r));
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleReply = (commentId: string, username: string) => {
    setShowReplyInput(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    // Clear other reply inputs
    Object.keys(showReplyInput).forEach(key => {
      if (key !== commentId) {
        setShowReplyInput(prev => ({ ...prev, [key]: false }));
      }
    });
  };

  const handleInlineReply = async (parentCommentId: string, username: string) => {
    const replyText = replyTexts[parentCommentId];
    if (!replyText?.trim()) return;

    // Find the parent comment to determine proper depth
    const findParentDepth = (comments: Comment[], targetId: string): number => {
      for (const comment of comments) {
        if (comment.id === targetId) {
          return comment.depth + 1;
        }
        if (comment.replies) {
          const depth = findParentDepth(comment.replies, targetId);
          if (depth > 0) return depth;
        }
      }
      return 1;
    };

    const newReply: Comment = {
      id: `reply-${Date.now()}`,
      content: `@${username} ${replyText}`,
      authorAlias: { name: alias.name, emoji: alias.emoji, color: alias.color },
      timestamp: new Date(),
      score: 0,
      userVote: 0,
      reactions: {},
      depth: findParentDepth(comments, parentCommentId),
      replyingTo: username,
      mentions: [username],
      sessionId: localStorage.getItem('confession_session_id') || undefined
    };

    // Add reply to the parent comment locally first (optimistic update)
    const updateComments = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          };
        }
        if (comment.replies) {
          return { ...comment, replies: updateComments(comment.replies) };
        }
        return comment;
      });
    };

    setComments(updateComments);
    setReplyTexts(prev => ({ ...prev, [parentCommentId]: '' }));
    setShowReplyInput(prev => ({ ...prev, [parentCommentId]: false }));

    // Update confession comment count
    if (confession) {
      setConfession(prev => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null);
    }

    // Send to backend
    try {
      const CAMPUS_CODE_MAP: Record<string, string> = {
        'MIT ADT': 'mit-adt',
        'MIT WPU': 'mit-wpu',
        'VIT Vellore': 'vit-vellore',
        'Parul University': 'parul-university',
        'IICT': 'iict',
      };
      const campusCode = CAMPUS_CODE_MAP[universityId as string] || universityId || 'mit-adt';

      const response = await fetch(`${getServerUrl()}/api/confessions/${confessionId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newReply.content,
          alias: newReply.authorAlias.name,
          sessionId: localStorage.getItem('confession_session_id'),
          campus: campusCode,
          parentCommentId: parentCommentId
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Inline reply saved to backend:', result.data.id);
        // Update reply with server ID
        const updateRepliesWithId = (comments: Comment[]): Comment[] => {
          return comments.map(c => {
            if (c.id === parentCommentId && c.replies) {
              return {
                ...c,
                replies: c.replies.map(r => 
                  r.id === newReply.id ? { ...r, id: String(result.data.id) } : r
                )
              };
            }
            if (c.replies) return { ...c, replies: updateRepliesWithId(c.replies) };
            return c;
          });
        };
        setComments(prev => updateRepliesWithId(prev));
      } else {
        console.error('❌ Failed to save inline reply:', result.message);
      }
    } catch (error) {
      console.error('❌ Error posting inline reply:', error);
    }
  };

  const handleDeleteConfession = () => {
    if (!confession || !canDeleteConfession(confession)) return;
    
    // In a real app, you'd call the API to delete the confession
    // For now, we'll just navigate back
    onBack();
  };

  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  const calculateEngagementScore = (comment: Comment): number => {
    const upvotes = Math.max(0, comment.score || 0);
    const replyCount = comment.replies?.length || 0;
    const reactionCount = comment.reactions ? 
      Object.values(comment.reactions).reduce((sum, reaction) => sum + reaction.count, 0) : 0;
    
    return upvotes * 2 + replyCount * 3 + reactionCount * 1;
  };

  const sortComments = (comments: Comment[], sortBy: SortOption): Comment[] => {
    // Separate user comments from others
    const userComments = comments.filter(comment => comment.authorAlias.name === alias.name);
    const otherComments = comments.filter(comment => comment.authorAlias.name !== alias.name);
    
    // Sort other comments based on selected option
    let sortedOthers = [...otherComments];
    
    switch (sortBy) {
      case 'popularity':
        sortedOthers.sort((a, b) => (b.score || 0) - (a.score || 0));
        break;
      case 'new':
        sortedOthers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      case 'old':
        sortedOthers.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        break;
      case 'best':
        sortedOthers.sort((a, b) => calculateEngagementScore(b) - calculateEngagementScore(a));
        break;
      default:
        break;
    }
    
    // Return user comments first, then sorted others
    return [...userComments, ...sortedOthers];
  };

  const getSortedComments = () => {
    return sortComments(comments, sortOption);
  };

  const handleEditComment = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditTexts(prev => ({ ...prev, [commentId]: comment.content }));
      setEditingComment(commentId);
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    const newContent = editTexts[commentId];
    if (!newContent?.trim()) return;

    // Update comment locally first (optimistic update)
    const updateComments = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            content: newContent.trim(),
            isEdited: true,
            editedAt: new Date()
          };
        }
        if (comment.replies) {
          return { ...comment, replies: updateComments(comment.replies) };
        }
        return comment;
      });
    };

    setComments(updateComments);
    setEditingComment(null);
    setEditTexts(prev => ({ ...prev, [commentId]: '' }));

    // Send to backend
    try {
      const response = await fetch(`${getServerUrl()}/api/confessions/${confessionId}/reply/${commentId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent.trim(),
          sessionId: localStorage.getItem('confession_session_id')
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to edit comment:', result.message);
        // Could revert optimistic update here if needed
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      // Comment is already updated locally, so no need to revert
    }
  };

  const handleCancelEdit = (commentId: string) => {
    setEditingComment(null);
    setEditTexts(prev => ({ ...prev, [commentId]: '' }));
  };

  const revealSensitiveContent = () => {
    setRevealedContent(true);
  };

  const canDeleteConfession = (confession: Confession) => {
    // For demo purposes, using a mock session ID - replace with actual session management
    const currentSessionId = 'demo-session-123';
    
    if (!confession.authorAlias || confession.authorAlias.name !== alias.name) {
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

  const renderComment = (comment: Comment) => {
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isExpanded = expandedComments[comment.id];
    const indentLevel = Math.min(comment.depth, 3); // Max 3 levels of visual indentation

    return (
      <div key={comment.id} className={`${comment.depth > 0 ? 'ml-3 sm:ml-4 lg:ml-8' : ''} ${comment.depth > 0 ? 'border-l-2 border-[#b76e79]/20 pl-3 sm:pl-4' : ''}`}>
        <div className="group py-3 sm:py-4">
          {/* Comment Header */}
          <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="relative flex-shrink-0">
              {comment.authorAlias.imageUrl ? (
                <img 
                  src={comment.authorAlias.imageUrl} 
                  alt="Author avatar" 
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border border-[#b76e79]/20" 
                />
              ) : (
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${comment.authorAlias.color} flex items-center justify-center text-white text-xs sm:text-sm font-bold border border-[#b76e79]/20`}>
                  {comment.authorAlias.emoji}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium text-xs sm:text-sm">{String(comment.authorAlias?.name || 'Anonymous')}</span>
                  {comment.authorAlias.name === alias.name && (
                    <div className="px-2 py-0.5 bg-[#b76e79]/20 text-[#b76e79] text-xs rounded-full font-medium">
                      You
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {comment.replyingTo && (
                    <span className="text-[#b76e79] text-xs">
                      replying to @{comment.replyingTo}
                    </span>
                  )}
                  <span className="text-zinc-500 text-xs font-medium">{formatTimeAgo(comment.timestamp)}</span>
                  {sortOption === 'best' && (
                    <span className="text-[#b76e79] text-xs">
                      • {calculateEngagementScore(comment)} pts
                    </span>
                  )}
                </div>
              </div>
              
              {/* Comment Content */}
              <div className="bg-[#27272a]/30 backdrop-blur-sm rounded-xl sm:rounded-2xl rounded-tl-lg p-2.5 sm:p-3 border border-[#b76e79]/10">
                {editingComment === comment.id ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <textarea
                      value={editTexts[comment.id] || ''}
                      onChange={(e) => setEditTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                      className="w-full bg-black/50 border border-[#b76e79]/20 rounded-xl px-3 py-2 text-white placeholder-zinc-400 focus:border-[#b76e79]/50 focus:outline-none focus:ring-2 focus:ring-[#b76e79]/20 resize-none min-h-[4rem] text-xs sm:text-sm"
                      placeholder="Edit your comment..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          handleSaveEdit(comment.id);
                        }
                        if (e.key === 'Escape') {
                          handleCancelEdit(comment.id);
                        }
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-zinc-500 text-xs">
                        Ctrl+Enter to save • Escape to cancel
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCancelEdit(comment.id)}
                          className="flex items-center gap-1 px-2 py-1 text-[#a1a1aa] hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-all duration-300 text-xs"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={!editTexts[comment.id]?.trim() || editTexts[comment.id] === comment.content}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-300 text-xs ${
                            editTexts[comment.id]?.trim() && editTexts[comment.id] !== comment.content
                              ? 'text-[#b76e79] hover:text-[#b76e79]/80 bg-[#b76e79]/20 hover:bg-[#b76e79]/30'
                              : 'text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <p className="text-zinc-100 text-xs sm:text-sm leading-relaxed">{comment.content}</p>
                    {comment.isEdited && (
                      <div className="mt-2 pt-2 border-t border-[#b76e79]/10">
                        <p className="text-zinc-500 text-xs italic">
                          Edited {comment.editedAt ? formatTimeAgo(comment.editedAt) : 'recently'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Comment Actions */}
              <div className="flex items-center gap-2 sm:gap-4 mt-2">
                {/* Voting */}
                <div className="flex items-center gap-0.5 sm:gap-1 bg-[#27272a]/30 backdrop-blur-sm rounded-lg sm:rounded-xl p-0.5 sm:p-1">
                  <button
                    onClick={() => handleVoteComment(comment.id, 1)}
                    className={`p-0.5 sm:p-1 rounded-md sm:rounded-lg transition-all duration-300 ${
                      comment.userVote === 1 
                        ? 'text-blue-400 bg-blue-400/20' 
                        : 'text-[#a1a1aa] hover:text-blue-400'
                    }`}
                  >
                    <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                  <span className="text-white font-semibold text-xs min-w-[0.75rem] sm:min-w-[1rem] text-center">
                    {comment.score}
                  </span>
                  <button
                    onClick={() => handleVoteComment(comment.id, -1)}
                    className={`p-0.5 sm:p-1 rounded-md sm:rounded-lg transition-all duration-300 ${
                      comment.userVote === -1 
                        ? 'text-red-400 bg-red-400/20' 
                        : 'text-[#a1a1aa] hover:text-red-400'
                    }`}
                  >
                    <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </div>
                
                {/* Reactions */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {comment.reactions && Object.entries(comment.reactions)
                    .filter(([_, data]) => data.count > 0)
                    .slice(0, 2)
                    .map(([type, data]) => {
                      const emoji = reactionEmojis.find(r => r.name === type)?.emoji || '❤️';
                      return (
                        <button
                          key={type}
                          onClick={() => handleReaction(comment.id, type)}
                          className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs transition-all duration-300 ${
                            data.userReacted 
                              ? 'text-[#b76e79] bg-[#b76e79]/20' 
                              : 'text-[#a1a1aa] hover:text-[#b76e79] hover:bg-[#b76e79]/10'
                          }`}
                        >
                          <span className="text-xs sm:text-sm">{emoji}</span>
                          <span className="text-xs">{data.count}</span>
                        </button>
                      );
                    })}
                  
                </div>
                
                {/* Edit Button (only for user's comments) */}
                {comment.sessionId === localStorage.getItem('confession_session_id') && editingComment !== comment.id && (
                  <button
                    onClick={() => handleEditComment(comment.id)}
                    className="flex items-center gap-1 px-2 py-1 text-[#a1a1aa] hover:text-[#b76e79] rounded-lg hover:bg-[#b76e79]/10 transition-all duration-300 text-xs"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </button>
                )}
                
                {/* Reply Button */}
                {editingComment !== comment.id && (
                  <button
                    onClick={() => handleReply(comment.id, comment.authorAlias.name)}
                    className="flex items-center gap-1 px-2 py-1 text-[#a1a1aa] hover:text-[#b76e79] rounded-lg hover:bg-[#b76e79]/10 transition-all duration-300 text-xs"
                  >
                    <Reply className="w-3 h-3" />
                    Reply
                  </button>
                )}
                
                {/* Show Replies Toggle */}
                {hasReplies && (
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    className="flex items-center gap-1 px-2 py-1 text-[#b76e79] hover:text-[#b76e79] rounded-lg hover:bg-[#b76e79]/10 transition-all duration-300 text-xs"
                  >
                    <MessageCircle className="w-3 h-3" />
                    {isExpanded ? 'Hide' : 'Show'} {comment.replies?.length} replies
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Inline Reply Input */}
        {showReplyInput[comment.id] && (
          <div className={`mt-3 ${comment.depth > 0 ? 'ml-6 sm:ml-8' : 'ml-8 sm:ml-11'}`}>
            <div className="flex gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                👤
              </div>
              <div className="flex-1">
                <div className="flex items-end gap-2 bg-[#27272a]/30 backdrop-blur-sm rounded-xl border border-[#b76e79]/10 p-1">
                  <textarea
                    value={replyTexts[comment.id] || ''}
                    onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                    placeholder={`Reply to @${String(comment.authorAlias?.name || 'Anonymous')}...`}
                    className="flex-1 bg-transparent px-3 py-2 text-white placeholder-zinc-400 focus:outline-none resize-none min-h-[2rem] max-h-20 text-sm"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleInlineReply(comment.id, comment.authorAlias.name);
                      }
                      if (e.key === 'Escape') {
                        setShowReplyInput(prev => ({ ...prev, [comment.id]: false }));
                        setReplyTexts(prev => ({ ...prev, [comment.id]: '' }));
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleInlineReply(comment.id, String(comment.authorAlias?.name || 'Anonymous'))}
                    disabled={!replyTexts[comment.id]?.trim()}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      replyTexts[comment.id]?.trim()
                        ? 'bg-gradient-to-r from-[#b76e79] to-[#b76e79] hover:from-[#b76e79] hover:to-[#b76e79] text-black '
                        : 'bg-black/70 text-[#a1a1aa] cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-zinc-500 text-xs mt-1 px-2">
                  Press Enter to reply • Escape to cancel
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Nested Replies */}
        {hasReplies && (isExpanded || comment.depth === 0) && (
          <div className="space-y-0">
            {comment.replies?.map(reply => renderComment(reply))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-[#b76e79] to-[#b76e79] rounded-full mb-4 mx-auto"></div>
          <p className="text-[#a1a1aa] font-medium">Loading confession...</p>
        </div>
      </div>
    );
  }

  if (!confession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Confession Not Found</h2>
          <p className="text-[#a1a1aa] mb-6">The confession you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gradient-to-r from-[#b76e79] to-[#b76e79] text-black rounded-lg hover:from-[#b76e79]/90 hover:to-[#b76e79]/90 transition-colors font-semibold"
          >
            Back to Confessions
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-2xl border-b border-[#b76e79]/10 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1 sm:gap-2 text-[#b76e79] hover:text-[#b76e79] transition-all duration-300 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl hover:bg-[#b76e79]/10"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline font-medium text-sm">Back</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white via-[#b76e79] to-[#b76e79] bg-clip-text text-transparent">
                Confessions
              </h1>
              <p className="text-xs text-[#a1a1aa]">{getCommentCount(confession)} comments</p>
            </div>
          </div>
          
          {/* Delete Button */}
          {confession.authorAlias.name === alias.name && (
            <div className="relative group">
              <button
                onClick={() => canDeleteConfession(confession) && handleDeleteConfession()}
                disabled={!canDeleteConfession(confession)}
                className={`p-2.5 rounded-2xl transition-all duration-300 ${
                  canDeleteConfession(confession)
                    ? 'text-[#a1a1aa] hover:text-red-400 hover:bg-red-900/20 cursor-pointer'
                    : 'text-zinc-600 cursor-not-allowed opacity-50'
                }`}
                title={
                  canDeleteConfession(confession) 
                    ? `Delete this confession (${getDeletionTimeRemaining(confession)} remaining)` 
                    : "Deletion window expired (24h limit)"
                }
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              
              {/* Time remaining indicator */}
              {canDeleteConfession(confession) && getDeletionTimeRemaining(confession) && (
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-[#27272a]/90 backdrop-blur-sm text-[#b76e79] text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap border border-[#b76e79]/20">
                  {getDeletionTimeRemaining(confession)} left to delete
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-zinc-800/90"></div>
                </div>
              )}
              
              {/* Expired indicator */}
              {!canDeleteConfession(confession) && confession.authorAlias.name === alias.name && (
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm text-[#a1a1aa] text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap border border-zinc-600/20">
                  24h deletion limit expired
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-zinc-800/90"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        {/* Confession Section - 45% */}
        <div className="w-full lg:w-[45%] lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] lg:overflow-y-auto lg:border-r border-[#b76e79]/10">
          <div className="p-4 sm:p-6">
            {/* Author Header */}
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="relative">
                {confession.authorAlias.imageUrl ? (
                  <img 
                    src={confession.authorAlias.imageUrl} 
                    alt="Author avatar" 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#b76e79]/20 " 
                  />
                ) : (
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${confession.authorAlias.color} flex items-center justify-center text-white text-lg sm:text-xl font-bold  border-2 border-[#b76e79]/20`}>
                    {confession.authorAlias.emoji}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-black rounded-full flex items-center justify-center border border-[#b76e79]/30">
                  <EyeOff className="w-2 h-2 sm:w-3 sm:h-3 text-[#b76e79]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm sm:text-base">{String(confession.authorAlias?.name || 'Anonymous')}</span>
                  {confession.authorAlias && (confession.authorAlias as any).badge && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10 ${confession.authorAlias.badge.color}`}>
                      <span className="text-xs">{(confession.authorAlias as any).badge.icon}</span>
                      <span>{(confession.authorAlias as any).badge.name}</span>
                    </div>
                  )}
                  <div className="px-2 py-0.5 bg-[#b76e79]/20 text-[#b76e79] text-xs rounded-full font-medium">
                    Anonymous
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span className="text-zinc-500 text-xs">{formatTimeAgo(confession.timestamp)}</span>
                </div>
              </div>
            </div>

            {/* Explicit Content Warning */}
            {confession.isExplicit && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">Explicit Content</span>
                <span className="text-xs text-red-300">This confession contains mature language</span>
              </div>
            )}

            {/* Confession Content */}
            <div className="mb-4 sm:mb-6 relative">
              {confession.backgroundImageUrl ? (
                <div className={`rounded-2xl sm:rounded-3xl overflow-hidden border border-[#b76e79]/10 mb-4 sm:mb-6  ${
                  confession.isExplicit && !revealedContent ? 'blur-lg' : ''
                }`}>
                  <div className="relative h-48 sm:h-64 bg-[#27272a]">
                    <img 
                      src={confession.backgroundImageUrl} 
                      alt="background" 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-0 p-4 sm:p-6 flex items-end">
                      <p className="text-white drop-shadow-2xl leading-relaxed text-base sm:text-lg font-medium tracking-wide whitespace-pre-wrap">
                        {confession.content}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={confession.isExplicit && !revealedContent ? 'blur-lg' : ''}>
                  {confession.content ? (
                    <p className="text-zinc-100 leading-relaxed text-lg sm:text-xl font-medium tracking-wide whitespace-pre-wrap">
                      {confession.content}
                    </p>
                  ) : (
                    <p className="text-[#a1a1aa] leading-relaxed text-lg sm:text-xl font-medium tracking-wide italic">
                      {confession.poll ? 'Poll only confession' : 'Media only confession'}
                    </p>
                  )}
                </div>
              )}
              
              {/* Sensitive Content Overlay */}
              {confession.isExplicit && !revealedContent && (
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
                                revealSensitiveContent();
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

            {/* Confession Actions */}
            {(!confession.isExplicit || revealedContent) && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
              {/* Voting */}
              <div className="flex items-center gap-2 bg-[#27272a]/30 backdrop-blur-sm rounded-2xl p-2 border border-[#b76e79]/10">
                <button
                  onClick={() => handleVoteConfession(1)}
                  className={`p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${
                    confession.userVote === 1 
                      ? 'text-blue-400 bg-blue-400/20  shadow-blue-400/20' 
                      : 'text-[#a1a1aa] hover:text-blue-400 hover:bg-blue-400/10'
                  }`}
                >
                  <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <span className="text-base sm:text-lg font-bold text-white px-2">
                  {confession.score}
                </span>
                <button
                  onClick={() => handleVoteConfession(-1)}
                  className={`p-1.5 sm:p-2 rounded-xl transition-all duration-300 ${
                    confession.userVote === -1 
                      ? 'text-red-400 bg-red-400/20  shadow-red-400/20' 
                      : 'text-[#a1a1aa] hover:text-red-400 hover:bg-red-400/10'
                  }`}
                >
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Reactions */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {confession.reactions && Object.entries(confession.reactions)
                  .filter(([_, data]) => data.count > 0)
                  .slice(0, 3)
                  .map(([type, data]) => {
                    const emoji = reactionEmojis.find(r => r.name === type)?.emoji || '❤️';
                    return (
                      <button
                        key={type}
                        onClick={() => handleReaction(confession.id, type, true)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition-all duration-300 ${
                          data.userReacted 
                            ? 'text-[#b76e79] bg-[#b76e79]/20  ' 
                            : 'text-[#a1a1aa] hover:text-[#b76e79] hover:bg-[#b76e79]/10'
                        }`}
                      >
                        <span className="text-base sm:text-lg">{emoji}</span>
                        <span className="font-semibold">{data.count}</span>
                      </button>
                    );
                  })}
                
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Comments Section - 55% */}
        {(!confession.isExplicit || revealedContent) && (
        <div className="w-full lg:w-[55%] flex flex-col">
          {/* Comments Header */}
          <div className="p-4 sm:p-6 border-b border-[#b76e79]/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#b76e79]/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-[#b76e79]" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-base sm:text-lg">Comments</h2>
                  <p className="text-[#a1a1aa] text-xs sm:text-sm">{comments.length} comments • Join the discussion</p>
                </div>
              </div>
              
              {/* Sort Menu */}
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                    showSortMenu
                      ? 'bg-[#b76e79]/20 text-[#b76e79] border border-[#b76e79]/40'
                      : 'bg-black/50 text-[#a1a1aa] hover:text-[#b76e79] hover:bg-[#b76e79]/10 border border-[#b76e79]/10'
                  }`}
                  title="Sort comments"
                >
                  <Menu className="w-4 h-4" />
                  <span className="hidden sm:inline font-medium">Sort</span>
                </button>

                {/* Sort Dropdown */}
                {showSortMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-[#27272a]/95 backdrop-blur-xl border border-[#b76e79]/30 rounded-xl p-2  z-50 min-w-[140px]">
                    <div className="space-y-1">
                      {[
                        { key: 'new', label: 'Most Recent', icon: Clock },
                        { key: 'popularity', label: 'Most Popular', icon: Flame },
                        { key: 'old', label: 'Oldest First', icon: Calendar },
                        { key: 'best', label: 'Best Engagement', icon: Star }
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.key}
                            onClick={() => {
                              setSortOption(option.key as SortOption);
                              setShowSortMenu(false);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                              sortOption === option.key
                                ? 'bg-[#b76e79]/20 text-[#b76e79] border border-[#b76e79]/30'
                                : 'text-white hover:bg-[#b76e79]/10 hover:text-[#b76e79]'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="font-medium">{option.label}</span>
                            {sortOption === option.key && (
                              <div className="w-1.5 h-1.5 bg-[#b76e79] rounded-full ml-auto"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Simplified Sort Info */}
            <div className="text-xs text-zinc-500">
              {comments.filter(c => c.authorAlias.name === alias.name).length > 0 && 'Your comments shown first • '}
              {sortOption === 'popularity' && 'Most upvotes'}
              {sortOption === 'new' && 'Most recent'}
              {sortOption === 'old' && 'Oldest first'}
              {sortOption === 'best' && 'Best engagement'}
            </div>
          </div>

          {/* Comment Input */}
          <div className="p-4 sm:p-6 border-b border-[#b76e79]/10">
            {replyingTo && (
              <div className="mb-3 flex items-center gap-2 text-xs sm:text-sm text-[#b76e79]">
                <Reply className="w-3 h-3 sm:w-4 sm:h-4" />
                Replying to @{replyingTo.username}
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-[#a1a1aa] hover:text-white ml-2"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                👤
              </div>
              <div className="flex-1">
                <div className="flex items-end gap-2 sm:gap-3 bg-[#27272a]/30 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-[#b76e79]/10 p-1 relative" ref={commentEmojiContainerRef}>
                  <textarea
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : "Share your thoughts..."}
                    className="flex-1 bg-transparent px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-zinc-400 focus:outline-none resize-none min-h-[2rem] sm:min-h-[2.5rem] max-h-24 sm:max-h-32 text-sm sm:text-base"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  {/* Emoji button for main comment box */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        const trigger = e.currentTarget as HTMLButtonElement;
                        const rect = trigger.getBoundingClientRect();
                        const estimatedWidth = 5 * 40 + 4 * 8 + 16;
                        const margin = 12;
                        if (rect.left < margin && rect.right + estimatedWidth < window.innerWidth - margin) {
                          setCommentEmojiSide('left');
                        } else if (rect.right + estimatedWidth > window.innerWidth - margin) {
                          setCommentEmojiSide('right');
                        } else {
                          setCommentEmojiSide('center');
                        }
                        setOpenCommentEmojiPicker(prev => !prev);
                      }}
                      className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl sm:rounded-2xl text-lg sm:text-xl text-zinc-300 hover:text-[#b76e79] hover:bg-[#b76e79]/10 transition-colors"
                      aria-label="Insert emoji"
                      type="button"
                    >
                      {commentEmojiButton}
                    </button>

                    {openCommentEmojiPicker && (
                      <div className={`absolute z-50 mt-2 top-full bg-black/90 border border-[#b76e79]/20 rounded-2xl p-2 shadow-xl backdrop-blur-sm max-w-[calc(100vw-24px)] w-64 sm:w-80 max-h-60 overflow-y-auto ${
                        commentEmojiSide === 'right' ? 'right-0' : commentEmojiSide === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'
                      }`}>
                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                          {reactionEmojis.slice(0, 30).map((item) => (
                            <button
                              key={item.name}
                              onClick={() => {
                                setNewComment(prev => (prev || '') + item.emoji);
                                setCommentEmojiButton(item.emoji);
                                setOpenCommentEmojiPicker(false);
                                setTimeout(() => commentInputRef.current?.focus(), 0);
                              }}
                              className="w-10 h-10 flex items-center justify-center text-xl rounded-xl hover:bg-white/10 transition-colors"
                              title={`Insert ${item.emoji}`}
                              type="button"
                            >
                              {item.emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      newComment.trim()
                        ? 'bg-gradient-to-r from-[#b76e79] to-[#b76e79] hover:from-[#b76e79] hover:to-[#b76e79] text-black '
                        : 'bg-black/70 text-[#a1a1aa] cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
                <p className="text-zinc-500 text-xs mt-2 px-2 sm:px-4">
                  Press Enter to send • Shift+Enter for new line
                </p>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto">
            {comments.length > 0 ? (
              <div className="divide-y divide-[#b76e79]/5">
                {getSortedComments().map(comment => renderComment(comment))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-[#b76e79]/10 rounded-3xl flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-[#b76e79]/60" />
                </div>
                <p className="text-zinc-300 font-medium mb-2">No comments yet</p>
                <p className="text-zinc-500 text-sm text-center">
                  Be the first to share your thoughts on this confession
                </p>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
