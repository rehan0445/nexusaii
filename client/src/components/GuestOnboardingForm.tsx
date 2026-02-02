import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../lib/config';

// Import ambient background components
import AmbientGradient from './guest/AmbientGradient';
import VignetteOverlay from './guest/VignetteOverlay';
import ParticleBackground from './guest/ParticleBackground';
import HumanSilhouettes from './guest/HumanSilhouettes';

interface GuestOnboardingFormProps {
  onComplete: () => void;
}

const GuestOnboardingForm: React.FC<GuestOnboardingFormProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const generateSessionId = (): string => {
    return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.age || parseInt(formData.age) < 13 || parseInt(formData.age) > 120) {
      setError('Please enter a valid age (13-120)');
      return;
    }

    if (!formData.gender) {
      setError('Please select your gender');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate session ID
      const sessionId = generateSessionId();
      const sessionStartTime = new Date().toISOString();

      // Store in localStorage for client-side tracking
      const guestSessionData = {
        sessionId,
        name: formData.name.trim(),
        age: parseInt(formData.age),
        gender: formData.gender,
        sessionStartTimestamp: sessionStartTime,
        isRegistered: false
      };

      localStorage.setItem('guest_session', JSON.stringify(guestSessionData));
      localStorage.setItem('guest_session_start', sessionStartTime);

      // Create guest session in Supabase via backend API
      const serverUrl = API_CONFIG.getServerUrl();
      const response = await fetch(`${serverUrl}/api/guest/create-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          age: parseInt(formData.age),
          gender: formData.gender,
          sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create guest session' }));
        throw new Error(errorData.message || 'Failed to create guest session');
      }

      const data = await response.json();

      // Mark that user has started guest session
      localStorage.setItem('hasGuestSession', 'true');
      localStorage.setItem('hasSeenOnboarding', 'true');

      console.log('✅ Guest session created:', data);

      // Call onComplete callback
      onComplete();

      // Navigate to companion page
      navigate('/companion', { replace: true });
    } catch (err: any) {
      console.error('❌ Error creating guest session:', err);
      setError(err.message || 'Failed to create guest session. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* === LAYERED BACKGROUND SYSTEM (ALL DARK TONES) === */}
      
      {/* Layer 0: Base gradient - DARK navy/black */}
      <AmbientGradient />
      
      {/* Layer 1: Human silhouettes - purple/teal, NO green */}
      <HumanSilhouettes />
      
      {/* Layer 2: Vignette and spotlight - dark only */}
      <VignetteOverlay />
      
      {/* Layer 3: Floating particles - mixed colors */}
      <ParticleBackground />
      
      {/* === MAIN CONTENT === */}
      <div className="relative z-[20] flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          
          {/* === GLASSMORPHIC CARD - DARK background with subtle emerald border glow === */}
          <div 
            className="relative card-entrance"
            style={{
              // DARK semi-transparent background (NOT green)
              background: 'rgba(12, 15, 22, 0.75)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              // Subtle border - very faint emerald glow
              border: '1px solid rgba(55, 65, 81, 0.5)',
              borderRadius: '24px',
              // Multi-layer shadow: dark depth + SUBTLE emerald accent glow
              boxShadow: `
                0 4px 6px rgba(0, 0, 0, 0.15),
                0 10px 40px rgba(0, 0, 0, 0.5),
                0 0 1px rgba(16, 185, 129, 0.3),
                0 0 40px rgba(16, 185, 129, 0.04),
                inset 0 1px 0 rgba(255, 255, 255, 0.03)
              `,
              padding: '2.5rem',
            }}
          >
            {/* Inner subtle gradient - DARK purple/indigo tones, NOT green */}
            <div 
              className="absolute inset-0 rounded-[24px] pointer-events-none"
              style={{
                background: `
                  radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.04) 0%, transparent 50%),
                  radial-gradient(ellipse at 50% 100%, rgba(99, 102, 241, 0.03) 0%, transparent 40%)
                `,
                opacity: 0.8
              }}
            />
            
            {/* Card content */}
            <div className="relative z-10">
              {/* Logo/Header */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-5 relative">
                  {/* Logo glow - subtle, not overwhelming */}
                  <div 
                    className="absolute inset-0 rounded-full animate-pulse-slow"
                    style={{
                      background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
                      filter: 'blur(12px)',
                      transform: 'scale(1.2)'
                    }}
                  />
                  <img 
                    src="/assets/nexus-logo.png" 
                    alt="Nexus Logo" 
                    className="w-full h-full object-contain relative z-10 drop-shadow-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                
                <h1 className="text-3xl font-bold mb-2 text-white">
                  Welcome to Nexus
                </h1>
                
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Begin your journey with just a few details
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Input */}
                <div className="form-field-entrance" style={{ animationDelay: '0.1s' }}>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-2">
                    What should we call you?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3.5 rounded-xl text-white placeholder-zinc-500 transition-all duration-300 ease-out"
                      style={{
                        // DARK navy background (NOT green)
                        background: 'rgba(17, 20, 28, 0.8)',
                        border: focusedField === 'name' 
                          ? '1px solid rgba(16, 185, 129, 0.5)' // Emerald border on focus ONLY
                          : '1px solid rgba(55, 65, 81, 0.5)',  // Gray border default
                        boxShadow: focusedField === 'name'
                          ? '0 0 15px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.02)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.02)',
                        outline: 'none'
                      }}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Age Input */}
                <div className="form-field-entrance" style={{ animationDelay: '0.2s' }}>
                  <label htmlFor="age" className="block text-sm font-medium text-zinc-300 mb-2">
                    How old are you?
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('age')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Enter your age"
                      min="13"
                      max="120"
                      className="w-full px-4 py-3.5 rounded-xl text-white placeholder-zinc-500 transition-all duration-300 ease-out"
                      style={{
                        // DARK navy background (NOT green)
                        background: 'rgba(17, 20, 28, 0.8)',
                        border: focusedField === 'age' 
                          ? '1px solid rgba(16, 185, 129, 0.5)'
                          : '1px solid rgba(55, 65, 81, 0.5)',
                        boxShadow: focusedField === 'age'
                          ? '0 0 15px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.02)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.02)',
                        outline: 'none'
                      }}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Gender Select */}
                <div className="form-field-entrance" style={{ animationDelay: '0.3s' }}>
                  <label htmlFor="gender" className="block text-sm font-medium text-zinc-300 mb-2">
                    How do you identify?
                  </label>
                  <div className="relative">
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('gender')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full px-4 py-3.5 rounded-xl text-white transition-all duration-300 ease-out appearance-none cursor-pointer"
                      style={{
                        // DARK navy background (NOT green)
                        background: 'rgba(17, 20, 28, 0.8)',
                        border: focusedField === 'gender' 
                          ? '1px solid rgba(16, 185, 129, 0.5)'
                          : '1px solid rgba(55, 65, 81, 0.5)',
                        boxShadow: focusedField === 'gender'
                          ? '0 0 15px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.02)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.02)',
                        outline: 'none'
                      }}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="" className="bg-[#11141c]">Select your gender</option>
                      <option value="male" className="bg-[#11141c]">Male</option>
                      <option value="female" className="bg-[#11141c]">Female</option>
                      <option value="other" className="bg-[#11141c]">Other</option>
                      <option value="prefer_not_to_say" className="bg-[#11141c]">Prefer not to say</option>
                    </select>
                    {/* Custom dropdown arrow */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div 
                    className="rounded-xl p-3.5 text-sm animate-shake"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5'
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Submit Button - THIS IS WHERE GREEN IS THE PRIMARY COLOR */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 ease-out transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none button-entrance"
                  style={{
                    // GREEN BUTTON - This is the ONLY element with green as primary background
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    boxShadow: isSubmitting 
                      ? 'none'
                      : `
                        0 4px 15px rgba(16, 185, 129, 0.25),
                        0 1px 3px rgba(0, 0, 0, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                      `,
                    animationDelay: '0.4s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.boxShadow = `
                        0 6px 25px rgba(16, 185, 129, 0.35),
                        0 2px 5px rgba(0, 0, 0, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.15)
                      `;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.boxShadow = `
                        0 4px 15px rgba(16, 185, 129, 0.25),
                        0 1px 3px rgba(0, 0, 0, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                      `;
                    }
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Starting your journey...
                    </span>
                  ) : (
                    'Start Exploring'
                  )}
                </button>

                {/* Info Text */}
                <p className="text-xs text-zinc-500 text-center mt-4 leading-relaxed">
                  You'll have <span className="text-emerald-400/70">30 minutes</span> to explore freely.
                  <br />Complete registration anytime to continue.
                </p>
              </form>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* === GLOBAL ANIMATIONS === */}
      <style>{`
        @keyframes card-entrance {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes form-field-entrance {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes button-entrance {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1.2); }
          50% { opacity: 0.6; transform: scale(1.25); }
        }
        
        .card-entrance {
          animation: card-entrance 0.6s ease-out forwards;
        }
        
        .form-field-entrance {
          opacity: 0;
          animation: form-field-entrance 0.4s ease-out forwards;
        }
        
        .button-entrance {
          opacity: 0;
          animation: button-entrance 0.4s ease-out forwards;
        }
        
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(15, 18, 25, 0.5);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(100, 100, 120, 0.3);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 100, 120, 0.5);
        }
        
        /* Remove number input spinners */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default GuestOnboardingForm;
