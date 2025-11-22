import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Info, 
  Pin, 
  Clock, 
  Users, 
  Crown, 
  Heart,
  Search,
  Filter,
  AlertTriangle,
  AlertCircle,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Calendar,
  Shield,
  Mail,
  Image,
  BarChart3,
  Share2,
  Plus,
  X,
  Send,
  Upload
} from 'lucide-react';

// Custom styles for animations
const styles = {
  emojiButton: "w-10 h-10 flex items-center justify-center rounded-lg hover:bg-zinc-700 transition-all duration-150 text-xl hover:scale-110 active:scale-95 hover:shadow-lg",
  emojiPicker: "absolute bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl z-50 animate-in fade-in duration-200 backdrop-blur-sm",
  reactionButton: "flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-200 hover:scale-105"
};

interface InfoPost {
  id: string;
  title: string;
  content: string;
  category: 'infrastructure' | 'academic' | 'events' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: string[];
  campus: string;
  department: string | null;
  tags: string[];
  isPinned: boolean;
  likes: number;
  reactions: { [emoji: string]: number };
  isLiked?: boolean;
  userReaction?: string;
  author: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface NewsletterPost {
  id: string;
  type: 'message' | 'image' | 'poll';
  content: string;
  imageUrl?: string;
  pollOptions?: string[];
  pollVotes?: { [option: string]: number };
  userVote?: string;
  upvotes: number;
  downvotes: number;
  userUpvoted?: boolean;
  userDownvoted?: boolean;
  reposts: number;
  userReposted?: boolean;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
}

interface InfoPageProps {
  onBack: () => void;
  currentUser: {
    id: string;
    name: string;
    isAdmin: boolean;
    isAuthorized: boolean;
  };
}

const EMOJI_OPTIONS = [
  '👍', '❤️', '😢', '😡', '👀', 
  '🎉', '👏', '🔥', '😰', '📚', 
  '💪', '😤', '🙏', '⚠️', '💙',
  '😊', '😮', '🤔', '😴', '🚀'
];

export function InfoPage({ onBack, currentUser }: InfoPageProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'newsletter'>('info');
  
  // Info section states
  const [infoPosts, setInfoPosts] = useState<InfoPost[]>([]);
  const [filteredInfoPosts, setFilteredInfoPosts] = useState<InfoPost[]>([]);
  const [infoSearchQuery, setInfoSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [reactionFeedback, setReactionFeedback] = useState<{postId: string, emoji: string} | null>(null);
  const [reactionLoading, setReactionLoading] = useState<{postId: string, emoji: string} | null>(null);
  
  // Newsletter section states
  const [newsletterPosts, setNewsletterPosts] = useState<NewsletterPost[]>([]);
  const [filteredNewsletterPosts, setFilteredNewsletterPosts] = useState<NewsletterPost[]>([]);
  const [newsletterSearchQuery, setNewsletterSearchQuery] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostType, setNewPostType] = useState<'message' | 'image' | 'poll'>('message');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPollOptions, setNewPollOptions] = useState(['', '']);
  
  // Common states
  const [toastMessage, setToastMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load mock data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockInfoPosts: InfoPost[] = [
        {
          id: '1',
          title: 'Campus WiFi Maintenance',
          content: 'Scheduled maintenance for campus WiFi on Saturday from 2-4 AM. Expect brief interruptions.',
          category: 'infrastructure',
          priority: 'medium',
          targetAudience: ['all'],
          campus: 'main',
          department: null,
          tags: ['wifi', 'maintenance'],
          isPinned: true,
          likes: 45,
          reactions: { '👍': 23, '❤️': 12, '👀': 10 },
          author: {
            id: 'admin1',
            name: 'IT Department',
            role: 'admin'
          },
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: '2',
          title: 'Final Exam Schedule Released',
          content: 'The final exam schedule for Spring 2024 has been released. Check your student portal for details.',
          category: 'academic',
          priority: 'high',
          targetAudience: ['students'],
          campus: 'main',
          department: 'academic',
          tags: ['exams', 'schedule'],
          isPinned: false,
          likes: 89,
          reactions: { '😰': 45, '📚': 30, '💪': 14 },
          author: {
            id: 'admin2',
            name: 'Academic Affairs',
            role: 'admin'
          },
          createdAt: new Date('2024-01-14T14:30:00Z'),
          updatedAt: new Date('2024-01-14T14:30:00Z')
        }
      ];

      const mockNewsletterPosts: NewsletterPost[] = [
        {
          id: '1',
          type: 'message',
          content: 'Anyone up for a study group tonight? Library 3rd floor! 📚',
          upvotes: 12,
          downvotes: 2,
          reposts: 5,
          author: {
            id: 'user1',
            name: 'Sarah Chen',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
          },
          createdAt: new Date('2024-01-15T16:00:00Z')
        },
        {
          id: '2',
          type: 'image',
          content: 'Beautiful sunset from the campus rooftop! 🌅',
          imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
          upvotes: 28,
          downvotes: 1,
          reposts: 8,
          author: {
            id: 'user2',
            name: 'Mike Johnson',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'
          },
          createdAt: new Date('2024-01-15T15:30:00Z')
        },
        {
          id: '3',
          type: 'poll',
          content: 'What should be the theme for the next campus event?',
          pollOptions: ['Tech & Innovation', 'Arts & Culture', 'Sports & Wellness', 'Academic Excellence'],
          pollVotes: { 'Tech & Innovation': 45, 'Arts & Culture': 23, 'Sports & Wellness': 18, 'Academic Excellence': 12 },
          upvotes: 15,
          downvotes: 3,
          reposts: 2,
          author: {
            id: 'user3',
            name: 'Emma Wilson',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'
          },
          createdAt: new Date('2024-01-15T14:00:00Z')
        }
      ];

      setInfoPosts(mockInfoPosts);
      setFilteredInfoPosts(mockInfoPosts);
      setInfoLoading(false);
      
      setNewsletterPosts(mockNewsletterPosts);
      setFilteredNewsletterPosts(mockNewsletterPosts);
      setNewsletterLoading(false);
    }, 1000);
  }, []);

  // Filter info posts
  useEffect(() => {
    let filtered = infoPosts;
    
    if (infoSearchQuery) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(infoSearchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(infoSearchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(infoSearchQuery.toLowerCase()))
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }
    
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(post => post.priority === selectedPriority);
    }
    
    setFilteredInfoPosts(filtered);
  }, [infoPosts, infoSearchQuery, selectedCategory, selectedPriority]);

  // Filter newsletter posts
  useEffect(() => {
    let filtered = newsletterPosts;
    
    if (newsletterSearchQuery) {
      filtered = filtered.filter(post => 
        post.content.toLowerCase().includes(newsletterSearchQuery.toLowerCase())
      );
    }
    
    setFilteredNewsletterPosts(filtered);
  }, [newsletterPosts, newsletterSearchQuery]);

  const handleInfoReaction = async (postId: string, emoji: string) => {
    setReactionLoading({ postId, emoji });
    
    // Simulate API call
    setTimeout(() => {
      setInfoPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const currentReactions = { ...post.reactions };
          currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
          
          return {
            ...post,
            reactions: currentReactions,
            userReaction: emoji
          };
        }
        return post;
      }));
      
      setReactionLoading(null);
      setReactionFeedback({ postId, emoji });
    }, 500);
  };

  const handleNewsletterVote = async (postId: string, voteType: 'upvote' | 'downvote') => {
    setNewsletterPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const newPost = { ...post };
        
        if (voteType === 'upvote') {
          if (post.userUpvoted) {
            newPost.upvotes--;
            newPost.userUpvoted = false;
          } else {
            newPost.upvotes++;
            newPost.userUpvoted = true;
            if (post.userDownvoted) {
              newPost.downvotes--;
              newPost.userDownvoted = false;
            }
          }
        } else {
          if (post.userDownvoted) {
            newPost.downvotes--;
            newPost.userDownvoted = false;
          } else {
            newPost.downvotes++;
            newPost.userDownvoted = true;
            if (post.userUpvoted) {
              newPost.upvotes--;
              newPost.userUpvoted = false;
            }
          }
        }
        
        return newPost;
      }
      return post;
    }));
  };

  const handlePollVote = async (postId: string, option: string) => {
    setNewsletterPosts(prev => prev.map(post => {
      if (post.id === postId && post.type === 'poll') {
        const newPost = { ...post };
        const currentVotes = { ...post.pollVotes };
        
        // Remove previous vote if exists
        if (post.userVote) {
          currentVotes[post.userVote]--;
        }
        
        // Add new vote
        currentVotes[option]++;
        newPost.pollVotes = currentVotes;
        newPost.userVote = option;
        
        return newPost;
      }
      return post;
    }));
  };

  const handleRepost = async (postId: string) => {
    setNewsletterPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          reposts: post.reposts + 1,
          userReposted: true
        };
      }
      return post;
    }));
    
    setToastMessage({ type: 'success', message: 'Post reposted successfully!' });
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      setToastMessage({ type: 'error', message: 'Please enter some content' });
      return;
    }

    if (newPostType === 'poll' && newPollOptions.filter(opt => opt.trim()).length < 2) {
      setToastMessage({ type: 'error', message: 'Please add at least 2 poll options' });
      return;
    }

    const newPost: NewsletterPost = {
      id: Date.now().toString(),
      type: newPostType,
      content: newPostContent,
      imageUrl: newPostImage ? URL.createObjectURL(newPostImage) : undefined,
      pollOptions: newPostType === 'poll' ? newPollOptions.filter(opt => opt.trim()) : undefined,
      pollVotes: newPostType === 'poll' ? 
        newPollOptions.filter(opt => opt.trim()).reduce((acc, opt) => ({ ...acc, [opt]: 0 }), {}) : 
        undefined,
      upvotes: 0,
      downvotes: 0,
      reposts: 0,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`
      },
      createdAt: new Date()
    };

    setNewsletterPosts(prev => [newPost, ...prev]);
    setShowCreatePost(false);
    setNewPostContent('');
    setNewPostImage(null);
    setNewPollOptions(['', '']);
    setToastMessage({ type: 'success', message: 'Post created successfully!' });
  };

  const addPollOption = () => {
    setNewPollOptions(prev => [...prev, '']);
  };

  const removePollOption = (index: number) => {
    setNewPollOptions(prev => prev.filter((_, i) => i !== index));
  };

  const updatePollOption = (index: number, value: string) => {
    setNewPollOptions(prev => prev.map((opt, i) => i === index ? value : opt));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'high': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'infrastructure': return <AlertTriangle className="w-4 h-4" />;
      case 'academic': return <MessageCircle className="w-4 h-4" />;
      case 'events': return <Calendar className="w-4 h-4" />;
      case 'emergency': return <AlertCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Tab Navigation */}
      <div className="border-b border-zinc-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'text-softgold-500 border-b-2 border-softgold-500 bg-softgold-500/5'
                : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Info
            </div>
          </button>
          <button
            onClick={() => setActiveTab('newsletter')}
            className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
              activeTab === 'newsletter'
                ? 'text-softgold-500 border-b-2 border-softgold-500 bg-softgold-500/5'
                : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Newsletter
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-2">
        {activeTab === 'info' && (
          <div className="space-y-3">
            {/* Info Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Campus Information</h2>
                <p className="text-xs text-zinc-400">Official announcements and updates</p>
              </div>
              {currentUser.isAuthorized && (
                <button className="px-3 py-1.5 bg-softgold-500 hover:bg-softgold-700 text-black text-sm font-medium rounded-lg transition-colors">
                  Create Post
                </button>
              )}
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search info posts..."
                  value={infoSearchQuery}
                  onChange={(e) => setInfoSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-softgold-500/40 text-sm"
                />
              </div>
              
              <div className="flex gap-1.5 flex-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-softgold-500/40 text-sm"
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
                  className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-softgold-500/40 text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Info Posts */}
            {infoLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-softgold-500"></div>
              </div>
            ) : filteredInfoPosts.length === 0 ? (
              <div className="text-center py-8">
                <Info className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">No info posts found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredInfoPosts.map((post) => (
                  <div key={post.id} className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-zinc-700 rounded-lg">
                          {getCategoryIcon(post.category)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">{post.title}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <span>{post.author.name}</span>
                            <span>•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            {post.isPinned && (
                              <>
                                <span>•</span>
                                <Pin className="w-2.5 h-2.5" />
                                <span>Pinned</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(post.priority)}`}>
                          {post.priority}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-zinc-300 mb-3 text-sm">{post.content}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-xs text-zinc-400">{post.likes}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {Object.entries(post.reactions).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              className={`${styles.reactionButton} ${
                                post.userReaction === emoji ? 'bg-softgold-500/20 text-softgold-500' : 'bg-zinc-700 text-zinc-300'
                              }`}
                              onClick={() => handleInfoReaction(post.id, emoji)}
                              disabled={reactionLoading?.postId === post.id && reactionLoading?.emoji === emoji}
                            >
                              <span>{emoji}</span>
                              <span>{count}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {post.tags.map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-zinc-700 text-xs rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'newsletter' && (
          <div className="space-y-3">
            {/* Newsletter Section Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Campus Newsletter</h2>
                <p className="text-xs text-zinc-400">Share messages, images, and polls with the community</p>
              </div>
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-3 py-1.5 bg-softgold-500 hover:bg-softgold-700 text-black text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Post
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search newsletter posts..."
                value={newsletterSearchQuery}
                onChange={(e) => setNewsletterSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-softgold-500/40 text-sm"
              />
            </div>

            {/* Newsletter Posts */}
            {newsletterLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-softgold-500"></div>
              </div>
            ) : filteredNewsletterPosts.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-400 text-sm">No newsletter posts found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNewsletterPosts.map((post) => (
                  <div key={post.id} className="bg-zinc-800 rounded-lg p-3 border border-zinc-700">
                    <div className="flex items-start gap-2 mb-2">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm">{post.author.name}</span>
                          <span className="text-zinc-400 text-xs">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                          {post.type === 'image' && (
                            <Image className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                          {post.type === 'poll' && (
                            <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-zinc-300 mb-3 text-sm">{post.content}</p>
                    
                    {post.type === 'image' && post.imageUrl && (
                      <div className="mb-3">
                        <img
                          src={post.imageUrl}
                          alt="Post image"
                          className="w-full max-w-sm rounded-lg"
                        />
                      </div>
                    )}
                    
                    {post.type === 'poll' && post.pollOptions && (
                      <div className="mb-3 space-y-1.5">
                        {post.pollOptions.map((option) => {
                          const votes = post.pollVotes?.[option] || 0;
                          const totalVotes = Object.values(post.pollVotes || {}).reduce((a, b) => a + b, 0);
                          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                          const isVoted = post.userVote === option;
                          
                          return (
                            <button
                              key={option}
                              onClick={() => handlePollVote(post.id, option)}
                              className={`w-full p-2 rounded-lg border transition-all ${
                                isVoted
                                  ? 'border-softgold-500 bg-softgold-500/10'
                                  : 'border-zinc-600 hover:border-zinc-500 bg-zinc-700/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-left text-sm">{option}</span>
                                <span className="text-xs text-zinc-400">
                                  {votes} votes ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <div className="mt-1.5 w-full bg-zinc-600 rounded-full h-1.5">
                                <div
                                  className="bg-softgold-500 h-1.5 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleNewsletterVote(post.id, 'upvote')}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                            post.userUpvoted
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span className="text-xs">{post.upvotes}</span>
                        </button>
                        
                        <button
                          onClick={() => handleNewsletterVote(post.id, 'downvote')}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                            post.userDownvoted
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                          }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span className="text-xs">{post.downvotes}</span>
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleRepost(post.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                          post.userReposted
                            ? 'bg-softgold-500/20 text-softgold-500'
                            : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                        }`}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="text-xs">{post.reposts}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-full max-w-lg mx-4 bg-zinc-800 rounded-lg p-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">Create Newsletter Post</h3>
              <button
                onClick={() => setShowCreatePost(false)}
                className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Post Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Post Type</label>
                <div className="flex gap-1.5">
                  {[
                    { type: 'message', label: 'Message', icon: MessageCircle },
                    { type: 'image', label: 'Image', icon: Image },
                    { type: 'poll', label: 'Poll', icon: BarChart3 }
                  ].map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => setNewPostType(type as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-sm ${
                        newPostType === type
                          ? 'border-softgold-500 bg-softgold-500/10 text-softgold-500'
                          : 'border-zinc-600 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Content</label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full p-2.5 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-softgold-500/40 resize-none text-sm"
                  rows={3}
                />
              </div>
              
              {/* Image Upload */}
              {newPostType === 'image' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Image</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewPostImage(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-3 border-2 border-dashed border-zinc-600 rounded-lg hover:border-zinc-500 transition-colors flex items-center justify-center gap-1.5 text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    {newPostImage ? newPostImage.name : 'Choose an image'}
                  </button>
                </div>
              )}
              
              {/* Poll Options */}
              {newPostType === 'poll' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Poll Options</label>
                  <div className="space-y-1.5">
                    {newPollOptions.map((option, index) => (
                      <div key={index} className="flex gap-1.5">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 p-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-softgold-500/40 text-sm"
                        />
                        {newPollOptions.length > 2 && (
                          <button
                            onClick={() => removePollOption(index)}
                            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addPollOption}
                      className="w-full p-1.5 border border-zinc-600 rounded-lg hover:border-zinc-500 transition-colors text-zinc-400 text-sm"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="flex-1 px-3 py-1.5 border border-zinc-600 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  className="flex-1 px-3 py-1.5 bg-softgold-500 hover:bg-softgold-700 text-black font-medium rounded-lg transition-colors text-sm"
                >
                  Create Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Message */}
      {toastMessage && (
        <div className={`fixed bottom-3 right-3 z-50 px-3 py-1.5 rounded-lg shadow-lg transition-all text-sm ${
          toastMessage.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {toastMessage.message}
        </div>
      )}

      {/* Reaction Feedback */}
      {reactionFeedback && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 text-4xl animate-bounce">
          {reactionFeedback.emoji}
        </div>
      )}
    </div>
  );
}
