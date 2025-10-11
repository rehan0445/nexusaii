// src/components/CharacterCardSkeleton.tsx
import React from "react";

const CharacterCardSkeleton: React.FC = () => {
  return (
    <div className="w-full rounded-xl bg-zinc-800/50 animate-pulse overflow-hidden">
      <div className="relative aspect-[2/3] bg-zinc-700" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 bg-zinc-700 rounded" />
        <div className="h-3 w-1/2 bg-zinc-700 rounded" />
      </div>
    </div>
  );
};

export default CharacterCardSkeleton;
