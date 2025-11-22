import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Repeat, Calendar, User, MessageSquare } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface Repost {
  id: string;
  originalAuthor: string;
  originalContent: string;
  repostedAt: Date;
  platform: 'home' | 'confession' | 'group' | 'character';
  platformName: string;
  likes: number;
  comments: number;
}

const ActivityReposts: React.FC = () => {
  const navigate = useNavigate();
  const { incognitoMode } = useSettings();
  const [reposts, setReposts] = useState<Repost[]>([]);
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
    const mockReposts: Repost[] = [
      {
        id: '1',
        originalAuthor: 'TechGuru',
        originalContent: 'Amazing AI breakthrough! The future of machine learning is here.',
        repostedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        platform: 'home',
        platformName: 'Home Feed',
        likes: 24,
        comments: 8
      },
      {
        id: '2',
        originalAuthor: 'Anonymous',
        originalContent: 'Sometimes I wonder if anyone really understands what I\'m going through...',
        repostedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        platform: 'confession',
        platformName: 'Campus Confessions',
        likes: 12,
        comments: 3
      },
      {
        id: '3',
        originalAuthor: 'GameMaster',
        originalContent: 'New game mechanics revealed! This is going to change everything.',
        repostedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        platform: 'group',
        platformName: 'Gaming Community',
        likes: 45,
        comments: 15
      },
      {
        id: '4',
        originalAuthor: 'Luna AI',
        originalContent: 'I\'ve learned so much from our conversations today. Thank you for teaching me!',
        repostedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        platform: 'character',
        platformName: 'AI Companions',
        likes: 67,
        comments: 21
      }
    ];

    setTimeout(() => {
      setReposts(mockReposts);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredReposts = reposts.filter(repost => 
    filter === 'all' || repost.platform === filter
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
          <p className="text-zinc-400">Loading your reposts...</p>
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
              <Repeat className={`w-6 h-6 ${colorScheme.accentText}`} />
              <h1 className="text-2xl font-bold text-white">Your Reposts</h1>
            </div>
          </div>
          <div className="text-sm text-zinc-400">
            {filteredReposts.length} reposts
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

      {/* Reposts List */}
      <div className="p-4 space-y-4">
        {filteredReposts.length === 0 ? (
          <div className="text-center py-12">
            <Repeat className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No reposts found</h3>
            <p className="text-zinc-400">
              {filter === 'all' 
                ? 'You haven\'t reposted anything yet.' 
                : `No reposts found in ${filter}.`}
            </p>
          </div>
        ) : (
          filteredReposts.map((repost) => (
            <div key={repost.id} className={`${colorScheme.bgCard} rounded-xl p-6`}>
              {/* Platform Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getPlatformColor(repost.platform)}`}>
                  {repost.platformName}
                </div>
                <div className="flex items-center space-x-1 text-zinc-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{formatTime(repost.repostedAt)}</span>
                </div>
              </div>

              {/* Original Author */}
              <div className="flex items-center space-x-2 mb-3">
                <User className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300 text-sm">Originally by @{repost.originalAuthor}</span>
              </div>

              {/* Content */}
              <div className="mb-4">
                <p className="text-white leading-relaxed">{repost.originalContent}</p>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 text-zinc-400 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-red-400">♥</span>
                  <span>{repost.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>{repost.comments}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Repeat className={`w-4 h-4 ${colorScheme.accentText}`} />
                  <span>Reposted</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityReposts;
