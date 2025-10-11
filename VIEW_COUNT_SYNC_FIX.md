# View Count Synchronization Fix

## Problem
The home page (Companion section) and trending page were showing different view counts for the same characters.

### Root Cause
- **Home Page**: Used `useCharacterViews` hook which loaded views from localStorage OR generated random initial data
- **Trending Page**: Fetched real view counts from the backend API using `getRankedCharacters`

This discrepancy meant that:
1. Home page showed cached/random view counts
2. Trending page showed actual backend view counts
3. The numbers didn't match

## Solution

### Updated `client/src/utils/viewsManager.ts`
Modified the `useCharacterViews` hook to:
1. **Fetch from backend first**: Always try to get real view counts from the backend API
2. **Fallback gracefully**: If backend fails, use localStorage or initial random data
3. **Sync localStorage**: Update localStorage with backend data for consistency

### Changes Made

```typescript
// Before: Used localStorage or random data
export const useCharacterViews = (
  setViews: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  initialRandomData?: Record<string, number>
): void => {
  useEffect(() => {
    const storedViews = getAllViews();
    
    if (Object.keys(storedViews).length === 0 && initialRandomData) {
      saveViews({ views: initialRandomData, lastUpdated: Date.now() });
      setViews(initialRandomData);
    } else {
      setViews(storedViews);
    }
  }, [setViews, initialRandomData]);
};

// After: Fetches from backend for accuracy
export const useCharacterViews = (
  setViews: React.Dispatch<React.SetStateAction<Record<string, number>>>,
  initialRandomData?: Record<string, number>
): void => {
  useEffect(() => {
    const fetchViewsFromBackend = async () => {
      try {
        // Fetch real view counts from backend
        const rankedCharacters = await getRankedCharacters(500);
        
        if (rankedCharacters && rankedCharacters.length > 0) {
          const viewsFromBackend: Record<string, number> = {};
          rankedCharacters.forEach(char => {
            viewsFromBackend[char.id] = char.views;
          });
          
          setViews(viewsFromBackend);
          saveViews({ views: viewsFromBackend, lastUpdated: Date.now() });
        } else {
          // Fallback to localStorage or initial data
          // ... fallback logic
        }
      } catch (error) {
        // Fallback to localStorage or initial data
        // ... fallback logic
      }
    };
    
    fetchViewsFromBackend();
  }, [setViews, initialRandomData]);
};
```

## Impact

### Files Modified
- `client/src/utils/viewsManager.ts` - Updated `useCharacterViews` hook

### Components Affected (automatically fixed)
- `AiChat.tsx` (Home page) - Now uses backend view counts
- `YourCompanions.tsx` - Receives synchronized views from parent
- `CharacterLeaderboard.tsx` (Trending page) - Already used backend data
- `CompactLeaderboard.tsx` - Already used backend data

## Result
✅ **Home page and trending page now show the same view counts** because both fetch from the same backend source

## Testing
1. Open the Companion home page
2. Note the view counts for characters
3. Open the Trending page
4. Verify that the same characters show the same view counts
5. The numbers should now match exactly

## Future Improvements
- Consider caching backend data with a TTL (time-to-live) to reduce API calls
- Add a refresh mechanism to update view counts periodically
- Consider real-time updates via WebSocket for live view count updates

