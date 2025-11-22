import React, { useMemo } from "react";
import { Moon, MessageSquare, Bot, User } from "lucide-react";
import companionIcon from "../assets/icons/companion.png";
import { useTabNavigator } from "../contexts/TabNavigatorContext";
import { useBadges } from "../contexts/BadgesContext";
import { useLocation } from "react-router-dom";

export const BottomBar: React.FC = () => {
  const { currentRootTab, selectRootTab } = useTabNavigator();
  const { companion } = useBadges();
  const location = useLocation();

  const items = useMemo(
    () => [
      { id: "darkroom", label: "Dark Room", icon: Moon },
      { id: "confessions", label: "Confessions", icon: MessageSquare },
      { id: "companion", label: "Companion", icon: Bot },
      { id: "profile", label: "Profile", icon: User },
    ] as const,
    []
  );
  
  // Hide bottom bar on character chat pages, dark room, confessions detail pages, and room interfaces
  if (location.pathname.startsWith('/chat/')) return null;
  if (location.pathname.startsWith('/arena/darkroom')) return null;
  if (location.pathname.startsWith('/campus/') && location.pathname !== '/campus') return null;
  if (location.pathname.startsWith('/group-chat/')) return null; // Hide in group chat pages

  return (
    <>
      <div
        className="fixed bottom-3 left-0 right-0 z-40 px-3 sm:px-4 md:px-6"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="bg-zinc-900/95 backdrop-blur-xl rounded-3xl border border-rosegold-500/40 shadow-2xl max-w-2xl md:max-w-xl mx-auto overflow-hidden">
          <div className="flex items-center justify-around gap-0.5 px-1.5 py-1.5 sm:gap-1 sm:px-2 sm:py-2 md:gap-0.5 md:px-1.5 md:py-1.5">
            {items.map((item) => {
              const active = currentRootTab === (item.id as any);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => selectRootTab(item.id as any)}
                  className={`relative flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1.5 sm:py-2.5 sm:px-2 md:py-1.5 md:px-1.5 rounded-2xl md:rounded-xl transition-all duration-300 ${
                    active 
                      ? "bg-rosegold-500 text-white scale-105" 
                      : "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {item.id === "companion" ? (
                      <img 
                        src={companionIcon} 
                        alt="Companion" 
                        className={`object-contain w-5 h-5 sm:w-6 sm:h-6 md:w-4 md:h-4 transition-all duration-300 ${active ? 'scale-110' : 'opacity-70'}`} 
                        style={{ filter: 'invert(1)' }} 
                      />
                    ) : (
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-4 md:h-4 transition-all duration-300 ${active ? 'scale-110' : ''}`} />
                    )}
                    {item.id === "companion" && companion > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-3 md:h-3 bg-red-500 text-white text-[8px] sm:text-[9px] md:text-[7px] rounded-full flex items-center justify-center font-bold shadow-lg">
                        {companion > 9 ? "9+" : companion}
                      </span>
                    )}
                  </div>
                  <span className={`mt-0.5 sm:mt-1 md:mt-0.5 truncate text-[9px] sm:text-[10px] md:text-[8px] transition-all duration-300 ${
                    active ? 'font-bold' : 'font-medium'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="h-16 sm:h-20 md:h-14" style={{ height: "calc(64px + env(safe-area-inset-bottom))" }} />
    </>
  );
};

export default BottomBar;


