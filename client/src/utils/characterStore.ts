import { Character, loadCharacters } from "./characters";

let cachedCharacters: Record<string, Character> | null = null;

export const getCharacters = async (): Promise<Record<string, Character>> => {
  if (cachedCharacters) {
    return cachedCharacters;
  }

  try {
    const data = await loadCharacters();
    cachedCharacters = data;
    return data;
  } catch (error) {
    console.error("Error fetching characters in store:", error);
    return {};
  }
};

// Optional utility to clear cache (e.g. after updates)
export const clearCharacterCache = () => {
  cachedCharacters = null;
};
