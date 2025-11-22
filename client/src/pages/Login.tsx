import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import nexusLogo from "../assets/nexus-logo.png";

const Login = () => {
  const { userLoggedin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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

  const handleGmailLogin = async () => {
    if (!formData.email || !formData.password) {
      alert('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        alert(error.message || "Login failed");
        return;
      }

      if (data.user) {
        console.log('✅ Login successful:', data.user.email);
        localStorage.setItem('hasSeenOnboarding', 'true');
        localStorage.setItem('hasCompletedOnboarding', 'true');
        
        // Navigate directly to companion page after login
        navigate("/companion");
      }
    } catch (error: any) {
      console.error("Email login error:", error);
      alert(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-softgold-500/10 via-zinc-900 to-purple-500/10" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-6 flex items-center justify-center" style={{ height: '15vh' }}>
            <img src={nexusLogo} alt="Nexus Logo" className="h-full w-auto object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-zinc-400">Sign in to continue to Nexus</p>
        </div>


        {/* Login Form */}
        <div className="bg-zinc-800/50 backdrop-blur-xl rounded-2xl p-8 border border-zinc-700 shadow-2xl">

          <div className="space-y-6">
            {/* Email Login */}
            <div>
              <label htmlFor="email" className="block text-zinc-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-softgold-500 focus:border-transparent transition-all"
                placeholder="your.email@gmail.com"
                required
              />
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
                  placeholder="Enter your password"
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
            </div>

            <button
              onClick={handleGmailLogin}
              disabled={isLoading}
              className="w-full bg-softgold-500 hover:bg-softgold-500 text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-zinc-700 disabled:text-zinc-400 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-zinc-400">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-softgold-500 hover:text-softgold-300 font-medium transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
