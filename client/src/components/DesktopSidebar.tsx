import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Bot, User, Info, Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTabNavigator } from '../contexts/TabNavigatorContext';
import { useBookmarks } from '../contexts/BookmarksContext';
import { useDesktopLayout } from '../contexts/DesktopLayoutContext';
import { PostTypeModal } from './PostTypeModal';

const navItems = [
  { id: 'feed', label: 'Feed', icon: MessageSquare, route: '/campus/general/confessions' },
  { id: 'characters', label: 'Companion', icon: Bot, route: '/companion' },
  { id: 'profile', label: 'Profile', icon: User, route: '/profile' },
  { id: 'about', label: 'About Us', icon: Info, route: '/about-us' },
] as const;

export function DesktopSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectRootTab } = useTabNavigator();
  const { setDefaultPostType } = useBookmarks();
  const desktopLayout = useDesktopLayout();
  const [showPostModal, setShowPostModal] = useState(false);

  const leftCollapsed = desktopLayout?.leftCollapsed ?? false;
  const setLeftCollapsed = desktopLayout?.setLeftCollapsed ?? (() => {});
  const leftHidden = desktopLayout?.leftHidden ?? false;

  if (leftHidden) return null;

  const handleNav = (route: string, id: string) => {
    navigate(route);
    if (id === 'feed') selectRootTab('confessions');
    else if (id === 'characters') selectRootTab('companion');
    else if (id === 'profile') selectRootTab('profile');
  };

  const handleCreateConfession = () => {
    setShowPostModal(true);
  };

  const handlePostTypeSelect = (type: 'username' | 'alias') => {
    setDefaultPostType(type);
    setShowPostModal(false);
    navigate(`/write-confession?type=${type}`);
  };

  return (
    <>
      <PostTypeModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSelect={handlePostTypeSelect}
      />
      <aside
        className={`hidden lg:flex flex-col h-screen fixed left-0 top-0 bottom-0 bg-[#0A0A0A] border-r border-white/10 shrink-0 z-30 transition-all duration-300 ease-in-out ${
          leftCollapsed ? 'lg:w-[60px]' : 'lg:w-1/5'
        }`}
      >
        <div className="p-3 flex flex-col h-full w-full overflow-hidden">
          {/* Logo - compact when collapsed */}
          <button
            type="button"
            onClick={() => handleNav('/campus/general/confessions', 'feed')}
            className={`flex items-center mb-6 text-left transition-all duration-300 ${
              leftCollapsed ? 'justify-center px-0' : 'gap-2'
            }`}
          >
            {leftCollapsed ? (
              <span className="text-lg font-bold text-[#A855F7]">N</span>
            ) : (
              <span className="text-xl font-bold tracking-tight">
                <span className="text-white">Nexus</span>
                <span className="text-[#A855F7]">chat.in</span>
              </span>
            )}
          </button>

          {/* Nav - icons only when collapsed */}
          <nav className="flex flex-col gap-0.5 flex-1">
            {navItems.map((item) => {
              let isActive: boolean;
              if (item.id === 'feed') isActive = location.pathname.startsWith('/campus');
              else if (item.id === 'about') isActive = location.pathname === '/about-us';
              else isActive = location.pathname.startsWith(item.route);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.route, item.id)}
                  title={leftCollapsed ? item.label : undefined}
                  className={`flex items-center rounded-xl text-left transition-colors w-full ${
                    leftCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                  } ${
                    isActive
                      ? 'bg-[#A855F7]/20 text-[#A855F7]'
                      : 'text-[#A1A1AA] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!leftCollapsed && (
                    <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Create - icon only when collapsed */}
          <button
            type="button"
            onClick={handleCreateConfession}
            title={leftCollapsed ? 'Create' : undefined}
            className={`flex items-center justify-center rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-medium text-sm transition-colors mt-4 ${
              leftCollapsed ? 'p-3' : 'gap-2 w-full py-3 px-4'
            }`}
          >
            <Plus className="w-5 h-5" />
            {!leftCollapsed && <span>Create</span>}
          </button>

          {/* Toggle collapse */}
          <button
            type="button"
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="mt-3 flex items-center justify-center p-2 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-white/5 transition-colors"
            title={leftCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {leftCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
