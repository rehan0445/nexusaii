import { useState, useEffect } from 'react';

// Helper function to get image themes
const getImageThemes = async () => {
  try {
    const { imageThemes } = await import('../themes/image-themes');
    return imageThemes;
  } catch (error) {
    console.error('Failed to load image themes:', error);
    return {};
  }
};

interface ImageTheme {
  id: string;
  name: string;
  imageUrl: string;
  overlay?: string;
  textColor?: string;
  accentColor?: string;
}

export const useTheme = (groupId?: string, userId?: string) => {
  const [selectedTheme, setSelectedTheme] = useState<ImageTheme | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Migrate old theme format on initialization
  useEffect(() => {
    if (userId) {
      migrateOldThemes(userId);
    }
  }, [userId]);

  // Load saved theme for this group and user
  useEffect(() => {
    const loadSavedTheme = async () => {
      if (groupId && userId) {
        // Try to load from localStorage first (faster)
        const storageKey = `theme-${userId}-${groupId}`;
        const savedThemeId = localStorage.getItem(storageKey);

        if (savedThemeId) {
          const themes = await getImageThemes();
          if (themes[savedThemeId]) {
            const theme = themes[savedThemeId];
            console.log('🎨 Loading saved theme from localStorage:', theme.name, 'for room:', groupId);
            setSelectedTheme(theme);
            applyThemeStyles(theme);
          } else {
            console.warn('🎨 Saved theme ID not found in themes:', savedThemeId);
          }
        } else {
          console.log('🎨 No saved theme found for room:', groupId, 'user:', userId);
        }
      }
    };

    loadSavedTheme();
  }, [groupId, userId]);

  // Helper function to apply theme styles
  const applyThemeStyles = (theme: ImageTheme) => {
    const root = document.documentElement;
    root.style.setProperty('--theme-bg-image', `url(${theme.imageUrl})`);
    root.style.setProperty('--theme-overlay', theme.overlay || 'rgba(0, 0, 0, 0.3)');
    root.style.setProperty('--theme-text-color', theme.textColor || '#ffffff');
    root.style.setProperty('--theme-accent-color', theme.accentColor || '#f59e0b');
  };

  // Apply theme to the chat background
  const applyTheme = (theme: ImageTheme) => {
    console.log('🎨 Applying theme:', theme.name, theme.id);
    setSelectedTheme(theme);

    // Save theme for this user and group
    if (groupId && userId) {
      const storageKey = `theme-${userId}-${groupId}`;
      localStorage.setItem(storageKey, theme.id);
      console.log('💾 Saved theme to localStorage:', storageKey, theme.id);
    }

    // Apply theme styles to the document
    applyThemeStyles(theme);

    // Force re-render by updating a state that components depend on
    setIsLoading(prev => !prev);
    console.log('✅ Theme applied to DOM:', {
      bgImage: theme.imageUrl,
      overlay: theme.overlay,
      textColor: theme.textColor,
      accentColor: theme.accentColor
    });
  };

  // Remove theme
  const removeTheme = () => {
    setSelectedTheme(null);

    if (groupId && userId) {
      const storageKey = `theme-${userId}-${groupId}`;
      localStorage.removeItem(storageKey);
      console.log('🗑️ Removed theme from localStorage:', storageKey);
    }

    // Reset theme styles
    const root = document.documentElement;
    root.style.removeProperty('--theme-bg-image');
    root.style.removeProperty('--theme-overlay');
    root.style.removeProperty('--theme-text-color');
    root.style.removeProperty('--theme-accent-color');
  };

  // Get theme styles for inline application
  const getThemeStyles = () => {
    if (!selectedTheme) return {};

    return {
      backgroundImage: `url(${selectedTheme.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      position: 'relative' as const,
    };
  };

  // Get overlay styles
  const getOverlayStyles = () => {
    if (!selectedTheme) return {};

    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: selectedTheme.overlay || 'rgba(0, 0, 0, 0.3)',
      zIndex: 1,
    };
  };

  // Get current theme for a room (without applying styles)
  const getCurrentTheme = async (roomId: string, userId: string): Promise<ImageTheme | null> => {
    if (!roomId || !userId) return null;

    const storageKey = `theme-${userId}-${roomId}`;
    const savedThemeId = localStorage.getItem(storageKey);

    if (savedThemeId) {
      const themes = await getImageThemes();
      return themes[savedThemeId] || null;
    }

    return null;
  };

  // Migration helper: Clear old theme format (for backward compatibility)
  const migrateOldThemes = (userId: string) => {
    // Check for old format keys and migrate them
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('theme-') && !key.includes('-') || key.split('-').length === 2) {
        // This is an old format key, migrate it
        const oldKey = key;
        const themeId = localStorage.getItem(oldKey);
        if (themeId && userId) {
          const newKey = `theme-${userId}-${oldKey.replace('theme-', '')}`;
          localStorage.setItem(newKey, themeId);
          localStorage.removeItem(oldKey);
          console.log('🔄 Migrated old theme key:', oldKey, 'to:', newKey);
        }
      }
    }
  };

  return {
    selectedTheme,
    applyTheme,
    removeTheme,
    getThemeStyles,
    getOverlayStyles,
    getCurrentTheme,
    migrateOldThemes,
    isLoading,
    setIsLoading,
  };
};
