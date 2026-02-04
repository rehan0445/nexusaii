import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Eye, MoreVertical, ChevronUp, ChevronDown, Flag, Bookmark, Search } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch, formatTimeAgo } from '../lib/utils';
import { useBookmarks } from '../contexts/BookmarksContext';
import { ReportModal } from './ReportModal';
import { CommunityMilestone } from './CommunityMilestone';

// Scroll position storage key
const SCROLL_POSITION_KEY = 'phoenix_confession_feed_scroll';
const CLICKED_CONFESSION_KEY = 'phoenix_confession_feed_clicked_id';

// Get the server URL for API calls
const getServerUrl = () => {
  return import.meta.env.VITE_SERVER_URL || globalThis.location.origin;
};

interface Confession {
  id?: string;
  confession_id?: string;
  _id?: string;
  content: string;
  alias: any;
  sessionId?: string;
  campus?: string;
  createdAt: string;
  score: number;
  replies: number;
  reactions?: Record<string, any>;
  poll?: any;
  isExplicit?: boolean;
  engagementScore?: number;
  userVote?: -1 | 0 | 1;
  viewCount?: number;
  userName?: string | null;
}

interface PhoenixConfessionFeedProps {
  onConfessionClick?: (confession: Confession) => void;
}

type FilterType = 'most-liked' | 'most-viewed' | 'newest' | 'default';

// Get display name from confession (username or alias)
const getDisplayName = (confession: Confession): string => {
  // If userName exists, show "by [username]"
  if (confession.userName) {
    return `by ${confession.userName}`;
  }
  // If alias exists, show "by [alias]"
  if (confession.alias?.name) {
    return `by ${confession.alias.name}`;
  }
  // Fallback to time-based label if no alias or username
  const date = new Date(confession.createdAt);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `Someone at ${displayHours}:${displayMinutes} ${ampm}`;
};

export function PhoenixConfessionFeed({ onConfessionClick }: PhoenixConfessionFeedProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('default');
  const [revealedContent, setRevealedContent] = useState<{ [key: string]: boolean }>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingConfessionId, setReportingConfessionId] = useState<string | null>(null);
  const confessionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollRestoredRef = useRef(false);

  // Close menu when clicking outside
  useEffect(() => {
    if (!openMenuId) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is outside menu (not on menu button or menu itself)
      if (!target.closest('[data-menu-id]') && !target.closest('[data-menu]')) {
        setOpenMenuId(null);
      }
    };
    
    // Small delay to prevent immediate close when opening
    const timeout = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
    
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);


  const getSessionId = () => {
    const SESSION_KEY = 'confession_session_id';
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try {
        localStorage.setItem(SESSION_KEY, sessionId);
      } catch {}
    }
    return sessionId;
  };

  const handleVote = async (confessionId: string, direction: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setConfessions(prevConfessions => prevConfessions.map(confession => {
      if ((confession.id || confession.confession_id || confession._id) !== confessionId) {
        return confession;
      }

      const currentVote = confession.userVote || 0;
      const nextVote = direction === 1 
        ? (currentVote === 1 ? 0 : 1) 
        : (currentVote === -1 ? 0 : -1);
      const scoreDelta = nextVote - currentVote;

      return {
        ...confession,
        userVote: nextVote,
        score: Math.max(0, (confession.score || 0) + scoreDelta)
      };
    }));

    try {
      const sessionId = getSessionId();
      await fetch(`${getServerUrl()}/api/confessions/${confessionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction, sessionId })
      });
    } catch (err) {
      if (import.meta.env.DEV) console.warn('Vote API failed', err);
    }
  };

  const filterConfig = {
    'most-liked': {
      label: 'Most Liked',
      endpoint: '/api/confessions/trending'
    },
    'most-viewed': {
      label: 'Most Viewed',
      endpoint: '/api/confessions/all' // TODO: Add most-viewed endpoint
    },
    'newest': {
      label: 'Newest',
      endpoint: '/api/confessions/fresh'
    },
    'default': {
      label: 'Default',
      endpoint: '/api/confessions/all'
    }
  };

  useEffect(() => {
    const fetchConfessions = async () => {
      setLoading(true);
      setError(null);
      scrollRestoredRef.current = false; // Reset scroll restoration flag when fetching new data

      try {
        const sessionId = getSessionId();
        const config = filterConfig[activeFilter];
        // Default, most liked, most viewed: request all confessions in storage (up to 2000)
        const limit = (activeFilter === 'default' || activeFilter === 'most-viewed' || activeFilter === 'most-liked') ? 2000 : 20;
        const response = await apiFetch(`${getServerUrl()}${config.endpoint}?limit=${limit}&sessionId=${sessionId}`);
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          // Sort by filter type
          let sorted = [...result.data];
          if (activeFilter === 'most-liked') {
            sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
          } else if (activeFilter === 'most-viewed') {
            sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
          } else if (activeFilter === 'newest') {
            sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
          
          setConfessions(sorted);
        } else {
          setError('Failed to load confessions');
          setConfessions([]);
        }
      } catch (err) {
        console.error(`Error fetching confessions:`, err);
        setError('Failed to load confessions. Please try again.');
        setConfessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConfessions();
  }, [activeFilter]);

  // Restore scroll position when returning to feed (after data loads)
  useEffect(() => {
    // Only restore if we're on the feed route and not loading
    if (!loading && confessions.length > 0 && location.pathname === '/campus/general/confessions') {
      // Small delay to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        restoreScrollPosition();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, confessions.length, location.pathname]);

  // Save scroll position before navigation
  const saveScrollPosition = (clickedConfessionId?: string) => {
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
    try {
      sessionStorage.setItem(SCROLL_POSITION_KEY, scrollY.toString());
      if (clickedConfessionId) {
        sessionStorage.setItem(CLICKED_CONFESSION_KEY, clickedConfessionId);
      }
    } catch (e) {
      // Ignore storage errors
    }
  };

  // Restore scroll position after data loads
  const restoreScrollPosition = () => {
    if (scrollRestoredRef.current) return;
    
    try {
      const savedScroll = sessionStorage.getItem(SCROLL_POSITION_KEY);
      const clickedId = sessionStorage.getItem(CLICKED_CONFESSION_KEY);
      
      if (clickedId && confessionRefs.current[clickedId]) {
        // Scroll to the specific confession that was clicked
        setTimeout(() => {
          const element = confessionRefs.current[clickedId];
          if (element) {
            element.scrollIntoView({ behavior: 'auto', block: 'center' });
            scrollRestoredRef.current = true;
            // Clean up after restoration
            sessionStorage.removeItem(SCROLL_POSITION_KEY);
            sessionStorage.removeItem(CLICKED_CONFESSION_KEY);
            return;
          }
        }, 100);
      } else if (savedScroll) {
        // Fallback to saved scroll position
        const scrollY = Number.parseInt(savedScroll, 10);
        if (!Number.isNaN(scrollY)) {
          setTimeout(() => {
            window.scrollTo({ top: scrollY, behavior: 'auto' });
            scrollRestoredRef.current = true;
            sessionStorage.removeItem(SCROLL_POSITION_KEY);
            sessionStorage.removeItem(CLICKED_CONFESSION_KEY);
          }, 100);
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  };

  const handleCommentClick = (confession: Confession, e: React.MouseEvent) => {
    e.stopPropagation();
    const confessionId = confession.id || confession.confession_id || confession._id;
    if (confessionId) {
      saveScrollPosition(confessionId);
      navigate(`/campus/general/confessions/${confessionId}`);
    }
  };

  const handleReport = (confessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setReportingConfessionId(confessionId);
    setShowReportModal(true);
  };

  const handleReportSubmit = async (reason: string) => {
    if (!reportingConfessionId) return;
    
    try {
      // TODO: Send report to backend API
      console.log('Reporting confession:', reportingConfessionId, 'Reason:', reason);
      // await apiFetch(`${getServerUrl()}/api/confessions/${reportingConfessionId}/report`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ reason })
      // });
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  };

  // Helper to count lines in text
  const countLines = (text: string): number => {
    if (!text) return 0;
    return text.split('\n').length;
  };

  // Helper to get first N lines
  const getFirstNLines = (text: string, n: number): string => {
    if (!text) return '';
    const lines = text.split('\n');
    return lines.slice(0, n).join('\n');
  };

  // Check if confession should show "Read more" (navigates to detail page; no in-feed expand state)
  const shouldShowReadMore = (content: string): boolean => {
    const lines = countLines(content);
    return lines > 5;
  };

  const handleReadMore = (confession: Confession, e: React.MouseEvent) => {
    e.stopPropagation();
    const confessionId = confession.id || confession.confession_id || confession._id;
    if (confessionId) {
      saveScrollPosition(confessionId);
      navigate(`/campus/general/confessions/${confessionId}`);
    }
  };

  const { toggleConfessionBookmark, isConfessionBookmarked } = useBookmarks();

  const handleBookmark = (confessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    toggleConfessionBookmark(confessionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#0A0A0A] border-b border-white/10 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold tracking-tight select-none">
              <span className="text-white">Nexus</span><span className="text-[#A855F7]">chat.in</span>
            </h1>
          </div>
        </header>

        {/* Filter Tabs Skeleton */}
        <div className="max-w-7xl mx-auto px-4 py-4 flex gap-2">
          {['Most Liked', 'Most Viewed', 'Newest', 'Default'].map((label) => (
            <div key={label} className="h-8 w-24 bg-[#1A1A1A] rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Cards Skeleton - Centered */}
        <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 py-6 space-y-4 pb-24">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-[#2A2A2A] rounded w-32 mb-4" />
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-[#2A2A2A] rounded w-full" />
                <div className="h-4 bg-[#2A2A2A] rounded w-5/6" />
              </div>
              <div className="flex gap-4">
                <div className="h-4 bg-[#2A2A2A] rounded w-16" />
                <div className="h-4 bg-[#2A2A2A] rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter confessions by search query
  const filteredConfessions = confessions.filter(confession => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return confession.content.toLowerCase().includes(query) ||
           getDisplayName(confession).toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Header - Left aligned with Search button */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-left tracking-tight select-none">
            <span className="text-white">Nexus</span><span className="text-[#A855F7]">chat.in</span>
          </h1>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
              showSearch
                ? 'bg-[#A855F7]/20 text-[#A855F7]'
                : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </header>

      {/* Community Milestone - between top bar and filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <CommunityMilestone />
      </div>

      {/* Search Bar - Shown when search button is clicked */}
      {showSearch && (
        <div className="max-w-7xl mx-auto px-4 py-4 border-b border-white/10 bg-[#0A0A0A]/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search confessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/50"
            />
          </div>
        </div>
      )}

      {/* Filter Tabs - Left aligned */}
      <div className="max-w-7xl mx-auto px-4 py-4 border-b border-white/10">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {(Object.keys(filterConfig) as FilterType[]).map((filter) => {
            const config = filterConfig[filter];
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#A855F7]/20 text-[#A855F7] border-b-2 border-[#A855F7]'
                    : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportingConfessionId(null);
        }}
        onSubmit={handleReportSubmit}
        confessionId={reportingConfessionId || ''}
      />

      {/* Confession Cards - stretch on desktop (lg), centered on mobile */}
      <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 py-6 space-y-4 pb-24">
        {error && (
          <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {filteredConfessions.length === 0 && !loading && (
          <div className="bg-[#1A1A1A] rounded-xl p-12 text-center">
            <p className="text-[#A1A1AA]">
              {searchQuery ? 'No confessions match your search.' : 'No confessions found.'}
            </p>
          </div>
        )}

        {filteredConfessions.map((confession) => {
          const validId = confession.id || confession.confession_id || confession._id || '';
          const confessionId = validId || `confession-${confessions.indexOf(confession)}`;
          const displayName = getDisplayName(confession);
          const userVote = confession.userVote || 0;
          const isMenuOpen = openMenuId === confessionId;

          return (
            <div
              key={confessionId}
              ref={(el) => {
                if (el) {
                  confessionRefs.current[confessionId] = el;
                }
              }}
              className="bg-[#1A1A1A] rounded-xl p-6 transition-all duration-200 border border-white/5 hover:border-white/10 relative"
            >
              {/* Username/Alias Label */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-[#A1A1AA]">{displayName}</span>
                <div className="relative">
                  <button
                    data-menu-id={confessionId}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : confessionId);
                    }}
                    className="text-[#A1A1AA] hover:text-white p-1 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {/* Three-dot Menu */}
                  {isMenuOpen && (
                    <div 
                      data-menu={confessionId}
                      className="absolute right-0 top-8 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-lg z-50 min-w-[120px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleReport(confessionId, e)}
                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#1A1A1A] flex items-center gap-2 transition-colors"
                      >
                        <Flag className="w-4 h-4" />
                        Report
                      </button>
                      <button
                        onClick={(e) => handleBookmark(confessionId, e)}
                        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-[#1A1A1A] flex items-center gap-2 transition-colors"
                      >
                        <Bookmark className={`w-4 h-4 ${isConfessionBookmarked(confessionId) ? 'fill-[#A855F7] text-[#A855F7]' : ''}`} />
                        {isConfessionBookmarked(confessionId) ? 'Saved' : 'Bookmark'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Confession Content - Serif font for emotional depth */}
              <div className="mb-4 relative">
                {confession.isExplicit && !revealedContent[confessionId] ? (
                  <div 
                    className="relative rounded-xl overflow-hidden cursor-pointer bg-[#1A1A1A] p-4 min-h-[120px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveScrollPosition(confessionId);
                      navigate(`/campus/general/confessions/${confessionId}`);
                    }}
                  >
                    {/* EXPLICIT Badge - Top Left */}
                    <div className="absolute top-2 left-2 bg-red-900/90 border-2 border-red-700 px-2 py-1 rounded text-red-200 text-xs font-bold uppercase tracking-wider z-20">
                      EXPLICIT
                    </div>
                    
                    {/* Content - Show first 3 lines, blur entire area */}
                    <div className="relative blur-sm">
                      <p className="text-base leading-relaxed text-white font-serif whitespace-pre-wrap break-words">
                        {getFirstNLines(confession.content, 3)}
                        {confession.content.split('\n').length > 3 && '...'}
                      </p>
                    </div>
                    
                    {/* Tap to view overlay - centered */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
                      <span className="text-white font-medium text-sm bg-black/70 px-4 py-2 rounded-lg border border-white/20">
                        Tap to view
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {shouldShowReadMore(confession.content) ? (
                      <>
                        <p className="text-base leading-relaxed text-white font-serif whitespace-pre-wrap break-words">
                          {getFirstNLines(confession.content, 5)}
                        </p>
                        <button
                          onClick={(e) => handleReadMore(confession, e)}
                          className="mt-2 text-[#A855F7] hover:text-[#9333EA] text-sm font-medium transition-colors"
                        >
                          Read more
                        </button>
                      </>
                    ) : (
                      <p className="text-base leading-relaxed text-white font-serif whitespace-pre-wrap break-words">
                        {confession.content}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Action Bar - Upvote/Downvote and Comments */}
              <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                {/* Voting Pill - Upvote/Downvote */}
                <div 
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Upvote Button */}
                  <button
                    onClick={(e) => handleVote(confessionId, 1, e)}
                    className={`p-1 rounded-full transition-all duration-200 flex items-center ${
                      userVote === 1
                        ? 'text-[#A855F7] hover:text-[#A855F7]/80'
                        : 'text-[#A1A1AA] hover:text-[#A855F7]'
                    }`}
                    title="Upvote"
                  >
                    <ChevronUp 
                      className="w-4 h-4" 
                      strokeWidth={userVote === 1 ? 2.5 : 2}
                    />
                  </button>
                  
                  {/* Vote Count */}
                  <span className={`text-sm font-medium px-1 min-w-[2rem] text-center ${
                    userVote === 1 
                      ? 'text-[#A855F7]' 
                      : userVote === -1
                      ? 'text-red-400'
                      : 'text-[#A1A1AA]'
                  }`}>
                    {confession.score || 0}
                  </span>
                  
                  {/* Downvote Button */}
                  <button
                    onClick={(e) => handleVote(confessionId, -1, e)}
                    className={`p-1 rounded-full transition-all duration-200 flex items-center ${
                      userVote === -1
                        ? 'text-red-400 hover:text-red-400/80'
                        : 'text-[#A1A1AA] hover:text-red-400'
                    }`}
                    title="Downvote"
                  >
                    <ChevronDown 
                      className="w-4 h-4" 
                      strokeWidth={userVote === -1 ? 2.5 : 2}
                    />
                  </button>
                </div>

                {/* Comment Button - Navigate to detail page */}
                <button
                  onClick={(e) => handleCommentClick(confession, e)}
                  className="flex items-center gap-1.5 text-sm text-[#A1A1AA] hover:text-[#A855F7] transition-colors"
                  title="Comments"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{confession.replies || 0}</span>
                </button>
                
                {/* View Count */}
                <div className="flex items-center gap-1.5 text-sm text-[#A1A1AA]" title="Views">
                  <Eye className="w-4 h-4" />
                  <span>{confession.viewCount || 0}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
