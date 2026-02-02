import React from 'react';
import { Palette, X, CheckCircle2 } from 'lucide-react';
import { imageThemes } from '../themes/image-themes';

interface ThemeSelectorProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSelectTheme: (themeId: string) => Promise<void>;
  readonly activeTheme: string;
}

export const ThemeSelector = ({ isOpen, onClose, onSelectTheme, activeTheme }: ThemeSelectorProps) => {
  if (!isOpen) return null;
  
  const allThemes = Object.values(imageThemes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-2xl p-6 max-h-[80vh] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-2 mb-6">
          <Palette className="w-6 h-6 text-gold" />
          <h2 className="text-xl font-bold text-white">Customize Theme</h2>
        </div>
        
        
        {/* Themes grid */}
        <div className="overflow-y-auto max-h-[calc(80vh-120px)] pb-4 pr-2 custom-scrollbar">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {allThemes.map((theme: any) => {
              const isActive = activeTheme === theme.id;
              
              return (
                <button
                  key={theme.id}
                  onClick={async () => {
                    try {
                      await onSelectTheme(theme.id);
                    } catch (error) {
                      console.error('Failed to apply theme:', error);
                    }
                  }}
                  className={`relative rounded-lg overflow-hidden transition-all hover:shadow-lg aspect-square ${
                    isActive ? 'ring-2 ring-gold' : 'hover:translate-y-[-2px]'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-1 right-1 z-10 text-gold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  
                  {/* Theme Preview Image */}
                  <div 
                    className="w-full h-full bg-cover bg-center relative"
                    style={{
                      backgroundImage: `url(${theme.imageUrl})`,
                    }}
                  >
                    {/* Overlay for better text readability */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        backgroundColor: theme.overlay || 'rgba(0, 0, 0, 0.3)'
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}; 