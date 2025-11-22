import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import {
  Home,
  MessageSquare,
  Moon,
  Megaphone,
  Info,
  Menu,
  X,
  User,
  Zap,
} from 'lucide-react';

interface NavigationItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    key: 'home',
    label: 'Home',
    icon: Home,
    route: '/',
    description: 'Main dashboard and overview'
  },
  {
    key: 'vibe',
    label: 'Vibe',
    icon: Zap,
    route: '/vibe',
    description: 'Social interactions and chats'
  },
  {
    key: 'chats',
    label: 'Chats',
    icon: MessageSquare,
    route: '/vibe',
    description: 'Group conversations and discussions'
  },
  {
    key: 'darkroom',
    label: 'Dark Room',
    icon: Moon,
    route: '/vibe',
    description: 'Anonymous chat environment'
  },
  {
    key: 'confession',
    label: 'Confession',
    icon: Megaphone,
    route: '/vibe',
    description: 'Share anonymous confessions'
  },
  
  {
    key: 'profile',
    label: 'Profile',
    icon: User,
    route: '/profile',
    description: 'Your personal profile'
  },
  {
    key: 'info',
    label: 'Info',
    icon: Info,
    route: '/vibe',
    description: 'About and guidelines'
  },
];

interface EnhancedNavigationProps {
  children: React.ReactNode;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
}

export default function EnhancedNavigation({ 
  children, 
  showMobileMenu = true,
  onMobileMenuToggle 
}: EnhancedNavigationProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isSmallScreen = isMobile || isTablet;

  // Close drawer when route changes
  useEffect(() => {
    if (isSmallScreen) {
      setIsDrawerOpen(false);
    }
  }, [location.pathname, isSmallScreen]);

  // Close drawer when moving to desktop
  useEffect(() => {
    if (isDesktop) {
      setIsDrawerOpen(false);
    }
  }, [isDesktop]);

  const handleNavigation = (item: NavigationItem) => {
    if (item.route !== location.pathname) {
      navigate(item.route);
    }
    if (isSmallScreen) {
      setIsDrawerOpen(false);
    }
  };

  const getActiveSection = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/vibe')) return 'vibe';
    
    if (path.startsWith('/profile')) return 'profile';
    return 'home';
  };

  const activeSection = getActiveSection();

  const NavItems = () => (
    <nav className="flex flex-col gap-2" aria-label="Main navigation">
      {navigationItems.map((item) => {
        const isActive = item.key === activeSection;
        const Icon = item.icon;
        
        return (
          <button
            key={item.key}
            onClick={() => handleNavigation(item)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-softgold-500/40 group ${
              isActive
                ? "bg-softgold-100/10 text-softgold-50 border border-softgold-200/20 shadow-sm"
                : "text-zinc-300 hover:bg-zinc-800/40 hover:text-zinc-100"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className={`w-5 h-5 transition-colors ${
              isActive ? "text-softgold-300" : "text-zinc-400 group-hover:text-zinc-300"
            }`} />
            <div className="flex flex-col items-start">
              <span className="font-medium">{item.label}</span>
              {item.description && (
                <span className="text-xs text-zinc-500 group-hover:text-zinc-400">
                  {item.description}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );

  // Mobile hamburger menu
  if (isSmallScreen && showMobileMenu) {
    return (
      <>
        {/* Mobile Header with Hamburger */}
        <header className="fixed top-0 left-0 right-0 z-40 border-b border-zinc-800 bg-black/95 backdrop-blur-md">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <button
                aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
                onClick={() => {
                  setIsDrawerOpen(!isDrawerOpen);
                  onMobileMenuToggle?.();
                }}
                className="p-2.5 rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-softgold-500/40 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm"
              >
                {isDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <img src="/assets/nexus-logo.png" alt="Nexus Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-xl font-bold text-zinc-200 tracking-tight">
                  Nexus
                </h1>
                <div className="w-6 h-6 flex items-center justify-center">
                  <img src="/assets/nexus-logo.png" alt="Nexus Logo" className="w-full h-full object-contain opacity-60" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Drawer Overlay */}
        <div
          className={`fixed inset-0 z-50 transition-opacity ${
            isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          } bg-black/60 backdrop-blur-sm`}
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden={!isDrawerOpen}
        />

        {/* Mobile Drawer Panel */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-80 max-w-[85%] bg-black/95 backdrop-blur-md transition-transform duration-300 ease-out ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Drawer Header */}
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
          
          {/* Drawer Content */}
          <div className="overflow-y-auto h-[calc(100%-56px)] bg-black/80">
            <div className="p-4">
              <NavItems />
            </div>
          </div>
        </aside>

        {/* Main Content with top padding for mobile header */}
        <div className="pt-14">
          {children}
        </div>
      </>
    );
  }

  // Desktop sidebar
  if (isDesktop) {
    return (
      <div className="flex min-h-screen bg-zinc-900">
        {/* Desktop Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-72 border-r border-zinc-800 bg-black/95 backdrop-blur-md z-30">
          {/* Sidebar Header */}
          <div className="h-16 px-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-softgold-500 to-softgold-700 flex items-center justify-center shadow-lg">
                <span className="text-black font-bold text-base">N</span>
              </div>
              <span className="text-zinc-200 font-bold text-lg">Nexus</span>
            </div>
            <button
              aria-label="Close sidebar"
              onClick={() => {/* Add close functionality if needed */}}
              className="p-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-softgold-500/40 transition-all duration-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Sidebar Navigation */}
          <div className="overflow-y-auto h-[calc(100vh-64px)] bg-black/80">
            <div className="p-4">
              <NavItems />
            </div>
          </div>
        </aside>

        {/* Main Content with left margin for sidebar */}
        <main className="flex-1 ml-72">
          {children}
        </main>
      </div>
    );
  }

  // Fallback for tablet or other cases
  return <div>{children}</div>;
}
