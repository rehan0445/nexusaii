import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useJoinedItems } from "../../contexts/JoinedItemsContext";

const GroupsTab: React.FC = () => {
  const navigate = useNavigate();
  const { joinedGroups } = useJoinedItems?.() as any || { joinedGroups: [] };
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"latest" | "active">("latest");

  useMemo(() => joinedGroups || [], [joinedGroups]);

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Back button */}
      <div className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate("/arena")}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Arena</span>
          </button>
          <h1 className="ml-4 text-xl font-semibold text-white">Groups</h1>
        </div>
      </div>

      <div className="space-y-4">
        {/* Quick filters */}
        <div className="sticky top-16 z-10 bg-[#18181b]/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups" className="flex-1 bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="all">All</option>
            <option value="tech">Tech</option>
            <option value="anime">Anime</option>
            <option value="startup">Startup</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="bg-zinc-900/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="latest">Latest</option>
            <option value="active">Most Active</option>
          </select>
        </div>
      </div>

        {/* Enhanced Group Discovery */}
        <div className="p-4">
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-white mb-4">Discover Groups</h2>
            <p className="text-zinc-400 mb-6">Join communities and connect with like-minded people</p>
            <button
              onClick={() => navigate("/vibe")}
              className="px-6 py-3 bg-softgold-500 hover:bg-softgold-500 text-white rounded-lg font-medium transition-colors"
            >
              Browse All Groups
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupsTab;


