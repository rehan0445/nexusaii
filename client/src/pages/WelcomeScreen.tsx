import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userLoggedin, loading } = useAuth();
  const [hasChecked, setHasChecked] = useState(false);

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
    console.log('   - Has seen onboarding:', hasSeenOnboarding);
    
    // Small delay to ensure auth state is stable
    setTimeout(() => {
      // Priority 1: If logged in, go to main app
      if (userLoggedin) {
        console.log('   → User logged in, navigating to main app');
        navigate('/companion', { replace: true });
      } 
      // Priority 2: If not seen app intro, show app intro onboarding
      else if (!hasSeenOnboarding) {
        console.log('   → First time user, navigating to app intro');
        navigate('/onboarding/intro', { replace: true });
      } 
      // Priority 3: Seen onboarding but not logged in - show login
      else {
        console.log('   → Returning user not logged in, navigating to login');
        navigate('/login', { replace: true });
      }
      setHasChecked(true);
    }, 100);
  }, [loading, userLoggedin, navigate, hasChecked, location.pathname]);

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

