import { useEffect, useRef, useState } from "react";

export const usePullToRefresh = (onRefresh: () => Promise<void> | void, threshold = 60) => {
  const startYRef = useRef<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshing) return;
      startYRef.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (startYRef.current == null || isRefreshing) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0) setPullDistance(Math.min(dy, threshold * 2));
    };
    const onTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try { await onRefresh(); } finally { setIsRefreshing(false); }
      }
      setPullDistance(0);
      startYRef.current = null;
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart as any);
      window.removeEventListener("touchmove", onTouchMove as any);
      window.removeEventListener("touchend", onTouchEnd as any);
    };
  }, [isRefreshing, onRefresh, pullDistance, threshold]);

  return { isRefreshing, pullDistance } as const;
};

export default usePullToRefresh;


