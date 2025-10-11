import axios from "axios";
import { getAuth } from "../utils/auth";

const API_BASE_URL = "/api/v1/character";

export interface ReactionData {
  count: number;
  userReacted: boolean;
}

export interface AllReactionsData {
  [reactionType: string]: ReactionData;
}

export interface ToggleReactionResponse {
  action: string;
  reactionType: string;
  count: number;
  userReacted: boolean;
}

// Get all reactions for a character
export const getCharacterReactions = async (characterId: string | number): Promise<{ success: boolean; data: AllReactionsData }> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const userId = currentUser ? currentUser.uid : null;

    const response = await axios.get(`${API_BASE_URL}/${characterId}/reactions`, {
      params: { user_id: userId },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching character reactions:", error);
    // Fallback to local storage for reactions
    return getLocalReactions(characterId.toString());
  }
};

// Toggle reaction for a character
export const toggleCharacterReaction = async (
  characterId: string | number, 
  reactionType: string
): Promise<{ success: boolean; data: ToggleReactionResponse }> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      // Use local storage fallback for unauthenticated users
      return toggleLocalReaction(characterId.toString(), reactionType);
    }

    const response = await axios.post(`${API_BASE_URL}/${characterId}/reaction`, {
      user_id: currentUser.uid,
      reaction_type: reactionType,
    });

    // Also update local storage as backup
    updateLocalReaction(characterId.toString(), reactionType, response.data.data);

    return response.data;
  } catch (error) {
    console.error("Error toggling character reaction:", error);
    // Fallback to local storage
    return toggleLocalReaction(characterId.toString(), reactionType);
  }
};

// Get reactions for multiple characters (optimized for speed)
export const getMultipleCharacterReactions = async (characterIds: (string | number)[]): Promise<Record<string, AllReactionsData>> => {
  try {
    // If we have many characters, use local storage for speed (faster than API)
    if (characterIds.length > 10) {
      console.log("🎭 Using local storage for multiple reactions (faster)");
      const result: Record<string, AllReactionsData> = {};
      characterIds.forEach(id => {
        result[id.toString()] = getLocalReactions(id.toString()).data;
      });
      return result;
    }

    // For smaller batches, try API first
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const userId = currentUser ? currentUser.uid : null;

    const response = await axios.post(`${API_BASE_URL}/bulk-reactions`, {
      character_ids: characterIds,
      user_id: userId,
    });

    return response.data.data;
  } catch (error) {
    console.error("Error fetching multiple character reactions:", error);
    // Fallback to local storage
    const result: Record<string, AllReactionsData> = {};
    characterIds.forEach(id => {
      result[id.toString()] = getLocalReactions(id.toString()).data;
    });
    return result;
  }
};

// Local storage fallback functions
const REACTIONS_STORAGE_KEY = 'nexus_character_reactions';
const USER_REACTIONS_STORAGE_KEY = 'nexus_user_reactions';

const getLocalReactions = (characterId: string): { success: boolean; data: AllReactionsData } => {
  try {
    const stored = localStorage.getItem(REACTIONS_STORAGE_KEY);
    const reactions = stored ? JSON.parse(stored) : {};
    
    const userReactions = getUserReactions();
    
    const characterReactions = reactions[characterId] || {};
    const result: AllReactionsData = {};
    
    // Default reaction types
    const reactionTypes = ['love', 'amazing', 'funny', 'epic', 'fire', 'magical'];
    
    reactionTypes.forEach(type => {
      result[type] = {
        count: characterReactions[type] || 0,
        userReacted: userReactions[characterId]?.[type] || false
      };
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Error getting local reactions:", error);
    return { success: false, data: {} };
  }
};

const getUserReactions = (): Record<string, Record<string, boolean>> => {
  try {
    const stored = localStorage.getItem(USER_REACTIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error getting user reactions:", error);
    return {};
  }
};

const setUserReactions = (userReactions: Record<string, Record<string, boolean>>) => {
  try {
    localStorage.setItem(USER_REACTIONS_STORAGE_KEY, JSON.stringify(userReactions));
  } catch (error) {
    console.error("Error setting user reactions:", error);
  }
};

const toggleLocalReaction = (characterId: string, reactionType: string): { success: boolean; data: ToggleReactionResponse } => {
  try {
    // Get current reactions
    const stored = localStorage.getItem(REACTIONS_STORAGE_KEY);
    const reactions = stored ? JSON.parse(stored) : {};
    
    const userReactions = getUserReactions();
    
    // Initialize character reactions if not exist
    if (!reactions[characterId]) {
      reactions[characterId] = {};
    }
    if (!userReactions[characterId]) {
      userReactions[characterId] = {};
    }
    
    const currentCount = reactions[characterId][reactionType] || 0;
    const userReacted = userReactions[characterId][reactionType] || false;
    
    let newCount: number;
    let newUserReacted: boolean;
    let action: string;
    
    if (userReacted) {
      // Remove reaction
      newCount = Math.max(0, currentCount - 1);
      newUserReacted = false;
      action = 'removed';
    } else {
      // Add reaction
      newCount = currentCount + 1;
      newUserReacted = true;
      action = 'added';
    }
    
    // Update storage
    reactions[characterId][reactionType] = newCount;
    userReactions[characterId][reactionType] = newUserReacted;
    
    localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(reactions));
    setUserReactions(userReactions);
    
    return {
      success: true,
      data: {
        action,
        reactionType,
        count: newCount,
        userReacted: newUserReacted
      }
    };
  } catch (error) {
    console.error("Error toggling local reaction:", error);
    return {
      success: false,
      data: {
        action: 'error',
        reactionType,
        count: 0,
        userReacted: false
      }
    };
  }
};

const updateLocalReaction = (characterId: string, reactionType: string, reactionData: ToggleReactionResponse) => {
  try {
    const stored = localStorage.getItem(REACTIONS_STORAGE_KEY);
    const reactions = stored ? JSON.parse(stored) : {};
    const userReactions = getUserReactions();
    
    if (!reactions[characterId]) {
      reactions[characterId] = {};
    }
    if (!userReactions[characterId]) {
      userReactions[characterId] = {};
    }
    
    reactions[characterId][reactionType] = reactionData.count;
    userReactions[characterId][reactionType] = reactionData.userReacted;
    
    localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(reactions));
    setUserReactions(userReactions);
  } catch (error) {
    console.error("Error updating local reaction:", error);
  }
};

// Initialize default reactions for all characters
export const initializeCharacterReactions = (characterSlugs: string[]) => {
  try {
    const stored = localStorage.getItem(REACTIONS_STORAGE_KEY);
    const reactions = stored ? JSON.parse(stored) : {};
    
    const reactionTypes = ['love', 'amazing', 'funny', 'epic', 'fire', 'magical'];
    let updated = false;
    
    characterSlugs.forEach(slug => {
      if (!reactions[slug]) {
        reactions[slug] = {};
        updated = true;
      }
      
      reactionTypes.forEach(type => {
        if (!(type in reactions[slug])) {
          reactions[slug][type] = Math.floor(Math.random() * 10); // Random initial count
          updated = true;
        }
      });
    });
    
    if (updated) {
      localStorage.setItem(REACTIONS_STORAGE_KEY, JSON.stringify(reactions));
    }
  } catch (error) {
    console.error("Error initializing character reactions:", error);
  }
};

export default {
  getCharacterReactions,
  toggleCharacterReaction,
  getMultipleCharacterReactions,
  initializeCharacterReactions
}; 