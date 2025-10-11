import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import OnboardingSlide from '../../components/OnboardingSlide';
import nexusImage from '../../assets/intro/nexus.jpg';

const IntroNexus: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen" style={{minHeight: '100svh', height: '100svh'}}>
      <div className="absolute inset-0">
        <img 
          src={nexusImage} 
          alt="Nexus" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
      </div>
      <div className="relative z-10 h-full min-h-screen flex flex-col justify-end p-6">
        <div className="mb-12">
          <h1 className="text-5xl sm:text-6xl font-bold text-white" style={{fontFamily:'EB Garamond, serif'}}>Nexus</h1>
        </div>
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/onboarding/intro")}
              aria-label="Go to slide 1"
              className="h-1.5 w-6 bg-softgold-500 rounded-full active:scale-95"
            />
            <button
              onClick={() => navigate("/onboarding/companion")}
              aria-label="Go to slide 2"
              className="h-1.5 w-3 bg-white/40 rounded-full active:scale-95"
            />
            <button
              onClick={() => navigate("/onboarding/campus")}
              aria-label="Go to slide 3"
              className="h-1.5 w-3 bg-white/40 rounded-full active:scale-95"
            />
            <button
              onClick={() => navigate("/onboarding/darkroom")}
              aria-label="Go to slide 4"
              className="h-1.5 w-3 bg-white/40 rounded-full active:scale-95"
            />
            <button
              onClick={() => navigate("/onboarding/hangout")}
              aria-label="Go to slide 5"
              className="h-1.5 w-3 bg-white/40 rounded-full active:scale-95"
            />
          </div>
          <button
            onClick={() => navigate("/onboarding/companion")}
            aria-label="Next"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 backdrop-blur flex items-center justify-center text-white transition-all"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntroNexus;


