import axios from "axios";
import { getAuth } from "../utils/auth";

// Prefer relative path so Vite proxy can handle backend in dev
const API_BASE_URL = "/api/v1/character";

// Local fallback storage helpers (used when backend is offline)
const getLocalLikesKey = (characterId: string | number) => `likes:${characterId}`;
const getLocalUserLikedKey = (characterId: string | number, userId: string) => `liked:${characterId}:${userId}`;

function getLocalLikeCount(characterId: string | number): number {
  const value = localStorage.getItem(getLocalLikesKey(characterId));
  return value ? parseInt(value, 10) : 0;
}

function setLocalLikeCount(characterId: string | number, count: number) {
  localStorage.setItem(getLocalLikesKey(characterId), String(Math.max(0, count)));
}

function getLocalUserLiked(characterId: string | number, userId: string): boolean {
  return localStorage.getItem(getLocalUserLikedKey(characterId, userId)) === "true";
}

function setLocalUserLiked(characterId: string | number, userId: string, liked: boolean) {
  const key = getLocalUserLikedKey(characterId, userId);
  if (liked) localStorage.setItem(key, "true");
  else localStorage.removeItem(key);
}

interface LikeData {
  likeCount: number;
  userLiked: boolean;
}

interface ToggleLikeResponse {
  action: string;
  likeCount: number;
  userLiked: boolean;
}

// Get likes for a character
export const getCharacterLikes = async (characterId: string | number): Promise<{ success: boolean; data: LikeData }> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const userId = currentUser ? currentUser.uid : null;

    const response = await axios.get(`${API_BASE_URL}/${characterId}/likes`, {
      params: { user_id: userId },
    });

    return response.data;
  } catch (error) {
    // Fallback to local storage in offline/dev mode
    const auth = getAuth();
    const userId = auth.currentUser?.uid || "anonymous";
    const likeCount = getLocalLikeCount(characterId);
    const userLiked = getLocalUserLiked(characterId, userId);
    return { success: true, data: { likeCount, userLiked } };
  }
};

// Toggle like for a character
export const toggleCharacterLike = async (characterId: string | number): Promise<{ success: boolean; data: ToggleLikeResponse }> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("User must be authenticated to like characters");
    }

    const response = await axios.post(`${API_BASE_URL}/${characterId}/like`, {
      user_id: currentUser.uid,
    });

    return response.data;
  } catch (error) {
    // Local fallback toggle
    const auth = getAuth();
    const userId = auth.currentUser?.uid || "anonymous";
    const alreadyLiked = getLocalUserLiked(characterId, userId);
    const currentCount = getLocalLikeCount(characterId);
    const newCount = alreadyLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    setLocalLikeCount(characterId, newCount);
    setLocalUserLiked(characterId, userId, !alreadyLiked);

    return {
      success: true,
      data: {
        action: alreadyLiked ? "unliked" : "liked",
        likeCount: newCount,
        userLiked: !alreadyLiked,
      },
    };
  }
};

// Get like count for a character
export const getLikeCount = async (characterId: string | number): Promise<{ success: boolean; data: { likeCount: number } }> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${characterId}/like-count`);
    return response.data;
  } catch (error) {
    // Local fallback
    const likeCount = getLocalLikeCount(characterId);
    return { success: true, data: { likeCount } };
  }
};

// Get likes for multiple characters
// TEMPORARY FIX: Return static data to prevent database overload
// This function was causing 50+ simultaneous DB queries overwhelming Supabase
export const getMultipleCharacterLikes = async (characterIds: (string | number)[]): Promise<Record<string, LikeData>> => {
  // Return static/localStorage data without hitting backend
  const likesMap: Record<string, LikeData> = {};
  const auth = getAuth();
  const userId = auth.currentUser?.uid || "anonymous";
  
  characterIds.forEach((id) => {
    likesMap[String(id)] = {
      likeCount: getLocalLikeCount(id),
      userLiked: getLocalUserLiked(id, userId),
    };
  });
  
  return likesMap;
  
  /* DISABLED - Was causing 50+ simultaneous DB queries creating connection timeouts
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const userId = currentUser ? currentUser.uid : null;

    const promises = characterIds.map(id => getCharacterLikes(id));
    const results = await Promise.allSettled(promises);

    const likesMap: Record<string, LikeData> = {};
    results.forEach((result, index) => {
      const characterId = characterIds[index];
      if (result.status === "fulfilled") {
        likesMap[characterId.toString()] = result.value.data;
      } else {
        // Default values if request fails
        likesMap[characterId.toString()] = {
          likeCount: 0,
          userLiked: false,
        };
      }
    });

    return likesMap;
  } catch (error) {
    // Local fallback for all
    const likesMap: Record<string, LikeData> = {};
    const auth = getAuth();
    const userId = auth.currentUser?.uid || "anonymous";
    characterIds.forEach((id) => {
      likesMap[String(id)] = {
        likeCount: getLocalLikeCount(id),
        userLiked: getLocalUserLiked(id, userId),
      };
    });
    return likesMap;
  }
  */
}; 