import React, { useState } from 'react';
import { Users, MessageSquare, Star, TrendingUp, ArrowRight, Shield, Calendar } from 'lucide-react';
import { ChatRoom } from '../types/chat';

interface DualSidedGroupCardProps {
  group: ChatRoom;
  onJoinGroup: (groupId: string) => void;
  isJoined?: boolean;
}

export const DualSidedGroupCard: React.FC<DualSidedGroupCardProps> = ({
  group,
  onJoinGroup,
  isJoined = false
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsJoining(true);
    try {
      await onJoinGroup(group.id);
    } finally {
      setIsJoining(false);
    }
  };

  const getGroupIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Technology': '💻',
      'Anime': '🌸',
      'Movies': '🎬',
      'Gaming': '🎮',
      'Music': '🎵',
      'Sports': '⚽',
      'Food': '🍕',
      'Art & Design': '🎨',
      'Science': '🔬',
      'Pets': '🐾',
      'Fashion': '👗',
      'Finance': '💰',
      'Health & Fitness': '💪',
      'Education': '📚',
      'Entertainment': '🎭',
      'Community': '🤝',
      'Pokémon': '⚡',
      'Naruto': '🍃',
      'Manga': '📖',
      'TV Shows': '📺',
      'Travel': '✈️',
      'Literature': '📚'
    };
    return icons[category] || '💬';
  };

  const getGroupBanner = (category: string) => {
    const banners: Record<string, string> = {
      'Technology': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'Anime': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'Movies': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'Gaming': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'Music': 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
      'Sports': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'Food': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'Art & Design': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'Science': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'Pets': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'Fashion': 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
      'Finance': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'Health & Fitness': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'Education': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'Entertainment': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'Community': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'Pokémon': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'Naruto': 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
      'Manga': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'TV Shows': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'Travel': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'Literature': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    };
    return banners[category] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  const getGroupRules = (category: string) => {
    const rules: Record<string, string[]> = {
      'Technology': [
        'Be respectful of different skill levels',
        'No spam or self-promotion',
        'Share knowledge and help others',
        'Keep discussions relevant to tech'
      ],
      'Anime': [
        'Respect different anime preferences',
        'No spoilers without warning',
        'Be kind to newcomers',
        'Share recommendations respectfully'
      ],
      'Gaming': [
        'No toxic behavior or harassment',
        'Respect different gaming preferences',
        'Help new players learn',
        'Keep discussions constructive'
      ],
      'Music': [
        'Respect all music genres',
        'No piracy discussions',
        'Share music recommendations',
        'Be open to new artists'
      ]
    };
    return rules[category] || [
      'Be respectful to all members',
      'No harassment or hate speech',
      'Keep discussions relevant',
      'Help create a positive environment'
    ];
  };

  return (
    <div className="relative w-full h-64 perspective-1000">
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Side */}
        <div className="absolute w-full h-full backface-hidden">
          <div className="relative w-full h-full bg-zinc-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
            {/* Banner */}
            <div 
              className="h-24 w-full relative"
              style={{ background: getGroupBanner(group.category) }}
            >
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute top-3 right-3">
                <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                  <TrendingUp className="w-3 h-3 text-white" />
                  <span className="text-xs text-white font-medium">{group.trending || 5}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <div className="text-3xl">{getGroupIcon(group.category)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                    {group.name}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1">{group.category}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-zinc-400">
                    <Users className="w-4 h-4" />
                    <span>{group.members.toLocaleString()} members</span>
                  </div>
                  <div className="flex items-center space-x-1 text-zinc-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>{group.messages.length} messages</span>
                  </div>
                </div>

                {group.timeSpent && (
                  <div className="flex items-center space-x-1 text-sm text-zinc-400">
                    <Calendar className="w-4 h-4" />
                    <span>~{Math.round(group.timeSpent / 60)}h daily activity</span>
                  </div>
                )}
              </div>

              {/* Flip indicator */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-purple-500/20 backdrop-blur-sm rounded-full p-2">
                  <ArrowRight className="w-4 h-4 text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div className="w-full h-full bg-zinc-800 rounded-xl overflow-hidden shadow-lg p-4">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-2xl">{getGroupIcon(group.category)}</div>
                <div>
                  <h3 className="text-lg font-bold text-white">{group.name}</h3>
                  <p className="text-sm text-zinc-400">{group.category}</p>
                </div>
              </div>

              {/* Description */}
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-white mb-2">About</h4>
                <p className="text-sm text-zinc-300 mb-4 leading-relaxed">
                  {group.description}
                </p>

                {/* Rules */}
                <h4 className="text-sm font-semibold text-white mb-2">Community Rules</h4>
                <ul className="space-y-1 mb-4">
                  {getGroupRules(group.category).map((rule, index) => (
                    <li key={index} className="text-xs text-zinc-400 flex items-start space-x-2">
                      <Shield className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Join Button */}
              <div className="mt-auto">
                {isJoined ? (
                  <div className="w-full py-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center space-x-2">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Joined</span>
                  </div>
                ) : (
                  <button
                    onClick={handleJoinClick}
                    disabled={isJoining}
                    className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
                  >
                    {isJoining ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-white">Joining...</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 text-white" />
                        <span className="text-sm font-medium text-white">Join Group</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Flip back indicator */}
              <div className="absolute top-3 right-3">
                <div className="bg-zinc-700/50 backdrop-blur-sm rounded-full p-2">
                  <ArrowRight className="w-4 h-4 text-zinc-400 rotate-180" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
