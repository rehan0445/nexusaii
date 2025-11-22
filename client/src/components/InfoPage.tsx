import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Search,
  Filter,
  Bell,
  Bookmark,
  ThumbsUp,
  CheckCircle,
  Calendar,
  Clock,
  Pin,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Users,
  GraduationCap,
  Briefcase,
  Users2,
  Megaphone
} from 'lucide-react';

// Custom styles for animations
const styles = {
  emojiButton: "w-10 h-10 flex items-center justify-center rounded-lg hover:bg-zinc-700 transition-all duration-150 text-xl hover:scale-110 active:scale-95 hover:shadow-lg",
  emojiPicker: "absolute bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl z-50 animate-in fade-in duration-200 backdrop-blur-sm",
  reactionButton: "flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 hover:scale-105"
};

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'events' | 'exams' | 'clubs' | 'placements';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isSticky: boolean;
  isUrgent: boolean;
  likes: number;
  attending: number;
  isLiked?: boolean;
  isAttending?: boolean;
  isSaved?: boolean;
  author: {
    id: string;
    name: string;
    role: string;
  };
  attachments?: {
    type: 'image' | 'pdf' | 'document';
    url: string;
    name: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

interface InfoPageProps {
  onBack: () => void;
  universityId: string;
  currentUser: {
    id: string;
    name: string;
    isAdmin: boolean;
  };
  collegeName?: string;
  collegeFullName?: string;
}

const EMOJI_OPTIONS = [
  '👍', '❤️', '😢', '😡', '👀', 
  '🎉', '👏', '🔥', '😰', '📚', 
  '💪', '😤', '🙏', '⚠️', '💙',
  '😊', '😮', '🤔', '😴', '🚀'
];

export function InfoPage({ onBack, universityId, currentUser, collegeName, collegeFullName }: InfoPageProps) {
  const [infoPosts, setInfoPosts] = useState<InfoPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<InfoPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reactionFeedback, setReactionFeedback] = useState<{postId: string, emoji: string} | null>(null);
  const [reactionLoading, setReactionLoading] = useState<{postId: string, emoji: string} | null>(null);
  const [toastMessage, setToastMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(null);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Show reaction feedback briefly
  useEffect(() => {
    if (reactionFeedback) {
      const timer = setTimeout(() => {
        setReactionFeedback(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [reactionFeedback]);

  // Auto-hide toast messages
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Debug reactions data
  useEffect(() => {
    console.log('InfoPosts updated:', infoPosts.map(post => ({ id: post.id, reactions: post.reactions })));
  }, [infoPosts]);

  // Debug filtered posts
  useEffect(() => {
    console.log('FilteredPosts updated:', filteredPosts.map(post => ({ id: post.id, reactions: post.reactions })));
  }, [filteredPosts]);

  // Fetch announcements from API
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/feed/updates?limit=20');
        const data = await response.json();
        
        if (data.success) {
          const formattedPosts = (data.data.items || []).map((post: any) => ({
            id: post.id,
            title: post.summary || post.title || 'Update',
            content: post.summary || '—',
            category: 'events',
            priority: 'low',
            targetAudience: ['all'],
            campus: 'main',
            department: null,
            tags: [],
            isPinned: false,
            likes: Math.floor(Math.random()*50)+1,
            reactions: { '👍': Math.floor(Math.random()*10) },
            author: { id: 'system', name: 'System', role: 'system' },
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
          setInfoPosts(formattedPosts);
          setFilteredPosts(formattedPosts);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
        // Fallback to mock data
        setInfoPosts(mockPosts);
        setFilteredPosts(mockPosts);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // Mock data fallback
  const mockPosts: InfoPost[] = [
    {
      id: '1',
      title: 'Campus Wi-Fi Maintenance Scheduled',
      content: 'The campus Wi-Fi network will be undergoing maintenance on Friday, December 15th from 2:00 AM to 6:00 AM. During this time, internet connectivity may be intermittent. We apologize for any inconvenience.',
      category: 'infrastructure',
      priority: 'high',
      targetAudience: ['all'],
      campus: 'main',
      department: null,
      tags: ['wifi', 'maintenance', 'network'],
      isPinned: true,
      likes: 42,
      reactions: {
        '👍': 15,
        '❤️': 8,
        '😢': 12,
        '😡': 3,
        '👀': 4
      },
      author: {
        id: 'admin_1',
        name: 'Campus Admin',
        role: 'system_admin'
      },
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: '2',
      title: 'New Study Rooms Available in Library',
      content: 'We are excited to announce that 10 new study rooms are now available on the 3rd floor of the main library. These rooms can be booked online through the library portal. Each room accommodates 4-6 students and includes whiteboards and power outlets.',
      category: 'academic',
      priority: 'medium',
      targetAudience: ['students'],
      campus: 'main',
      department: 'library',
      tags: ['library', 'study rooms', 'booking'],
      isPinned: false,
      likes: 128,
      reactions: {
        '👍': 45,
        '❤️': 23,
        '🎉': 18,
        '👏': 12,
        '🔥': 8
      },
      author: {
        id: 'admin_2',
        name: 'Library Admin',
        role: 'department_admin'
      },
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
    },
    {
      id: '4',
      title: 'Emergency: Campus Security Alert',
      content: 'Due to severe weather conditions, all outdoor activities are cancelled today. Students are advised to stay indoors and avoid unnecessary travel. Campus shuttle services are temporarily suspended.',
      category: 'emergency',
      priority: 'urgent',
      targetAudience: ['all'],
      campus: 'all',
      department: 'security',
      tags: ['emergency', 'weather', 'safety'],
      isPinned: true,
      likes: 156,
      reactions: {
        '👍': 50,
        '😰': 30,
        '🙏': 25,
        '⚠️': 20,
        '💙': 15
      },
      author: {
        id: 'admin_4',
        name: 'Campus Security',
        role: 'security_admin'
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: '3',
      title: 'Final Exams Schedule Released',
      content: 'The final examination schedule for this semester has been published on the student portal. Please check your individual timetables and note any conflicts. The examination period runs from December 18th to December 22nd.',
      category: 'academic',
      priority: 'urgent',
      targetAudience: ['students'],
      campus: 'all',
      department: 'registrar',
      tags: ['exams', 'schedule', 'important'],
      isPinned: true,
      likes: 89,
      reactions: {
        '👍': 90,
        '👎': 27,
        '😮': 20,
        '📊': 15,
        '💪': 10,
        '🥺': 8
      },
      author: {
        id: 'admin_3',
        name: 'Registrar Office',
        role: 'department_admin'
      },
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
    }
  ];

  // Filter and search functionality
  useEffect(() => {
    let filtered = infoPosts;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Apply priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(post => post.priority === selectedPriority);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query)) ||
        post.author.name.toLowerCase().includes(query)
      );
    }

    setFilteredPosts(filtered);
  }, [infoPosts, selectedCategory, selectedPriority, searchQuery]);

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || window.location.origin}/api/v1/announcements/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header in real implementation
        }
      });

      if (response.ok) {
        setInfoPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, likes: post.likes + 1, isLiked: true }
            : post
        ));
        
        // No longer need to update filteredPosts as it's not a detailed view
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Optimistic update for demo
      setInfoPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, likes: post.likes + 1, isLiked: true }
          : post
      ));
    }
  };

  const handleReaction = async (postId: string, emoji: string) => {
    try {
      // Set loading state
      setReactionLoading({ postId, emoji });
      
      // Show immediate feedback
      setReactionFeedback({ postId, emoji });
      
      // Optimistic update first
      setInfoPosts(prev => prev.map(post =>
        post.id === postId
          ? {
              ...post,
              reactions: {
                ...post.reactions,
                [emoji]: (post.reactions[emoji] || 0) + 1
              },
              userReaction: emoji
            }
          : post
      ));
      
      // Also update filtered posts optimistically
      setFilteredPosts(prev => prev.map(post =>
        post.id === postId
          ? {
              ...post,
              reactions: {
                ...post.reactions,
                [emoji]: (post.reactions[emoji] || 0) + 1
              },
              userReaction: emoji
            }
          : post
      ));
      
      console.log('Optimistic update applied:', { postId, emoji });
      
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || window.location.origin}/api/v1/announcements/${postId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}` // Add auth header
        },
        body: JSON.stringify({ emoji })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update with server response
        setInfoPosts(prev => prev.map(post =>
          post.id === postId
            ? {
                ...post,
                reactions: result.data.reactions,
                userReaction: emoji
              }
            : post
        ));
        
        // Also update filtered posts to ensure UI reflects changes
        setFilteredPosts(prev => prev.map(post =>
          post.id === postId
            ? {
                ...post,
                reactions: result.data.reactions,
                userReaction: emoji
              }
            : post
        ));
        
        console.log('Reaction updated successfully:', { postId, emoji, reactions: result.data.reactions });
        setToastMessage({ type: 'success', message: 'Reaction added successfully!' });
      } else {
        // Revert optimistic update if server failed
        setInfoPosts(prev => prev.map(post =>
          post.id === postId
            ? {
                ...post,
                reactions: {
                  ...post.reactions,
                  [emoji]: Math.max(0, (post.reactions[emoji] || 0) - 1)
                },
                userReaction: post.userReaction
              }
            : post
        ));
        
        // Also revert filtered posts
        setFilteredPosts(prev => prev.map(post =>
          post.id === postId
            ? {
                ...post,
                reactions: {
                  ...post.reactions,
                  [emoji]: Math.max(0, (post.reactions[emoji] || 0) - 1)
                },
                userReaction: post.userReaction
              }
            : post
        ));
        
        console.error('Server returned error:', result.message);
        setToastMessage({ type: 'error', message: result.message || 'Failed to add reaction' });
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
      
      // Revert optimistic update on error
      setInfoPosts(prev => prev.map(post =>
        post.id === postId
          ? {
              ...post,
              reactions: {
                ...post.reactions,
                [emoji]: Math.max(0, (post.reactions[emoji] || 0) - 1)
              },
              userReaction: post.userReaction
            }
          : post
      ));
      
      // Also revert filtered posts on error
      setFilteredPosts(prev => prev.map(post =>
        post.id === postId
          ? {
              ...post,
              reactions: {
                ...post.reactions,
                [emoji]: Math.max(0, (post.reactions[emoji] || 0) - 1)
              },
              userReaction: post.userReaction
            }
          : post
      ));
      
      // Show error feedback to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setToastMessage({ type: 'error', message: `Failed to add reaction: ${errorMessage}` });
    } finally {
      // Clear loading state
      setReactionLoading(null);
      setShowEmojiPicker(null);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500/50 bg-red-900/20';
      case 'high':
        return 'border-orange-500/50 bg-orange-900/20';
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-900/20';
      default:
        return 'border-zinc-700/50 bg-zinc-800/30';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-400" />;
      default:
        return <MessageCircle className="w-4 h-4 text-blue-400" />;
    }
  };

  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'emergency':
        return <AlertTriangle className="w-4 h-4" />;
      case 'academic':
        return <Users className="w-4 h-4" />;
      case 'events':
        return <Calendar className="w-4 h-4" />;
      case 'infrastructure':
        return <Shield className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Trending highlights (last 24h, client-side) */}
      <div className="max-w-4xl mx-auto px-6 pt-4">
        <div className="mb-4">
          <h3 className="text-white font-semibold mb-2">Trending Highlights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...filteredPosts]
              .filter(p => (Date.now() - p.createdAt.getTime()) < 24*60*60*1000)
              .sort((a,b) => (b.likes + Object.values(b.reactions).reduce((s, c) => s + c, 0)) - (a.likes + Object.values(a.reactions).reduce((s, c) => s + c, 0)))
              .slice(0, 4)
              .map((p) => (
                <div key={p.id} className="rounded-xl border border-zinc-700/50 bg-zinc-800/40 p-3">
                  <div className="text-sm text-zinc-300 font-medium truncate">{p.title}</div>
                  <div className="text-xs text-zinc-500">{p.likes} likes • {Object.values(p.reactions).reduce((s, c) => s + c, 0)} reactions</div>
                </div>
              ))}
          </div>
        </div>
      </div>
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          toastMessage.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-lg">
              {toastMessage.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="font-medium">{toastMessage.message}</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-zinc-800/50 backdrop-blur-sm border-b border-zinc-700/50 sticky top-0 z-40">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {collegeName ? `${collegeName} Information` : 'Campus Information'}
                  </h2>
                  <p className="text-zinc-400 text-sm">Official updates and announcements</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-900/30 px-3 py-1 rounded-full flex items-center">
              <Crown className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-blue-400 text-sm font-mono">Admin Posted</span>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="academic">Academic</option>
              <option value="events">Events</option>
              <option value="emergency">Emergency</option>
            </select>
            
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No announcements found</h3>
              <p className="text-zinc-400">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className={`group relative rounded-2xl p-6 transition-all duration-300 ${getPriorityStyle(post.priority)} border-2`}
                >
                  {/* Priority Indicator */}
                  <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityBadgeStyle(post.priority)} shadow-lg`}>
                      {post.priority.toUpperCase()}
                    </div>
                    {post.isPinned && (
                      <div className="bg-yellow-500/20 p-2 rounded-full border border-yellow-500/30">
                        <Pin className="w-4 h-4 text-yellow-400" />
                      </div>
                    )}
                  </div>

                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/20">
                          {getPriorityIcon(post.priority)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-zinc-900 flex items-center justify-center">
                          <Crown className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1 flex items-center">
                          {post.title}
                        </h3>
                        <div className="flex items-center space-x-3 text-zinc-400 text-sm">
                          <div className="flex items-center space-x-1">
                            <Crown className="w-3 h-3" />
                            <span className="font-medium">{post.author.name}</span>
                          </div>
                          <span className="w-1 h-1 bg-zinc-500 rounded-full"></span>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(post.createdAt)}</span>
                          </div>
                          <span className="w-1 h-1 bg-zinc-500 rounded-full"></span>
                          <div className="flex items-center space-x-1">
                            {getCategoryIcon(post.category)}
                            <span className="capitalize">{post.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content Section - Full Content Displayed */}
                  <div className="mb-6">
                    <p className="text-zinc-200 leading-relaxed text-base">
                      {post.content}
                    </p>
                  </div>
                  
                  {/* Removed tag chips */}
                  
                  {/* Interaction Section */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-700/50">
                    <div className="flex items-center space-x-3 text-zinc-500 text-sm">
                      {/* Like Button */}
                      <button
                        onClick={() => handleLike(post.id)}
                        disabled={post.isLiked}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                          post.isLiked
                            ? 'bg-blue-600/20 text-blue-400 shadow-lg'
                            : 'hover:bg-zinc-700/50 text-zinc-400 hover:text-white hover:shadow-md'
                        }`}
                      >
                        <ThumbsUp className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span className="font-medium">{post.likes}</span>
                      </button>
                      
                      {/* Quick Reactions */}
                      {Object.keys(post.reactions).length > 0 && (
                        <div className="flex items-center space-x-2">
                          {Object.entries(post.reactions).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(post.id, emoji)}
                              className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-sm transition-all duration-200 hover:scale-105 ${
                                post.userReaction === emoji
                                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-md'
                                  : 'bg-zinc-700/30 text-zinc-400 hover:bg-zinc-600/50 border border-transparent'
                              }`}
                            >
                              <span className="text-base">{emoji}</span>
                              <span className="font-medium">{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Quick React Button */}
                      <div className="relative" ref={emojiPickerRef}>
                        <button
                          onClick={() => setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)}
                          disabled={reactionLoading !== null}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                            showEmojiPicker === post.id
                              ? 'bg-blue-600/20 text-blue-400 shadow-lg'
                              : 'hover:bg-zinc-700/50 text-zinc-400 hover:text-white hover:shadow-md'
                          } ${reactionLoading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="text-lg">😊</span>
                          <span className="text-sm font-medium">
                            {reactionLoading?.postId === post.id ? 'Reacting...' : 'React'}
                          </span>
                        </button>
                        
                        {showEmojiPicker === post.id && (
                          <div className="absolute bottom-full left-0 mb-3 bg-zinc-800/95 backdrop-blur-md border border-zinc-700 rounded-2xl p-4 shadow-2xl z-50 min-w-[280px] animate-in fade-in slide-in-from-bottom duration-300">
                            <div className="mb-3">
                              <h4 className="text-white text-sm font-semibold mb-1 flex items-center">
                                <span className="mr-2 text-lg">😊</span>
                                Choose your reaction
                              </h4>
                              <p className="text-xs text-zinc-400">Express how you feel about this announcement</p>
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                              {EMOJI_OPTIONS.slice(0, 15).map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(post.id, emoji)}
                                  disabled={reactionLoading !== null}
                                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 text-2xl hover:scale-110 active:scale-95 hover:shadow-lg ${
                                    reactionLoading?.postId === post.id && reactionLoading?.emoji === emoji
                                      ? 'bg-blue-600/20 text-blue-400 animate-pulse'
                                      : 'hover:bg-zinc-700'
                                  } ${reactionLoading !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title={`React with ${emoji}`}
                                >
                                  {reactionLoading?.postId === post.id && reactionLoading?.emoji === emoji ? '⏳' : emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 