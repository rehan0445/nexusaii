import React from 'react';
import { Heart, Star } from 'lucide-react';

interface CharacterCardProps {
  readonly character: {
    name: string;
    role?: string;
    image: string;
  };
  slug: string;
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, slug: string) => void;
  onCharacterClick: (slug: string) => void;
  likes?: number;
  onLike?: (e: React.MouseEvent, slug: string) => void;
  likeLoading?: boolean;
  showNewBadge?: boolean;
}

export default function CharacterCard({
  character,
  slug,
  favorites,
  onToggleFavorite,
  onCharacterClick,
  likes = 0,
  onLike,
  likeLoading = false,
  showNewBadge = false
}: Readonly<CharacterCardProps>) {
  return (
    <div className="flex-shrink-0 w-full">
      {/* Card Container */}
      <div 
        className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#F4E3B5]/30 hover:border-[#F4E3B5]/60 cursor-pointer group mb-2 transition-all duration-300"
        onClick={() => onCharacterClick(slug)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCharacterClick(slug);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`View ${character.name} character details`}
      >
        {/* Character Image */}
        <img
          src={character.image}
          alt={character.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://i.pinimg.com/736x/8d/45/d7/8d45d7182a790992f538de186944f79c.jpg';
          }}
        />
        
        {/* Gradient overlay for better button visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* NEW Badge */}
        {showNewBadge && (
          <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
            NEW
          </div>
        )}

        {/* Action buttons inside card */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          {/* Like button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onLike) onLike(e, slug);
            }}
            disabled={likeLoading}
            className="flex items-center gap-1 bg-black/50 hover:bg-black/70 text-white px-2 py-1 rounded-full backdrop-blur-sm transition-all disabled:opacity-50"
          >
            <Heart className="w-3 h-3" />
            <span className="text-xs font-medium">{likes}</span>
          </button>

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(e, slug);
            }}
            className={`p-1.5 rounded-full backdrop-blur-sm transition-all ${
              favorites.includes(slug)
                ? 'bg-softgold-500 text-black'
                : 'bg-black/50 text-white hover:bg-black/70'
            }`}
          >
            <Star className="w-3 h-3" fill={favorites.includes(slug) ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Character info below card */}
      <div className="text-center">
        <h3 className="text-xs font-semibold text-white mb-0.5 line-clamp-1">{character.name}</h3>
        <p className="text-softgold-500 text-[10px] font-medium line-clamp-1">{character.role || 'AI Character'}</p>
      </div>
    </div>
  );
}
