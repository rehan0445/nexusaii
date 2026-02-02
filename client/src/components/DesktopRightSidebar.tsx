import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Frown } from 'lucide-react';
import axios from 'axios';
import { apiFetch, formatTimeAgo } from '../lib/utils';
import { useDesktopLayout } from '../contexts/DesktopLayoutContext';

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
}

interface FeedActivityItem {
  confession: ConfessionItem;
  activityAt: string;
  activityType: 'posted' | 'commented';
}

const getServerUrl = () => import.meta.env.VITE_SERVER_URL || globalThis.location.origin;

const getSessionId = () => {
  const SESSION_KEY = 'confession_session_id';
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      localStorage.setItem(SESSION_KEY, sessionId);
    } catch {
      // ignore
    }
  }
  return sessionId;
};

export function DesktopRightSidebar() {
  const desktopLayout = useDesktopLayout();
  const [activeTab, setActiveTab] = useState<InboxTab>('feeds');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [feedItems, setFeedItems] = useState<FeedActivityItem[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const navigate = useNavigate();

  const fetchChats = React.useCallback(async () => {
    setLoadingChats(true);
    try {
      const { API_CONFIG } = await import('../lib/config');
      const API_BASE_URL = API_CONFIG.getServerUrl();
      const response = await axios.get(`${API_BASE_URL}/api/nexus-chats/`, { withCredentials: true });
      if (response.data?.chats) {
        const formatted: ChatItem[] = response.data.chats
          .filter((chat: { type?: string }) => chat?.type === 'companion')
          .map((chat: Record<string, unknown>) => ({
            id: String(chat.id),
            characterId: String(chat.id),
            characterName: (chat.name as string) || 'Character',
            characterImage: (chat.avatar as string) || '',
            lastMessage: (chat.lastMessage as string) || 'Start chatting!',
            timestamp: chat.timestamp ? new Date(chat.timestamp as string) : new Date(),
            tags: (chat.tags as string[]) || [],
            unread: (chat.unread as boolean) || false,
          }));
        setChats(formatted);
      }
    } catch {
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  const fetchFeedActivity = React.useCallback(async () => {
    setLoadingFeeds(true);
    try {
      const sessionId = getSessionId();
      const response = await apiFetch(
        `${getServerUrl()}/api/confessions/activity?sessionId=${encodeURIComponent(sessionId)}`
      );
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setFeedItems(result.data);
      }
    } catch {
      setFeedItems([]);
    } finally {
      setLoadingFeeds(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    fetchFeedActivity();
  }, [fetchChats, fetchFeedActivity]);

  if (desktopLayout?.rightHidden) return null;

  const handleFeedClick = (item: FeedActivityItem) => {
    const c = item.confession;
    const id = c.id || c.confession_id || (c as ConfessionItem & { _id?: string })._id;
    if (id) {
      const campus = c.campus || 'general';
      navigate(`/campus/${campus}/confessions/${id}`);
    }
  };

  const getPreview = (text: string, max = 50) =>
    (text?.length ?? 0) > max ? `${text.substring(0, max)}...` : text || '';

  return (
    <aside className="hidden lg:flex lg:w-1/5 flex-col h-screen fixed right-0 top-0 bottom-0 bg-[#0A0A0A] border-l border-white/10 shrink-0 z-30">
      <div className="flex flex-col h-full w-full">
        {/* Inbox header - above tabs */}
        <div className="shrink-0 px-4 pt-4 pb-2 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Inbox</h2>
        </div>
        {/* Tabs: Feed | Companion */}
        <div className="flex border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('feeds')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'feeds'
                ? 'border-[#A855F7] text-[#A855F7]'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            <Frown className="w-4 h-4" />
            Feed
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('companions')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === 'companions'
                ? 'border-[#A855F7] text-[#A855F7]'
                : 'border-transparent text-[#A1A1AA] hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Companion
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'feeds' && (
            <div className="space-y-2">
              {loadingFeeds && [1, 2, 3].map((i) => (
                <div key={i} className="bg-[#1A1A1A] rounded-lg p-3 animate-pulse">
                  <div className="h-3 bg-[#2A2A2A] rounded w-full mb-2" />
                  <div className="h-3 bg-[#2A2A2A] rounded w-2/3" />
                </div>
              ))}
              {!loadingFeeds && feedItems.length === 0 && (
                <div className="py-8 text-center text-[#A1A1AA] text-sm">
                  <Frown className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  No feed activity yet.
                </div>
              )}
              {!loadingFeeds && feedItems.length > 0 && feedItems.map((item) => {
                  const c = item.confession;
                  const id = c.id || c.confession_id || (c as ConfessionItem & { _id?: string })._id;
                  return (
                    <button
                      key={String(id)}
                      type="button"
                      onClick={() => handleFeedClick(item)}
                      className="w-full text-left bg-[#1A1A1A] hover:bg-[#222222] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <p className="text-xs text-[#A1A1AA] line-clamp-2 mb-1">
                        {getPreview(c.content, 60)}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[#A1A1AA]">
                        <span className="px-1.5 py-0.5 rounded bg-[#A855F7]/20 text-[#A855F7]">
                          {item.activityType === 'posted' ? 'Posted' : 'Commented'}
                        </span>
                        <span>{formatTimeAgo(item.activityAt)}</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {activeTab === 'companions' && (
            <div className="space-y-2">
              {loadingChats && [1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 p-3 bg-[#1A1A1A] rounded-lg animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-[#2A2A2A]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-[#2A2A2A] rounded w-20" />
                    <div className="h-3 bg-[#2A2A2A] rounded w-full" />
                  </div>
                </div>
              ))}
              {!loadingChats && chats.length === 0 && (
                <div className="py-8 text-center text-[#A1A1AA] text-sm">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
                  No companion chats yet.
                </div>
              )}
              {!loadingChats && chats.length > 0 && chats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => navigate(`/chat/${chat.characterId}`)}
                    className="w-full flex gap-3 p-3 text-left bg-[#1A1A1A] hover:bg-[#222222] rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <img
                      src={chat.characterImage || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=80&h=80&fit=crop'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{chat.characterName}</p>
                      <p className="text-xs text-[#A1A1AA] line-clamp-1">
                        {getPreview(chat.lastMessage, 40)}
                      </p>
                      <p className="text-[10px] text-[#A1A1AA] mt-0.5">
                        {formatTimeAgo(chat.timestamp)}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
