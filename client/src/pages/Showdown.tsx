import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Star, 
  Zap, 
  Users, 
  MessageSquare, 
  Crown, 
  Target,
  Gift,
  Trophy,
  Flame,
  ArrowRight,
  Share2
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { ProfileButton } from "../components/ProfileButton";

// Enhanced animations and styles
const enhancedStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.4); }
    50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.8); }
  }
  
  @keyframes pulse-ring {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
  }

  @keyframes typing {
    from { width: 0; }
    to { width: 100%; }
  }
  
  @keyframes sparkle {
    0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
    50% { opacity: 1; transform: scale(1) rotate(180deg); }
  }
  
  @keyframes slideInUp {
    from { transform: translateY(50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes bounceIn {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
  
  .float { animation: float 3s ease-in-out infinite; }
  .glow { animation: glow 2s ease-in-out infinite; }
  .pulse-ring { animation: pulse-ring 2s ease-out infinite; }
  .typing { animation: typing 3s steps(40, end) infinite; }
  .sparkle { animation: sparkle 1.5s ease-in-out infinite; }
  .slide-in-up { animation: slideInUp 0.6s ease-out forwards; }
  .bounce-in { animation: bounceIn 0.8s ease-out forwards; }
  .shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
  
  .neon-text {
    text-shadow: 0 0 10px rgba(245, 158, 11, 0.8), 0 0 20px rgba(245, 158, 11, 0.6), 0 0 40px rgba(245, 158, 11, 0.4);
  }
  
  .glass-effect {
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .hover-lift {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .hover-lift:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }
`;

// Define interfaces for type safety
interface Sparkle {
  id: number;
  x: number;
  y: number;
  delay: number;
  size: number;
}

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function Showdown() {
  const navigate = useNavigate();
  const { incognitoMode } = useSettings();
  
  // State for interactive elements
  const [email, setEmail] = useState<string>("");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<CountdownState>({ days: 15, hours: 8, minutes: 42, seconds: 30 });
  const [currentFeature, setCurrentFeature] = useState<number>(0);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [waitlistCount, setWaitlistCount] = useState<number>(2847);
  const [hypeLevel, setHypeLevel] = useState<number>(78);
  
  const accentText = incognitoMode ? "text-yellow-400" : "text-gold";

  // Features carousel
  const features = [
    {
      icon: Users,
      title: "Epic Group Battles",
      description: "Watch 10 AI personalities clash in real-time debates",
      preview: "🤖 vs 🤖 vs 🤖"
    },
    {
      icon: Crown,
      title: "AI Personality Engine",
      description: "Each character has unique traits, quirks, and speaking styles",
      preview: "😤 💭 🎭"
    },
    {
      icon: Target,
      title: "Scenario Challenges",
      description: "Present complex problems and watch AIs compete for solutions",
      preview: "🧩 ⚡ 🏆"
    },
    {
      icon: Flame,
      title: "Drama & Alliances",
      description: "Characters form teams, backstab, and create unexpected alliances",
      preview: "🤝 ⚔️ 💥"
    }
  ];

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        let { days, hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        
        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Feature carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sparkle animation
  useEffect(() => {
    const generateSparkles = () => {
      const newSparkles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
        size: Math.random() * 10 + 5
      }));
      setSparkles(newSparkles);
    };

    generateSparkles();
    const interval = setInterval(generateSparkles, 3000);
    return () => clearInterval(interval);
  }, []);

  // Waitlist increment
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        setWaitlistCount(prev => prev + Math.floor(Math.random() * 3) + 1);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleWaitlistSignup = () => {
    if (!email.trim()) return;
    
    setIsSubscribed(true);
    setWaitlistCount(prev => prev + 1);
    setHypeLevel(prev => Math.min(100, prev + Math.floor(Math.random() * 5) + 1));
    
    setTimeout(() => {
      setEmail("");
    }, 2000);
  };

  return (
    <>
      <style>{enhancedStyles}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-black flex flex-col relative overflow-hidden">
        {/* Animated background sparkles */}
        {sparkles.map(sparkle => (
          <div
            key={sparkle.id}
            className="absolute sparkle pointer-events-none"
            style={{
              left: `${sparkle.x}%`,
              top: `${sparkle.y}%`,
              animationDelay: `${sparkle.delay}s`,
              fontSize: `${sparkle.size}px`
            }}
          >
            ✨
          </div>
        ))}
        
        {/* Enhanced Header */}
        <header className="border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-lg py-3 px-6 flex items-center justify-between z-10 shadow-lg">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/ai")}
              className="text-white hover:text-gold transition-colors bg-zinc-800 p-2 rounded-full hover-lift">
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center">
              <h1 className="text-xl font-bold flex items-center">
                <Sparkles className="w-5 h-5 text-softgold-500 mr-2 sparkle" />
                <span className={`${accentText} neon-text`}>AI Showdown</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ProfileButton />
          </div>
        </header>

        {/* Hype Level Bar */}
        <div className="w-full bg-zinc-800/50 h-2 relative overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-softgold-500 to-yellow-500 transition-all duration-1000 relative"
            style={{ width: `${hypeLevel}%` }}
          >
            <div className="absolute inset-0 shimmer"></div>
                </div>
          <div className="absolute right-2 -top-6 text-xs text-softgold-500 font-bold">
            🔥 Hype Level: {hypeLevel}%
                  </div>
              </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="max-w-6xl w-full">
            
            {/* Hero Section */}
            <div className="text-center mb-12">
              {/* Animated Main Icon */}
              <div className="relative mb-8 flex justify-center">
                <div className="absolute inset-0 pulse-ring bg-softgold-500/20 rounded-full w-32 h-32 mx-auto"></div>
                <div className="absolute inset-0 pulse-ring bg-softgold-500/10 rounded-full w-32 h-32 mx-auto" style={{animationDelay: '1s'}}></div>
                <div className="relative bg-gradient-to-br from-softgold-500 to-yellow-600 p-8 rounded-full shadow-2xl glow float w-32 h-32 flex items-center justify-center">
                  <Sparkles className="w-16 h-16 text-white" />
                        </div>
                      </div>

              {/* Dynamic Title */}
              <h1 className="text-4xl md:text-7xl font-bold text-white mb-6 slide-in-up">
                <span className="bg-gradient-to-r from-softgold-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent neon-text">
                  AI SHOWDOWN
                            </span>
              </h1>

              {/* Dramatic Subtitle */}
              <div className="mb-8 bounce-in">
                <h2 className="text-2xl md:text-4xl font-bold text-zinc-200 mb-2">
                  The Ultimate AI Battle Arena
                </h2>
                <p className="text-lg text-softgold-500 typing overflow-hidden whitespace-nowrap border-r-2 border-softgold-500 mx-auto max-w-max">
                  Where artificial minds collide in epic conversations...
                </p>
                          </div>

              {/* Countdown Timer */}
              <div className="bg-zinc-800/60 glass-effect rounded-2xl p-6 mb-8 hover-lift">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-center">
                  <Clock className="w-6 h-6 mr-2 text-softgold-500" />
                  Launch Countdown
                </h3>
                <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                  {[
                    { label: 'Days', value: countdown.days },
                    { label: 'Hours', value: countdown.hours },
                    { label: 'Minutes', value: countdown.minutes },
                    { label: 'Seconds', value: countdown.seconds }
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="bg-gradient-to-br from-softgold-500 to-yellow-600 text-white font-bold text-2xl md:text-3xl rounded-lg p-3 mb-2 glow">
                        {item.value.toString().padStart(2, '0')}
                            </div>
                      <div className="text-zinc-400 text-sm">{item.label}</div>
                  </div>
                ))}
                      </div>
                        </div>
                      </div>

            {/* Feature Showcase */}
            <div className="mb-12">
              {/* Waitlist Signup */}
              <div className="glass-effect rounded-2xl p-6 hover-lift max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center justify-center">
                  <Crown className="w-6 h-6 mr-2 text-softgold-500" />
                  Join the Elite Waitlist
                </h3>
                
                <div className="bg-gradient-to-r from-softgold-500/20 to-yellow-500/20 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-softgold-500 font-bold">🔥 Current Waitlist</span>
                    <span className="text-2xl font-bold text-white">{waitlistCount.toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-zinc-300">
                    +{Math.floor(Math.random() * 50) + 10} joined in the last hour!
                  </div>
                </div>

                {!isSubscribed ? (
                  <div className="space-y-4">
                    <input
                      type="email"
                      placeholder="Enter your email for early access..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-800/80 border border-zinc-600 rounded-xl px-4 py-3 text-white placeholder:text-zinc-400 focus:outline-none focus:border-softgold-500 transition-colors"
                    />
                    <button
                      onClick={handleWaitlistSignup}
                      disabled={!email.trim()}
                      className="w-full bg-gradient-to-r from-softgold-500 to-yellow-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover-lift flex items-center justify-center"
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      Get VIP Early Access
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-4xl mb-2">🎉</div>
                    <h4 className="text-xl font-bold text-softgold-500 mb-2">Welcome to the Elite!</h4>
                    <p className="text-zinc-300">You'll be among the first to experience AI Showdown!</p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-zinc-400">
                  <span className="flex items-center">
                    <Trophy className="w-4 h-4 mr-1 text-softgold-500" />
                    Early Access Perks
                  </span>
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-softgold-500" />
                    Exclusive Content
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`glass-effect rounded-xl p-6 hover-lift cursor-pointer transition-all ${
                    currentFeature === index ? 'ring-2 ring-softgold-500' : ''
                  }`}
                  onClick={() => setCurrentFeature(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCurrentFeature(index);
                    }
                  }}
                  aria-pressed={currentFeature === index}
                >
                  <feature.icon className="w-10 h-10 text-softgold-500 mb-4 mx-auto float" />
                  <h3 className="font-bold text-white mb-2 text-center">{feature.title}</h3>
                  <p className="text-sm text-zinc-400 text-center">{feature.description}</p>
                  </div>
              ))}
              </div>

            {/* Social Proof & CTAs */}
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center space-x-8 text-zinc-400">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-softgold-500" />
                  <span>{waitlistCount.toLocaleString()} waiting</span>
                </div>
                <div className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-softgold-500" />
                  <span>10 AI characters max</span>
              </div>
                <div className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-softgold-500" />
                  <span>Real-time battles</span>
                    </div>
                  </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <button
                  onClick={() => navigate("/ai")}
                  className="px-8 py-4 bg-gradient-to-r from-softgold-500 to-yellow-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-softgold-500/25 transform hover:scale-105 hover-lift flex items-center"
                >
                  Try Current AI Chat
                  <ArrowRight className="w-5 h-5 ml-2" />
                      </button>
                
                              <button
                  onClick={() => navigator.share?.({ title: 'AI Showdown - Coming Soon!', url: window.location.href })}
                  className="px-6 py-4 glass-effect border border-softgold-500/30 text-softgold-500 font-semibold rounded-xl hover:bg-softgold-500/10 transition-all hover-lift flex items-center"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share the Hype
                              </button>
                            </div>

              <p className="text-zinc-500 max-w-2xl mx-auto">
                🚀 <strong>Coming Soon:</strong> The most epic AI conversation experience ever created. 
                Multiple personalities, dramatic conflicts, and unexpected alliances await!
              </p>
                          </div>
                  </div>
              </div>
      </div>
    </>
  );
}

export default Showdown;
