import type { GroupChat } from "@/types/groupChat";

const makeId = (prefix: string, i: number) => `${prefix}-${i}`;

// Mock dataset generator
const genres = ["anime", "startup", "tech", "gaming", "music", "marvels-of-india", "pune", "art"];

const nowIso = () => new Date().toISOString();

const MOCK_GROUPS: GroupChat[] = Array.from({ length: 80 }).map((_, i) => {
  const tag = genres[i % genres.length];
  const isPune = tag === "pune";
  return {
    id: makeId("gc", i + 1),
    name: `Group ${i + 1} ${tag}`,
    description: `A lively ${tag} community to connect and share.`,
    avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${i + 1}`,
    banner: undefined,
    memberCount: Math.floor(Math.random() * 5000) + 50,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 365) * 86400000).toISOString(),
    lastActiveAt: nowIso(),
    monthlyActivityScore: Math.floor(Math.random() * 1000),
    tags: [tag],
    location: isPune ? { city: "Pune", region: "MH", country: "IN" } : { city: "Bengaluru", region: "KA", country: "IN" },
    ownerId: `owner-${(i % 10) + 1}`,
    role: "none",
    isPrivate: Math.random() < 0.2,
    joinStatus: "not_requested",
    rules: ["Be respectful", "Stay on topic"],
  };
});

export type SearchFilters = {
  query?: string;
  locations?: string[]; // city or region names
  sort?: "members" | "recent" | "oldest" | "active";
  tags?: string[];
};

function sortBy<T>(arr: T[], selector: (t: T) => number | string, dir: "asc" | "desc" = "desc"): T[] {
  return [...arr].sort((a, b) => {
    const av = selector(a) as any;
    const bv = selector(b) as any;
    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

export const groupChatsService = {
  async getTrending(): Promise<GroupChat[]> {
    return sortBy(MOCK_GROUPS, g => g.monthlyActivityScore ?? 0, "desc").slice(0, 20);
  },
  async getMostActiveMonthly(): Promise<GroupChat[]> {
    return sortBy(MOCK_GROUPS, g => g.monthlyActivityScore ?? 0, "desc").slice(0, 20);
  },
  async getPopular(): Promise<GroupChat[]> {
    return sortBy(MOCK_GROUPS, g => g.memberCount, "desc").slice(0, 20);
  },
  async getSuggestedForUser(userCity?: string, interests?: string[]): Promise<GroupChat[]> {
    const biased = MOCK_GROUPS.filter(g => (userCity ? g.location?.city === userCity : true) || (interests?.some(t => g.tags?.includes(t)) ?? false));
    return sortBy(biased.length ? biased : MOCK_GROUPS, g => g.monthlyActivityScore ?? 0, "desc").slice(0, 20);
  },
  async getByLocation(cityOrRegion: string): Promise<GroupChat[]> {
    const list = MOCK_GROUPS.filter(g => g.location?.city === cityOrRegion || g.location?.region === cityOrRegion);
    return list.slice(0, 20);
  },
  async getByGenre(genre: string): Promise<GroupChat[]> {
    return MOCK_GROUPS.filter(g => g.tags?.includes(genre)).slice(0, 20);
  },
  async listGenres(): Promise<string[]> {
    return Array.from(new Set(MOCK_GROUPS.flatMap(g => g.tags ?? [])));
  },
  async searchAndFilter(filters: SearchFilters): Promise<GroupChat[]> {
    let list = [...MOCK_GROUPS];
    if (filters.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
    }
    if (filters.tags?.length) {
      list = list.filter(g => g.tags?.some(t => filters.tags?.includes(t)));
    }
    if (filters.locations?.length) {
      list = list.filter(g => filters.locations?.some(l => g.location?.city === l || g.location?.region === l));
    }
    switch (filters.sort) {
      case "members":
        list = sortBy(list, g => g.memberCount, "desc");
        break;
      case "recent":
        list = sortBy(list, g => new Date(g.createdAt).getTime(), "desc");
        break;
      case "oldest":
        list = sortBy(list, g => new Date(g.createdAt).getTime(), "asc");
        break;
      case "active":
        list = sortBy(list, g => g.monthlyActivityScore ?? 0, "desc");
        break;
    }
    return list.slice(0, 50);
  },
  async getEndless(page: number, pageSize = 20): Promise<GroupChat[]> {
    const start = (page - 1) * pageSize;
    return MOCK_GROUPS.slice(start, start + pageSize);
  },
  async requestJoin(groupId: string): Promise<GroupChat | null> {
    const g = MOCK_GROUPS.find(x => x.id === groupId);
    if (!g) return null;
    if (g.isPrivate) {
      g.joinStatus = "pending";
    } else {
      g.joinStatus = "approved";
      g.role = "member";
      g.memberCount += 1;
    }
    return { ...g };
  },
  async cancelRequest(groupId: string): Promise<GroupChat | null> {
    const g = MOCK_GROUPS.find(x => x.id === groupId);
    if (!g) return null;
    if (g.joinStatus === "pending") g.joinStatus = "not_requested";
    return { ...g };
  },
  async leaveGroup(groupId: string): Promise<GroupChat | null> {
    const g = MOCK_GROUPS.find(x => x.id === groupId);
    if (!g) return null;
    if (g.joinStatus === "approved") {
      g.joinStatus = "not_requested";
      g.role = "none";
      g.memberCount = Math.max(0, g.memberCount - 1);
    }
    return { ...g };
  },
  // For Phase 2: placeholder signatures for future backend swap
  __raw() {
    return MOCK_GROUPS;
  }
};


