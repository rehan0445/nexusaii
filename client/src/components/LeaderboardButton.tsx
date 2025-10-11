import React from 'react';
import { Trophy } from 'lucide-react';

interface LeaderboardButtonProps {
  onClick: () => void;
  isActive: boolean;
}

export function LeaderboardButton({ onClick, isActive }: LeaderboardButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-gold text-zinc-900'
          : 'text-zinc-400 hover:bg-zinc-700/50'
      }`}
      aria-label="View character leaderboard"
    >
      <Trophy className="w-5 h-5" />
      <span className="font-medium">Leaderboard</span>
    </button>
  );
} 