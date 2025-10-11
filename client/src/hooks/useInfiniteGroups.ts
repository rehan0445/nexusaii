import { useEffect, useState } from "react";
import type { GroupChat } from "@/types/groupChat";
import { groupChatsService } from "@/services/groupChatsService";

export function useInfiniteGroups(pageSize = 20) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<GroupChat[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    groupChatsService.getEndless(page, pageSize).then((res) => {
      if (!active) return;
      setItems((prev) => [...prev, ...res]);
      if (res.length < pageSize) setHasMore(false);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [page, pageSize]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    setPage((p) => p + 1);
  };

  return { items, hasMore, loading, loadMore };
}

export default useInfiniteGroups;


