import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Frown } from 'lucide-react';
import axios from 'axios';
import { apiFetch, formatTimeAgo } from '../lib/utils';

type InboxTab = 'feeds' | 'companions';

interface ChatItem {
  id: string;
  characterId: string;
  characterName: string;
  characterImage: string;
  lastMessage: string;
  timestamp: Date | number;
  tags?: string[];
  unread?: boolean;
}

interface ConfessionItem {
  id: string;
  confession_id?: string;
  _id?: string;
  content: string;
  campus?: string;
  createdAt: string;
  score: number;
  replies: number;
  viewCount?: number;
  alias?: any;
}

interface FeedActivityItem {
  confession: ConfessionItem;
  activityAt: string;
  activityType: 'posted' | 'commented';
}

interface PhoenixInboxProps {
  chats?: ChatItem[];
}

// Get the server URL for API calls
const getServerUrl = () => {
  return import.meta.env.VITE_SERVER_URL || globalThis.location.origin;
};

// Get session ID for filtering user's confessions
const getSessionId = () => {
  const SESSION_KEY = 'confession_session_id';
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      localStorage.setItem(SESSION_KEY, sessionId);
    } catch (e) {
      console.warn('Failed to save session ID:', e);
    }
  }
  return sessionId;
};

export function PhoenixInbox({ chats: initialChats }: PhoenixInboxProps) {
  const [activeTab, setActiveTab] = useState<InboxTab>('feeds');
  const [chats, setChats] = useState<ChatItem[]>(initialChats || []);
  const [feedItems, setFeedItems] = useState<FeedActivityItem[]>([]);
  const [loading, setLoading] = useState(!initialChats);
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!initialChats) {
      fetchChats();
    }
    fetchFeedActivity();
  }, []);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const { API_CONFIG } = await import('../lib/config');
      const API_BASE_URL = API_CONFIG.getServerUrl();
      const response = await axios.get(`${API_BASE_URL}/api/nexus-chats/`, {
        withCredentials: true
      });
      
      if (response.data?.chats) {
        const formattedChats: ChatItem[] = response.data.chats
          .filter((chat: any) => chat?.type === 'companion')
          .map((chat: any) => ({
            id: chat.id,
            characterId: chat.id,
            characterName: chat.name || 'Character',
            characterImage: chat.avatar || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=150&h=150',
            lastMessage: chat.lastMessage || 'Start chatting!',
            timestamp: chat.timestamp ? new Date(chat.timestamp) : new Date(),
            tags: chat.tags || [],
            unread: chat.unread || false
          }));
        setChats(formattedChats);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedActivity = async () => {
    setLoadingFeeds(true);
    try {
      const sessionId = getSessionId();
      const response = await apiFetch(`${getServerUrl()}/api/confessions/activity?sessionId=${encodeURIComponent(sessionId)}`);
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setFeedItems(result.data);
      }
    } catch (error) {
      console.error('Error fetching feed activity:', error);
    } finally {
      setLoadingFeeds(false);
    }
  };

  const handleFeedItemClick = (item: FeedActivityItem) => {
    const c = item.confession;
    const confessionId = c.id || c.confession_id || (c as any)._id;
    if (confessionId) {
      const campus = c.campus || 'general';
      navigate(`/campus/${campus}/confessions/${confessionId}`);
    }
  };

  const getConfessionPreview = (content: string): string => {
    if (content.length > 80) {
      return content.substring(0, 80) + '...';
    }
    return content || 'No content';
  };

  const getEmotionalPreview = (message: string): string => {
    // Return emotional preview text, not generic
    if (message.length > 60) {
      return message.substring(0, 60) + '...';
    }
    return message || 'Start a conversation...';
  };

  const companionChats = chats;

  if (loading && loadingFeeds) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 border-b border-white/10 backdrop-blur-md">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold tracking-tight select-none">
              <span className="text-white">Nexus</span><span className="text-[#A855F7]">chat.in</span>
            </h1>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-24">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1A1A1A] rounded-xl p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-[#2A2A2A]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#2A2A2A] rounded w-32" />
                  <div className="h-3 bg-[#2A2A2A] rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold tracking-tight select-none">
            <span className="text-white">Nexus</span><span className="text-[#A855F7]">chat.in</span>
          </h1>
          {/* Inbox above; Feed and Companion tabs below */}
          <h2 className="text-lg font-semibold text-white mt-4">Inbox</h2>
          <div className="flex gap-6 mt-2 border-b border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('feeds')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'feeds'
                  ? 'border-[#A855F7] text-white'
                  : 'border-transparent text-[#A1A1AA] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Frown className="w-4 h-4" />
                Feed
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('companions')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'companions'
                  ? 'border-[#A855F7] text-white'
                  : 'border-transparent text-[#A1A1AA] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Companion
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 transition-opacity duration-200">
        {activeTab === 'feeds' && (
          <div data-tab="feeds" className="space-y-2">
            {loadingFeeds ? (
              <>
                {[1, 2].map((i) => (
                  <div key={i} className="bg-[#1A1A1A] rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-[#2A2A2A] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-[#2A2A2A] rounded w-full" />
                  </div>
                ))}
              </>
            ) : feedItems.length === 0 ? (
              <div className="bg-[#1A1A1A] rounded-xl p-12 text-center">
                <Frown className="w-12 h-12 text-[#A1A1AA] mx-auto mb-4" />
                <p className="text-[#A1A1AA]">No feed activity yet.</p>
              </div>
            ) : (
              feedItems.map((item) => {
                const c = item.confession;
                const confessionId = c.id || c.confession_id || (c as any)._id;
                return (
                  <div
                    key={confessionId}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleFeedItemClick(item)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFeedItemClick(item); } }}
                    className="group bg-[#1A1A1A] rounded-xl p-4 cursor-pointer hover:bg-[#222222] transition-all duration-200 border border-white/5 hover:border-white/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm text-[#A1A1AA] line-clamp-3 group-hover:text-white transition-colors flex-1">
                        {getConfessionPreview(c.content)}
                      </p>
                      <span className="text-xs text-[#A1A1AA] flex-shrink-0 ml-3">
                        {formatTimeAgo(item.activityAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#A1A1AA]">
                      <span className="px-1.5 py-0.5 rounded bg-[#A855F7]/20 text-[#A855F7]">
                        {item.activityType === 'posted' ? 'Posted' : 'Commented'}
                      </span>
                      <span>↑ {c.score ?? 0}</span>
                      <span>💬 {c.replies ?? 0}</span>
                      {c.viewCount !== undefined && <span>👁️ {c.viewCount}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'companions' && (
          <div data-tab="companions" className="space-y-2">
            {loading ? (
              <>
                {[1, 2].map((i) => (
                  <div key={i} className="bg-[#1A1A1A] rounded-xl p-4 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#2A2A2A]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[#2A2A2A] rounded w-32" />
                        <div className="h-3 bg-[#2A2A2A] rounded w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : companionChats.length === 0 ? (
              <div className="bg-[#1A1A1A] rounded-xl p-12 text-center">
                <MessageCircle className="w-12 h-12 text-[#A1A1AA] mx-auto mb-4" />
                <p className="text-[#A1A1AA]">No companion chats yet. Start a conversation!</p>
              </div>
            ) : (
              companionChats.map((chat) => (
                <div
                  key={chat.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/chat/${chat.characterId}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/chat/${chat.characterId}`); } }}
                  className="group bg-[#1A1A1A] rounded-xl p-4 cursor-pointer hover:bg-[#222222] transition-all duration-200 border border-white/5 hover:border-white/10 relative"
                >
                  <div className="flex gap-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={chat.characterImage}
                        alt={chat.characterName}
                        className="w-12 h-12 rounded-full object-cover border border-white/10"
                      />
                      {chat.unread && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#A855F7] rounded-full border-2 border-[#1A1A1A] animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-semibold text-base truncate">{chat.characterName}</h3>
                        <span className="text-xs text-[#A1A1AA] flex-shrink-0 ml-2">
                          {formatTimeAgo(chat.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-[#A1A1AA] line-clamp-2 group-hover:text-white transition-colors">
                        {getEmotionalPreview(chat.lastMessage)}
                      </p>
                      {chat.tags && chat.tags.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {chat.tags.slice(0, 2).map((tag) => (
                            <span
                              key={String(tag)}
                              className="px-2 py-0.5 text-xs rounded-full bg-[#A855F7]/20 text-[#A855F7]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {chat.unread && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#A855F7] rounded-l-xl" />
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
