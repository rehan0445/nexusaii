import React from 'react';

// Image fallback utilities to handle blocked external resources
export const getImageFallback = (originalUrl: string, fallbackType: 'character' | 'avatar' | 'background' = 'character'): string => {
  // Check if the URL is from a commonly blocked domain
  const blockedDomains = ['i.pinimg.com', 'images.unsplash.com', 'picsum.photos'];
  const isBlocked = blockedDomains.some(domain => originalUrl.includes(domain));
  
  if (!isBlocked) {
    return originalUrl;
  }

  // Log when fallback is used (only once per session)
  if (!window.fallbackLogged) {
    console.warn('🚫 External images blocked by ad blocker. Using fallback images.');
    console.info('💡 To see original images, disable your ad blocker for localhost or add localhost to whitelist.');
    window.fallbackLogged = true;
  }

  // Return fallback images based on type
  const characterSvg = '<svg width="300" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#374151"/><circle cx="150" cy="120" r="40" fill="#6B7280"/><rect x="100" y="180" width="100" height="80" rx="10" fill="#6B7280"/><text x="150" y="300" text-anchor="middle" fill="#9CA3AF" font-family="system-ui" font-size="14">Character</text></svg>';
  
  const avatarSvg = '<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="20" fill="#6B7280"/><circle cx="20" cy="16" r="6" fill="#9CA3AF"/><path d="M8 32 Q20 24 32 32" stroke="#9CA3AF" stroke-width="2" fill="none"/></svg>';
  
  const backgroundSvg = '<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#374151;stop-opacity:1" /><stop offset="100%" style="stop-color:#1F2937;stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#grad)"/><text x="400" y="300" text-anchor="middle" fill="#6B7280" font-family="system-ui" font-size="24">Background</text></svg>';

  switch (fallbackType) {
    case 'character':
      return `data:image/svg+xml;base64,${btoa(characterSvg)}`;
    
    case 'avatar':
      return `data:image/svg+xml;base64,${btoa(avatarSvg)}`;
    
    case 'background':
      return `data:image/svg+xml;base64,${btoa(backgroundSvg)}`;
    
    default:
      return originalUrl;
  }
};

// Hook to handle image loading errors
export const useImageWithFallback = (originalUrl: string, fallbackType: 'character' | 'avatar' | 'background' = 'character') => {
  const [imageSrc, setImageSrc] = React.useState(originalUrl);
  const [hasError, setHasError] = React.useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(getImageFallback(originalUrl, fallbackType));
    }
  };

  React.useEffect(() => {
    setImageSrc(originalUrl);
    setHasError(false);
  }, [originalUrl]);

  return { imageSrc, handleError };
};
