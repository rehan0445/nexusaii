// Theme Manager for Dynamic Chat Bubble Theming

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
  texture: string;
  genre: string;
  animations: string[];
}

export interface ColorPalette {
  dominant: string;
  secondary: string;
  accent: string;
  contrast: string;
}

// Color extraction utilities
export class ColorExtractor {
  static async extractFromImage(imageUrl: string): Promise<ColorPalette> {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const colors = this.analyzeColors(imageData.data);
          
          resolve(colors);
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });
    } catch (error) {
      console.warn('Color extraction failed:', error);
      return this.getDefaultPalette();
    }
  }
  
  private static analyzeColors(data: Uint8ClampedArray): ColorPalette {
    const colorMap = new Map<string, number>();
    
    // Sample colors from the image
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Skip transparent pixels
      if (data[i + 3] < 128) continue;
      
      // Quantize colors to reduce noise
      const quantized = this.quantizeColor(r, g, b);
      const key = `${quantized.r},${quantized.g},${quantized.b}`;
      
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }
    
    // Sort by frequency
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    if (sortedColors.length === 0) {
      return this.getDefaultPalette();
    }
    
    // Extract dominant and secondary colors
    const dominant = this.parseColorString(sortedColors[0][0]);
    const secondary = sortedColors.length > 1 
      ? this.parseColorString(sortedColors[1][0])
      : this.adjustColor(dominant, 20);
    
    return {
      dominant: this.rgbToHex(dominant),
      secondary: this.rgbToHex(secondary),
      accent: this.rgbToHex(this.adjustColor(dominant, 40)),
      contrast: this.getContrastColor(dominant),
    };
  }
  
  private static quantizeColor(r: number, g: number, b: number) {
    return {
      r: Math.round(r / 32) * 32,
      g: Math.round(g / 32) * 32,
      b: Math.round(b / 32) * 32,
    };
  }
  
  private static parseColorString(colorStr: string) {
    const [r, g, b] = colorStr.split(',').map(Number);
    return { r, g, b };
  }
  
  private static adjustColor(color: { r: number; g: number; b: number }, amount: number) {
    return {
      r: Math.max(0, Math.min(255, color.r + amount)),
      g: Math.max(0, Math.min(255, color.g + amount)),
      b: Math.max(0, Math.min(255, color.b + amount)),
    };
  }
  
  private static rgbToHex(color: { r: number; g: number; b: number }) {
    return `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;
  }
  
  private static getContrastColor(color: { r: number; g: number; b: number }) {
    const luminance = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
  
  static getDefaultPalette(): ColorPalette {
    return {
      dominant: '#3b82f6',
      secondary: '#1d4ed8',
      accent: '#60a5fa',
      contrast: '#ffffff',
    };
  }
}

// Content analysis for theme detection
export class ContentAnalyzer {
  static detectGenre(content: string): string {
    const keywords = {
      scifi: ['space', 'robot', 'alien', 'technology', 'future', 'laser', 'spaceship', 'cyber', 'digital', 'quantum'],
      fantasy: ['magic', 'dragon', 'wizard', 'spell', 'castle', 'knight', 'kingdom', 'enchanted', 'mythical', 'legend'],
      noir: ['dark', 'shadow', 'mystery', 'crime', 'detective', 'night', 'rain', 'gritty', 'corruption', 'sinister'],
      modern: ['business', 'office', 'city', 'modern', 'contemporary', 'professional', 'corporate', 'urban', 'tech', 'startup'],
    };
    
    const lowerContent = content.toLowerCase();
    const scores = Object.entries(keywords).map(([genre, words]) => ({
      genre,
      score: words.filter(word => lowerContent.includes(word)).length,
    }));
    
    const bestMatch = scores.reduce((best, current) => 
      current.score > best.score ? current : best,
      { genre: 'modern', score: 0 }
    );
    
    return bestMatch.score > 0 ? bestMatch.genre : 'modern';
  }
  
  static detectTone(content: string): string {
    const positiveWords = ['happy', 'joy', 'love', 'great', 'amazing', 'wonderful', 'excellent', 'fantastic'];
    const negativeWords = ['sad', 'angry', 'hate', 'terrible', 'awful', 'horrible', 'disgusting', 'evil'];
    const neutralWords = ['okay', 'fine', 'normal', 'average', 'standard', 'regular', 'usual'];
    
    const lowerContent = content.toLowerCase();
    const positiveScore = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeScore = negativeWords.filter(word => lowerContent.includes(word)).length;
    const neutralScore = neutralWords.filter(word => lowerContent.includes(word)).length;
    
    if (positiveScore > negativeScore && positiveScore > neutralScore) return 'heroic';
    if (negativeScore > positiveScore && negativeScore > neutralScore) return 'villainous';
    return 'neutral';
  }
  
  static detectResponseType(content: string): string {
    if (content.includes('?')) return 'question';
    if (content.includes('!') || content.includes('action') || content.includes('do')) return 'action';
    if (content.includes('feel') || content.includes('emotion') || content.includes('love') || content.includes('hate')) return 'emotion';
    return 'statement';
  }
}

// Theme generation
export class ThemeGenerator {
  static generateFromPalette(palette: ColorPalette, genre: string, tone: string): ThemeConfig {
    const baseConfig = this.getBaseConfig(genre, tone);
    
    return {
      primary: palette.dominant,
      secondary: palette.secondary,
      accent: palette.accent,
      text: palette.contrast,
      border: palette.dominant,
      background: baseConfig.background || 'linear-gradient(135deg, #27272a, #3f3f46)',
      texture: baseConfig.texture || 'paper',
      genre: baseConfig.genre || 'modern',
      animations: baseConfig.animations || [],
    };
  }
  
  static generateFromCharacter(characterData: {
    name: string;
    avatar?: string;
    personality?: string;
    genre?: string;
  }): Promise<ThemeConfig> {
    return new Promise((resolve) => {
      let palette = ColorExtractor.getDefaultPalette();
      
      if (characterData.avatar) {
        ColorExtractor.extractFromImage(characterData.avatar)
          .then((extractedPalette) => {
            palette = extractedPalette;
          })
          .catch((error) => {
            console.warn('Failed to extract colors from avatar:', error);
          })
          .finally(() => {
            const genre = characterData.genre || ContentAnalyzer.detectGenre(characterData.personality || '');
            const tone = ContentAnalyzer.detectTone(characterData.personality || '');
            
            const config = this.generateFromPalette(palette, genre, tone);
            resolve(config);
          });
      } else {
        const genre = characterData.genre || ContentAnalyzer.detectGenre(characterData.personality || '');
        const tone = ContentAnalyzer.detectTone(characterData.personality || '');
        
        const config = this.generateFromPalette(palette, genre, tone);
        resolve(config);
      }
    });
  }
  
  private static getBaseConfig(genre: string, tone: string): Partial<ThemeConfig> {
    const configs = {
      scifi: {
        texture: 'hologram',
        animations: ['electric-pulse'],
        background: 'rgba(6, 182, 212, 0.1)',
      },
      fantasy: {
        texture: 'parchment',
        animations: ['magical-glow'],
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      },
      noir: {
        texture: 'metal',
        animations: [],
        background: 'linear-gradient(135deg, #1f2937, #111827)',
      },
      modern: {
        texture: 'paper',
        animations: [],
        background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
      },
    };
    
    const toneConfigs = {
      heroic: {
        animations: ['energy-pulse'],
        border: '2px solid',
      },
      villainous: {
        animations: ['shadow-pulse'],
        border: '2px solid',
      },
      neutral: {
        animations: [],
        border: '1px solid',
      },
    };
    
    return {
      ...configs[genre as keyof typeof configs],
      ...toneConfigs[tone as keyof typeof toneConfigs],
    };
  }
}

// Theme presets for quick access
export const themePresets = {
  heroic: {
    primary: '#3b82f6',
    secondary: '#1d4ed8',
    accent: '#60a5fa',
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    text: '#ffffff',
    border: '#3b82f6',
    texture: 'energy',
    genre: 'modern',
    animations: ['energy-pulse'],
  },
  villainous: {
    primary: '#dc2626',
    secondary: '#991b1b',
    accent: '#ef4444',
    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
    text: '#ffffff',
    border: '#dc2626',
    texture: 'metal',
    genre: 'noir',
    animations: ['shadow-pulse'],
  },
  mystical: {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#a78bfa',
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    text: '#ffffff',
    border: '#8b5cf6',
    texture: 'hologram',
    genre: 'fantasy',
    animations: ['magical-glow'],
  },
  futuristic: {
    primary: '#06b6d4',
    secondary: '#0891b2',
    accent: '#22d3ee',
    background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    text: '#ffffff',
    border: '#06b6d4',
    texture: 'hologram',
    genre: 'scifi',
    animations: ['electric-pulse'],
  },
  neutral: {
    primary: '#6b7280',
    secondary: '#4b5563',
    accent: '#9ca3af',
    background: 'linear-gradient(135deg, #6b7280, #4b5563)',
    text: '#ffffff',
    border: '#6b7280',
    texture: 'paper',
    genre: 'modern',
    animations: [],
  },
};

// Utility functions
export const themeUtils = {
  // Apply theme to CSS custom properties
  applyTheme: (theme: ThemeConfig) => {
    const root = document.documentElement;
    root.style.setProperty('--bubble-primary', theme.primary);
    root.style.setProperty('--bubble-secondary', theme.secondary);
    root.style.setProperty('--bubble-accent', theme.accent);
    root.style.setProperty('--bubble-background', theme.background);
    root.style.setProperty('--bubble-text', theme.text);
    root.style.setProperty('--bubble-border', theme.border);
  },
  
  // Get theme CSS classes
  getThemeClasses: (theme: ThemeConfig): string => {
    const classes = ['chat-bubble'];
    if (theme.texture) classes.push(`texture-${theme.texture}`);
    if (theme.genre) classes.push(`genre-${theme.genre}`);
    return classes.join(' ');
  },
  
  // Generate CSS for dynamic theme
  generateCSS: (theme: ThemeConfig): string => {
    return `
      .chat-bubble.dynamic-theme {
        background: ${theme.background};
        color: ${theme.text};
        border-color: ${theme.border};
        box-shadow: 0 4px 12px ${theme.primary}40;
      }
      
      .chat-bubble.dynamic-theme::before {
        background: ${theme.background};
        border-color: ${theme.border};
      }
    `;
  },
};

export default {
  ColorExtractor,
  ContentAnalyzer,
  ThemeGenerator,
  themePresets,
  themeUtils,
}; 