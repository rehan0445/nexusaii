import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import { 
  Video, 
  MessageCircle, 
  Zap, 
  Flame,
  ArrowLeft,
  Bell,
  Sparkles,
  Users,
  Globe,
  Star,
  Shield,
  UserCheck
} from "lucide-react";

function NexusConnect() {
  const navigate = useNavigate();
  const { incognitoMode } = useSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState(0);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number}>>([]);
  const [showNotification, setShowNotification] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Theme variables with more vibrant Gen Z colors
  const accentText = incognitoMode ? "text-orange-400" : "text-purple-400";
  const accentBg = incognitoMode ? "bg-orange-500/20" : "bg-purple-500/20";
  const accentBorder = incognitoMode ? "border-orange-400/30" : "border-purple-400/30";
  const mainBg = "bg-black";
  const cardBg = "bg-zinc-900/80";
  const gradientBg = incognitoMode 
    ? "bg-gradient-to-br from-orange-600/20 via-red-500/10 to-pink-500/20"
    : "bg-gradient-to-br from-purple-600/20 via-blue-500/10 to-pink-500/20";

  const emojis = ["🔥", "💀", "😍", "🚀", "✨", "💯", "🌟", "⚡"];

  useEffect(() => {
    setIsVisible(true);
    
    // Emoji rotation
    const emojiInterval = setInterval(() => {
      setCurrentEmoji(prev => (prev + 1) % emojis.length);
    }, 1500);

    // Particle animation
    const particleInterval = setInterval(() => {
      setParticles(prev => [
        ...prev.slice(-20),
        {
          id: Date.now(),
          x: Math.random() * window.innerWidth,
          y: window.innerHeight + 10
        }
      ]);
    }, 300);

    return () => {
      clearInterval(emojiInterval);
      clearInterval(particleInterval);
    };
  }, []);

  // Animated background canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animateBackground = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw floating particles
      particles.forEach((particle, index) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y - (Date.now() % 10000) * 0.05, 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${280 + index * 10}, 70%, 60%)`;
        ctx.fill();
      });

      requestAnimationFrame(animateBackground);
    };

    animateBackground();
  }, [particles]);

  const handleNotifyMe = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <div className={`min-h-screen ${mainBg} relative overflow-hidden`}>
      {/* Animated background canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />
      
      {/* Gradient overlay */}
      <div className={`absolute inset-0 ${gradientBg} z-0`} />
      
      {/* Floating notification */}
      {showNotification && (
        <div className={`fixed top-20 right-4 ${cardBg} border ${accentBorder} rounded-xl p-4 z-50 animate-bounce`}>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-green-400" />
            <span className="text-white text-sm">You're on the list! 🎉</span>
          </div>
        </div>
      )}
      
      <div className="relative z-10 flex-1 pt-20 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          {/* Hero Section - New Headline & Tagline */}
          <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Logo with animated emoji */}
            <div className="relative mb-8">
              <div className={`w-32 h-32 ${accentBg} rounded-3xl flex items-center justify-center mx-auto border ${accentBorder} relative overflow-hidden backdrop-blur-sm`}>
                <Video className={`w-16 h-16 ${accentText} animate-pulse`} />
                <div className="absolute top-2 right-2 text-2xl animate-bounce">
                  {emojis[currentEmoji]}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 animate-pulse" />
              </div>
            </div>

            {/* New Headline */}
            <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
              Mingle
            </h1>
            
            {/* New Tagline */}
            <p className="text-xl md:text-2xl text-zinc-300 mb-3 font-medium">
              No fakes. No cringe. Just authentic connections—worldwide.
            </p>
          </div>

          {/* Key Features - Updated Descriptions */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              { 
                icon: Globe, 
                emoji: "🌎",
                title: "Global Chaos, Real Friends", 
                desc: "Meet strangers worldwide. Find your internet bestie in the chaos.", 
                color: "from-green-500 to-blue-500" 
              },
              { 
                icon: UserCheck, 
                emoji: "🎭",
                title: "Anonymous 'Til You Vibe", 
                desc: "Stay faceless/text-only until YOU choose to reveal. Zero pressure.", 
                color: "from-blue-500 to-purple-500" 
              },
              { 
                icon: Zap, 
                emoji: "⚡",
                title: "Instant Skip (0.5s Flat!)", 
                desc: "Bad vibe? Gone in half a second. Next connection, zero guilt.", 
                color: "from-yellow-500 to-orange-500" 
              },
              { 
                icon: Shield, 
                emoji: "🛡️",
                title: "AI Safety Forcefield", 
                desc: "Our AI boots creeps + weirdos. Real humans only. Period.", 
                color: "from-indigo-500 to-purple-500" 
              },
              { 
                icon: Flame, 
                emoji: "💯",
                title: "Zero Fake Energy", 
                desc: "Forced small talk? Nah. Be your real self—fr.", 
                color: "from-red-500 to-pink-500" 
              },
              { 
                icon: MessageCircle, 
                emoji: "📵",
                title: "Cringe-Free DMs", 
                desc: "Unmatch anyone, anytime. Your comfort > politeness.", 
                color: "from-purple-500 to-pink-500" 
              }
            ].map((feature, index) => (
              <div
                key={index}
                className={`${cardBg} backdrop-blur-sm border ${accentBorder} rounded-2xl p-6 hover:border-opacity-60 transition-all duration-300 group hover:transform hover:scale-105`}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl">{feature.emoji}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* How It Works Section */}
          <div className={`${cardBg} backdrop-blur-sm border ${accentBorder} rounded-2xl p-8 mb-12`}>
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              How It Works
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Connect", desc: "Tap \"Start\" — get paired randomly." },
                { step: "2", title: "Vibe Check", desc: "Chat anonymously (text/video off)." },
                { step: "3", title: "Choose", desc: "Reveal your face ONLY if you're feeling it." },
                { step: "4", title: "Skip or Stick", desc: "Stuck? Skip in 0.5s. Vibing? Swap socials!" }
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className={`w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-lg`}>
                    {step.step}
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
                  <p className="text-zinc-400 text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section - More Interactive */}
          <div className="text-center mb-12">
            <div className={`${cardBg} backdrop-blur-sm border ${accentBorder} rounded-3xl p-8 max-w-2xl mx-auto relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-purple-500/5 animate-pulse" />
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-white mb-4 lowercase">
                  get early access bestie
                </h3>
                <p className="text-zinc-300 mb-6 text-lg">
                  be the first to experience the chaos ✨
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                  <button 
                    onClick={handleNotifyMe}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 transform flex items-center justify-center space-x-2 text-lg"
                  >
                    <Bell className="w-5 h-5" />
                    <span>notify me fr</span>
                  </button>
                  
                  <button 
                    onClick={() => navigate("/")}
                    className="border-2 border-zinc-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800/50 transition-colors"
                  >
                    explore nexus
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Gen Z energy */}
          <div className="text-center pb-16">
            <p className="text-zinc-500 text-sm mb-2">
              mingle is currently being coded by sleep-deprived devs 💀
            </p>
            <p className="text-zinc-600 text-xs">
              no cap, this is gonna hit different when it drops
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NexusConnect; 