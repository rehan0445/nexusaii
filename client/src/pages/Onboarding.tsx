import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Camera, Upload, ChevronLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

interface OnboardingData {
  name: string;
  username: string;
  birthdate: {
    month: string;
    day: string;
    year: string;
  };
  gender: string;
  profileImage: File | null;
  bannerImage: File | null;
  profileImagePreview: string;
  bannerImagePreview: string;
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<OnboardingData>({
    name: "",
    username: "",
    birthdate: {
      month: "",
      day: "",
      year: ""
    },
    gender: "",
    profileImage: null,
    bannerImage: null,
    profileImagePreview: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    bannerImagePreview: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800"
  });

  useEffect(() => {
    // Don't redirect if user is authenticating
    if (!currentUser) {
      console.log('⚠️ No current user in onboarding, waiting...');
      return;
    }
    
    console.log('✅ Current user loaded in onboarding:', currentUser.email);
    
    // 🔍 DEBUG: Verify Supabase session state
    const verifySession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('🔍 Onboarding session check:');
      console.log('  - Session exists:', !!session);
      console.log('  - Access token exists:', !!session?.access_token);
      console.log('  - User ID:', session?.user?.id);
      console.log('  - Error:', error);
      
      if (!session) {
        console.error('❌ WARNING: No Supabase session found on onboarding load!');
      }
    };
    
    verifySession();
    
    // Get name from user metadata if available
    if (currentUser.user_metadata?.name || currentUser.user_metadata?.full_name) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.user_metadata.name || currentUser.user_metadata.full_name || ""
      }));
    }
  }, [currentUser]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBirthdateChange = (field: keyof OnboardingData['birthdate'], value: string) => {
    setFormData(prev => ({
      ...prev,
      birthdate: {
        ...prev.birthdate,
        [field]: value
      }
    }));
  };

  const handleImageUpload = (type: 'profile' | 'banner', file: File) => {
    const preview = URL.createObjectURL(file);
    
    if (type === 'profile') {
      setFormData(prev => ({
        ...prev,
        profileImage: file,
        profileImagePreview: preview
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        bannerImage: file,
        bannerImagePreview: preview
      }));
    }
  };

  const handleNext = () => {
    if (step === 1 && !formData.username.trim()) {
      alert("Please enter a nickname");
      return;
    }
    
    if (step === 2) {
      const { month, day, year } = formData.birthdate;
      if (!month || !day || !year) {
        alert("Please enter your complete birthdate");
        return;
      }
      
      // Validate birthdate
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      const yearNum = parseInt(year);
      
      if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31 || yearNum < 1900 || yearNum > new Date().getFullYear()) {
        alert("Please enter a valid birthdate");
        return;
      }
    }
    
    if (step < 5) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // 🔐 CRITICAL FIX: Get Supabase session and access token BEFORE making API call
      console.log('🔍 Verifying session before profile creation...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ No valid session found:', sessionError);
        alert('Session expired. Please log in again.');
        navigate('/');
        return;
      }
      
      const accessToken = session.access_token;
      console.log('✅ Session verified, access token obtained');
      console.log('👤 User ID:', currentUser.id);
      console.log('📧 Email:', currentUser.email);
      
      // Validate image formats before submission
      if (formData.profileImage && !formData.profileImage.type.includes('jpeg') && !formData.profileImage.type.includes('jpg')) {
        alert('Profile picture must be in JPEG format');
        setIsLoading(false);
        return;
      }
      
      if (formData.bannerImage && !formData.bannerImage.type.includes('jpeg') && !formData.bannerImage.type.includes('jpg')) {
        alert('Banner image must be in JPEG format');
        setIsLoading(false);
        return;
      }
      
      // Format birthdate as YYYY-MM-DD
      const { month, day, year } = formData.birthdate;
      const dateOfBirth = year && month && day ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : '';
      
      // Create FormData for API request
      const apiFormData = new FormData();
      apiFormData.append('uid', currentUser.id);
      apiFormData.append('name', formData.name || formData.username);
      apiFormData.append('username', formData.username);
      apiFormData.append('email', currentUser.email || '');
      apiFormData.append('bio', '');
      apiFormData.append('location', '');
      apiFormData.append('phno', '');
      apiFormData.append('interests', JSON.stringify([]));
      
      if (dateOfBirth) {
        apiFormData.append('date_of_birth', dateOfBirth);
      }
      
      if (formData.gender) {
        apiFormData.append('gender', formData.gender);
      }
      
      if (formData.profileImage) {
        apiFormData.append('profileImg', formData.profileImage);
      }
      
      if (formData.bannerImage) {
        apiFormData.append('bannerImg', formData.bannerImage);
      }
      
      // 🔐 CRITICAL FIX: Include Authorization header with Supabase access token
      console.log('📤 Sending profile creation request with auth token...');
      const response = await fetch('/api/v1/chat/create-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`, // ✅ Send Supabase JWT
        },
        body: apiFormData,
        credentials: 'include' // ✅ Also send cookies (for bridged session)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Profile creation failed:', response.status, data);
        throw new Error(data.message || 'Failed to create profile');
      }
      
      console.log('✅ Profile created successfully!');
      
      // Mark onboarding as complete
      localStorage.setItem('hasCompletedOnboarding', 'true');
      
      // Navigate to companion page (default after registration)
      navigate('/companion');
    } catch (error: any) {
      console.error('❌ Profile creation error:', error);
      alert(error.message || 'Failed to create profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgressBar = () => {
    const progress = (step / 5) * 100;
    
    return (
      <div className="w-full bg-gray-700 h-1 rounded-full mb-8">
        <div 
          className="bg-softgold-500 h-1 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="space-y-6 text-center relative">
      {/* Nexus Logo Background */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
        style={{ opacity: 0.35 }}
      >
        <img 
          src="/src/assets/nexus-logo.png" 
          alt="Nexus Logo" 
          className="max-w-full max-h-full object-contain"
        />
      </div>
      
      <div className="mb-8 relative z-10">
        <div className="text-5xl mb-4">😊</div>
        <h2 className="text-3xl font-bold text-white mb-3">Your nexus identity</h2>
        <p className="text-gray-300">
          Create a unique nickname that represents you.<br/>
          It's how others will know and remember you.
        </p>
      </div>
      
      <div className="mt-8 relative z-10">
        <label className="block text-white text-lg font-semibold mb-4">Nickname</label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          placeholder="Enter your nickname"
          className="w-full px-6 py-4 bg-zinc-900 border border-gray-600 rounded-2xl text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-softgold-500 transition-all"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 text-center">
      <div className="mb-8">
        <div className="text-6xl mb-4">🎂</div>
        <h2 className="text-3xl font-bold text-white mb-3">Let's celebrate you 🎉</h2>
        <p className="text-gray-300">
          Tell us your birthdate. Your profile does not<br/>
          display your birthdate, only your age.
        </p>
      </div>
      
      <div className="mt-8">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 text-sm mb-2">MM</label>
            <input
              type="text"
              maxLength={2}
              value={formData.birthdate.month}
              onChange={(e) => handleBirthdateChange('month', e.target.value.replace(/\D/g, ''))}
              placeholder="MM"
              className="w-full px-4 py-4 bg-zinc-900 border border-gray-600 rounded-2xl text-white text-center text-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-softgold-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">DD</label>
            <input
              type="text"
              maxLength={2}
              value={formData.birthdate.day}
              onChange={(e) => handleBirthdateChange('day', e.target.value.replace(/\D/g, ''))}
              placeholder="DD"
              className="w-full px-4 py-4 bg-zinc-900 border border-gray-600 rounded-2xl text-white text-center text-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-softgold-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-2">YYYY</label>
            <input
              type="text"
              maxLength={4}
              value={formData.birthdate.year}
              onChange={(e) => handleBirthdateChange('year', e.target.value.replace(/\D/g, ''))}
              placeholder="YYYY"
              className="w-full px-4 py-4 bg-zinc-900 border border-gray-600 rounded-2xl text-white text-center text-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-softgold-500 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 text-center">
      <div className="mb-8">
        <div className="text-5xl mb-4">💫</div>
        <h2 className="text-3xl font-bold text-white mb-3">Be true to yourself 🌟</h2>
        <p className="text-gray-300">
          Choose the gender that best represents you.<br/>
          Authenticity is key to meaningful connections.
        </p>
      </div>
      
      <div className="mt-8 space-y-3">
        <button
          onClick={() => handleInputChange('gender', 'Man')}
          className={`w-full px-6 py-4 rounded-2xl text-lg font-semibold transition-all ${
            formData.gender === 'Man'
              ? 'bg-softgold-500 text-black'
              : 'bg-zinc-900 text-white border border-gray-600 hover:border-softgold-500'
          }`}
        >
          Man
        </button>
        
        <button
          onClick={() => handleInputChange('gender', 'Woman')}
          className={`w-full px-6 py-4 rounded-2xl text-lg font-semibold transition-all ${
            formData.gender === 'Woman'
              ? 'bg-softgold-500 text-black'
              : 'bg-zinc-900 text-white border border-gray-600 hover:border-softgold-500'
          }`}
        >
          Woman
        </button>
        
        <button
          onClick={() => handleInputChange('gender', 'Prefer not to say')}
          className={`w-full px-6 py-4 rounded-2xl text-lg font-semibold transition-all ${
            formData.gender === 'Prefer not to say'
              ? 'bg-softgold-500 text-black'
              : 'bg-zinc-900 text-white border border-gray-600 hover:border-softgold-500'
          }`}
        >
          Prefer not to say
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 text-center">
      <div className="mb-8">
        <div className="text-5xl mb-4">📸</div>
        <h2 className="text-3xl font-bold text-white mb-3">Show your face</h2>
        <p className="text-gray-300">
          Upload a profile picture to help others<br/>
          recognize and connect with you.
        </p>
      </div>
      
      <div className="mt-8 flex flex-col items-center">
        <div className="relative">
          <img 
            src={formData.profileImagePreview} 
            alt="Profile preview"
            className="w-32 h-32 rounded-full object-cover border-4 border-softgold-500"
          />
          <label 
            htmlFor="profile-upload"
            className="absolute bottom-0 right-0 bg-softgold-500 text-black p-3 rounded-full cursor-pointer hover:bg-softgold-400 transition-all"
          >
            <Camera size={20} />
            <input
              id="profile-upload"
              type="file"
              accept=".jpg,.jpeg,image/jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Strict JPEG validation
                  const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg' || 
                                 file.name.toLowerCase().endsWith('.jpg') || 
                                 file.name.toLowerCase().endsWith('.jpeg');
                  
                  if (!isJpeg) {
                    alert('Please upload a JPEG image (.jpg or .jpeg)');
                    e.target.value = ''; // Clear the input
                    return;
                  }
                  handleImageUpload('profile', file);
                }
              }}
              className="hidden"
            />
          </label>
        </div>
        <p className="mt-4 text-sm text-gray-400">JPEG format only</p>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 text-center">
      <div className="mb-8">
        <div className="text-5xl mb-4">🖼️</div>
        <h2 className="text-3xl font-bold text-white mb-3">Make it yours</h2>
        <p className="text-gray-300">
          Add a banner image to personalize<br/>
          your profile and make it stand out.
        </p>
      </div>
      
      <div className="mt-8 flex flex-col items-center">
        <div className="relative w-full max-w-md">
          <img 
            src={formData.bannerImagePreview} 
            alt="Banner preview"
            className="w-full h-40 rounded-2xl object-cover border-4 border-softgold-500"
          />
          <label 
            htmlFor="banner-upload"
            className="absolute bottom-4 right-4 bg-softgold-500 text-black p-3 rounded-full cursor-pointer hover:bg-softgold-400 transition-all"
          >
            <Upload size={20} />
            <input
              id="banner-upload"
              type="file"
              accept=".jpg,.jpeg,image/jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Strict JPEG validation
                  const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg' || 
                                 file.name.toLowerCase().endsWith('.jpg') || 
                                 file.name.toLowerCase().endsWith('.jpeg');
                  
                  if (!isJpeg) {
                    alert('Please upload a JPEG image (.jpg or .jpeg)');
                    e.target.value = ''; // Clear the input
                    return;
                  }
                  handleImageUpload('banner', file);
                }
              }}
              className="hidden"
            />
          </label>
        </div>
        <p className="mt-4 text-sm text-gray-400">JPEG format only</p>
      </div>
    </div>
  );

  // Show loading while auth is initializing
  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-softgold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back Button */}
        {step > 1 && (
          <button
            onClick={handleBack}
            className="mb-6 text-white hover:text-softgold-500 transition-colors flex items-center"
          >
            <ChevronLeft size={24} />
            <span className="ml-1">Back</span>
          </button>
        )}
        
        {/* Progress Bar */}
        {renderProgressBar()}
        
        {/* Step Content */}
        <div className="bg-zinc-900 rounded-3xl p-8 border border-gray-800">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>
        
        {/* Continue Button */}
        <button
          onClick={step === 5 ? handleSubmit : handleNext}
          disabled={isLoading}
          className="w-full mt-6 bg-softgold-500 hover:bg-softgold-400 text-black font-bold text-lg py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Profile...' : (step === 5 ? 'Complete' : 'Continue')}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;

