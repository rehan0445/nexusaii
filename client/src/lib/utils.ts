import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, format, differenceInMinutes, differenceInHours } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date/timestamp into a human-readable relative time string
 * 
 * Output examples:
 * - "just now" (< 1 minute ago)
 * - "5 minutes ago"
 * - "2 hours ago"  
 * - "yesterday"
 * - "2 days ago"
 * - "1 week ago"
 * - "Dec 30" (if older than 7 days)
 */
export function formatTimeAgo(dateInput: Date | string | number | null | undefined): string {
  try {
    // Handle null, undefined, or empty values
    if (!dateInput) {
      return 'just now';
    }

    // Convert input to a valid Date object
    let date: Date;

    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      console.warn('formatTimeAgo received invalid date input:', dateInput);
      return 'just now';
    }

    // Check if the date is valid
    if (Number.isNaN(date.getTime())) {
      console.warn('formatTimeAgo received invalid date:', dateInput);
      return 'just now';
    }

    const now = new Date();
    const minutes = differenceInMinutes(now, date);
    const hours = differenceInHours(now, date);
    const days = differenceInDays(now, date);

    // Less than 1 minute
    if (minutes < 1) {
      return 'just now';
    }

    // Less than 60 minutes
    if (minutes < 60) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    }

    // Less than 24 hours
    if (hours < 24) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }

    // Yesterday (1 day ago)
    if (days === 1) {
      return 'yesterday';
    }

    // 2-6 days ago
    if (days < 7) {
      return `${days} days ago`;
    }

    // 7-13 days (1 week ago)
    if (days < 14) {
      return '1 week ago';
    }

    // Older than 7 days - show formatted date (e.g., "Dec 30")
    return format(date, 'MMM d');
  } catch (error) {
    console.error('Error in formatTimeAgo:', error, 'with input:', dateInput);
    return 'just now';
  }
}


// CSRF + credentials-aware fetch helper for state-changing requests
export function getCsrfTokenFromCookie(): string | null {
  try {
    // Try both cookie names for backward compatibility
    const nxaMatch = document.cookie.match(/(?:^|; )nxa_csrf=([^;]+)/);
    if (nxaMatch) return decodeURIComponent(nxaMatch[1]);

    const csrfMatch = document.cookie.match(/(?:^|; )csrf-token=([^;]+)/);
    return csrfMatch ? decodeURIComponent(csrfMatch[1]) : null;
  } catch {
    return null;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase() as HttpMethod;
  const isStateChanging = ['POST','PUT','PATCH','DELETE'].includes(method);
  const headers = new Headers(init.headers || {});
  // Attach Supabase access token if available (for backend Supabase JWT acceptance)
  try {
    if (!headers.has('Authorization')) {
      // Supabase auth is persisted under storageKey 'nexus-auth'
      const raw = localStorage.getItem('nexus-auth');
      if (raw) {
        try {
          const obj = JSON.parse(raw);
          const token = obj?.currentSession?.access_token || obj?.access_token || obj?.session?.access_token;
          if (token) headers.set('Authorization', `Bearer ${token}`);
        } catch {}
      }
    }
  } catch {}
  if (isStateChanging) {
    let token = getCsrfTokenFromCookie();
    // If token missing, try to obtain it from the backend (double submit cookie)
    if (!token) {
      try {
        // Use centralized API configuration
        const { API_CONFIG } = await import('./config');
        const serverUrl = API_CONFIG.getServerUrl();
        await fetch(`${serverUrl}/api/auth/csrf`, { credentials: 'include' });
        token = getCsrfTokenFromCookie();
      } catch {}
    }
    if (token && !headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', token);
  }
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}

// Expose Supabase access token for non-fetch contexts (e.g., Socket.IO auth)
export function getSupabaseAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('nexus-auth');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj?.currentSession?.access_token || obj?.access_token || obj?.session?.access_token || null;
  } catch {
    return null;
  }
}

// ============ ANONYMOUS USER IDENTIFICATION ============

const ANONYMOUS_USER_KEY = 'confession_anonymous_user_id';

/**
 * Generates a UUID v4-like string for anonymous user identification
 */
function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback to manual UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets or generates an anonymous user ID for view tracking
 * This ID is stored in localStorage and persists across sessions
 * until the user clears browser data
 * 
 * @returns The anonymous user ID, or null if localStorage is unavailable
 */
export function getOrCreateAnonymousId(): string | null {
  try {
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      console.warn('localStorage is not available for anonymous ID');
      return null;
    }
    
    // Check for existing anonymous ID
    let anonymousId = localStorage.getItem(ANONYMOUS_USER_KEY);
    
    if (!anonymousId) {
      // Generate new anonymous ID
      anonymousId = generateUUID();
      localStorage.setItem(ANONYMOUS_USER_KEY, anonymousId);
      console.log('✅ Generated new anonymous user ID:', anonymousId);
    }
    
    return anonymousId;
  } catch (error) {
    // localStorage might be disabled (e.g., private browsing)
    console.warn('Failed to get/create anonymous ID:', error);
    return null;
  }
}

/**
 * Checks if localStorage is available in the current browser context
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}


