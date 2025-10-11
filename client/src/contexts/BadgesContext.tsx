import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface BadgeCounts {
  arena: number; // dark room + groups
  campus: number; // info new + confession interactions
  companion: number; // AI notifications/unread
}

interface BadgesContextValue extends BadgeCounts {
  setArena: (n: number) => void;
  setCampus: (n: number) => void;
  setCompanion: (n: number) => void;
  increment: (key: keyof BadgeCounts, by?: number) => void;
  clear: (key: keyof BadgeCounts) => void;
}

const STORAGE_KEY = "nexus_badges_v1";

const BadgesContext = createContext<BadgesContextValue | undefined>(undefined);

export const useBadges = (): BadgesContextValue => {
  const ctx = useContext(BadgesContext);
  if (!ctx) throw new Error("useBadges must be used within BadgesProvider");
  return ctx;
};

const readStored = (): BadgeCounts | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BadgeCounts;
  } catch {
    return null;
  }
};

export const BadgesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [counts, setCounts] = useState<BadgeCounts>(() => readStored() || { arena: 0, campus: 0, companion: 0 });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(counts)); } catch {}
  }, [counts]);

  // Listen to lightweight app events to update badges
  useEffect(() => {
    const onEvent = (e: Event) => {
      const { key, delta } = (e as CustomEvent<{ key: keyof BadgeCounts; delta?: number }>).detail || {};
      if (!key) return;
      setCounts((prev) => ({ ...prev, [key]: Math.max(0, prev[key] + (delta ?? 1)) }));
    };
    const onClear = (e: Event) => {
      const { key } = (e as CustomEvent<{ key: keyof BadgeCounts }>).detail || {};
      if (!key) return;
      setCounts((prev) => ({ ...prev, [key]: 0 }));
    };
    window.addEventListener("nexus:badgeIncrement", onEvent as EventListener);
    window.addEventListener("nexus:badgeClear", onClear as EventListener);
    return () => {
      window.removeEventListener("nexus:badgeIncrement", onEvent as EventListener);
      window.removeEventListener("nexus:badgeClear", onClear as EventListener);
    };
  }, []);

  const setArena = useCallback((n: number) => setCounts((p) => ({ ...p, arena: n })), []);
  const setCampus = useCallback((n: number) => setCounts((p) => ({ ...p, campus: n })), []);
  const setCompanion = useCallback((n: number) => setCounts((p) => ({ ...p, companion: n })), []);
  const increment = useCallback((key: keyof BadgeCounts, by = 1) => setCounts((p) => ({ ...p, [key]: Math.max(0, p[key] + by) })), []);
  const clear = useCallback((key: keyof BadgeCounts) => setCounts((p) => ({ ...p, [key]: 0 })), []);

  const value = useMemo<BadgesContextValue>(() => ({
    ...counts,
    setArena,
    setCampus,
    setCompanion,
    increment,
    clear,
  }), [counts, clear, increment, setArena, setCampus, setCompanion]);

  return <BadgesContext.Provider value={value}>{children}</BadgesContext.Provider>;
};


