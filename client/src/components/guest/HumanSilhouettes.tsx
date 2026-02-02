import React from 'react';

/**
 * HumanSilhouettes - Abstract, heavily blurred shapes implying social presence
 * Colors: Dark purple/indigo with SUBTLE teal edge lighting
 * NO green as primary - emerald only as very faint edge accents
 */
const HumanSilhouettes: React.FC = () => {
  return (
    <div className="absolute inset-0 z-[3] overflow-hidden pointer-events-none">
      {/* Left silhouette group - purple/indigo dominant */}
      <div 
        className="absolute silhouette-drift"
        style={{
          left: '-14%',
          top: '22%',
          width: '200px',
          height: '350px',
          background: `
            radial-gradient(ellipse 60% 80% at 70% 30%, rgba(99, 102, 241, 0.06) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 60% 70%, rgba(139, 92, 246, 0.05) 0%, transparent 60%)
          `,
          filter: 'blur(55px)',
          opacity: 0.1,
          borderRadius: '40% 60% 50% 50% / 60% 40% 60% 40%',
          transform: 'rotate(-5deg)'
        }}
      />
      
      {/* Left secondary silhouette - teal accent */}
      <div 
        className="absolute silhouette-drift-slow"
        style={{
          left: '-10%',
          top: '55%',
          width: '150px',
          height: '280px',
          background: `
            radial-gradient(ellipse at center, rgba(20, 184, 166, 0.05) 0%, transparent 70%)
          `,
          filter: 'blur(65px)',
          opacity: 0.08,
          borderRadius: '50% 50% 45% 55% / 55% 45% 55% 45%',
          transform: 'rotate(8deg)'
        }}
      />
      
      {/* Right silhouette group - purple/indigo dominant */}
      <div 
        className="absolute silhouette-drift-reverse"
        style={{
          right: '-12%',
          top: '18%',
          width: '180px',
          height: '320px',
          background: `
            radial-gradient(ellipse 55% 75% at 30% 40%, rgba(139, 92, 246, 0.06) 0%, transparent 65%),
            radial-gradient(ellipse 45% 55% at 40% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 55%)
          `,
          filter: 'blur(60px)',
          opacity: 0.09,
          borderRadius: '55% 45% 50% 50% / 45% 55% 45% 55%',
          transform: 'rotate(3deg)'
        }}
      />
      
      {/* Right secondary silhouette - subtle teal */}
      <div 
        className="absolute silhouette-drift-slow-reverse"
        style={{
          right: '-8%',
          top: '58%',
          width: '140px',
          height: '250px',
          background: `
            radial-gradient(ellipse at center, rgba(20, 184, 166, 0.04) 0%, transparent 65%)
          `,
          filter: 'blur(70px)',
          opacity: 0.07,
          borderRadius: '48% 52% 55% 45% / 52% 48% 52% 48%',
          transform: 'rotate(-6deg)'
        }}
      />
      
      {/* Subtle ambient glow accents - purple/indigo only */}
      <div 
        className="absolute"
        style={{
          left: '5%',
          top: '12%',
          width: '70px',
          height: '70px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.04) 0%, transparent 70%)',
          filter: 'blur(25px)',
          opacity: 0.12
        }}
      />
      
      <div 
        className="absolute"
        style={{
          right: '7%',
          bottom: '18%',
          width: '90px',
          height: '90px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.04) 0%, transparent 70%)',
          filter: 'blur(30px)',
          opacity: 0.1
        }}
      />
      
      <style>{`
        @keyframes silhouette-drift {
          0%, 100% {
            transform: rotate(-5deg) translateY(0);
          }
          50% {
            transform: rotate(-3deg) translateY(-12px);
          }
        }
        
        @keyframes silhouette-drift-slow {
          0%, 100% {
            transform: rotate(8deg) translateX(0);
          }
          50% {
            transform: rotate(10deg) translateX(8px);
          }
        }
        
        @keyframes silhouette-drift-reverse {
          0%, 100% {
            transform: rotate(3deg) translateY(0);
          }
          50% {
            transform: rotate(5deg) translateY(10px);
          }
        }
        
        @keyframes silhouette-drift-slow-reverse {
          0%, 100% {
            transform: rotate(-6deg) translateX(0);
          }
          50% {
            transform: rotate(-8deg) translateX(-6px);
          }
        }
        
        .silhouette-drift {
          animation: silhouette-drift 22s ease-in-out infinite;
        }
        
        .silhouette-drift-slow {
          animation: silhouette-drift-slow 28s ease-in-out infinite;
        }
        
        .silhouette-drift-reverse {
          animation: silhouette-drift-reverse 24s ease-in-out infinite;
        }
        
        .silhouette-drift-slow-reverse {
          animation: silhouette-drift-slow-reverse 30s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default HumanSilhouettes;
