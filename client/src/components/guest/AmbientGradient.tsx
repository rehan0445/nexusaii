import React from 'react';

/**
 * AmbientGradient - Creates a dark atmospheric background with subtle color shifts
 * Primary: Dark navy/black (80-85% of visual space)
 * Accents: Very subtle teal/purple shifts at LOW opacity (10-15%)
 */
const AmbientGradient: React.FC = () => {
  return (
    <>
      {/* Base layer - DEEP DARK navy/black radial gradient (PRIMARY) */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(
              ellipse 120% 100% at 50% 50%,
              #12161f 0%,
              #0d1117 30%,
              #0a0e14 60%,
              #060810 100%
            )
          `
        }}
      />
      
      {/* Very subtle animated color overlay - EXTREMELY LOW OPACITY */}
      {/* This should be barely noticeable - teal/purple shifts, NOT green-dominant */}
      <div 
        className="absolute inset-0 z-[1] animate-gradient-shift"
        style={{
          background: `
            radial-gradient(ellipse at 25% 25%, rgba(20, 184, 166, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 75% 75%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(99, 102, 241, 0.04) 0%, transparent 45%)
          `,
          mixBlendMode: 'screen'
        }}
      />
      
      {/* Secondary subtle color layer */}
      <div 
        className="absolute inset-0 z-[2] animate-gradient-shift-reverse"
        style={{
          background: `
            radial-gradient(ellipse at 70% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 40%),
            radial-gradient(ellipse at 30% 80%, rgba(20, 184, 166, 0.04) 0%, transparent 40%)
          `,
          mixBlendMode: 'screen'
        }}
      />

      {/* CSS Keyframes - subtle hue shifts */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% {
            opacity: 1;
            filter: hue-rotate(0deg);
          }
          33% {
            opacity: 0.7;
            filter: hue-rotate(15deg);
          }
          66% {
            opacity: 0.85;
            filter: hue-rotate(-10deg);
          }
        }
        
        @keyframes gradient-shift-reverse {
          0%, 100% {
            opacity: 0.6;
            filter: hue-rotate(0deg);
          }
          50% {
            opacity: 0.8;
            filter: hue-rotate(-15deg);
          }
        }
        
        .animate-gradient-shift {
          animation: gradient-shift 35s ease-in-out infinite;
        }
        
        .animate-gradient-shift-reverse {
          animation: gradient-shift-reverse 28s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default AmbientGradient;
