import React from 'react';
import { Bot } from 'lucide-react';

interface SupportBotIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

export function SupportBotIcon({ size = 'md', animated = true, className = '' }: SupportBotIconProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Outer Ring */}
      <div 
        className={`${sizeClasses[size]} rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 relative overflow-hidden group`}
      >
        {/* Bot Icon */}
        <Bot className="w-1/2 h-1/2 text-gold group-hover:scale-110 transition-transform" />
        
        {/* Animated Gradient */}
        {animated && (
          <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 animate-shimmer" />
        )}
      </div>

      {/* Animated Pulse Ring */}
      {animated && (
        <div className="absolute inset-0 rounded-xl border border-gold/20 animate-ping" />
      )}
    </div>
  );
}