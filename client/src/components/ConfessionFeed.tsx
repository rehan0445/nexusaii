import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles, Trophy, List } from 'lucide-react';
import { apiFetch } from '../lib/utils';

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
}

interface ConfessionFeedProps {
  activeView: 'all' | 'trending' | 'fresh' | 'top';
  onConfessionClick?: (confession: Confession) => void;
}

export function ConfessionFeed({ activeView, onConfessionClick }: ConfessionFeedProps) {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View configuration
  const viewConfig = {
    all: {
      title: '📋 All Confessions',
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
        const response = await apiFetch(`${getServerUrl()}${currentConfig.endpoint}?limit=20`);
        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          console.log(`[ConfessionFeed] ✅ Received ${result.data.length} confessions for ${activeView}`);
          
          // Verify IDs are present (check all possible ID field names)
          const confessionsWithIds = result.data.filter(c => c.id || c.confession_id || c._id);
          const confessionsWithoutIds = result.data.filter(c => !c.id && !c.confession_id && !c._id);
          
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
    <div className="bg-black/40 border border-softgold-500/20 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-softgold-500/20" />
        <div className="flex-1">
          <div className="h-4 bg-softgold-500/20 rounded w-24 mb-2" />
          <div className="h-3 bg-softgold-500/10 rounded w-32" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-softgold-500/20 rounded w-full" />
        <div className="h-4 bg-softgold-500/20 rounded w-5/6" />
        <div className="h-4 bg-softgold-500/20 rounded w-4/6" />
      </div>
      <div className="flex items-center gap-4 mt-4">
        <div className="h-4 bg-softgold-500/20 rounded w-16" />
        <div className="h-4 bg-softgold-500/20 rounded w-16" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-softgold-500/20 text-softgold-400">
            <currentConfig.icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{currentConfig.title}</h2>
            {currentConfig.subtitle && <p className="text-sm text-zinc-400">{currentConfig.subtitle}</p>}
          </div>
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-softgold-500/20 text-softgold-400">
            <currentConfig.icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{currentConfig.title}</h2>
            {currentConfig.subtitle && <p className="text-sm text-zinc-400">{currentConfig.subtitle}</p>}
          </div>
        </div>

        {/* Error State */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={() => globalThis.location.reload()}
            className="text-sm text-softgold-400 hover:text-softgold-300 underline"
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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-softgold-500/20 text-softgold-400">
            <currentConfig.icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{currentConfig.title}</h2>
            {currentConfig.subtitle && <p className="text-sm text-zinc-400">{currentConfig.subtitle}</p>}
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-black/40 border border-softgold-500/20 rounded-2xl p-12 text-center">
          <currentConfig.icon className="w-12 h-12 text-softgold-500/50 mx-auto mb-4" />
          <p className="text-zinc-400">No confessions found in this view.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-lg bg-softgold-500/20 text-softgold-400">
          <currentConfig.icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{currentConfig.title}</h2>
          <p className="text-sm text-zinc-400">{currentConfig.subtitle}</p>
        </div>
      </div>

      {/* Confessions List */}
      <div className="space-y-4">
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

          return (
          <div
            key={cardKey}
            onClick={handleClick}
            className={`bg-black/40 border rounded-2xl p-6 transition-all duration-200 ${
              !hasValidId
                ? 'border-red-500/60 bg-red-900/10 cursor-not-allowed opacity-60'
                : 'border-softgold-500/20 cursor-pointer hover:bg-black/60 hover:border-softgold-500/40 hover:shadow-lg hover:shadow-softgold-500/10'
            } ${
              confession.isExplicit ? 'border-red-500/40 bg-red-900/5' : ''
            }`}
          >
            {/* Missing ID Warning */}
            {!hasValidId && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
                <p className="text-red-400 text-xs font-medium">
                  ⚠️ Warning: This confession is missing an ID and cannot be opened.
                </p>
              </div>
            )}

            {/* Author Info */}
            <div className="flex items-center gap-3 mb-4">
              {confession.alias?.imageUrl ? (
                <img
                  src={confession.alias.imageUrl}
                  alt="Author avatar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-softgold-500/20"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                    confession.alias?.color || 'from-gray-500 to-gray-600'
                  } flex items-center justify-center text-white text-lg font-bold border-2 border-softgold-500/20`}
                >
                  {confession.alias?.emoji || '👤'}
                </div>
              )}
              <div className="flex-1">
                <div className="text-white font-medium">
                  {confession.alias?.name || 'Anonymous'}
                </div>
                <div className="text-xs text-zinc-400">
                  {new Date(confession.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            {/* Content - Truncated for feed view */}
            <div className="text-white mb-4 whitespace-pre-wrap break-words line-clamp-4">
              {confession.content}
            </div>

            {/* Engagement Stats */}
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1">
                <span className="text-softgold-400">▲</span>
                <span>{confession.score || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-softgold-400">💬</span>
                <span>{confession.replies || 0}</span>
              </div>
              {confession.engagementScore && (
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-softgold-400">🔥</span>
                  <span>{Math.round(confession.engagementScore)}</span>
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

