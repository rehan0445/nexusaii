import React, { useEffect, useMemo, useState } from "react";
import { useResponsive } from "../../hooks/useResponsive";
import {
  MessageSquare,
  Moon,
  X,
} from "lucide-react";
import VibeHeader from "./VibeHeader";

export type VibeSectionKey = "chats" | "darkroom";

export interface VibeNavigationProps {
  activeSection: VibeSectionKey;
  onChangeSection: (next: VibeSectionKey) => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: string[]) => void;
  selectedFilters?: string[];
}

const vibeSections: Array<{
  key: VibeSectionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "chats", label: "Chats", icon: MessageSquare },
  { key: "darkroom", label: "Dark Room", icon: Moon },
];

export default function VibeNavigation({ 
  activeSection, 
  onChangeSection, 
  onSearch, 
  onFilterChange, 
  selectedFilters = [] 
}: VibeNavigationProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isSmallScreen = useMemo(() => isMobile || isTablet, [isMobile, isTablet]);

  // Close the drawer when moving to desktop to prevent stale state
  useEffect(() => {
    if (isDesktop) setIsDrawerOpen(false);
  }, [isDesktop]);

  const NavItems = () => (
    <nav className="flex flex-col gap-2 p-2" aria-label="Vibe sections">
      {vibeSections.map(({ key, label, icon: Icon }) => {
        const isActive = key === activeSection;
        return (
          <button
            key={key}
            onClick={() => {
              onChangeSection(key);
              if (isSmallScreen) setIsDrawerOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-softgold-500/40 ${
              isActive
                ? "bg-softgold-100/10 text-softgold-50 border border-softgold-200/20 shadow-sm"
                : "text-zinc-300 hover:bg-zinc-800/40 hover:text-zinc-100"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className={`w-5 h-5 transition-colors ${
              isActive ? "text-softgold-300" : "text-zinc-400 group-hover:text-zinc-300"
            }`} />
            <span className="font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );

  if (isSmallScreen) {
    return (
      <>
        <VibeHeader
          onSearch={onSearch}
          onFilterChange={onFilterChange}
          selectedFilters={selectedFilters}
          onMenuToggle={() => setIsDrawerOpen((v) => !v)}
          isMenuOpen={isDrawerOpen}
          actionsEnabled={activeSection === "chats" || activeSection === "confession"}
          mode={activeSection === "confession" ? "confession" : "chats"}
        />

        {/* Enhanced Mobile Drawer */}
        <div
          className={`fixed inset-0 z-50 transition-opacity ${
            isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          } bg-black/60 backdrop-blur-sm`}
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden={!isDrawerOpen}
        />

        {/* Drawer panel with improved styling */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-80 max-w-[85%] bg-black/95 backdrop-blur-md transition-transform duration-300 ease-out ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Vibe menu"
        >
          {/* Header with Nexus branding and close button */}
          <div className="h-14 px-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-softgold-500 to-softgold-700 flex items-center justify-center shadow-lg">
                <span className="text-black font-bold text-sm">N</span>
              </div>
              <span className="text-zinc-200 font-bold text-lg">Nexus</span>
            </div>
            <button
              aria-label="Close menu"
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-softgold-500/40 transition-all duration-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation content */}
          <div className="overflow-y-auto h-[calc(100%-56px)] bg-black/80">
            <div className="p-4">
              <NavItems />
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Desktop sidebar (fixed to the left of the viewport)
  return (
    <aside className="fixed left-0 top-0 h-[100dvh] w-72 border-r border-zinc-800 bg-black/95 backdrop-blur-md z-30">
      {/* Desktop header */}
      <div className="h-14 px-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/assets/nexus-logo.png" alt="Nexus Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-zinc-200 font-bold text-lg">Nexus</span>
          <div className="w-6 h-6 flex items-center justify-center">
            <img src="/assets/nexus-logo.png" alt="Nexus Logo" className="w-full h-full object-contain opacity-60" />
          </div>
        </div>
        <button
          aria-label="Close sidebar"
          onClick={() => {/* Add close functionality if needed */}}
          className="p-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-softgold-500/40 transition-all duration-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Desktop navigation content */}
      <div className="overflow-y-auto h-[calc(100dvh-56px)] bg-black/80">
        <div className="p-4">
          <NavItems />
        </div>
      </div>
    </aside>
  );
}


