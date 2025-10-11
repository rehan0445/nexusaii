import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface OnboardingSlideProps {
  imageUrl: string;
  title: string;
  subtitle: string;
  index: number; // 1-based index
  total: number;
  nextPath: string;
  titleStyle?: React.CSSProperties;
  subtitleStyle?: React.CSSProperties;
  routes?: string[]; // optional explicit targets for dots
  onNext?: () => void; // optional callback before navigation
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ imageUrl, title, subtitle, index, total, nextPath, titleStyle, subtitleStyle, routes, onNext }) => {
  const navigate = useNavigate();
  
  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      navigate(nextPath);
    }
  };
  return (
    <div className="relative h-screen overflow-hidden" style={{minHeight: '100svh', height: '100svh'}}>
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6" style={{minHeight: '100svh'}}>
        <div className="mb-12">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg mb-2" style={titleStyle}>{title}</h1>
          <p className="text-sm sm:text-base text-zinc-200/90 max-w-xs" style={subtitleStyle}>{subtitle}</p>
        </div>

        {/* Progress dots and Next */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Array.from({ length: total }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (routes && routes[i]) navigate(routes[i]);
                }}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i + 1 === index ? 'w-6 bg-softgold-500' : 'w-3 bg-white/40'} ${routes ? 'active:scale-95' : ''}`}
                style={{ outline: 'none' }}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            aria-label="Next"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center text-white"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSlide;


