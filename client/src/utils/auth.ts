/**
 * Auth utility functions
 * Replaces Firebase auth with backend session-based auth
 */

// Get current user ID from backend session
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/profile', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      return data?.data?.user?.id || null;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get current user ID:', error);
    return null;
  }
}

// Mock getAuth for backward compatibility
// Returns an object that mimics Firebase auth structure
export function getAuth() {
  return {
    currentUser: null, // Always null - use getCurrentUserId() instead
    onAuthStateChanged: () => () => {}, // No-op
  };
}

export default { getCurrentUserId, getAuth };

