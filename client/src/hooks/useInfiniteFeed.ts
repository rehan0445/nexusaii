import { useCallback, useEffect, useRef, useState } from "react";

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

export type FetchPageFn<T> = (cursor: string | null) => Promise<PaginatedResult<T>>;

export const useInfiniteFeed = <T,>(fetchPage: FetchPageFn<T>) => {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const reset = useCallback(async () => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    await loadMore(true);
  }, []);

  const loadMore = useCallback(async (isReset = false) => {
    if (isLoading || (!hasMore && !isReset)) return;
    setIsLoading(true);
    try {
      const page = await fetchPage(isReset ? null : cursor);
      setItems((prev) => (isReset ? page.items : [...prev, ...page.items]));
      setCursor(page.nextCursor);
      setHasMore(Boolean(page.nextCursor));
    } finally {
      setIsLoading(false);
    }
  }, [cursor, fetchPage, hasMore, isLoading]);

  useEffect(() => {
    const node = observerRef.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, { threshold: 0.1 });
    io.observe(node);
    return () => io.disconnect();
  }, [loadMore]);

  return { items, isLoading, hasMore, loadMore, reset, observerRef } as const;
};

export default useInfiniteFeed;


