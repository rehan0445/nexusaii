import { useState, useEffect, useCallback } from 'react';

interface GuestSessionData {
  sessionId: string;
  name: string;
  age: number;
  gender: string;
  sessionStartTimestamp: string;
  isRegistered: boolean;
}

const GUEST_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useGuestTimer = () => {
  const [isGuest, setIsGuest] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [guestSessionData, setGuestSessionData] = useState<GuestSessionData | null>(null);

  // Check if user has an active guest session
  const checkGuestSession = useCallback(() => {
    try {
      const guestSessionStr = localStorage.getItem('guest_session');
      const sessionStartStr = localStorage.getItem('guest_session_start');
      const hasGuestSession = localStorage.getItem('hasGuestSession') === 'true';

      if (!guestSessionStr || !sessionStartStr || !hasGuestSession) {
        setIsGuest(false);
        setTimeRemaining(null);
        setIsExpired(false);
        setGuestSessionData(null);
        return;
      }

      const sessionData: GuestSessionData = JSON.parse(guestSessionStr);
      const sessionStart = new Date(sessionStartStr).getTime();
      const now = Date.now();
      const elapsed = now - sessionStart;
      const remaining = GUEST_SESSION_DURATION - elapsed;

      // Check if session is registered
      if (sessionData.isRegistered) {
        setIsGuest(false);
        setTimeRemaining(null);
        setIsExpired(false);
        setGuestSessionData(null);
        // Clean up guest session data
        localStorage.removeItem('guest_session');
        localStorage.removeItem('guest_session_start');
        localStorage.removeItem('hasGuestSession');
        return;
      }

      if (remaining <= 0) {
        setIsGuest(true);
        setTimeRemaining(0);
        setIsExpired(true);
        setGuestSessionData(sessionData);
      } else {
        setIsGuest(true);
        setTimeRemaining(remaining);
        setIsExpired(false);
        setGuestSessionData(sessionData);
      }
    } catch (error) {
      console.error('Error checking guest session:', error);
      setIsGuest(false);
      setTimeRemaining(null);
      setIsExpired(false);
      setGuestSessionData(null);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    checkGuestSession();
  }, [checkGuestSession]);

  // Update timer every second
  useEffect(() => {
    if (!isGuest || isExpired) return;

    const interval = setInterval(() => {
      const guestSessionStr = localStorage.getItem('guest_session');
      const sessionStartStr = localStorage.getItem('guest_session_start');

      if (!guestSessionStr || !sessionStartStr) {
        setIsGuest(false);
        setTimeRemaining(null);
        setIsExpired(false);
        setGuestSessionData(null);
        clearInterval(interval);
        return;
      }

      const sessionStart = new Date(sessionStartStr).getTime();
      const now = Date.now();
      const elapsed = now - sessionStart;
      const remaining = GUEST_SESSION_DURATION - elapsed;

      if (remaining <= 0) {
        setTimeRemaining(0);
        setIsExpired(true);
        clearInterval(interval);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isGuest, isExpired]);

  // Format time remaining as MM:SS
  const formatTimeRemaining = useCallback((ms: number): string => {
    if (ms <= 0) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    isGuest,
    timeRemaining,
    isExpired,
    guestSessionData,
    formatTimeRemaining,
    checkGuestSession
  };
};

