// src/utils/characters.ts
import axios from "axios";
import { getAuth } from "../utils/auth";
import { animeCharacters } from "./animeCharacters";

export interface Character {
  id: number;
  name: string;
  role: string;
  image: string;
  description: string;
  tags: string[];
  creator?: string;
  languages: {
    primary: string;
    secondary?: string[];
    style?: string;
    greeting?: string;
  };
  personality: {
    traits: string[];
    quirks: string[];
    emotionalStyle: string;
    speakingStyle: string;
    interests: string[];
    background: string;
    scenario?: string;
    scenarioType?: string;
    guidelines?: {
      dos: string[];
      donts: string[];
    };
  };
  voice?: {
    name: string;
    pitch: number;
    rate: number;
    language: string;
  };
}

// Convert character name to slug for object key
const toSlug = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, "-");
};

// Simple cache for characters
let characterCache: Record<string, Character> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Clear cache when characters are updated
export const clearCharacterCache = () => {
  characterCache = null;
  cacheTimestamp = 0;
  console.log("🗑️ Cleared character cache");
};

// Function to fetch and return as Record<string, Character>
export const loadCharacters = async (): Promise<Record<string, Character>> => {
  try {
    // Check cache first
    if (characterCache && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      console.log("🚀 Using cached characters");
      return characterCache;
    }

    const characters: Record<string, Character> = {};

    // ✅ Use centralized API configuration
    const { API_CONFIG } = await import('../lib/config');
    const API_BASE_URL = API_CONFIG.getServerUrl();
    console.log("🌐 API Base URL (from config):", API_BASE_URL);

    // Try to load from multiple sources in parallel for speed
    const promises = [];

    // 1. Fetch built-in characters from chatbot_models
    promises.push(
      axios.get<Character[]>(`${API_BASE_URL}/api/v1/chat/models`)
        .then(response => response.data)
        .catch(err => {
          console.warn("⚠️ Failed to load built-in characters:", err.message);
          return [];
        })
    );

    // 2. Load static characters as fallback (always available) - PRESERVE ORIGINAL SLUGS
    promises.push(Promise.resolve(Object.entries(animeCharacters)));

    const [builtInCharacters, staticCharacterEntries] = await Promise.all(promises);

    // Add built-in characters first
    if (builtInCharacters.length > 0) {
      console.log("📡 Loaded built-in characters:", builtInCharacters.length);
      for (const character of builtInCharacters) {
        const slug = toSlug(character.name);
        characters[slug] = character;
      }
    }

    // Add static characters as fallback - USE ORIGINAL SLUGS, DON'T REGENERATE
    if (staticCharacterEntries.length > 0) {
      console.log("📦 Loaded static characters:", staticCharacterEntries.length);
      for (const [originalSlug, character] of staticCharacterEntries) {
        if (!characters[originalSlug]) { // Don't overwrite built-in characters
          characters[originalSlug] = character as unknown as Character;
        }
      }
    }

    // 2. Fetch user-created characters from character_data
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        console.log("🔄 Loading user-created characters for user:", user.uid);
        const userResponse = await axios.post(
          // "http://localhost:8000/api/v1/character/user",
          `${API_BASE_URL}/api/v1/character/user`,
          { user_id: user.uid }
        );

        console.log("📡 User characters response:", userResponse.data);

        if (userResponse.data.success && userResponse.data.data) {
          const userCharacters = userResponse.data.data;
          
          // Convert user characters to the expected format
          Object.values(userCharacters).forEach((char: any) => {
            const slug = toSlug(char.name);
            const formattedCharacter: Character = {
              id: char.id,
              name: char.name,
              role: char.role || "AI Character",
              image: char.image || "https://images.unsplash.com/photo-1675789652575-0a5d2425b6c2?auto=format&fit=crop&w=300&h=300",
              description: char.description || `A custom AI character created by ${user.displayName || 'you'}`,
              tags: char.tags || [],
              languages: {
                primary: "English",
                style: "Natural and conversational",
                greeting: "Hello! I'm a custom AI character.",
              },
              personality: {
                traits: char.tags || [],
                quirks: [],
                emotionalStyle: "Adaptive and responsive",
                speakingStyle: "Clear and engaging",
                interests: char.tags || [],
                background: char.description || `A custom AI character created by ${user.displayName || 'you'}`,
              },
            };
            
            characters[slug] = formattedCharacter;
            console.log("✅ Added user character:", char.name, "with slug:", slug);
          });
          console.log("✅ Loaded user-created characters:", Object.keys(userCharacters).length);
        } else {
          console.log("⚠️ No user characters found or response format unexpected");
        }
      } else {
        console.log("⚠️ No authenticated user found, skipping user characters");
      }
    } catch (err) {
      console.warn("⚠️ Backend server not available for user characters");
      console.error("❌ Failed to load user-created characters:", err);
    }

    console.log("🎯 Total characters loaded:", Object.keys(characters).length);
    console.log("📋 Character slugs:", Object.keys(characters));

    // 3. Normalize tags to the allowed set and report unmatched
    const allowed = new Set(["waifu", "hubby", "semi-realistic", "helper", "star wars", "marvel", "dc", "harry potter", "the ancients", "resident evil", "tomb raider", "mortal kombat", "street fighter", "dark romance", "genshin impact"]);
    const unmatched: string[] = [];

    const hash = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
      return Math.abs(h);
    };

    Object.entries(characters).forEach(([slug, ch]) => {
      const sourceTags = (ch.tags || []).map((t) => String(t).toLowerCase());
      const normalized: Set<string> = new Set();

      // Helper tag (can coexist with others)
      if (sourceTags.some((t) => t.includes("helper"))) {
        normalized.add("helper");
      }

      // Star Wars tag (can coexist with others)
      if (sourceTags.some((t) => t.includes("star wars"))) {
        normalized.add("star wars");
      }

      // Genshin Impact tag (can coexist with others)
      if (sourceTags.some((t) => t.includes("genshin"))) {
        normalized.add("genshin impact");
      }

      // Marvel tag (can coexist with others)
      if (sourceTags.some((t) => t.includes("marvel"))) {
        normalized.add("marvel");
      }

      // DC tag (can coexist with others)
      if (sourceTags.some((t) => t.includes("dc"))) {
        normalized.add("dc");
      }

      // Harry Potter tag (can coexist with others)
      if (sourceTags.some((t) => t.includes("harry potter"))) {
        normalized.add("harry potter");
      }

      // The Ancients tag (can coexist with others)
      if (sourceTags.some((t) => t.includes("the ancients"))) {
        normalized.add("the ancients");
      }

      // Resident Evil tag (can coexist with others)
      if (sourceTags.some((t) => t.includes("resident evil"))) {
        normalized.add("resident evil");
      }

      // Tomb Raider tag (can coexist with others)
      if (sourceTags.some((t) => t.includes("tomb raider"))) {
        normalized.add("tomb raider");
      }

      // Mortal Kombat tag (can coexist with others)
      if (sourceTags.some((t) => t.includes("mortal kombat"))) {
        normalized.add("mortal kombat");
      }

      // Street Fighter tag (can coexist with others)
      if (sourceTags.some((t) => t.includes("street fighter"))) {
        normalized.add("street fighter");
      }

      // Dark Romance tag (can coexist with others)
      if (sourceTags.some((t) => t.includes("dark romance"))) {
        normalized.add("dark romance");
      }

      // Direct allowed tags if already present
      sourceTags.forEach((t) => {
        if (allowed.has(t)) normalized.add(t);
      });

      // Heuristics only if no primary category yet (waifu/hubby/semi-realistic)
      const hasPrimary = Array.from(normalized).some((t) => t === "waifu" || t === "hubby" || t === "semi-realistic");
      if (!hasPrimary) {
        const isFemale = sourceTags.includes("female") || sourceTags.includes("waifu");
        const isMale = sourceTags.includes("male") || sourceTags.includes("hubby");
        if (isFemale) normalized.add("waifu");
        else if (isMale) normalized.add("hubby");
      }

      // If still no primary tag, default to semi-realistic
      const hasPrimaryAfter = Array.from(normalized).some((t) => t === "waifu" || t === "hubby" || t === "semi-realistic");
      if (!hasPrimaryAfter) {
        // Mark unmatched for reporting but set semi-realistic so UI can group it
        unmatched.push(ch.name);
        normalized.add("semi-realistic");
      }

      // Determine creator attribution
      const normArr = Array.from(normalized);
      let creator: string | undefined;
      const has = (t: string) => normArr.includes(t);

      // AKP rules
      if (has("waifu") || has("genshin impact") || has("tomb raider") || (has("resident evil") && (sourceTags.includes("female") || has("waifu")))) {
        creator = "AKP";
      }
      // Hubby split
      else if (has("hubby")) {
        creator = hash(slug) % 2 === 0 ? "DeathStroke" : "ash";
      }
      // Helper split
      else if (has("helper")) {
        creator = hash(slug) % 2 === 0 ? "DeathStroke" : "shion";
      }
      // Franchise random sets
      else if (has("marvel") || has("dc") || has("star wars") || has("the ancients")) {
        const pool = ["queenash04", "rose379", "nikhil", "zentisu_1", "aryan"];
        creator = pool[hash(slug) % pool.length];
      }
      // Default
      else {
        creator = "ginger3000";
      }

      characters[slug] = { ...ch, tags: normArr, creator } as Character;
    });

    if (unmatched.length > 0) {
      console.warn("⚠️ Characters needing manual tag check (auto-set to semi-realistic):", unmatched);
    }

    // Exclude Indian cricketers (sportsmen) from companion list
    const INDIAN_CRICKETER_SLUGS = new Set([
      "sachin-tendulkar", "ms-dhoni", "virat-kohli", "kapil-dev", "rahul-dravid",
      "sourav-ganguly", "anil-kumble", "virender-sehwag", "yuvraj-singh", "zahir-khan",
      "harbhajan-singh", "gautam-gambhir", "mohammad-azharuddin", "vvs-laxman", "rohit-sharma",
    ]);
    INDIAN_CRICKETER_SLUGS.forEach((slug) => {
      if (characters[slug]) {
        delete characters[slug];
      }
    });

    // Cache the results for faster future loads
    characterCache = characters;
    cacheTimestamp = Date.now();
    console.log("🚀 Cached characters for future use");

    return characters;
  } catch (err) {
    console.error("❌ Failed to load characters from API", err);
    return {};
  }
};
