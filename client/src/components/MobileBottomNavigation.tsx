import React from 'react';
import { Home, MessageSquare, Users, Settings, Plus, Search } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  badge?: number;
  isActive?: boolean;
}

interface MobileBottomNavigationProps {
  items: NavigationItem[];
  showFloatingAction?: boolean;
  floatingActionIcon?: React.ComponentType<{ className?: string }>;
  onFloatingActionClick?: () => void;
}

const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  items,
  showFloatingAction = false,
  floatingActionIcon: FloatingActionIcon = Plus,
  onFloatingActionClick
}) => {
  return (
    <>
      {/* Floating Action Button */}
      {showFloatingAction && (
        <button
          onClick={onFloatingActionClick}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <FloatingActionIcon className="w-6 h-6" />
        </button>
      )}

      {/* Bottom Navigation */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`relative flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-colors ${
                item.isActive
                  ? 'text-blue-400'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium truncate w-full text-center">
                {item.label}
              </span>
              {item.isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind the navigation */}
      <div className="h-16" style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
    </>
  );
};

// Example usage with common navigation items
export const GroupChatNavigation: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadCount?: number;
  onSearch?: () => void;
  onCreateGroup?: () => void;
}> = ({ activeTab, onTabChange, unreadCount = 0, onSearch, onCreateGroup }) => {
  const navigationItems: NavigationItem[] = [
    {
      id: 'chats',
      label: 'Chats',
      icon: MessageSquare,
      onClick: () => onTabChange('chats'),
      isActive: activeTab === 'chats',
      badge: unreadCount
    },
    {
      id: 'groups',
      label: 'Groups',
      icon: Users,
      onClick: () => onTabChange('groups'),
      isActive: activeTab === 'groups'
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      onClick: onSearch || (() => {}),
      isActive: activeTab === 'search'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => onTabChange('settings'),
      isActive: activeTab === 'settings'
    }
  ];

  return (
    <MobileBottomNavigation
      items={navigationItems}
      showFloatingAction={true}
      floatingActionIcon={Plus}
      onFloatingActionClick={onCreateGroup}
    />
  );
};

export const HomeNavigation: React.FC<{
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewPost?: () => void;
}> = ({ activeTab, onTabChange, onNewPost }) => {
  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      onClick: () => onTabChange('home'),
      isActive: activeTab === 'home'
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: Search,
      onClick: () => onTabChange('explore'),
      isActive: activeTab === 'explore'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: Users,
      onClick: () => onTabChange('profile'),
      isActive: activeTab === 'profile'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => onTabChange('settings'),
      isActive: activeTab === 'settings'
    }
  ];

  return (
    <MobileBottomNavigation
      items={navigationItems}
      showFloatingAction={true}
      floatingActionIcon={Plus}
      onFloatingActionClick={onNewPost}
    />
  );
};

export default MobileBottomNavigation;

// Deprecated: use new BottomBar in `components/BottomBar.tsx`
