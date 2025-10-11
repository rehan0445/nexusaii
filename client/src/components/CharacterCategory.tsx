import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, X } from 'lucide-react';
import { Heart } from 'lucide-react';

interface CharacterCategoryProps {
  title: string;
  characters: {
    slug: string;
    character: any;
    views: number;
    likes: number;
  }[];
  icon?: React.ReactNode;
  favorites: string[];
  toggleFavorite: (e: React.MouseEvent, slug: string) => void;
}

// Color schemes for different categories
interface ColorScheme {
  iconBg: string;
  underline: string;
  button: string;
  tag: string;
  highlight: string;
}

export default function CharacterCategory({
  title,
  characters,
  icon,
  favorites,
  toggleFavorite
}: CharacterCategoryProps) {
  const navigate = useNavigate();
  const [showAllModal, setShowAllModal] = useState(false);
  
  // Determine color scheme based on category title
  const colorScheme = useMemo((): ColorScheme => {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('you')) {
      // For You - Gold
      return {
        iconBg: 'bg-softgold-800/80',
        underline: 'bg-softgold-500',
        button: 'bg-gradient-to-r from-softgold-500 to-softgold-600',
        tag: 'bg-softgold-800/80',
        highlight: 'text-softgold-300'
      };
    } else if (lowerTitle.includes('boredom') || lowerTitle.includes('buster')) {
      // Boredom Buster - Gold
      return {
        iconBg: 'bg-softgold-700/80',
        underline: 'bg-softgold-600',
        button: 'bg-gradient-to-r from-softgold-600 to-softgold-700',
        tag: 'bg-softgold-700/80',
        highlight: 'text-softgold-400'
      };
    } else if (lowerTitle.includes('action')) {
      // Action - Gold
      return {
        iconBg: 'bg-softgold-900/80',
        underline: 'bg-softgold-700',
        button: 'bg-gradient-to-r from-softgold-700 to-softgold-800',
        tag: 'bg-softgold-900/80',
        highlight: 'text-softgold-300'
      };
    } else if (lowerTitle.includes('comedy') || lowerTitle.includes('carnival')) {
      // Comedy - Amber/Yellow
      return {
        iconBg: 'bg-softgold-900/80',
        underline: 'bg-softgold-500',
        button: 'bg-gradient-to-r from-softgold-500 to-softgold-700',
        tag: 'bg-softgold-900/80',
        highlight: 'text-softgold-300'
      };
    } else if (lowerTitle.includes('loved') || lowerTitle.includes('most loved')) {
      // Most Loved - Gold
      return {
        iconBg: 'bg-softgold-600/80',
        underline: 'bg-softgold-400',
        button: 'bg-gradient-to-r from-softgold-400 to-softgold-500',
        tag: 'bg-softgold-600/80',
        highlight: 'text-softgold-200'
      };
    } else if (lowerTitle.includes('crowd') || lowerTitle.includes('pleas')) {
      // Crowd Pleasers - Gold
      return {
        iconBg: 'bg-softgold-500/80',
        underline: 'bg-softgold-300',
        button: 'bg-gradient-to-r from-softgold-300 to-softgold-400',
        tag: 'bg-softgold-500/80',
        highlight: 'text-softgold-100'
      };
    } else {
      // Default - Gold
      return {
        iconBg: 'bg-softgold-800/80',
        underline: 'bg-gradient-gold-light',
        button: 'bg-gradient-gold-light',
        tag: 'bg-softgold-800/80',
        highlight: 'text-softgold-300'
      };
    }
  }, [title]);
  
  if (characters.length === 0) return null;

  return (
    <div className="mb-12 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {icon && (
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${colorScheme.iconBg} mr-2`}>
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-poppins font-medium text-white">
              {title}
            </h2>
            <div className={`h-0.5 w-10 mt-1 ${colorScheme.underline} rounded-full`}></div>
          </div>
        </div>
      </div>
      
      {/* Horizontal scrollable section without scroll indicators */}
      <div className="relative group">
        <div className="overflow-x-auto pb-3 -mx-6 px-6 custom-scrollbar hide-scrollbar-until-hover">
          <div className="flex space-x-4" style={{ minWidth: 'max-content' }}>
            {characters.map(({ slug, character, views, likes }) => (
              <div
                key={slug}
                className="card relative group overflow-hidden flex-shrink-0 w-52"
              >
                {/* Favorite Button */}
                <button
                  onClick={(e) => toggleFavorite(e, slug)}
                  className={`absolute top-2 right-2 z-20 p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 ${
                    favorites.includes(slug)
                      ? 'bg-nexus-purple-500 text-white'
                      : 'bg-nexus-neutral-800/70 text-nexus-neutral-30  hover:bg-nexus-neutral-300/30'
                  }`}
                >
                  <Star className="w-3 h-3" fill={favorites.includes(slug) ? "currentColor" : "none"} />
                </button>

                {/* Like button (display-only) */}
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 right-10 z-20 p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 bg-black/40 text-white"
                  aria-label="Likes"
                >
                  <Heart className="w-3 h-3" />
                </button>

                {/* Gradient overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-nexus-neutral-900/20 to-nexus-neutral-900/80 z-10"></div>

                {/* Character image with overlay */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                
                {/* Character info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                  <h3 className="text-base font-bold text-white mb-1">{character.name}</h3>
                  {character.role && (
                    <p className="text-xs text-sky-400">{character.role}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-300">
                    <span>{(views || 0).toLocaleString()} views</span>
                    <span>{(likes || 0).toLocaleString()} likes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* View All Modal */}
      {showAllModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-nexus-neutral-900/80 backdrop-blur-sm p-4 md:p-8 overflow-hidden" style={{ isolation: 'isolate' }}>
          <div onClick={(e) => e.stopPropagation()} className="bg-nexus-neutral-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-soft animate-fade-in flex flex-col relative">
            {/* Header with prominent close button */}
            <div className="p-5 border-b border-nexus-neutral-700 flex items-center justify-between sticky top-0 bg-nexus-neutral-800 z-10">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${colorScheme.iconBg}`}>
                    {icon}
                  </div>
                )}
                <h2 className="text-2xl font-poppins font-medium text-white">{title}</h2>
              </div>
              <button
                onClick={() => setShowAllModal(false)}
                className="p-2.5 bg-nexus-neutral-700 hover:bg-nexus-neutral-600 rounded-full text-white transition-colors flex items-center justify-center"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content with improved scrolling */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              <div className="character-grid character-grid--flush">
                {characters.map(({ slug, character, views, likes }) => (
                  <div key={slug} className="character-card">
                    {/* Favorite Button */}
                    <div className="character-card__actions">
                      <button
                        onClick={(e) => toggleFavorite(e, slug)}
                        className={`${favorites.includes(slug) ? 'bg-nexus-purple-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'} character-card__action`}
                      >
                        <Star className="w-4 h-4" fill={favorites.includes(slug) ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className={`bg-black/40 text-white hover:bg-black/60 character-card__action`}
                        aria-label="Likes"
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Character image with overlay */}
                    <div className="character-card__media">
                      <img
                        src={character.image}
                        alt={character.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const t = e.currentTarget as HTMLImageElement;
                          t.onerror = null;
                          t.src = 'https://i.pinimg.com/736x/8d/45/d7/8d45d7182a790992f538de186944f79c.jpg';
                        }}
                      />
                      <div className="character-card__overlay" />
                    </div>
                    
                    {/* Character info overlay */}
                    <div className="character-card__content">
                      <h3 className="character-card__title">{character.name}</h3>
                      {character.role && (
                        <p className="text-softgold-500 text-xs font-medium mb-1 line-clamp-1">{character.role}</p>
                      )}
                      {character.description && (
                        <p className="text-zinc-300 text-xs opacity-90 mb-2 line-clamp-2">{character.description}</p>
                      )}
                      <div className="character-card__stats">
                        <span className="flex items-center gap-1">
                          <span className="text-zinc-400">👁</span>
                          {(views || 0).toLocaleString()} views
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-red-400">♥</span>
                          {(likes || 0).toLocaleString()} likes
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer with prominent close button */}
            <div className="border-t border-nexus-neutral-700 p-4 sticky bottom-0 bg-nexus-neutral-800 z-10">
              <button 
                onClick={() => setShowAllModal(false)}
                className={`w-full py-3 ${colorScheme.button} text-white rounded-lg hover:opacity-90 transition-colors font-medium flex items-center justify-center space-x-2`}
              >
                <span>Close</span>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 