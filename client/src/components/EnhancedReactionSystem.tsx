import React, { useState, useEffect } from 'react';
import { Heart, Laugh, Star, Zap, Flame, Eye, Sparkles } from 'lucide-react';

export interface ReactionType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  animation: string;
}

export const reactionTypes: ReactionType[] = [
  {
    id: 'love',
    name: 'Love',
    icon: Heart,
    color: 'text-pink-400',
    gradient: 'from-pink-500 to-red-500',
    animation: 'animate-pulse'
  },
  {
    id: 'amazing',
    name: 'Amazing',
    icon: Star,
    color: 'text-yellow-400',
    gradient: 'from-yellow-500 to-orange-500',
    animation: 'animate-spin'
  },
  {
    id: 'funny',
    name: 'Funny',
    icon: Laugh,
    color: 'text-green-400',
    gradient: 'from-green-500 to-emerald-500',
    animation: 'animate-bounce'
  },
  {
    id: 'epic',
    name: 'Epic',
    icon: Zap,
    color: 'text-blue-400',
    gradient: 'from-blue-500 to-cyan-500',
    animation: 'animate-pulse'
  },
  {
    id: 'fire',
    name: 'Fire',
    icon: Flame,
    color: 'text-orange-400',
    gradient: 'from-orange-500 to-red-600',
    animation: 'animate-bounce'
  },
  {
    id: 'magical',
    name: 'Magical',
    icon: Sparkles,
    color: 'text-purple-400',
    gradient: 'from-purple-500 to-pink-500',
    animation: 'animate-pulse'
  }
];

interface EnhancedReactionSystemProps {
  characterSlug: string;
  reactions?: Record<string, { count: number; userReacted: boolean }>;
  onReaction: (reactionType: string, characterSlug: string) => void;
  loading?: Record<string, boolean>;
  showExpanded?: boolean;
  className?: string;
}

export const EnhancedReactionSystem: React.FC<EnhancedReactionSystemProps> = ({
  characterSlug,
  reactions = {},
  onReaction,
  loading = {},
  showExpanded = false,
  className = ''
}) => {
  const [showAllReactions, setShowAllReactions] = useState(showExpanded);
  const [animatingReactions, setAnimatingReactions] = useState<Set<string>>(new Set());
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: string; type: string; x: number; y: number }>>([]);

  const handleReaction = (reactionType: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Add animation
    setAnimatingReactions(prev => new Set([...prev, reactionType]));
    
    // Create floating emoji effect
    const rect = event.currentTarget.getBoundingClientRect();
    const newFloatingEmoji = {
      id: Date.now().toString(),
      type: reactionType,
      x: rect.left + rect.width / 2,
      y: rect.top
    };
    setFloatingEmojis(prev => [...prev, newFloatingEmoji]);

    // Remove floating emoji after animation
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(emoji => emoji.id !== newFloatingEmoji.id));
    }, 1000);

    // Remove animation class
    setTimeout(() => {
      setAnimatingReactions(prev => {
        const newSet = new Set(prev);
        newSet.delete(reactionType);
        return newSet;
      });
    }, 300);

    onReaction(reactionType, characterSlug);
  };

  const primaryReactions = reactionTypes.slice(0, 3);
  const allReactions = reactionTypes;

  const reactionsToShow = showAllReactions ? allReactions : primaryReactions;

  return (
    <>
      <div className={`flex items-center gap-1 ${className}`}>
        {reactionsToShow.map((reaction) => {
          const reactionData = reactions[reaction.id] || { count: 0, userReacted: false };
          const isAnimating = animatingReactions.has(reaction.id);
          const isLoading = loading[reaction.id];
          const IconComponent = reaction.icon;

          return (
            <button
              key={reaction.id}
              onClick={(e) => handleReaction(reaction.id, e)}
              disabled={isLoading}
              className={`
                group relative flex items-center gap-1 px-2 py-1 rounded-full text-xs
                transition-all duration-200 transform
                ${reactionData.userReacted 
                  ? `bg-gradient-to-r ${reaction.gradient} text-white shadow-lg scale-105` 
                  : 'bg-zinc-700/50 hover:bg-zinc-600/50 text-zinc-300 hover:text-white'
                }
                ${isAnimating ? 'scale-110' : 'hover:scale-105'}
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={reaction.name}
            >
              <IconComponent 
                className={`
                  w-3 h-3 transition-all duration-200
                  ${reactionData.userReacted ? 'fill-current' : ''}
                  ${isAnimating ? reaction.animation : ''}
                  ${reactionData.userReacted ? reaction.color : ''}
                `} 
              />
              {reactionData.count > 0 && (
                <span className="font-medium">{reactionData.count}</span>
              )}
              
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {reaction.name}
              </div>
            </button>
          );
        })}

        {!showExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAllReactions(!showAllReactions);
            }}
            className="px-2 py-1 rounded-full bg-zinc-700/50 hover:bg-zinc-600/50 text-zinc-400 hover:text-white transition-all text-xs"
            title={showAllReactions ? 'Show less' : 'More reactions'}
          >
            {showAllReactions ? '−' : '+'}
          </button>
        )}
      </div>

      {/* Floating emoji animations */}
      {floatingEmojis.map((emoji) => {
        const reaction = reactionTypes.find(r => r.id === emoji.type);
        if (!reaction) return null;
        const IconComponent = reaction.icon;

        return (
          <div
            key={emoji.id}
            className="fixed pointer-events-none z-50"
            style={{
              left: emoji.x - 12,
              top: emoji.y - 24,
              animation: 'floatUp 1s ease-out forwards'
            }}
          >
            <IconComponent className={`w-6 h-6 ${reaction.color} fill-current`} />
          </div>
        );
      })}

      <style>
        {`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-20px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translateY(-40px) scale(0.8);
          }
        }
        `}
      </style>
    </>
  );
};

export default EnhancedReactionSystem; 