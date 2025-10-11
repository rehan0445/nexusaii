import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Users2 } from "lucide-react";

const Arena: React.FC = () => {
  const navigate = useNavigate();

  const arenaOptions = [
    { 
      id: 'darkroom', 
      name: 'Dark Room', 
      description: 'Anonymous conversations and confessions',
      icon: MessageSquare,
      color: 'from-purple-600 to-pink-600',
      hoverColor: 'from-purple-700 to-pink-700',
      path: '/arena/darkroom'
    },
    { 
      id: 'hangout', 
      name: 'Hangout', 
      description: 'Casual conversations and social interactions',
      icon: Users2,
      color: 'from-blue-600 to-cyan-600',
      hoverColor: 'from-blue-700 to-cyan-700',
      path: '/arena/hangout'
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-softgold-500 to-softgold-700 bg-clip-text text-transparent">
          Arena
        </h1>
        <p className="text-zinc-400 text-lg">Choose your experience</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {arenaOptions.map(option => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => navigate(option.path)}
              className={`bg-gradient-to-br ${option.color} hover:${option.hoverColor} rounded-2xl p-8 flex flex-col items-center text-center space-y-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border border-white/10`}
            >
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <IconComponent className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{option.name}</h2>
                <p className="text-white/80 text-sm leading-relaxed">{option.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      
    </div>
  );
};

export default Arena;


