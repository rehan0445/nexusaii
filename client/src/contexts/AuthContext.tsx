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
  userLoggedin: boolean;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with default value
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoggedin, setUserLoggedin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

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
      } else {
        setCurrentUser(null);
        setUserLoggedin(false);
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
        const publicPaths = ['/login', '/signup', '/reset-password', '/forgot-password'];
        const isPublicPath = publicPaths.includes(currentPath);
        
        // Get session status after checkSession completes
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session && !isPublicPath) {
          console.log('⚠️ No session found, redirecting to login');
          window.location.href = '/login';
          return;
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
            await bridgeSession(token);
          }
        } catch (error) {
          console.error('❌ Session bridge error:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        // CRITICAL FIX: Only redirect to login on explicit SIGNED_OUT event
        // Don't redirect on temporary session null states (TOKEN_REFRESHED, etc.)
        setCurrentUser(null);
        setUserLoggedin(false);
        
        const currentPath = window.location.pathname;
        const publicPaths = ['/login', '/signup', '/reset-password', '/forgot-password'];
        if (!publicPaths.includes(currentPath)) {
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
