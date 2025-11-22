import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Camera, Upload, MapPin, Sparkles, ArrowRight, MessageSquare, Users, Heart, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from "../contexts/SettingsContext";

const interestTags = [
  "Technology", "Art", "Music", "Gaming", "Reading",
  "Travel", "Fitness", "Cooking", "Photography", "Writing",
  "Movies", "Science", "Fashion", "Sports", "Nature"
];

function SetupProfile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [response, setResponse] = useState('');
  const [formData, setFormData] = useState({
    name: currentUser?.displayName || '',
    bio: '',
    location: '',
    website: '',
    avatar: currentUser?.photoURL || '',
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { incognitoMode } = useSettings();
  const mainBg = incognitoMode ? "bg-black" : "bg-zinc-900";

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const generateSarcasticResponse = (name: string, age: number) => {
    const responses = [
      `Oh great, another ${name}! Just what the internet needed. And ${age}? That's like a million in internet years!`,
      `${name}, aged ${age}... Let me guess, you also enjoy long walks on the beach and "having fun"?`,
      `${name}? Your parents must have been feeling really creative that day! And ${age}? You're practically a digital native!`,
      `Wow, ${name}! With a name like that and being ${age}, you must be the life of every virtual party!`,
      `${age}, huh ${name}? Old enough to know better, young enough to do it anyway!`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.name || !age) {
        alert('Please fill in both name and age!');
        return;
      }
      const response = generateSarcasticResponse(formData.name, parseInt(age));
      setResponse(response);
      setShowResponse(true);
      setTimeout(() => {
        setShowResponse(false);
        setTimeout(() => setStep(2), 500);
      }, 3000);
    } else if (step === 2) {
      if (!formData.bio || !formData.location) {
        alert('Please fill in your bio and location!');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCompletionAnimation(true);
    
    // Navigate to home after animation completes
    setTimeout(() => {
      navigate('/');
    }, 4000); // Total animation duration
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className={`min-h-screen ${mainBg} flex`}>
      {/* Left Panel */}
      <div className="w-full lg:w-[480px] p-8 flex flex-col">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-16">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20 relative overflow-hidden group">
            <span className="text-4xl font-bold text-gold group-hover:scale-110 transition-transform">A</span>
            <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 animate-shimmer" />
          </div>
          <span className="text-3xl font-bold text-gold">AIChat</span>
        </div>

        {/* Steps */}
        <div className="flex items-center space-x-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-gold' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {step === 1 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-white mb-2">Let's Get Started</h1>
              <p className="text-zinc-400 mb-8">First, tell us who you are</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    What's your name?
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    How old are you?
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold"
                    placeholder="Enter your age"
                    min="13"
                    max="120"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-white mb-2">Tell Us More</h1>
              <p className="text-zinc-400 mb-8">Let's add some personality to your profile</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold resize-none"
                    placeholder="Tell us about yourself"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold pl-10"
                      placeholder="Where are you based?"
                      required
                    />
                    <MapPin className="absolute left-3 top-3.5 text-zinc-500 w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-white mb-2">Final Touches</h1>
              <p className="text-zinc-400 mb-8">Let's make your profile stand out</p>
              
              <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-800">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-zinc-500" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-gold text-zinc-900 rounded-full cursor-pointer hover:bg-gold/90 transition-colors">
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                </label>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-300">Profile Picture</h3>
                <p className="text-xs text-zinc-500">
                  Add a photo to help others recognize you
                </p>
              </div>
            </div>

            {/* Interests */}
            <div className="overflow-y-auto scrollbar-thin custom-scrollbar/incognito-scrollbar">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Interests
              </label>
              <div className="flex flex-wrap gap-2">
                {interestTags.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedInterests.includes(interest)
                        ? 'bg-gold text-zinc-900'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gold text-zinc-900 rounded-lg hover:bg-gold/90 transition-colors font-medium"
            >
              <span>Complete Setup</span>
              <Sparkles className="w-5 h-5" />
            </button>
          </form>
            </div>
          )}

          {/* Navigation */}
          {step < 3 && (
            <button
              onClick={handleNextStep}
              className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gold text-zinc-900 rounded-lg hover:bg-gold/90 transition-colors font-medium"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Sarcastic Response Overlay */}
        {showResponse && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 animate-fade-in">
            <div className="bg-zinc-800 rounded-xl p-8 max-w-lg mx-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 animate-shimmer" />
              <div className="relative">
                <Bot className="w-12 h-12 text-gold mb-4" />
                <p className="text-xl text-white">{response}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Completion Animation */}
      {showCompletionAnimation && (
        <div className="fixed inset-0 bg-zinc-900 z-50 flex items-center justify-center">
          {/* Initial Welcome */}
          <div className="text-center animate-fade-in">
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20 relative overflow-hidden group">
                <span className="text-6xl font-bold text-gold group-hover:scale-110 transition-transform">A</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 animate-shimmer" />
              </div>
              
              {/* Orbiting Icons */}
              <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '8s' }}>
                <Bot className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-8 h-8 text-gold transform -rotate-45" />
                <MessageSquare className="absolute top-1/2 right-0 translate-y-1/2 w-8 h-8 text-gold transform rotate-45" />
                <Heart className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-8 h-8 text-gold transform rotate-135" />
                <Users className="absolute top-1/2 left-0 translate-y-1/2 w-8 h-8 text-gold transform -rotate-135" />
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              Welcome to AIChat, {formData.name}!
            </h2>
            
            <p className="text-xl text-zinc-300 animate-fade-in" style={{ animationDelay: '1s' }}>
              Your journey begins now
            </p>
            
            {/* Feature Cards */}
            <div className="mt-12 flex space-x-6 animate-fade-in" style={{ animationDelay: '1.5s' }}>
              <div className="w-48 p-4 bg-zinc-800/50 rounded-xl backdrop-blur-sm">
                <Bot className="w-8 h-8 text-gold mb-2" />
                <h3 className="text-white font-medium mb-1">AI Companions</h3>
                <p className="text-sm text-zinc-400">Chat with AI characters</p>
              </div>
              
              <div className="w-48 p-4 bg-zinc-800/50 rounded-xl backdrop-blur-sm">
                <Star className="w-8 h-8 text-gold mb-2" />
                <h3 className="text-white font-medium mb-1">Personalization</h3>
                <p className="text-sm text-zinc-400">Customize your experience</p>
              </div>
            </div>
            
            {/* Loading Bar */}
            <div className="mt-12 w-96 mx-auto">
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full animate-progress" />
              </div>
              <p className="text-sm text-zinc-500 mt-2 animate-pulse">
                Preparing your experience...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Right Panel - Hero Image */}
      <div className="hidden lg:block flex-1 relative">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1614149162883-504ce4d13909?auto=format&fit=crop&w=1920&q=80"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-12 h-full flex flex-col justify-center max-w-lg">
          <Bot className="w-12 h-12 text-gold mb-8" />
          <h2 className="text-4xl font-bold text-white mb-6">
            Create Your AI Profile
          </h2>
          <p className="text-lg text-zinc-300">
            Your profile helps customize your AI conversations and improves your experience with our AI companions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SetupProfile;