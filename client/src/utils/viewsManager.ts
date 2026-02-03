import { useEffect } from 'react';
import { apiClient } from '../lib/apiConfig';

// Use the authenticated API client that handles auth headers and retry logic

// Debug function to log authentication state
const debugAuthState = (): void => {
  try {
    console.log('🔍 ViewsManager Auth Debug:');
    console.log('  - localStorage keys:', Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('session') || k.includes('supabase')));
    console.log('  - nexus-auth:', localStorage.getItem('nexus-auth') ? 'Present' : 'Not found');
    console.log('  - nexus_session_id:', localStorage.getItem('nexus_session_id') || 'Not found');

    // Check for Supabase auth keys
    const supabaseKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
    supabaseKeys.forEach(key => {
      console.log(`  - ${key}:`, localStorage.getItem(key) ? 'Present' : 'Not found');
    });
  } catch (error) {
    console.error('❌ Error debugging auth state:', error);
  }
};

// Key for localStorage
const VIEWS_STORAGE_KEY = 'nexus_character_views';

// Interface for view data
export interface ViewsData {
  views: Record<string, number>;
  lastUpdated: number;
}

// Character ranking object
export interface RankedCharacter {
  id: string;
  views: number;
  rank: number;
}

// Initialize views from localStorage or create empty object
export const initializeViews = (): ViewsData => {
  const storedData = localStorage.getItem(VIEWS_STORAGE_KEY);
  
  if (storedData) {
    try {
      return JSON.parse(storedData);
    } catch (error) {
      console.error('Error parsing stored views data:', error);
    }
  }
  
  // Default empty data
  return {
    views: {},
    lastUpdated: Date.now()
  };
};

// Save views data to localStorage
export const saveViews = (data: ViewsData): void => {
  try {
    localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving views data to localStorage:', error);
  }
};

// Increment view count for a character
export const incrementView = async (characterId: string): Promise<void> => {
  const data = initializeViews();

  // Increment view count or initialize to 1 if not exists
  data.views[characterId] = (data.views[characterId] || 0) + 1;
  data.lastUpdated = Date.now();

  saveViews(data);

  // Also track in backend using authenticated API client
  try {
    // Debug authentication state before making request
    debugAuthState();

    const sessionId = getSessionId();
    const userId = getCurrentUserId();

    console.log('🔍 Tracking view in backend:', {
      character_id: characterId,
      user_id: userId,
      session_id: sessionId,
      has_user_id: !!userId,
      has_session_id: !!sessionId
    });

    await apiClient.post('/api/v1/views/track', {
      character_id: characterId,
      user_id: userId,
      session_id: sessionId,
    });

    console.log('✅ View tracked successfully in backend');
  } catch (error) {
    console.error('❌ Failed to track view in backend:', {
      error: error,
      character_id: characterId,
      error_message: error instanceof Error ? error.message : String(error),
      error_response: error && typeof error === 'object' && 'response' in error ? error.response : undefined,
      error_status: error && typeof error === 'object' && 'response' in error ? error.response?.status : undefined,
      error_data: error && typeof error === 'object' && 'response' in error ? error.response?.data : undefined
    });

    // If it's a 401 error, log additional debugging info
    if (error && typeof error === 'object' && 'response' in error && error.response?.status === 401) {
      console.error('🚨 401 Unauthorized Error - Authentication Issue Detected');
      console.error('🔍 Check if user is logged in and session is properly bridged');
      console.error('🔍 Verify that the session bridge endpoint is working');
      console.error('🔍 Check if auth tokens are present in localStorage');
    }

    // Don't throw - keep frontend working even if backend fails
  }
};

// Get or create session ID
const getSessionId = (): string => {
  let sessionId = localStorage.getItem('nexus_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('nexus_session_id', sessionId);
  }
  return sessionId;
};

// Get current user ID from AuthContext
const getCurrentUserId = (): string | null => {
  try {
    // Get auth data from localStorage (where Supabase stores session info)
    const authData = localStorage.getItem('nexus-auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      const user = parsed?.user || parsed?.currentUser;
      if (user?.uid || user?.id) {
        const userId = user.uid || user.id;
        console.log('🔑 Found authenticated user ID:', userId);
        return userId;
      }
    }

    // Also check Supabase auth directly if available
    if (typeof window !== 'undefined' && (window as any).supabase) {
      try {
        // We can't directly access supabase here without importing it
        // but we can check localStorage for session info
        const sbAuth = localStorage.getItem('sb-' + (import.meta as any).env?.VITE_SUPABASE_URL?.split('//')[1]?.replace(/\./g, '-'));
        if (sbAuth) {
          const parsed = JSON.parse(sbAuth);
          const user = parsed?.user;
          if (user?.id) {
            console.log('🔑 Found Supabase user ID:', user.id);
            return user.id;
          }
        }
      } catch (error) {
        console.warn('⚠️ Error checking Supabase auth:', error);
      }
    }

    console.log('🔑 No authenticated user found, using anonymous tracking');
    return null;
  } catch (error) {
    console.error('❌ Error getting current user ID:', error);
    return null;
  }
};

// Get all views
export const getAllViews = (): Record<string, number> => {
  const data = initializeViews();
  return data.views;
};

// Get view counts for a list of character ids (slugs). Returns Record<slug, display_views> with 0 for missing.
export const getViewCountsForCharacters = async (characterIds: string[]): Promise<Record<string, number>> => {
  if (!characterIds.length) return {};
  try {
    const idsParam = characterIds.slice(0, 3000).join(',');
    const response = await apiClient.get('/api/v1/views/counts', {
      params: { ids: idsParam },
    });
    if (response.data?.success && response.data?.data?.counts) {
      const counts = response.data.data.counts as Record<string, number>;
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/2d5b2a38-5e31-419c-8a60-677ae4bc8660',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewsManager.ts:getViewCountsForCharacters',message:'Bulk counts returned',data:{requestedIds:characterIds.length,returnedKeys:Object.keys(counts).length,sampleIds:characterIds.slice(0,3)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      return counts;
    }
  } catch (error) {
    console.error('❌ Failed to fetch bulk view counts:', error);
  }
  return {};
};

// Get ranked characters from backend
export const getRankedCharacters = async (limit?: number): Promise<RankedCharacter[]> => {
  try {
    console.log('🔍 Fetching character leaderboard from backend');
    const response = await apiClient.get('/api/v1/views/leaderboard', {
      params: {
        limit: limit || 50,
        type: 'total'
      }
    });

    if (response.data.success) {
      const leaderboard = response.data.data.leaderboard.map((item: any) => ({
        id: item.character_id,
        views: item.display_views || (item.total_views || 0) + (item.fake_views || 0), // Use display_views if available, fallback to calculation
        rank: item.rank
      }));
      console.log('✅ Leaderboard fetched successfully:', leaderboard.length, 'characters');
      return leaderboard;
    }
  } catch (error) {
    console.error('❌ Failed to fetch leaderboard from backend:', {
      error: error,
      error_message: error instanceof Error ? error.message : String(error),
      error_response: error && typeof error === 'object' && 'response' in error ? error.response : undefined
    });
  }

  // Fallback to local data if backend fails
  const views = getAllViews();
  console.log('getRankedCharacters fallback with local views:', views);
  
  // Convert to array and sort by views (descending)
  const rankedCharacters = Object.entries(views)
    .map(([id, viewCount]) => ({
      id,
      views: viewCount,
      rank: 0 // Will be set after sorting
    }))
    .sort((a, b) => b.views - a.views);
  
  // Add ranking
  rankedCharacters.forEach((character, index) => {
    character.rank = index + 1;
  });
  
  // Apply limit if specified
  const result = limit ? rankedCharacters.slice(0, limit) : rankedCharacters;
  console.log('Final ranked characters result (fallback):', result);
  return result;
};

// Hook to use character views - fetches from backend for accuracy
export const useCharacterViews = (
  setViews: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  initialRandomData?: Record<string, number>
): void => {
  useEffect(() => {
    console.log('🔄 useCharacterViews hook called - fetching real view counts from backend');
    
    const fetchViewsFromBackend = async () => {
      try {
        // Fetch real view counts from backend (leaderboard = top 500 only)
        const rankedCharacters = await getRankedCharacters(500); // Get top 500 characters
        
        if (rankedCharacters && rankedCharacters.length > 0) {
          // Convert array to object format
          const viewsFromBackend: Record<string, number> = {};
          rankedCharacters.forEach(char => {
            viewsFromBackend[char.id] = char.views;
          });
          
          console.log('✅ Fetched view counts from backend:', Object.keys(viewsFromBackend).length, 'characters');
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/2d5b2a38-5e31-419c-8a60-677ae4bc8660',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'viewsManager.ts:useCharacterViews',message:'Leaderboard setViews',data:{leaderboardKeys:Object.keys(viewsFromBackend).length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
          // #endregion
          // MERGE leaderboard into existing state so we don't overwrite bulk counts for non-trending characters
          setViews(prev => {
            const next = { ...prev, ...viewsFromBackend };
            saveViews({ views: next, lastUpdated: Date.now() });
            return next;
          });
        } else {
          // Fallback to localStorage or initial data
          const storedViews = getAllViews();
          if (Object.keys(storedViews).length > 0) {
            console.log('Using stored views from localStorage as fallback');
            setViews(storedViews);
          } else if (initialRandomData) {
            console.log('Using initial random data as fallback');
            saveViews({ views: initialRandomData, lastUpdated: Date.now() });
            setViews(initialRandomData);
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch views from backend:', error);
        
        // Fallback to localStorage or initial data
        const storedViews = getAllViews();
        if (Object.keys(storedViews).length > 0) {
          console.log('Using stored views from localStorage as fallback');
          setViews(storedViews);
        } else if (initialRandomData) {
          console.log('Using initial random data as fallback');
          saveViews({ views: initialRandomData, lastUpdated: Date.now() });
          setViews(initialRandomData);
        }
      }
    };
    
    fetchViewsFromBackend();
  }, [setViews, initialRandomData]);
}; 