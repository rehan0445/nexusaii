import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ReferralRedirect Component
 * 
 * Handles referral links in format: /ref/CODE
 * Redirects users to onboarding page with referral code preserved
 */
const ReferralRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { userLoggedin } = useAuth();

  useEffect(() => {
    if (!code) {
      // Invalid referral link - redirect to onboarding without code
      console.warn('⚠️ No referral code in URL');
      navigate('/onboarding/intro', { replace: true });
      return;
    }

    const referralCode = code.toUpperCase().trim();

    // Store referral code in localStorage for later use during registration
    localStorage.setItem('pending_referral_code', referralCode);
    console.log('📝 Referral code stored:', referralCode);

    // If user is already logged in, redirect to main app
    // (They can't use referral code if already registered)
    if (userLoggedin) {
      console.log('👤 User already logged in, redirecting to companion');
      navigate('/companion', { replace: true });
      return;
    }

    // Redirect to onboarding intro page with referral code in URL
    // The onboarding flow will eventually lead to registration
    // The Register page will pick up the code from localStorage or URL
    console.log('🚀 Redirecting to onboarding with referral code:', referralCode);
    navigate(`/onboarding/intro?ref=${referralCode}`, { replace: true });
  }, [code, navigate, userLoggedin]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-400">Redirecting...</p>
      </div>
    </div>
  );
};

export default ReferralRedirect;

