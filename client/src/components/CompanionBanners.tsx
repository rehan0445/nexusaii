import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp
} from 'lucide-react';

interface Character {
  id: string | number;
  name: string;
  role: string;
  image: string;
  personality?: {
    background?: string;
  };
  tags?: string[];
  views?: number;
  likes?: number;
}

interface CompanionBannersProps {
  characters: Record<string, Character>;
  views: Record<string, number>;
  characterLikes: Record<string, { likeCount: number }>;
  featuredCharacters?: string[];
}

const CompanionBanners: React.FC<CompanionBannersProps> = ({
  characters,
  views: _views,
  characterLikes: _characterLikes,
  featuredCharacters: propFeaturedCharacters
}) => {
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [bannerCharacters, setBannerCharacters] = useState<Array<[string, Character]>>([]);

  // Get specific featured characters for banners
  useEffect(() => {
    const characterEntries = Object.entries(characters);

    // Use provided featured characters or fallback to default logic
    const featuredCharacterSlugs = propFeaturedCharacters || [
      'batman-bruce',           // Batman
      'makima',                 // Makima
      'maul',                   // Darth Maul
      'dante-maroni',           // Dante Maroni
      'virat-kohli'             // Virat Kohli
    ];

    console.log('🎬 CAROUSEL DEBUG - Total characters available:', characterEntries.length);
    console.log('🎬 CAROUSEL DEBUG - Requested slugs:', featuredCharacterSlugs);
    console.log('🎬 CAROUSEL DEBUG - First 10 available character slugs:', characterEntries.slice(0, 10).map(([slug]) => slug));

    // Find the featured characters from available characters (exact match)
    const featuredCharacters = featuredCharacterSlugs
      .map(slug => {
        const found = characterEntries.find(([charSlug]) => charSlug === slug);
        if (!found) {
          console.warn(`⚠️ CAROUSEL: Character with slug "${slug}" NOT FOUND in available characters`);
        } else {
          console.log(`✅ CAROUSEL: Found character "${slug}" -> ${found[1].name}`);
        }
        return found;
      })
      .filter(Boolean) as Array<[string, Character]>;

    console.log('🎬 CAROUSEL DEBUG - Successfully matched:', featuredCharacters.length, 'out of', featuredCharacterSlugs.length);
    console.log('🎬 CAROUSEL DEBUG - Matched characters:', featuredCharacters.map(([slug, char]) => ({ slug, name: char.name })));

    // ONLY use the characters we explicitly requested - DO NOT fill with random characters
    setBannerCharacters(featuredCharacters);
  }, [characters, propFeaturedCharacters]);

  // Auto-rotate banners every 5 seconds
  useEffect(() => {
    if (bannerCharacters.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % bannerCharacters.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [bannerCharacters.length]);

  const nextBanner = () => {
    setCurrentBanner(prev => (prev + 1) % bannerCharacters.length);
  };

  const prevBanner = () => {
    setCurrentBanner(prev => (prev - 1 + bannerCharacters.length) % bannerCharacters.length);
  };

  const goToBanner = (index: number) => {
    setCurrentBanner(index);
  };

  // Don't show carousel until we have characters
  if (bannerCharacters.length === 0) {
    console.log('⏳ CAROUSEL: No banner characters loaded yet, hiding carousel');
    return null;
  }

  // Also check if characters object is empty (not loaded yet)
  if (Object.keys(characters).length === 0) {
    console.log('⏳ CAROUSEL: Characters not loaded yet, hiding carousel');
    return null;
  }

  const [currentSlug, currentCharacter] = bannerCharacters[currentBanner];

  return (
    <div className="relative mb-6 sm:mb-8 pt-1">
      {/* Main Banner */}
      <button
        type="button"
        className="relative h-[22vh] min-h-[180px] md:h-[40vh] md:min-h-[360px] rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer w-full text-left"
        aria-label={`View ${currentCharacter.name} profile`}
        onClick={() => navigate(`/character/${currentSlug}`)}
        onKeyDown={(e) => {
          if (e.key === ' '){
            e.preventDefault();
          }
        }}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 transition-all duration-700"
          style={{
            backgroundImage: `url(${currentCharacter.image})`,
            backgroundSize: '100% auto',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
          }}
        />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        
        {/* Navigation Arrows */}
        <div
          onClick={(e) => { e.stopPropagation(); prevBanner(); }}
          className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 md:p-3 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100 z-10 cursor-pointer"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              prevBanner();
            }
          }}
          aria-label="Previous banner"
        >
          <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8" />
        </div>

        <div
          onClick={(e) => { e.stopPropagation(); nextBanner(); }}
          className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 md:p-3 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100 z-10 cursor-pointer"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              nextBanner();
            }
          }}
          aria-label="Next banner"
        >
          <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-end p-3 sm:p-6 lg:p-8 md:p-10">
          <div className="max-w-2xl w-full md:max-w-4xl">
            {/* Trending Badge */}
            <div className="flex items-center space-x-1 sm:space-x-2 mb-2 sm:mb-3 md:mb-4">
              <div className="flex items-center space-x-1 px-2 sm:px-3 py-0.5 sm:py-1 bg-red-500 rounded-full">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" />
                <span className="text-white text-xs md:text-sm font-bold">TRENDING</span>
              </div>
              <div className="text-zinc-300 text-xs sm:text-sm md:text-base">#{currentBanner + 1} Featured</div>
            </div>

            {/* Character Info */}
            <h1 className="text-xl sm:text-3xl lg:text-5xl md:text-6xl font-bold text-white mb-1 sm:mb-2 md:mb-4">
              {currentCharacter.name}
            </h1>
            <p className="text-softgold-500 text-sm sm:text-lg lg:text-xl md:text-2xl font-medium mb-2 sm:mb-3">
              {currentCharacter.role}
            </p>
            
            {/* Removed description and stats per request */}

            {/* Action buttons removed; entire banner is clickable to open chat */}
          </div>
        </div>

        {/* Character Avatar */}
        <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 sm:border-4 border-white/20 backdrop-blur-sm">
            <img
              src={currentCharacter.image}
              alt={currentCharacter.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </button>

      {/* Banner Indicators */}
      <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 mt-3 sm:mt-4">
        {bannerCharacters.map(([slug], index) => (
          <button
            key={`indicator-${slug}`}
            onClick={() => goToBanner(index)}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
              index === currentBanner 
                ? 'bg-softgold-500 w-6 sm:w-8' 
                : 'bg-zinc-600 hover:bg-zinc-500 w-1.5 sm:w-2'
            }`}
          />
        ))}
      </div>

      {/* Mini Banners Preview removed per request */}
    </div>
  );
};

export default CompanionBanners;
