import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase, signOut } from "../lib/supabase";
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { API_CONFIG } from "../lib/config";
import { fetchEmailHash, setGAUserId, clearGAUserId } from "../lib/gaTracking";

// Define User type based on Supabase user
type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
};

// Define the context type
interface AuthContextType {
  currentUser: User | null;
  /** When guest session is active (no Supabase user), this is the guest session id (e.g. guest_xxx). Use for companion chat and confessions. */
  guestUserId: string | null;
  /** Logged-in user id, or guest session id when guest. Use for API x-user-id so guests can chat and post. */
  effectiveUserId: string | null;
  userLoggedin: boolean;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with default value
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  guestUserId: null,
  effectiveUserId: null,
  userLoggedin: false,
  loading: true,
  refreshAuth: async () => {},
  logout: async () => {},
});

// Custom hook
export function useAuth() {
  return useContext(AuthContext);
}

// AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

function getGuestUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const hasGuest = localStorage.getItem('hasGuestSession') === 'true';
    const raw = localStorage.getItem('guest_session');
    if (!hasGuest || !raw) return null;
    const data = JSON.parse(raw);
    const sessionId = data?.sessionId;
    if (!sessionId || typeof sessionId !== 'string') return null;
    const start = data?.sessionStartTimestamp ? new Date(data.sessionStartTimestamp).getTime() : 0;
    const elapsed = Date.now() - start;
    if (elapsed > 30 * 60 * 1000) return null; // 30 min
    return sessionId;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoggedin, setUserLoggedin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [guestUserId, setGuestUserId] = useState<string | null>(null);
  const effectiveUserId = currentUser?.uid ?? guestUserId ?? null;

  // Map Supabase user to our User type
  const mapUser = (supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) return null;
    
    return {
      uid: supabaseUser.id,
      email: supabaseUser.email ?? null,
      displayName: supabaseUser.user_metadata?.name ?? supabaseUser.user_metadata?.full_name ?? null,
      photoURL: supabaseUser.user_metadata?.avatar_url ?? null,
      phoneNumber: supabaseUser.phone ?? null,
    };
  };

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setCurrentUser(null);
        setUserLoggedin(false);
        setLoading(false);
        return;
      }

      if (session?.user) {
        const user = mapUser(session.user);
        setCurrentUser(user);
        setUserLoggedin(true);
        setGuestUserId(null);
        // Set GA4 User-ID when session is restored (e.g., on page refresh)
        // Delay to ensure session is fully established before fetching hash
        setTimeout(() => {
          try {
            fetchEmailHash().then((emailHash) => {
              if (emailHash) {
                setGAUserId(emailHash);
              }
            }).catch((error) => {
              console.warn('⚠️ GA User-ID tracking error on session check:', error);
            });
          } catch (gaError) {
            console.warn('⚠️ GA User-ID tracking error:', gaError);
          }
        }, 500); // Small delay to ensure session is ready
      } else {
        setCurrentUser(null);
        setUserLoggedin(false);
        setGuestUserId(getGuestUserId());
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      setCurrentUser(null);
      setUserLoggedin(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // CRITICAL FIX: Initialize session and check for auth before rendering
    const initialize = async () => {
      await checkSession();
      
        // If no session after check, redirect to login for protected routes
        if (mounted) {
          const currentPath = window.location.pathname;
          const publicPaths = [
            '/',  // ✅ Root path for guest onboarding
            '/login', 
            '/register', 
            '/signup', 
            '/reset-password', 
            '/forgot-password',
            '/terms',
            '/privacy',
            '/auth/callback'
          ];
          // Check if path is a public path or starts with /onboarding
          const isPublicPath = publicPaths.includes(currentPath) || currentPath.startsWith('/onboarding');
          
          // ✅ NEW: Check for active guest session (allows guest users to access the app)
          const hasGuestSession = localStorage.getItem('hasGuestSession') === 'true';
          const guestSession = localStorage.getItem('guest_session');
          const hasValidGuestSession = hasGuestSession && guestSession;
          
          // Get session status after checkSession completes
          const { data: { session } } = await supabase.auth.getSession();
          
          // Only redirect if no Supabase session AND no guest session AND not on a public path
          if (!session && !hasValidGuestSession && !isPublicPath) {
            console.log('⚠️ No session found (and no guest session), redirecting to login');
            window.location.href = '/login';
            return;
          }
          
          // Log guest session status for debugging
          if (hasValidGuestSession) {
            console.log('✅ Guest session active, allowing access');
          }
        }
    };
    
    initialize();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event);

      if (session?.user) {
        const user = mapUser(session.user);
        setCurrentUser(user);
        setUserLoggedin(true);

        // Enhanced session bridge with socket manager integration
        const bridgeSession = async (token: string): Promise<boolean> => {
          try {
            console.log('🔐 Attempting session bridge...');

            const response = await fetch(`${API_CONFIG.getServerUrl()}/api/auth/session/bridge`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            });

            if (response.ok) {
              console.log('✅ Session bridge successful');

              // Initialize socket manager after successful session bridge
              try {
                const { socketManager } = await import('../lib/socketConfig');
                await socketManager.initializeSessionBridge();
                console.log('✅ Socket manager initialized with session bridge');
              } catch (socketError) {
                console.warn('⚠️ Socket manager initialization warning:', socketError);
              }

              return true;
            } else {
              const errorText = await response.text();
              console.error('❌ Session bridge failed:', response.status, response.statusText, errorText);
              return false;
            }
          } catch (error) {
            console.error('❌ Session bridge error:', error);
            return false;
          }
        };

        // Bridge Supabase session -> backend session cookies (for API + Socket.IO)
        try {
          const token = session.access_token;
          if (token) {
            const bridgeSuccess = await bridgeSession(token);
            
            // Set GA4 User-ID after successful session bridge
            // Delay the call to ensure trigger has completed and session is fully established
            // Use setTimeout to avoid blocking the auth flow
            if (bridgeSuccess) {
              // Delay by 1 second to allow trigger to complete and hash to be available
              setTimeout(async () => {
                try {
                  // Retry logic: try up to 3 times with delays
                  let emailHash = null;
                  let attempts = 0;
                  const maxAttempts = 3;
                  
                  while (!emailHash && attempts < maxAttempts) {
                    attempts++;
                    emailHash = await fetchEmailHash();
                    
                    if (!emailHash && attempts < maxAttempts) {
                      // Wait before retrying (exponential backoff)
                      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                    }
                  }
                  
                  if (emailHash) {
                    setGAUserId(emailHash);
                  } else {
                    console.warn('⚠️ GA User-ID tracking: Could not fetch email hash after', maxAttempts, 'attempts');
                  }
                } catch (gaError) {
                  console.warn('⚠️ GA User-ID tracking error:', gaError);
                  // Don't block auth flow if GA tracking fails
                }
              }, 1000); // 1 second delay to allow trigger to complete
            }
          }
        } catch (error) {
          console.error('❌ Session bridge error:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        // CRITICAL FIX: Only redirect to login on explicit SIGNED_OUT event
        // Don't redirect on temporary session null states (TOKEN_REFRESHED, etc.)
        setCurrentUser(null);
        setUserLoggedin(false);
        
        // Clear GA User-ID on logout
        try {
          clearGAUserId();
        } catch (gaError) {
          console.warn('⚠️ GA User-ID clearing error:', gaError);
        }
        
        const currentPath = window.location.pathname;
        const publicPaths = [
          '/',  // ✅ Root path for guest onboarding
          '/login', 
          '/register', 
          '/signup', 
          '/reset-password', 
          '/forgot-password',
          '/terms',
          '/privacy',
          '/auth/callback'
        ];
        const isPublicPath = publicPaths.includes(currentPath) || currentPath.startsWith('/onboarding');
        
        // Check for guest session - don't redirect if user has active guest session
        const hasGuestSession = localStorage.getItem('hasGuestSession') === 'true';
        const guestSession = localStorage.getItem('guest_session');
        const hasValidGuestSession = hasGuestSession && guestSession;
        
        if (!isPublicPath && !hasValidGuestSession) {
          console.log('⚠️ User signed out, redirecting to login');
          window.location.href = '/login';
        }
      } else {
        // For other events without session (TOKEN_REFRESHED, etc.), just update state
        // but DON'T redirect - let the session refresh complete
        console.log(`⚠️ Auth event ${event} with no session - waiting for resolution`);
        setCurrentUser(null);
        setUserLoggedin(false);
      }

      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Logout function
  const logout = async () => {
    try {
      // Clear GA User-ID before signing out
      try {
        clearGAUserId();
      } catch (gaError) {
        console.warn('⚠️ GA User-ID clearing error:', gaError);
      }

      // Sign out from Supabase
      await signOut();

      // Clear auth state
      setCurrentUser(null);
      setUserLoggedin(false);

      // Disconnect all socket connections
      try {
        const { disconnectAllSockets } = await import('../lib/socketConfig');
        disconnectAllSockets();
      } catch (error) {
        console.error('Error disconnecting sockets:', error);
      }

      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    guestUserId,
    effectiveUserId,
    userLoggedin,
    loading,
    refreshAuth: checkSession,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
