interface Theme {
  id: string;
  name: string;
  description: string;
  category: 'anime' | 'movie' | 'nature';
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    text: string;
    textMuted: string;
    border: string;
  };
  gradients?: {
    primary: string;
    surface: string;
  };
}

export const themes: Record<string, Theme> = {};

// Add dark room theme
export const getDarkRoomTheme = () => ({
  colors: {
    background: '#0F0A1F',
    surface: '#1A1433',
    primary: '#6B4DFF',
    secondary: '#9D89FF',
    text: '#FFFFFF',
    textMuted: '#9D89FF',
    border: '#2D2152'
  },
  gradients: {
    primary: 'linear-gradient(135deg, #6B4DFF 0%, #9D89FF 100%)',
    surface: 'linear-gradient(180deg, rgba(26,20,51,0.8) 0%, rgba(15,10,31,0.9) 100%)'
  }
});