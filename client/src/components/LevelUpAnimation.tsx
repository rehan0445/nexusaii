// Level Up Animation: Celebration effect for affection level increases
import React, { useEffect, useState } from 'react';
import { Heart, Sparkles, TrendingUp } from 'lucide-react';

interface LevelUpAnimationProps {
  show: boolean;
  oldLevel: number;
  newLevel: number;
  tierName: string;
  onComplete: () => void;
}

export const LevelUpAnimation: React.FC<LevelUpAnimationProps> = ({
  show,
  oldLevel,
  newLevel,
  tierName,
  onComplete
}) => {
  const [confetti, setConfetti] = useState<Array<{id: number; x: number; y: number; rotation: number; delay: number}>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        delay: Math.random() * 200
      }));
      setConfetti(particles);

      // Auto-close after animation
      const timer = setTimeout(() => {
        onComplete();
        setConfetti([]);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Confetti */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}ms`,
            transform: `rotate(${particle.rotation}deg)`
          }}
        >
          <Heart className="w-full h-full text-pink-400 fill-current" />
        </div>
      ))}

      {/* Main Card */}
      <div className="pointer-events-auto animate-scale-up-bounce">
        <div className="bg-gradient-to-br from-softgold-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl border-2 border-softgold-400 shadow-2xl p-8 text-center min-w-[350px]">
          {/* Icon */}
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-softgold-400 blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-softgold-500 to-pink-500 rounded-full p-4">
              <TrendingUp className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-white mb-2 animate-fade-in">
            Level Up!
          </h2>

          {/* Level Change */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="flex space-x-1">
              {Array.from({ length: oldLevel }).map((_, i) => (
                <Heart key={`old-${i}`} className="w-5 h-5 text-zinc-400 fill-current" />
              ))}
            </div>
            <span className="text-softgold-400 text-2xl">→</span>
            <div className="flex space-x-1">
              {Array.from({ length: newLevel }).map((_, i) => (
                <Heart key={`new-${i}`} className="w-5 h-5 text-softgold-400 fill-current animate-pulse" />
              ))}
            </div>
          </div>

          {/* Tier Name */}
          <div className="bg-white/10 rounded-full px-6 py-2 inline-block mb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-softgold-400" />
              <span className="text-softgold-300 font-semibold">{tierName}</span>
            </div>
          </div>

          {/* Message */}
          <p className="text-zinc-300 text-sm mt-4">
            Your relationship just got stronger! 💖
          </p>
        </div>
      </div>
    </div>
  );
};

// CSS for animations (add to index.css or component styles)
const confettiKeyframes = `
@keyframes confetti {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes scale-up-bounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.animate-confetti {
  animation: confetti 2s ease-in-out forwards;
}

.animate-scale-up-bounce {
  animation: scale-up-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// Export styles to be added to index.css
export const levelUpAnimationStyles = confettiKeyframes;

export default LevelUpAnimation;

