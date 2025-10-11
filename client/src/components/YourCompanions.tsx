import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Bot, MessageCircle, Eye, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Character } from "../utils/characters";
import { pluralizeLikes } from "../utils/pluralize";
import axios from "axios";
import EnhancedReactionSystem from "./EnhancedReactionSystem";
import { getCharacterReactions, toggleCharacterReaction, initializeCharacterReactions, AllReactionsData, getMultipleCharacterReactions } from "../services/reactionService";
import { loadCharacters } from "../utils/characters";

interface YourCompanionsProps {
  favorites: string[];
  toggleFavorite: (e: React.MouseEvent, slug: string) => void;
  characterLikes: Record<string, { likeCount: number; userLiked: boolean }>;
  views: Record<string, number>;
  handleLike: (e: React.MouseEvent, slug: string) => void;
  likeLoading: Record<string, boolean>;
}

const YourCompanions: React.FC<YourCompanionsProps> = ({
  favorites,
  toggleFavorite,
  characterLikes,
  views,
  handleLike,
  likeLoading,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [companions, setCompanions] = useState<Record<string, Character>>({});
  const [loading, setLoading] = useState(true); // Start with true but remove loading state quickly
  const [characterReactions, setCharacterReactions] = useState<Record<string, AllReactionsData>>({});
  const [reactionLoading, setReactionLoading] = useState<Record<string, boolean>>({});

  // Load characters immediately without blocking UI
  useEffect(() => {
    const loadAllCompanions = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Companion loading timeout')), 3000)
        );

        const loadPromise = async () => {
          // Load characters from the optimized utility function
          const allCharacters = await loadCharacters();
          console.log("🚀 Loaded characters:", Object.keys(allCharacters).length);

          // Filter for companions (characters with scenario and personality data)
          const companionCharacters: Record<string, Character> = {};
          Object.entries(allCharacters).forEach(([slug, character]) => {
            if (character.personality?.scenario || character.personality?.scenarioType) {
              companionCharacters[slug] = character;
            }
          });

          console.log("🤖 Found companions:", Object.keys(companionCharacters).length);
          setCompanions(companionCharacters);

          // Load reactions for all companions in bulk (much faster than individual calls)
          if (Object.keys(companionCharacters).length > 0) {
            // Don't wait for reactions - load them in background
            setTimeout(() => loadCompanionReactions(Object.keys(companionCharacters)), 50);
          }
        };

        await Promise.race([loadPromise(), timeoutPromise]);
      } catch (error) {
        console.error("Failed to load companions", error);
        // Show empty state instead of hanging
        setCompanions({});
      } finally {
        // Remove loading state immediately - show companions right away
        setLoading(false);
      }
    };

    loadAllCompanions();
  }, [currentUser]);

  const handleReaction = async (reactionType: string, characterSlug: string) => {
    console.log("🎭 Reaction clicked:", reactionType, "for character:", characterSlug);
    
    try {
      setReactionLoading(prev => ({ ...prev, [`${characterSlug}-${reactionType}`]: true }));
      
      // Get character data to generate consistent ID
      const character = companions[characterSlug];
      if (!character) {
        console.error("Character not found:", characterSlug);
        return;
      }

      // Generate character ID (using the same logic as in AiChat)
      const getCharacterId = (slug: string, char: Character) => {
        return char.id || 
               char.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 
               slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      };
      
      const characterId = getCharacterId(characterSlug, character);
      console.log("🎭 Using character ID:", characterId);

      const response = await toggleCharacterReaction(characterId, reactionType);
      console.log("🎭 Reaction response:", response);

      if (response.success) {
        // Update the character reactions state
        setCharacterReactions(prev => ({
          ...prev,
          [characterSlug]: {
            ...prev[characterSlug],
            [reactionType]: {
              count: response.data.count,
              userReacted: response.data.userReacted
            }
          }
        }));

        console.log(`🎭 Character ${response.data.action} ${reactionType}:`, characterSlug);
      }
    } catch (error) {
      console.error("Error handling reaction:", error);
    } finally {
      setReactionLoading(prev => ({ ...prev, [`${characterSlug}-${reactionType}`]: false }));
    }
  };

  // Load reactions for all companions in bulk (much faster)
  const loadCompanionReactions = async (companionSlugs: string[]) => {
    try {
      console.log("🎭 Loading reactions for companions in bulk:", companionSlugs.length);

      // Initialize reactions for all companions first (for immediate UI feedback)
      initializeCharacterReactions(companionSlugs);

      // Generate character IDs for all companions
      const characterIds = companionSlugs.map(slug => {
        const character = companions[slug];
        if (!character) return null;

        return character.id ||
               character.name?.toLowerCase().replace(/[^a-z0-9]/g, '') ||
               slug.toLowerCase().replace(/[^a-z0-9]/g, '');
      }).filter(Boolean);

      if (characterIds.length === 0) {
        console.log("🎭 No valid character IDs found for reactions");
        return;
      }

      // Use bulk API call with timeout (much faster!)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Reaction loading timeout')), 2000)
      );

      const reactionPromise = getMultipleCharacterReactions(characterIds);

      const reactionsMap = await Promise.race([reactionPromise, timeoutPromise]);

      // Map back to slugs
      const slugReactions: Record<string, AllReactionsData> = {};
      companionSlugs.forEach((slug, index) => {
        const characterId = characterIds[index];
        if (characterId && reactionsMap[characterId.toString()]) {
          slugReactions[slug] = reactionsMap[characterId.toString()];
        }
      });

      setCharacterReactions(slugReactions);
      console.log("🎭 Loaded companion reactions in bulk:", Object.keys(slugReactions).length);
    } catch (error) {
      console.error("Error loading companion reactions:", error);
      // Use local storage fallback immediately
      const reactionsMap: Record<string, AllReactionsData> = {};
      companionSlugs.forEach(slug => {
        const character = companions[slug];
        if (character) {
          const characterId = character.id ||
                             character.name?.toLowerCase().replace(/[^a-z0-9]/g, '') ||
                             slug.toLowerCase().replace(/[^a-z0-9]/g, '');
          const response = getCharacterReactions(characterId);
          if (response.success) {
            reactionsMap[slug] = response.data;
          }
        }
      });
      setCharacterReactions(reactionsMap);
    }
  };

  // Load reactions when companions change
  useEffect(() => {
    const companionSlugs = Object.keys(companions);
    if (companionSlugs.length > 0) {
      loadCompanionReactions(companionSlugs);
    }
  }, [companions]);

  // Show companions immediately, even if reactions are still loading
  // Only show loading if absolutely no companions loaded after 2 seconds

  if (Object.keys(companions).length === 0) {
    return (
      <div className="mb-12">
        <div className="flex items-center mb-6">
          <Bot className="w-8 h-8 text-gold mr-3" />
          <h2 className="text-3xl font-bold text-white">Your AI Companions</h2>
        </div>
        <div className="text-center py-12 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
          <Bot className="w-16 h-16 text-zinc-500 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center mb-6">
        <Bot className="w-8 h-8 text-gold mr-3" />
        <h2 className="text-3xl font-bold text-white">Your AI Companions</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Object.entries(companions)
          .slice(0, 8)
          .map(([slug, companion]) => (
            <button
              key={slug}
              onClick={() => navigate(`/character/${slug}`)}
              className="group relative bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl overflow-hidden shadow-lg cursor-pointer hover:from-purple-900/40 hover:to-blue-900/40 transition-all duration-300">
              <div className="absolute top-3 left-3 z-10 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                <Bot className="w-3 h-3 mr-1" />
                COMPANION
              </div>

              <div className="aspect-[2/3] relative overflow-hidden">
                <img
                  src={
                    companion.image ||
                    "https://i.pinimg.com/736x/8d/45/d7/8d45d7182a790992f538de186944f79c.jpg"
                  }
                  alt={companion.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
              </div>

              <button
                className="absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-colors bg-black/40 text-white hover:bg-black/60"
                onClick={(e) => toggleFavorite(e, slug)}>
                <Heart
                  className={`w-4 h-4 ${
                    favorites?.includes(slug) ? "fill-current text-red-400" : ""
                  }`}
                />
              </button>

              <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                <h3 className="text-white text-xl font-bold mb-1 group-hover:text-gold transition-colors">
                  {companion.name}
                </h3>
                <p className="text-softgold-500 text-sm mb-2">{companion.role}</p>

                {/* Personality Traits Preview */}
                {companion.personality?.traits && companion.personality.traits.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {companion.personality.traits.slice(0, 2).map((trait, index) => (
                      <span
                        key={`${slug}-trait-${trait}-${index}`}
                        className="text-xs bg-gold/20 text-gold px-2 py-1 rounded-full border border-gold/30">
                        {trait}
                      </span>
                    ))}
                    {companion.personality.traits.length > 2 && (
                      <span className="text-xs text-zinc-400">
                        +{companion.personality.traits.length - 2} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-zinc-300 text-sm">
                    <Heart className="w-4 h-4 mr-1 text-pink-400" />
                    <span>{pluralizeLikes(characterLikes[slug]?.likeCount || 0)}</span>
                  </div>
                  <div className="flex items-center text-zinc-300 text-sm">
                    <Eye className="w-4 h-4 mr-1 text-blue-400" />
                    <span>{views[slug] || 0}</span>
                  </div>
                </div>

                {/* Enhanced Reaction System */}
                <div className="mb-3">
                  <EnhancedReactionSystem
                    characterSlug={slug}
                    reactions={characterReactions[slug]}
                    onReaction={handleReaction}
                    loading={Object.fromEntries(
                      Object.keys(reactionLoading)
                        .filter(key => key.startsWith(`${slug}-`))
                        .map(key => [key.split('-')[1], reactionLoading[key]])
                    )}
                    className="justify-center"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/chat/${slug}`);
                    }}
                    className="flex-1 bg-gradient-to-r from-gold to-softgold-500 hover:from-gold/90 hover:to-softgold-500/90 text-zinc-900 py-2 rounded-lg font-medium transition-all text-sm flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Chat
                  </button>
                </div>
              </div>
            </button>
          ))}
      </div>

      {Object.keys(companions).length > 8 && (
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/ai?filter=companions")}
            className="px-6 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 border border-zinc-700/50 hover:border-gold/30">
            View All Companions ({Object.keys(companions).length})
          </button>
        </div>
      )}
    </div>
  );
};

export default YourCompanions; 