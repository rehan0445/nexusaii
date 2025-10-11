import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

interface DarkRoomResponsiveWrapperProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
}

const DarkRoomResponsiveWrapper: React.FC<DarkRoomResponsiveWrapperProps> = ({ sidebar, main }) => {
  const { isMobile, isTablet } = useResponsive();
  const isSmallScreen = isMobile || isTablet;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!isSmallScreen) {
    return (
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        {main}
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Floating Hamburger */}
      <button
        type="button"
        aria-label="Open sidebar"
        onClick={() => setIsDrawerOpen(true)}
        className="absolute top-3 left-3 z-30 p-2 rounded-md bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/70 backdrop-blur-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Main content takes full width on small screens */}
      <div className="flex-1 min-h-0">
        {main}
      </div>

      {/* Drawer + Backdrop (mounted for smooth animations) */}
      <div className={`fixed inset-0 z-40 ${isDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsDrawerOpen(false)}
        />
        {/* Panel */}
        <div className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-black/90 backdrop-blur-xl border-r border-zinc-800/60 transform transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-3 border-b border-zinc-800/60 flex items-center justify-between">
            <span className="text-white font-semibold">Anonymous Groups</span>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 rounded-md hover:bg-zinc-800 text-zinc-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-[calc(100%-3rem)] overflow-y-auto">
            {sidebar}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DarkRoomResponsiveWrapper; 