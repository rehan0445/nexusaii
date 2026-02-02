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
          const rankedCharacters = await getRankedCharacters(100); 
          console.log('✅ Ranked characters from backend:', rankedCharacters.length, 'characters');
          
          // Map ranked characters to include character data
          // ranked.views now contains display_views from backend
          const mappedCharacters = rankedCharacters
            .map(ranked => ({
              slug: ranked.id,
              character: characters[ranked.id],
              views: ranked.views, // This is now display_views (total_views + fake_views)
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
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-[#141414]/90 backdrop-blur-sm p-4 md:p-0">
      <div className="relative w-full max-w-xl rounded-xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col bg-[#0A0A0A] border border-white/10 animate-fade-in">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-[#A855F7]" />
            <h2 className="text-xl font-bold text-white tracking-tight">Trending</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#1A1A1A] border border-transparent hover:border-white/10 text-[#A1A1AA] hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10 bg-[#0A0A0A]/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search characters..."
              className="w-full pl-10 pr-4 py-3 bg-[#1A1A1A] border border-white/10 rounded-lg placeholder-[#A1A1AA] text-white focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:border-[#A855F7]/50"
            />
          </div>
        </div>

        {/* Character List */}
        <div className={`flex-grow overflow-y-auto scrollbar-thin ${incognitoMode ? "scrollbar-thumb-orange-500 scrollbar-track-[#1A1A1A]" : "scrollbar-thumb-[#A855F7]/50 scrollbar-track-[#1A1A1A]"}`}>
          {filteredCharacters.length === 0 ? (
            <div className="text-center py-8">
              {searchQuery ? (
                <p className="text-[#A1A1AA]">No characters match your search</p>
              ) : topCharacters.length === 0 ? (
                <>
                  <Trophy className="w-12 h-12 text-[#A1A1AA] mx-auto mb-3" />
                  <p className="text-[#A1A1AA] mb-2">No trending data available yet</p>
                  <p className="text-[#A1A1AA]/80 text-sm">The most popular characters will appear here based on view counts</p>
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#A855F7] mx-auto mb-3" />
                  <p className="text-[#A1A1AA]">Loading trending characters...</p>
                </>
              )}
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {filteredCharacters.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => {
                    navigate(`/character/${item.slug}`);
                    onClose();
                  }}
                  aria-label={`View ${item.character.name}`}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-white/5 hover:border-[#A855F7]/30 transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50"
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 font-bold text-sm ${
                    item.rank === 1 ? 'bg-gradient-to-br from-[#A855F7] to-[#9333EA] text-white' :
                    item.rank === 2 ? 'bg-[#1A1A1A] border border-[#A855F7]/40 text-[#A855F7]' :
                    item.rank === 3 ? 'bg-[#1A1A1A] border border-[#A855F7]/30 text-[#A855F7]' :
                    'bg-[#1A1A1A] border border-white/10 text-[#A1A1AA]'
                  }`}>
                    {item.rank}
                  </div>

                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={item.character.image}
                      alt={item.character.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{item.character.name}</div>
                    <div className="text-xs text-[#A1A1AA] truncate">{item.character.role}</div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-[#A855F7] font-medium">{item.views.toLocaleString()}</div>
                    <div className="text-xs text-[#A1A1AA]">views</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="border-t border-white/10 p-4 flex-shrink-0 bg-[#0A0A0A]">
          <button
            onClick={onClose}
            className={`w-full flex items-center justify-center py-3 rounded-xl transition-colors font-semibold ${
              incognitoMode
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-[#A855F7] hover:bg-[#9333EA] text-white"
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 