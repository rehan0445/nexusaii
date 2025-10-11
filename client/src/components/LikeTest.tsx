import React from 'react';
import { Heart } from 'lucide-react';
import { pluralizeLikes } from '../utils/pluralize';

interface LikeTestProps {
  slug: string;
  characterName: string;
  onLike: (e: React.MouseEvent, slug: string) => void;
  likeCount: number;
  userLiked: boolean;
  loading: boolean;
}

export const LikeTest: React.FC<LikeTestProps> = ({
  slug,
  characterName,
  onLike,
  likeCount,
  userLiked,
  loading
}) => {
  return (
    <div className="p-4 border border-gray-300 rounded-lg m-2">
      <h3 className="text-lg font-bold mb-2">{characterName}</h3>
      <div className="flex items-center space-x-4">
        <button
          onClick={(e) => onLike(e, slug)}
          disabled={loading}
          className={`p-2 rounded-full transition-all ${
            userLiked
              ? "bg-red-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Heart className="w-4 h-4" fill={userLiked ? "currentColor" : "none"} />
        </button>
        <span className="text-sm">{pluralizeLikes(likeCount)}</span>
        {loading && <span className="text-xs text-gray-500">Loading...</span>}
      </div>
    </div>
  );
}; 