/**
 * Google Analytics 4 (GA4) User-ID Tracking
 * 
 * This module handles secure User-ID tracking using hashed emails.
 * It ensures NO PII (email, name, phone) is ever sent to Google Analytics.
 */

// GA4 Measurement ID (from index.html)
const GA_MEASUREMENT_ID = 'G-7CPN2Y2QPW';

// Declare gtag function type
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Sanitize data before sending to GA
 * Removes any PII that might accidentally be included
 */
function sanitizeForGA(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized: any = Array.isArray(data) ? [] : {};
  const piiFields = ['email', 'name', 'phone', 'phoneNumber', 'displayName', 'photoURL'];

  for (const key in data) {
    const lowerKey = key.toLowerCase();
    const isPII = piiFields.some(field => lowerKey.includes(field.toLowerCase()));

    if (isPII) {
      console.warn(`⚠️ GA Tracking: Blocked PII field "${key}" from being sent to Google Analytics`);
      continue;
    }

    if (typeof data[key] === 'object' && data[key] !== null) {
      sanitized[key] = sanitizeForGA(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  }

  return sanitized;
}

/**
 * Set User-ID in Google Analytics
 * This should be called after successful login or when session is restored
 * 
 * @param emailHash - SHA-256 hashed email (never send raw email!)
 */
export function setGAUserId(emailHash: string | null): void {
  if (!emailHash) {
    console.warn('⚠️ GA Tracking: No email hash provided, skipping User-ID set');
    return;
  }

  // Ensure gtag is available
  if (typeof globalThis.window === 'undefined' || !globalThis.window.gtag) {
    console.warn('⚠️ GA Tracking: gtag not available');
    return;
  }

  try {
    // Push to dataLayer
    globalThis.window.dataLayer = globalThis.window.dataLayer || [];
    globalThis.window.dataLayer.push({
      event: 'login',
      user_id: emailHash
    });

    // Set user_id in gtag config
    globalThis.window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: emailHash
    });

    console.log('✅ GA Tracking: User-ID set successfully (hashed)');
  } catch (error) {
    console.error('❌ GA Tracking: Error setting User-ID', error);
  }
}

/**
 * Clear User-ID from Google Analytics
 * Call this on logout
 */
export function clearGAUserId(): void {
  if (typeof globalThis.window === 'undefined' || !globalThis.window.gtag) {
    return;
  }

  try {
    globalThis.window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: null
    });

    console.log('✅ GA Tracking: User-ID cleared');
  } catch (error) {
    console.error('❌ GA Tracking: Error clearing User-ID', error);
  }
}

/**
 * Track a custom event with PII protection
 * Automatically sanitizes data before sending
 */
export function trackGAEvent(eventName: string, eventParams?: any): void {
  if (typeof globalThis.window === 'undefined' || !globalThis.window.gtag) {
    return;
  }

  try {
    const sanitizedParams = sanitizeForGA(eventParams || {});

    globalThis.window.gtag('event', eventName, sanitizedParams);
  } catch (error) {
    console.error('❌ GA Tracking: Error tracking event', error);
  }
}

/**
 * Fetch email hash from backend API
 * This should be called after authentication
 * Includes retry logic and better error handling
 */
export async function fetchEmailHash(retries: number = 2): Promise<string | null> {
  try {
    const { API_CONFIG } = await import('./config');
    const { getSupabaseAccessToken } = await import('./utils');

    const token = getSupabaseAccessToken();
    if (!token) {
      console.warn('⚠️ GA Tracking: No auth token available');
      return null;
    }

    const serverUrl = API_CONFIG.getServerUrl();
    const response = await fetch(`${serverUrl}/api/auth/user-hash`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      // If 404 and we have retries left, wait and retry (hash might not be created yet)
      if (response.status === 404 && retries > 0) {
        console.log(`⚠️ GA Tracking: Hash not found, retrying in 1s... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchEmailHash(retries - 1);
      }
      
      // For other errors, log but don't retry
      if (response.status !== 404) {
        console.warn('⚠️ GA Tracking: Failed to fetch email hash:', response.status, response.statusText);
      }
      return null;
    }

    const data = await response.json();
    if (data.success && data.emailHash) {
      return data.emailHash;
    }

    return null;
  } catch (error) {
    // Network errors: retry if we have retries left
    if (retries > 0 && (error as any)?.message?.includes('fetch')) {
      console.log(`⚠️ GA Tracking: Network error, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchEmailHash(retries - 1);
    }
    
    console.error('❌ GA Tracking: Error fetching email hash', error);
    return null;
  }
}

