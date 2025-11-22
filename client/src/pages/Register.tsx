import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Mail, Eye, EyeOff, User, Check, X, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import nexusLogo from "../assets/nexus-logo.png";

const Register: React.FC = () => {
  const { userLoggedin } = useAuth();
  const navigate = useNavigate();

  const appBaseUrl = import.meta.env.VITE_APP_URL || window.location.origin;

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
        alert(error.message || "Registration failed");
        return;
      }

      if (data.user) {
        console.log('✅ Registration successful:', data.user.email);
        console.log('📍 User ID:', data.user.id);
        
        // With email verification disabled, session is created immediately
        if (data.session) {
          // User is automatically logged in - redirect to companion page
          console.log('✅ Session created automatically');
          console.log('🚀 Redirecting to companion page...');
          
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