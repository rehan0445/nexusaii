import React, { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Activity, MapPin, ChevronRight } from "lucide-react";
import axios from "axios";
import GroupFlipCard, { GroupRoomCard } from "./GroupFlipCard";
import { useNavigate } from "react-router-dom";
import { generateAnonymousGroups } from "../../../utils/darkroomData";
import VibeHeader from "../VibeHeader";

type Room = {
  id: string;
  name: string;
  createdBy?: string;
  createdAt?: string;
  userCount?: number;
  messages?: Array<{ id: string; alias: string; message: string; timestamp: number }>
  description?: string;
  progress?: number; // used for "Continue chatting" rail (0..1)
  tags?: string[]; // Add tags for filtering
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

const ChatsExploreWithHeader: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [trending, setTrending] = useState<Room[]>([]);
  const [mostActive, setMostActive] = useState<Room[]>([]);
  const [recommended, setRecommended] = useState<Room[]>([]);
  const [genreGroups, setGenreGroups] = useState<Record<string, Room[]>>({});
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationLabel, setLocationLabel] = useState<string>("Nearby");
  const [visibleCount, setVisibleCount] = useState<number>(24);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const navigate = useNavigate();

  // Filter and search rooms based on current state
  const filteredRooms = useMemo(() => {
    let filtered = allRooms;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room => 
        room.name.toLowerCase().includes(query) ||
        room.description?.toLowerCase().includes(query) ||
        room.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply tag filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(room => 
        room.tags?.some(tag => selectedFilters.includes(tag))
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "users":
        filtered.sort((a, b) => (b.userCount ?? 0) - (a.userCount ?? 0));
        break;
      case "newest":
        filtered.sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        });
        break;
      case "oldest":
        filtered.sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return aDate - bDate;
        });
        break;
    }

    return filtered;
  }, [allRooms, searchQuery, selectedFilters, sortBy]);

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    setSearchQuery(query);
  };

  const handleFilterChange = (filters: string[]) => {
    console.log('Selected filters:', filters);
    setSelectedFilters(filters);
  };

  const handleJoinRoom = (room: Room) => {
    // Save to recent rooms
    const recent = JSON.parse(localStorage.getItem("vibe_recent_groups") || "[]");
    const updated = [
      { 
        id: room.id, 
        name: room.name, 
        lastVisited: Date.now(),
        progress: Math.random() * 0.8 + 0.1 // Random progress for demo
      },
      ...recent.filter((r: any) => r.id !== room.id)
    ].slice(0, 20);
    localStorage.setItem("vibe_recent_groups", JSON.stringify(updated));
    
    navigate(`/darkroom/${room.id}`);
  };

  useEffect(() => {
    // Fetch all rooms from backend
    axios.get<Room[]>(`${import.meta.env.VITE_SERVER_URL || window.location.origin}/api/v1/darkroom/rooms`)
      .then(({ data }) => {
        let withDefaults: Room[] = data.map(r => ({ 
          ...r, 
          userCount: r.userCount ?? 0,
          tags: generateTagsForRoom(r.name) // Generate tags based on room name
        } as Room));

        // Fallback: seed demo rooms if none from server
        if (!withDefaults.length) {
          const seeded = generateAnonymousGroups(16).map((g) => ({
            id: g.id,
            name: g.name,
            userCount: g.members,
            createdAt: new Date().toISOString(),
            description: g.description,
            tags: generateTagsForRoom(g.name)
          }));
          withDefaults = seeded as Room[];
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

        // simple genre buckets (based on name contains)
        const buckets: Record<string, Room[]> = {
          "Anime-centric": withDefaults.filter(r => /anime|manga|weeb|otaku/i.test(r.name)).slice(0, 12),
          "Startup hub": withDefaults.filter(r => /startup|founder|saas|pitch|vc/i.test(r.name)).slice(0, 12),
          "Marvels of India": withDefaults.filter(r => /india|bharat|desi|hind/i.test(r.name)).slice(0, 12),
        };
        setGenreGroups(buckets);
      })
      .catch(() => {
        setRooms([]);
        setTrending([]);
        setMostActive([]);
        setRecommended([]);
        setGenreGroups({});
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
              name: r.name || fromAll?.name || "Unknown Room",
              userCount: fromAll?.userCount || r.userCount || 0,
              createdAt: fromAll?.createdAt,
              description: r.description || fromAll?.description,
              progress: r.progress,
              tags: fromAll?.tags || []
            };
          });
        setRecentRooms(mapped);
      } catch (e) {
        setRecentRooms([]);
      }
    };
    loadRecent();
  }, [allRooms]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <VibeHeader
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        selectedFilters={selectedFilters}
      />

      {/* Content Area with top padding for fixed header */}
      <div className="pt-14 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Search Results Summary */}
          {(searchQuery || selectedFilters.length > 0) && (
            <div className="mb-6 p-4 bg-zinc-900 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    {searchQuery ? `Search results for "${searchQuery}"` : 'Filtered results'}
                  </h2>
                  <p className="text-zinc-400">
                    {filteredRooms.length} rooms found
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilters([]);
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
              {selectedFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedFilters.map((filter, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#6A0DAD] text-white rounded-full text-sm"
                    >
                      {filter}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Results */}
          {(searchQuery || selectedFilters.length > 0) ? (
            <div className="mb-8">
              <SectionTitle title="Search Results" />
              <HorizontalRail>
                {filteredRooms.slice(0, 12).map((room, index) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onJoin={handleJoinRoom}
                    badgeIndex={index < 3 ? index + 1 : undefined}
                  />
                ))}
              </HorizontalRail>
              {filteredRooms.length === 0 && (
                <div className="text-center py-12 text-zinc-400">
                  <p className="text-lg mb-2">No rooms found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Continue Chatting */}
              {recentRooms.length > 0 && (
                <div className="mb-8">
                  <SectionTitle title="Continue chatting" />
                  <HorizontalRail>
                    {recentRooms.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onJoin={handleJoinRoom}
                        showProgress={true}
                      />
                    ))}
                  </HorizontalRail>
                </div>
              )}

              {/* Trending */}
              {trending.length > 0 && (
                <div className="mb-8">
                  <SectionTitle icon={<Flame className="w-6 h-6 text-red-500" />} title="Trending" />
                  <HorizontalRail>
                    {trending.map((room, index) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onJoin={handleJoinRoom}
                        badgeIndex={index < 3 ? index + 1 : undefined}
                      />
                    ))}
                  </HorizontalRail>
                </div>
              )}

              {/* Most Active */}
              {mostActive.length > 0 && (
                <div className="mb-8">
                  <SectionTitle icon={<Activity className="w-6 h-6 text-blue-500" />} title="Most Active" />
                  <HorizontalRail>
                    {mostActive.map((room) => (
                      <RoomCard
                        key={room.id}
                        room={room}
                        onJoin={handleJoinRoom}
                      />
                    ))}
                  </HorizontalRail>
                </div>
              )}

              {/* Genre Groups */}
              {Object.entries(genreGroups).map(([genre, genreRooms]) => 
                genreRooms.length > 0 ? (
                  <div key={genre} className="mb-8">
                    <SectionTitle title={genre} />
                    <HorizontalRail>
                      {genreRooms.map((room) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          onJoin={handleJoinRoom}
                        />
                      ))}
                    </HorizontalRail>
                  </div>
                ) : null
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to generate tags for rooms based on their names
function generateTagsForRoom(roomName: string): string[] {
  const tags: string[] = [];
  const name = roomName.toLowerCase();
  
  // Gender tags
  if (/female|girl|woman/i.test(name)) tags.push('Female');
  if (/male|boy|man/i.test(name)) tags.push('Male');
  if (/non-binary|enby/i.test(name)) tags.push('Non-Binary');
  
  // Role tags
  if (/helper|assistant|support/i.test(name)) tags.push('Helper');
  if (/vtuber|streamer/i.test(name)) tags.push('VTuber');
  if (/sigma|alpha|leader/i.test(name)) tags.push('Sigma');
  if (/hunter|bounty/i.test(name)) tags.push('Hunter');
  if (/warrior|fighter|knight/i.test(name)) tags.push('Warrior');
  if (/student|learner/i.test(name)) tags.push('Student');
  if (/advisor|mentor/i.test(name)) tags.push('Advisor');
  if (/commander|leader/i.test(name)) tags.push('Commander');
  if (/demon|slayer/i.test(name)) tags.push('Demon Slayer');
  if (/science|scientist/i.test(name)) tags.push('Science');
  if (/education|teach/i.test(name)) tags.push('Education');
  if (/career|professional/i.test(name)) tags.push('Career');
  if (/hololive|holo/i.test(name)) tags.push('Hololive');
  
  // Default tags if none found
  if (tags.length === 0) {
    tags.push('Helper', 'Student');
  }
  
  return tags;
}

export default ChatsExploreWithHeader;
