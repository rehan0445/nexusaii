import { useEffect, useCallback, useRef } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Minimum distance for a swipe (in pixels)
  velocityThreshold?: number; // Minimum velocity for a swipe
  disabled?: boolean;
}

/**
 * Custom hook for detecting left and right swipe gestures
 * Works on both touch devices (mobile) and mouse (desktop for testing)
 */
export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  velocityThreshold = 0.3,
  disabled = false
}: SwipeGestureOptions) => {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    isSwiping.current = true;
  }, [disabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || !isSwiping.current) return;
    
    // Prevent default scrolling while determining swipe direction
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartX.current);
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    
    // If horizontal movement is greater than vertical, prevent scrolling
    if (deltaX > deltaY && deltaX > 10) {
      e.preventDefault();
    }
  }, [disabled]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (disabled || !isSwiping.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    const deltaTime = Date.now() - touchStartTime.current;
    
    // Calculate velocity (pixels per millisecond)
    const velocity = Math.abs(deltaX) / deltaTime;
    
    // Check if it's a horizontal swipe (not vertical scroll)
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    
    if (isHorizontalSwipe && Math.abs(deltaX) > threshold && velocity > velocityThreshold) {
      if (deltaX > 0 && onSwipeRight) {
        // Swipe right
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        // Swipe left
        onSwipeLeft();
      }
    }
    
    isSwiping.current = false;
  }, [disabled, threshold, velocityThreshold, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    if (disabled) return;

    // Add touch event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isSwiping: isSwiping.current
  };
};

export default useSwipeGesture;

