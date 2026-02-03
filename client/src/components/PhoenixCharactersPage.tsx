import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, TrendingUp, Video, ChevronLeft, Bookmark } from 'lucide-react';
import { useCharacterContext } from '../contexts/CharacterContext';
import { useBookmarks } from '../contexts/BookmarksContext';
import { CharacterLeaderboard } from './CharacterLeaderboard';
import { CommunityMilestone } from './CommunityMilestone';
import { getRankedCharacters, getViewCountsForCharacters } from '../utils/viewsManager';
import { getFaceCenterFromUrl, type FaceCenter } from '../utils/carouselFaceFocus';

interface Character {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  image?: string;
  tags?: string[];
  category?: string;
  chat_count?: number;
  role?: string;
}

const TAG_CATEGORIES = [
  { id: 'waifu', label: 'Waifu', icon: '💕' },
  { id: 'marvel', label: 'Marvel', icon: '🦸' },
  { id: 'dark romance', label: 'Dark Romance', icon: '🌹' },
  { id: 'helper', label: 'Helpers', icon: '🤝' },
  { id: 'hubby', label: 'Hubby', icon: '🔥' },
  { id: 'dc', label: 'DC', icon: '🦇' },
  { id: 'star wars', label: 'Star Wars', icon: '⭐' },
  { id: 'genshin impact', label: 'Genshin Impact', icon: '⚔️' },
  { id: 'harry potter', label: 'Harry Potter', icon: '⚡' },
  { id: 'vtuber', label: 'VTubers', icon: '📺' },
];

export function PhoenixCharactersPage() {
  const { characters: charactersMap, loading } = useCharacterContext();
  const { toggleCharacterBookmark, isCharacterBookmarked } = useBookmarks();
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [viewsBySlug, setViewsBySlug] = useState<Record<string, number>>({});
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [faceFocusByCharId, setFaceFocusByCharId] = useState<Record<string, FaceCenter>>({});
  const touchStartX = useRef<number | null>(null);
  const requestedFaceIds = useRef<Set<string>>(new Set());
  const navigate = useNavigate();

  // Fetch view counts: leaderboard (top 100) + bulk for ALL characters so non-trending show views
  useEffect(() => {
    let cancelled = false;
    getRankedCharacters(100).then((ranked) => {
      if (cancelled) return;
      const map: Record<string, number> = {};
      ranked.forEach((r) => { map[r.id] = r.views; });
      setViewsBySlug(prev => ({ ...prev, ...map }));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const ids = Object.keys(charactersMap);
    if (ids.length === 0) return;
    let cancelled = false;
    getViewCountsForCharacters(ids).then((counts) => {
      if (!cancelled && Object.keys(counts).length > 0) {
        setViewsBySlug(prev => ({ ...prev, ...counts }));
      }
    });
    return () => { cancelled = true; };
  }, [charactersMap]);

  // Convert characters map to array
  const characters = useMemo(() => {
    return Object.entries(charactersMap).map(([id, char]) => ({
      id,
      name: char.name || 'Character',
      description: char.description,
      image_url: char.image,
      image: char.image,
      tags: char.tags || [],
      category: char.role,
      chat_count: 0
    }));
  }, [charactersMap]);

  // Top 5 characters for carousel (by tag, sorted by views)
  const carouselCharacters = useMemo(() => {
    let filtered = characters.filter(char => {
      // Check if character matches the selected tag
      const matchesTag = !activeTag || 
        char.tags?.some(tag => tag.toLowerCase() === activeTag.toLowerCase()) ||
        char.tags?.some(tag => tag.toLowerCase().includes(activeTag.toLowerCase())) ||
        char.category?.toLowerCase() === activeTag.toLowerCase();
      return matchesTag;
    });

    // Sort by views and take top 5
    return filtered
      .map(char => ({
        ...char,
        views: viewsBySlug[char.id] ?? 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [characters, activeTag, viewsBySlug]);

  const filteredCharacters = useMemo(() => {
    let filtered = characters.filter(char => {
      // Check if character matches the selected tag
      const matchesTag = !activeTag ||
        char.tags?.some(tag => tag.toLowerCase() === activeTag.toLowerCase()) ||
        char.tags?.some(tag => tag.toLowerCase().includes(activeTag.toLowerCase())) ||
        char.category?.toLowerCase() === activeTag.toLowerCase();

      const matchesSearch = !searchQuery ||
        char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTag && matchesSearch;
    });

    return filtered;
  }, [characters, activeTag, searchQuery]);

  // When "All" (no tag): show diverse mix from Star Wars, Waifu, Marvel, Hubby, Dark Romance, then shuffle
  const DIVERSITY_CATEGORIES: { tagMatch: (t: string) => boolean; perCategory: number }[] = [
    { tagMatch: (t) => /star\s*wars/i.test(t), perCategory: 5 },
    { tagMatch: (t) => t.toLowerCase() === 'waifu', perCategory: 5 },
    { tagMatch: (t) => /marvel/i.test(t), perCategory: 5 },
    { tagMatch: (t) => t.toLowerCase() === 'hubby', perCategory: 5 },
    { tagMatch: (t) => /dark\s*romance/i.test(t), perCategory: 5 },
  ];

  const displayCharacters = useMemo(() => {
    if (activeTag || searchQuery) {
      return filteredCharacters;
    }
    // "All": only characters with views over 1000
    const list = filteredCharacters.filter((char) => (viewsBySlug[char.id] ?? 0) > 1000);
    const usedIds = new Set<string>();
    const result: typeof list = [];

    for (const { tagMatch, perCategory } of DIVERSITY_CATEGORIES) {
      const fromCategory = list
        .filter((char) => !usedIds.has(char.id) && char.tags?.some((t) => tagMatch(t)))
        .sort(() => Math.random() - 0.5)
        .slice(0, perCategory);
      fromCategory.forEach((c) => usedIds.add(c.id));
      result.push(...fromCategory);
    }
    const remaining = list.filter((c) => !usedIds.has(c.id)).sort(() => Math.random() - 0.5);
    result.push(...remaining);
    return result.sort(() => Math.random() - 0.5);
  }, [filteredCharacters, activeTag, searchQuery, viewsBySlug]);

  // Reset spotlight when tag/carousel data changes
  useEffect(() => {
    setSpotlightIndex(0);
  }, [activeTag, carouselCharacters.length]);

  // Run face detection for each carousel character so we can center the crop on the face
  useEffect(() => {
    if (carouselCharacters.length === 0) return;
    carouselCharacters.forEach((char) => {
      const url = char.image_url || char.image;
      if (!url || requestedFaceIds.current.has(char.id)) return;
      requestedFaceIds.current.add(char.id);
      getFaceCenterFromUrl(url).then((center) => {
        if (center) setFaceFocusByCharId((prev) => ({ ...prev, [char.id]: center }));
      });
    });
  }, [carouselCharacters]);

  // Carousel: slide 0 = Community Milestone, slides 1..n = top characters (wrap around)
  const totalCarouselSlides = 1 + carouselCharacters.length;
  const goPrev = () => setSpotlightIndex(i => (i - 1 + totalCarouselSlides) % totalCarouselSlides);
  const goNext = () => setSpotlightIndex(i => (i + 1) % totalCarouselSlides);
  const isMilestoneSlide = spotlightIndex === 0;
  const currentSpotlight = isMilestoneSlide ? null : (carouselCharacters[spotlightIndex - 1] ?? carouselCharacters[0]);
  const nextSpotlight = spotlightIndex < totalCarouselSlides - 1
    ? (spotlightIndex === 0 ? carouselCharacters[0] : carouselCharacters[spotlightIndex])
    : null;

  // Touch swipe for phone (threshold in px)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0].clientX;
    const delta = touchStartX.current - endX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 border-b border-white/10 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight select-none">
              <span className="text-white">Nexus</span><span className="text-[#A855F7]">chat.in</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-8 w-10 bg-[#1A1A1A] rounded-lg animate-pulse" />
              <div className="h-8 w-10 bg-[#1A1A1A] rounded-lg animate-pulse" />
              <div className="h-8 w-10 bg-[#1A1A1A] rounded-lg animate-pulse" />
            </div>
          </div>
        </header>

        {/* Tag Filters Skeleton */}
        <div className="max-w-7xl mx-auto px-4 py-4 flex gap-2">
          {TAG_CATEGORIES.map((tag) => (
            <div key={tag.id} className="h-8 w-24 bg-[#1A1A1A] rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Character Grid Skeleton */}
        <div className="max-w-2xl mx-auto px-4 grid grid-cols-2 gap-4 pb-24">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight select-none">
            <span className="text-white">Nexus</span><span className="text-[#A855F7]">chat.in</span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/reels')}
              className="p-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all duration-200"
              title="Shorts"
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              className="p-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-all duration-200"
              title="Trending"
            >
              <TrendingUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                showSearch ? 'bg-[#A855F7]/20 text-[#A855F7]' : 'text-[#A1A1AA] hover:text-white hover:bg-white/5'
              }`}
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Search Bar - Shown when search button is clicked */}
      {showSearch && (
        <div className="max-w-7xl mx-auto px-4 py-4 border-b border-white/10 bg-[#0A0A0A]/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search characters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/50"
            />
          </div>
        </div>
      )}

      {/* Tag Filters - compact */}
      <div className="max-w-7xl mx-auto px-4 py-3 border-b border-white/10">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {/* All - show all characters */}
          <button
            onClick={() => setActiveTag(null)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1 ${
              activeTag === null
                ? 'bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30'
                : 'bg-[#1A1A1A] text-[#A1A1AA] hover:text-white border border-white/5'
            }`}
          >
            <span>All</span>
          </button>
          {TAG_CATEGORIES.map((tag) => {
            const isActive = activeTag === tag.id;
            return (
              <button
                key={tag.id}
                onClick={() => setActiveTag(isActive ? null : tag.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1 ${
                  isActive
                    ? 'bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30'
                    : 'bg-[#1A1A1A] text-[#A1A1AA] hover:text-white border border-white/5'
                }`}
              >
                <span className="text-[10px]">{tag.icon}</span>
                <span>{tag.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => {}}
            className="px-2.5 py-1 rounded-md text-xs font-medium text-[#A1A1AA] hover:text-white flex items-center gap-0.5"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Netflix-like Spotlight Carousel - Slide 0 = Community Milestone, then Top 5 characters by tag */}
      {totalCarouselSlides > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          <div
            className="relative w-full rounded-xl overflow-hidden bg-[#1A1A1A] border border-white/10 touch-pan-y"
            style={!isMilestoneSlide ? { cursor: 'pointer' } : undefined}
            onClick={() => !isMilestoneSlide && currentSpotlight && navigate(`/character/${currentSpotlight.id}`)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {isMilestoneSlide ? (
              /* Slide 0: Community Milestone (compact to match carousel height) */
              <div className="relative">
                <CommunityMilestone variant="compact" />
                {/* Left nav arrow */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 items-center justify-center text-white transition-all backdrop-blur-sm hidden md:flex"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                {/* Right nav arrow */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 items-center justify-center text-white transition-all backdrop-blur-sm hidden md:flex"
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                {/* Next slide thumbnail (first character) */}
                {nextSpotlight && (
                  <div className="hidden md:block absolute right-14 top-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 shadow-xl ring-2 ring-black/50">
                    <img
                      src={nextSpotlight.image_url || nextSpotlight.image || ''}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            ) : currentSpotlight ? (
              /* Slides 1..n: Character hero card */
              <div className="relative h-[280px] sm:h-[320px] md:h-[380px] lg:h-[420px]">
                  {(currentSpotlight.image_url || currentSpotlight.image) ? (
                    <img
                      src={currentSpotlight.image_url || currentSpotlight.image}
                      alt={currentSpotlight.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        objectPosition: faceFocusByCharId[currentSpotlight.id]
                          ? `${faceFocusByCharId[currentSpotlight.id].x * 100}% ${faceFocusByCharId[currentSpotlight.id].y * 100}%`
                          : '50% 35%',
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#A855F7]/30 to-[#9333EA]/30 flex items-center justify-center">
                      <span className="text-6xl md:text-8xl">🤖</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleCharacterBookmark(currentSpotlight.id); }}
                    className="absolute top-2 right-2 z-10 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
                    aria-label={isCharacterBookmarked(currentSpotlight.id) ? 'Remove bookmark' : 'Bookmark'}
                  >
                    <Bookmark
                      className={`w-5 h-5 md:w-6 md:h-6 ${isCharacterBookmarked(currentSpotlight.id) ? 'fill-[#A855F7] text-[#A855F7]' : ''}`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 items-center justify-center text-white transition-all backdrop-blur-sm hidden md:flex"
                    aria-label="Previous character"
                  >
                    <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 items-center justify-center text-white transition-all backdrop-blur-sm hidden md:flex"
                    aria-label="Next character"
                  >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                  </button>

                  {nextSpotlight && (
                    <div className="hidden md:block absolute right-14 top-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 shadow-xl ring-2 ring-black/50">
                      <img
                        src={nextSpotlight.image_url || nextSpotlight.image || ''}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:p-8 text-left z-10 pl-4 md:pl-14">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#A855F7] text-white text-xs font-semibold uppercase tracking-wide">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Trending
                      </span>
                      <span className="text-white/90 text-xs md:text-sm font-medium">
                        #{spotlightIndex} Featured
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg mb-1 md:mb-2">
                      {currentSpotlight.name}
                    </h2>
                    <p className="text-[#A855F7] text-sm md:text-base lg:text-lg font-medium">
                      {currentSpotlight.role || currentSpotlight.category || (currentSpotlight.views?.toLocaleString() + ' views')}
                    </p>
                  </div>
                </div>
            ) : null}

            {/* Pagination dots - one for milestone + one per character */}
            <div className="flex items-center justify-center gap-1.5 md:gap-2 py-3 bg-[#0A0A0A]/60 border-t border-white/5">
              {Array.from({ length: totalCarouselSlides }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSpotlightIndex(i); }}
                  className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all ${
                    i === spotlightIndex
                      ? 'bg-[#A855F7] scale-125'
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={i === 0 ? 'Go to milestone' : `Go to slide ${i}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Character Grid - 5x5 on desktop (lg), 2 cols on mobile */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 pb-24">
        {displayCharacters.length === 0 ? (
          <div className="col-span-2 lg:col-span-5 bg-[#1A1A1A] rounded-xl p-12 text-center">
            <p className="text-[#A1A1AA]">No characters found.</p>
          </div>
        ) : (
          displayCharacters.map((character) => (
            <div
              key={character.id}
              onClick={() => navigate(`/chat/${character.id}`)}
              className="group relative bg-[#1A1A1A] rounded-xl overflow-hidden cursor-pointer hover:bg-[#222222] transition-all duration-200 border border-white/5 hover:border-white/10"
            >
              {/* Bookmark button - top right */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleCharacterBookmark(character.id); }}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
                aria-label={isCharacterBookmarked(character.id) ? 'Remove bookmark' : 'Bookmark'}
              >
                <Bookmark
                  className={`w-5 h-5 ${isCharacterBookmarked(character.id) ? 'fill-[#A855F7] text-[#A855F7]' : ''}`}
                />
              </button>
              {/* Cinematic Portrait - click opens About */}
              <button
                type="button"
                className="aspect-[3/4] relative overflow-hidden w-full block text-left cursor-pointer border-0 p-0 bg-transparent"
                onClick={(e) => { e.stopPropagation(); navigate(`/character/${character.id}`); }}
                aria-label={`About ${character.name}`}
              >
                {(character.image_url || character.image) ? (
                  <img
                    src={character.image_url || character.image}
                    alt={character.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#A855F7]/20 to-[#9333EA]/20 flex items-center justify-center">
                    <span className="text-4xl">🤖</span>
                  </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              </button>

              {/* Character Info: name + view count */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="text-white font-semibold text-sm mb-0.5">{character.name}</h3>
                <p className="text-[#A1A1AA] text-xs">
                  {(viewsBySlug[character.id] ?? 0).toLocaleString()} views
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <CharacterLeaderboard
        characters={charactersMap}
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
}
