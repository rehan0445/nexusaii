import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export type RootTabKey = "darkroom" | "confessions" | "companion" | "profile";

export type SubTabKey =
  | "arena.darkroom"
  | "arena.groups"
  | "campus.info"
  | "campus.confessions";

interface TabNavigatorState {
  currentRootTab: RootTabKey;
  perTabSelectedSubTab: Partial<Record<RootTabKey, SubTabKey>>;
  perTabScrollTop: Partial<Record<RootTabKey | SubTabKey, number>>;
  perTabCacheVersion: Partial<Record<RootTabKey | SubTabKey, number>>;
}

interface TabNavigatorContextValue extends TabNavigatorState {
  selectRootTab: (tab: RootTabKey) => void;
  selectSubTab: (subTab: SubTabKey) => void;
  rememberScrollTop: (key: RootTabKey | SubTabKey, value?: number) => void;
  restoreScrollTop: (key: RootTabKey | SubTabKey) => void;
}

const TabNavigatorContext = createContext<TabNavigatorContextValue | undefined>(undefined);

export const useTabNavigator = (): TabNavigatorContextValue => {
  const ctx = useContext(TabNavigatorContext);
  if (!ctx) {
    throw new Error("useTabNavigator must be used within TabNavigatorProvider");
  }
  return ctx;
};

export const TabNavigatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  useRef<number>(0);

  const initialRootTab: RootTabKey = useMemo(() => {
    if (location.pathname.startsWith("/arena/darkroom")) return "darkroom";
    if (location.pathname.startsWith("/campus") || location.pathname.includes("/confessions")) return "confessions";
    if (location.pathname.startsWith("/arena")) return "companion";
    if (location.pathname.startsWith("/companion")) return "companion";
    if (location.pathname.startsWith("/profile")) return "profile";
    return "companion";
  }, [location.pathname]);

  const [state, setState] = useState<TabNavigatorState>({
    currentRootTab: initialRootTab,
    perTabSelectedSubTab: {
      arena: "arena.darkroom",
      campus: "campus.info",
    },
    perTabScrollTop: {},
    perTabCacheVersion: {},
  });

  const selectRootTab = useCallback(
    (tab: RootTabKey) => {
      setState((prev) => ({ ...prev, currentRootTab: tab }));
      switch (tab) {
        case "darkroom":
          navigate("/arena/darkroom", { replace: false });
          break;
        case "confessions":
          navigate("/campus/general/confessions", { replace: false });
          break;
        case "companion":
          navigate("/companion", { replace: false });
          break;
        case "profile":
          navigate("/profile", { replace: false });
          break;
      }
    },
    [navigate, state.perTabSelectedSubTab]
  );

  const selectSubTab = useCallback(
    (subTab: SubTabKey) => {
      setState((prev) => ({
        ...prev,
        perTabSelectedSubTab: {
          ...prev.perTabSelectedSubTab,
          [subTab.startsWith("arena") ? "arena" : "campus"]: subTab,
        },
      }));

      switch (subTab) {
        case "arena.darkroom":
          navigate("/arena/darkroom");
          break;
        case "my-chats":
          navigate("/my-chats");
          break;
        case "campus.info":
          navigate("/campus/general/confessions");
          break;
        case "campus.confessions":
          navigate("/campus/general/confessions");
          break;
      }
    },
    [navigate]
  );

  const rememberScrollTop = useCallback((key: RootTabKey | SubTabKey, value?: number) => {
    const top = typeof value === "number" ? value : window.scrollY;
    setState((prev) => ({ ...prev, perTabScrollTop: { ...prev.perTabScrollTop, [key]: top } }));
  }, []);

  const scrollTopRef = useRef<Record<string, number>>({});
  React.useEffect(() => {
    scrollTopRef.current = state.perTabScrollTop as Record<string, number>;
  }, [state.perTabScrollTop]);

  const restoreScrollTop = useCallback((key: RootTabKey | SubTabKey) => {
    const top = scrollTopRef.current[key] ?? 0;
    window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
  }, []);

  const bumpCacheVersion = useCallback((key: RootTabKey | SubTabKey) => {
    setState((prev) => ({
      ...prev,
      perTabCacheVersion: { ...prev.perTabCacheVersion, [key]: (prev.perTabCacheVersion[key] ?? 0) + 1 },
    }));
  }, []);

  const value = useMemo(() => ({
    ...state,
    selectRootTab,
    selectSubTab,
    rememberScrollTop,
    restoreScrollTop,
    // @ts-expect-error internal prop (not in interface above to keep API minimal)
    bumpCacheVersion,
  }), [state, selectRootTab, selectSubTab, rememberScrollTop, restoreScrollTop, bumpCacheVersion]);

  return <TabNavigatorContext.Provider value={value as any}>{children}</TabNavigatorContext.Provider>;
};


