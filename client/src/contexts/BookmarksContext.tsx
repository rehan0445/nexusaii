import React, { createContext, useContext, useCallback, useEffect, useState, useMemo, ReactNode } from 'react';

const STORAGE_KEY = 'phoenix_bookmarks';
const POST_TYPE_KEY = 'phoenix_default_post_type';

export type PostTypePreference = 'username' | 'alias';

interface BookmarksData {
  confessionIds: string[];
  characterIds: string[];
}

interface BookmarksContextType {
  bookmarkedConfessionIds: Set<string>;
  bookmarkedCharacterIds: Set<string>;
  toggleConfessionBookmark: (id: string) => void;
  toggleCharacterBookmark: (id: string) => void;
  isConfessionBookmarked: (id: string) => boolean;
  isCharacterBookmarked: (id: string) => boolean;
  bookmarksCount: number;
  // Post type preference (alias vs username)
  defaultPostType: PostTypePreference | null;
  setDefaultPostType: (type: PostTypePreference | null) => void;
}

const defaultContext: BookmarksContextType = {
  bookmarkedConfessionIds: new Set(),
  bookmarkedCharacterIds: new Set(),
  toggleConfessionBookmark: () => {},
  toggleCharacterBookmark: () => {},
  isConfessionBookmarked: () => false,
  isCharacterBookmarked: () => false,
  bookmarksCount: 0,
  defaultPostType: null,
  setDefaultPostType: () => {},
};

const BookmarksContext = createContext<BookmarksContextType>(defaultContext);

function loadBookmarks(): BookmarksData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { confessionIds: [], characterIds: [] };
    const parsed = JSON.parse(raw);
    return {
      confessionIds: Array.isArray(parsed?.confessionIds) ? parsed.confessionIds : [],
      characterIds: Array.isArray(parsed?.characterIds) ? parsed.characterIds : [],
    };
  } catch {
    return { confessionIds: [], characterIds: [] };
  }
}

function saveBookmarks(data: BookmarksData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save bookmarks', e);
  }
}

function loadDefaultPostType(): PostTypePreference | null {
  try {
    const v = localStorage.getItem(POST_TYPE_KEY);
    if (v === 'username' || v === 'alias') return v;
    return null;
  } catch {
    return null;
  }
}

function saveDefaultPostType(type: PostTypePreference | null) {
  try {
    if (type) localStorage.setItem(POST_TYPE_KEY, type);
    else localStorage.removeItem(POST_TYPE_KEY);
  } catch (e) {
    console.warn('Failed to save default post type', e);
  }
}

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BookmarksData>(loadBookmarks);
  const [defaultPostType, setDefaultPostTypeState] = useState<PostTypePreference | null>(loadDefaultPostType);

  useEffect(() => {
    saveBookmarks(data);
  }, [data]);

  const bookmarkedConfessionIds = new Set(data.confessionIds);
  const bookmarkedCharacterIds = new Set(data.characterIds);
  const bookmarksCount = data.confessionIds.length + data.characterIds.length;

  const toggleConfessionBookmark = useCallback((id: string) => {
    setData((prev) => {
      const set = new Set(prev.confessionIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, confessionIds: Array.from(set) };
    });
  }, []);

  const toggleCharacterBookmark = useCallback((id: string) => {
    setData((prev) => {
      const set = new Set(prev.characterIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...prev, characterIds: Array.from(set) };
    });
  }, []);

  const isConfessionBookmarked = useCallback(
    (id: string) => bookmarkedConfessionIds.has(id),
    [data.confessionIds]
  );

  const isCharacterBookmarked = useCallback(
    (id: string) => bookmarkedCharacterIds.has(id),
    [data.characterIds]
  );

  const setDefaultPostType = useCallback((type: PostTypePreference | null) => {
    setDefaultPostTypeState(type);
    saveDefaultPostType(type);
  }, []);

  const value = useMemo<BookmarksContextType>(
    () => ({
      bookmarkedConfessionIds,
      bookmarkedCharacterIds,
      toggleConfessionBookmark,
      toggleCharacterBookmark,
      isConfessionBookmarked,
      isCharacterBookmarked,
      bookmarksCount,
      defaultPostType,
      setDefaultPostType,
    }),
    [
      data.confessionIds,
      data.characterIds,
      defaultPostType,
      toggleConfessionBookmark,
      toggleCharacterBookmark,
      isConfessionBookmarked,
      isCharacterBookmarked,
      setDefaultPostType,
    ]
  );

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) {
    throw new Error('useBookmarks must be used within BookmarksProvider');
  }
  return ctx;
}
