import { useEffect, useState } from "react";

export const breakpoints = {
  mobile: "(max-width: 768px)",
  tablet: "(min-width: 769px) and (max-width: 1024px)",
  desktop: "(min-width: 1025px)",
};

export interface UseResponsive {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const useResponsive = (): UseResponsive => {
  const getMatches = () => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      // Default to desktop in SSR/unknown environments
      return { isMobile: false, isTablet: false, isDesktop: true };
    }

    const isMobile = window.matchMedia(breakpoints.mobile).matches;
    const isTablet = window.matchMedia(breakpoints.tablet).matches;
    const isDesktop = window.matchMedia(breakpoints.desktop).matches;

    return { isMobile, isTablet, isDesktop };
  };

  const [state, setState] = useState<UseResponsive>(getMatches());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") return;

    const mobileMq = window.matchMedia(breakpoints.mobile);
    const tabletMq = window.matchMedia(breakpoints.tablet);
    const desktopMq = window.matchMedia(breakpoints.desktop);

    const handleChange = () => setState(getMatches());

    let usedWindowResizeFallback = false;

    if (
      typeof mobileMq.addEventListener === "function" &&
      typeof tabletMq.addEventListener === "function" &&
      typeof desktopMq.addEventListener === "function"
    ) {
      mobileMq.addEventListener("change", handleChange);
      tabletMq.addEventListener("change", handleChange);
      desktopMq.addEventListener("change", handleChange);
    } else {
      usedWindowResizeFallback = true;
      window.addEventListener("resize", handleChange);
    }

    return () => {
      if (!usedWindowResizeFallback) {
        mobileMq.removeEventListener?.("change", handleChange);
        tabletMq.removeEventListener?.("change", handleChange);
        desktopMq.removeEventListener?.("change", handleChange);
      } else {
        window.removeEventListener("resize", handleChange);
      }
    };
  }, []);

  return state;
}; 