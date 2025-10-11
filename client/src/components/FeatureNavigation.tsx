import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, Eye, EyeOff, Layers, Video, Sparkles } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

// Features list
const features = [
  {
    name: 'Companion',
    icon: Bot,
    route: '/ai',
    description: 'Chat with AI companions'
  },
  {
    name: 'Vibe',
    icon: Sparkles,
    route: '/vibe',
    description: 'Discover the vibe'
  },
  {
    name: 'Mingle',
    icon: Video,
    route: '/connect',
    description: 'Start a random video chat'
  }
];

export function FeatureNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const { isMobile } = useResponsive();

  const handleHideToggle = () => {
    console.log('Hide button clicked, current visibility:', isVisible);
    setIsVisible(!isVisible);
  };

  const handleOpacityToggle = () => {
    console.log('Opacity button clicked, current opacity:', opacity);
    setOpacity(prev => prev === 1 ? 0.1 : prev + 0.3);
  };

  if (isMobile) {
    // Mobile: disabled to avoid overlapping with the new Android BottomBar
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
      {/* Controls - Always Visible */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center space-x-2">
        <button
          onClick={handleHideToggle}
          className="p-2 bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/50 cursor-pointer"
          title="Toggle navigation visibility"
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          onClick={handleOpacityToggle}
          className="p-2 bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/50 cursor-pointer"
          title="Toggle navigation opacity"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Bar - Slides up/down */}
      <div className={`transition-all duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-32'
      }`}>
        <div 
          className="bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 rounded-2xl p-2 shadow-xl transition-opacity duration-300"
          style={{ opacity }}
        >
          <div className="flex items-center space-x-2">
            {features.map((feature) => {
              const isActive = location.pathname.startsWith(feature.route);
              return (
                <button
                  key={feature.route}
                  onClick={() => navigate(feature.route)}
                  aria-label={`Navigate to ${feature.name}`}
                  aria-current={isActive ? 'page' : undefined}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(feature.route);
                    }
                  }}
                  className={`group relative px-4 py-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold/50 cursor-pointer ${
                    isActive
                      ? 'bg-gold text-zinc-900'
                      : 'text-zinc-400 hover:bg-zinc-700/50 focus:bg-zinc-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <feature.icon className="w-5 h-5" aria-hidden="true" />
                    <span className="font-medium">{feature.name}</span>
                  </div>
                  <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                    role="tooltip"
                    aria-hidden="true"
                  >
                    {feature.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}