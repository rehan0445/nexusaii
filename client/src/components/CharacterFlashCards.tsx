import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Filter,
  Zap,
  Book,
  Ghost,
  Skull,
  Sparkles,
  Eye
} from 'lucide-react';
import { Character } from '../utils/characters';

interface CharacterFlashCardsProps {
  characters: Record<string, Character>;
  favorites: string[];
  onToggleFavorite: (slug: string) => void;
  onCharacterClick: (slug: string) => void;
  characterLikes: Record<string, { likeCount: number; userLiked: boolean }>;
  onLike: (e: React.MouseEvent, slug: string) => void;
  likeLoading?: Record<string, boolean>;
  views?: Record<string, number>;
}

interface FlashCard {
  slug: string;
  character: Character;
  category: string;
}

const CATEGORIES = [
  { 
    id: 'all', 
    name: 'All Characters', 
    icon: <Sparkles className="w-4 h-4" />,
    color: 'from-softgold-500 to-orange-500',
    tags: []
  },
  { 
    id: 'exciting', 
    name: 'Exciting Characters', 
    icon: <Zap className="w-4 h-4" />,
    color: 'from-orange-500 to-red-500',
    tags: ['action', 'adventure', 'warrior', 'fighter', 'hero', 'battle', 'ninja', 'pirate', 'saiyan']
  },
  { 
    id: 'study-buddies', 
    name: 'Study Buddies', 
    icon: <Book className="w-4 h-4" />,
    color: 'from-blue-500 to-purple-500',
    tags: ['student', 'teacher', 'smart', 'genius', 'academic', 'scholar', 'detective', 'scientist', 'alchemist']
  },
  { 
    id: 'supernatural', 
    name: 'Supernatural', 
    icon: <Ghost className="w-4 h-4" />,
    color: 'from-purple-500 to-pink-500',
    tags: ['magic', 'supernatural', 'demon', 'angel', 'vampire', 'witch', 'spirit', 'soul reaper', 'shinigami', 'geass', 'power']
  },
  { 
    id: 'thriller-horror', 
    name: 'Thriller & Horror', 
    icon: <Skull className="w-4 h-4" />,
    color: 'from-red-600 to-black',
    tags: ['death', 'dark', 'horror', 'thriller', 'killer', 'monster', 'ghoul', 'titan', 'kira', 'vengeful']
  }
];

export default function CharacterFlashCards({ 
  characters, 
  favorites, 
  onToggleFavorite, 
  onCharacterClick,
  characterLikes,
  onLike,
  likeLoading = {},
  views = {}
}: CharacterFlashCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Categorize characters based on tags (optimized)
  const categorizedCards = useMemo(() => {
    if (Object.keys(characters).length === 0) return [];

    const cards: FlashCard[] = [];

    Object.entries(characters).forEach(([slug, character]) => {
      if (!character.tags) return;

      const characterTags = character.tags.map(tag => tag.toLowerCase());

      // Determine category based on tags (faster lookup)
      let category = 'general';

      // Check each category's tags for matches
      for (let i = 1; i < CATEGORIES.length; i++) {
        if (CATEGORIES[i].tags.some(tag => characterTags.includes(tag))) {
          category = CATEGORIES[i].id;
          break;
        }
      }

      cards.push({ slug, character, category });
    });

    return cards;
  }, [characters]);

  // Filter cards based on selected category
  const filteredCards = useMemo(() => {
    if (selectedCategory === 'all') return categorizedCards;
    return categorizedCards.filter(card => card.category === selectedCategory);
  }, [categorizedCards, selectedCategory]);

  const currentCard = filteredCards[currentIndex];

  // Reset index when category changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedCategory]);

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const shuffleCards = () => {
    const randomIndex = Math.floor(Math.random() * filteredCards.length);
    setCurrentIndex(randomIndex);
  };

  const handleCardClick = () => {
    if (currentCard) {
      onCharacterClick(currentCard.slug);
    }
  };

  if (filteredCards.length === 0) {
    return (
      <div className="bg-zinc-800/50 rounded-2xl p-8 text-center border border-zinc-700/50">
        <div className="text-zinc-400 mb-4">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-white mb-2">No Characters Found</h3>
          <p>No characters match the selected category. Try selecting a different category.</p>
        </div>
      </div>
    );
  }

  const currentCategoryData = CATEGORIES.find(cat => cat.id === selectedCategory) || CATEGORIES[0];

  return (
    <div className="space-y-6">
      {/* Header with Category Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${currentCategoryData.color}`}>
            {currentCategoryData.icon}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Character Flash Cards</h2>
            <p className="text-sm text-zinc-400">{currentCategoryData.name}</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Category Filter Pills */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {category.icon}
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Flash Card Container */}
      <div className="relative">
        {/* Card Counter */}
        <div className="text-center mb-4">
          <span className="text-sm text-zinc-400">
            {currentIndex + 1} of {filteredCards.length}
          </span>
        </div>

        {/* Main Flash Card */}
        <div className="relative mx-auto max-w-sm">
          {/* Card Container */}
          <div 
            className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#F4E3B5]/40 hover:border-[#F4E3B5]/80 cursor-pointer group transition-all duration-300"
            onClick={handleCardClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`View ${currentCard?.character.name} character details`}
          >
            {/* Character Image */}
            <img
              src={currentCard?.character.image}
              alt={currentCard?.character.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://i.pinimg.com/736x/8d/45/d7/8d45d7182a790992f538de186944f79c.jpg';
              }}
            />
            
            {/* Gradient overlay for better button visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* View count display */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-black/50 text-white px-3 py-2 rounded-full backdrop-blur-sm">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">{currentCard ? (views[currentCard.slug]?.toLocaleString() || '0') : '0'} views</span>
              </div>
            </div>
          </div>

          {/* Character info below card */}
          <div className="mt-4 text-center">
            <h3 className="text-lg font-bold text-white mb-1">{currentCard?.character.name}</h3>
            <p className="text-softgold-500 text-sm font-medium">{currentCard?.character.role}</p>
          </div>
        </div>


        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={prevCard}
            disabled={filteredCards.length <= 1}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={shuffleCards}
            disabled={filteredCards.length <= 1}
            className="p-3 bg-gradient-to-r from-softgold-500 to-orange-500 hover:from-softgold-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-black transition-all"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={nextCard}
            disabled={filteredCards.length <= 1}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  );
}
