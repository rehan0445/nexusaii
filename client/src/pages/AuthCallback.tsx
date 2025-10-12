import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * OAuth Callback Handler
 * This page handles redirects after Google OAuth authentication
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 AuthCallback: Processing OAuth redirect...');
        
        // Get the current URL parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        // Check for error in URL
        const error = hashParams.get('error') || searchParams.get('error');
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
        
        if (error) {
          console.error('❌ OAuth error:', error, errorDescription);
          setStatus('error');
          setErrorMessage(errorDescription || error);
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        // Let Supabase handle the callback automatically (detectSessionInUrl: true)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setStatus('error');
          setErrorMessage(sessionError.message);
          
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        if (session) {
          console.log('✅ OAuth login successful!', session.user.email);
          
          // Set onboarding flags
          localStorage.setItem('hasSeenOnboarding', 'true');
          localStorage.setItem('hasCompletedOnboarding', 'true');
          
          setStatus('success');
          
          // Redirect to companion page
          console.log('📍 Redirecting to /companion');
          navigate('/companion', { replace: true });
        } else {
          console.warn('⚠️ No session found after OAuth');
          setStatus('error');
          setErrorMessage('No session found. Please try again.');
          
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        }
      } catch (error: any) {
        console.error('❌ AuthCallback error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Authentication failed');
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-softgold-500 mx-auto"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Completing Sign In...</h2>
            <p className="text-zinc-400">Please wait while we log you in</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="mb-6">
              <div className="rounded-full h-16 w-16 bg-green-500/20 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
            <p className="text-zinc-400">Redirecting to Nexus...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="mb-6">
              <div className="rounded-full h-16 w-16 bg-red-500/20 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Error</h2>
            <p className="text-zinc-400 mb-4">{errorMessage}</p>
            <p className="text-zinc-500 text-sm">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;

