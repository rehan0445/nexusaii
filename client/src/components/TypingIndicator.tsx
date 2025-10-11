// Typing Indicator: Shows character is typing with animated dots
import React from 'react';

interface TypingIndicatorProps {
  characterName: string;
  characterImage?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  characterName,
  characterImage
}) => {
  return (
    <div className="flex items-start space-x-3 mb-3 animate-fade-in">
      {characterImage && (
        <img
          src={characterImage}
          alt={characterName}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      )}
      
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl px-4 py-3 border border-zinc-700/50 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-400">{characterName} is typing</span>
          <div className="flex space-x-1">
            <span className="w-2 h-2 bg-softgold-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-softgold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-softgold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Letter-by-letter animation component
interface LetterByLetterProps {
  text: string;
  typingSpeed?: number; // ms per character
  onComplete?: () => void;
  allowSkip?: boolean;
}

export const LetterByLetterText: React.FC<LetterByLetterProps> = ({
  text,
  typingSpeed = 30,
  onComplete,
  allowSkip = true
}) => {
  const [displayedText, setDisplayedText] = React.useState('');
  const [isComplete, setIsComplete] = React.useState(false);
  const [isSkipped, setIsSkipped] = React.useState(false);

  React.useEffect(() => {
    if (isSkipped) {
      setDisplayedText(text);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
        onComplete?.();
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [text, typingSpeed, onComplete, isSkipped]);

  const handleSkip = () => {
    if (allowSkip && !isComplete) {
      setIsSkipped(true);
    }
  };

  return (
    <div className="relative group">
      <div className="whitespace-pre-wrap">{displayedText}</div>
      {!isComplete && displayedText.length > 0 && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-softgold-500 animate-pulse"></span>
      )}
      {allowSkip && !isComplete && (
        <button
          onClick={handleSkip}
          className="absolute -bottom-6 right-0 text-xs text-zinc-500 hover:text-softgold-400 transition-colors opacity-0 group-hover:opacity-100"
        >
          Click to skip
        </button>
      )}
    </div>
  );
};

export default TypingIndicator;

