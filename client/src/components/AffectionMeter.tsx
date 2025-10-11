// Affection Meter: Visual heart-based friendship level indicator
import React from 'react';
import { Heart } from 'lucide-react';

interface AffectionMeterProps {
  visibleLevel: number; // 1-5
  affectionPoints: number; // 0-1000
  pointsToNextLevel: number;
  tierName: string; // e.g., "Friend", "Best Friend"
  tierColor: string; // e.g., "blue", "gold"
  progressPercent: number; // 0-100
  showDetails?: boolean;
}

const TIER_COLORS = {
  gray: 'text-zinc-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  pink: 'text-pink-400',
  gold: 'text-softgold-400'
};

const TIER_BG_COLORS = {
  gray: 'bg-zinc-400/20',
  blue: 'bg-blue-400/20',
  purple: 'bg-purple-400/20',
  pink: 'bg-pink-400/20',
  gold: 'bg-softgold-400/20'
};

export const AffectionMeter: React.FC<AffectionMeterProps> = ({
  visibleLevel,
  affectionPoints,
  pointsToNextLevel,
  tierName,
  tierColor,
  progressPercent,
  showDetails = true
}) => {
  const colorClass = TIER_COLORS[tierColor as keyof typeof TIER_COLORS] || TIER_COLORS.gray;
  const bgColorClass = TIER_BG_COLORS[tierColor as keyof typeof TIER_BG_COLORS] || TIER_BG_COLORS.gray;

  // Render hearts based on visible level
  const renderHearts = () => {
    const hearts = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= visibleLevel;
      hearts.push(
        <Heart
          key={i}
          className={`w-5 h-5 transition-all duration-300 ${
            isFilled 
              ? `${colorClass} fill-current` 
              : 'text-zinc-600'
          }`}
        />
      );
    }
    return hearts;
  };

  return (
    <div className="relative group">
      {/* Hearts Display */}
      <div className="flex items-center space-x-1">
        {renderHearts()}
      </div>

      {/* Tooltip with Details */}
      {showDetails && (
        <div className="absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className={`${bgColorClass} backdrop-blur-md rounded-lg px-4 py-3 border ${colorClass.replace('text-', 'border-')} shadow-xl min-w-[200px]`}>
            {/* Tier Name */}
            <div className={`text-sm font-bold ${colorClass} mb-2`}>
              {tierName}
            </div>

            {/* Points Progress */}
            <div className="space-y-1">
              <div className="text-xs text-zinc-300">
                {affectionPoints} points
                {pointsToNextLevel > 0 && (
                  <span className="text-zinc-400"> ({pointsToNextLevel} to next level)</span>
                )}
              </div>

              {/* Progress Bar */}
              {pointsToNextLevel > 0 && (
                <div className="w-full h-2 bg-zinc-700/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${bgColorClass.replace('/20', '')} transition-all duration-500`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              )}

              {/* Max Level Indicator */}
              {pointsToNextLevel === 0 && visibleLevel === 5 && (
                <div className={`text-xs ${colorClass} font-semibold`}>
                  ✨ Max Level Reached!
                </div>
              )}
            </div>

            {/* Tooltip Arrow */}
            <div className={`absolute top-full left-1/2 transform -translate-x-1/2 -mt-px`}>
              <div className={`w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${colorClass.replace('text-', 'border-t-')}`}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for mobile or smaller displays
export const CompactAffectionMeter: React.FC<{ visibleLevel: number; tierColor: string }> = ({
  visibleLevel,
  tierColor
}) => {
  const colorClass = TIER_COLORS[tierColor as keyof typeof TIER_COLORS] || TIER_COLORS.gray;

  return (
    <div className="flex items-center space-x-1">
      <Heart className={`w-4 h-4 ${colorClass} fill-current`} />
      <span className={`text-sm font-semibold ${colorClass}`}>×{visibleLevel}</span>
    </div>
  );
};

export default AffectionMeter;

