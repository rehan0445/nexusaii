import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, Trophy, List, ChevronUp, ChevronDown, MessageCircle, AlertTriangle, Eye } from 'lucide-react';
import { apiFetch, formatTimeAgo } from '../lib/utils';

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
}

interface ConfessionFeedProps {
  activeView: 'all' | 'trending' | 'fresh' | 'top';
  onConfessionClick?: (confession: Confession) => void;
}

export function ConfessionFeed({ activeView, onConfessionClick }: ConfessionFeedProps) {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track which NSFW confessions have been revealed by the user
  const [revealedContent, setRevealedContent] = useState<{ [key: string]: boolean }>({});

  // Function to reveal sensitive content for a specific confession
  const revealSensitiveContent = (confessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    setRevealedContent(prev => ({
      ...prev,
      [confessionId]: true
    }));
  };

  // Get session ID for voting
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

  // Handle voting
  const handleVote = async (confessionId: string, direction: 1 | -1, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
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

    // Optimistic update - fire and forget
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

  // View configuration
  const viewConfig = {
    all: {
      title: 'All Confessions',
      subtitle: '',
      icon: List,
      endpoint: '/api/confessions/all'
    },
    trending: {
      title: '🔥 Trending Now',
      subtitle: 'Hot confessions with high engagement',
      icon: TrendingUp,
      endpoint: '/api/confessions/trending'
    },
    fresh: {
      title: '✨ Fresh Drops',
      subtitle: 'New confessions from the last 24h',
      icon: Sparkles,
      endpoint: '/api/confessions/fresh'
    },
    top: {
      title: '🏆 Top Rated',
      subtitle: 'All-time most upvoted confessions',
      icon: Trophy,
      endpoint: '/api/confessions/top'
    }
  };

  const currentConfig = viewConfig[activeView];

  // Fetch confessions when view changes
  useEffect(() => {
    const fetchConfessions = async () => {
      setLoading(true);
      setError(null);

      try {
        const sessionId = getSessionId();
        // All, trending (most liked), top (most liked): request all confessions in storage (up to 2000)
        const limit = (activeView === 'all' || activeView === 'trending' || activeView === 'top') ? 2000 : 20;
        const response = await apiFetch(`${getServerUrl()}${currentConfig.endpoint}?limit=${limit}&sessionId=${sessionId}`);
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          console.log(`[ConfessionFeed] ✅ Received ${result.data.length} confessions for ${activeView}`);
          
          // Verify IDs are present (check all possible ID field names)
          const confessionsWithIds = result.data.filter((c: Confession) => c.id || c.confession_id || c._id);
          const confessionsWithoutIds = result.data.filter((c: Confession) => !c.id && !c.confession_id && !c._id);
          
          if (confessionsWithoutIds.length > 0) {
            console.warn(`[ConfessionFeed] ⚠️  ${confessionsWithoutIds.length} confessions missing ID:`, confessionsWithoutIds);
            console.warn(`[ConfessionFeed] Sample missing ID confession keys:`, confessionsWithoutIds[0] ? Object.keys(confessionsWithoutIds[0]) : 'N/A');
          }
          
          if (confessionsWithIds.length > 0) {
            const sample = confessionsWithIds[0];
            const sampleId = sample.id || sample.confession_id || sample._id;
            console.log(`[ConfessionFeed] Sample confession ID:`, sampleId);
            console.log(`[ConfessionFeed] Sample confession ID field used:`, 
              sample.id ? 'id' : sample.confession_id ? 'confession_id' : '_id'
            );
          }
          
          setConfessions(result.data);
        } else {
          console.error(`[ConfessionFeed] ❌ Invalid response format:`, result);
          setError('Failed to load confessions');
          setConfessions([]);
        }
      } catch (err) {
        console.error(`Error fetching ${activeView} confessions:`, err);
        setError('Failed to load confessions. Please try again.');
        setConfessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConfessions();
  }, [activeView, currentConfig.endpoint]);

  // Skeleton loader component
  const SkeletonCard = () => (
    <div className="bg-zinc-800 border border-[#22c55e]/20 rounded-lg p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-zinc-700" />
        <div className="flex-1">
          <div className="h-3 bg-zinc-700 rounded w-20 mb-1" />
          <div className="h-2 bg-zinc-700 rounded w-28" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-zinc-700 rounded w-full" />
        <div className="h-4 bg-zinc-700 rounded w-5/6" />
        <div className="h-4 bg-zinc-700 rounded w-4/6" />
      </div>
      <div className="flex items-center gap-4 mt-4">
        <div className="h-6 bg-zinc-700 rounded-full w-20" />
        <div className="h-6 bg-zinc-700 rounded w-16" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">{currentConfig.title}</h2>
          {currentConfig.subtitle && <p className="text-sm text-zinc-400">{currentConfig.subtitle}</p>}
        </div>

        {/* Skeleton Loaders */}
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">{currentConfig.title}</h2>
          {currentConfig.subtitle && <p className="text-sm text-zinc-400">{currentConfig.subtitle}</p>}
        </div>

        {/* Error State */}
        <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-6 text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={() => globalThis.location.reload()}
            className="text-sm text-red-400 hover:text-red-300 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (confessions.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">{currentConfig.title}</h2>
          {currentConfig.subtitle && <p className="text-sm text-zinc-400">{currentConfig.subtitle}</p>}
        </div>

        {/* Empty State */}
        <div className="bg-zinc-800 border border-[#22c55e]/20 rounded-lg p-12 text-center">
          <currentConfig.icon className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-400">No confessions found in this view.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">{currentConfig.title}</h2>
        {currentConfig.subtitle && <p className="text-sm text-zinc-400">{currentConfig.subtitle}</p>}
      </div>

      {/* Confessions List */}
      <div className="space-y-6">
        {confessions.map((confession) => {
          // Normalize ID - check multiple possible field names
          const validId = confession.id || confession.confession_id || confession._id || null;
          
          const handleClick = () => {
            console.log('[ConfessionFeed] Card clicked. Raw Data:', confession);
            console.log('[ConfessionFeed] Resolved ID:', validId);
            console.log('[ConfessionFeed] ID sources:', {
              'confession.id': confession.id,
              'confession.confession_id': confession.confession_id,
              'confession._id': confession._id,
              'validId': validId
            });
            
            if (!validId) {
              console.error('[ConfessionFeed] ❌ Confession ID is missing! Cannot navigate.', {
                confession,
                allKeys: Object.keys(confession)
              });
              return;
            }
            
            console.log(`[ConfessionFeed] ✅ Navigating to confession detail: ${validId}`);
            onConfessionClick?.({ ...confession, id: validId });
          };

          // Visual indicator for missing ID
          const hasValidId = !!validId;
          const cardKey = validId || `confession-${confessions.indexOf(confession)}`;

          const userVote = confession.userVote || 0;
          const confessionId = validId || '';

          return (
          <div
            key={cardKey}
            onClick={handleClick}
            className={`bg-zinc-800 border border-[#22c55e]/20 rounded-lg p-6 transition-all duration-200 ${
              !hasValidId
                ? 'border-red-500/60 bg-red-950/10 cursor-not-allowed opacity-60'
                : 'cursor-pointer hover:border-[#22c55e]/40 hover:bg-zinc-700/50'
            } ${
              confession.isExplicit ? 'border-red-500/40 bg-red-950/5' : ''
            }`}
          >
            {/* Missing ID Warning */}
            {!hasValidId && (
              <div className="mb-3 p-2 bg-red-950/20 border border-red-900/40 rounded-md">
                <p className="text-red-400 text-xs font-medium">
                  ⚠️ Warning: This confession is missing an ID and cannot be opened.
                </p>
              </div>
            )}

            {/* Meta/Header - Username, timestamp, NSFW badge */}
            <div className="flex items-center gap-3 mb-4">
              {confession.alias?.imageUrl ? (
                <img
                  src={confession.alias.imageUrl}
                  alt="Author avatar"
                  className="w-8 h-8 rounded-full object-cover border border-[#22c55e]/30"
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${
                    confession.alias?.color || 'from-zinc-500 to-zinc-600'
                  } flex items-center justify-center text-white text-sm font-bold border border-[#22c55e]/30`}
                >
                  {confession.alias?.emoji || '👤'}
                </div>
              )}
              <div className="flex-1 min-w-0 flex items-center gap-1">
                <div className="text-base text-white font-semibold truncate">
                  {confession.alias?.name || 'Anonymous'}
                </div>
                {/* NSFW Badge - Always visible for explicit content */}
                {confession.isExplicit && (
                  <span className="px-1.5 py-0.5 bg-red-600/90 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                    NSFW
                  </span>
                )}
                <span className="text-xs text-zinc-500">·</span>
                <div className="text-xs text-zinc-500 font-normal">
                  {formatTimeAgo(confession.createdAt)}
                </div>
              </div>
            </div>

            {/* Body Content - With blur effect for NSFW content */}
            <div className="relative">
              <div className={`text-base text-zinc-100 leading-relaxed mb-4 whitespace-pre-wrap break-words line-clamp-4 transition-all duration-300 ${
                confession.isExplicit && !revealedContent[confessionId] ? 'blur-lg select-none' : ''
              }`}>
                {confession.content}
              </div>
              
              {/* Sensitive Content Overlay - Compact, contained within card */}
              {confession.isExplicit && !revealedContent[confessionId] && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-center px-3 py-2 bg-black/90 rounded-lg border border-red-500/40 shadow-lg">
                    <div className="flex items-center justify-center gap-2 mb-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-white font-medium text-sm">Sensitive Content</span>
                    </div>
                    <button
                      onClick={(e) => revealSensitiveContent(confessionId, e)}
                      className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                    >
                      IDGAF
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar - Reddit Style (hidden for unrevealed NSFW content) */}
            {(!confession.isExplicit || revealedContent[confessionId]) && (
              <div className="flex items-center gap-4 pt-4 border-t border-[#22c55e]/20">
                {/* Voting Pill */}
                <div 
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Upvote Button */}
                  <button
                    onClick={(e) => handleVote(confessionId, 1, e)}
                    className={`p-1 rounded-full transition-all duration-200 flex items-center ${
                      userVote === 1
                        ? 'text-[#22c55e] hover:text-[#22c55e]/80'
                        : 'text-zinc-400 hover:text-[#22c55e]'
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
                      ? 'text-[#22c55e]' 
                      : userVote === -1
                      ? 'text-red-400'
                      : 'text-zinc-300'
                  }`}>
                    {confession.score || 0}
                  </span>
                  
                  {/* Downvote Button */}
                  <button
                    onClick={(e) => handleVote(confessionId, -1, e)}
                    className={`p-1 rounded-full transition-all duration-200 flex items-center ${
                      userVote === -1
                        ? 'text-red-400 hover:text-red-400/80'
                        : 'text-zinc-400 hover:text-red-400'
                    }`}
                    title="Downvote"
                  >
                    <ChevronDown 
                      className="w-4 h-4" 
                      strokeWidth={userVote === -1 ? 2.5 : 2}
                    />
                  </button>
                </div>

                {/* Comment Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  className="flex items-center gap-1 text-sm text-zinc-400 hover:text-[#22c55e] transition-colors"
                  title="Comments"
                >
                  <MessageCircle className="w-4 h-4" strokeWidth={2} />
                  <span>{confession.replies || 0}</span>
                </button>
                
                {/* View Count */}
                <div className="flex items-center gap-1 text-sm text-zinc-500" title="Views">
                  <Eye className="w-4 h-4" strokeWidth={2} />
                  <span>{confession.viewCount || 0}</span>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
}

