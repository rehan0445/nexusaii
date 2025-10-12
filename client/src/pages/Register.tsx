import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Eye, EyeOff, User, Check, X, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import nexusLogo from "../assets/nexus-logo.png";

// Google Icon SVG Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const Register: React.FC = () => {
  const { userLoggedin } = useAuth();
  const navigate = useNavigate();

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

  useEffect(() => {
    // Check if user has seen onboarding intro pages
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    
    if (userLoggedin) {
      localStorage.setItem('hasSeenOnboarding', 'true');
      navigate("/companion");
    } else if (!hasSeenOnboarding) {
      // First time user - redirect to onboarding intro
      console.log('🔄 Redirecting to onboarding intro...');
      navigate("/onboarding/intro", { replace: true });
    }
  }, [userLoggedin, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ Google OAuth error:', error);
        alert(error.message || "Google sign up failed");
        setIsLoading(false);
        return;
      }

      console.log('✅ Google OAuth initiated:', data);
      // User will be redirected to Google, then back to /auth/callback
      // The callback page will handle setting localStorage and redirecting to /companion
    } catch (error: any) {
      console.error("Google sign up error:", error);
      alert(error.message || "Google sign up failed");
      setIsLoading(false);
    }
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
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            full_name: formData.name,
          },
        },
      });

      if (error) {
        alert(error.message || "Registration failed");
        return;
      }

      if (data.user) {
        console.log('✅ Registration successful:', data.user.email);
        console.log('📍 Navigating to companion page...');
        
        // Check if email confirmation is required
        if (data.session) {
          // User is automatically logged in - redirect to companion page
          console.log('✅ Session exists, redirecting to /companion');
          localStorage.setItem('hasCompletedOnboarding', 'true');
          navigate("/companion", { replace: true });
        } else {
          // Email confirmation required - show modal
          setRegisteredEmail(formData.email);
          setShowEmailModal(true);
        }
      }
    } catch (error: any) {
      console.error("Email registration error:", error);
      alert(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      {/* Email Confirmation Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative bg-zinc-800 rounded-2xl p-8 max-w-md w-full border border-zinc-700 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => {
                setShowEmailModal(false);
                navigate("/login");
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-4">
              Check Your Email!
            </h2>

            {/* Message */}
            <div className="space-y-4 text-center mb-6">
              <p className="text-zinc-300">
                We've sent a verification link to:
              </p>
              <p className="text-softgold-500 font-semibold text-lg break-all">
                {registeredEmail}
              </p>
              <p className="text-zinc-400 text-sm">
                Please check your inbox and click the verification link to activate your account.
              </p>
              <p className="text-zinc-500 text-xs">
                Don't see it? Check your spam folder.
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                setShowEmailModal(false);
                navigate("/login");
              }}
              className="w-full bg-softgold-500 hover:bg-softgold-600 text-black font-bold py-3 px-4 rounded-lg transition-all duration-300"
            >
              Got it, Go to Login
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-softgold-500/10 via-zinc-900 to-purple-500/10" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex items-center justify-center" style={{ height: '15vh' }}>
            <img src={nexusLogo} alt="Nexus Logo" className="h-full w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join Nexus</h1>
          <p className="text-zinc-400">Create your account to get started</p>
        </div>


        {/* Registration Form */}
        <div className="bg-zinc-800/50 backdrop-blur-xl rounded-2xl p-8 border border-zinc-700 shadow-2xl">
          <div className="space-y-6">
              {/* Google OAuth Registration */}
              <button
                onClick={handleGoogleRegister}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed border border-gray-200"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-zinc-800/50 text-zinc-400">Or register with email</span>
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-zinc-300 text-sm font-medium mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-softgold-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Email Registration */}
              <div>
                <label htmlFor="email" className="block text-zinc-300 text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-softgold-500 focus:border-transparent transition-all"
                    placeholder="your.email@gmail.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-zinc-300 text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-softgold-500 focus:border-transparent transition-all"
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-zinc-400">Minimum 7 characters.</p>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-3">
                <button
                  type="button"
                  onClick={() => setAgreeToTerms(!agreeToTerms)}
                  className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    agreeToTerms
                      ? 'bg-softgold-500 border-softgold-500'
                      : 'border-zinc-600 hover:border-zinc-500'
                  }`}
                >
                  {agreeToTerms && <Check className="w-3 h-3 text-black" />}
                </button>
                <div className="text-sm text-zinc-300 leading-relaxed">
                  I agree to the{" "}
                  <button 
                    onClick={() => navigate("/terms")}
                    className="text-softgold-500 hover:text-softgold-300 underline"
                  >
                    Terms & Conditions
                  </button>{" "}
                  and{" "}
                  <button 
                    onClick={() => navigate("/privacy")}
                    className="text-softgold-500 hover:text-softgold-300 underline"
                  >
                    Privacy Policy
                  </button>
                </div>
              </div>

              {/* Register Button */}
              <button
                onClick={handleGmailRegister}
                disabled={isLoading || !agreeToTerms}
                className="w-full bg-softgold-500 hover:bg-softgold-500 text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-zinc-700 disabled:text-zinc-400 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-zinc-400">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-softgold-500 hover:text-softgold-300 font-medium transition-colors"
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