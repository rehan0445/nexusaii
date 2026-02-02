import React from 'react';
import { useImageWithFallback } from '../utils/imageFallbacks';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackType?: 'character' | 'avatar' | 'background';
  alt: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  fallbackType = 'character', 
  alt, 
  className = '',
  ...props 
}) => {
  const { imageSrc, handleError } = useImageWithFallback(src, fallbackType);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
};

export default SafeImage;
