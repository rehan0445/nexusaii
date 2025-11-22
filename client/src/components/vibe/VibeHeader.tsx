import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, ArrowLeft, Menu, Plus, Sparkles } from 'lucide-react';

interface VibeHeaderProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: string[]) => void;
  selectedFilters?: string[];
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
  actionsEnabled?: boolean;
  mode?: 'chats' | 'confession';
}

const VibeHeader: React.FC<VibeHeaderProps> = ({
  onSearch,
  onFilterChange,
  selectedFilters = [],
  onMenuToggle,
  isMenuOpen = false,
  actionsEnabled = true,
  mode = 'chats'
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelectedFilters, setLocalSelectedFilters] = useState<string[]>(selectedFilters);
  const [filterSearchQuery, setFilterSearchQuery] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterSearchInputRef = useRef<HTMLInputElement>(null);

  // Recent searches for group chats - in a real app, this would come from localStorage or API
  const recentSearches = [
    mode === 'confession' ? 'Crush' : 'Anime Discussion',
    mode === 'confession' ? 'Mental Health' : 'Startup Hub',
    mode === 'confession' ? 'Campus Life' : 'Tech Talk'
  ];

  // Available filter categories for group chats organized by sections
  const filterSections = {
    trending: ['Trending', 'Top Rated', 'Popular', 'Latest'],
    tags: ['Anime', 'Gaming', 'Tech', 'Startup', 'Music', 'Sports', 'Education', 'Business', 'Entertainment', 'Lifestyle', 'Art']
  };

  // Flatten all categories for search functionality
  const allFilterCategories = [...filterSections.trending, ...filterSections.tags];

  // Filter categories based on search query
  const filteredCategories = allFilterCategories.filter(category =>
    category.toLowerCase().includes(filterSearchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (isFilterOpen && filterSearchInputRef.current) {
      filterSearchInputRef.current.focus();
    }
  }, [isFilterOpen]);

  // Close overlays when clicking outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim();
    if (mode === 'confession') {
      window.dispatchEvent(new CustomEvent('vibe:search', { detail: query }));
    } else {
      onSearch?.(query);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleRecentSearchClick = (search: string) => {
    if (mode === 'confession') {
      window.dispatchEvent(new CustomEvent('vibe:search', { detail: search }));
    } else {
      onSearch?.(search);
    }
    setIsSearchOpen(false);
  };

  const handleFilterToggle = (filter: string) => {
    const newFilters = localSelectedFilters.includes(filter)
      ? localSelectedFilters.filter(f => f !== filter)
      : [...localSelectedFilters, filter];
    
    setLocalSelectedFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleFilterApply = () => {
    onFilterChange?.(localSelectedFilters);
    setIsFilterOpen(false);
  };

  const handleFilterClear = () => {
    setLocalSelectedFilters([]);
    onFilterChange?.([]);
  };

  return (
    <>
      {/* Main Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left Side - Menu Button and Vibe Brand */}
          <div className="flex items-center gap-3">
            {onMenuToggle && (
              <button
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                onClick={onMenuToggle}
                className="p-2.5 rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#6A0DAD]/40 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-[#6A0DAD] tracking-tight">
                Vibe
              </h1>
            </div>
          </div>

          {/* Right Side - context-aware actions */}
          {actionsEnabled && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg border border-white/20 bg-white/10 text-zinc-100 hover:bg-white/15 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#6A0DAD]/40 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              {mode === 'confession' ? (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('vibe:createConfession'))}
                  className="p-2 rounded-lg border border-white/20 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#6A0DAD]/40 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                  aria-label="Create"
                >
                  <Plus className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="p-2 rounded-lg border border-white/20 bg-white/10 text-zinc-100 hover:bg-white/15 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#6A0DAD]/40 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center relative"
                  aria-label="Filter"
                >
                  <Filter className="w-5 h-5" />
                  {localSelectedFilters.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#6A0DAD] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {localSelectedFilters.length}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            {/* Search Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/95">
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 rounded-lg border border-white/20 bg-white/10 text-zinc-100 hover:bg-white/15 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#6A0DAD]/40 transition-colors"
                aria-label="Close search"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-zinc-100">Search</h2>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>

            {/* Search Content */}
            <div className="flex-1 p-4">
              <form onSubmit={handleSearchSubmit} className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={mode === 'confession' ? 'search something spicy.' : 'Search group chats, topics, or...'}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#6A0DAD]/40 focus:border-[#6A0DAD] transition-colors"
                  />
                </div>
              </form>

              {/* Recent Searches */}
              <div>
                <h3 className="text-sm font-medium text-zinc-300 mb-3">{mode === 'confession' ? 'Recent Searches' : 'Recent Group Chats'}</h3>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full text-left p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-100 transition-colors flex items-center gap-3"
                    >
                      <Search className="w-4 h-4 text-zinc-400" />
                      <span>{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel (chats only) */}
      {isFilterOpen && mode === 'chats' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-950/95 rounded-t-2xl border-t border-zinc-800 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Filter Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-100">Filters</h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 rounded-lg border border-white/20 bg-white/10 text-zinc-100 hover:bg-white/15 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#6A0DAD]/40 transition-colors"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Search */}
            <div className="p-4 border-b border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  ref={filterSearchInputRef}
                  type="text"
                  value={filterSearchQuery}
                  onChange={(e) => setFilterSearchQuery(e.target.value)}
                  placeholder="Search group chat topics..."
                  className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#6A0DAD]/40 focus:border-[#6A0DAD] transition-colors text-sm"
                />
              </div>
            </div>

                         {/* Filter Categories */}
             <div className="flex-1 overflow-y-auto p-4">
               {filterSearchQuery ? (
                 // Show filtered results in a grid when searching
                 <div className="grid grid-cols-2 gap-3">
                   {filteredCategories.map((category) => (
                     <label
                       key={category}
                       className="flex items-center gap-3 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors"
                     >
                       <input
                         type="checkbox"
                         checked={localSelectedFilters.includes(category)}
                         onChange={() => handleFilterToggle(category)}
                         className="w-4 h-4 text-[#6A0DAD] bg-zinc-700 border-zinc-600 rounded focus:ring-[#6A0DAD] focus:ring-2"
                       />
                       <span className="text-zinc-100 text-sm">{category}</span>
                     </label>
                   ))}
                 </div>
               ) : (
                 // Show organized sections when not searching
                 <div className="space-y-6">
                   {/* Trending Section */}
                   <div>
                     <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">Trending & Popular</h3>
                     <div className="grid grid-cols-2 gap-3">
                       {filterSections.trending.map((category) => (
                         <label
                           key={category}
                           className="flex items-center gap-3 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors"
                         >
                           <input
                             type="checkbox"
                             checked={localSelectedFilters.includes(category)}
                             onChange={() => handleFilterToggle(category)}
                             className="w-4 h-4 text-[#6A0DAD] bg-zinc-700 border-zinc-600 rounded focus:ring-[#6A0DAD] focus:ring-2"
                           />
                           <span className="text-zinc-100 text-sm">{category}</span>
                         </label>
                       ))}
                     </div>
                   </div>

                   {/* Tags Section */}
                   <div>
                     <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wide">Topics & Categories</h3>
                     <div className="grid grid-cols-2 gap-3">
                       {filterSections.tags.map((category) => (
                         <label
                           key={category}
                           className="flex items-center gap-3 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors"
                         >
                           <input
                             type="checkbox"
                             checked={localSelectedFilters.includes(category)}
                             onChange={() => handleFilterToggle(category)}
                             className="w-4 h-4 text-[#6A0DAD] bg-zinc-700 border-zinc-600 rounded focus:ring-[#6A0DAD] focus:ring-2"
                           />
                           <span className="text-zinc-100 text-sm">{category}</span>
                         </label>
                       ))}
                     </div>
                   </div>
                 </div>
               )}
               
               {filteredCategories.length === 0 && filterSearchQuery && (
                 <div className="text-center py-8 text-zinc-400">
                   No topics found matching "{filterSearchQuery}"
                 </div>
               )}
             </div>

            {/* Filter Actions */}
            <div className="p-4 border-t border-zinc-800 flex gap-3">
              <button
                onClick={handleFilterClear}
                className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={handleFilterApply}
                className="flex-1 py-3 px-4 bg-[#6A0DAD] hover:bg-[#7851A9] text-white rounded-lg transition-colors font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VibeHeader;
