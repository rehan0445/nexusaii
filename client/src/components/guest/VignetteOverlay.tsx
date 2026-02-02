import React from 'react';

/**
 * VignetteOverlay - Creates depth through edge darkening and VERY subtle center glow
 * NO green backgrounds - only dark tones
 */
const VignetteOverlay: React.FC = () => {
  return (
    <>
      {/* Vignette - darkens edges significantly */}
      <div 
        className="absolute inset-0 z-[5] pointer-events-none"
        style={{
          background: `
            radial-gradient(
              ellipse 75% 55% at center,
              transparent 0%,
              transparent 35%,
              rgba(6, 8, 16, 0.4) 65%,
              rgba(4, 6, 12, 0.7) 100%
            )
          `
        }}
      />
      
      {/* Center spotlight - VERY subtle, no green, just slightly lighter dark */}
      <div 
        className="absolute inset-0 z-[4] pointer-events-none"
        style={{
          background: `
            radial-gradient(
              ellipse 45% 40% at 50% 50%,
              rgba(255, 255, 255, 0.015) 0%,
              rgba(200, 200, 220, 0.008) 30%,
              transparent 60%
            )
          `
        }}
      />
      
      {/* Subtle top-down gradient - dark only */}
      <div 
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(15, 17, 23, 0.3) 0%,
              transparent 25%,
              transparent 75%,
              rgba(4, 6, 12, 0.4) 100%
            )
          `
        }}
      />
    </>
  );
};

export default VignetteOverlay;
