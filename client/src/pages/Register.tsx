import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Eye, EyeOff, User, Check, X, CheckCircle, Gift, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import nexusLogo from "../assets/nexus-logo.png";

const Register: React.FC = () => {
  const { userLoggedin } = useAuth();
  const navigate = useNavigate();

  const appBaseUrl = import.meta.env.VITE_APP_URL || globalThis.location.origin;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralCodeFromUrl, setReferralCodeFromUrl] = useState(false);

  useEffect(() => {
    // Check for referral code in URL
    const params = new URLSearchParams(globalThis.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase().trim());
      setReferralCodeFromUrl(true);
      localStorage.setItem('pending_referral_code', refCode);
      console.log('📝 Referral code detected from URL:', refCode);
    } else {
      // Check localStorage for pending code
      const storedCode = localStorage.getItem('pending_referral_code');
      if (storedCode) {
        setReferralCode(storedCode.toUpperCase().trim());
        setReferralCodeFromUrl(true);
      }
    }
    
    // Only redirect if user is already logged in
    if (userLoggedin) {
      console.log('✅ User already logged in, redirecting to companion');
      localStorage.setItem('hasSeenOnboarding', 'true');
      navigate("/companion", { replace: true });
      return;
    }
    
    // NEW: If user is a first-time visitor (no guest session), redirect to root
    // This ensures they see the guest onboarding form first
    const hasGuestSession = localStorage.getItem('hasGuestSession') === 'true';
    const guestSession = localStorage.getItem('guest_session');
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    
    // If no guest session and no onboarding seen, redirect to root for guest onboarding
    if (!hasGuestSession && !guestSession && !hasSeenOnboarding) {
      console.log('🔄 First-time visitor on register page, redirecting to guest onboarding');
      navigate("/", { replace: true });
      return;
    }
  }, [userLoggedin, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    setReferralCode(value);
    setReferralCodeFromUrl(false);
    if (value) {
      localStorage.setItem('pending_referral_code', value);
    } else {
      localStorage.removeItem('pending_referral_code');
    }
  };

  const clearReferralCode = () => {
    setReferralCode("");
    setReferralCodeFromUrl(false);
    localStorage.removeItem('pending_referral_code');
  };

  const handleGmailRegister = async () => {
    if (!agreeToTerms) {
      alert("Please agree to the Terms & Conditions");
      return;
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (!formData.name.trim()) {
      alert('Please enter your name');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      // Register user with Supabase Auth
      // Note: Email verification is disabled in Supabase dashboard
      // Users will get instant access without needing to verify email
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            full_name: formData.name,
          },
          // Email redirect URL (not used when verification is disabled)
          emailRedirectTo: `${appBaseUrl}/auth/callback`,
        },
      });

      if (error) {
        console.error('❌ Registration error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Error code:', error.status);
        console.error('Error message:', error.message);
        
        // Provide more specific error messages based on error type
        let errorMessage = "Registration failed. Please try again.";
        
        if (error.status === 500 || error.message?.includes('database') || error.message?.includes('Database')) {
          errorMessage = "We're experiencing technical difficulties. Please try again in a moment or contact support if the problem persists.";
        } else if (error.message?.includes('already registered') || error.message?.includes('already exists') || error.message?.includes('User already registered')) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        } else if (error.message?.includes('email') && error.message?.includes('invalid')) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message?.includes('password') || error.message?.includes('Password')) {
          errorMessage = error.message || "Password requirements not met. Please check and try again.";
        } else if (error.message) {
          // Use the actual error message if it's user-friendly
          errorMessage = error.message;
        }
        
        alert(errorMessage);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        console.log('✅ Registration successful:', data.user.email);
        console.log('📍 User ID:', data.user.id);
        
        // Handle referral code if present
        const codeToUse = referralCode.trim() || localStorage.getItem('pending_referral_code');
        if (codeToUse && codeToUse.length >= 6) {
          try {
            const serverUrl = import.meta.env.VITE_SERVER_URL || globalThis.location.origin;
            const deviceFingerprint = localStorage.getItem('device_fingerprint') || 
              `fp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
            localStorage.setItem('device_fingerprint', deviceFingerprint);
            
            await fetch(`${serverUrl}/api/v1/referrals/use`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                code: codeToUse.toUpperCase().trim(),
                referee_id: data.user.id,
                device_fingerprint: deviceFingerprint,
                utm: {},
                click_history: [],
              }),
            });
            console.log('✅ Referral code processed');
            localStorage.removeItem('pending_referral_code');
          } catch (error) {
            console.error('❌ Error processing referral code:', error);
            // Don't block registration if referral fails
          }
        }
        
        // With email verification disabled, session is created immediately
        if (data.session) {
          // User is automatically logged in - redirect to companion page
          console.log('✅ Session created automatically');
          console.log('🚀 Redirecting to companion page...');
          
          // Migrate guest session if exists
          const guestSessionStr = localStorage.getItem('guest_session');
          if (guestSessionStr) {
            try {
              const guestSession = JSON.parse(guestSessionStr);
              const serverUrl = import.meta.env.VITE_SERVER_URL || globalThis.location.origin;
              
              await fetch(`${serverUrl}/api/guest/migrate-to-user`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  sessionId: guestSession.sessionId,
                  userId: data.user.id
                })
              });
              
              console.log('✅ Guest session migrated to registered user');
              
              // Clear guest session data from localStorage
              localStorage.removeItem('guest_session');
              localStorage.removeItem('guest_session_start');
              localStorage.removeItem('hasGuestSession');
            } catch (error) {
              console.error('⚠️ Error migrating guest session:', error);
              // Don't block registration if migration fails
            }
          }
          
          // Set onboarding completion flags
          localStorage.setItem('hasSeenOnboarding', 'true');
          localStorage.setItem('hasCompletedOnboarding', 'true');
          
          // Redirect to companion page
          navigate("/companion", { replace: true });
        } else {
          // This should not happen when email verification is disabled
          // But keeping as fallback for when verification is re-enabled
          console.warn('⚠️  No session created - email verification may be enabled');
          setRegisteredEmail(formData.email);
          setShowEmailModal(true);
        }
      }
    } catch (error: any) {
      console.error("❌ Email registration error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("Error type:", error?.constructor?.name);
      console.error("Error stack:", error?.stack);
      
      // Provide more specific error messages based on error type
      let errorMessage = "Registration failed. Please try again.";
      
      if (error?.status === 500 || error?.message?.includes('database') || error?.message?.includes('Database')) {
        errorMessage = "We're experiencing technical difficulties. Please try again in a moment or contact support if the problem persists.";
      } else if (error?.message?.includes('already registered') || error?.message?.includes('already exists') || error?.message?.includes('User already registered')) {
        errorMessage = "An account with this email already exists. Please sign in instead.";
      } else if (error?.message?.includes('email') && error?.message?.includes('invalid')) {
        errorMessage = "Please enter a valid email address.";
      } else if (error?.message?.includes('password') || error?.message?.includes('Password')) {
        errorMessage = error.message || "Password requirements not met. Please check and try again.";
      } else if (error?.message) {
        // Use the actual error message if it's user-friendly
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      {/* Email Confirmation Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative bg-[#1A1A1A] rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => {
                setShowEmailModal(false);
                navigate("/login");
              }}
              className="absolute top-4 right-4 text-[#A1A1AA] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-[#A855F7]/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-[#A855F7]" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-4">
              Check Your Email!
            </h2>

            {/* Message */}
            <div className="space-y-4 text-center mb-6">
              <p className="text-[#A1A1AA]">
                We've sent a verification link to:
              </p>
              <p className="text-[#A855F7] font-semibold text-lg break-all">
                {registeredEmail}
              </p>
              <p className="text-[#A1A1AA] text-sm">
                Please check your inbox and click the verification link to activate your account.
              </p>
              <p className="text-[#71717A] text-xs">
                Don't see it? Check your spam folder.
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                setShowEmailModal(false);
                navigate("/login");
              }}
              className="w-full bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
            >
              Got it, Go to Login
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        {/* Background - subtle purple tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#A855F7]/10 via-[#0A0A0A] to-[#9333EA]/10" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex items-center justify-center" style={{ height: '15vh' }}>
            <img src={nexusLogo} alt="Nexus Logo" className="h-full w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join Nexus</h1>
          <p className="text-[#A1A1AA]">Create your account to get started</p>
        </div>


        {/* Registration Form */}
        <div className="bg-[#1A1A1A] backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
          <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-[#A1A1AA] text-sm font-medium mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:border-[#A855F7]/50 transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Email Registration */}
              <div>
                <label htmlFor="email" className="block text-[#A1A1AA] text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:border-[#A855F7]/50 transition-all"
                    placeholder="your.email@gmail.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-[#A1A1AA] text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:border-[#A855F7]/50 transition-all"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A1A1AA] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[#A1A1AA]">Minimum 7 characters.</p>
              </div>

              {/* Referral Code Field (Optional) */}
              <div>
                <label htmlFor="referralCode" className="block text-[#A1A1AA] text-sm font-medium mb-2">
                  Referral Code <span className="text-[#71717A] text-xs font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
                  <input
                    id="referralCode"
                    type="text"
                    value={referralCode}
                    onChange={handleReferralCodeChange}
                    className="w-full pl-10 pr-10 py-3 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#A855F7] focus:border-[#A855F7]/50 transition-all font-mono text-sm uppercase"
                    placeholder="Enter referral code (e.g., ABC12345)"
                    maxLength={20}
                  />
                  {referralCode && (
                    <button
                      type="button"
                      onClick={clearReferralCode}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A1A1AA] hover:text-white transition-colors"
                      aria-label="Clear referral code"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {referralCodeFromUrl && referralCode && (
                  <p className="mt-1 text-xs text-[#A855F7] flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    Referral code detected from link
                  </p>
                )}
                {referralCode && referralCode.length < 6 && (
                  <p className="mt-1 text-xs text-amber-400">Referral code should be at least 6 characters</p>
                )}
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-3">
                <button
                  type="button"
                  onClick={() => setAgreeToTerms(!agreeToTerms)}
                  className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    agreeToTerms
                      ? 'bg-[#A855F7] border-[#A855F7]'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  {agreeToTerms && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="text-sm text-[#A1A1AA] leading-relaxed">
                  I agree to the{" "}
                  <button 
                    onClick={() => navigate("/terms")}
                    className="text-[#A855F7] hover:text-[#A855F7]/80 underline"
                  >
                    Terms & Conditions
                  </button>{" "}
                  and{" "}
                  <button 
                    onClick={() => navigate("/privacy")}
                    className="text-[#A855F7] hover:text-[#A855F7]/80 underline"
                  >
                    Privacy Policy
                  </button>
                </div>
              </div>

              {/* Register Button */}
              <button
                onClick={handleGmailRegister}
                disabled={isLoading || !agreeToTerms}
                className="w-full bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:bg-white/10 disabled:text-[#A1A1AA] disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[#A1A1AA]">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-[#A855F7] hover:text-[#A855F7]/80 font-medium transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Register;