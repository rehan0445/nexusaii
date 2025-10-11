/**
 * Settings utility functions
 */

export type ThemeType = 'light' | 'dark' | 'system';
export type FontSizeType = 'small' | 'medium' | 'large' | 'x-large';

/**
 * Apply theme to the document
 */
export const applyTheme = (theme: ThemeType) => {
  // Remove existing theme classes
  document.documentElement.classList.remove('light', 'dark');
  
  // If theme is system, check system preference
  if (theme === 'system') {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.add(systemPrefersDark ? 'dark' : 'light');
  } else {
    // Apply the selected theme
    document.documentElement.classList.add(theme);
  }
};

/**
 * Apply font size to the document
 */
export const applyFontSize = (fontSize: FontSizeType) => {
  // Remove existing font size classes
  document.documentElement.classList.remove(
    'font-size-small', 
    'font-size-medium', 
    'font-size-large', 
    'font-size-x-large'
  );
  
  // Apply the selected font size
  document.documentElement.classList.add(`font-size-${fontSize}`);
};

/**
 * Get the user's system theme preference
 */
export const getSystemTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Set up listener for system theme changes
 */
export const listenForSystemThemeChanges = (callback: (isDark: boolean) => void) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Initial call
  callback(mediaQuery.matches);
  
  // Listen for changes
  const listener = (e: MediaQueryListEvent) => callback(e.matches);
  mediaQuery.addEventListener('change', listener);
  
  // Return function to remove listener
  return () => mediaQuery.removeEventListener('change', listener);
};

/**
 * Load settings from localStorage
 */
export const loadSettings = () => {
  return {
    theme: localStorage.getItem('theme') as ThemeType || 'system',
    fontSize: localStorage.getItem('fontSize') as FontSizeType || 'medium',
    primaryLanguage: localStorage.getItem('primaryLanguage') || 'en',
    incognitoMode: localStorage.getItem('incognitoMode') === 'true',
    autoTranslate: localStorage.getItem('autoTranslate') === 'true',
  };
};

/**
 * Save a setting to localStorage
 */
export const saveSetting = (key: string, value: any) => {
  localStorage.setItem(key, typeof value === 'boolean' ? value.toString() : value);
}; 