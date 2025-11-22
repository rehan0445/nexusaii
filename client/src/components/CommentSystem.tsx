import React, { useState, useEffect } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Reply,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Send,
  X,
  MoreVertical,
  Flag
} from 'lucide-react';
import { getAuth } from '../utils/auth';

interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  upvotes: number;
  downvotes: number;
  replies: Comment[];
  isAnonymous: boolean;
  userVote?: 'up' | 'down' | null;
}

interface CommentSystemProps {
  characterId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CommentSystem: React.FC<CommentSystemProps> = ({ characterId, isOpen, onClose }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const mockComments: Comment[] = [
    {
      id: '1',
      userId: 'user1',
      username: 'ChatEnthusiast',
      text: 'This character is amazing! The conversations feel so natural and engaging.',
      timestamp: Date.now() - 3600000,
      upvotes: 12,
      downvotes: 1,
      replies: [
        {
          id: '1-1',
          userId: 'user2',
          username: 'Anonymous',
          text: 'I totally agree! The personality really shines through.',
          timestamp: Date.now() - 3000000,
          upvotes: 5,
          downvotes: 0,
          replies: [],
          isAnonymous: true
        }
      ],
      isAnonymous: false,
      userVote: null
    },
    {
      id: '2',
      userId: 'user3',
      username: 'Anonymous',
      text: 'Great work on the character development. Very immersive experience!',
      timestamp: Date.now() - 7200000,
      upvotes: 8,
      downvotes: 0,
      replies: [],
      isAnonymous: true,
      userVote: 'up'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, characterId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await axios.get(`/api/comments/${characterId}`);
      // setComments(response.data);
      
      // Using mock data for now
      setComments(mockComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (commentId: string, voteType: 'up' | 'down', isReply: boolean = false, parentId?: string) => {
    try {
      // TODO: API call to vote
      // await axios.post(`/api/comments/${commentId}/vote`, { type: voteType });
      
      // Update local state
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          const currentVote = comment.userVote;
          let newUpvotes = comment.upvotes;
          let newDownvotes = comment.downvotes;
          let newVote: 'up' | 'down' | null = voteType;

          // Remove previous vote
          if (currentVote === 'up') newUpvotes--;
          if (currentVote === 'down') newDownvotes--;

          // Add new vote (or remove if clicking same vote)
          if (currentVote === voteType) {
            newVote = null; // Remove vote if clicking same button
          } else {
            if (voteType === 'up') newUpvotes++;
            if (voteType === 'down') newDownvotes++;
          }

          return {
            ...comment,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            userVote: newVote
          };
        }

        // Handle reply votes
        if (isReply && parentId === comment.id) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === commentId) {
                const currentVote = reply.userVote;
                let newUpvotes = reply.upvotes;
                let newDownvotes = reply.downvotes;
                let newVote: 'up' | 'down' | null = voteType;

                if (currentVote === 'up') newUpvotes--;
                if (currentVote === 'down') newDownvotes--;

                if (currentVote === voteType) {
                  newVote = null;
                } else {
                  if (voteType === 'up') newUpvotes++;
                  if (voteType === 'down') newDownvotes++;
                }

                return {
                  ...reply,
                  upvotes: newUpvotes,
                  downvotes: newDownvotes,
                  userVote: newVote
                };
              }
              return reply;
            })
          };
        }

        return comment;
      }));
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert('Please log in to comment');
      return;
    }

    setLoading(true);
    try {
      const comment: Comment = {
        id: Date.now().toString(),
        userId: user.uid,
        username: isAnonymous ? 'Anonymous' : user.displayName || 'User',
        text: newComment,
        timestamp: Date.now(),
        upvotes: 0,
        downvotes: 0,
        replies: [],
        isAnonymous,
        userVote: null
      };

      // TODO: API call to save comment
      // await axios.post(`/api/comments/${characterId}`, comment);
      
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !replyingTo) return;

    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      alert('Please log in to reply');
      return;
    }

    setLoading(true);
    try {
      const reply: Comment = {
        id: `${replyingTo}-${Date.now()}`,
        userId: user.uid,
        username: isAnonymous ? 'Anonymous' : user.displayName || 'User',
        text: replyText,
        timestamp: Date.now(),
        upvotes: 0,
        downvotes: 0,
        replies: [],
        isAnonymous,
        userVote: null
      };

      // TODO: API call to save reply
      
      setComments(prev => prev.map(comment => {
        if (comment.id === replyingTo) {
          return {
            ...comment,
            replies: [...comment.replies, reply]
          };
        }
        return comment;
      }));
      
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'top') {
      return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
    }
    return b.timestamp - a.timestamp;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-800 rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div>
            <h2 className="text-xl font-bold text-white">Comments</h2>
            <p className="text-sm text-zinc-400">{comments.length} comments</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'top' | 'newest')}
              className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-softgold-500"
            >
              <option value="top">Top Comments</option>
              <option value="newest">Newest First</option>
            </select>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Comment Input */}
        <div className="p-6 border-b border-zinc-700">
          <div className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this character..."
              className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-softgold-500"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded bg-zinc-700 border-zinc-600 text-softgold-500 focus:ring-softgold-500"
                  />
                  <span className="text-sm text-zinc-300">Comment anonymously</span>
                </label>
              </div>
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || loading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  newComment.trim() && !loading
                    ? 'bg-softgold-500 hover:bg-softgold-500 text-black'
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Comment</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto">
          {loading && comments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-zinc-400">Loading comments...</div>
            </div>
          ) : sortedComments.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-zinc-400 mb-2">No comments yet</div>
                <div className="text-sm text-zinc-500">Be the first to share your thoughts!</div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {sortedComments.map((comment) => (
                <div key={comment.id} className="space-y-3">
                  {/* Main Comment */}
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white">
                          {comment.isAnonymous ? 'Anonymous' : comment.username}
                        </span>
                        <div className="flex items-center space-x-1 text-zinc-500">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{formatTimeAgo(comment.timestamp)}</span>
                        </div>
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed">{comment.text}</p>
                      
                      {/* Comment Actions */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleVote(comment.id, 'up')}
                            className={`p-1 rounded transition-colors ${
                              comment.userVote === 'up'
                                ? 'text-green-400 bg-green-400/20'
                                : 'text-zinc-400 hover:text-green-400 hover:bg-green-400/10'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-zinc-400">{comment.upvotes}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleVote(comment.id, 'down')}
                            className={`p-1 rounded transition-colors ${
                              comment.userVote === 'down'
                                ? 'text-red-400 bg-red-400/20'
                                : 'text-zinc-400 hover:text-red-400 hover:bg-red-400/10'
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-zinc-400">{comment.downvotes}</span>
                        </div>
                        
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-300 transition-colors"
                        >
                          <Reply className="w-4 h-4" />
                          <span className="text-sm">Reply</span>
                        </button>
                        
                        {comment.replies.length > 0 && (
                          <button
                            onClick={() => toggleReplies(comment.id)}
                            className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-300 transition-colors"
                          >
                            {expandedReplies.has(comment.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            <span className="text-sm">{comment.replies.length} replies</span>
                          </button>
                        )}
                      </div>

                      {/* Reply Input */}
                      {replyingTo === comment.id && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full px-3 py-2 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-softgold-500 text-sm"
                            rows={2}
                          />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                className="rounded bg-zinc-700 border-zinc-600 text-softgold-500 focus:ring-softgold-500"
                              />
                              <span className="text-xs text-zinc-400">Reply anonymously</span>
                            </label>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setReplyingTo(null)}
                                className="px-3 py-1 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSubmitReply}
                                disabled={!replyText.trim() || loading}
                                className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                                  replyText.trim() && !loading
                                    ? 'bg-softgold-500 hover:bg-softgold-500 text-black'
                                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                                }`}
                              >
                                <Send className="w-3 h-3" />
                                <span>Reply</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Replies */}
                  {expandedReplies.has(comment.id) && comment.replies.length > 0 && (
                    <div className="ml-11 space-y-3 border-l-2 border-zinc-700 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex space-x-3">
                          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                            <User className="w-3 h-3 text-zinc-400" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-white text-sm">
                                {reply.isAnonymous ? 'Anonymous' : reply.username}
                              </span>
                              <div className="flex items-center space-x-1 text-zinc-500">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">{formatTimeAgo(reply.timestamp)}</span>
                              </div>
                            </div>
                            <p className="text-zinc-300 text-sm leading-relaxed">{reply.text}</p>
                            
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleVote(reply.id, 'up', true, comment.id)}
                                  className={`p-1 rounded transition-colors ${
                                    reply.userVote === 'up'
                                      ? 'text-green-400 bg-green-400/20'
                                      : 'text-zinc-400 hover:text-green-400 hover:bg-green-400/10'
                                  }`}
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </button>
                                <span className="text-xs text-zinc-400">{reply.upvotes}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleVote(reply.id, 'down', true, comment.id)}
                                  className={`p-1 rounded transition-colors ${
                                    reply.userVote === 'down'
                                      ? 'text-red-400 bg-red-400/20'
                                      : 'text-zinc-400 hover:text-red-400 hover:bg-red-400/10'
                                  }`}
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                </button>
                                <span className="text-xs text-zinc-400">{reply.downvotes}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSystem;
