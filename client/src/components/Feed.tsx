import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageSquare, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  TrendingUp, 
  Users, 
  BarChart3,
  Link,
  Image,
  FileText,
  EyeOff,
  Clock
} from 'lucide-react';
import { ChatRoom } from '../types/chat';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  id: string;
  type: 'text' | 'image' | 'poll' | 'link';
  content: string;
  tags: string[];
  isAnonymous: boolean;
  community: string;
  createdAt: Date;
  likes: number;
  views: number;
  comments: number;
  trending: number;
  pollOptions?: string[];
  imageUrl?: string;
  linkUrl?: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  userVote?: 'up' | 'down' | null;
  pollVotes?: Record<string, string>;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: Date;
  likes: number;
  isAnonymous: boolean;
  replies?: Comment[];
  parentId?: string;
  isReply?: boolean;
}

interface FeedProps {
  followedGroups: ChatRoom[];
  trendingGroups: ChatRoom[];
  onJoinGroup: (group: ChatRoom) => void;
  joiningGroup: string | null;
  newPosts?: Post[];
}

export default function Feed({ followedGroups, trendingGroups, onJoinGroup, joiningGroup, newPosts = [] }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState('');
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; authorName: string } | null>(null);
  const [showReplies, setShowReplies] = useState<Set<string>>(new Set());
  const loadingRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  // Get current user info safely
  const getCurrentUserInfo = () => {
    if (currentUser) {
      return {
        id: currentUser.uid,
        name: currentUser.displayName || 'Anonymous User',
        avatar: currentUser.photoURL || 'https://i.pravatar.cc/150?u=current'
      };
    }
    return {
      id: 'anonymous-user',
      name: 'Anonymous User',
      avatar: 'https://i.pravatar.cc/150?u=anonymous'
    };
  };

  // Debug logging for user authentication
  useEffect(() => {
    console.log('🔐 Feed component - Current user:', currentUser);
    console.log('👤 User info:', getCurrentUserInfo());
  }, [currentUser]);

  // Generate sample posts from groups
  const generatePosts = (groups: ChatRoom[], type: 'followed' | 'trending' | 'suggested'): Post[] => {
    return groups.slice(0, 3).map((group, index) => {
      const hasImage = Math.random() > 0.7;
      const hasVideo = !hasImage && Math.random() > 0.8;
      const postType = hasImage ? 'image' : hasVideo ? 'link' : Math.random() > 0.8 ? 'poll' : 'text';
      
      const post: Post = {
        id: `${type}_post_${group.id}_${index}`,
        type: postType,
        content: [
          `Just discovered this amazing ${group.category} community! The discussions here are incredible.`,
          `Anyone else excited about the latest developments in ${group.category}?`,
          `Sharing some thoughts on ${group.category} trends. What do you think?`,
          `This ${group.category} group has been so helpful for learning new things!`,
          `Interesting discussion happening in ${group.category}. Join the conversation!`
        ][Math.floor(Math.random() * 5)],
        tags: [group.category, 'community', 'discussion'],
        isAnonymous: Math.random() > 0.7,
        community: group.name,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        likes: Math.floor(Math.random() * 500) + 10,
        views: Math.floor(Math.random() * 2000) + 50,
        comments: Math.floor(Math.random() * 100) + 5,
        trending: Math.floor(Math.random() * 10) + 1,
        pollOptions: postType === 'poll' ? ['Option 1', 'Option 2', 'Option 3'] : undefined,
        imageUrl: postType === 'image' ? `https://picsum.photos/400/300?random=${Math.random()}` : undefined,
        linkUrl: postType === 'link' ? 'https://example.com' : undefined,
        author: {
          id: `user_${Math.random()}`,
          name: Math.random() > 0.7 ? 'Anonymous User' : `User${Math.floor(Math.random() * 1000)}`,
          avatar: Math.random() > 0.7 ? '/anonymous-avatar.png' : `https://i.pravatar.cc/150?u=${Math.random()}`
        }
      };
      
      return post;
    });
  };

  // Load initial posts
  useEffect(() => {
    console.log('🔄 Feed: Loading initial posts...');
    console.log('📥 Feed: Received newPosts:', newPosts);
    
    const initialPosts = [
      ...generatePosts(followedGroups, 'followed'),
      ...generatePosts(trendingGroups, 'trending'),
      ...newPosts,
      // Add a test post to verify functionality
      {
        id: 'test_post_1',
        type: 'text' as const,
        content: 'This is a test text post to verify the upload functionality is working correctly!',
        tags: ['Technology', 'Test'],
        isAnonymous: false,
        community: 'General',
        createdAt: new Date(),
        likes: 15,
        views: 120,
        comments: 8,
        trending: 7,
        author: {
          id: 'test_user',
          name: 'Test User',
          avatar: 'https://i.pravatar.cc/150?u=test'
        }
      },
      {
        id: 'test_post_2',
        type: 'poll' as const,
        content: 'What\'s your favorite programming language?',
        tags: ['Technology', 'Programming'],
        isAnonymous: true,
        community: 'General',
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        likes: 25,
        views: 200,
        comments: 12,
        trending: 8,
        pollOptions: ['JavaScript', 'Python', 'TypeScript', 'Rust'],
        author: {
          id: 'anonymous_user',
          name: 'Anonymous User',
          avatar: '/anonymous-avatar.png'
        }
      },
      {
        id: 'test_post_3',
        type: 'link' as const,
        content: 'Check out this amazing resource for learning React!',
        tags: ['Technology', 'Education'],
        isAnonymous: false,
        community: 'General',
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        likes: 30,
        views: 150,
        comments: 5,
        trending: 9,
        linkUrl: 'https://react.dev',
        author: {
          id: 'dev_user',
          name: 'React Developer',
          avatar: 'https://i.pravatar.cc/150?u=react'
        }
      }
    ];
    
    console.log('📋 Feed: Total initial posts:', initialPosts.length);
    console.log('📋 Feed: New posts included:', newPosts.length);
    
    // Sort by trending score and engagement
    const sortedPosts = initialPosts.sort((a, b) => {
      const scoreA = (a.trending * 0.4) + (a.likes * 0.3) + (a.views * 0.2) + (a.comments * 0.1);
      const scoreB = (b.trending * 0.4) + (b.likes * 0.3) + (b.views * 0.2) + (b.comments * 0.1);
      return scoreB - scoreA;
    });
    
    console.log('📊 Feed: Setting posts with sorting applied');
    setPosts(sortedPosts);
  }, [followedGroups, trendingGroups, newPosts]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [loading, hasMore]);

  const loadMorePosts = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const morePosts = [
      ...generatePosts(followedGroups, 'followed'),
      ...generatePosts(trendingGroups, 'trending')
    ];
    
    setPosts(prev => [...prev, ...morePosts]);
    setLoading(false);
    
    // Stop loading more after 5 pages
    if (posts.length > 50) {
      setHasMore(false);
    }
  };

  const handleVote = (postId: string, vote: 'up' | 'down') => {
    console.log(`🗳️ Voting ${vote} on post ${postId}`);
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const currentVote = post.userVote;
        let newLikes = post.likes;
        
        if (currentVote === vote) {
          // Remove vote
          newLikes = vote === 'up' ? post.likes - 1 : post.likes + 1;
          console.log(`🗑️ Removed ${vote} vote, new likes: ${newLikes}`);
          return { ...post, likes: newLikes, userVote: null };
        } else if (currentVote) {
          // Change vote
          newLikes = vote === 'up' ? post.likes + 1 : post.likes - 1;
          console.log(`🔄 Changed vote to ${vote}, new likes: ${newLikes}`);
        } else {
          // New vote
          newLikes = vote === 'up' ? post.likes + 1 : post.likes - 1;
          console.log(`✅ New ${vote} vote, new likes: ${newLikes}`);
        }
        
        return { ...post, likes: newLikes, userVote: vote };
      }
      return post;
    }));
  };

  const handleComment = (postId: string) => {
    console.log(`💬 Toggling comments for post ${postId}`);
    
    // If comments are not loaded yet, generate sample comments
    if (!postComments[postId]) {
      const sampleComments: Comment[] = [
        {
          id: `comment_1_${postId}`,
          content: "Great post! Thanks for sharing this information.",
          author: {
            id: 'user_1',
            name: 'John Doe',
            avatar: 'https://i.pravatar.cc/150?u=john'
          },
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
          likes: 5,
          isAnonymous: false,
          replies: [
            {
              id: `reply_1_1_${postId}`,
              content: "I totally agree! This is really helpful.",
              author: {
                id: 'user_4',
                name: 'Alice Johnson',
                avatar: 'https://i.pravatar.cc/150?u=alice'
              },
              createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
              likes: 2,
              isAnonymous: false,
              parentId: `comment_1_${postId}`,
              isReply: true
            },
            {
              id: `reply_1_2_${postId}`,
              content: "Thanks John! I'm glad you found it useful.",
              author: {
                id: 'user_5',
                name: 'Mike Wilson',
                avatar: 'https://i.pravatar.cc/150?u=mike'
              },
              createdAt: new Date(Date.now() - 900000), // 15 minutes ago
              likes: 1,
              isAnonymous: false,
              parentId: `comment_1_${postId}`,
              isReply: true
            }
          ]
        },
        {
          id: `comment_2_${postId}`,
          content: "I completely agree with your point of view.",
          author: {
            id: 'user_2',
            name: 'Anonymous User',
            avatar: '/anonymous-avatar.png'
          },
          createdAt: new Date(Date.now() - 7200000), // 2 hours ago
          likes: 3,
          isAnonymous: true,
          replies: [
            {
              id: `reply_2_1_${postId}`,
              content: "Even though you're anonymous, I appreciate your input!",
              author: {
                id: 'user_6',
                name: 'Sarah Smith',
                avatar: 'https://i.pravatar.cc/150?u=sarah'
              },
              createdAt: new Date(Date.now() - 3600000), // 1 hour ago
              likes: 4,
              isAnonymous: false,
              parentId: `comment_2_${postId}`,
              isReply: true
            }
          ]
        },
        {
          id: `comment_3_${postId}`,
          content: "This is really helpful! I learned something new today.",
          author: {
            id: 'user_3',
            name: 'Sarah Smith',
            avatar: 'https://i.pravatar.cc/150?u=sarah'
          },
          createdAt: new Date(Date.now() - 10800000), // 3 hours ago
          likes: 7,
          isAnonymous: false,
          replies: []
        }
      ];
      
      setPostComments(prev => ({
        ...prev,
        [postId]: sampleComments
      }));
    }
    
    // Toggle expanded state
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
        console.log(`👁️ Hiding comments for post ${postId}`);
      } else {
        newSet.add(postId);
        console.log(`👁️ Showing comments for post ${postId}`);
      }
      return newSet;
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !commentingPostId) {
      console.log('❌ Cannot add comment: missing data', { newComment: newComment.trim(), commentingPostId });
      return;
    }
    
    console.log(`💬 Adding comment to post ${commentingPostId}: "${newComment.trim()}"`);
    
    const userInfo = getCurrentUserInfo();
    const newCommentObj: Comment = {
      id: `comment_${Date.now()}_${commentingPostId}`,
      content: newComment.trim(),
      author: userInfo,
      createdAt: new Date(),
      likes: 0,
      isAnonymous: false,
      replies: []
    };
    
    console.log('📝 New comment object:', newCommentObj);
    
    // Add comment to the post
    setPostComments(prev => {
      const currentComments = prev[commentingPostId] || [];
      console.log('📋 Current comments for post:', currentComments.length);
      
      const updatedComments = [newCommentObj, ...currentComments];
      console.log('📋 Updated comments count:', updatedComments.length);
      
      return {
        ...prev,
        [commentingPostId]: updatedComments
      };
    });
    
    // Update the post's comment count
    setPosts(prev => prev.map(post => {
      if (post.id === commentingPostId) {
        console.log(`📊 Updating comment count for post ${post.id}: ${post.comments} -> ${post.comments + 1}`);
        return { ...post, comments: post.comments + 1 };
      }
      return post;
    }));
    
    setNewComment('');
    setNotification({ message: 'Comment added successfully!', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
    setCommentingPostId(null); // Close comment input
    setReplyingTo(null); // Clear reply state
    
    console.log('✅ Comment added successfully');
  };

  const handleReply = (commentId: string, authorName: string) => {
    console.log(`💬 Starting reply to comment ${commentId} by ${authorName}`);
    setReplyingTo({ commentId, authorName });
    
    // Extract postId from commentId - handle both main comments and replies
    let postId: string;
    if (commentId.includes('reply_')) {
      // For replies, extract postId from the reply ID structure
      const parts = commentId.split('_');
      postId = parts[parts.length - 1]; // Get the last part which should be postId
    } else {
      // For main comments, extract postId from comment ID structure
      const parts = commentId.split('_');
      postId = parts[parts.length - 1]; // Get the last part which should be postId
    }
    
    console.log(`📝 Setting commenting post ID: ${postId}`);
    setCommentingPostId(postId);
    
    // Ensure comments are expanded when replying
    if (!expandedComments.has(postId)) {
      setExpandedComments(prev => new Set([...prev, postId]));
    }
    
    // Ensure replies are shown when replying
    if (!showReplies.has(commentId)) {
      setShowReplies(prev => new Set([...prev, commentId]));
    }
  };

  const handleAddReply = () => {
    if (!newComment.trim() || !replyingTo || !commentingPostId) {
      console.log('❌ Cannot add reply: missing data', { newComment: newComment.trim(), replyingTo, commentingPostId });
      return;
    }
    
    console.log(`💬 Adding reply to comment ${replyingTo.commentId} in post ${commentingPostId}`);
    
    const userInfo = getCurrentUserInfo();
    const newReplyObj: Comment = {
      id: `reply_${Date.now()}_${replyingTo.commentId}`,
      content: newComment.trim(),
      author: userInfo,
      createdAt: new Date(),
      likes: 0,
      isAnonymous: false,
      parentId: replyingTo.commentId,
      isReply: true
    };
    
    console.log('📝 New reply object:', newReplyObj);
    
    // Add reply to the specific comment
    setPostComments(prev => {
      const currentComments = prev[commentingPostId] || [];
      console.log('📋 Current comments for post:', currentComments.length);
      
      const updatedComments = currentComments.map(comment => {
        if (comment.id === replyingTo.commentId) {
          console.log(`✅ Found comment to reply to: ${comment.id}`);
          const updatedReplies = [...(comment.replies || []), newReplyObj];
          console.log(`📝 Updated replies count: ${updatedReplies.length}`);
          return {
            ...comment,
            replies: updatedReplies
          };
        }
        return comment;
      });
      
      console.log('📋 Updated comments:', updatedComments.length);
      
      return {
        ...prev,
        [commentingPostId]: updatedComments
      };
    });
    
    // Update the post's comment count
    setPosts(prev => prev.map(post => {
      if (post.id === commentingPostId) {
        console.log(`📊 Updating comment count for post ${post.id}: ${post.comments} -> ${post.comments + 1}`);
        return { ...post, comments: post.comments + 1 };
      }
      return post;
    }));
    
    setNewComment('');
    setNotification({ message: 'Reply added successfully!', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
    setReplyingTo(null);
    setCommentingPostId(null);
    
    console.log('✅ Reply added successfully');
  };

  const handleToggleReplies = (commentId: string) => {
    console.log(`🔄 Toggling replies for comment ${commentId}`);
    setShowReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
        console.log(`👁️ Hiding replies for comment ${commentId}`);
      } else {
        newSet.add(commentId);
        console.log(`👁️ Showing replies for comment ${commentId}`);
      }
      return newSet;
    });
  };

  const handleLikeComment = (commentId: string, postId: string) => {
    console.log(`❤️ Liking comment/reply ${commentId} in post ${postId}`);
    
    setPostComments(prev => {
      const currentComments = prev[postId] || [];
      
      const updatedComments = currentComments.map(comment => {
        // Check if this is the main comment being liked
        if (comment.id === commentId) {
          console.log(`✅ Found main comment to like: ${comment.id}`);
          const newLikes = comment.likes + 1;
          console.log(`📊 Updated likes: ${comment.likes} -> ${newLikes}`);
          return { ...comment, likes: newLikes };
        }
        
        // Check if this is a reply being liked
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => {
            if (reply.id === commentId) {
              console.log(`✅ Found reply to like: ${reply.id}`);
              const newLikes = reply.likes + 1;
              console.log(`📊 Updated reply likes: ${reply.likes} -> ${newLikes}`);
              return { ...reply, likes: newLikes };
            }
            return reply;
          });
          
          // Only update if replies were actually changed
          if (JSON.stringify(updatedReplies) !== JSON.stringify(comment.replies)) {
            return { ...comment, replies: updatedReplies };
          }
        }
        
        return comment;
      });
      
      return {
        ...prev,
        [postId]: updatedComments
      };
    });
    
    // Show success notification
    setNotification({ message: 'Like added successfully!', type: 'success' });
    setTimeout(() => setNotification(null), 2000);
    
    console.log(`✅ Like added to comment/reply ${commentId}`);
  };

  const handleCloseCommentModal = () => {
    setCommentingPostId(null);
    setNewComment('');
  };

  const handleAddCommentClick = (postId: string) => {
    setCommentingPostId(postId);
    // Ensure comments are expanded when adding a comment
    if (!expandedComments.has(postId)) {
      setExpandedComments(prev => new Set([...prev, postId]));
    }
  };

  // Removed handleShare as Share functionality is no longer needed

  const handlePollVote = (postId: string, optionIndex: number) => {
    console.log(`🗳️ Voting on poll option ${optionIndex} for post ${postId}`);
    
    setPosts(prev => prev.map(post => {
      if (post.id === postId && post.pollOptions) {
        const selectedOption = post.pollOptions[optionIndex];
        console.log(`✅ Selected option: ${selectedOption}`);
        
        // Update poll votes in the post
        const updatedPost = { ...post };
        if (!updatedPost.pollVotes) {
          updatedPost.pollVotes = {};
        }
        
        const userInfo = getCurrentUserInfo();
        updatedPost.pollVotes[userInfo.id] = selectedOption;
        
        console.log(`📊 Updated poll votes for post ${postId}`);
        return updatedPost;
      }
      return post;
    }));
    
    setNotification({ message: 'Vote recorded successfully!', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getPostTypeIcon = (type: Post['type']) => {
    switch (type) {
      case 'image': return Image;
      case 'poll': return BarChart3;
      case 'link': return Link;
      default: return FileText;
    }
  };

  const getTrendingColor = (trending: number) => {
    if (trending >= 8) return 'text-red-400';
    if (trending >= 5) return 'text-yellow-400';
    return 'text-blue-400';
  };

  // Monitor postComments state for debugging
  useEffect(() => {
    console.log('📊 PostComments state updated:', postComments);
  }, [postComments]);

  // Monitor expandedComments state for debugging
  useEffect(() => {
    console.log('📊 ExpandedComments state updated:', Array.from(expandedComments));
  }, [expandedComments]);

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* New Posts Banner */}
      {newPosts.length > 0 && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-green-400 text-sm">✨</span>
            </div>
            <div>
              <p className="text-green-400 font-semibold">New Posts Created!</p>
              <p className="text-green-300 text-sm">Your posts are now visible in the feed below</p>
            </div>
          </div>
        </div>
      )}

      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gold to-yellow-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-zinc-900" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Your Feed</h2>
            <p className="text-zinc-400 text-sm">Latest from your communities</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-zinc-400">
          <Clock className="w-4 h-4" />
          <span>Updated {formatTimeAgo(new Date())}</span>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {posts.map((post) => {
          const PostTypeIcon = getPostTypeIcon(post.type);
          const isNewPost = newPosts.some(newPost => newPost.id === post.id);
          const comments = postComments[post.id] || [];
          const isExpanded = expandedComments.has(post.id);
          
          return (
            <div 
              key={post.id} 
              className={`bg-zinc-800/60 border rounded-2xl p-6 hover:border-zinc-600/50 transition-all duration-300 ${
                isNewPost 
                  ? 'border-green-500/50 bg-green-500/5 shadow-lg shadow-green-500/10' 
                  : 'border-zinc-700/50'
              }`}
            >
              {/* New Post Badge */}
              {isNewPost && (
                <div className="flex items-center space-x-2 mb-3">
                  <div className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                    <span className="text-xs font-medium text-white">✨ New Post</span>
                  </div>
                </div>
              )}
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {post.isAnonymous && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                        <EyeOff className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-white">
                        {post.isAnonymous ? 'Anonymous User' : post.author.name}
                      </h3>
                      {post.isAnonymous && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                          Anonymous
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-zinc-400">
                      <span>{formatTimeAgo(post.createdAt)}</span>
                      <span>•</span>
                      <span className="text-blue-400">{post.community}</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <PostTypeIcon className="w-3 h-3" />
                        <span className="capitalize">{post.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Trending Score */}
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-zinc-700/50 ${getTrendingColor(post.trending)}`}>
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs font-medium">{post.trending}</span>
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-white mb-3 leading-relaxed">{post.content}</p>
                
                {/* Tags */}
                {/* Removed tag chips display */}
                
                {/* Post Type Specific Content */}
                {post.type === 'image' && post.imageUrl && (
                  <div className="mb-4">
                    <img
                      src={post.imageUrl}
                      alt="Post content"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                  </div>
                )}

                {post.type === 'poll' && post.pollOptions && (
                  <div className="mb-4 space-y-2">
                    {post.pollOptions.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handlePollVote(post.id, index)}
                        className={`w-full p-3 bg-zinc-700/50 hover:bg-zinc-600/50 border border-zinc-600/50 rounded-lg text-left text-white transition-colors ${
                          post.pollVotes && currentUser && post.pollVotes[currentUser.uid] === option
                            ? 'bg-green-500/20 text-green-400'
                            : 'hover:bg-zinc-600/50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {post.type === 'link' && post.linkUrl && (
                  <div className="mb-4">
                    <a
                      href={post.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-zinc-700/50 border border-zinc-600/50 rounded-lg hover:bg-zinc-600/50 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Link className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 text-sm">{post.linkUrl}</span>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Vote Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVote(post.id, 'up')}
                      className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                        post.userVote === 'up'
                          ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20'
                          : 'hover:bg-zinc-700/50 text-zinc-400 hover:text-blue-400 hover:shadow-md'
                      }`}
                      title="Upvote"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium text-white min-w-[2rem] text-center">
                      {post.likes}
                    </span>
                    <button
                      onClick={() => handleVote(post.id, 'down')}
                      className={`p-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                        post.userVote === 'down'
                          ? 'bg-red-500/20 text-red-400 shadow-lg shadow-red-500/20'
                          : 'hover:bg-zinc-700/50 text-zinc-400 hover:text-red-400 hover:shadow-md'
                      }`}
                      title="Downvote"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Comments */}
                  <button 
                    onClick={() => handleComment(post.id)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-all duration-200 transform hover:scale-105 active:scale-95 hover:shadow-md"
                    title="View Comments"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">{post.comments}</span>
                  </button>

                  {/* Views */}
                  <div className="flex items-center space-x-2 text-zinc-400">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">{post.views}</span>
                  </div>
                </div>

                {/* Share Button */}
                {/* Removed Share button */}
              </div>

              {/* Comments Section */}
              {isExpanded && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">Comments ({comments.length})</h4>
                    <button
                      onClick={() => handleAddCommentClick(post.id)}
                      className="text-sm text-gold hover:text-gold/80 transition-colors"
                    >
                      Add Comment
                    </button>
                  </div>
                  
                  {/* Debug Info */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-zinc-500 bg-zinc-800/50 p-2 rounded">
                      Debug: Post ID: {post.id} | Comments: {comments.length} | Expanded: {isExpanded ? 'Yes' : 'No'}
                    </div>
                  )}
                  
                  {/* Comments List */}
                  <div className="space-y-3">
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="space-y-2">
                          {/* Main Comment */}
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              <img
                                src={comment.author.avatar}
                                alt={comment.author.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              {comment.isAnonymous && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                  <EyeOff className="w-2 h-2 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="bg-zinc-700/50 rounded-lg p-3 flex-1">
                              <p className="text-white">{comment.content}</p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center text-sm text-zinc-400">
                                  <span>{formatTimeAgo(comment.createdAt)}</span>
                                  <span>•</span>
                                  <span>{comment.isAnonymous ? 'Anonymous' : comment.author.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleLikeComment(comment.id, post.id)}
                                    className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/10"
                                  >
                                    <Heart className="w-3 h-3" />
                                    <span>{comment.likes}</span>
                                  </button>
                                  <button
                                    onClick={() => handleReply(comment.id, comment.author.name)}
                                    className="text-xs text-zinc-400 hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-blue-400/10"
                                  >
                                    Reply
                                  </button>
                                  {comment.replies && comment.replies.length > 0 && (
                                    <button
                                      onClick={() => handleToggleReplies(comment.id)}
                                      className="text-xs text-zinc-400 hover:text-gold transition-colors px-2 py-1 rounded hover:bg-gold/10"
                                    >
                                      {showReplies.has(comment.id) ? '🔽' : `💬 ${comment.replies.length}`}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Reply Input */}
                          {replyingTo?.commentId === comment.id && (
                            <div className="ml-11 flex items-center space-x-3">
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  placeholder={`Reply to ${replyingTo.authorName}...`}
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddReply();
                                    }
                                  }}
                                  className="w-full bg-zinc-600/50 text-white rounded-lg p-2 pl-3 pr-20 focus:outline-none focus:ring-1 focus:ring-gold text-sm"
                                  autoFocus
                                />
                              </div>
                              <button
                                onClick={handleAddReply}
                                className="p-2 rounded-lg bg-gold hover:bg-gold/90 text-white transition-colors text-sm"
                                title="Add Reply"
                              >
                                Reply
                              </button>
                              <button
                                onClick={() => setReplyingTo(null)}
                                className="p-2 rounded-lg bg-zinc-600 hover:bg-zinc-500 text-zinc-400 transition-colors text-sm"
                                title="Cancel"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && showReplies.has(comment.id) && (
                            <div className="ml-11 space-y-2">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex items-start space-x-3">
                                  <div className="relative">
                                    <img
                                      src={reply.author.avatar}
                                      alt={reply.author.name}
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                    {reply.isAnonymous && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                                        <EyeOff className="w-1.5 h-1.5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="bg-zinc-600/50 rounded-lg p-2 flex-1">
                                    <p className="text-white text-sm">{reply.content}</p>
                                    <div className="flex items-center justify-between mt-1">
                                      <div className="flex items-center text-xs text-zinc-400">
                                        <span>{formatTimeAgo(reply.createdAt)}</span>
                                        <span>•</span>
                                        <span>{reply.isAnonymous ? 'Anonymous' : reply.author.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => handleLikeComment(reply.id, post.id)}
                                          className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/10"
                                        >
                                          <Heart className="w-2.5 h-2.5" />
                                          <span>{reply.likes}</span>
                                        </button>
                                        <button
                                          onClick={() => handleReply(reply.id, reply.author.name)}
                                          className="text-xs text-zinc-400 hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-blue-400/10"
                                        >
                                          Reply
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-400 text-sm">No comments yet. Be the first to add one!</p>
                    )}
                  </div>

                  {/* Add Comment Input */}
                  {commentingPostId === post.id && (
                    <div className="flex items-center space-x-3 mt-4">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newComment.trim()) {
                              handleAddComment();
                            }
                          }}
                          className="w-full bg-zinc-700/50 text-white rounded-lg p-3 pl-4 pr-12 focus:outline-none focus:ring-1 focus:ring-gold"
                          autoFocus
                        />
                      </div>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className={`p-3 rounded-lg transition-colors ${
                          newComment.trim() 
                            ? 'bg-gold hover:bg-gold/90 text-white' 
                            : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                        }`}
                        title="Add Comment"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <path d="M18 11l-5-5-5 5"/>
                          <path d="M15 16l-4 4H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>
                          <path d="M18 13h-5.5L14 7"/>
                          <path d="M18 13h-5.5L14 7"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setCommentingPostId(null);
                          setNewComment('');
                        }}
                        className="p-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-400 transition-colors"
                        title="Cancel"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M18 6 6 18"/>
                          <path d="m15 15-6 6"/>
                          <path d="m9 9 6-6"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* End of Feed */}
      {!hasMore && (
        <div className="text-center py-8 text-zinc-400">
          <p>You've reached the end of your feed</p>
        </div>
      )}

      <div ref={loadingRef} />
    </div>
  );
} 