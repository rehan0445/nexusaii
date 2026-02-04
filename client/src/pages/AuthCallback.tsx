import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import nexusLogo from '../assets/nexus-logo.png';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 Processing auth callback...');

        // Get the session from the URL (email verification)
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Auth callback error:', error);
          setErrorMessage(error.message || 'Authentication failed');
          setStatus('error');
          
          // Redirect to login after 3 seconds
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        if (!session) {
          console.error('❌ No session found after email verification');
          setErrorMessage('No active session found. Please try logging in.');
          setStatus('error');
          
          // Redirect to login after 3 seconds
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        console.log('✅ Email verified successfully!');
        console.log('👤 User:', session.user.email);
        
        // Set localStorage flags for onboarding completion
        localStorage.setItem('hasSeenOnboarding', 'true');
        localStorage.setItem('hasCompletedOnboarding', 'true');
        
        setStatus('success');
        
        // Redirect to companion page after brief success message
        setTimeout(() => {
          console.log('🚀 Redirecting to companion page...');
          navigate('/companion', { replace: true });
        }, 1500);

      } catch (error: any) {
        console.error('❌ Unexpected error during auth callback:', error);
        setErrorMessage(error.message || 'An unexpected error occurred');
        setStatus('error');
        
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-softgold-500/10 via-zinc-900 to-purple-500/10" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex items-center justify-center" style={{ height: '15vh' }}>
            <img src={nexusLogo} alt="Nexus Logo" className="h-full w-auto object-contain" />
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-zinc-800/50 backdrop-blur-xl rounded-2xl p-8 border border-zinc-700 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            
            {/* Loading State */}
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 bg-softgold-500/20 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-softgold-500 animate-spin" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Verifying Your Email
                  </h2>
                  <p className="text-zinc-400">
                    Please wait while we complete your registration...
                  </p>
                </div>
              </>
            )}

            {/* Success State */}
            {status === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Email Verified!
                  </h2>
                  <p className="text-zinc-400">
                    Your account is now active. Redirecting you to Nexus...
                  </p>
                </div>
              </>
            )}

            {/* Error State */}
            {status === 'error' && (
              <>
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Verification Failed
                  </h2>
                  <p className="text-zinc-400 mb-4">
                    {errorMessage}
                  </p>
                  <p className="text-zinc-500 text-sm">
                    Redirecting to login page...
                  </p>
                </div>
              </>
            )}

          </div>
        </div>

        {/* Manual redirect link */}
        {status === 'error' && (
          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/')}
              className="text-softgold-500 hover:text-softgold-300 font-medium transition-colors"
            >
              Go to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;




