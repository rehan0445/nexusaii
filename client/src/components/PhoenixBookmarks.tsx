import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Frown, MessageCircle } from 'lucide-react';
import { useBookmarks } from '../contexts/BookmarksContext';
import { useCharacterContext } from '../contexts/CharacterContext';
import { apiFetch } from '../lib/utils';

type BookmarksTab = 'feed' | 'companion';

// Get the server URL for API calls
const getServerUrl = () => {
  return import.meta.env.VITE_SERVER_URL || globalThis.location.origin;
};

export function PhoenixBookmarks() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BookmarksTab>('feed');
  const { bookmarkedConfessionIds, bookmarkedCharacterIds } = useBookmarks();
  const { characters: charactersMap } = useCharacterContext();
  const [bookmarkedConfessionPreviews, setBookmarkedConfessionPreviews] = useState<Array<{ id: string; content: string; campus?: string }>>([]);

  const bookmarkedCharacters = useMemo(() => {
    return Array.from(bookmarkedCharacterIds)
      .map((slug) => {
        const char = charactersMap[slug];
        return char ? { ...char, slug } : null;
      })
      .filter(Boolean) as Array<{ name: string; image?: string; image_url?: string; slug: string; role?: string; description?: string }>;
  }, [bookmarkedCharacterIds, charactersMap]);

  // Fetch confession previews for bookmarked confessions
  useEffect(() => {
    const ids = Array.from(bookmarkedConfessionIds);
    if (ids.length === 0) {
      setBookmarkedConfessionPreviews([]);
      return;
    }
    let cancelled = false;
    const fetchOne = async (id: string) => {
      try {
        const res = await apiFetch(`${getServerUrl()}/api/confessions/${id}`);
        const result = await res.json();
        if (cancelled || !result.success || !result.data) return null;
        const c = result.data;
        const content = (c.content || '').slice(0, 60);
        return { id: String(c.id || id), content: content + (content.length >= 60 ? '...' : ''), campus: c.campus || 'general' };
      } catch {
        return { id, content: 'Confession', campus: 'general' as string };
      }
    };
    Promise.all(ids.map(fetchOne)).then((list) => {
      if (!cancelled) setBookmarkedConfessionPreviews(list.filter(Boolean) as Array<{ id: string; content: string; campus?: string }>);
    });
    return () => { cancelled = true; };
  }, [bookmarkedConfessionIds]);

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold tracking-tight select-none">
            <span className="text-white">Nexus</span><span className="text-[#A855F7]">chat.in</span>
          </h1>
          {/* Tab navigation */}
          <div className="flex gap-6 mt-4 border-b border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'feed'
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
              onClick={() => setActiveTab('companion')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'companion'
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
        {activeTab === 'feed' && (
          <div data-tab="feed" className="space-y-2">
            {bookmarkedConfessionPreviews.length === 0 ? (
              <div className="bg-[#1A1A1A] rounded-xl p-12 text-center">
                <Frown className="w-12 h-12 text-[#A1A1AA] mx-auto mb-4" />
                <p className="text-[#A1A1AA]">No feed bookmarks yet.</p>
              </div>
            ) : (
              bookmarkedConfessionPreviews.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/campus/${c.campus || 'general'}/confessions/${c.id}`)}
                  className="w-full text-left p-4 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-white/5 transition-all duration-200"
                >
                  <span className="text-white text-sm line-clamp-3">{c.content}</span>
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === 'companion' && (
          <div data-tab="companion" className="space-y-4">
            {bookmarkedCharacters.length === 0 ? (
              <div className="bg-[#1A1A1A] rounded-xl p-12 text-center">
                <MessageCircle className="w-12 h-12 text-[#A1A1AA] mx-auto mb-4" />
                <p className="text-[#A1A1AA]">No companion bookmarks yet.</p>
              </div>
            ) : (
              bookmarkedCharacters.map((char) => (
                <button
                  key={char.slug}
                  type="button"
                  onClick={() => navigate(`/chat/${char.slug}`)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-white/5 transition-all duration-200 text-left"
                >
                  {(char.image_url ?? char.image) ? (
                    <img
                      src={char.image_url ?? char.image}
                      alt={char.name}
                      className="w-20 h-20 flex-shrink-0 rounded-xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-20 h-20 flex-shrink-0 rounded-xl bg-[#A855F7]/20 flex items-center justify-center text-4xl">🤖</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base truncate">{char.name}</h3>
                    {(char.role || char.description) && (
                      <p className="text-[#A1A1AA] text-sm mt-0.5 line-clamp-2">
                        {char.role || char.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[#A1A1AA] flex-shrink-0">→</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
