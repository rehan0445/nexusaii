import React, { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Activity, MapPin, Filter, ChevronRight } from "lucide-react";
import axios from "axios";
import GroupFlipCard, { GroupRoomCard } from "./GroupFlipCard";
import { useNavigate } from "react-router-dom";
import { generateAnonymousGroups } from "../../../utils/darkroomData";
import { FilterDropdown } from "../../FilterDropdown";
import { categorizeGroupChat, GROUP_CHAT_CATEGORIES, getCategoryName } from "../../../utils/groupChatCategorization";
import { 
  SAMPLE_ANIME_CHATS, 
  SAMPLE_INDIA_CHATS, 
  SAMPLE_NEARBY_CHATS, 
  SAMPLE_STARTUP_CHATS,
  SAMPLE_GAMING_CHATS,
  SAMPLE_TECH_CHATS,
  SAMPLE_MUSIC_CHATS,
  SAMPLE_SPORTS_CHATS,
  SAMPLE_EDUCATION_CHATS,
  ALL_SAMPLE_CHATS
} from "../../../utils/sampleGroupChats";
import CreateGroupChat from "./CreateGroupChat";

type Room = {
  id: string;
  name: string;
  createdBy?: string;
  createdAt?: string;
  userCount?: number;
  messages?: Array<{ id: string; alias: string; message: string; timestamp: number }>
  description?: string;
  progress?: number; // used for "Continue chatting" rail (0..1)
};

type SortOption = "users" | "newest" | "oldest";

const SectionTitle: React.FC<{ icon?: React.ReactNode; title: string; actionText?: string; onAction?: () => void }>
  = ({ icon, title, actionText, onAction }) => (
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
    </div>
    {actionText && (
      <button onClick={onAction} className="text-gold hover:underline text-sm flex items-center gap-1">
        {actionText} <ChevronRight className="w-4 h-4" />
      </button>
    )}
  </div>
);

const HorizontalRail: React.FC<{ children: React.ReactNode }>= ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="relative">
      <div ref={ref} className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-1 px-1">
        {children}
      </div>
    </div>
  );
};

const RoomCard: React.FC<{ room: Room, onJoin?: (r: Room) => void, badgeIndex?: number, showProgress?: boolean }>= ({ room, onJoin, badgeIndex, showProgress }) => {
  return (
    <div className="min-w-[72vw] xs:min-w-[60vw] sm:min-w-[44vw] md:min-w-[30vw] lg:min-w-[22vw] xl:min-w-[18vw] snap-start">
      <div className="relative">
        {typeof badgeIndex === "number" && badgeIndex <= 10 && (
          <div className="absolute -left-2 -top-2 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow">TOP {badgeIndex}</div>
        )}
        <GroupFlipCard room={{
          id: room.id,
          name: room.name,
          userCount: room.userCount ?? 0,
          createdAt: room.createdAt,
          description: room.description,
        }} onJoin={() => onJoin?.(room)} />
        {showProgress && typeof room.progress === "number" && (
          <div className="mt-1 h-1.5 bg-white/10 rounded">
            <div className="h-full bg-red-500 rounded" style={{ width: `${Math.max(2, Math.min(100, Math.round((room.progress ?? 0) * 100)))}%` }} />
          </div>
        )}
      </div>
    </div>
  );
};

// Chips removed in favor of unified FilterDropdown

interface ChatsExploreProps {
  headerSearchQuery?: string;
  headerSelectedFilters?: string[];
}

const ChatsExplore: React.FC<ChatsExploreProps> = ({ headerSearchQuery = "", headerSelectedFilters = [] }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [trending, setTrending] = useState<Room[]>([]);
  const [mostActive, setMostActive] = useState<Room[]>([]);
  const [recommended, setRecommended] = useState<Room[]>([]);
  const [genreGroups, setGenreGroups] = useState<Record<string, Room[]>>({});
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("users");
  const [search, setSearch] = useState("");
  const [locationLabel, setLocationLabel] = useState<string>("Nearby");
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["Users"]);

  const handleFilterChange = (filters: string[]) => {
    if (!filters.length) {
      setSelectedFilters([]);
      setSortBy("users");
      return;
    }
    const latest = filters[filters.length - 1];
    const key = latest.toLowerCase();
    const nextSort: SortOption = key === "users" ? "users" : key === "new" ? "newest" : "oldest";
    setSelectedFilters([latest]);
    setSortBy(nextSort);
  };

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all rooms from backend
    axios.get<Room[]>(`${import.meta.env.VITE_SERVER_URL || window.location.origin}/api/v1/darkroom/rooms`)
      .then(({ data }) => {
        let withDefaults: Room[] = data.map(r => ({ ...r, userCount: r.userCount ?? 0 } as Room));

        // Fallback: use sample data if none from server
        if (!withDefaults.length) {
          withDefaults = ALL_SAMPLE_CHATS as Room[];
        }
        setRooms(withDefaults);
        setAllRooms(withDefaults);

        // naive trending: highest userCount
        const trendingRooms = [...withDefaults]
          .sort((a, b) => (b.userCount ?? 0) - (a.userCount ?? 0))
          .slice(0, 12);
        setTrending(trendingRooms);

        // naive mostActive: recently created + users
        const mostActiveRooms = [...withDefaults]
          .sort((a, b) => {
            const aScore = (a.userCount ?? 0) + (a.createdAt ? Date.parse(a.createdAt) / 1e13 : 0);
            const bScore = (b.userCount ?? 0) + (b.createdAt ? Date.parse(b.createdAt) / 1e13 : 0);
            return bScore - aScore;
          })
          .slice(0, 12);
        setMostActive(mostActiveRooms);

        // recommendations placeholder: top 8 after filter
        setRecommended(withDefaults.slice(0, 8));

        // Enhanced genre buckets using categorization system
        const buckets: Record<string, Room[]> = {
          "Anime-centric": SAMPLE_ANIME_CHATS as Room[],
          "Startup hub": SAMPLE_STARTUP_CHATS as Room[],
          "Marvels of India": SAMPLE_INDIA_CHATS as Room[],
          "Nearby groups": SAMPLE_NEARBY_CHATS as Room[],
          "Gaming Zone": SAMPLE_GAMING_CHATS as Room[],
          "Tech Talk": SAMPLE_TECH_CHATS as Room[],
          "Music Vibes": SAMPLE_MUSIC_CHATS as Room[],
          "Sports Arena": SAMPLE_SPORTS_CHATS as Room[],
          "Learning Hub": SAMPLE_EDUCATION_CHATS as Room[]
        };
        setGenreGroups(buckets);
      })
      .catch(() => {
        // Use sample data as fallback
        const withDefaults = ALL_SAMPLE_CHATS as Room[];
        setRooms(withDefaults);
        setAllRooms(withDefaults);
        setTrending([]);
        setMostActive(withDefaults.slice(0, 12));
        setRecommended(withDefaults.slice(0, 8));
        
        const buckets: Record<string, Room[]> = {
          "Anime-centric": SAMPLE_ANIME_CHATS as Room[],
          "Startup hub": SAMPLE_STARTUP_CHATS as Room[],
          "Marvels of India": SAMPLE_INDIA_CHATS as Room[],
          "Nearby groups": SAMPLE_NEARBY_CHATS as Room[],
          "Gaming Zone": SAMPLE_GAMING_CHATS as Room[],
          "Tech Talk": SAMPLE_TECH_CHATS as Room[],
          "Music Vibes": SAMPLE_MUSIC_CHATS as Room[],
          "Sports Arena": SAMPLE_SPORTS_CHATS as Room[],
          "Learning Hub": SAMPLE_EDUCATION_CHATS as Room[]
        };
        setGenreGroups(buckets);
      });

    // Location labeling (lightweight)
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(() => setLocationLabel("Around you"), () => setLocationLabel("Nearby"));
      }
    } catch {}
  }, []);

  // Read "Continue chatting" from localStorage
  useEffect(() => {
    const loadRecent = () => {
      try {
        const raw = localStorage.getItem("vibe_recent_groups");
        if (!raw) { setRecentRooms([]); return; }
        const parsed: Array<{ id: string; name?: string; banner?: string; lastVisited?: number; progress?: number; description?: string; userCount?: number }> = JSON.parse(raw);
        const mapped: Room[] = parsed
          .sort((a, b) => (b.lastVisited ?? 0) - (a.lastVisited ?? 0))
          .slice(0, 12)
          .map((r) => {
            const fromAll = allRooms.find(ar => ar.id === r.id);
            return {
              id: r.id,
              name: r.name || fromAll?.name || `Group ${r.id}`,
              description: r.description || fromAll?.description,
              userCount: r.userCount ?? fromAll?.userCount,
              createdAt: fromAll?.createdAt,
              progress: typeof r.progress === "number" ? r.progress : 0.2,
            } as Room;
          });
        setRecentRooms(mapped);
      } catch {
        setRecentRooms([]);
      }
    };
    loadRecent();
    const onStorage = (e: StorageEvent) => { if (e.key === "vibe_recent_groups") loadRecent(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [allRooms]);

  const filteredRooms = useMemo(() => {
    const q = (headerSearchQuery || search).trim().toLowerCase();
    let arr = [...rooms];
    if (q) arr = arr.filter(r => r.name.toLowerCase().includes(q));

    // Apply header-selected group chat category filters by matching keywords in room name
    if (headerSelectedFilters.length > 0) {
      const matchesCategory = (name: string, category: string): boolean => {
        const n = name.toLowerCase();
        switch (category.toLowerCase()) {
          // Trending & Popular filters
          case "trending": return /trending|popular|hot|viral/.test(n);
          case "top rated": return /top|rated|best|premium/.test(n);
          case "popular": return /popular|trending|hot|viral/.test(n);
          case "latest": return /new|latest|recent|fresh/.test(n);
          
          // Topic filters
          case "anime": return /anime|manga|weeb|otaku|japanese/.test(n);
          case "gaming": return /gaming|game|gamer|play|esports/.test(n);
          case "tech": return /tech|technology|programming|coding|software/.test(n);
          case "startup": return /startup|founder|entrepreneur|business|saas/.test(n);
          case "music": return /music|song|artist|band|concert/.test(n);
          case "sports": return /sports|football|basketball|soccer|fitness/.test(n);
          case "education": return /education|learn|study|course|academic/.test(n);
          case "business": return /business|corporate|work|professional/.test(n);
          case "entertainment": return /entertainment|movie|tv|show|film/.test(n);
          case "lifestyle": return /lifestyle|life|daily|routine/.test(n);
          case "art": return /art|artist|creative|design|drawing/.test(n);
          default: return n.includes(category.toLowerCase());
        }
      };
      arr = arr.filter(r => headerSelectedFilters.some(cat => matchesCategory(r.name, cat)));
    }
    if (sortBy === "users") arr.sort((a, b) => (b.userCount ?? 0) - (a.userCount ?? 0));
    if (sortBy === "newest") arr.sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""));
    if (sortBy === "oldest") arr.sort((a, b) => Date.parse(a.createdAt ?? "") - Date.parse(b.createdAt ?? ""));
    return arr;
  }, [rooms, search, sortBy, headerSearchQuery, headerSelectedFilters]);

  // Endless scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 24, filteredRooms.length));
        }
      }
    }, { rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredRooms.length]);

  // Reset visible count on filters/search change
  useEffect(() => {
    setVisibleCount(24);
  }, [search, sortBy, headerSearchQuery, headerSelectedFilters]);

  const handleGroupCreated = (newGroup: any) => {
    // Add the new group to the appropriate category
    const categories = newGroup.categories || [];
    if (categories.length > 0) {
      const primaryCategory = categories[0];
      const categoryName = getCategoryName(primaryCategory);
      
      // Update the genre groups with the new group
      setGenreGroups(prev => ({
        ...prev,
        [categoryName]: [...(prev[categoryName] || []), newGroup]
      }));
      
      // Also add to all rooms
      setAllRooms(prev => [...prev, newGroup]);
    }
  };

  return (
    <section>
      {/* Horizontal sections */}
      <div className="space-y-6">
        <div>
          <SectionTitle icon={<Activity className="w-5 h-5 text-emerald-400" />} title="Most active this month" />
          <HorizontalRail>
            {mostActive.map((r) => (
              <RoomCard key={`active-${r.id}`} room={r} onJoin={(room) => navigate(`/vibe/chat/${room.id}`, { state: { room } })} />
            ))}
          </HorizontalRail>
        </div>
      </div>

      {/* Personalized recommendations */}
      <div className="mt-8">
        <SectionTitle title="Recommended for you" />
        <HorizontalRail>
          {recommended.map((r) => (
            <RoomCard key={`rec-${r.id}`} room={r} onJoin={(room) => navigate(`/vibe/chat/${room.id}`, { state: { room } })} />
          ))}
        </HorizontalRail>
      </div>

      {/* Continue chatting rail (from localStorage) */}
      {recentRooms.length > 0 && (
        <div className="mt-8">
          <SectionTitle title="Continue chatting" />
          <HorizontalRail>
            {recentRooms.map((r) => (
              <RoomCard key={`cont-${r.id}`} room={r} showProgress onJoin={(room) => navigate(`/vibe/chat/${room.id}`, { state: { room } })} />
            ))}
          </HorizontalRail>
        </div>
      )}

              {/* Category-Based Group Chats */}
        <div className="mt-8 space-y-6">
          {Object.entries(genreGroups).map(([genre, arr]) => {
            // Get appropriate icon for each category
            const getCategoryIcon = (categoryName: string) => {
              switch (categoryName) {
                case "Anime-centric": return <span className="text-2xl">🌸</span>;
                case "Startup hub": return <span className="text-2xl">🚀</span>;
                case "Marvels of India": return <span className="text-2xl">🪷</span>;
                case "Nearby groups": return <MapPin className="w-5 h-5 text-pink-400" />;
                case "Gaming Zone": return <span className="text-2xl">🎮</span>;
                case "Tech Talk": return <span className="text-2xl">💻</span>;
                case "Music Vibes": return <span className="text-2xl">🎵</span>;
                case "Sports Arena": return <span className="text-2xl">⚽</span>;
                case "Learning Hub": return <span className="text-2xl">📚</span>;
                default: return <Filter className="w-5 h-5 text-sky-400" />;
              }
            };

            return (
              <div key={genre}>
                <SectionTitle icon={getCategoryIcon(genre)} title={genre} />
                <HorizontalRail>
                  {arr.map((r) => (
                    <RoomCard key={`${genre}-${r.id}`} room={r} onJoin={(room) => navigate(`/vibe/chat/${room.id}`, { state: { room } })} />
                  ))}
                </HorizontalRail>
              </div>
            );
          })}


      </div>

      {/* Complete Listing - endless scroll (simple progressive show) */}
      <div className="mt-10">
        <SectionTitle title="All groups" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredRooms.slice(0, visibleCount).map((r) => (
            <GroupFlipCard key={`all-${r.id}`} room={r as GroupRoomCard} onJoin={(room) => navigate(`/vibe/chat/${room.id}`, { state: { room: r } })} />
          ))}
        </div>
        <div ref={sentinelRef} />
      </div>
      
      {/* Create Group Chat Button */}
      <CreateGroupChat onGroupCreated={handleGroupCreated} />
    </section>
  );
};

export default ChatsExplore;


