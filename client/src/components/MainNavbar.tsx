import React from 'react';

export function MainNavbar() {
  const headerHeightClass = 'h-14'; // 56px consistent height to prevent layout shift

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md ${headerHeightClass}`}>
        <div className="w-full px-6 h-full">
          <div className="flex items-center justify-start h-full overflow-hidden">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <span className="text-xs font-bold text-zinc-200">R</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to offset the fixed header height so content never slides underneath */}
      <div className={headerHeightClass} aria-hidden="true" />
    </>
  );
} 