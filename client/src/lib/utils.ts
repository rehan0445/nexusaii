import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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


