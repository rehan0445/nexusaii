import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_LEFT_COLLAPSED = 'desktop-left-collapsed';
const STORAGE_ABOUT_PANEL = 'desktop-about-panel-open';

function readLeftCollapsed(): boolean {
  try {
    const v = sessionStorage.getItem(STORAGE_LEFT_COLLAPSED);
    return v === 'true';
  } catch {
    return false;
  }
}

function readAboutPanelOpen(): boolean {
  try {
    const v = sessionStorage.getItem(STORAGE_ABOUT_PANEL);
    return v !== 'false'; // default open
  } catch {
    return true;
  }
}

interface DesktopLayoutContextValue {
  leftCollapsed: boolean;
  setLeftCollapsed: (v: boolean) => void;
  aboutPanelOpen: boolean;
  setAboutPanelOpen: (v: boolean) => void;
  isConfessionDetail: boolean;
  isCharacterChat: boolean;
  rightHidden: boolean;
  leftHidden: boolean;
}

const DesktopLayoutContext = createContext<DesktopLayoutContextValue | undefined>(undefined);

export function DesktopLayoutProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const pathname = location.pathname;

  const [leftCollapsed, setLeftCollapsedState] = useState(readLeftCollapsed);
  const [aboutPanelOpen, setAboutPanelOpenState] = useState(readAboutPanelOpen);

  const setLeftCollapsed = useCallback((v: boolean) => {
    setLeftCollapsedState(v);
    try {
      sessionStorage.setItem(STORAGE_LEFT_COLLAPSED, String(v));
    } catch {
      // ignore
    }
  }, []);

  const setAboutPanelOpen = useCallback((v: boolean) => {
    setAboutPanelOpenState(v);
    try {
      sessionStorage.setItem(STORAGE_ABOUT_PANEL, String(v));
    } catch {
      // ignore
    }
  }, []);

  const isConfessionDetail = useMemo(
    () => /\/campus\/[^/]+\/confessions\/[^/]+$/.test(pathname),
    [pathname]
  );
  const isCharacterChat = pathname.startsWith('/chat/');
  const rightHidden = isConfessionDetail || isCharacterChat;
  const leftHidden = isCharacterChat;
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/2d5b2a38-5e31-419c-8a60-677ae4bc8660',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DesktopLayoutContext.tsx:layout',message:'pathname and sidebar flags',data:{pathname,isCharacterChat,rightHidden,leftHidden},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H2'})}).catch(()=>{});
  // #endregion

  const value = useMemo(
    () => ({
      leftCollapsed,
      setLeftCollapsed,
      aboutPanelOpen,
      setAboutPanelOpen,
      isConfessionDetail,
      isCharacterChat,
      rightHidden,
      leftHidden,
    }),
    [
      leftCollapsed,
      setLeftCollapsed,
      aboutPanelOpen,
      setAboutPanelOpen,
      isConfessionDetail,
      isCharacterChat,
      rightHidden,
      leftHidden,
    ]
  );

  return (
    <DesktopLayoutContext.Provider value={value}>
      {children}
    </DesktopLayoutContext.Provider>
  );
}

export function useDesktopLayout() {
  const ctx = useContext(DesktopLayoutContext);
  return ctx;
}
