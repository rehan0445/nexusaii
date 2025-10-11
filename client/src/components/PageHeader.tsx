import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, X, Clock, Plus } from 'lucide-react';

// Category color mapping for confession filters
const CATEGORY_COLORS: Record<string, string> = {
  'love': '#FF4D6D', // Love & Relationships - soft red/pink
  'academic': '#4D96FF', // Academic Stress - calm blue
  'social': '#FFB703', // Social Life - vibrant yellow
  'career': '#00C49A', // Career & Future - teal green
  'family': '#FF7B54', // Family Issues - warm coral
  'mental': '#8ECAE6', // Mental Health - pastel blue
  'hobbies': '#B5E48C', // Hobbies & Interests - pastel green
  'random': '#C77DFF', // Random Thoughts - purple
  'default': '#FFB703' // Default fallback
};

// Function to get category color based on name
const getCategoryColor = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  if (name.includes('love') || name.includes('relationship')) return CATEGORY_COLORS.love;
  if (name.includes('academic') || name.includes('stress') || name.includes('exam')) return CATEGORY_COLORS.academic;
  if (name.includes('social') || name.includes('life')) return CATEGORY_COLORS.social;
  if (name.includes('career') || name.includes('future') || name.includes('job')) return CATEGORY_COLORS.career;
  if (name.includes('family')) return CATEGORY_COLORS.family;
  if (name.includes('mental') || name.includes('health')) return CATEGORY_COLORS.mental;
  if (name.includes('hobbies') || name.includes('interests') || name.includes('hobby')) return CATEGORY_COLORS.hobbies;
  if (name.includes('random') || name.includes('thoughts')) return CATEGORY_COLORS.random;
  return CATEGORY_COLORS.default;
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: FilterOptions) => void;
  onCreate?: () => void;
  recentSearches?: string[];
  filterCategories?: FilterCategory[];
  searchPlaceholder?: string;
  filterTitle?: string;
}

interface FilterOptions {
  categories: string[];
  tags: string[];
}

interface FilterCategory {
  id: string;
  name: string;
  count?: number;
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  onSearch,
  onFilter,
  onCreate,
  recentSearches = [],
  filterCategories = [],
  searchPlaceholder = "Search...",
  filterTitle = "Filters"
}: Readonly<PageHeaderProps>) {
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  // Focus search input when overlay opens
  useEffect(() => {
    if (showSearchOverlay && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchOverlay]);

  // Close panels when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterPanel && filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        setShowFilterPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterPanel]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
    setShowSearchOverlay(false);
  };

  const handleFilterChange = (categoryId: string) => {
    const newFilters = selectedFilters.includes(categoryId)
      ? selectedFilters.filter(id => id !== categoryId)
      : [...selectedFilters, categoryId];
    
    setSelectedFilters(newFilters);
    onFilter?.({ categories: newFilters, tags: [] });
  };

  const clearFilters = () => {
    setSelectedFilters([]);
    onFilter?.({ categories: [], tags: [] });
  };

  const filteredCategories = filterCategories.filter(category =>
    category.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  return (
    <>
      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-2xl border-b border-[#F4E3B5]/10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Back Button and Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-[#F4E3B5] hover:text-[#F4E3B5]/80 transition-colors p-2 rounded-xl hover:bg-[#F4E3B5]/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="serif-title text-2xl font-semibold text-white">{title}</h1>
                {subtitle && <p className="text-xs text-[#a1a1aa] mt-1">{subtitle}</p>}
              </div>
            </div>

            {/* Right Side - Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Create Button */}
              {onCreate && (
                <button
                  onClick={onCreate}
                  className="flex items-center justify-center w-9 h-9 bg-[#000000]/50 hover:bg-[#000000]/70 text-[#F4E3B5] hover:text-[#F4E3B5]/80 rounded-lg border border-[#F4E3B5]/20 hover:border-[#F4E3B5]/40 transition-all duration-200"
                  title="Create"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}

              {/* Search Button */}
              <button
                onClick={() => setShowSearchOverlay(true)}
                className="flex items-center justify-center w-9 h-9 bg-[#000000]/50 hover:bg-[#000000]/70 text-[#F4E3B5] hover:text-[#F4E3B5]/80 rounded-lg border border-[#F4E3B5]/20 hover:border-[#F4E3B5]/40 transition-all duration-200"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      {showSearchOverlay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="bg-black border-b border-[#F4E3B5]/20">
            <div className="px-4 py-4">
              {/* Search Header */}
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setShowSearchOverlay(false)}
                  className="flex items-center justify-center w-10 h-10 text-[#a1a1aa] hover:text-[#F4E3B5] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">Search</h2>
                  <p className="text-sm text-[#a1a1aa]">{title}</p>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#a1a1aa]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      handleSearch(searchQuery.trim());
                    }
                  }}
                  className="w-full pl-12 pr-4 py-4 bg-[#000000]/50 backdrop-blur-sm border border-[#F4E3B5]/20 rounded-2xl text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#F4E3B5]/40 focus:ring-2 focus:ring-[#F4E3B5]/20 transition-all duration-300"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      handleSearch('');
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#a1a1aa] hover:text-[#F4E3B5] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#a1a1aa]" />
                    <h3 className="text-lg font-semibold text-white">Recent Searches</h3>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleSearch(search)}
                        className="w-full flex items-center gap-3 p-3 bg-[#000000]/30 hover:bg-[#000000]/50 rounded-xl transition-all duration-200 text-left"
                      >
                        <Clock className="w-4 h-4 text-[#a1a1aa]" />
                        <span className="text-white">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div
            ref={filterPanelRef}
            className="absolute bottom-0 left-0 right-0 bg-black rounded-t-3xl border-t border-[#F4E3B5] max-h-[80vh] overflow-hidden"
          >
            {/* Filter Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#F4E3B5]/30 bg-black">
              <h2 className="text-xl font-bold text-[#FFFFFF]">{filterTitle}</h2>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="flex items-center justify-center w-10 h-10 text-[#a1a1aa] hover:text-[#F4E3B5] transition-colors rounded-xl hover:bg-[#F4E3B5]/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* Tag Search */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#a1a1aa]" />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-black backdrop-blur-sm border border-[#F4E3B5]/30 rounded-xl text-white placeholder-[#9A9A9A] focus:outline-none focus:border-[#F4E3B5] focus:ring-2 focus:ring-[#F4E3B5]/20 transition-all duration-300"
                />
              </div>

              {/* Filter Categories */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#FFFFFF]">Categories</h3>
                  {selectedFilters.length > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-[#FFB703] hover:text-[#FFD166] transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {filteredCategories.map((category) => {
                    const categoryColor = getCategoryColor(category.name);
                    const isSelected = selectedFilters.includes(category.id);
                    
                    return (
                      <label
                        key={category.id}
                        className={`flex items-center gap-3 p-3 bg-black hover:bg-[#111111] rounded-xl transition-all duration-200 cursor-pointer border ${
                          isSelected 
                            ? `border-[${categoryColor}]/30 shadow-lg` 
                            : 'border-[#F4E3B5]/20 hover:border-[#F4E3B5]/40'
                        }`}
                        style={isSelected ? { 
                          boxShadow: `0 0 20px ${categoryColor}15`,
                          borderColor: `${categoryColor}50`
                        } : {}}
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleFilterChange(category.id)}
                            className="w-5 h-5 opacity-0 absolute"
                          />
                          <div 
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              isSelected 
                                ? 'border-transparent' 
                                : 'border-[#F4E3B5]/30 hover:border-[#F4E3B5]/60'
                            }`}
                            style={isSelected ? { 
                              backgroundColor: categoryColor,
                              boxShadow: `0 0 10px ${categoryColor}40`
                            } : {}}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <span 
                            className={`font-medium transition-all duration-200 ${
                              isSelected 
                                ? 'text-[#CFCFCF]' 
                                : 'text-[#CFCFCF] hover:text-[#FFFFFF]'
                            }`}
                            style={isSelected ? { 
                              textShadow: `0 0 8px ${categoryColor}30`
                            } : {}}
                          >
                            {category.name}
                          </span>
                          {category.count !== undefined && (
                            <span className="text-[#9A9A9A] text-sm ml-2">({category.count})</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {filteredCategories.length === 0 && tagSearchQuery && (
                  <div className="text-center py-8">
                    <p className="text-[#9A9A9A]">No categories found matching "{tagSearchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
