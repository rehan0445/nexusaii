// src/contexts/CharacterContext.tsx
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { Character, loadCharacters } from "../utils/characters";
import { useAuth } from "./AuthContext";

interface CharacterContextType {
  characters: Record<string, Character>;
  loading: boolean;
  refreshCharacters: () => Promise<void>;
}

const CharacterContext = createContext<CharacterContextType>({
  characters: {},
  loading: true,
  refreshCharacters: async () => {},
});

export const CharacterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [characters, setCharacters] = useState<Record<string, Character>>({});
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const data = await loadCharacters();
      console.log("🎯 Characters loaded in context:", Object.keys(data).length);
      console.log("📋 Character slugs:", Object.keys(data));
      console.log("🏷️ Sample character tags:", Object.entries(data).slice(0, 5).map(([slug, char]) => ({
        name: char.name,
        slug,
        tags: char.tags
      })));
      setCharacters(data);
    } catch (err) {
      console.warn("⚠️ Backend not available, using fallback characters");
      console.error("Failed to load characters:", err);
      // Set empty characters object to prevent crashes
      setCharacters({});
    } finally {
      setLoading(false);
    }
  };

  const refreshCharacters = async () => {
    await fetchCharacters();
  };

  useEffect(() => {
    fetchCharacters();
  }, [currentUser]); // Refresh when user changes

  const contextValue = useMemo(() => ({
    characters,
    loading,
    refreshCharacters,
  }), [characters, loading]);

  return (
    <CharacterContext.Provider value={contextValue}>
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacterContext = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error("useCharacterContext must be used within a CharacterProvider");
  }
  return context;
};
