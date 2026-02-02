import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageCircle, Bot, Moon, School, Users, Menu } from 'lucide-react';
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
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  // Feature navigation items
  const features = [
    { id: 'companion', label: 'Companion', icon: Bot, route: '/companion' },
    { id: 'darkroom', label: 'Dark Room', icon: Moon, route: '/arena/darkroom' },
    { id: 'campus', label: 'Campus', icon: School, route: '/campus/general/confessions' },
    { id: 'hangouts', label: 'Hangouts', icon: Users, route: '/arena/hangout' },
  ];

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

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
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

  const handleFeatureClick = (route: string) => {
    onClose();
    navigate(route);
  };

  if (!isOpen) return null;

  const currentCharacter = characters[currentIndex];
  const slug = currentCharacter ? Object.keys(currentCharacter)[0] || '' : '';
  const charData = currentCharacter ? currentCharacter[slug as keyof typeof currentCharacter] as AnimeCharacter : null;

  if (!charData) return null;

  return (
    <div 
      className="fixed inset-0 z-[300] bg-black flex"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Desktop Layout */}
      <div className="hidden md:flex w-full h-full">
        {/* Left Vertical Feature Bar */}
        <aside 
          className={`fixed left-0 top-0 h-full border-r border-softgold-500/20 bg-black/80 backdrop-blur-sm flex flex-col items-start justify-start pt-8 px-6 transition-all duration-300 z-[305] overflow-hidden ${
            isSidebarOpen ? 'w-64 translate-x-0 opacity-100' : 'w-0 -translate-x-full opacity-0'
          }`}
        >
          {/* Hamburger Menu & Nexus Logo/Name */}
          <div className={`mb-12 w-full flex items-center gap-3 transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg bg-black/40 hover:bg-softgold-500/20 text-softgold-400 hover:text-softgold-300 border border-softgold-500/30 hover:border-softgold-500/50 transition-all duration-300 group"
              aria-label="Close Menu"
              style={{
                boxShadow: '0 0 0 0 rgba(244, 227, 181, 0)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 12px rgba(244, 227, 181, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 0 rgba(244, 227, 181, 0)';
              }}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-softgold-400 via-softgold-500 to-softgold-600 bg-clip-text text-transparent">
              Nexus
            </h1>
          </div>

          {/* Feature List */}
          <nav className={`flex flex-col gap-6 w-full transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}>
            {features.map((feature) => {
              const Icon = feature.icon;
              const isHovered = hoveredFeature === feature.id;
              
              return (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature.route)}
                  onMouseEnter={() => setHoveredFeature(feature.id)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className="group relative flex items-center gap-3 text-left transition-all duration-300"
                >
                  {/* Hover Glow Effect */}
                  <div 
                    className={`absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-softgold-500 to-softgold-600 rounded-r-full transition-all duration-300 ${
                      isHovered ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'
                    }`}
                    style={{
                      boxShadow: isHovered ? '0 0 12px rgba(244, 227, 181, 0.6)' : 'none'
                    }}
                  />
                  
                  {/* Icon */}
                  <div className={`p-2 rounded-lg transition-all duration-300 ${
                    isHovered 
                      ? 'bg-softgold-500/20 text-softgold-400' 
                      : 'bg-transparent text-zinc-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {/* Label */}
                  <span 
                    className={`text-base font-medium transition-all duration-300 ${
                      isHovered 
                        ? 'text-softgold-400' 
                        : 'text-zinc-400'
                    }`}
                    style={{
                      textShadow: isHovered ? '0 0 8px rgba(244, 227, 181, 0.4)' : 'none'
                    }}
                  >
                    {feature.label}
                  </span>
                  
                  {/* Underline on hover */}
                  <div 
                    className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-softgold-500 to-softgold-600 transition-all duration-300 ${
                      isHovered ? 'w-full opacity-100' : 'w-0 opacity-0'
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Showcase Section */}
        <div className={`flex-1 flex items-center justify-center relative transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
          {/* Hamburger Menu Button (when sidebar is closed) */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-6 left-6 z-[310] w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-softgold-400 hover:bg-black/80 hover:border-softgold-500/50 border border-softgold-500/30 transition-all duration-300 group"
              aria-label="Open Menu"
              style={{
                boxShadow: '0 0 0 0 rgba(244, 227, 181, 0)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 12px rgba(244, 227, 181, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 0 rgba(244, 227, 181, 0)';
              }}
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Top-Right Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-[310] w-10 h-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/80 hover:border-softgold-500/50 border border-transparent transition-all duration-300 group"
            aria-label="Close"
            style={{
              boxShadow: '0 0 0 0 rgba(244, 227, 181, 0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 12px rgba(244, 227, 181, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 0 rgba(244, 227, 181, 0)';
            }}
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Showcase Card - Exact same as before, centered */}
          <div className="relative w-full max-w-md aspect-[3/4] mx-auto">
            <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-softgold-500/30">
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
                  <p className="text-lg text-softgold-400 font-medium mb-4 drop-shadow-lg">
                    {charData.role}
                  </p>

                  {/* Character Description */}
                  <p className="text-sm text-white/90 mb-6 leading-relaxed drop-shadow-md max-w-xl">
                    {charData.description}
                  </p>

                  {/* Chat Button */}
                  <button
                    onClick={() => handleChatNow(charData, slug)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-softgold-500 via-softgold-600 to-softgold-700 text-black rounded-lg font-medium text-base shadow-xl hover:shadow-softgold-500/50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2 group"
                  >
                    <MessageCircle className="w-5 h-5 group-hover:animate-bounce" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Container - Keep original mobile design */}
      <div className="md:hidden w-full h-full max-w-sm max-h-[100vh] mx-auto bg-black relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-[310] w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

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
      </div>
    </div>
  );
};

export default EditorChoiceReels;

