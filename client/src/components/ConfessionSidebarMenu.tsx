import React from 'react';
import { X, TrendingUp, Sparkles, Trophy, List } from 'lucide-react';

interface ConfessionSidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: 'all' | 'trending' | 'fresh' | 'top';
  onViewChange: (view: 'all' | 'trending' | 'fresh' | 'top') => void;
}

export function ConfessionSidebarMenu({
  isOpen,
  onClose,
  activeView,
  onViewChange
}: ConfessionSidebarMenuProps) {
  const menuItems = [
    {
      id: 'all' as const,
      label: 'All Confessions',
      icon: List,
      description: ''
    },
    {
      id: 'trending' as const,
      label: 'Trending',
      icon: TrendingUp,
      description: 'Hot confessions with high engagement'
    },
    {
      id: 'fresh' as const,
      label: 'Fresh Drops',
      icon: Sparkles,
      description: 'New confessions from the last 24h'
    },
    {
      id: 'top' as const,
      label: 'Top Rated',
      icon: Trophy,
      description: 'All-time most upvoted confessions'
    }
  ];

  const handleItemClick = (view: 'all' | 'trending' | 'fresh' | 'top') => {
    onViewChange(view);
    // Close drawer on mobile after selection
    if (globalThis.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-black/95 backdrop-blur-xl border-r border-softgold-500/20 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-softgold-500/20">
          <h2 className="text-xl font-bold text-softgold-400">Confessions</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-softgold-400 hover:text-softgold-300 hover:bg-softgold-500/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-softgold-500/20 border-2 border-softgold-500/40 shadow-lg shadow-softgold-500/10'
                    : 'bg-black/40 border-2 border-transparent hover:bg-softgold-500/10 hover:border-softgold-500/20'
                }`}
              >
                <div
                  className={`p-2.5 rounded-lg ${
                    isActive
                      ? 'bg-softgold-500/30 text-softgold-400'
                      : 'bg-softgold-500/10 text-softgold-500/70'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`font-semibold mb-1 ${
                      isActive ? 'text-softgold-400' : 'text-white'
                    }`}
                  >
                    {item.label}
                  </div>
                  {item.description && (
                    <div className="text-xs text-zinc-400 line-clamp-2">
                      {item.description}
                    </div>
                  )}
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-softgold-500 mt-2 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

