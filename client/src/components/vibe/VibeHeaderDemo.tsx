import React, { useState } from 'react';
import VibeHeader from './VibeHeader';

const VibeHeaderDemo: React.FC = () => {
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    
    // Add to search history
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(item => item !== query)].slice(0, 5);
      return newHistory;
    });

    // Simulate search results
    const mockResults = [
      `Results for "${query}"`,
      'Character 1',
      'Character 2',
      'Genre 1',
      'Genre 2'
    ];
    setSearchResults(mockResults);
  };

  const handleFilterChange = (filters: string[]) => {
    console.log('Selected filters:', filters);
    setSelectedFilters(filters);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <VibeHeader
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        selectedFilters={selectedFilters}
      />

      {/* Content Area with top padding for fixed header */}
      <div className="pt-14 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Vibe Header Demo</h1>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Search Results</h2>
              <div className="bg-zinc-900 rounded-lg p-4">
                {searchResults.map((result, index) => (
                  <div key={index} className="py-2 border-b border-zinc-800 last:border-b-0">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Filters */}
          {selectedFilters.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Active Filters</h2>
              <div className="flex flex-wrap gap-2">
                {selectedFilters.map((filter, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#6A0DAD] text-white rounded-full text-sm"
                  >
                    {filter}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Search History</h2>
              <div className="bg-zinc-900 rounded-lg p-4">
                {searchHistory.map((search, index) => (
                  <div key={index} className="py-2 border-b border-zinc-800 last:border-b-0">
                    {search}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-zinc-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">How to Use</h2>
            <div className="space-y-3 text-zinc-300">
              <div className="flex items-start gap-3">
                <span className="text-[#6A0DAD] font-semibold">1.</span>
                <p>Click the search icon (magnifying glass) to open the search overlay</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#6A0DAD] font-semibold">2.</span>
                <p>Click the filter icon (funnel) to open the filter panel</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#6A0DAD] font-semibold">3.</span>
                <p>Use the search input to find specific tags in the filter panel</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#6A0DAD] font-semibold">4.</span>
                <p>Select multiple filters using checkboxes</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#6A0DAD] font-semibold">5.</span>
                <p>Press Escape or click outside to close overlays</p>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-[#6A0DAD]">Search Features</h3>
              <ul className="space-y-2 text-zinc-300 text-sm">
                <li>• Full-screen search overlay</li>
                <li>• Recent searches history</li>
                <li>• Search input with placeholder</li>
                <li>• Keyboard navigation support</li>
                <li>• Smooth animations</li>
              </ul>
            </div>

            <div className="bg-zinc-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-[#6A0DAD]">Filter Features</h3>
              <ul className="space-y-2 text-zinc-300 text-sm">
                <li>• Bottom slide-up panel</li>
                <li>• Tag search functionality</li>
                <li>• Multi-select checkboxes</li>
                <li>• Filter count indicator</li>
                <li>• Clear all and apply actions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VibeHeaderDemo;
