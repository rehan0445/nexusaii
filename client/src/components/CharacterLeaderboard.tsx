import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Search, X } from 'lucide-react';
import { getRankedCharacters } from '../utils/viewsManager';
import { useSettings } from "../contexts/SettingsContext";

interface CharacterLeaderboardProps {
  readonly characters: Record<string, any>;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function CharacterLeaderboard({ characters, isOpen, onClose }: CharacterLeaderboardProps) {
  const navigate = useNavigate();
  const [topCharacters, setTopCharacters] = useState<{
    slug: string;
    character: any;
    views: number;
    rank: number;
  }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { incognitoMode } = useSettings();

  // Debug component props
  console.log('CharacterLeaderboard props:', { 
    isOpen, 
    charactersCount: Object.keys(characters).length,
    sampleCharacters: Object.entries(characters).slice(0, 3)
  });

  useEffect(() => {
    if (isOpen) {
      console.log('Trending page opened, fetching latest view counts from backend');
      
      const loadLeaderboard = async () => {
        try {
          // Get all ranked characters from backend - always fetch fresh data
          const rankedCharacters = await getRankedCharacters(50); 
          console.log('✅ Ranked characters from backend:', rankedCharacters.length, 'characters');
          
          // Map ranked characters to include character data
          const mappedCharacters = rankedCharacters
            .map(ranked => ({
              slug: ranked.id,
              character: characters[ranked.id],
              views: ranked.views,
              rank: ranked.rank
            }))
            .filter(item => item.character); // Filter out any undefined characters
          
          console.log('📊 Mapped trending characters:', mappedCharacters.length, 'characters with view data');
          setTopCharacters(mappedCharacters);
        } catch (error) {
          console.error('❌ Failed to load trending leaderboard:', error);
          // Set empty array on error so UI shows appropriate message
          setTopCharacters([]);
        }
      };
      
      loadLeaderboard();
    } else {
      // Clear search when modal closes
      setSearchQuery('');
    }
  }, [characters, isOpen]);

  // Filter characters based on search query
  const filteredCharacters = searchQuery.trim() 
    ? topCharacters.filter(item => 
        item.character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.character.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : topCharacters;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-nexus-neutral-900/80 backdrop-blur-sm p-4 md:p-0">
      <div className={`relative w-full max-w-xl rounded-xl overflow-hidden shadow-soft animate-fade-in max-h-[90vh] flex flex-col ${
        incognitoMode ? "bg-black" : "bg-nexus-neutral-800"
      }`}>
        {/* Header */}
        <div className="p-5 border-b border-nexus-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-nexus-blue-500" />
            <h2 className="text-xl font-poppins font-medium text-white">Trending</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-nexus-neutral-700/50 text-nexus-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-nexus-neutral-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-nexus-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search characters..."
              className="w-full pl-10 pr-4 py-3 bg-nexus-neutral-700/50 rounded-lg placeholder-nexus-neutral-500 text-nexus-neutral-200 focus:outline-none focus:ring-2 focus:ring-nexus-blue-500/50"
            />
          </div>
        </div>

        {/* Character List */}
        <div className={`flex-grow overflow-y-auto scrollbar-thin ${incognitoMode ? "scrollbar-thumb-orange-500 scrollbar-track-black" : "scrollbar-thumb-[#d4af37] scrollbar-track-zinc-900"}`}>
          {filteredCharacters.length === 0 ? (
            <div className="text-center py-6">
              {searchQuery ? (
                <p className="text-nexus-neutral-400">No characters match your search</p>
              ) : topCharacters.length === 0 ? (
                <>
                  <Trophy className="w-12 h-12 text-nexus-neutral-500 mx-auto mb-3" />
                  <p className="text-nexus-neutral-400 mb-2">No trending data available yet</p>
                  <p className="text-nexus-neutral-500 text-sm">The most popular characters will appear here based on view counts</p>
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-nexus-blue-500 mx-auto mb-3"></div>
                  <p className="text-nexus-neutral-400">Loading trending characters...</p>
                </>
              )}
            </div>
          ) : (
            <div className="p-3">
              {filteredCharacters.map((item) => (
                <div 
                  key={item.slug}
                  onClick={() => {
                    navigate(`/character/${item.slug}`);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/character/${item.slug}`);
                      onClose();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Chat with ${item.character.name}`}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-nexus-neutral-700/50 transition-colors cursor-pointer mb-2 focus:outline-none focus:ring-2 focus:ring-nexus-blue-500/50"
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    item.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-nexus-neutral-900' : 
                    item.rank === 2 ? 'bg-gradient-to-br from-nexus-neutral-300 to-nexus-neutral-400 text-nexus-neutral-900' : 
                    item.rank === 3 ? 'bg-gradient-to-br from-softgold-700 to-softgold-900 text-white' : 
                    'bg-nexus-neutral-700 text-nexus-neutral-300'
                  } font-bold text-sm`}>
                    {item.rank}
                  </div>
                  
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img 
                      src={item.character.image} 
                      alt={item.character.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-white">{item.character.name}</div>
                    <div className="text-xs text-nexus-neutral-400">{item.character.role}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-nexus-blue-300">{item.views.toLocaleString()}</div>
                    <div className="text-xs text-nexus-neutral-500">views</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Close button */}
        <div className="border-t border-nexus-neutral-700 p-4 flex-shrink-0">
          <button 
            onClick={onClose}
            className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors font-medium ${
              incognitoMode
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-nexus-blue-500 hover:bg-nexus-blue-600 text-white"
            }`}
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
} 