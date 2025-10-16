import React, { useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingSlideProps {
  imageUrl: string;
  title: string;
  subtitle: string;
  index: number; // 1-based index
  total: number;
  nextPath: string;
  prevPath?: string; // optional previous path for swipe back
  titleStyle?: React.CSSProperties;
  subtitleStyle?: React.CSSProperties;
  routes?: string[]; // optional explicit targets for dots
  onNext?: () => void; // optional callback before navigation
  onPrev?: () => void; // optional callback before previous navigation
}

const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ 
  imageUrl, 
  title, 
  subtitle, 
  index, 
  total, 
  nextPath, 
  prevPath,
  titleStyle, 
  subtitleStyle, 
  routes, 
  onNext,
  onPrev 
}) => {
  const navigate = useNavigate();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  
  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      navigate(nextPath);
    }
  };

  const handlePrev = () => {
    if (onPrev) {
      onPrev();
    } else if (prevPath) {
      navigate(prevPath);
    } else if (routes?.[index - 2]) {
      navigate(routes[index - 2]);
    }
  };

  // Swipe gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    isSwiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX.current);
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    
    // If horizontal movement is greater than vertical, prevent scrolling
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const deltaTime = Date.now() - touchStartTime.current;
    
    // Calculate velocity (pixels per millisecond)
    const velocity = Math.abs(deltaX) / deltaTime;
    
    // Check if it's a horizontal swipe (not vertical scroll)
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const threshold = 50;
    const velocityThreshold = 0.3;
    
    if (isHorizontalSwipe && Math.abs(deltaX) > threshold && velocity > velocityThreshold) {
      if (deltaX > 0 && index > 1) {
        // Swipe right - go to previous slide
        handlePrev();
      } else if (deltaX < 0) {
        // Swipe left - go to next slide (or get started on last slide)
        handleNext();
      }
    }
    
    isSwiping.current = false;
  }, [index, total, handleNext, handlePrev]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
      case 'Enter':
        e.preventDefault();
        handleNext();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (index > 1) {
          handlePrev();
        }
        break;
      case 'Tab':
        // Allow default tab behavior for accessibility
        break;
    }
  }, [index, total, handleNext, handlePrev]);

  // Focus management for accessibility
  useEffect(() => {
    const handleFocus = () => {
      // Ensure the slide is focused for keyboard navigation
      const slideElement = document.querySelector('[data-onboarding-slide]');
      if (slideElement && !slideElement.contains(document.activeElement)) {
        (slideElement as HTMLElement).focus();
      }
    };

    handleFocus();
  }, [index]);
  return (
    <div 
      className="relative h-screen overflow-hidden focus:outline-none" 
      style={{minHeight: '100svh', height: '100svh'}}
      data-onboarding-slide
      tabIndex={0}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label={`Onboarding slide ${index} of ${total}: ${title}`}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            console.error('Failed to load onboarding image:', e.currentTarget.src);
            e.currentTarget.style.backgroundColor = '#1a1a1a';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6" style={{minHeight: '100svh'}}>
        <div className="mb-12">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-lg mb-2" style={titleStyle}>{title}</h1>
          <p className="text-sm sm:text-base text-zinc-200/90 max-w-xs" style={subtitleStyle}>{subtitle}</p>
        </div>

        {/* Progress dots and Navigation */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Array.from({ length: total }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (routes?.[i]) navigate(routes[i]);
                }}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i + 1 === index ? 'w-6 bg-softgold-500' : 'w-3 bg-white/40'} ${routes ? 'active:scale-95 hover:scale-105' : ''}`}
                style={{ outline: 'none' }}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Previous button - only show if not on first slide */}
            {index > 1 && (
              <button
                onClick={handlePrev}
                aria-label="Previous slide"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center text-white transition-all active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            {/* Next button - show on all slides, including last slide */}
            <button
              onClick={handleNext}
              aria-label={index < total ? "Next slide" : "Get Started"}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur flex items-center justify-center text-white transition-all active:scale-95"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSlide;


