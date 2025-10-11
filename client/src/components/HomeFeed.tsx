import React, { useEffect } from "react";
import useInfiniteFeed, { PaginatedResult } from "../hooks/useInfiniteFeed";
import usePullToRefresh from "../hooks/usePullToRefresh";

type Recommendation = { id: string; title: string; createdAt: number };
type UpdateItem = { id: string; type: "info" | "group"; summary: string; createdAt: number };

const fetchRecommendationsPage = async (cursor: string | null): Promise<PaginatedResult<Recommendation>> => {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", "12");
  const res = await fetch(`/api/feed/recommendations?${params.toString()}`);
  const json = await res.json();
  const { items, nextCursor } = json.data || { items: [], nextCursor: null };
  return { items, nextCursor };
};

const fetchUpdatesPage = async (cursor: string | null): Promise<PaginatedResult<UpdateItem>> => {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", "12");
  const res = await fetch(`/api/feed/updates?${params.toString()}`);
  const json = await res.json();
  const { items, nextCursor } = json.data || { items: [], nextCursor: null };
  return { items, nextCursor };
};

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="flex items-center justify-between mb-3">
    <div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
    </div>
  </div>
);

const CardSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-[#F4E3B5]/30 bg-black/40 animate-pulse h-24" />
);

export const HomeFeed: React.FC = () => {
  const rec = useInfiniteFeed<Recommendation>(fetchRecommendationsPage);
  const upd = useInfiniteFeed<UpdateItem>(fetchUpdatesPage);
  usePullToRefresh(async () => { await Promise.all([rec.reset(), upd.reset()]); }, 60);

  // Load first pages on mount
  useEffect(() => {
    rec.loadMore(true);
    upd.loadMore(true);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-8">
      {/* Recommendations */}
      <section>
        <SectionHeader title="Recommendations" subtitle="Suggested for you" />
        <div className="grid grid-cols-1 gap-3">
          {rec.items.length === 0 && rec.isLoading && (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          )}
          {rec.items.map((card) => (
            <div key={card.id} className="rounded-2xl border border-[#F4E3B5]/30 bg-black/60 p-4">
              <div className="text-softgold-300 text-xs mb-1">Recommendation</div>
              <div className="text-white font-medium">{card.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Updates */}
      <section>
        <SectionHeader title="Updates" subtitle="From Info + Group Chats" />
        <div className="grid grid-cols-1 gap-3">
          {upd.items.length === 0 && upd.isLoading && (
            <>
              <CardSkeleton />
              <CardSkeleton />
            </>
          )}
          {upd.items.map((card) => (
            <div key={card.id} className="rounded-2xl border border-[#F4E3B5]/30 bg-black/60 p-4">
              <div className="text-softgold-300 text-xs mb-1">Update</div>
              <div className="text-white font-medium">{card.summary}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Companion Notifications */}
      <section>
        <SectionHeader title="Companion" subtitle="Recent activity" />
        <div className="grid grid-cols-1 gap-3">
          {/* Hook into real companion notifications later */}
          {null}
        </div>
      </section>

      {/* Infinite loader sentinel */}
      <div ref={rec.observerRef} />
      <div ref={upd.observerRef} />
      {(rec.isLoading || upd.isLoading) && <div className="text-center text-zinc-400">Loading…</div>}
      {!rec.hasMore && !upd.hasMore && <div className="text-center text-zinc-500">You’re all caught up</div>}
    </div>
  );
};

export default HomeFeed;


