import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ThumbsDown, Calendar, User, MessageSquare } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface LikeActivity {
  id: string;
  type: 'like' | 'dislike';
  targetType: 'post' | 'comment' | 'confession' | 'character' | 'repost';
  targetContent: string;
  targetAuthor: string;
  platform: 'home' | 'confession' | 'group' | 'character';
  platformName: string;
  likedAt: Date;
  isStillLiked: boolean;
}

const ActivityLikes: React.FC = () => {
  const navigate = useNavigate();
  const { incognitoMode } = useSettings();
  const [likes, setLikes] = useState<LikeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'likes' | 'dislikes'>('all');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'home' | 'confession' | 'group' | 'character'>('all');

  const colorScheme = {
    primaryButton: incognitoMode ? 'bg-orange-500 hover:bg-orange-400' : 'bg-softgold-500 hover:bg-softgold-500',
    accentText: incognitoMode ? 'text-orange-400' : 'text-softgold-500',
    bgMain: incognitoMode ? 'bg-black' : 'bg-zinc-900',
    bgCard: incognitoMode ? 'bg-zinc-900' : 'bg-zinc-800',
  };

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockLikes: LikeActivity[] = [
      {
        id: '1',
        type: 'like',
        targetType: 'post',
        targetContent: 'Just finished reading an amazing book about AI consciousness. The future is fascinating!',
        targetAuthor: 'BookLover',
        platform: 'home',
        platformName: 'Home Feed',
        likedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isStillLiked: true
      },
      {
        id: '2',
        type: 'like',
        targetType: 'confession',
        targetContent: 'I finally worked up the courage to ask my crush out and they said yes!',
        targetAuthor: 'Anonymous',
        platform: 'confession',
        platformName: 'Campus Confessions',
        likedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        isStillLiked: true
      },
      {
        id: '3',
        type: 'dislike',
        targetType: 'comment',
        targetContent: 'This game is terrible and anyone who likes it has no taste.',
        targetAuthor: 'CriticGamer',
        platform: 'group',
        platformName: 'Gaming Community',
        likedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        isStillLiked: false
      },
      {
        id: '4',
        type: 'like',
        targetType: 'character',
        targetContent: 'Luna AI - A wise and empathetic companion perfect for deep conversations.',
        targetAuthor: 'AI Creator',
        platform: 'character',
        platformName: 'AI Companions',
        likedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isStillLiked: true
      },
      {
        id: '5',
        type: 'like',
        targetType: 'repost',
        targetContent: 'Amazing breakthrough in quantum computing! This changes everything.',
        targetAuthor: 'ScienceNews',
        platform: 'home',
        platformName: 'Home Feed',
        likedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isStillLiked: true
      }
    ];

    setTimeout(() => {
      setLikes(mockLikes);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredLikes = likes.filter(like => {
    const typeMatch = filter === 'all' || 
                     (filter === 'likes' && like.type === 'like') || 
                     (filter === 'dislikes' && like.type === 'dislike');
    const platformMatch = platformFilter === 'all' || like.platform === platformFilter;
    return typeMatch && platformMatch;
  });

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

  const getTargetTypeIcon = (targetType: string) => {
    switch (targetType) {
      case 'post':
      case 'repost':
        return MessageSquare;
      case 'comment':
        return MessageSquare;
      case 'confession':
        return MessageSquare;
      case 'character':
        return User;
      default:
        return MessageSquare;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${colorScheme.bgMain} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-softgold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading your likes...</p>
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
              <Heart className={`w-6 h-6 ${colorScheme.accentText}`} />
              <h1 className="text-2xl font-bold text-white">Your Likes & Dislikes</h1>
            </div>
          </div>
          <div className="text-sm text-zinc-400">
            {filteredLikes.length} activities
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-16 z-40 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="p-4 space-y-3">
          {/* Type Filter */}
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { key: 'all', label: 'All' },
              { key: 'likes', label: 'Likes' },
              { key: 'dislikes', label: 'Dislikes' }
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
          
          {/* Platform Filter */}
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { key: 'all', label: 'All Platforms' },
              { key: 'home', label: 'Home' },
              { key: 'confession', label: 'Confessions' },
              { key: 'group', label: 'Groups' },
              { key: 'character', label: 'Characters' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setPlatformFilter(key as any)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  platformFilter === key
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Likes List */}
      <div className="p-4 space-y-4">
        {filteredLikes.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No activity found</h3>
            <p className="text-zinc-400">
              No likes or dislikes found with the current filters.
            </p>
          </div>
        ) : (
          filteredLikes.map((like) => {
            const TargetIcon = getTargetTypeIcon(like.targetType);
            
            return (
              <div key={like.id} className={`${colorScheme.bgCard} rounded-xl p-6`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      like.type === 'like' 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {like.type === 'like' ? (
                        <Heart className="w-4 h-4" />
                      ) : (
                        <ThumbsDown className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="text-white font-medium">
                        {like.type === 'like' ? 'Liked' : 'Disliked'} a {like.targetType}
                      </span>
                      {!like.isStillLiked && (
                        <span className="text-zinc-500 text-sm ml-2">(removed)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getPlatformColor(like.platform)}`}>
                      {like.platformName}
                    </div>
                    <div className="flex items-center space-x-1 text-zinc-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTime(like.likedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-4 p-4 bg-zinc-700/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <TargetIcon className="w-5 h-5 text-zinc-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-zinc-400" />
                        <span className="text-zinc-300 text-sm">@{like.targetAuthor}</span>
                      </div>
                      <p className="text-zinc-300">{like.targetContent}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityLikes;
