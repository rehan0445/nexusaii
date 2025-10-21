import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageCircle, Star } from 'lucide-react';
import { incrementView } from '../utils/viewsManager';
import { AnimeCharacter } from '../utils/animeCharacters';

interface EditorChoiceReelsProps {
  isOpen: boolean;
  onClose: () => void;
  characters: AnimeCharacter[];
}

const EditorChoiceReels: React.FC<EditorChoiceReelsProps> = ({ isOpen, onClose, characters }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        scrollToIndex(currentIndex - 1);
      } else if (e.key === 'ArrowDown' && currentIndex < characters.length - 1) {
        e.preventDefault();
        scrollToIndex(currentIndex + 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, characters.length, onClose]);

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0 && currentIndex < characters.length - 1) {
        // Swipe up - next character
        scrollToIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe down - previous character
        scrollToIndex(currentIndex - 1);
      }
    }
  };

  // Handle mouse wheel scroll
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (isScrolling) return;

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      if (e.deltaY > 0 && currentIndex < characters.length - 1) {
        scrollToIndex(currentIndex + 1);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        scrollToIndex(currentIndex - 1);
      }
    }, 50);
  };

  const scrollToIndex = (index: number) => {
    setIsScrolling(true);
    setCurrentIndex(index);
    
    setTimeout(() => {
      setIsScrolling(false);
    }, 600);
  };

  const handleChatNow = async (character: AnimeCharacter, slug: string) => {
    try {
      await incrementView(slug);
    } catch (error) {
      console.error('Failed to increment view:', error);
    }
    navigate(`/chat/${slug}`);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[300] bg-black flex items-center justify-center"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Container */}
      <div className="w-full h-full max-w-sm max-h-[100vh] mx-auto bg-black relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-[310] w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          aria-label="Close Editor's Choice"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Editor's Choice Badge */}
        <div className="absolute top-6 left-6 z-[310] flex items-center space-x-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-4 py-2 rounded-full shadow-lg">
          <Star className="w-5 h-5 text-white fill-white animate-pulse" />
          <span className="text-white font-bold text-sm">Editor's Choice</span>
        </div>


        {/* Reels Container */}
        <div
          ref={containerRef}
          className="h-full w-full overflow-hidden"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          <div
            className="h-full transition-transform duration-600 ease-out"
            style={{
              transform: `translateY(-${currentIndex * 100}vh)`
            }}
          >
            {characters.map((character, index) => {
              const slug = Object.keys(character)[0] || '';
              const charData = character[slug as keyof typeof character] as AnimeCharacter;
              
              return (
                <div
                  key={slug || `char-${index}`}
                  className="h-full w-full relative flex items-center justify-center"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Character Image Background */}
                  <div className="absolute inset-0">
                    <img
                      src={charData.image}
                      alt={charData.name}
                      className="w-full h-full object-cover"
                    />
                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
                  </div>

                  {/* Character Info - Bottom Section */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-[305]">
                    <div className="max-w-2xl mx-auto">
                      {/* Character Name */}
                      <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
                        {charData.name}
                      </h2>
                      
                      {/* Character Role */}
                      <p className="text-lg text-amber-400 font-medium mb-4 drop-shadow-lg">
                        {charData.role}
                      </p>

                      {/* Character Description */}
                      <p className="text-sm text-white/90 mb-6 leading-relaxed drop-shadow-md max-w-xl">
                        {charData.description}
                      </p>

                      {/* Chat Button */}
                      <button
                        onClick={() => handleChatNow(charData, slug)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white rounded-lg font-medium text-base shadow-xl hover:shadow-amber-500/50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 group"
                      >
                        <MessageCircle className="w-5 h-5 group-hover:animate-bounce" />
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>


                </div>
              );
            })}
          </div>
        </div>

        {/* Swipe Hint - Show on first load */}
        {currentIndex === 0 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[305] flex flex-col items-center animate-bounce">
            <div className="w-8 h-8 border-2 border-white/70 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white/70 rounded-full"></div>
            </div>
            <span className="text-white/70 text-sm mt-2">Swipe up for more</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorChoiceReels;

