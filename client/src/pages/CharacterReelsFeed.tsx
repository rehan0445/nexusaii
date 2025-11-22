import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageCircle, X, ArrowLeft, Shuffle, Filter } from 'lucide-react';
import { useCharacterContext } from '../contexts/CharacterContext';
import { incrementView } from '../utils/viewsManager';

interface CharacterReelsFeedProps {
  initialIndex?: number;
  onClose?: () => void;
}

const CharacterReelsFeed: React.FC<CharacterReelsFeedProps> = ({ 
  initialIndex: propInitialIndex,
  onClose 
}) => {
  const navigate = useNavigate();
  const { initialIndex: paramIndex } = useParams<{ initialIndex?: string }>();
  
  // Use prop, then URL param, then default to 0
  const initialIndex = propInitialIndex ?? (paramIndex ? Number.parseInt(paramIndex, 10) : 0);
  const { characters, loading } = useCharacterContext();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [shuffledArray, setShuffledArray] = useState<Array<{ slug: string; character: any }>>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Convert characters object to array for easier indexing
  const charactersArray = useMemo(() => 
    Object.entries(characters).map(([slug, character]) => ({
      slug,
      character
    })), [characters]);

  // Get all unique tags from characters
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const character of Object.values(characters)) {
      if (character.tags) {
        for (const tag of character.tags) {
          tags.add(String(tag).toLowerCase());
        }
      }
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [characters]);

  // Popular filter tags
  const popularTags = useMemo(() => {
    const commonTags = ['hubby', 'waifu', 'anime', 'marvel', 'dc', 'star wars', 'helper'];
    return commonTags.filter(tag => allTags.includes(tag.toLowerCase()));
  }, [allTags]);

  // Filter characters by selected tags
  const filteredCharactersArray = useMemo(() => {
    if (selectedTags.length === 0) return charactersArray;
    
    const selectedTagsSet = new Set(selectedTags.map(t => t.toLowerCase()));
    
    return charactersArray.filter(({ character }) => {
      if (!character.tags || character.tags.length === 0) return false;
      const characterTags = new Set(character.tags.map((tag: string) => String(tag).toLowerCase()));
      for (const selectedTag of selectedTagsSet) {
        if (characterTags.has(selectedTag)) {
          return true;
        }
      }
      return false;
    });
  }, [charactersArray, selectedTags]);

  // Initialize shuffled array
  useEffect(() => {
    if (filteredCharactersArray.length > 0 && shuffledArray.length === 0) {
      const shuffled = [...filteredCharactersArray].sort(() => Math.random() - 0.5);
      setShuffledArray(shuffled);
    } else if (filteredCharactersArray.length !== shuffledArray.length) {
      // Reset shuffle when filter changes
      const shuffled = [...filteredCharactersArray].sort(() => Math.random() - 0.5);
      setShuffledArray(shuffled);
      setCurrentIndex(0);
    }
  }, [filteredCharactersArray.length]);

  // Use shuffled array if available, otherwise use filtered
  const displayArray = shuffledArray.length > 0 ? shuffledArray : filteredCharactersArray;

  // Handle scroll snap
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const cardHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / cardHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < displayArray.length) {
      setCurrentIndex(newIndex);
      
      // Track view for the character
      const currentCharacter = displayArray[newIndex];
      if (currentCharacter) {
        incrementView(currentCharacter.slug).catch(console.error);
      }
    }
  }, [currentIndex, displayArray]);

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number) => {
    if (!scrollContainerRef.current || index < 0 || index >= displayArray.length) return;
    
    const container = scrollContainerRef.current;
    const cardHeight = container.clientHeight;
    container.scrollTo({
      top: index * cardHeight,
      behavior: 'smooth'
    });
  }, [displayArray.length]);

  // Shuffle characters
  const handleShuffle = useCallback(() => {
    const shuffled = [...filteredCharactersArray].sort(() => Math.random() - 0.5);
    setShuffledArray(shuffled);
    setCurrentIndex(0);
    scrollToIndex(0);
  }, [filteredCharactersArray, scrollToIndex]);

  // Toggle tag filter
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => {
      const tagLower = tag.toLowerCase();
      if (prev.includes(tagLower)) {
        return prev.filter(t => t !== tagLower);
      } else {
        return [...prev, tagLower];
      }
    });
  }, []);


  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToIndex(Math.min(currentIndex + 1, displayArray.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToIndex(Math.max(currentIndex - 1, 0));
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, displayArray.length, scrollToIndex, onClose]);

  // Scroll to initial index on mount
  useEffect(() => {
    if (displayArray.length > 0 && initialIndex > 0) {
      setTimeout(() => scrollToIndex(initialIndex), 100);
    }
  }, [displayArray.length, initialIndex, scrollToIndex]);

  // Handle Escape key to close filter modal
  useEffect(() => {
    if (!showFilterModal) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFilterModal(false);
      }
    };
    
    globalThis.addEventListener('keydown', handleEscape);
    return () => globalThis.removeEventListener('keydown', handleEscape);
  }, [showFilterModal]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-xl">Loading characters...</div>
      </div>
    );
  }

  if (charactersArray.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-white text-xl">No characters available</div>
      </div>
    );
  }

  // Truncate description
  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Desktop background overlay */}
      <div className="hidden md:block fixed inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />
      
      {/* Main container - responsive */}
      <div className="relative w-full h-full md:flex md:items-center md:justify-center md:py-4 md:px-4">
        {/* Feed container - full width on mobile, YouTube Shorts style on desktop */}
        <div className="w-full h-full md:w-[420px] md:h-[calc(100vh-2rem)] md:max-h-[800px] md:rounded-xl md:overflow-hidden bg-black md:shadow-2xl relative md:border md:border-zinc-800">
          {/* Back button - top left (mobile only) */}
          <button
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                navigate(-1);
              }
            }}
            className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all md:hidden"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Desktop Navigation - top left */}
          {!onClose && (
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all hidden md:flex items-center gap-2"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
          )}

          {/* Close button - top right (desktop only, or if onClose prop provided) */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all hidden md:block"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          {/* Desktop Action Buttons - Right Side (like YouTube Shorts) */}
          {displayArray.length > 0 && (
            <div className="hidden md:flex absolute right-3 z-40 flex-col items-center gap-3" style={{ top: '50%', transform: 'translateY(-50%)' }}>
              {/* Shuffle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShuffle();
                }}
                className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-all shadow-lg hover:scale-110"
                aria-label="Shuffle"
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">Shuffle</span>
              </button>

              {/* Chat Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentCharacter = displayArray[currentIndex];
                  if (currentCharacter) {
                    navigate(`/chat/${currentCharacter.slug}`);
                  }
                }}
                className="relative flex flex-col items-center gap-1.5 p-2.5 rounded-full bg-softgold-500 text-black hover:bg-softgold-400 transition-all shadow-lg hover:scale-110"
                aria-label="Chat"
                title="Chat"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">Chat</span>
              </button>

              {/* Filter Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilterModal(true);
                }}
                className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg hover:scale-110 ${
                  selectedTags.length > 0
                    ? 'bg-softgold-500 text-black hover:bg-softgold-400'
                    : 'bg-black/60 text-white hover:bg-black/80'
                }`}
                aria-label="Filter"
                title="Filter"
              >
                <Filter className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-tight">Filter</span>
                {selectedTags.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {selectedTags.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Scroll container with snap */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="w-full h-full md:h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
            style={{
              scrollBehavior: 'smooth',
            }}
          >
            {displayArray.map(({ slug, character }, index) => (
              <div
                key={slug}
                ref={(el) => (cardRefs.current[index] = el)}
                className="w-full h-full md:h-full snap-start snap-always flex-shrink-0 relative"
              >
                {/* Character Image Background */}
                <div className="absolute inset-0">
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://i.pinimg.com/736x/8d/45/d7/8d45d7182a790992f538de186944f79c.jpg';
                    }}
                  />
                  
                  {/* Gradient overlay at bottom for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>


                {/* Bottom Info Section - with extra padding on mobile to prevent overlap */}
                <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-24 md:pb-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      {/* Character Name */}
                      <h2 className="text-white text-2xl md:text-xl font-bold mb-1 line-clamp-1">
                        {character.name}
                      </h2>
                      
                      {/* Creator Name - Clickable */}
                      {character.creator && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/creator/${encodeURIComponent(character.creator)}`);
                          }}
                          className="text-white/70 text-sm md:text-xs mb-2 hover:text-white transition-colors text-left"
                        >
                          by {character.creator}
                        </button>
                      )}
                      
                      {/* Description */}
                      <p className="text-white/90 text-sm md:text-xs leading-relaxed line-clamp-2">
                        {truncateDescription(character.description || character.personality?.background || '')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons Bar - Mobile only */}
      {displayArray.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
          <div className="flex items-center justify-between py-4 px-4 gap-3">
            {/* Shuffle Button - Left */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShuffle();
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-black/50 backdrop-blur-md text-white font-semibold hover:bg-black/70 transition-all shadow-lg"
              aria-label="Shuffle"
            >
              <Shuffle className="w-5 h-5" />
              <span className="hidden sm:inline">Shuffle</span>
            </button>

            {/* Chat Button - Center */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentCharacter = displayArray[currentIndex];
                if (currentCharacter) {
                  navigate(`/chat/${currentCharacter.slug}`);
                }
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-softgold-500 text-black font-semibold hover:bg-softgold-400 transition-all shadow-lg flex-1 max-w-[200px] justify-center"
              aria-label="Chat"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Chat</span>
            </button>

            {/* Filter Button - Right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFilterModal(true);
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-full backdrop-blur-md text-white font-semibold transition-all shadow-lg ${
                selectedTags.length > 0
                  ? 'bg-softgold-500 text-black hover:bg-softgold-400'
                  : 'bg-black/50 hover:bg-black/70'
              }`}
              aria-label="Filter"
            >
              <Filter className="w-5 h-5" />
              <span className="hidden sm:inline">Filter</span>
              {selectedTags.length > 0 && (
                <span className="ml-1 bg-black/30 px-1.5 py-0.5 rounded-full text-xs">
                  {selectedTags.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center"
        >
          {/* Backdrop */}
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFilterModal(false)}
            aria-label="Close filter modal"
          />
          
          {/* Modal Content */}
          <div 
            className="relative w-full max-h-[80vh] bg-zinc-900 rounded-t-3xl md:rounded-3xl border-t border-white/10 md:border md:border-white/10 md:max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
              }
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Filter by Tags</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="overflow-y-auto max-h-[60vh] p-6">
              {/* Popular Tags */}
              {popularTags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-zinc-400 mb-3">Popular</h3>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag.toLowerCase());
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-4 py-2 rounded-full text-xs font-medium transition-all border ${
                            isSelected
                              ? 'bg-rosegold-500 text-white border-rosegold-400 shadow-lg'
                              : 'bg-rosegold-500/20 text-rosegold-300 border-rosegold-500/40 hover:bg-rosegold-500/30 hover:border-rosegold-400'
                          }`}
                        >
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Tags */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 mb-3">All Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all border ${
                          isSelected
                            ? 'bg-rosegold-500 text-white border-rosegold-400 shadow-lg'
                            : 'bg-rosegold-500/20 text-rosegold-300 border-rosegold-500/40 hover:bg-rosegold-500/30 hover:border-rosegold-400'
                        }`}
                      >
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clear Filters */}
              {selectedTags.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={() => {
                      setSelectedTags([]);
                      setShowFilterModal(false);
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterReelsFeed;

