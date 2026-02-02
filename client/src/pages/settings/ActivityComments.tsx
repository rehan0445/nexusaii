import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Calendar, User, Heart } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface Comment {
  id: string;
  content: string;
  commentedAt: Date;
  platform: 'home' | 'confession' | 'group' | 'character';
  platformName: string;
  originalAuthor: string;
  originalContent: string;
  likes: number;
  replies: number;
}

const ActivityComments: React.FC = () => {
  const navigate = useNavigate();
  const { incognitoMode } = useSettings();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'home' | 'confession' | 'group' | 'character'>('all');

  const colorScheme = {
    primaryButton: incognitoMode ? 'bg-orange-500 hover:bg-orange-400' : 'bg-softgold-500 hover:bg-softgold-500',
    accentText: incognitoMode ? 'text-orange-400' : 'text-softgold-500',
    bgMain: incognitoMode ? 'bg-black' : 'bg-zinc-900',
    bgCard: incognitoMode ? 'bg-zinc-900' : 'bg-zinc-800',
  };

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockComments: Comment[] = [
      {
        id: '1',
        content: 'This is such an insightful post! Thanks for sharing your perspective.',
        commentedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        platform: 'home',
        platformName: 'Home Feed',
        originalAuthor: 'TechGuru',
        originalContent: 'The future of AI development is looking bright...',
        likes: 15,
        replies: 3
      },
      {
        id: '2',
        content: 'I completely understand how you feel. You\'re not alone in this.',
        commentedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        platform: 'confession',
        platformName: 'Campus Confessions',
        originalAuthor: 'Anonymous',
        originalContent: 'Sometimes I feel like I don\'t belong anywhere...',
        likes: 8,
        replies: 1
      },
      {
        id: '3',
        content: 'Great strategy! I\'ve been using similar tactics and they work really well.',
        commentedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        platform: 'group',
        platformName: 'Gaming Community',
        originalAuthor: 'ProGamer',
        originalContent: 'Here\'s my advanced guide to competitive gaming...',
        likes: 22,
        replies: 7
      },
      {
        id: '4',
        content: 'Thank you for always being so helpful and understanding!',
        commentedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        platform: 'character',
        platformName: 'AI Companions',
        originalAuthor: 'Luna AI',
        originalContent: 'I\'m here to help you with whatever you need...',
        likes: 34,
        replies: 0
      }
    ];

    setTimeout(() => {
      setComments(mockComments);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredComments = comments.filter(comment => 
    filter === 'all' || comment.platform === filter
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getPlatformColor = (platform: string) => {
    const colors = {
      home: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      confession: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      group: 'bg-green-500/20 text-green-400 border-green-500/30',
      character: 'bg-pink-500/20 text-pink-400 border-pink-500/30'
    };
    return colors[platform as keyof typeof colors] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${colorScheme.bgMain} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-softgold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading your comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colorScheme.bgMain}`}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <MessageCircle className={`w-6 h-6 ${colorScheme.accentText}`} />
              <h1 className="text-2xl font-bold text-white">Your Comments</h1>
            </div>
          </div>
          <div className="text-sm text-zinc-400">
            {filteredComments.length} comments
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-16 z-40 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex space-x-1 p-4 overflow-x-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'home', label: 'Home Feed' },
            { key: 'confession', label: 'Confessions' },
            { key: 'group', label: 'Groups' },
            { key: 'character', label: 'Characters' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === key
                  ? `${colorScheme.primaryButton} text-white`
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Comments List */}
      <div className="p-4 space-y-4">
        {filteredComments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No comments found</h3>
            <p className="text-zinc-400">
              {filter === 'all' 
                ? 'You haven\'t commented on anything yet.' 
                : `No comments found in ${filter}.`}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div key={comment.id} className={`${colorScheme.bgCard} rounded-xl p-6`}>
              {/* Platform Badge and Time */}
              <div className="flex items-center justify-between mb-4">
                <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getPlatformColor(comment.platform)}`}>
                  {comment.platformName}
                </div>
                <div className="flex items-center space-x-1 text-zinc-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{formatTime(comment.commentedAt)}</span>
                </div>
              </div>

              {/* Your Comment */}
              <div className="mb-4 p-4 bg-zinc-700/50 rounded-lg border-l-4 border-softgold-500">
                <p className="text-white">{comment.content}</p>
              </div>

              {/* Original Post Context */}
              <div className="mb-4 p-3 bg-zinc-700/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-300 text-sm">@{comment.originalAuthor}</span>
                </div>
                <p className="text-zinc-400 text-sm italic">"{comment.originalContent}"</p>
              </div>

              {/* Comment Stats */}
              <div className="flex items-center space-x-6 text-zinc-400 text-sm">
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{comment.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{comment.replies} replies</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityComments;
