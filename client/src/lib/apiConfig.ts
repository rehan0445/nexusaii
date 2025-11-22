/**
 * Centralized API Configuration
 * Handles dynamic URL detection, fallback error handling, and retry logic
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Import centralized configuration
import { API_CONFIG } from './config';

// Use centralized configuration for API base URL
function getApiBaseUrl(): string {
  return API_CONFIG.getServerUrl();
}

// Create axios instance with retry logic and error handling
function createApiInstance(): AxiosInstance {
  const baseURL = getApiBaseUrl();
  
  console.log('🔧 Creating axios instance with baseURL:', baseURL);
  console.log('🔧 Current hostname:', window.location.hostname);
  console.log('🔧 Current protocol:', window.location.protocol);
  
  const instance = axios.create({
    baseURL,
    timeout: 45000, // Increased to 45s for AI generation endpoints
    withCredentials: true, // Include cookies in requests
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for authentication
  instance.interceptors.request.use(
    async (config) => {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      
      // CRITICAL FIX: Skip auth check for public endpoints
      const publicEndpoints = [
        '/api/auth/login',
        '/api/auth/signup',
        '/api/auth/session/bridge',
        '/api/auth/reset-password',
        '/api/auth/forgot-password',
        '/api/health'
      ];
      
      const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint));
      
      if (isPublicEndpoint) {
        console.log(`🔓 Public endpoint, skipping auth: ${config.url}`);
        return config;
      }
      
      // CRITICAL FIX: Get token from Supabase but DON'T redirect aggressively
      try {
        const { supabase } = await import('./supabase');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('⚠️ Error getting session:', error);
          // Don't redirect here - let the request fail naturally and let 401 interceptor handle it
        }
        
        if (!session?.access_token) {
          console.warn('⚠️ No active Supabase session - trying fallback');
          
          // Try fallback to localStorage one time
          const authData = localStorage.getItem('nexus-auth');
          let token: string | null = null;
          
          if (authData) {
            try {
              const parsed = JSON.parse(authData);
              token = parsed?.session?.access_token || parsed?.currentSession?.access_token || parsed?.access_token;
            } catch (parseError) {
              console.error('❌ Error parsing localStorage auth:', parseError);
            }
          }
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`🔑 ⚠️ Using fallback token from localStorage`);
          } else {
            console.warn('⚠️ No token available - request will proceed without auth header');
            // Don't redirect here - let the 401 interceptor handle it after the request fails
          }
        } else {
          config.headers.Authorization = `Bearer ${session.access_token}`;
          console.log(`🔑 ✅ Added Supabase JWT to request: ${config.method?.toUpperCase()} ${config.url}`);
          console.log(`🔑 Token preview: ${session.access_token.substring(0, 20)}...`);
        }
      } catch (error) {
        console.error('❌ Error getting auth token:', error);
        // Don't redirect here - let the request proceed and handle errors naturally
      }
      
      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  );

  // Response interceptor with retry logic
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // Handle 401 Unauthorized errors first
      if (error.response?.status === 401 && !originalRequest._authRetry) {
        console.log('🔐 Got 401 Unauthorized, attempting authentication fix...');
        
        try {
          // Get token directly from Supabase
          const { supabase } = await import('./supabase');
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.access_token) {
            const token = session.access_token;
            console.log('🔑 Found Supabase session, attempting session bridge...');
            
            // Try to bridge the session
            const bridgeResponse = await fetch(`${getApiBaseUrl()}/api/auth/session/bridge`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              credentials: 'include'
            });
            
            if (bridgeResponse.ok) {
              console.log('✅ Session bridge successful, retrying original request...');
              originalRequest._authRetry = true;
              // Attach token to retry request
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return instance(originalRequest);
            } else {
              const errorText = await bridgeResponse.text();
              console.error('❌ Session bridge failed:', bridgeResponse.status, bridgeResponse.statusText, errorText);
              
              // If bridge fails, user needs to re-login
              console.error('🚨 Session bridge failed - user needs to log in again');
              
              // Dispatch custom event to trigger redirect to login
              window.dispatchEvent(new CustomEvent('auth:session-expired', { 
                detail: { reason: 'bridge-failed' } 
              }));
            }
          } else {
            console.error('❌ No active Supabase session - user needs to log in');
            
            // Dispatch custom event to trigger redirect to login
            window.dispatchEvent(new CustomEvent('auth:session-expired', { 
              detail: { reason: 'no-session' } 
            }));
          }
        } catch (bridgeError) {
          console.error('❌ Session bridge error:', bridgeError);
        }
      }
      
      // Don't retry if already retried or if it's not a network error
      if (originalRequest._retry || !axios.isAxiosError(error)) {
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }

      // Retry on network errors or 5xx errors
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED' || 
          (error.response && error.response.status >= 500)) {
        
        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        
        // Only retry up to 3 times
        if (originalRequest._retryCount <= 3) {
          console.log(`🔄 Retrying API request (attempt ${originalRequest._retryCount}/3):`, originalRequest.url);
          
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return instance(originalRequest);
        }
      }

      // Log detailed error information
      if (error.response) {
        console.error('❌ API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url,
          method: error.config?.method
        });
      } else if (error.request) {
        console.error('❌ API Network Error:', {
          message: error.message,
          code: error.code,
          url: error.config?.url,
          method: error.config?.method
        });
      } else {
        console.error('❌ API Error:', error.message);
      }

      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  );

  return instance;
}

// Export the configured axios instance
export const apiClient = createApiInstance();

// Export utility functions
export { getApiBaseUrl };

// Helper function to get WebSocket URL
export function getWebSocketUrl(): string {
  const baseUrl = getApiBaseUrl();
  return baseUrl.replace(/^http/, 'ws');
}

// Helper function to check if API is reachable
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get('/api/health', { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.error('❌ API Health Check Failed:', error);
    return false;
  }
}

// Helper function to get user-friendly error message
export function getErrorMessage(error: any): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
      return 'Unable to connect to server. Please check your network connection.';
    }
    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.response?.status === 403) {
      return 'You do not have permission to access this resource.';
    }
    if (error.response?.status === 401) {
      return 'Please log in to continue.';
    }
    if (error.response?.status >= 500) {
      return 'Server error. Please try again later.';
    }
    return error.response?.data?.message || error.message || 'An unexpected error occurred.';
  }
  return error.message || 'An unexpected error occurred.';
}

export default apiClient;
