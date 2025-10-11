import React, { useState, useEffect } from 'react';
import { Heart, Repeat, Share2 } from 'lucide-react';

export interface ChatBubbleProps {
  content: string;
  sender: 'user' | 'ai' | 'anonymous';
  timestamp?: Date;
  characterName?: string;
  characterAvatar?: string;
  theme?: 'heroic' | 'villainous' | 'neutral' | 'mystical' | 'futuristic';
  texture?: 'paper' | 'hologram' | 'energy' | 'parchment' | 'metal';
  genre?: 'scifi' | 'fantasy' | 'modern' | 'noir';
  responseType?: 'question' | 'action' | 'emotion' | 'statement';
  cornerEmblem?: string;
  showMetadata?: boolean;
  showActions?: boolean;
  onLike?: () => void;
  onReply?: () => void;
  onShare?: () => void;
  className?: string;
  // Letter-by-letter animation
  animated?: boolean;
  typingSpeed?: number; // ms per character
  onAnimationComplete?: () => void;
}

export const EnhancedChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  sender,
  timestamp,
  characterName,
  characterAvatar,
  theme,
  texture,
  genre,
  // dark chat redesign: not used
  // responseType,
  // cornerEmblem,
  showMetadata = true,
  showActions = true,
  onLike,
  onReply,
  onShare,
  className = '',
  animated = false,
  typingSpeed = 30,
  onAnimationComplete
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dominantColor, setDominantColor] = useState<string>('');
  const [displayedText, setDisplayedText] = useState(animated ? '' : content);
  const [isAnimating, setIsAnimating] = useState(animated);
  const [isSkipped, setIsSkipped] = useState(false);

  // Extract dominant color from character avatar
  useEffect(() => {
    if (characterAvatar) {
      extractDominantColor(characterAvatar);
    }
  }, [characterAvatar]);

  // Letter-by-letter animation
  useEffect(() => {
    if (!animated || isSkipped) {
      setDisplayedText(content);
      setIsAnimating(false);
      onAnimationComplete?.();
      return;
    }

    let currentIndex = 0;
    setIsAnimating(true);

    const interval = setInterval(() => {
      if (currentIndex <= content.length) {
        setDisplayedText(content.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsAnimating(false);
        clearInterval(interval);
        onAnimationComplete?.();
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [content, animated, typingSpeed, isSkipped, onAnimationComplete]);

  const handleSkip = () => {
    if (animated && isAnimating) {
      setIsSkipped(true);
      setDisplayedText(content);
      setIsAnimating(false);
      onAnimationComplete?.();
    }
  };

  const extractDominantColor = async (imageUrl: string) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Simple color extraction (average of first few pixels)
          let r = 0, g = 0, b = 0;
          const sampleSize = Math.min(100, data.length / 4);
          
          for (let i = 0; i < sampleSize; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
          }
          
          r = Math.round(r / (sampleSize / 4));
          g = Math.round(g / (sampleSize / 4));
          b = Math.round(b / (sampleSize / 4));
          
          setDominantColor(`rgb(${r}, ${g}, ${b})`);
        }
      };
      img.src = imageUrl;
    } catch (error) {
      console.warn('Failed to extract dominant color:', error);
    }
  };

  // Generate theme classes
  const getThemeClasses = () => {
    const classes = ['chat-bubble', sender];
    
    if (theme) classes.push(`theme-${theme}`);
    if (texture) classes.push(`texture-${texture}`);
    if (genre) classes.push(`genre-${genre}`);
    
    return classes.join(' ');
  };

  // Removed unused helpers from render

  

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Custom styles for dynamic theming
  const getCustomStyles = () => {
    const styles: React.CSSProperties = {};
    
    if (dominantColor && !theme) {
      styles.background = `linear-gradient(135deg, ${dominantColor}20, ${dominantColor}40)`;
      styles.borderColor = dominantColor;
    }
    
    return styles;
  };

  const isUser = sender === 'user';
  const baseClasses = 'relative px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-md border transition-all duration-200 overflow-hidden max-w-full';
  const variantClasses = isUser
    ? 'bg-[#00ff7f] text-white border-[#00e673] shadow-[0_0_18px_rgba(0,255,127,0.25)]'
    : 'bg-zinc-800 text-white border-zinc-700 shadow-[0_2px_10px_rgba(0,0,0,0.35)]';
  const computedClasses = `${getThemeClasses()} ${baseClasses} ${variantClasses} ${className}`.trim();

  return (
    <div
      className={`${computedClasses} group`}
      style={getCustomStyles()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      aria-label={`${isUser ? 'Your message' : `${characterName || 'Message'}`}`}
      tabIndex={0}
    >

      {showMetadata && (characterName || timestamp) && (
        <div className="mb-1 text-xs opacity-75" aria-label="Message metadata">
          {characterName && (
            <span className="mr-2 align-middle">
              {characterAvatar && (
                <img 
                  src={characterAvatar} 
                  alt={`${characterName} avatar`}
                  className="w-4 h-4 rounded-full mr-1 inline border border-zinc-600/50"
                />
              )}
              {characterName}
            </span>
          )}
          {timestamp && (
            <span className="align-middle">{formatTimestamp(timestamp)}</span>
          )}
        </div>
      )}

      {/* glossy highlight strip for WhatsApp-like depth */}
      {isUser && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 opacity-20"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0) 100%)',
            mixBlendMode: 'overlay'
          }}
        />
      )}

      <div className="leading-relaxed relative" aria-label="Message content">
        <span className="whitespace-pre-wrap">{displayedText}</span>
        {isAnimating && displayedText.length > 0 && (
          <span className="inline-block w-1.5 h-4 ml-1 bg-softgold-500 animate-pulse"></span>
        )}
        {animated && isAnimating && (
          <button
            onClick={handleSkip}
            className="absolute -bottom-6 right-0 text-xs text-zinc-500 hover:text-softgold-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            Click to skip
          </button>
        )}
      </div>

      {timestamp && !showMetadata && (
        <div className={`mt-1 text-[10px] ${isUser ? 'text-white/80' : 'text-zinc-400'} text-right`}>{formatTimestamp(timestamp)}</div>
      )}

      {showActions && (onLike || onReply || onShare) && (
        <div className={`mt-2 flex gap-2 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} role="group" aria-label="Message actions">
          {onLike && (
            <button className="text-xs text-zinc-300 hover:text-white inline-flex items-center gap-1" onClick={onLike}>
              <Heart className="w-3 h-3" /> Like
            </button>
          )}
          {onReply && (
            <button className="text-xs text-zinc-300 hover:text-white inline-flex items-center gap-1" onClick={onReply}>
              <Repeat className="w-3 h-3" /> Reply
            </button>
          )}
          {onShare && (
            <button className="text-xs text-zinc-300 hover:text-white inline-flex items-center gap-1" onClick={onShare}>
              <Share2 className="w-3 h-3" /> Share
            </button>
          )}
        </div>
      )}

      {/* Tail removed as requested */}
    </div>
  );
};

// Theme preset configurations
export const themePresets = {
  heroic: {
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    texture: 'energy',
    genre: 'modern',
  },
  villainous: {
    primary: '#dc2626',
    secondary: '#991b1b',
    texture: 'metal',
    genre: 'noir',
  },
  mystical: {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    texture: 'hologram',
    genre: 'fantasy',
  },
  futuristic: {
    primary: '#06b6d4',
    secondary: '#0891b2',
    texture: 'hologram',
    genre: 'scifi',
  },
  neutral: {
    primary: '#6b7280',
    secondary: '#4b5563',
    texture: 'paper',
    genre: 'modern',
  },
};

// Genre configurations
export const genreConfigs = {
  scifi: {
    texture: 'hologram',
    theme: 'futuristic',
    animations: ['electric-pulse'],
  },
  fantasy: {
    texture: 'parchment',
    theme: 'mystical',
    animations: ['magical-glow'],
  },
  modern: {
    texture: 'paper',
    theme: 'neutral',
    animations: [],
  },
  noir: {
    texture: 'metal',
    theme: 'villainous',
    animations: [],
  },
};

export default EnhancedChatBubble; 