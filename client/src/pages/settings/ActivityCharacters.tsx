import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Calendar, MessageSquare, Eye, Star, Users } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface Character {
  id: string;
  name: string;
  description: string;
  personality: string;
  createdAt: Date;
  category: string;
  avatar: string;
  stats: {
    totalChats: number;
    totalMessages: number;
    views: number;
    likes: number;
    followers: number;
  };
  isPublic: boolean;
  status: 'active' | 'archived' | 'draft';
}

const ActivityCharacters: React.FC = () => {
  const navigate = useNavigate();
  const { incognitoMode } = useSettings();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived' | 'draft'>('all');

  const colorScheme = {
    primaryButton: incognitoMode ? 'bg-orange-500 hover:bg-orange-400' : 'bg-softgold-500 hover:bg-softgold-500',
    accentText: incognitoMode ? 'text-orange-400' : 'text-softgold-500',
    bgMain: incognitoMode ? 'bg-black' : 'bg-zinc-900',
    bgCard: incognitoMode ? 'bg-zinc-900' : 'bg-zinc-800',
  };

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockCharacters: Character[] = [
      {
        id: '1',
        name: 'Luna the Wise',
        description: 'A knowledgeable AI companion specializing in philosophy and life advice.',
        personality: 'Wise, empathetic, and thoughtful',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        category: 'Advisor',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        stats: {
          totalChats: 245,
          totalMessages: 1876,
          views: 3421,
          likes: 189,
          followers: 67
        },
        isPublic: true,
        status: 'active'
      },
      {
        id: '2',
        name: 'Kai the Explorer',
        description: 'An adventurous companion who loves discussing travel and new experiences.',
        personality: 'Adventurous, curious, and energetic',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        category: 'Adventure Guide',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        stats: {
          totalChats: 189,
          totalMessages: 1245,
          views: 2876,
          likes: 156,
          followers: 43
        },
        isPublic: true,
        status: 'active'
      },
      {
        id: '3',
        name: 'Zara the Creative',
        description: 'An artistic soul who helps with creative projects and inspiration.',
        personality: 'Creative, inspiring, and imaginative',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        category: 'Artist',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b789?w=100&h=100&fit=crop&crop=face',
        stats: {
          totalChats: 156,
          totalMessages: 987,
          views: 2134,
          likes: 98,
          followers: 29
        },
        isPublic: false,
        status: 'archived'
      }
    ];

    setTimeout(() => {
      setCharacters(mockCharacters);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredCharacters = characters.filter(character => 
    filter === 'all' || character.status === filter
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 30) return `${Math.floor(days / 30)}mo ago`;
    if (days > 0) return `${days}d ago`;
    return 'Today';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      archived: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return colors[status as keyof typeof colors] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${colorScheme.bgMain} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-softgold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading your characters...</p>
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
              <Bot className={`w-6 h-6 ${colorScheme.accentText}`} />
              <h1 className="text-2xl font-bold text-white">Your Characters</h1>
            </div>
          </div>
          <div className="text-sm text-zinc-400">
            {filteredCharacters.length} characters
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-16 z-40 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex space-x-1 p-4 overflow-x-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'archived', label: 'Archived' },
            { key: 'draft', label: 'Drafts' }
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

      {/* Characters List */}
      <div className="p-4 space-y-4">
        {filteredCharacters.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No characters found</h3>
            <p className="text-zinc-400">
              {filter === 'all' 
                ? 'You haven\'t created any characters yet.' 
                : `No ${filter} characters found.`}
            </p>
          </div>
        ) : (
          filteredCharacters.map((character) => (
            <div key={character.id} className={`${colorScheme.bgCard} rounded-xl p-6`}>
              {/* Character Header */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-700 flex-shrink-0">
                  <img 
                    src={character.avatar} 
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white truncate">{character.name}</h3>
                    <div className={`px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(character.status)}`}>
                      {character.status}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-zinc-400 mb-2">
                    <span>{character.category}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTime(character.createdAt)}</span>
                    </div>
                    <span>•</span>
                    <span>{character.isPublic ? 'Public' : 'Private'}</span>
                  </div>
                  
                  <p className="text-zinc-300 text-sm mb-3">{character.description}</p>
                  <p className="text-zinc-400 text-xs italic">Personality: {character.personality}</p>
                </div>
              </div>

              {/* Character Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-zinc-700">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-zinc-400 mb-1">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-semibold text-white">{character.stats.totalChats}</div>
                  <div className="text-xs text-zinc-400">Chats</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-zinc-400 mb-1">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-semibold text-white">{character.stats.totalMessages.toLocaleString()}</div>
                  <div className="text-xs text-zinc-400">Messages</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-zinc-400 mb-1">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-semibold text-white">{character.stats.views.toLocaleString()}</div>
                  <div className="text-xs text-zinc-400">Views</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-zinc-400 mb-1">
                    <Star className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-semibold text-white">{character.stats.likes}</div>
                  <div className="text-xs text-zinc-400">Likes</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 text-zinc-400 mb-1">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-semibold text-white">{character.stats.followers}</div>
                  <div className="text-xs text-zinc-400">Followers</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityCharacters;
