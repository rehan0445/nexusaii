import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Search, 
  Bot,
  Zap,
  Sword,
  Smile,
  Video,
  X,
  Filter,
  ChevronUp,
  ChevronDown,
  Minus,
  Menu,
  Hash,
  Skull,
  Ghost,
  BookOpen,
  Sparkles,
  Eye,
  Heart,
  Star,
  ThumbsUp,
  Home,
  MessageCircle,
  Trophy,
  UserPlus
} from "lucide-react";
import { useCharacterContext } from "../contexts/CharacterContext";
import { useSettings } from "../contexts/SettingsContext";
import { getAuth } from "../utils/auth";
import NexusChatsButton from "../components/NexusChatsButton";
import axios from "axios";
import { toggleCharacterLike, getMultipleCharacterLikes } from "../services/likeService";
import { menuItems } from "../data/AI-chat-data/data";
import { useCharacterViews, getViewCountsForCharacters, incrementView } from "../utils/viewsManager";
import { CharacterLeaderboard } from "../components/CharacterLeaderboard";
import CharacterCardSkeleton from "../components/CharacterCardSkeleton";
import CharacterEndlessFeed from "../components/CharacterEndlessFeed";
import { pluralizeLikes } from "../utils/pluralize";
// import { useAuth } from "../contexts/AuthContext";
import { useResponsive } from "../hooks/useResponsive";
// import { CreateCharacterModal } from "../components/CreateCharacterModal";
import CompanionBanners from "../components/CompanionBanners";
import EditorChoiceReels from "../components/EditorChoiceReels";
import { animeCharacters } from "../utils/animeCharacters";
import { useGuestTimer } from "../hooks/useGuestTimer";
import RegistrationExpiredModal from "../components/RegistrationExpiredModal";
import { useAuth } from "../contexts/AuthContext";

// Add genre categories
const genreCategories = [
  {
    id: "waifu",
    name: "Waifu",
    description: "Female anime characters you can chat with",
    slugs: [
      "hinata-hyuga",
      "mikasa",
      "asuna",
      "zero-two",
      "marin-kitagawa",
      "misato",
      "rem",
      "mai-sakurajima",
      "winry-rockbell",
      "tsunade-senju",
      "rukia-kuchiki",
      "albedo",
      "historia-reiss",
      "annie-leonhart",
      "farnese-berserk",
      "android-18",
      "fern",
      "darkness",
      "aqua",
      "megumin",
      "yor-forger",
      "makima",
      "power",
      "saber",
      "rin-tohsaka",
      "violet-evergarden",
      "ryuko-matoi",
      "toga-himiko",
      "ochaco-uraraka",
      "momo-yaoyorozu",
      "lucy-heartfilia",
      "erza-scarlet",
      "nezuko",
      "bulma",
      "hestia",
      "roxy-migurdia",
      "yuno-gasai",
      "revy",
      "nami",
      "nico-robin",
    ],
    bgColor: "from-pink-900/30 to-purple-900/30",
    icon: <Heart className="w-5 h-5 text-green-400" />,
    tagline: "Anime Female Characters",
  },
  {
    id: "hubby",
    name: "Hubby",
    description: "Hot male anime characters",
    slugs: [
      "naruto",
      "sasuke",
      "levi",
      "gojo",
      "eren",
      "kakashi",
      "goku",
      "luffy",
      "zoro",
      "sanji",
      "guts",
      "griffith",
      "light-yagami",
      "lelouch",
      "hisoka",
      "alucard",
      "kirito",
      "itachi",
      "vegeta",
      "minato",
      "jiraiya",
      "kira-yamato",
      "archer-emiya",
      "gilgamesh",
      "edward-elric",
      "roy-mustang",
      "kaneki-ken",
      "tanjiro",
      "zenitsu",
      "inosuke",
      "subaru",
      "kazuma",
      "jean-kirstein",
      "l-lawliet",
      "yagami-light",
      "spike-spiegel",
      "vash",
      "mugen",
      "usopp",
    ],
    bgColor: "from-green-900/30 to-emerald-900/30",
    icon: <Zap className="w-5 h-5 text-green-400" />,
    tagline: "Hot Anime Males",
  },
  {
    id: "action-heroes",
    name: "Action Heroes",
    description: "Powerful warriors and fighters from anime and games",
    slugs: [
      "naruto-uzumaki",
      "goku-son",
      "luffy-monkey",
      "saitama",
      "eren-yeager",
      "levi-ackerman",
      "gojo-satoru",
      "tanjiro-kamado",
      "edward-elric",
      "guts",
      "kirito",
      "ichigo-kurosaki",
      "sasuke-uchiha",
      "vegeta",
      "all-might",
      "midoriya-izuku",
      "bakugo-katsuki",
      "todoroki-shoto",
      "kakashi-hatake",
      "itachi-uchiha",
      "minato-namikaze",
      "jiraiya",
      "gara-of-the-sand",
      "rock-lee",
      "neji-hyuga",
      "shikamaru-nara",
      "choji-akimichi",
      "kiba-inuzuka",
      "shino-aburame",
      "hinata-hyuga",
      "sakura-haruno",
      "ino-yamanaka",
      "tenten",
      "temari",
      "kankuro",
    ],
    bgColor: "from-red-900/30 to-orange-900/30",
    icon: <Sword className="w-5 h-5 text-red-400" />,
    tagline: "Epic Warriors & Fighters",
  },
  {
    id: "romance",
    name: "Romance",
    description: "Romantic and relationship-focused characters",
    slugs: [
      "mai-sakurajima",
      "rem",
      "zero-two",
      "marin-kitagawa",
      "yor-forger",
      "makima",
      "power",
      "saber",
      "rin-tohsaka",
      "violet-evergarden",
      "ryuko-matoi",
      "toga-himiko",
      "ochaco-uraraka",
      "momo-yaoyorozu",
      "lucy-heartfilia",
      "erza-scarlet",
      "nezuko",
      "bulma",
      "hestia",
      "roxy-migurdia",
      "yuno-gasai",
      "revy",
      "nami",
      "nico-robin",
      "hinata-hyuga",
      "mikasa-ackerman",
      "asuna",
      "winry-rockbell",
      "tsunade-senju",
      "rukia-kuchiki",
      "albedo",
      "historia-reiss",
      "annie-leonhart",
      "farnese-berserk",
      "android-18",
      "fern",
      "darkness",
      "aqua",
      "megumin",
    ],
    bgColor: "from-green-900/30 to-emerald-900/30",
    icon: <Heart className="w-5 h-5 text-green-400" />,
    tagline: "Love & Relationships",
  },
  {
    id: "comedy",
    name: "Comedy",
    description: "Funny and entertaining characters",
    slugs: [
      "saitama",
      "kazuma-satou",
      "aqua",
      "megumin",
      "darkness",
      "usopp",
      "sanji",
      "zoro",
      "luffy-monkey",
      "goku-son",
      "vegeta",
      "bulma",
      "krillin",
      "master-roshi",
      "yajirobe",
      "mr-satan",
      "videl",
      "gohan",
      "goten",
      "trunks",
      "gogeta",
      "vegito",
      "bardock",
      "raditz",
      "nappa",
      "dodoria",
      "zarbon",
      "guldo",
      "recoome",
      "burter",
      "jeice",
      "captain-ginyu",
      "frieza",
      "cooler",
      "metal-cooler",
      "android-16",
      "android-17",
      "android-18",
      "cell",
      "cell-jr",
    ],
    bgColor: "from-green-900/30 to-emerald-900/30",
    icon: <Smile className="w-5 h-5 text-green-400" />,
    tagline: "Fun & Entertainment",
  },
  {
    id: "vtuber",
    name: "VTubers",
    description: "Virtual YouTubers and streamers",
    slugs: [
      "gawr-gura",
      "mori-calliope",
      "amelia-watson",
      "kiara-takanashi",
      "ina-nis",
      "ironmouse",
      "nyanners",
      "veibae",
      "silvervale",
      "zen",
      "astra",
      "hime-hajime",
      "kizuna-ai",
      "kaguya-luna",
      "mirai-akari",
      "siro",
      "kizuna-ai",
      "luna-tsukuyomi",
      "pekora-usada",
      "rushia-ure",
      "flare-shiranui",
      "noel-shirogane",
      "marine-houshou",
      "shion-murashiro",
      "aqua-minato",
      "shuba-subaru",
      "ayame-nakiri",
      "choco-yuzuki",
      "mel-yozora",
      "matsuri-natsuiro",
      "aki-rosenthal",
      "haato-hakui",
      "fubuki-shirakami",
      "mio-okami",
      "korone-inugami",
      "okayu-nekomata",
      "rushia-ure",
      "flare-shiranui",
      "noel-shirogane",
      "marine-houshou",
    ],
    bgColor: "from-purple-900/30 to-violet-900/30",
    icon: <Video className="w-5 h-5 text-purple-400" />,
    tagline: "Virtual Streamers",
  },
  {
    id: "helpers",
    name: "Helpers",
    description: "Productivity AI characters to assist you",
    slugs: [
      "professor",
      "life-coach",
      "therapist",
      "fitness-trainer",
      "study-buddy",
      "career-advisor",
      "math-tutor",
      "writing-assistant",
      "language-teacher",
      "chess-master",
      "meditation-guide",
      "nutrition-expert",
      "financial-advisor",
      "coding-mentor",
      "research-assistant",
      "productivity-expert",
      "science-teacher",
      "learning-companion",
      "history-professor",
      "philosophy-mentor",
      "personal-assistant",
      "business-consultant",
      "marketing-strategist",
      "design-mentor",
      "project-manager",
      "data-scientist",
      "startup-advisor",
      "job-interview-coach",
      "resume-writer",
      "time-management-coach",
      "public-speaking-coach",
      "debate-coach",
      "language-learning-partner",
      "book-summarizer",
      "technical-writer",
      "quantum-physics-teacher",
      "statistics-tutor",
      "chemistry-lab-assistant",
      "astronomy-professor",
      "ai-ethics-expert",
    ],
    bgColor: "from-green-900/30 to-emerald-900/30",
    icon: <ThumbsUp className="w-5 h-5 text-green-400" />,
    tagline: "Productivity Assistants",
  },
  {
    id: "dark-romance",
    name: "Dark Romance",
    description: "Intense and passionate romantic characters with darker themes",
    slugs: [
      "edward-cullen",
      "harry-styles",
      "mafia-boss",
      "billionaire-ceo",
      "bad-boy",
      "vampire-prince",
      "alpha-werewolf",
      "college-quarterback",
      "mysterious-neighbor",
      "bodyguard",
      "rockstar",
      "college-professor",
      "surgeon",
      "best-friends-brother",
      "celebrity-crush",
      "arranged-marriage",
      "childhood-enemy",
    ],
    bgColor: "from-red-900/30 to-orange-900/30",
    icon: <Smile className="w-5 h-5 text-red-400" />,
    tagline: "Intense Romantic Characters",
  },
];

// Haptic feedback helper (no-op if unsupported)
const triggerHaptic = (pattern: number | number[] = 10) => {
  if (typeof navigator !== "undefined" && (navigator as any)?.vibrate) {
    try {
      (navigator as any).vibrate(pattern);
    } catch {}
  }
};

function AiChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { characters, loading: loadingCharacters, refreshCharacters } = useCharacterContext(); // ✅ Use global shared characters
  const { incognitoMode } = useSettings(); // ✅ Get incognito mode from settings
  const { userLoggedin } = useAuth(); // Get auth state
  const { isGuest, isExpired, formatTimeRemaining, timeRemaining } = useGuestTimer(); // Guest timer hook
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [views, setViews] = useState<Record<string, number>>({});
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showTrendingView, setShowTrendingView] = useState(false);
  const [searchInputFocused, setSearchInputFocused] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [bannerVisible] = useState(true);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [characterLikes, setCharacterLikes] = useState<Record<string, { likeCount: number; userLiked: boolean }>>({});
  const [likeLoading, setLikeLoading] = useState<Record<string, boolean>>({});
  const [refreshingLikes, setRefreshingLikes] = useState(false);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ user: string; ai: string }[]>([]);
  const [showEditorChoice, setShowEditorChoice] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(false);
  const { isMobile, isDesktop } = useResponsive();
  
  // Editor's Choice Characters - All available characters
  const editorChoiceCharacters = useMemo(() => {
    return Object.entries(animeCharacters).map(([slug, character]) => ({
      [slug]: character
    }));
  }, [animeCharacters]);
  
  // Find by ID state
  const [showFindByIdModal, setShowFindByIdModal] = useState(false);
  const [characterIdInput, setCharacterIdInput] = useState("");
  const [findByIdLoading, setFindByIdLoading] = useState(false);

  // Add ref for filter container
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Incognito mode styling variables
  const accentText = incognitoMode ? "text-orange-500" : "text-green-500";
  const accentBg = incognitoMode ? "bg-orange-500/10" : "bg-green-500/10";
  const accentBorder = incognitoMode ? "border-orange-500/20" : "border-green-500/20";
  const accentGradient = incognitoMode
    ? "from-orange-500/0 via-orange-500/10 to-orange-500/0"
    : "from-gold/0 via-gold/10 to-gold/0";
  const mainBg = "bg-black";
  const sideMenuBg = "bg-black/80";
  const borderColor = incognitoMode ? "border-black" : "border-zinc-800";

  // Mobile-only UI states
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Pull-to-refresh (mobile-only)
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);

  // 'All Companions': diverse mix from Star Wars, Waifu, Marvel, Hubby, Dark Romance — then shuffle
  const DIVERSITY_CATEGORIES = [
    { key: 'star wars', tagMatch: (t: string) => /star\s*wars/i.test(t), perCategory: 5 },
    { key: 'waifu', tagMatch: (t: string) => t.toLowerCase() === 'waifu', perCategory: 5 },
    { key: 'marvel', tagMatch: (t: string) => /marvel/i.test(t), perCategory: 5 },
    { key: 'hubby', tagMatch: (t: string) => t.toLowerCase() === 'hubby', perCategory: 5 },
    { key: 'dark romance', tagMatch: (t: string) => /dark\s*romance/i.test(t), perCategory: 5 },
  ];
  const shuffledAllCharacters = useMemo(() => {
    // "All": only characters with views over 1000
    const entries = Object.entries(characters).filter(([slug]) => (views[slug] ?? 0) > 1000);
    const usedSlugs = new Set<string>();
    const result: [string, any][] = [];

    for (const { tagMatch, perCategory } of DIVERSITY_CATEGORIES) {
      const fromCategory = entries
        .filter(([slug, char]) => !usedSlugs.has(slug) && char.tags?.some((t: string) => tagMatch(t)))
        .sort(() => Math.random() - 0.5)
        .slice(0, perCategory);
      fromCategory.forEach(([slug]) => usedSlugs.add(slug));
      result.push(...fromCategory);
    }

    const remaining = entries.filter(([slug]) => !usedSlugs.has(slug)).sort(() => Math.random() - 0.5);
    result.push(...remaining);
    return result.sort(() => Math.random() - 0.5);
  }, [characters, views]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        touchStartYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      } else {
        touchStartYRef.current = null;
        isPullingRef.current = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || touchStartYRef.current == null) return;
      const deltaY = e.touches[0].clientY - touchStartYRef.current;
      if (deltaY > 0) {
        // dampen pull distance
        const dampened = Math.min(120, deltaY * 0.5);
        setPullDistance(dampened);
        // prevent native bounce
        if (dampened > 0) {
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = async () => {
      if (!isPullingRef.current) return;
      const shouldRefresh = pullDistance > 60;
      isPullingRef.current = false;
      touchStartYRef.current = null;
      if (shouldRefresh) {
        try {
          setIsRefreshing(true);
          triggerHaptic(15);
          await refreshCharacters?.();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    // Use non-passive listeners so we can preventDefault
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart as any);
      window.removeEventListener("touchmove", onTouchMove as any);
      window.removeEventListener("touchend", onTouchEnd as any);
    };
  }, [pullDistance, isRefreshing, refreshCharacters]);

  // Auto-rotate announcements every 5 seconds
  useEffect(() => {
    if (!bannerVisible) return;

    const interval = setInterval(() => {
      // Removed setCurrentAnnouncementIndex since currentAnnouncementIndex is unused
    }, 5000);

    return () => clearInterval(interval);
  }, [bannerVisible]);

  // Check URL for new character creation notification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newChar = params.get("newCharacter");
    if (newChar) {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Get all unique tags from all characters
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    Object.values(characters).forEach((character) => {
      if (character.tags) {
        character.tags.forEach((tag) => tags.add(tag));
      }
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [characters]);

  // Count how many characters have each tag
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTags.forEach((tag) => {
      counts[tag] = Object.values(characters).filter(
        (character) => character.tags?.includes(tag)
      ).length;
    });
    return counts;
  }, [allTags, characters]);

  // Sort tags by popularity (count), highest first (strictly by numbers)
  const popularTags = useMemo(() => {
    return [...allTags].sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0));
  }, [allTags, tagCounts]);

  // Updated activeMenuItems
  const activeMenuItems = useMemo(() => {
    return menuItems.map((item) => ({
      ...item,
      active:
        (item.label === "Home" && location.pathname === "/ai" && !showFavorites) ||
        (item.label === "Companion" && location.pathname === "/companion") ||
        (item.label === "My Chats" && location.pathname === "/my-chats") ||
        (item.label === "Shorts" && location.pathname.startsWith("/reels")) ||
        (item.label === "Trending" && showFullLeaderboard),
    }));
  }, [location.pathname, showFavorites, showFullLeaderboard]);

  const handleMenuClick = (label: string) => {
    console.log("Menu clicked:", label);
    switch (label) {
      case "My Chats":
        navigate("/my-chats");
        break;
      case "Home":
        // Reset UI toggles to show the default Home view
        setShowFavorites(false);
        navigate("/ai");
        break;
      case "Companion":
        navigate("/companion");
        break;
      case "Trending":
        setShowFullLeaderboard(true);
        break;
      case "Shorts":
        navigate("/reels");
        break;
    }
  };
  // Derived genre slugs by tag filters





  const findCharacterById = async () => {
    if (!characterIdInput.trim()) return;
    
    setFindByIdLoading(true);
    
    try {
      // Check if character exists in local characters object
      const foundCharacter = characters[characterIdInput.trim()];
      
      if (foundCharacter) {
        // Character found - navigate to profile page
        navigate(`/character/${characterIdInput.trim()}`);
        setShowFindByIdModal(false);
        setCharacterIdInput("");
      } else {
        // Character not found
        alert(`Character with ID "${characterIdInput.trim()}" not found. Please check the ID and try again.`);
      }
    } catch (error) {
      console.error('Error finding character:', error);
      alert('Error searching for character. Please try again.');
    } finally {
      setFindByIdLoading(false);
    }
  };

  // Initialize random views and likes for each character
  useEffect(() => {
    const storedLikes = localStorage.getItem("likes");

    if (storedLikes) {
      setLikes(JSON.parse(storedLikes));
    } else {
      const initialLikes: Record<string, number> = {};

      Object.entries(characters).forEach(([slug, character]) => {
        initialLikes[slug] = Math.floor(Math.random() * 1000);
      });

      setLikes(initialLikes);
    }
  }, [characters]); // Add characters as dependency

  // Save likes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("likes", JSON.stringify(likes));
  }, [likes]);

  // Use the custom hook to manage character views with initial random data
  useCharacterViews(
    setViews,
    useMemo(() => {
      console.log('Generating initial view data for characters:', Object.keys(characters));
      const initialViews: Record<string, number> = {};
      Object.entries(characters).forEach(([slug, character]) => {
        initialViews[slug] = Math.floor(Math.random() * 5000) + 1000;
        console.log(`Generated ${initialViews[slug]} views for character: ${character.name} (${slug})`);
      });
      console.log('Initial views generated:', initialViews);
      return initialViews;
    }, [characters]) // Add characters as dependency
  );

  // Fetch accurate view counts for ALL characters once loaded (fixes "0 views" for characters not in top-500 leaderboard)
  useEffect(() => {
    const slugs = Object.keys(characters);
    if (slugs.length === 0) return;
    let cancelled = false;
    getViewCountsForCharacters(slugs).then((counts) => {
      if (!cancelled && Object.keys(counts).length > 0) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/2d5b2a38-5e31-419c-8a60-677ae4bc8660',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AiChat.tsx:useEffect-bulk-views',message:'Merging bulk counts into views',data:{slugsCount:slugs.length,countsKeys:Object.keys(counts).length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        setViews((prev) => ({ ...prev, ...counts }));
      }
    });
    return () => { cancelled = true; };
  }, [characters]);

  // Debug views state changes
  useEffect(() => {
    console.log('Views state updated:', views);
  }, [views]);

  // Debug characters data
  useEffect(() => {
    console.log('Characters data updated:', Object.keys(characters).length, 'characters');
    console.log('Sample characters:', Object.entries(characters).slice(0, 3));
  }, [characters]);


  // Handle outside clicks and Escape key for filter panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterContainerRef.current && !filterContainerRef.current.contains(event.target as Node)) {
        setFiltersExpanded(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (filtersExpanded) {
          setFiltersExpanded(false);
        }
        if (showSearchOverlay) {
          setShowSearchOverlay(false);
          setSearchQuery("");
        }
        if (showTrendingView) {
          setShowTrendingView(false);
        }
        if (searchInputFocused) {
          setSearchInputFocused(false);
        }
      }
    };

    if (filtersExpanded || showSearchOverlay || showTrendingView || searchInputFocused) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [filtersExpanded, showSearchOverlay, showTrendingView, searchInputFocused]);

  // Handle click outside for search and trending overlays
  useEffect(() => {
    const handleOverlayClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Close search overlay if clicking outside
      if (showSearchOverlay && target.classList.contains('search-overlay-bg')) {
        setShowSearchOverlay(false);
        setSearchQuery("");
      }
      
      // Close trending overlay if clicking outside
      if (showTrendingView && target.classList.contains('trending-overlay-bg')) {
        setShowTrendingView(false);
      }
    };

    if (showSearchOverlay || showTrendingView) {
      document.addEventListener('mousedown', handleOverlayClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleOverlayClickOutside);
    };
  }, [showSearchOverlay, showTrendingView]);

  // Debug trending view state changes
  useEffect(() => {
    console.log("showTrendingView state changed to:", showTrendingView);
  }, [showTrendingView]);

  const toggleFavorite = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    console.log("Toggle favorite for:", slug, "Current favorites:", favorites);

    if (!isLocalStorageAvailable()) {
      console.error("Cannot toggle favorite: localStorage is not available");
      alert("Favorites feature is not available in this browser. Please enable localStorage.");
      return;
    }

    try {
      // Get the most up-to-date favorites from localStorage
      let currentFavorites = [...favorites];
      const storedFavorites = localStorage.getItem("favorites");
      if (storedFavorites) {
        const parsed = JSON.parse(storedFavorites);
        if (Array.isArray(parsed)) {
          currentFavorites = parsed;
        }
      }

      // Update favorites state
      const newFavorites = currentFavorites.includes(slug)
        ? currentFavorites.filter((id) => id !== slug)
        : [...currentFavorites, slug];

      console.log("New favorites state:", newFavorites);

      // Update state
      setFavorites(newFavorites);

      // Update localStorage
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
      console.log("Favorites saved to localStorage successfully");
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorite. Please try again.");
    }
  };

  // Generate a consistent ID for characters that don't have one
  const getCharacterId = (slug: string, character: any): number => {
    if (character?.id && !isNaN(Number(character.id))) {
      return Number(character.id);
    }
    
    // Generate a consistent ID based on the slug
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      const char = slug.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  };

  // Local storage fallback for like counts when backend is unavailable
  const getLocalLikeCount = (slug: string): number => {
    try {
      const localLikes = localStorage.getItem('nexus_local_likes');
      if (localLikes) {
        const likes = JSON.parse(localLikes);
        return likes[slug] || 0;
      }
    } catch (error) {
      console.error('Error reading local likes:', error);
    }
    return 0;
  };

  const setLocalLikeCount = (slug: string, count: number) => {
    try {
      const localLikes = localStorage.getItem('nexus_local_likes');
      const likes = localLikes ? JSON.parse(localLikes) : {};
      likes[slug] = count;
      localStorage.setItem('nexus_local_likes', JSON.stringify(likes));
    } catch (error) {
      console.error('Error saving local likes:', error);
    }
  };

  const handleLike = async (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    
    console.log("🔴 Like button clicked for:", slug);
    console.log("🔴 Current characterLikes state:", characterLikes);
    
    try {
      setLikeLoading(prev => ({ ...prev, [slug]: true }));
      
      // Get character data
      const character = characters[slug];
      console.log("🔴 Character data:", character);
      
      if (!character) {
        console.error("Character not found:", slug);
        alert("Cannot like this character. Character not found.");
        return;
      }

      // Generate consistent ID for the character
      const characterId = getCharacterId(slug, character);
      console.log("🔴 Using character ID:", characterId, "for slug:", slug);
      
      // Check if user is authenticated
      const auth = getAuth();
      const currentUser = auth.currentUser;
      console.log("🔴 Current user:", currentUser);
      
      if (!currentUser) {
        console.log("🔴 No authenticated user found, using local fallback");
        // Use local fallback for unauthenticated users
        const currentLikeCount = getLocalLikeCount(slug);
        const currentUserLiked = characterLikes[slug]?.userLiked || false;
        
        setCharacterLikes(prev => ({
          ...prev,
          [slug]: {
            likeCount: currentUserLiked ? currentLikeCount - 1 : currentLikeCount + 1,
            userLiked: !currentUserLiked,
          }
        }));
        
        setLocalLikeCount(slug, currentUserLiked ? currentLikeCount - 1 : currentLikeCount + 1);
        return;
      }
      
      // Try backend first
      try {
        const response = await toggleCharacterLike(characterId);
        console.log("🔴 Like API response:", response);
        
        if (response.success) {
          setCharacterLikes(prev => ({
            ...prev,
            [slug]: {
              likeCount: response.data.likeCount,
              userLiked: response.data.userLiked,
            }
          }));
          
          console.log(`Character ${response.data.action}:`, slug);
          console.log("🔴 Updated characterLikes state:", {
            ...characterLikes,
            [slug]: {
              likeCount: response.data.likeCount,
              userLiked: response.data.userLiked,
            }
          });
        }
      } catch (backendError) {
        console.log("🔴 Backend failed, using local fallback:", backendError);
        // Fallback to local storage
        const currentLikeCount = getLocalLikeCount(slug);
        const currentUserLiked = characterLikes[slug]?.userLiked || false;
        
        setCharacterLikes(prev => ({
          ...prev,
          [slug]: {
            likeCount: currentUserLiked ? currentLikeCount - 1 : currentLikeCount + 1,
            userLiked: !currentUserLiked,
          }
        }));
        
        setLocalLikeCount(slug, currentUserLiked ? currentLikeCount - 1 : currentLikeCount + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      
      // Final fallback
      console.log("🔴 Using final fallback like functionality");
      const currentLikeCount = getLocalLikeCount(slug);
      const currentUserLiked = characterLikes[slug]?.userLiked || false;
      
      setCharacterLikes(prev => ({
        ...prev,
        [slug]: {
          likeCount: currentUserLiked ? currentLikeCount - 1 : currentLikeCount + 1,
          userLiked: !currentUserLiked,
        }
      }));
      
      setLocalLikeCount(slug, currentUserLiked ? currentLikeCount - 1 : currentLikeCount + 1);
    } finally {
      setLikeLoading(prev => ({ ...prev, [slug]: false }));
    }
  };

  // Load likes for characters
  const loadCharacterLikes = async (characterSlugs: string[]) => {
    try {
      console.log("🟢 Loading likes for character slugs:", characterSlugs);
      setRefreshingLikes(true);
      
      const characterIds = characterSlugs
        .map(slug => {
          const character = characters[slug];
          console.log(`🟢 Character ${slug}:`, character);
          return getCharacterId(slug, character);
        })
        .filter(id => id && !isNaN(Number(id))) as number[];
      
      console.log("🟢 Valid character IDs for likes:", characterIds);
      
      if (characterIds.length === 0) {
        console.log("🟢 No valid character IDs found, using local fallback");
        // Use local fallback for all characters
        const localLikesMap: Record<string, { likeCount: number; userLiked: boolean }> = {};
        characterSlugs.forEach(slug => {
          const localCount = getLocalLikeCount(slug);
          localLikesMap[slug] = {
            likeCount: localCount,
            userLiked: false, // Default to false for local storage
          };
        });
        setCharacterLikes(prev => ({ ...prev, ...localLikesMap }));
        return;
      }

      try {
        const likesData = await getMultipleCharacterLikes(characterIds);
        console.log("🟢 Likes data received:", likesData);
        
        const likesMap: Record<string, { likeCount: number; userLiked: boolean }> = {};
        characterSlugs.forEach(slug => {
          const character = characters[slug];
          const characterId = getCharacterId(slug, character);
          const likeData = likesData[characterId.toString()];
          
          if (likeData) {
            likesMap[slug] = likeData;
          } else {
            // Use local fallback if no backend data
            const localCount = getLocalLikeCount(slug);
            likesMap[slug] = {
              likeCount: localCount,
              userLiked: false,
            };
          }
        });
        
        console.log("🟢 Final likes map:", likesMap);
        setCharacterLikes(prev => ({ ...prev, ...likesMap }));
      } catch (backendError) {
        console.log("🟢 Backend failed, using local fallback for all characters:", backendError);
        // Use local fallback for all characters
        const localLikesMap: Record<string, { likeCount: number; userLiked: boolean }> = {};
        characterSlugs.forEach(slug => {
          const localCount = getLocalLikeCount(slug);
          localLikesMap[slug] = {
            likeCount: localCount,
            userLiked: false,
          };
        });
        setCharacterLikes(prev => ({ ...prev, ...localLikesMap }));
      }
    } catch (error) {
      console.error("🟢 Error loading character likes:", error);
      // Set default values for all characters on error
      const defaultLikesMap: Record<string, { likeCount: number; userLiked: boolean }> = {};
      characterSlugs.forEach(slug => {
        const localCount = getLocalLikeCount(slug);
        defaultLikesMap[slug] = {
          likeCount: localCount,
          userLiked: false,
        };
      });
      setCharacterLikes(prev => ({ ...prev, ...defaultLikesMap }));
    } finally {
      setRefreshingLikes(false);
    }
  };

  // Initialize local like counts for all characters
  const initializeLocalLikes = () => {
    try {
      const localLikes = localStorage.getItem('nexus_local_likes');
      const existingLikes = localLikes ? JSON.parse(localLikes) : {};
      
      // Initialize like counts for all characters
      Object.keys(characters).forEach(slug => {
        if (!(slug in existingLikes)) {
          existingLikes[slug] = 0;
        }
      });
      
      localStorage.setItem('nexus_local_likes', JSON.stringify(existingLikes));
      console.log("🟢 Initialized local like counts for all characters");
    } catch (error) {
      console.error("Error initializing local likes:", error);
    }
  };

  // Load likes for all characters on component mount
  useEffect(() => {
    console.log("🟢 useEffect triggered - characters count:", Object.keys(characters).length);
    if (Object.keys(characters).length > 0) {
      console.log("🟢 Calling loadCharacterLikes with characters:", Object.keys(characters));
      initializeLocalLikes();
      loadCharacterLikes(Object.keys(characters));
    }
  }, [characters]);

  // Refresh like counts periodically to ensure global sync
  useEffect(() => {
    if (Object.keys(characters).length === 0) return;

    const refreshInterval = setInterval(() => {
      console.log("🔄 Refreshing global like counts...");
      loadCharacterLikes(Object.keys(characters));
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [characters]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };


  useEffect(() => {
    const storedHistory = localStorage.getItem("chatHistory");
    if (storedHistory) {
      setChatHistory(JSON.parse(storedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Check if localStorage is available
  const isLocalStorageAvailable = () => {
    try {
      const testKey = "__test_key__";
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.error("localStorage is not available:", e);
      return false;
    }
  };

  // Load favorites from localStorage on component mount
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      console.error("Cannot load favorites: localStorage is not available");
      return;
    }

    try {
      const storedFavorites = localStorage.getItem("favorites");
      console.log("Loading favorites from localStorage:", storedFavorites);
      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites);
        if (Array.isArray(parsedFavorites)) {
          setFavorites(parsedFavorites);
          console.log("Favorites loaded successfully:", parsedFavorites);
        } else {
          console.warn("Stored favorites is not an array, resetting to empty array");
          setFavorites([]);
          localStorage.setItem("favorites", JSON.stringify([]));
        }
      } else {
        console.log("No stored favorites found, initializing empty array");
        setFavorites([]);
        localStorage.setItem("favorites", JSON.stringify([]));
      }
    } catch (error) {
      console.error("Error loading favorites from localStorage:", error);
      // Reset to empty array if there's an error
      setFavorites([]);
      try {
        localStorage.setItem("favorites", JSON.stringify([]));
      } catch (resetError) {
        console.error("Error resetting favorites in localStorage:", resetError);
      }
    }
  }, []);

  // Load search history from localStorage
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;
    
    try {
      const storedHistory = localStorage.getItem("searchHistory");
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory)) {
          setSearchHistory(parsedHistory);
        } else {
          setSearchHistory([]);
          localStorage.setItem("searchHistory", JSON.stringify([]));
        }
      }
    } catch (error) {
      console.error("Error loading search history:", error);
      setSearchHistory([]);
    }
  }, []);

  // Generate search suggestions based on query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const suggestions: string[] = [];

    // Add character names
    Object.values(characters).forEach((character) => {
      if (character.name.toLowerCase().includes(query)) {
        suggestions.push(character.name);
      }
    });

    // Add character roles
    Object.values(characters).forEach((character) => {
      if (character.role.toLowerCase().includes(query)) {
        suggestions.push(character.role);
      }
    });

    // Add tags
    allTags.forEach((tag) => {
      if (tag.toLowerCase().includes(query)) {
        suggestions.push(tag);
      }
    });

    // Add search history matches
    searchHistory.forEach((historyItem) => {
      if (historyItem.toLowerCase().includes(query) && !suggestions.includes(historyItem)) {
        suggestions.push(historyItem);
      }
    });

    // Remove duplicates and limit to 5 suggestions
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);
    setSearchSuggestions(uniqueSuggestions);
  }, [searchQuery, characters, allTags, searchHistory]);

  // Handle search submission
  const handleSearchSubmit = (query: string) => {
    if (!query.trim()) return;

    // Add to search history
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    
    // Save to localStorage
    if (isLocalStorageAvailable()) {
      try {
        localStorage.setItem("searchHistory", JSON.stringify(newHistory));
      } catch (error) {
        console.error("Error saving search history:", error);
      }
    }

    setSearchQuery(query);
    setShowSearchOverlay(true);
    setSearchInputFocused(false);
  };

  // Handle search input key events
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit(searchQuery);
    } else if (e.key === 'Escape') {
      setSearchInputFocused(false);
      setShowSearchOverlay(false);
    }
  };

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      console.error("Cannot save favorites: localStorage is not available");
      return;
    }

    try {
      console.log("Saving favorites to localStorage:", favorites);
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch (error) {
      console.error("Error saving favorites to localStorage:", error);
    }
  }, [favorites]);

  // Load selectedTags from localStorage on component mount
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;
    
    try {
      const saved = localStorage.getItem("selectedTags");
      if (saved) {
        const parsedTags = JSON.parse(saved);
        if (Array.isArray(parsedTags)) {
          setSelectedTags(parsedTags);
        }
      }
    } catch (error) {
      console.error("Error loading selected tags from localStorage:", error);
    }
  }, []);

  // Save selectedTags to localStorage whenever it changes
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      console.error("Cannot save selected tags: localStorage is not available");
      return;
    }

    try {
      localStorage.setItem("selectedTags", JSON.stringify(selectedTags));
    } catch (error) {
      console.error("Error saving selected tags to localStorage:", error);
    }
  }, [selectedTags]);

  // Helper function to create category characters with views and likes
  const createCategoryCharacters = (charactersList: [string, any][]) => {
    return charactersList.map(([slug, character]) => ({
      slug,
      character,
      views: views[slug] || 0,
      likes: characterLikes[slug]?.likeCount || 0,
    }));
  };

  // Add search and tag filtering function
  const filteredCharacters = useMemo(() => {
    let filtered = characters;

    // Apply search filter first
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = Object.entries(filtered).reduce((searchFiltered, [slug, character]) => {
        const matchesSearch = 
          character.name.toLowerCase().includes(query) ||
          character.role.toLowerCase().includes(query) ||
          character.description.toLowerCase().includes(query) ||
          (character.tags?.some((tag: string) => 
            tag.toLowerCase().includes(query)
          )) ||
          (character.personality?.traits && character.personality.traits.some((trait: string) => 
            trait.toLowerCase().includes(query)
          )) ||
          (character.personality?.interests && character.personality.interests.some((interest: string) => 
            interest.toLowerCase().includes(query)
          ));

        if (matchesSearch) {
          searchFiltered[slug] = character;
        }
        return searchFiltered;
      }, {} as Record<string, any>);
    }

    // Apply tag filter (OR logic - character must have at least one selected tag)
    if (selectedTags.length > 0) {
      filtered = Object.entries(filtered).reduce((tagFiltered, [slug, character]) => {
        const matchesTags = character.tags?.some((tag: string) => 
          selectedTags.some(selectedTag => 
            tag.toLowerCase() === selectedTag.toLowerCase()
          )
        );

        if (matchesTags) {
          tagFiltered[slug] = character;
        }
        return tagFiltered;
      }, {} as Record<string, any>);
    }

    return filtered;
  }, [characters, searchQuery, selectedTags]);

  // Get character lists for each category
  const categoryCharacters = useMemo(() => {
    if (!filteredCharacters || Object.keys(filteredCharacters).length === 0) return {};

    const allCharacters = Object.entries(filteredCharacters);
    const randomizedCharacters = [...allCharacters].sort(
      () => Math.random() - 0.5
    );

    // Get trending slugs to avoid duplication
    const trendingSlugs = Object.entries(filteredCharacters)
      .map(([slug, _]) => ({
        slug,
        views: views[slug] || 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 4)
      .map((item) => item.slug);

    // For You - Random selection of characters with more than 4000 views
    const forYouCharacters = randomizedCharacters
      .filter(([slug, _]) => {
        // Exclude trending characters
        if (trendingSlugs.includes(slug)) return false;
        // Only include characters with more than 4000 views
        const characterViews = views[slug] || 0;
        return characterViews > 4000;
      })
      .slice(0, 10);

    // Helper function to ensure we have enough characters in each category
    const ensureSufficientCharacters = (filteredList: [string, any][]) => {
      if (filteredList.length >= 5) return filteredList.slice(0, 10);

      // If we don't have enough characters matching the criteria,
      // pad with random characters not already in the list
      const existingSlugs = new Set(filteredList.map(([slug, _]) => slug));
      const additionalCharacters = randomizedCharacters
        .filter(
          ([slug, _]) =>
            !existingSlugs.has(slug) && !trendingSlugs.includes(slug)
        )
        .slice(0, 10 - filteredList.length);

      return [...filteredList, ...additionalCharacters];
    };

    // Boredom Buster - Entertainment, Fun tags
    const boredomBusterFiltered = allCharacters.filter(
      ([_, character]) =>
        character.tags &&
        character.tags.some((tag: string) =>
          ["entertainment", "fun", "comedy", "adventure", "games"].includes(
            tag.toLowerCase()
          )
        )
    );
    const boredomBusterCharacters = ensureSufficientCharacters(
      boredomBusterFiltered
    );

    // Action - Action, Adventure, Fighting tags
    const actionFiltered = allCharacters.filter(
      ([_, character]) =>
        character.tags &&
        character.tags.some((tag: string) =>
          [
            "action",
            "adventure",
            "warrior",
            "fighter",
            "hero",
            "battle",
          ].includes(tag.toLowerCase())
        )
    );
    const actionCharacters = ensureSufficientCharacters(actionFiltered);

    // Comedy Carnival - Comedy, Humor tags
    const comedyFiltered = allCharacters.filter(
      ([_, character]) =>
        character.tags &&
        character.tags.some((tag: string) =>
          ["comedy", "humor", "funny", "joke", "laugh"].includes(
            tag.toLowerCase()
          )
        )
    );
    const comedyCharacters = ensureSufficientCharacters(comedyFiltered);

    // Most Loved - Characters with highest likes
    const mostLovedCharacters = allCharacters
      .map(([slug, character]) => ({
        slug,
        character,
        likes: likes[slug] || 0,
      }))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10)
      .map(({ slug, character }) => [slug, character] as [string, any]);

    // Crowd Pleasers - High view count that aren't trending
    const crowdPleasersCharacters = allCharacters
      .filter(([slug, _]) => !trendingSlugs.includes(slug))
      .map(([slug, character]) => ({
        slug,
        character,
        views: views[slug] || 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
      .map(({ slug, character }) => [slug, character] as [string, any]);

    return {
      trendingSlugs,
      forYou: createCategoryCharacters(forYouCharacters),
      boredomBuster: createCategoryCharacters(boredomBusterCharacters),
      action: createCategoryCharacters(actionCharacters),
      comedy: createCategoryCharacters(comedyCharacters),
      mostLoved: createCategoryCharacters(mostLovedCharacters),
      crowdPleasers: createCategoryCharacters(crowdPleasersCharacters),
      helpers: createCategoryCharacters(mostLovedCharacters), // Use mostLoved as helpers for now
    };
  }, [filteredCharacters, views, likes, characterLikes]);



  // Dynamic character categorization based on tags
  const getCharactersByGenre = (genreId: string) => {
    if (!filteredCharacters || Object.keys(filteredCharacters).length === 0) {
      console.log("❌ No filtered characters available");
      return [];
    }

    const allCharacters = Object.entries(filteredCharacters);
    console.log(`🔍 Filtering for genre: ${genreId}`);
    console.log(`📊 Total characters available: ${allCharacters.length}`);
    
    let genreCharacters: [string, any][] = [];
    
    switch (genreId) {
      case "waifu":
        genreCharacters = allCharacters.filter(([_, character]) =>
          character.tags && character.tags.some((tag: string) =>
            tag.toLowerCase().includes("female")
          )
        );
        break;
      
      case "hubby":
        genreCharacters = allCharacters.filter(([_, character]) =>
          character.tags && character.tags.some((tag: string) =>
            tag.toLowerCase().includes("male")
          )
        );
        break;
      
      case "action-heroes":
        genreCharacters = allCharacters.filter(([_, character]) =>
          character.tags && character.tags.some((tag: string) =>
            ["warrior", "fighter", "hero", "ninja", "saiyan", "pirate", "soldier", "titan-slayer", "alchemist", "demon slayer", "jujutsu sorcerer", "hokage", "king of the pirates", "death note", "geass", "revolution", "bounty hunter", "swordsman", "commander", "general"].includes(tag.toLowerCase())
          )
        );
        break;
      
      case "romance":
        genreCharacters = allCharacters.filter(([_, character]) =>
          character.tags && character.tags.some((tag: string) =>
            ["romantic", "love", "relationship", "dating", "romance", "tsundere", "yandere", "succubus", "devil", "queen", "princess", "maid", "schoolgirl", "student", "teacher", "doctor", "lawyer", "police", "detective", "spy", "assassin", "mafia", "billionaire", "ceo", "rockstar", "surgeon", "professor", "bodyguard"].includes(tag.toLowerCase())
          )
        );
        break;
      
      case "comedy":
        genreCharacters = allCharacters.filter(([_, character]) =>
          character.tags && character.tags.some((tag: string) =>
            ["comedy", "funny", "humor", "entertainment", "fun", "chuunibyou", "liar", "inventor", "womanizer"].includes(tag.toLowerCase())
          )
        );
        break;
      
      case "vtuber":
        genreCharacters = allCharacters.filter(([_, character]) =>
          character.tags && character.tags.some((tag: string) =>
            tag.toLowerCase().includes("vtuber")
          )
        );
        break;
      
      case "helpers":
        genreCharacters = allCharacters.filter(([_, character]) =>
          character.tags && character.tags.some((tag: string) =>
            tag.toLowerCase().includes("helper")
          )
        );
        break;
      
      case "dark-romance":
        genreCharacters = allCharacters.filter(([_, character]) =>
          character.tags && character.tags.some((tag: string) =>
            ["vampire", "werewolf", "dark", "intense", "passionate", "assassin", "mafia", "billionaire", "ceo", "rockstar", "surgeon", "professor", "bodyguard"].includes(tag.toLowerCase())
          )
        );
        break;
      
      default:
        genreCharacters = allCharacters;
    }
    
    console.log(`✅ Found ${genreCharacters.length} characters for genre: ${genreId}`);
    if (genreCharacters.length > 0) {
      console.log(`📋 Sample characters:`, genreCharacters.slice(0, 3).map(([slug, char]) => `${char.name} (${slug})`));
    }
    
    return genreCharacters;
  };

  // Load characters on component mount
  useEffect(() => {
    // Characters are already loaded by CharacterContext
    // No need to load them again here
    console.log("🔍 AiChat component mounted");
    console.log("📊 Characters state:", Object.keys(characters).length);
    console.log("🔄 Loading state:", loadingCharacters);
    console.log("📋 Available characters:", Object.keys(characters));
  }, [characters, loadingCharacters]);

  if (loadingCharacters) {
    console.log("🔄 Still loading characters...");
    return (
      <div className={`${isDesktop ? 'pl-5' : ''} px-4`}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <CharacterCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    );
  }

  console.log("✅ Characters loaded successfully!");
  console.log("📊 Total characters:", Object.keys(characters).length);
  console.log("🔍 First few characters:", Object.entries(characters).slice(0, 3).map(([slug, char]) => ({
    slug,
    name: char.name,
    image: char.image
  })));

  return (
    <div className={`min-h-screen ${mainBg}`}>
      {/* Desktop Sidebar - Slides in/out */}
      {isDesktop && (
        <>
          {/* Backdrop */}
          {isDesktopSidebarOpen && (
            <div
              className="fixed inset-0 z-[190] bg-black/60 transition-opacity"
              onClick={() => setIsDesktopSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
          
          {/* Sidebar */}
          <nav 
            className={`fixed left-0 top-0 h-screen w-64 backdrop-blur-sm border-r ${borderColor} ${sideMenuBg} overflow-y-auto z-[200] transform transition-transform duration-300 ${
              isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <img 
                      src="/assets/nexus-logo.png" 
                      alt="Nexus Logo" 
                      className="w-full h-full object-contain" 
                      onError={(e) => {
                        console.error('Logo failed to load');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className={`text-xl font-bold ${accentText}`}>Nexus</span>
                </div>
                <button
                  onClick={() => setIsDesktopSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-zinc-700/50 transition-colors text-zinc-400 hover:text-white"
                  aria-label="Close sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            <div className="space-y-2">
              {/* Home */}
              <button
                onClick={() => {
                  handleMenuClick("Home");
                  setIsDesktopSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-mono ${
                  activeMenuItems.find(item => item.label === "Home")?.active
                    ? incognitoMode
                      ? `${accentBg.replace('/10', '')} text-white`
                      : "bg-green-500 text-black"
                    : `text-zinc-400 hover:bg-zinc-700/50 hover:text-white`
                }`}
              >
                <Home className={`w-5 h-5 ${
                  activeMenuItems.find(item => item.label === "Home")?.active
                    ? incognitoMode
                      ? "text-white"
                      : "text-black"
                    : ""
                }`} />
                <span className="font-medium">Home</span>
              </button>

              {/* My Chats */}
              <button
                onClick={() => {
                  handleMenuClick("My Chats");
                  setIsDesktopSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-mono ${
                  activeMenuItems.find(item => item.label === "My Chats")?.active
                    ? incognitoMode
                      ? `${accentBg.replace('/10', '')} text-white`
                      : "bg-green-500 text-black"
                    : `text-zinc-400 hover:bg-zinc-700/50 hover:text-white`
                }`}
              >
                <MessageCircle className={`w-5 h-5 ${
                  activeMenuItems.find(item => item.label === "My Chats")?.active
                    ? incognitoMode
                      ? "text-white"
                      : "text-black"
                    : ""
                }`} />
                <span className="font-medium">My Chats</span>
              </button>

              {/* Trending */}
              <button
                onClick={() => {
                  handleMenuClick("Trending");
                  setIsDesktopSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-mono ${
                  activeMenuItems.find(item => item.label === "Trending")?.active
                    ? incognitoMode
                      ? `${accentBg.replace('/10', '')} text-white`
                      : "bg-green-500 text-black"
                    : `text-zinc-400 hover:bg-zinc-700/50 hover:text-white`
                }`}
              >
                <Trophy className={`w-5 h-5 ${
                  activeMenuItems.find(item => item.label === "Trending")?.active
                    ? incognitoMode
                      ? "text-white"
                      : "text-black"
                    : ""
                }`} />
                <span className="font-medium">Trending</span>
              </button>

              {/* Shorts */}
              <button
                onClick={() => {
                  handleMenuClick("Shorts");
                  setIsDesktopSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-mono ${
                  activeMenuItems.find(item => item.label === "Shorts")?.active
                    ? incognitoMode
                      ? `${accentBg.replace('/10', '')} text-white`
                      : "bg-green-500 text-black"
                    : `text-zinc-400 hover:bg-zinc-700/50 hover:text-white`
                }`}
              >
                <Video className={`w-5 h-5 ${
                  activeMenuItems.find(item => item.label === "Shorts")?.active
                    ? incognitoMode
                      ? "text-white"
                      : "text-black"
                    : ""
                }`} />
                <span className="font-medium">Shorts</span>
              </button>
            </div>
          </div>
        </nav>
        </>
      )}

      {/* Header */}
      <header className={`border-b ${borderColor} ${mainBg}/50 backdrop-blur-sm fixed ${isDesktop ? 'left-0' : 'left-0'} right-0 top-0 z-50`}>
        <div className="w-full px-4 sm:px-6 py-3">
          {/* Desktop Layout - Single Row */}
          {isDesktop ? (
            <div className="flex items-center justify-between gap-4">
              {/* Left: Hamburger Menu and Logo */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDesktopSidebarOpen(true)}
                  className="p-2 rounded-lg hover:bg-zinc-700/50 transition-colors text-zinc-300 hover:text-white"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <img 
                      src="/assets/nexus-logo.png" 
                      alt="Nexus Logo" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.error('Logo failed to load on desktop');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className={`text-xl font-bold ${accentText}`}>Nexus</span>
                </div>
              </div>
              
              {/* Center: Search Bar */}
              <div className="relative flex-1 max-w-2xl">
                <div className="relative group">
                  {/* Gradient border wrapper - shows on hover/focus */}
                  <div className="absolute inset-0 rounded-[10px] bg-gradient-to-r from-green-500 to-green-600 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 ease-in-out" />
                  
                  {/* Inner background - always visible */}
                  <div className="absolute inset-[1px] rounded-[9px] bg-[rgba(20,20,20,0.9)]" />
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5 pointer-events-none z-10 transition-colors duration-300 group-hover:text-zinc-300 group-focus-within:text-zinc-300" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchInputFocused(true)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search AI characters or scenarios..."
                      className="w-full pl-10 pr-12 py-[0.7rem] rounded-[10px] bg-transparent border-0 text-[#f8f8f8] placeholder-[rgba(255,255,255,0.4)] focus:outline-none transition-all duration-300 ease-in-out hover:shadow-[0_0_8px_rgba(34,197,94,0.3)] focus:shadow-[0_0_10px_rgba(34,197,94,0.45)] relative z-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSearchInputFocused(false);
                          if (isMobile) setMobileSearchOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors z-20">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {searchQuery && (
                      <button
                        onClick={() => handleSearchSubmit(searchQuery)}
                        className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors z-20">
                        <Search className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Suggestions Dropdown */}
                {searchInputFocused && (searchQuery.trim() || searchHistory.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800/95 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                    {/* Search History */}
                    {!searchQuery.trim() && searchHistory.length > 0 && (
                      <div className="p-3 border-b border-zinc-700">
                        <div className="text-xs text-zinc-400 mb-2">Recent Searches</div>
                        {searchHistory.map((historyItem, index) => (
                          <div
                            key={`history-${historyItem}-${index}`}
                            onClick={() => handleSearchSubmit(historyItem)}
                            className="flex items-center space-x-2 p-2 rounded hover:bg-zinc-700/50 cursor-pointer transition-colors">
                            <Search className="w-4 h-4 text-zinc-500" />
                            <span className="text-white text-sm">{historyItem}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Search Suggestions */}
                    {searchQuery.trim() && searchSuggestions.length > 0 && (
                      <div className="p-3">
                        <div className="text-xs text-zinc-400 mb-2">Suggestions</div>
                        {searchSuggestions.map((suggestion, index) => (
                          <div
                            key={`suggestion-${suggestion}-${index}`}
                            onClick={() => handleSearchSubmit(suggestion)}
                            className="flex items-center space-x-2 p-2 rounded hover:bg-zinc-700/50 cursor-pointer transition-colors">
                            <Search className="w-4 h-4 text-zinc-500" />
                            <span className="text-white text-sm">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Results */}
                    {searchQuery.trim() && Object.keys(filteredCharacters).length > 0 && (
                      <div className="p-3 border-t border-zinc-700">
                        <div className="text-xs text-zinc-400 mb-2">Quick Results</div>
                        {Object.entries(filteredCharacters).slice(0, 3).map(([slug, character]) => (
                          <div
                            key={slug}
                            onClick={() => { incrementView(slug).catch(() => {}); navigate(`/chat/${slug}`); }}
                            className="flex items-center space-x-3 p-2 rounded hover:bg-zinc-700/50 cursor-pointer transition-colors">
                            <img
                              src={character.image}
                              alt={character.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                            <div className="flex-1">
                              <div className="text-white text-sm font-medium">{character.name}</div>
                              <div className="text-zinc-400 text-xs">{character.role}</div>
                            </div>
                          </div>
                        ))}
                        {Object.keys(filteredCharacters).length > 3 && (
                          <div
                            onClick={() => handleSearchSubmit(searchQuery)}
                            className="text-center py-2 text-sm text-green-500 hover:text-green-500/80 cursor-pointer transition-colors">
                            View all {Object.keys(filteredCharacters).length} results
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Right: Register Now Button (for guest users) and Filters */}
              <div className="flex items-center gap-4" ref={filterContainerRef}>
                {/* Register Now Button - Show for guest users */}
                {isGuest && !userLoggedin && (
                  <button
                    onClick={() => navigate('/register', { replace: false })}
                    className="relative flex items-center space-x-2 px-4 py-2 rounded-[10px] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium transition-all duration-300 ease-in-out focus:outline-none shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register Now</span>
                  </button>
                )}
                
                {/* Filters */}
                {!showFavorites && (
                  <div className="relative group">
                    {/* Gradient border wrapper - shows on hover/active */}
                    <div className={`absolute inset-0 rounded-[10px] bg-gradient-to-r from-green-500 to-green-600 transition-opacity duration-300 ease-in-out ${
                      filtersExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`} />
                    
                    {/* Inner background - changes on active */}
                    <div className={`absolute inset-[1px] rounded-[9px] transition-all duration-300 ease-in-out ${
                      filtersExpanded 
                        ? 'bg-[rgba(34,197,94,0.1)]' 
                        : 'bg-transparent'
                    }`} />
                    
                    <button
                      onClick={() => setFiltersExpanded(!filtersExpanded)}
                      aria-expanded={filtersExpanded}
                      aria-haspopup="true"
                      aria-controls="filter-panel"
                      className="relative flex items-center space-x-2 px-3 py-2 rounded-[10px] bg-transparent border-0 text-zinc-200 hover:text-white transition-all duration-300 ease-in-out focus:outline-none hover:shadow-[0_0_8px_rgba(34,197,94,0.3)] focus:shadow-[0_0_10px_rgba(34,197,94,0.45)] z-10"
                    >
                      <Filter className="w-5 h-5" />
                      <span>Filters</span>
                      {filtersExpanded ? (
                        <ChevronUp className="w-4 h-4 ml-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Mobile Layout - Keep original structure */
            <>
              <div className="flex items-center justify-between py-1 gap-4">
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className={`p-2 rounded-xl bg-black/70 border border-green-500/30 hover:bg-black/80 transition-colors`}
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5 text-green-500" />
                  </button>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <img 
                        src="/assets/nexus-logo.png" 
                        alt="Nexus Logo" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          console.error('Logo failed to load on mobile');
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-4xl font-bold bg-gradient-to-r from-green-400 via-green-500 to-green-600 bg-clip-text text-transparent" style={{ fontFamily: 'Rouge Script, cursive' }}>
                      {showFavorites ? "My Favorites" : "Nexus"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-auto">
                  {/* Register Now Button - Matches other nav icon buttons */}
                  {isGuest && !userLoggedin && (
                    <button
                      onClick={() => navigate('/register', { replace: false })}
                      className="p-2 rounded-xl bg-black/70 border border-green-500/30 hover:bg-black/80 transition-colors"
                      aria-label="Register"
                      title="Register Now"
                    >
                      <UserPlus className="w-5 h-5 text-green-500" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMobileSearchOpen((prev) => !prev);
                      if (!mobileSearchOpen) {
                        setTimeout(() => searchInputRef.current?.focus(), 0);
                      }
                    }}
                    className={`p-2 rounded-xl bg-black/70 border border-green-500/30 hover:bg-black/80 transition-colors`}
                    aria-label="Open search"
                  >
                    <Search className="w-5 h-5 text-green-500" />
                  </button>
                  {!showFavorites && (
                    <button
                      onClick={() => setMobileFilterOpen(true)}
                      className={`p-2 rounded-xl bg-black/70 border border-green-500/30 hover:bg-black/80 transition-colors`}
                      aria-label="Open filters"
                    >
                      <Filter className="w-5 h-5 text-green-500" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Mobile Search Bar (conditionally shown) */}
              {mobileSearchOpen && (
                <div className="mt-3">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 text-zinc-400 w-5 h-5" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchInputFocused(true)}
                      onKeyDown={handleSearchKeyDown}
                      placeholder="Search AI characters or scenarios..."
                      className={`w-full pl-10 pr-12 py-2 rounded-lg ${sideMenuBg} border ${borderColor} text-white placeholder-zinc-400 focus:outline-none focus:${accentBorder} transition-all`}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSearchInputFocused(false);
                          setMobileSearchOpen(false);
                        }}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {searchQuery && (
                      <button
                        onClick={() => handleSearchSubmit(searchQuery)}
                        className="absolute right-8 top-2.5 text-zinc-400 hover:text-white transition-colors">
                        <Search className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Mobile Search Suggestions */}
                    {searchInputFocused && (searchQuery.trim() || searchHistory.length > 0) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800/95 backdrop-blur-sm border border-zinc-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                        {!searchQuery.trim() && searchHistory.length > 0 && (
                          <div className="p-3 border-b border-zinc-700">
                            <div className="text-xs text-zinc-400 mb-2">Recent Searches</div>
                            {searchHistory.map((historyItem, index) => (
                              <div
                                key={`history-${historyItem}-${index}`}
                                onClick={() => handleSearchSubmit(historyItem)}
                                className="flex items-center space-x-2 p-2 rounded hover:bg-zinc-700/50 cursor-pointer transition-colors">
                                <Search className="w-4 h-4 text-zinc-500" />
                                <span className="text-white text-sm">{historyItem}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {searchQuery.trim() && searchSuggestions.length > 0 && (
                          <div className="p-3">
                            <div className="text-xs text-zinc-400 mb-2">Suggestions</div>
                            {searchSuggestions.map((suggestion, index) => (
                              <div
                                key={`suggestion-${suggestion}-${index}`}
                                onClick={() => handleSearchSubmit(suggestion)}
                                className="flex items-center space-x-2 p-2 rounded hover:bg-zinc-700/50 cursor-pointer transition-colors">
                                <Search className="w-4 h-4 text-zinc-500" />
                                <span className="text-white text-sm">{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {searchQuery.trim() && Object.keys(filteredCharacters).length > 0 && (
                          <div className="p-3 border-t border-zinc-700">
                            <div className="text-xs text-zinc-400 mb-2">Quick Results</div>
                            {Object.entries(filteredCharacters).slice(0, 3).map(([slug, character]) => (
                              <div
                                key={slug}
                                onClick={() => { incrementView(slug).catch(() => {}); navigate(`/chat/${slug}`); }}
                                className="flex items-center space-x-3 p-2 rounded hover:bg-zinc-700/50 cursor-pointer transition-colors">
                                <img
                                  src={character.image}
                                  alt={character.name}
                                  className="w-8 h-8 rounded object-cover"
                                />
                                <div className="flex-1">
                                  <div className="text-white text-sm font-medium">{character.name}</div>
                                  <div className="text-zinc-400 text-xs">{character.role}</div>
                                </div>
                              </div>
                            ))}
                            {Object.keys(filteredCharacters).length > 3 && (
                              <div
                                onClick={() => handleSearchSubmit(searchQuery)}
                                className="text-center py-2 text-sm text-green-500 hover:text-green-500/80 cursor-pointer transition-colors">
                                View all {Object.keys(filteredCharacters).length} results
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* Drawer for Mobile/Tablet */}
      {!isDesktop && (
        <div className={`fixed inset-0 z-[200] ${isDrawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isDrawerOpen}>
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setIsDrawerOpen(false)}
          />
          {/* Panel */}
          <div className={`absolute left-0 top-0 h-full w-64 ${sideMenuBg} border-r ${borderColor} backdrop-blur-sm transform transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <img 
                      src="/assets/nexus-logo.png" 
                      alt="Nexus Logo" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.error('Logo failed to load in drawer');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <span className={`text-xl font-bold ${accentText}`}>Nexus</span>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2">
                {activeMenuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setIsDrawerOpen(false);
                      handleMenuClick(item.label);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      item.active
                        ? incognitoMode
                          ? `${accentBg.replace('/10', '')} text-white`
                          : 'bg-green-500 text-zinc-900'
                        : 'text-zinc-300 hover:bg-zinc-700/50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`${isDesktop ? 'pl-5' : ''} px-4 sm:px-6 pt-16 sm:pt-20 pb-24 sm:pb-12`}>
        <div className="w-full">
          {/* Filtered Results View - Show when tags are selected */}
          {!showFavorites && selectedTags.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Filtered Characters
                </h2>
                <p className="text-zinc-400 mb-4">
                  Characters matching your selected filters
                </p>
                
                {/* Active Filters Display */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center space-x-2 bg-green-500/20 text-green-500 border border-green-500/30 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{tag}</span>
                      <button
                        onClick={() => toggleTag(tag)}
                        className="hover:text-green-500/80 transition-colors"
                        aria-label={`Remove ${tag} filter`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-zinc-400 hover:text-white text-sm px-2 py-1 rounded transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {Object.keys(filteredCharacters).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-zinc-800/50 rounded-full flex items-center justify-center">
                    <Filter className="w-12 h-12 text-zinc-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No characters found
                  </h3>
                  <p className="text-zinc-400 mb-6">
                    No characters match the selected filters. Try adjusting your selection.
                  </p>
                  <button
                    onClick={() => setSelectedTags([])}
                    className="bg-green-500 text-zinc-900 px-6 py-3 rounded-lg font-medium hover:bg-green-500/90 transition-colors">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm text-zinc-400">
                      {Object.keys(filteredCharacters).length} characters found
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6 relative">
                    {/* Subtle left edge glow for visual blending */}
                    {isDesktop && (
                      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none z-0" />
                    )}
                    {Object.entries(filteredCharacters).map(([slug, character]) => (
                      <div
                        key={slug}
                        onClick={() => { incrementView(slug).catch(() => {}); navigate(`/chat/${slug}`); }}
                        className="group relative bg-zinc-800/50 rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer">
                        
                        <div className="relative aspect-[2/3]">
                          <img
                            src={character.image}
                            alt={character.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                          {/* Actions */}
                          <div className="absolute top-3 right-3 z-10 flex gap-2">
                            <button
                              onClick={(e) => toggleFavorite(e, slug)}
                              className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                                favorites.includes(slug)
                                  ? "bg-green-500/90 text-zinc-900"
                                  : "bg-black/40 text-white hover:bg-black/60"
                              }`}>
                              <Star
                                className="w-4 h-4"
                                fill={favorites.includes(slug) ? "currentColor" : "none"}
                              />
                            </button>

                            {/* Removed like button; views only */}
                          </div>

                          {/* Character info */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                            <h3 className="text-white text-lg font-bold mb-1 truncate">
                              {character.name}
                            </h3>
                            <p className="text-green-500 text-sm mb-1 truncate">{character.role}</p>
                            <p className="text-zinc-400 text-xs mb-2 truncate">by {character.creator || 'ginger3000'}</p>
                            
                            <div className="flex items-center justify-between text-xs text-zinc-300 mb-2">
                              <div className="flex items-center ml-auto">
                                <span>{(views[slug] || 0).toLocaleString()} views</span>
                              </div>
                            </div>

                            <button className="w-full bg-black/50 hover:bg-black/70 text-white py-2 rounded-lg font-medium transition-colors text-sm backdrop-blur-sm">
                              Chat Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Favorites View */}
          {showFavorites && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  My Favorites
                </h2>
                <p className="text-zinc-400">
                  Your favorite AI companions
                </p>
              </div>

              {favorites.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-zinc-800/50 rounded-full flex items-center justify-center">
                    <Star className="w-12 h-12 text-zinc-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No favorites yet
                  </h3>
                  <p className="text-zinc-400 mb-6">
                    Start exploring characters and add them to your favorites to see them here.
                  </p>
                  <button
                    onClick={() => setShowFavorites(false)}
                    className="bg-green-500 text-zinc-900 px-6 py-3 rounded-lg font-medium hover:bg-green-500/90 transition-colors">
                    Explore Characters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6 relative">
                  {/* Subtle left edge glow for visual blending */}
                  {isDesktop && (
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none z-0" />
                  )}
                  {favorites.map((slug) => {
                    const character = characters[slug];
                    if (!character) return null;
                    
                    return (
                      <div
                        key={slug}
                        onClick={() => { incrementView(slug).catch(() => {}); navigate(`/chat/${slug}`); }}
                        className="group relative bg-gradient-to-br from-gold/20 to-amber/20 rounded-xl overflow-hidden shadow-lg cursor-pointer hover:opacity-90 transition-all duration-300">
                        {/* Favorite Badge */}
                        <div className="absolute top-3 left-3 z-10 bg-green-500 text-zinc-900 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                          <Star className="w-3 h-3 mr-1" fill="currentColor" />
                          FAVORITE
                        </div>

                        {/* Image with gradient overlay */}
                        <div className="aspect-[2/3] relative overflow-hidden">
                          <img
                            src={character.image}
                            alt={character.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                        </div>

                        {/* View Count */}
                        <div className="absolute top-3 right-3 z-10">
                          <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                            <Eye className="w-4 h-4" />
                            <span className="text-xs font-medium">{views[slug]?.toLocaleString() || 0}</span>
                          </div>
                        </div>

                        {/* Character info at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                          <h3 className="text-white text-xl font-bold mb-1">
                            {character.name}
                          </h3>
                          <p className="text-green-500 text-sm mb-3">
                            {character.role}
                          </p>

                          <button className="w-full bg-black/50 hover:bg-black/70 text-white py-3 rounded-lg font-medium transition-colors text-sm backdrop-blur-sm min-h-[44px]">
                            Chat Now
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Original content - only show when not in Favorites view or when filters are active */}
          {!showFavorites && selectedTags.length === 0 && (
            <>


              {/* Netflix-Style Character Banners */}
              <div className="mt-2 sm:mt-0">
                <CompanionBanners
                  characters={characters}
                  views={views}
                  characterLikes={characterLikes}
                  featuredCharacters={[
                    'batman-bruce',    // Batman
                    'makima',          // Makima
                    'maul',            // Darth Maul
                    'dante-maroni',    // Dante Maroni
                    'virat-kohli'      // Virat Kohli
                  ]}
                />
              </div>
              
              {/* For You Section */}
              <div className="mb-12">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white serif-title">For You</h2>
                </div>
                <div className="relative">
                  <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                    {(categoryCharacters.forYou || []).map(({ slug, character, views, likes }) => (
                      <div
                        key={slug}
                        className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer"
                        onClick={() => { incrementView(slug).catch(() => {}); navigate(`/character/${slug}`); }}
                      >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                          <img
                            src={character.image}
                            alt={character.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-white/90">
                                  <Eye className="w-4 h-4" />
                                  <span className="text-sm">{(views || 0).toLocaleString()} views</span>
                                </div>
                              </div>
                        </div>
                        <div className="text-center">
                          <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{character.name}</h3>
                          <p className="text-zinc-400 text-xs line-clamp-1">{character.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* New on Nexus */}
              <div className="mb-12">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white serif-title">New on Nexus</h2>
                </div>
                <div className="relative">
                  <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                    {Object.entries(characters)
                      .sort(([, a], [, b]) => (Number(b.id) || 0) - (Number(a.id) || 0))
                      .slice(0, 12)
                      .map(([slug, character]) => (
                        <div
                          key={slug}
                          className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer"
                          onClick={() => { incrementView(slug).catch(() => {}); navigate(`/character/${slug}`); }}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={character.image}
                              alt={character.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-white/90">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">{(views[slug] || 0).toLocaleString()} views</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{character.name}</h3>
                            <p className="text-zinc-400 text-xs line-clamp-1">{character.role}</p>
                            <p className="text-zinc-500 text-[11px] line-clamp-1">by {character.creator || 'ginger3000'}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Cult Classics */}
              <div className="mb-12">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white serif-title">Cult Classics</h2>
                </div>
                <div className="relative">
                  <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                    {['goku-son','yoda','joker','kitana','light-yagami','ryu']
                      .map(slug => [slug, characters[slug]] as const)
                      .filter(([, character]) => !!character)
                      .map(([slug, character]) => (
                        <div
                          key={slug}
                          className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer"
                          onClick={() => { incrementView(slug).catch(() => {}); navigate(`/character/${slug}`); }}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={character!.image}
                              alt={character!.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-white/90">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">{(views[slug] || 0).toLocaleString()} views</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{character!.name}</h3>
                            <p className="text-zinc-400 text-xs line-clamp-1">{character!.role}</p>
                            <p className="text-zinc-500 text-[11px] line-clamp-1">by {character!.creator || 'ginger3000'}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Shadows and Secrets */}
              <div className="mb-12">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white serif-title">Shadows & Secrets</h2>
                </div>
                <div className="relative">
                  <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                    {['batman-bruce','erza-scarlet','sukuna','luke-skywalker','batgirl-barbara','jasper-vale']
                      .map(slug => [slug, characters[slug]] as const)
                      .filter(([, character]) => !!character)
                      .map(([slug, character]) => (
                        <div
                          key={slug}
                          className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer"
                          onClick={() => { incrementView(slug).catch(() => {}); navigate(`/character/${slug}`); }}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={character!.image}
                              alt={character!.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-white/90">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">{(views[slug] || 0).toLocaleString()} views</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{character!.name}</h3>
                            <p className="text-zinc-400 text-xs line-clamp-1">{character!.role}</p>
                            <p className="text-zinc-500 text-[11px] line-clamp-1">by {character!.creator || 'ginger3000'}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Dark Desires */}
              <div className="mb-12">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white serif-title">Dark Desires</h2>
                </div>
                <div className="relative">
                  <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                    {['cassian-acotar','kai-young','liam-hunter','soren-king','drake-callahan','ryker-cross','lucian-nyx','atlas-grayson','thorne-blackwood','ezra-stone']
                      .map(slug => [slug, characters[slug]] as const)
                      .filter(([, character]) => !!character)
                      .map(([slug, character]) => (
                        <div
                          key={slug}
                          className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer"
                          onClick={() => { incrementView(slug).catch(() => {}); navigate(`/character/${slug}`); }}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={character!.image}
                              alt={character!.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                              <div className="flex items-center space-x-2 text-white/90">
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">{(views[slug] || 0).toLocaleString()} views</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{character!.name}</h3>
                            <p className="text-zinc-400 text-xs line-clamp-1">{character!.role}</p>
                            <p className="text-zinc-500 text-[11px] line-clamp-1">by {character!.creator || 'ginger3000'}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* All Companions (shuffled) */}
              <div className="mb-12">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white serif-title">All Companions</h2>
                </div>
                <div className="relative">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6">
                    {/* Subtle left edge glow for visual blending */}
                    {isDesktop && (
                      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none z-0" />
                    )}
                    {shuffledAllCharacters
                      .map(([slug, character]) => (
                        <div
                          key={slug}
                          className="cursor-pointer"
                          onClick={() => { incrementView(slug).catch(() => {}); navigate(`/character/${slug}`); }}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2 group">
                            <img
                              src={character.image}
                              alt={character.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute top-3 right-3">
                              <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                                <Eye className="w-4 h-4" />
                                <span className="text-xs font-medium">{views[slug]?.toLocaleString() || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{character.name}</h3>
                            <p className="text-zinc-400 text-xs line-clamp-1">{character.role}</p>
                            <p className="text-zinc-500 text-[11px] line-clamp-1">by {character.creator || 'ginger3000'}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Character Flash Cards removed per request */}


              {/* Trending Now and New Arrivals removed per request */}

              {/* Category-Based Rows */}
              
              {/* Anime & Manga Characters */}
              <div className="mb-12">
                <div className="mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Anime & Manga</h2>
                  </div>
                </div>
                <div className="relative">
                  <div className="flex space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800 pb-4">
                    {Object.entries(characters)
                      .filter(([slug, character]) => 
                        character.tags && character.tags.some(tag => 
                          ['anime', 'manga', 'ninja', 'saiyan', 'shinigami'].includes(tag.toLowerCase())
                        )
                      )
                      .slice(0, 10)
                      .map(([slug, character]) => (
                        <div
                          key={slug}
                          className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer"
                          onClick={() => { incrementView(slug).catch(() => {}); navigate(`/character/${slug}`); }}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={character.image}
                              alt={character.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                            
                            {/* View Count */}
                            <div className="absolute top-3 right-3 z-10">
                              <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                                <Eye className="w-4 h-4" />
                                <span className="text-xs font-medium">{views[slug]?.toLocaleString() || 0}</span>
                              </div>
                            </div>

                            {/* Character Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <h3 className="text-white text-lg font-bold mb-1">{character.name}</h3>
                              <p className="text-purple-400 text-sm">{character.role}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                </div>

              {/* New on Nexus */}
              <div className="mb-12">
                <div className="mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">New on Nexus</h2>
                  </div>
                </div>
                <div className="relative">
                  <div className="flex space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800 pb-4">
                    {Object.entries(characters)
                      .slice(-10) // Get the most recently added characters
                      .reverse()
                      .map(([slug, character]) => (
                        <div
                          key={slug}
                          className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer"
                          onClick={() => { incrementView(slug).catch(() => {}); navigate(`/character/${slug}`); }}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={character.image}
                              alt={character.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute top-3 right-3">
                              <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                                <Eye className="w-4 h-4" />
                                <span className="text-xs font-medium">{views[slug]?.toLocaleString() || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{character.name}</h3>
                            <p className="text-zinc-400 text-xs line-clamp-1">{character.role}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Thriller & Horror Characters */}
              <div className="mb-12">
                <div className="mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-red-800 flex items-center justify-center">
                      <Skull className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Thriller & Horror Characters</h2>
                  </div>
                </div>
                <div className="relative">
                  <div className="flex space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800 pb-4">
                    {Object.entries(characters)
                      .filter(([slug, character]) => 
                        character.tags && character.tags.some(tag => 
                          ['Horror', 'Thriller', 'Dark', 'Mystery', 'Scary', 'Creepy', 'Vampire', 'Demon', 'Dark Past', 'Vampire Hunter', 'Demon Slayer', 'Demon Butler', 'Sigma'].includes(tag)
                        ) ||
                        character.role && ['Vampire Hunter', 'Demon Slayer', 'Demon Butler', 'Vampire & Stand User', 'No-Life King'].includes(character.role) ||
                        ['spike-spiegel', 'alucard', 'tanjiro-kamado', 'nezuko-kamado', 'dio-brando', 'sebastian-michaelis', 'shinobu-kocho', 'alucard-hellsing', 'esdeath'].includes(slug)
                      )
                      .slice(0, 10)
                      .map(([slug, character]) => (
                        <div
                          key={slug}
                          className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer"
                          onClick={() => { incrementView(slug).catch(() => {}); navigate(`/character/${slug}`); }}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={character.image}
                              alt={character.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute top-3 right-3">
                              <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                                <Eye className="w-4 h-4" />
                                <span className="text-xs font-medium">{views[slug]?.toLocaleString() || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{character.name}</h3>
                            <p className="text-zinc-400 text-xs line-clamp-1">{character.role}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Supernatural Characters */}
              <div className="mb-12">
                <div className="mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-700 flex items-center justify-center">
                      <Ghost className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Supernatural Characters</h2>
                  </div>
                </div>
                <div className="relative">
                  <div className="flex space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800 pb-4">
                    {Object.entries(characters)
                      .filter(([slug, character]) => 
                        character.tags && character.tags.some(tag => 
                          ['Supernatural', 'Magic', 'Mystical', 'Paranormal', 'Spiritual', 'Psychic', 'Explosion Magic', 'Crimson Demon Clan', 'Spirit Medium', 'Shrine Maiden', 'Slime Demon Lord', 'Demon Queen VTuber', 'Succubus', 'Apprentice Witch'].includes(tag)
                        ) ||
                        character.role && ['Arch Wizard', 'Spirit Medium', 'Shrine Maiden & Spirit Medium', 'Slime Demon Lord', 'Demon Queen VTuber', 'Noblewoman & Witch Apprentice'].includes(character.role) ||
                        ['megumin', 'miyo-saimori', 'rimuru-tempest', 'ironmouse', 'veibae', 'farnese-de-vandimion'].includes(slug)
                      )
                      .slice(0, 10)
                      .map(([slug, character]) => (
                        <div
                          key={slug}
                          className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer"
                          onClick={() => { incrementView(slug).catch(() => {}); navigate(`/character/${slug}`); }}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={character.image}
                              alt={character.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute top-3 right-3">
                              <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                                <Eye className="w-4 h-4" />
                                <span className="text-xs font-medium">{views[slug]?.toLocaleString() || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{character.name}</h3>
                            <p className="text-zinc-400 text-xs line-clamp-1">{character.role}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Study Buddies */}
              <div className="mb-12">
                <div className="mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Study Buddies</h2>
                  </div>
                </div>
                <div className="relative">
                  <div className="flex space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800 pb-4">
                    {Object.entries(characters)
                      .filter(([slug, character]) => 
                        character.tags && character.tags.some(tag => 
                          ['Education', 'Study', 'Teacher', 'Academic', 'Learning', 'Tutor', 'Professor', 'Helper', 'Mathematics', 'Science', 'Research', 'Writing Coach', 'Student', 'Polyglot', 'Language Teacher'].includes(tag)
                        ) || 
                        character.role && (
                          character.role.toLowerCase().includes('teacher') ||
                          character.role.toLowerCase().includes('tutor') ||
                          character.role.toLowerCase().includes('professor') ||
                          character.role.toLowerCase().includes('academic') ||
                          character.role.toLowerCase().includes('educator') ||
                          character.role.toLowerCase().includes('mentor') ||
                          character.role.toLowerCase().includes('coach') ||
                          character.role.toLowerCase().includes('scientist') ||
                          character.role.toLowerCase().includes('scholar')
                        ) ||
                        ['professor-perspective', 'lingua-lumina', 'dr-thesis-thrive', 'math-maven', 'science-explorer', 'study-buddy', 'math-tutor', 'language-teacher', 'quantum-physics-teacher', 'statistics-tutor', 'astronomy-professor', 'professor-albrecht-stein', 'marie-lumiere', 'hypatia-solara', 'arya-vats', 'mansa-obasi', 'tesfaye-alem', 'fatima-al-razi'].includes(slug)
                      )
                      .slice(0, 10)
                      .map(([slug, character]) => (
                        <div
                          key={slug}
                          className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer"
                          onClick={() => { incrementView(slug).catch(() => {}); navigate(`/character/${slug}`); }}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={character.image}
                              alt={character.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute top-3 right-3">
                              <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                                <Eye className="w-4 h-4" />
                                <span className="text-xs font-medium">{views[slug]?.toLocaleString() || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{character.name}</h3>
                            <p className="text-zinc-400 text-xs line-clamp-1">{character.role}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Exciting Characters */}
              <div className="mb-12">
                <div className="mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Exciting Characters</h2>
                  </div>
                </div>
                <div className="relative">
                  <div className="flex space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800 pb-4">
                    {Object.entries(characters)
                      .filter(([slug, character]) => 
                        character.tags && character.tags.some(tag => 
                          ['Action', 'Adventure', 'Exciting', 'Dynamic', 'Energetic', 'Fun'].includes(tag)
                        ) ||
                        (characterLikes[slug]?.likeCount || 0) > 5 // Characters with high engagement
                      )
                      .slice(0, 10)
                      .map(([slug, character]) => (
                        <div
                          key={slug}
                          className="flex-shrink-0 w-40 sm:w-48 group cursor-pointer"
                          onClick={() => { incrementView(slug).catch(() => {}); navigate(`/character/${slug}`); }}
                        >
                          <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={character.image}
                              alt={character.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute top-3 right-3">
                              <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                                <Eye className="w-4 h-4" />
                                <span className="text-xs font-medium">{views[slug]?.toLocaleString() || 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">{character.name}</h3>
                            <p className="text-zinc-400 text-xs line-clamp-1">{character.role}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Endless feed of community characters */}
              <CharacterEndlessFeed
                characters={characters}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                characterLikes={characterLikes}
                handleLike={handleLike}
                likeLoading={likeLoading}
                title="All AI Characters"
                subtitle=""
              />
            </>
          )}
        </div>
      </main>

      {/* Search Overlay */}
      {showSearchOverlay && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 search-overlay-bg">
          <div className="w-[70%] max-w-6xl bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden">
            {/* Search Overlay Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-700">
              <div className="flex items-center space-x-4">
                <Search className="w-6 h-6 text-green-500" />
                <div>
                  <h2 className="text-xl font-bold text-white">Search Results</h2>
                  <p className="text-zinc-400 text-sm">
                    {Object.keys(filteredCharacters).length} characters found for "{searchQuery}"
                  </p>
                </div>
              </div>
                            <button
                onClick={() => {
                  setShowSearchOverlay(false);
                  setSearchQuery("");
                }}
                className="p-2 text-zinc-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
                            </button>
                          </div>

            {/* Search Results */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              {Object.keys(filteredCharacters).length > 0 ? (
                <div className="character-grid p-6">
                   {Object.entries(filteredCharacters).map(([slug, character]) => (
                    <div
                      key={slug}
                      onClick={() => { incrementView(slug).catch(() => {}); navigate(`/character/${slug}`); }}
                      className="character-card group hover:bg-zinc-800/60 cursor-pointer transition-all duration-300">
                      <div className="character-card__media">
                        <img
                          src={character.image}
                          alt={character.name}
                          loading="lazy"
                          onError={(e) => {
                            const t = e.currentTarget as HTMLImageElement;
                            t.onerror = null;
                            t.src = 'https://i.pinimg.com/736x/8d/45/d7/8d45d7182a790992f538de186944f79c.jpg';
                          }}
                        />
                        <div className="character-card__overlay" />
                        <div className="character-card__actions">
                          <div className="character-card__content">
                            <h3 className="character-card__title">{character.name}</h3>
                            <p className="text-green-500 text-xs mb-1">{character.role}</p>
                            <div className="character-card__stats">
                              <span>{views[slug]?.toLocaleString() || 0} views</span>
                              <span>{pluralizeLikes(characterLikes[slug]?.likeCount || 0)}</span>
                            </div>
                          </div>
                        </div>
                        {/* Footer removed per design update */}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Search className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">
                    No characters found
                  </h3>
                  <p className="text-zinc-400 mb-6">
                    Try adjusting your search terms or browse our categories
                  </p>
                  <button
                    onClick={() => {
                      setShowSearchOverlay(false);
                      setSearchQuery("");
                    }}
                    className={`px-6 py-3 rounded-lg transition-all font-medium ${
                      incognitoMode 
                        ? "bg-orange-500 hover:bg-orange-500/90 text-white" 
                        : "bg-green-500 hover:bg-green-500/90 text-zinc-900"
                    }`}>
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trending View Overlay */}
      {showTrendingView && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 trending-overlay-bg">
          <div className="w-[90%] max-w-7xl bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden">
            {/* Trending View Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-700">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Trending Now</h2>
                  <p className="text-zinc-400">Characters everyone's talking about</p>
                </div>
              </div>
              <button
                onClick={() => setShowTrendingView(false)}
                className="p-2 text-zinc-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Trending Characters Grid */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                  {Object.entries(characters)
                  .filter(([slug]) => (categoryCharacters.trendingSlugs || []).includes(slug))
                    .map(([slug, character]) => (
                      <div
                        key={slug}
                      onClick={() => { incrementView(slug).catch(() => {}); navigate(`/chat/${slug}`); }}
                      className="group bg-gradient-to-br from-red-900/30 to-green-900/30 rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg">
                      <div className="relative aspect-[2/3]">
                          <img
                            src={character.image}
                            alt={character.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                        
                        {/* Trending Badge */}
                        <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                          <Zap className="w-3 h-3 mr-1" />
                          TRENDING
                          </div>

                        {/* View Count */}
                        <div className="absolute top-3 right-3 z-10">
                          <div className="flex items-center gap-1 bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-sm">
                            <Eye className="w-4 h-4" />
                            <span className="text-xs font-medium">{views[slug]?.toLocaleString() || 0}</span>
                          </div>
                        </div>

                        {/* Character Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white text-lg font-bold mb-1">{character.name}</h3>
                          <p className="text-green-500 text-sm">{character.role}</p>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-zinc-400 text-sm line-clamp-2 mb-3">
                          {character.description}
                        </p>
                        {character.tags && character.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {character.tags.slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-zinc-700/80 text-xs text-zinc-300 rounded-full">
                                {tag}
                              </span>
                    ))}
                </div>
                        )}
              </div>
        </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trending Page Modal */}
      <CharacterLeaderboard
        characters={characters}
        isOpen={showFullLeaderboard}
        onClose={() => setShowFullLeaderboard(false)}
      />

      {/* Desktop Filter Modal - Bottom Drawer */}
      {isDesktop && filtersExpanded && !showFavorites && (
        <div className={`fixed inset-0 z-[220]`} aria-hidden={!filtersExpanded}>
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity opacity-100`}
            onClick={() => setFiltersExpanded(false)}
          />
          <div className={`absolute left-0 right-0 bottom-0 ${sideMenuBg} border-t ${borderColor} rounded-t-2xl shadow-2xl p-6 max-h-[70vh] overflow-y-auto`}
               role="dialog" aria-label="Desktop filter options">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-zinc-200">
                <Filter className="w-5 h-5" />
                <span className="font-medium text-lg">Filters</span>
              </div>
              <button
                onClick={() => setFiltersExpanded(false)}
                className={`p-2 rounded-lg hover:bg-zinc-700/50 transition-colors text-zinc-400 hover:text-white`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Search tags..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className={`w-full mb-4 px-4 py-2 rounded-lg bg-black border ${borderColor} text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-gold`}
              aria-label="Search filter tags"
            />
            <div className="flex flex-col space-y-2">
              {popularTags
                .filter((tag) =>
                  tag.toLowerCase().includes(tagSearch.toLowerCase())
                )
                .map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-700/30 transition-colors">
                    <label className="flex items-center space-x-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className={`w-4 h-4 ${accentText} bg-black border ${borderColor} rounded focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-gold`}
                        aria-label={`Filter by ${tag}`}
                      />
                      <span className="text-white text-sm">
                        {tag} ({tagCounts[tag] || 0})
                      </span>
                    </label>
                    {selectedTags.includes(tag) && (
                      <button
                        onClick={() => toggleTag(tag)}
                        className={`${accentText} hover:${incognitoMode ? "text-orange-400" : "text-green-500"} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-gold rounded p-1`}
                        aria-label={`Remove ${tag} filter`}>
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}


      {/* Mobile Filters Bottom Sheet */}
      {isMobile && mobileFilterOpen && !showFavorites && (
        <div className={`fixed inset-0 z-[220]`} aria-hidden={!mobileFilterOpen}>
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity opacity-100`}
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className={`absolute left-0 right-0 bottom-0 ${sideMenuBg} border-t ${borderColor} rounded-t-2xl shadow-2xl p-4 max-h-[70vh] overflow-y-auto`}
               role="dialog" aria-label="Mobile filter options">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-zinc-200">
                <Filter className="w-5 h-5" />
                <span className="font-medium">Filters</span>
              </div>
              <button onClick={() => setMobileFilterOpen(false)} className="p-2 text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Search tags..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className={`w-full mb-3 px-3 py-2 rounded-lg bg-black border ${borderColor} text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-gold`}
              aria-label="Search filter tags"
            />
            <div className="flex flex-col space-y-2">
              {popularTags
                .filter((tag) => tag.toLowerCase().includes(tagSearch.toLowerCase()))
                .map((tag) => (
                  <div key={tag} className="flex items-center justify-between">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className={`w-5 h-5 ${accentText} bg-black border ${borderColor} rounded focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-gold`}
                        aria-label={`Filter by ${tag}`}
                      />
                      <span className="text-white text-sm">{tag} ({tagCounts[tag] || 0})</span>
                    </label>
                    {selectedTags.includes(tag) && (
                      <button
                        onClick={() => toggleTag(tag)}
                        className={`${accentText} hover:${incognitoMode ? "text-orange-400" : "text-green-500"} rounded`}
                        aria-label={`Remove ${tag} filter`}>
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor's Choice Reels Modal */}
      <EditorChoiceReels
        isOpen={showEditorChoice}
        onClose={() => setShowEditorChoice(false)}
        characters={editorChoiceCharacters}
      />
      
      {/* Registration Expired Modal - Shows when guest session expires */}
      <RegistrationExpiredModal
        isOpen={isExpired && isGuest && !userLoggedin}
        timeRemaining={timeRemaining ? formatTimeRemaining(timeRemaining) : undefined}
      />
    </div>
  );
}

export default AiChat;
