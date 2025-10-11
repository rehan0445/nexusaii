import React from 'react';
import OnboardingSlide from '../../components/OnboardingSlide';

const IntroNexus: React.FC = () => (
  <div className="relative min-h-screen">
    <div className="absolute inset-0">
      <img src={"/assets/intro/nexus.jpg"} alt="Nexus" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
    </div>
    <div className="relative z-10 h-full min-h-screen flex flex-col justify-end p-6">
      <div className="mb-12">
        <h1 className="text-5xl sm:text-6xl font-bold text-white" style={{fontFamily:'EB Garamond, serif'}}>Nexus</h1>
      </div>
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-6 bg-softgold-500 rounded-full" />
          <span className="h-1.5 w-3 bg-white/40 rounded-full" />
          <span className="h-1.5 w-3 bg-white/40 rounded-full" />
          <span className="h-1.5 w-3 bg-white/40 rounded-full" />
          <span className="h-1.5 w-3 bg-white/40 rounded-full" />
        </div>
        <a 
          href="/onboarding/companion" 
          onClick={() => localStorage.setItem('hasSeenOnboarding', 'true')}
          aria-label="Next" 
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center text-white"
        >
          →
        </a>
      </div>
    </div>
  </div>
);

export default IntroNexus;


