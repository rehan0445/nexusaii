import React, { useState } from 'react';
import { 
  Moon, 
  Bot, 
  Heart, 
  MessageCircle, 
  Bookmark,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { ChatRoom } from '../types/chat';
import UploadPost from './UploadPost';

interface RedesignedHomeScreenProps {
  readonly groups: ChatRoom[];
  readonly onJoinGroup: (group: ChatRoom) => void;
  readonly joiningGroup: string | null;
  readonly onNavigateToView: (view: string) => void;
  readonly onCreatePost: () => void;
}

interface Post {
  id: string;
  author: { name: string; avatar: string; };
  groupName: string;
  content: string;
  hashtags: string[];
  likes: number;
  comments: number;
  views: number;
  createdAt: Date;
  isLiked: boolean;
  isBookmarked: boolean;
  commentsList: Comment[];
  showComments: boolean;
}

interface Comment {
  id: string;
  author: { name: string; avatar: string; };
  content: string;
  likes: number;
  createdAt: Date;
  isLiked: boolean;
  replies: Comment[];
  showReplies: boolean;
}

// Utility function moved outside component
const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

// Extracted CommentInput component
const CommentInput = ({ postId, onAddComment }: { postId: string; onAddComment: (postId: string, content: string) => void }) => {
  const [input, setInput] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAddComment(postId, input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex space-x-3">
        <img src="https://i.pravatar.cc/150?img=10" alt="You" className="w-8 h-8 rounded-full" />
        <div className="flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-[#F4E3B5]"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-2 bg-[#F4E3B5] hover:bg-[#e6d6a8] disabled:bg-zinc-600 disabled:cursor-not-allowed text-black rounded-lg transition-colors"
        >
          Post
        </button>
      </div>
    </form>
  );
};

// Extracted CommentItem component
const CommentItem = ({ comment, postId, depth = 0, parentCommentId, onAddReply, onLikeComment, onToggleReplies }: { 
  comment: Comment; 
  postId: string; 
  depth?: number; 
  parentCommentId?: string;
  onAddReply: (postId: string, commentId: string, content: string) => void;
  onLikeComment: (postId: string, commentId: string, isReply?: boolean, parentCommentId?: string) => void;
  onToggleReplies: (postId: string, commentId: string) => void;
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyInput, setReplyInput] = useState('');

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyInput.trim()) {
      onAddReply(postId, comment.id, replyInput);
      setReplyInput('');
      setShowReplyInput(false);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8' : ''} mb-4`}>
      <div className="flex space-x-3">
        <img src={comment.author.avatar} alt={comment.author.name} className="w-8 h-8 rounded-full" />
        <div className="flex-1">
          <div className="bg-zinc-700 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-white">{comment.author.name}</span>
              <span className="text-zinc-400 text-sm">{formatTimeAgo(comment.createdAt)}</span>
            </div>
            <p className="text-zinc-200 mb-3">{comment.content}</p>
          
            <div className="flex items-center space-x-4 text-sm">
              <button 
                onClick={() => onLikeComment(postId, comment.id, depth > 0, parentCommentId)}
                className={`flex items-center space-x-1 transition-colors ${
                  comment.isLiked 
                    ? 'text-red-400 hover:text-red-300' 
                    : 'text-zinc-400 hover:text-red-400'
                }`}
              >
                <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                <span>{comment.likes}</span>
              </button>
              
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="text-zinc-400 hover:text-blue-400 transition-colors"
              >
                Reply
              </button>
              
              {comment.replies.length > 0 && (
                <button
                  onClick={() => onToggleReplies(postId, comment.id)}
                  className="text-zinc-400 hover:text-purple-400 transition-colors"
                >
                  {comment.showReplies ? 'Hide' : 'Show'} {comment.replies.length} replies
                </button>
              )}
            </div>
          </div>
          
          {/* Reply Input */}
          {showReplyInput && (
            <form onSubmit={handleReplySubmit} className="mt-3">
              <div className="flex space-x-3">
                <img src="https://i.pravatar.cc/150?img=10" alt="You" className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-[#F4E3B5]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!replyInput.trim()}
                  className="px-3 py-2 bg-[#F4E3B5] hover:bg-[#e6d6a8] disabled:bg-zinc-600 disabled:cursor-not-allowed text-black rounded-lg transition-colors text-sm"
                >
                  Reply
                </button>
              </div>
            </form>
          )}

          {/* Replies */}
          {comment.showReplies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  postId={postId} 
                  depth={depth + 1} 
                  parentCommentId={comment.id}
                  onAddReply={onAddReply}
                  onLikeComment={onLikeComment}
                  onToggleReplies={onToggleReplies}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function RedesignedHomeScreen({ 
  groups, 
  onJoinGroup, 
  joiningGroup, 
  onNavigateToView,
  onCreatePost 
}: RedesignedHomeScreenProps) {
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  // Removed showShareModal state as Share feature is removed
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Endless feed state
  const [userInterests, setUserInterests] = useState<string[]>(['Technology', 'Gaming', 'Art']);
  const [feedPage, setFeedPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [feedFilter, setFeedFilter] = useState<'all' | 'following' | 'trending' | 'interests'>('all');
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  React.useEffect(() => {
    const close = () => setOpenMenuPostId(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Helper to handle hashtag clicks
  const handleHashtagClick = (tag: string) => {
    const normalized = tag.replace(/^#/, '');
    if (!userInterests.includes(normalized)) {
      setUserInterests((prev) => [...prev, normalized]);
    }
    setFeedFilter('interests');
  };

  // Debug: Log groups when component mounts or groups change
  React.useEffect(() => {
    console.log('RedesignedHomeScreen groups:', groups);
    console.log('Groups length:', groups?.length || 0);
  }, [groups]);

  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: { name: 'Alex Chen', avatar: 'https://i.pravatar.cc/150?img=1' },
      groupName: 'Creative Minds',
      content: 'Just finished my latest digital art piece! The creative process was absolutely mind-blowing 🎨✨',
      hashtags: ['#DigitalArt', '#Creative', '#Inspiration'],
      likes: 127,
      comments: 23,
      views: 892,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isLiked: false,
      isBookmarked: false,
      commentsList: [
        {
          id: 'c1',
          author: { name: 'Sarah Wilson', avatar: 'https://i.pravatar.cc/150?img=4' },
          content: 'This is absolutely stunning! The color palette is perfect 🎨',
          likes: 12,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          isLiked: false,
          replies: [
            {
              id: 'r1',
              author: { name: 'Alex Chen', avatar: 'https://i.pravatar.cc/150?img=1' },
              content: 'Thank you Sarah! I spent hours on the color selection 😊',
              likes: 5,
              createdAt: new Date(Date.now() - 30 * 60 * 1000),
              isLiked: false,
              replies: [],
              showReplies: false
            }
          ],
          showReplies: false
        },
        {
          id: 'c2',
          author: { name: 'Mike Johnson', avatar: 'https://i.pravatar.cc/150?img=5' },
          content: 'What software did you use? The details are incredible!',
          likes: 8,
          createdAt: new Date(Date.now() - 45 * 60 * 1000),
          isLiked: false,
          replies: [],
          showReplies: false
        }
      ],
      showComments: false
    },
    {
      id: '2',
      author: { name: 'Maya Rodriguez', avatar: 'https://i.pravatar.cc/150?img=2' },
      groupName: 'Tech Enthusiasts',
      content: 'Anyone else excited about the new AI developments? The possibilities are endless! 🤖',
      hashtags: ['#AI', '#Technology', '#Future'],
      likes: 89,
      comments: 45,
      views: 567,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isLiked: false,
      isBookmarked: false,
      commentsList: [
        {
          id: 'c3',
          author: { name: 'David Kim', avatar: 'https://i.pravatar.cc/150?img=6' },
          content: 'The GPT-4 updates are game-changing! Can\'t wait to see what\'s next.',
          likes: 15,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          isLiked: false,
          replies: [],
          showReplies: false
        }
      ],
      showComments: false
    },
    {
      id: '3',
      author: { name: 'Jordan Kim', avatar: 'https://i.pravatar.cc/150?img=3' },
      groupName: 'Gaming Community',
      content: 'Finally reached Diamond rank in my favorite game! The grind was real 💎',
      hashtags: ['#Gaming', '#Achievement', '#Diamond'],
      likes: 203,
      comments: 67,
      views: 1245,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      isLiked: false,
      isBookmarked: false,
      commentsList: [],
      showComments: false
    }
  ]);

  const featuredItems = [
    {
      id: 'darkroom',
      title: 'Dark Room',
      description: 'Anonymous chat where identities fade into the digital void',
      icon: Moon,
      gradient: 'from-green-800 via-green-700 to-green-600',
      glow: 'shadow-green-500/50',
      action: () => onNavigateToView('darkroom'),
      cta: 'Enter Room'
    },
    {
      id: 'trending',
      title: 'Trending Group Chat',
      description: 'Join the hottest conversations happening right now',
      icon: TrendingUp,
      glow: 'shadow-red-500/50',
      action: () => onNavigateToView('trending'),
      cta: 'Join Chat',
      image: 'https://chatgpt.com/s/m_6888fe40dd8081919c32501dc0969d2f'
    },
    {
      id: 'hinata-ai',
      title: 'Connect with Hinata',
      description: 'Meet Hinata, your AI companion. Experience conversations that feel real, meaningful, and uniquely personal.',
      icon: Bot,
      gradient: 'from-pink-500 via-purple-500 to-purple-600',
      glow: 'shadow-pink-500/50',
      action: () => onNavigateToView('ai-chat'),
      cta: 'Start Chat with Hinata'
    }
  ];

  // Helper functions to extract nested ternary operations
  const getButtonClassName = (itemId: string) => {
    if (itemId === 'darkroom') {
      return 'bg-green-600 hover:bg-green-700';
    }
    if (itemId === 'trending') {
      return 'bg-red-600 hover:bg-red-700';
    }
    return 'bg-pink-500 hover:bg-pink-600';
  };

  const getIconGradient = (itemId: string) => {
    if (itemId === 'darkroom') {
      return 'from-green-600 to-green-800';
    }
    if (itemId === 'trending') {
      return 'from-red-500 to-pink-600';
    }
    return 'from-pink-400 to-purple-600';
  };

  const getIconAnimation = (itemId: string) => {
    if (itemId === 'darkroom') {
      return 'moon-glow';
    }
    if (itemId === 'hinata-ai') {
      return 'animate-pulse';
    }
    return '';
  };

  // Helper functions for badge styling
  const getBadgeClassName = (itemId: string) => {
    if (itemId === 'darkroom') return 'bg-green-600';
    if (itemId === 'trending') return 'bg-red-500';
    return 'hidden';
  };

  const getBadgeText = (itemId: string) => {
    if (itemId === 'darkroom') return 'ANONYMOUS';
    if (itemId === 'trending') return 'TRENDING';
    return '';
  };

  const getDescriptionClassName = (itemId: string) => {
    return itemId === 'hinata-ai' ? 'hidden' : '';
  };

  const handleLike = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked, 
              likes: post.isLiked ? post.likes - 1 : post.likes + 1 
            }
          : post
      )
    );
  };

  const handleHidePost = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
  };

  const handleComment = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, showComments: !post.showComments }
          : post
      )
    );
  };

  const handleAddComment = (postId: string, content: string) => {
    if (!content.trim()) return;
    
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: { name: 'You', avatar: 'https://i.pravatar.cc/150?img=10' },
      content: content.trim(),
      likes: 0,
      createdAt: new Date(),
      isLiked: false,
      replies: [],
      showReplies: false
    };

    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              commentsList: [newComment, ...post.commentsList],
              comments: post.comments + 1
            }
          : post
      )
    );
  };

  const handleAddReply = (postId: string, commentId: string, content: string) => {
    if (!content.trim()) return;
    
    const newReply: Comment = {
      id: `reply-${Date.now()}`,
      author: { name: 'You', avatar: 'https://i.pravatar.cc/150?img=10' },
      content: content.trim(),
      likes: 0,
      createdAt: new Date(),
      isLiked: false,
      replies: [],
      showReplies: false
    };

    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? {
              ...post,
              commentsList: post.commentsList.map(comment =>
                comment.id === commentId
                  ? { ...comment, replies: [...comment.replies, newReply] }
                  : comment
              )
            }
          : post
      )
    );
  };

  const handleLikeComment = (postId: string, commentId: string, isReply = false, parentCommentId?: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? {
              ...post,
              commentsList: post.commentsList.map(comment => {
                if (isReply && parentCommentId && comment.id === parentCommentId) {
                  // This is a reply to a comment
                  return {
                    ...comment,
                    replies: comment.replies.map(reply =>
                      reply.id === commentId
                        ? { 
                            ...reply, 
                            isLiked: !reply.isLiked,
                            likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1
                          }
                        : reply
                    )
                  };
                } else if (comment.id === commentId) {
                  // This is a top-level comment
                  return { 
                    ...comment, 
                    isLiked: !comment.isLiked,
                    likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
                  };
                }
                return comment;
              })
            }
          : post
      )
    );
  };

  const toggleReplies = (postId: string, commentId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? {
              ...post,
              commentsList: post.commentsList.map(comment =>
                comment.id === commentId
                  ? { ...comment, showReplies: !comment.showReplies }
                  : comment
              )
            }
          : post
      )
    );
  };

  // Removed Share handlers and helpers

  const handleBookmark = (postId: string) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, isBookmarked: !post.isBookmarked }
          : post
      )
    );
  };

  const handlePostCreated = (newPost: any) => {
    console.log('🎉 New post created:', newPost);
    console.log('📝 Adding post to feed...');
    
    // Transform the post data to match the expected format
    const transformedPost: Post = {
      id: newPost.id,
      author: {
        name: newPost.author.name,
        avatar: newPost.author.avatar
      },
      groupName: newPost.community || 'General',
      content: newPost.content,
      hashtags: [],
      likes: 0,
      comments: 0,
      views: 0,
      createdAt: new Date(),
      isLiked: false,
      isBookmarked: false,
      commentsList: [],
      showComments: false
    };
    
    // Add the new post to the beginning of the posts array
    setPosts(prevPosts => {
      const updatedPosts = [transformedPost, ...prevPosts];
      console.log('📊 Updated posts array:', updatedPosts);
      return updatedPosts;
    });
    
    console.log('✅ Post added to feed successfully!');
  };

  const handleCreatePost = () => {
    setIsUploadOpen(true);
  };

  // Generate more posts for endless feed
  const generateMorePosts = (page: number, interests: string[]) => {
    const postsPerPage = 5;
    const newPosts: Post[] = [];
    
    for (let i = 0; i < postsPerPage; i++) {
      const postId = `generated_${page}_${i}`;
      const interest = interests[Math.floor(Math.random() * interests.length)];
      
      const samplePosts = [
        {
          content: `Just discovered an amazing new ${interest.toLowerCase()} technique! The possibilities are endless 🚀`,
          hashtags: [`#${interest}`, '#Innovation', '#Discovery']
        },
        {
          content: `Working on a new ${interest.toLowerCase()} project. Can't wait to share the results! 💡`,
          hashtags: [`#${interest}`, '#Project', '#Creative']
        },
        {
          content: `Anyone else passionate about ${interest.toLowerCase()}? Let's connect and share ideas! 🤝`,
          hashtags: [`#${interest}`, '#Community', '#Networking']
        },
        {
          content: `The future of ${interest.toLowerCase()} is looking bright! What are your thoughts? 🔮`,
          hashtags: [`#${interest}`, '#Future', '#Trends']
        },
        {
          content: `Just finished a deep dive into ${interest.toLowerCase()}. Mind = blown! 🤯`,
          hashtags: [`#${interest}`, '#Learning', '#Insights']
        }
      ];
      
      const randomPost = samplePosts[Math.floor(Math.random() * samplePosts.length)];
      const randomAuthor = [
        { name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?img=7' },
        { name: 'Mike Rodriguez', avatar: 'https://i.pravatar.cc/150?img=8' },
        { name: 'Emma Wilson', avatar: 'https://i.pravatar.cc/150?img=9' },
        { name: 'David Kim', avatar: 'https://i.pravatar.cc/150?img=10' },
        { name: 'Lisa Thompson', avatar: 'https://i.pravatar.cc/150?img=11' }
      ][Math.floor(Math.random() * 5)];
      
      newPosts.push({
        id: postId,
        author: randomAuthor,
        groupName: `${interest} Enthusiasts`,
        content: randomPost.content,
        hashtags: randomPost.hashtags,
        likes: Math.floor(Math.random() * 200) + 10,
        comments: Math.floor(Math.random() * 50) + 5,
        views: Math.floor(Math.random() * 1000) + 100,
        createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24 hours
        isLiked: false,
        isBookmarked: false,
        commentsList: [],
        showComments: false
      });
    }
    
    return newPosts;
  };

  // Load more posts for endless feed
  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMorePosts) return;
    
    setIsLoadingMore(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPosts = generateMorePosts(feedPage + 1, userInterests);
      
      setPosts(prevPosts => [...prevPosts, ...newPosts]);
      setFeedPage(prev => prev + 1);
      
      // Stop loading more after 10 pages (50 posts)
      if (feedPage >= 10) {
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filter posts based on user interests and current filter
  const getFilteredPosts = () => {
    let filteredPosts = [...posts];
    
    switch (feedFilter) {
      case 'interests':
        // Filter posts that contain user interests in hashtags or content
        filteredPosts = posts.filter(post => 
          userInterests.some(interest => 
            post.hashtags.some(tag => tag.toLowerCase().includes(interest.toLowerCase())) ||
            post.content.toLowerCase().includes(interest.toLowerCase()) ||
            post.groupName.toLowerCase().includes(interest.toLowerCase())
          )
        );
        break;
      case 'trending':
        // Sort by likes and views (trending posts)
        filteredPosts = [...posts].sort((a: Post, b: Post) => (b.likes + b.views) - (a.likes + a.views));
        break;
      case 'following': {
        // For now, show posts from specific authors (simulating following)
        const followingAuthors = ['Alex Chen', 'Maya Rodriguez', 'Jordan Kim'];
        filteredPosts = posts.filter(post => followingAuthors.includes(post.author.name));
        break;
      }
      default:
        // 'all' - show all posts
        break;
    }
    
    return filteredPosts;
  };

  // Infinite scroll detection
  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
      loadMorePosts();
    }
  };

  // Add scroll listener
  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [feedPage, isLoadingMore, hasMorePosts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Section 1: Featured Carousel */}
        <section className="mb-12">
          {/* Single Card Carousel - Landscape Format */}
          <div className="relative">
            <div className="relative w-full h-80 bg-zinc-800/80 border border-zinc-700 rounded-xl overflow-hidden hover:border-[#F4E3B5]/30 transition-all duration-300 group cursor-pointer">
              {(() => {
                const currentItem = featuredItems[currentCarouselIndex];
                return (
                  <>
                    {/* Background with Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${currentItem.gradient}`}>
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]"></div>
                      </div>
                    </div>

                    {/* Content Layout */}
                    <button
                      className="relative z-10 h-full flex w-full text-left"
                      onClick={currentItem.action}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          currentItem.action();
                        }
                      }}
                      aria-label={`Navigate to ${currentItem.title}`}
                    >
                      {/* Left Side - Content */}
                      <div className="flex-1 flex flex-col justify-center p-8">
                        {/* Badge */}
                        <div className="mb-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${getBadgeClassName(currentItem.id)}`}>
                            {getBadgeText(currentItem.id)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-4xl font-bold text-white mb-4 group-hover:text-gold transition-colors">
                          {currentItem.title}
                        </h3>
                        
                        {/* Description */}
                        <p className={`text-xl text-zinc-200 mb-6 max-w-md leading-relaxed ${getDescriptionClassName(currentItem.id)}`}>
                          {currentItem.description}
                        </p>

                        {/* Special indicators for Dark Room, Campus, and Hinata */}
                        {currentItem.id === 'darkroom' && (
                          <div className="mb-6">
                            <div className="flex items-center space-x-3 text-lg">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-green-300 font-medium">Anonymous Mode</span>
                            </div>
                          </div>
                        )}
                        {currentItem.id === 'hinata-ai' && (
                          <div className="mb-6">
                            <div className="flex items-center space-x-3 text-lg mb-3">
                              <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" />
                              <span className="text-pink-200 font-medium">AI Companion</span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-pink-100">
                              <span>✨ Intelligent</span>
                              <span>🤖 24/7</span>
                              <span>💜 Personal</span>
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            currentItem.action();
                          }}
                          className={`w-fit px-8 py-3 ${getButtonClassName(currentItem.id)} text-white font-medium rounded-lg transition-colors flex items-center space-x-2 group-hover:scale-105`}
                        >
                          <span className="text-lg">
                            {currentItem.cta}
                          </span>
                        </button>
                      </div>

                      {/* Right Side - Icon */}
                      <div className="flex-1 flex items-center justify-center">
                        <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getIconGradient(currentItem.id)} flex items-center justify-center text-6xl font-bold text-white shadow-2xl ${getIconAnimation(currentItem.id)}`}>
                          <currentItem.icon className="w-16 h-16" />
                        </div>
                      </div>
                    </button>

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/20 via-transparent to-transparent pointer-events-none" />
                  </>
                );
              })()}
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center mt-6 space-x-3">
              {featuredItems.map((item, index) => (
                <button
                  key={`slide-${item.id}-${index}`}
                  onClick={() => setCurrentCarouselIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentCarouselIndex 
                      ? 'bg-[#F4E3B5] w-8' 
                      : 'bg-zinc-600 hover:bg-zinc-500'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Slide Counter */}
            <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white">
              {currentCarouselIndex + 1} / {featuredItems.length}
            </div>
          </div>
        </section>

        {/* Section 2: Feed Preview */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Feed</h2>
            <button onClick={handleCreatePost} className="px-4 py-2 bg-[#F4E3B5] hover:bg-[#e6d6a8] text-black font-medium rounded-lg transition-colors">
              Create Post
            </button>
          </div>

          {/* Feed filter buttons removed */}

          {/* User Interests Display */}
          {feedFilter === 'interests' && (
            <div className="mb-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">Your Interests:</h3>
              <div className="flex flex-wrap gap-2">
                {userInterests.map((interest, index) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-[#F4E3B5]/20 text-[#F4E3B5] text-sm rounded-full border border-[#F4E3B5]/30"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {getFilteredPosts().map((post) => (
              <div key={post.id} className={`bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 hover:border-[#F4E3B5]/30 transition-all duration-300 group animate-fade-in-up hover-lift`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img src={post.author.avatar} alt={post.author.name} className="w-[52px] h-[52px] rounded-full object-cover" />
                    <div>
                      <h4 className="font-bold text-white leading-tight">{post.author.name}</h4>
                      <div className="text-sm text-zinc-400">{post.groupName}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 text-sm relative">
                    <span className="text-[#666666]">{formatTimeAgo(post.createdAt)}</span>
                    <button
                      type="button"
                      className="px-2 py-1 rounded hover:bg-zinc-700/50 text-[#666666]"
                      aria-label="More options"
                      title="More options"
                      onClick={(e) => { e.stopPropagation(); setOpenMenuPostId((id) => id === post.id ? null : post.id); }}
                      aria-haspopup="menu"
                      aria-expanded={openMenuPostId === post.id}
                    >
                      ⋮
                    </button>

                    {openMenuPostId === post.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        role="menu"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setOpenMenuPostId(null);
                          }
                        }}
                        className="absolute right-0 top-full mt-2 w-44 bg-zinc-800/95 border border-zinc-700 rounded-lg shadow-xl z-50 overflow-hidden"
                      >
                        <button
                          role="menuitem"
                          onClick={() => { setOpenMenuPostId(null); handleHidePost(post.id); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setOpenMenuPostId(null);
                              handleHidePost(post.id);
                            }
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700/60 focus:bg-zinc-700/60 focus:outline-none"
                        >
                          Hide this post
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-zinc-200 mb-3 leading-relaxed">{post.content}</p>

                {/* Hashtags */}
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {post.hashtags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleHashtagClick(tag)}
                        className="text-blue-400 hover:underline"
                        title={`View posts tagged ${tag}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-6">
                    {/* Reply */}
                    <button 
                      onClick={() => handleComment(post.id)}
                      className="flex items-center space-x-2 text-[#666666] hover:text-white transition-colors"
                      title="Reply"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.comments}</span>
                    </button>

                    {/* Views */}
                    <div className="flex items-center space-x-2 text-[#666666]">
                      <BarChart3 className="w-5 h-5" />
                      <span className="text-sm">{post.views}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Like */}
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center space-x-2 transition-colors ${
                        post.isLiked 
                          ? 'text-red-500' 
                          : 'text-[#666666] hover:text-red-400'
                      }`}
                      title="Like"
                    >
                      <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm">{post.likes}</span>
                    </button>

                    {/* Bookmark */}
                    <button 
                      onClick={() => handleBookmark(post.id)}
                      className={`flex items-center space-x-2 transition-colors ${
                        post.isBookmarked 
                          ? 'text-blue-500' 
                          : 'text-[#666666] hover:text-blue-400'
                      }`}
                      title={post.isBookmarked ? 'Saved' : 'Save'}
                    >
                      <Bookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {post.showComments && (
                  <div className="mt-6">
                    <h4 className="text-lg font-bold text-white mb-4">Comments</h4>
                    <CommentInput postId={post.id} onAddComment={handleAddComment} />
                    <div className="space-y-4">
                      {post.commentsList.map((comment) => (
                        <CommentItem 
                          key={comment.id} 
                          comment={comment} 
                          postId={post.id}
                          onAddReply={handleAddReply}
                          onLikeComment={handleLikeComment}
                          onToggleReplies={toggleReplies}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading More Indicator */}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F4E3B5]"></div>
                <span className="ml-3 text-zinc-400">Loading more posts...</span>
              </div>
            )}

            {/* End of Feed Indicator */}
            {!hasMorePosts && getFilteredPosts().length > 0 && (
              <div className="text-center py-8 text-zinc-400">
                <p>You've reached the end of your feed!</p>
                <p className="text-sm mt-2">Check back later for more content.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Share feature removed */}

      {/* Upload Post Modal */}
      <UploadPost
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
} 