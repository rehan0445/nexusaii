import React, { useMemo } from 'react';

interface Particle {
  id: number;
  size: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
}

/**
 * ParticleBackground - Floating ambient particles
 * Colors: MIX of teal, purple, indigo, with SOME emerald (not dominant)
 * Opacity: Very low (5-12%)
 */
const ParticleBackground: React.FC = () => {
  const particles = useMemo(() => {
    // Color distribution: 40% purple/indigo, 35% teal, 25% emerald
    // This ensures green is NOT dominant
    const colors = [
      'rgba(139, 92, 246, 0.7)',   // Purple (most common)
      'rgba(99, 102, 241, 0.6)',   // Indigo
      'rgba(139, 92, 246, 0.5)',   // Purple variant
      'rgba(20, 184, 166, 0.5)',   // Teal
      'rgba(20, 184, 166, 0.4)',   // Teal variant
      'rgba(16, 185, 129, 0.4)',   // Emerald (less common)
      'rgba(99, 102, 241, 0.5)',   // Indigo variant
    ];
    
    const generated: Particle[] = [];
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
      // Bias particles toward edges (avoid center where form is)
      let x: number;
      const edgeBias = Math.random();
      if (edgeBias < 0.4) {
        x = Math.random() * 22; // Left 22%
      } else if (edgeBias < 0.8) {
        x = 78 + Math.random() * 22; // Right 22%
      } else {
        // Some in middle but top/bottom areas
        x = 22 + Math.random() * 56;
      }
      
      generated.push({
        id: i,
        size: 2 + Math.random() * 3,
        x,
        y: Math.random() * 100,
        duration: 10 + Math.random() * 15,
        delay: Math.random() * 20,
        opacity: 0.04 + Math.random() * 0.08, // Very low: 4-12%
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    return generated;
  }, []);

  return (
    <div className="absolute inset-0 z-[6] overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full particle-float"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            willChange: 'transform'
          }}
        />
      ))}
      
      <style>{`
        @keyframes particle-float {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: var(--particle-opacity, 0.06);
          }
          25% {
            transform: translate3d(8px, -25vh, 0) scale(1.05);
            opacity: calc(var(--particle-opacity, 0.06) * 1.1);
          }
          50% {
            transform: translate3d(-4px, -50vh, 0) scale(0.95);
            opacity: var(--particle-opacity, 0.06);
          }
          75% {
            transform: translate3d(12px, -75vh, 0) scale(1.02);
            opacity: calc(var(--particle-opacity, 0.06) * 0.9);
          }
          100% {
            transform: translate3d(0, -100vh, 0) scale(1);
            opacity: 0;
          }
        }
        
        .particle-float {
          animation: particle-float linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ParticleBackground;
