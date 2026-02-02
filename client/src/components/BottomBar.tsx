import React, { useMemo, useState } from "react";
import { Home, Bot, Plus, Inbox, User } from "lucide-react";
import { useTabNavigator } from "../contexts/TabNavigatorContext";
import { useBadges } from "../contexts/BadgesContext";
import { useLocation, useNavigate } from "react-router-dom";
import { PostTypeModal } from "./PostTypeModal";
import { useBookmarks } from "../contexts/BookmarksContext";

export const BottomBar: React.FC = () => {
  const { currentRootTab, selectRootTab } = useTabNavigator();
  const { companion } = useBadges();
  const { setDefaultPostType } = useBookmarks();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPostModal, setShowPostModal] = useState(false);

  // Phoenix navigation structure: Feed, Companion, Plus, Inbox, Profile
  const items = useMemo(
    () => [
      { id: "feed", label: "Feed", icon: Home, route: "/campus/general/confessions" },
      { id: "characters", label: "Companion", icon: Bot, route: "/companion" },
      { id: "plus", label: "", icon: Plus, route: null, isPlus: true },
      { id: "inbox", label: "Inbox", icon: Inbox, route: "/my-chats" },
      { id: "profile", label: "Profile", icon: User, route: "/profile" },
    ] as const,
    []
  );
  
  // Hide bottom bar on character chat pages, dark room, confessions detail pages, and room interfaces
  if (location.pathname.startsWith('/chat/')) return null;
  if (location.pathname.startsWith('/arena/darkroom')) return null;
  if (location.pathname.startsWith('/campus/') && location.pathname !== '/campus' && !location.pathname.includes('/confessions')) return null;
  if (location.pathname.startsWith('/group-chat/')) return null;

  const handleItemClick = (item: typeof items[0]) => {
    if (item.isPlus) {
      // Show modal asking how to post
      setShowPostModal(true);
      return;
    }
    if (item.route) {
      navigate(item.route);
      selectRootTab(item.id as any);
    }
  };

  const handlePostTypeSelect = (type: 'username' | 'alias') => {
    setDefaultPostType(type);
    navigate(`/write-confession?type=${type}`);
  };

  return (
    <>
      <PostTypeModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSelect={handlePostTypeSelect}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A] border-t border-white/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            {items.map((item) => {
              const active = location.pathname.startsWith(item.route || '') || currentRootTab === (item.id as any);
              const Icon = item.icon;
              
              if (item.isPlus) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#A855F7] to-[#9333EA] text-white shadow-lg shadow-[#A855F7]/50 hover:shadow-[#A855F7]/70 transition-all duration-300 hover:scale-110"
                  >
                    <Icon className="w-6 h-6" strokeWidth={2.5} />
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`relative flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-2 rounded-xl transition-all duration-300 ${
                    active 
                      ? "text-[#A855F7]" 
                      : "text-[#A1A1AA] hover:text-[#F8F9FA]"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Icon className={`w-5 h-5 transition-all duration-300 ${active ? 'scale-110' : ''}`} strokeWidth={active ? 2.5 : 2} />
                    {item.id === "inbox" && companion > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0A0A0A]" />
                    )}
                  </div>
                  <span className={`mt-1 text-[10px] transition-all duration-300 ${
                    active ? 'font-semibold' : 'font-medium'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="h-20" style={{ height: "calc(80px + env(safe-area-inset-bottom))" }} />
    </>
  );
};

export default BottomBar;


