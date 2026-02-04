import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GuestOnboardingForm from '../components/GuestOnboardingForm';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userLoggedin, loading } = useAuth();
  const [hasChecked, setHasChecked] = useState(false);
  const [showGuestOnboarding, setShowGuestOnboarding] = useState(false);

  // Quick check for first-time visitors - show guest onboarding immediately
  useEffect(() => {
    // Don't show if already logged in
    if (userLoggedin) return;
    
    const hasGuestSession = localStorage.getItem('hasGuestSession') === 'true';
    const guestSession = localStorage.getItem('guest_session');
    
    // If clearly a first-time visitor (no guest session), show onboarding immediately
    if (!hasGuestSession && !guestSession) {
      console.log('🚀 First-time visitor detected, showing guest onboarding immediately');
      setShowGuestOnboarding(true);
    }
  }, [userLoggedin]); // Re-check if userLoggedin changes

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;
    
    // Only check once
    if (hasChecked) return;

    console.log('🔍 WelcomeScreen: Checking user state...');
    console.log('   - Auth loading:', loading);
    console.log('   - User logged in:', userLoggedin);
    console.log('   - Current path:', location.pathname);

    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    const hasGuestSession = localStorage.getItem('hasGuestSession') === 'true';
    const guestSession = localStorage.getItem('guest_session');
    
    console.log('   - Has seen onboarding:', hasSeenOnboarding);
    console.log('   - Has guest session:', hasGuestSession);
    console.log('   - Guest session data:', guestSession ? 'exists' : 'none');
    
    // Small delay to ensure auth state is stable
    setTimeout(() => {
      // Priority 1: If logged in, go to main app
      if (userLoggedin) {
        console.log('   → User logged in, navigating to main app');
        navigate('/companion', { replace: true });
        setHasChecked(true);
        return;
      } 
      
      // Priority 2: If has active guest session, go to companion
      if (hasGuestSession && guestSession) {
        try {
          const sessionData = JSON.parse(guestSession);
          if (!sessionData.isRegistered) {
            const fullAccess = localStorage.getItem('fullAccessSession') === 'true' || sessionData.fullAccess === true;
            const sessionStart = new Date(sessionData.sessionStartTimestamp || 0).getTime();
            const now = Date.now();
            const elapsed = now - sessionStart;
            const thirtyMinutes = 30 * 60 * 1000;
            const oneYear = 365 * 24 * 60 * 60 * 1000;
            const validDuration = fullAccess ? oneYear : thirtyMinutes;
            if (elapsed < validDuration) {
              console.log('   → Session active (full access), navigating to companion');
              navigate('/companion', { replace: true });
              setHasChecked(true);
              return;
            }
            console.log('   → Session expired, clearing and showing onboarding');
            localStorage.removeItem('guest_session');
            localStorage.removeItem('guest_session_start');
            localStorage.removeItem('hasGuestSession');
            localStorage.removeItem('fullAccessSession');
          }
        } catch (e) {
          console.error('Error parsing guest session:', e);
          localStorage.removeItem('guest_session');
          localStorage.removeItem('guest_session_start');
          localStorage.removeItem('hasGuestSession');
          localStorage.removeItem('fullAccessSession');
        }
      }
      
      // Priority 3: If no guest session and not logged in, show guest onboarding form
      // This is the NEW default behavior for first-time visitors
      // We show guest onboarding if:
      // - No active guest session exists, OR
      // - Guest session exists but is expired/registered
      if (!hasGuestSession || !guestSession) {
        console.log('   → First time visitor or no active guest session, showing guest onboarding');
        setShowGuestOnboarding(true);
        setHasChecked(true);
        return;
      }
      
      // Fallback: show onboarding (single entry = name, age, gender)
      console.log('   → Fallback: showing onboarding');
      setShowGuestOnboarding(true);
      
      setHasChecked(true);
    }, 100);
  }, [loading, userLoggedin, navigate, hasChecked, location.pathname]);

  const handleGuestOnboardingComplete = () => {
    setShowGuestOnboarding(false);
    navigate('/companion', { replace: true });
  };

  // Show guest onboarding form
  if (showGuestOnboarding) {
    return <GuestOnboardingForm onComplete={handleGuestOnboardingComplete} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-softgold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading Nexus...</p>
        <p className="text-zinc-500 text-sm mt-2">Checking authentication...</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;

