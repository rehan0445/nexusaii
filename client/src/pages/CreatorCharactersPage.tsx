import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCharacterContext } from '../contexts/CharacterContext';
import CharacterCard from '../components/CharacterCard';
import FullPageLoader from '../components/FullPageLoader';

const CreatorCharactersPage: React.FC = () => {
  const { creatorName } = useParams<{ creatorName: string }>();
  const navigate = useNavigate();
  const { characters, loading } = useCharacterContext();

  // Filter characters by creator
  const creatorCharacters = useMemo(() => {
    if (!creatorName || !characters || Object.keys(characters).length === 0) {
      return {};
    }
    
    const decodedName = decodeURIComponent(creatorName).toLowerCase();
    
    return Object.entries(characters).reduce((acc, [slug, character]) => {
      const charCreator = character.creator?.toLowerCase() || '';
      if (charCreator === decodedName) {
        acc[slug] = character;
      }
      return acc;
    }, {} as Record<string, typeof characters[string]>);
  }, [characters, creatorName]);

  // Get favorites from localStorage
  const favorites = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const decodedCreatorName = creatorName ? decodeURIComponent(creatorName) : 'Unknown Creator';
  const characterCount = Object.keys(creatorCharacters).length;

  // Debug logging
  React.useEffect(() => {
    console.log('CreatorCharactersPage Debug:', {
      creatorName,
      decodedCreatorName,
      totalCharacters: Object.keys(characters || {}).length,
      filteredCount: characterCount,
      sampleCharacters: Object.entries(characters || {}).slice(0, 3).map(([slug, char]) => ({
        slug,
        name: char.name,
        creator: char.creator
      }))
    });
  }, [creatorName, decodedCreatorName, characters, characterCount]);

  const toggleFavorite = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    try {
      const newFavorites = favorites.includes(slug)
        ? favorites.filter((id: string) => id !== slug)
        : [...favorites, slug];
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      globalThis.dispatchEvent(new Event('favorites-updated'));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleCharacterClick = (slug: string) => {
    navigate(`/character/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white">
        <FullPageLoader />
      </div>
    );
  }

  if (!creatorName) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <p className="text-zinc-400 text-lg mb-2">Invalid creator</p>
          <p className="text-zinc-500 text-sm">No creator name provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{decodedCreatorName}</h1>
            <p className="text-sm text-zinc-400">{characterCount} {characterCount === 1 ? 'character' : 'characters'}</p>
          </div>
        </div>
      </div>

      {/* Characters Grid */}
      {characterCount === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <p className="text-zinc-400 text-lg mb-2">No characters found</p>
          <p className="text-zinc-500 text-sm">
            {creatorName 
              ? `This creator hasn't created any characters yet.`
              : 'Invalid creator name'}
          </p>
          {creatorName && (
            <p className="text-zinc-600 text-xs mt-2">
              Searching for: "{decodedCreatorName}"
            </p>
          )}
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Object.entries(creatorCharacters).map(([slug, character]) => (
              <CharacterCard
                key={slug}
                character={character}
                slug={slug}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onCharacterClick={handleCharacterClick}
                likes={0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorCharactersPage;

