import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import settingsService, { UserSettings, Subscription } from '../services/settingsService';

// Type aliases for union types
type ThemeType = 'light' | 'dark' | 'system';
type FontSizeType = 'small' | 'medium' | 'large' | 'x-large';

interface SettingsContextType {
  // General Settings
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  fontSize: FontSizeType;
  setFontSize: (size: FontSizeType) => void;
  primaryLanguage: string;
  setPrimaryLanguage: (lang: string) => void;
  autoTranslate: boolean;
  setAutoTranslate: (enabled: boolean) => void;
  incognitoMode: boolean;
  setIncognitoMode: (enabled: boolean) => void;
  currentDisplayTheme: 'light' | 'dark';

  // Privacy Settings
  privacy: UserSettings['privacy'];
  updatePrivacy: (privacy: Partial<UserSettings['privacy']>) => void;

  // Notification Settings
  notifications: UserSettings['notifications'];
  updateNotifications: (notifications: Partial<UserSettings['notifications']>) => void;

  // Time Management
  timeManagement: UserSettings['timeManagement'];
  updateTimeManagement: (timeManagement: Partial<UserSettings['timeManagement']>) => void;

  // Security Settings
  security: UserSettings['security'];
  updateSecurity: (security: Partial<UserSettings['security']>) => void;

  // Activity Settings
  activity: UserSettings['activity'];
  updateActivity: (activity: Partial<UserSettings['activity']>) => void;

  // Subscriptions
  subscriptions: Subscription[];
  refreshSubscriptions: () => void;

  // Loading states
  loading: boolean;
  saving: boolean;

  // Utility functions
  resetToDefaults: () => void;
  exportSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Settings
  const [theme, setTheme] = useState<ThemeType>('system');
  const [fontSize, setFontSize] = useState<FontSizeType>('medium');
  const [primaryLanguage, setPrimaryLanguage] = useState('en');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [incognitoMode, setIncognitoMode] = useState(false);

  // Privacy Settings
  const [privacy, setPrivacy] = useState<UserSettings['privacy']>({
    publicProfile: true,
    hideChatHistory: false,
    videoCallPrivacy: 'friends',
    showOnlineStatus: true,
    allowFriendRequests: true,
  });

  // Notification Settings
  const [notifications, setNotifications] = useState<UserSettings['notifications']>({
    aiMessages: true,
    groupMentions: true,
    videoInvites: true,
    emailUpdates: false,
    pushNotifications: true,
  });

  // Time Management
  const [timeManagement, setTimeManagement] = useState<UserSettings['timeManagement']>({
    dailyLimit: 6,
    focusMode: false,
    focusStartTime: '22:00',
    focusEndTime: '07:00',
    weeklyReport: true,
  });

  // Security Settings
  const [security, setSecurity] = useState<UserSettings['security']>({
    twoFactorEnabled: false,
    trustedDevices: [],
    passwordLastChanged: new Date().toISOString(),
    loginHistory: [],
  });

  // Activity Settings
  const [activity, setActivity] = useState<UserSettings['activity']>({
    saveHistory: true,
    autoArchive: false,
    retentionPeriod: 30,
  });

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // Current display theme (computed from system preference)
  const [currentDisplayTheme, setCurrentDisplayTheme] = useState<'light' | 'dark'>('dark');

  // Load settings from backend
  const loadSettings = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const userSettings = await settingsService.getUserSettings();
      
      // Update all settings from backend
      setTheme(userSettings.theme);
      setFontSize(userSettings.fontSize);
      setPrimaryLanguage(userSettings.primaryLanguage);
      setAutoTranslate(userSettings.autoTranslate);
      setIncognitoMode(userSettings.incognitoMode);
      setPrivacy(userSettings.privacy);
      setNotifications(userSettings.notifications);
      setTimeManagement(userSettings.timeManagement);
      setSecurity(userSettings.security);
      setActivity(userSettings.activity);

      // Apply font size to document
      const root = document.documentElement;
      root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-x-large');
      root.classList.add(`font-size-${userSettings.fontSize}`);

      // Load subscriptions
      const subs = await settingsService.getSubscriptions();
      setSubscriptions(subs);
    } catch (error) {
      console.error('Failed to load settings from backend, using localStorage fallback:', error);
      
      // Fallback to localStorage
      const localSettings = {
        theme: localStorage.getItem('theme') as ThemeType || 'system',
        fontSize: localStorage.getItem('fontSize') as FontSizeType || 'medium',
        primaryLanguage: localStorage.getItem('primaryLanguage') || 'en',
        autoTranslate: localStorage.getItem('autoTranslate') === 'true',
        incognitoMode: localStorage.getItem('incognitoMode') === 'true',
      };
      
      setTheme(localSettings.theme);
      setFontSize(localSettings.fontSize);
      setPrimaryLanguage(localSettings.primaryLanguage);
      setAutoTranslate(localSettings.autoTranslate);
      setIncognitoMode(localSettings.incognitoMode);
      
      // Apply font size to document
      const root = document.documentElement;
      root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-x-large');
      root.classList.add(`font-size-${localSettings.fontSize}`);
    } finally {
      setLoading(false);
    }
  };

  // Save setting to backend
  const saveSetting = async (key: string, value: any) => {
    if (!currentUser) return;

    try {
      setSaving(true);
      await settingsService.updateSetting(key, value);
      // Also save to localStorage as backup
      localStorage.setItem(key, typeof value === 'boolean' ? value.toString() : value);
    } catch (error) {
      console.error(`Failed to save setting ${key} to backend, saving to localStorage only:`, error);
      // Fallback to localStorage only
      localStorage.setItem(key, typeof value === 'boolean' ? value.toString() : value);
    } finally {
      setSaving(false);
    }
  };

  // Update privacy settings
  const updatePrivacy = (newPrivacy: Partial<UserSettings['privacy']>) => {
    const updatedPrivacy = { ...privacy, ...newPrivacy };
    setPrivacy(updatedPrivacy);
    
    setSaving(true);
    settingsService.updatePrivacySettings(updatedPrivacy)
      .catch((error) => {
        console.error('Failed to update privacy settings:', error);
        // Revert on error
        setPrivacy(prevPrivacy => ({ ...prevPrivacy, ...privacy }));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  // Update notification settings
  const updateNotifications = (newNotifications: Partial<UserSettings['notifications']>) => {
    const updatedNotifications = { ...notifications, ...newNotifications };
    setNotifications(updatedNotifications);
    
    setSaving(true);
    settingsService.updateNotificationPreferences(updatedNotifications)
      .catch((error) => {
        console.error('Failed to update notification settings:', error);
        // Revert on error
        setNotifications(prevNotifications => ({ ...prevNotifications, ...notifications }));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  // Update time management settings
  const updateTimeManagement = (newTimeManagement: Partial<UserSettings['timeManagement']>) => {
    const updatedTimeManagement = { ...timeManagement, ...newTimeManagement };
    setTimeManagement(updatedTimeManagement);
    
    setSaving(true);
    settingsService.updateTimeManagement(updatedTimeManagement)
      .catch((error) => {
        console.error('Failed to update time management settings:', error);
        // Revert on error
        setTimeManagement(prevTimeManagement => ({ ...prevTimeManagement, ...timeManagement }));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  // Update security settings
  const updateSecurity = (newSecurity: Partial<UserSettings['security']>) => {
    const updatedSecurity = { ...security, ...newSecurity };
    setSecurity(updatedSecurity);
    
    setSaving(true);
    // Note: Security settings might need special handling
    settingsService.updateSetting('security', updatedSecurity)
      .catch((error) => {
        console.error('Failed to update security settings:', error);
        // Revert on error
        setSecurity(prevSecurity => ({ ...prevSecurity, ...security }));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  // Update activity settings
  const updateActivity = (newActivity: Partial<UserSettings['activity']>) => {
    const updatedActivity = { ...activity, ...newActivity };
    setActivity(updatedActivity);
    
    setSaving(true);
    settingsService.updateSetting('activity', updatedActivity)
      .catch((error) => {
        console.error('Failed to update activity settings:', error);
        // Revert on error
        setActivity(prevActivity => ({ ...prevActivity, ...activity }));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  // Refresh subscriptions
  const refreshSubscriptions = () => {
    settingsService.getSubscriptions()
      .then((subs) => {
        setSubscriptions(subs);
      })
      .catch((error) => {
        console.error('Failed to refresh subscriptions:', error);
      });
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setSaving(true);
    // This would call a backend endpoint to reset all settings
    settingsService.updateSetting('reset', true)
      .then(() => loadSettings()) // Reload settings
      .catch((error) => {
        console.error('Failed to reset settings:', error);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  // Export settings
  const exportSettings = () => {
    settingsService.exportUserData()
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nexus-settings.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error('Failed to export settings:', error);
      });
  };

  // Handle theme changes
  const handleThemeChange = async (newTheme: ThemeType) => {
    setTheme(newTheme);
    await saveSetting('theme', newTheme);
  };

  // Handle font size changes
  const handleFontSizeChange = async (newSize: FontSizeType) => {
    setFontSize(newSize);
    await saveSetting('fontSize', newSize);
    // Apply font size to document
    const root = document.documentElement;
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-x-large');
    root.classList.add(`font-size-${newSize}`);
  };

  // Handle language changes
  const handleLanguageChange = async (newLang: string) => {
    setPrimaryLanguage(newLang);
    await saveSetting('primaryLanguage', newLang);
  };

  // Handle auto translate changes
  const handleAutoTranslateChange = async (enabled: boolean) => {
    setAutoTranslate(enabled);
    await saveSetting('autoTranslate', enabled);
  };

  // Handle incognito mode changes
  const handleIncognitoModeChange = async (enabled: boolean) => {
    setIncognitoMode(enabled);
    await saveSetting('incognitoMode', enabled);
  };

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (e: MediaQueryListEvent) => {
      setCurrentDisplayTheme(e.matches ? 'dark' : 'light');
    };

    setCurrentDisplayTheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, []);

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-x-large');
    root.classList.add(`font-size-${fontSize}`);
  }, [fontSize]);

  // Load settings when user changes
  useEffect(() => {
    if (currentUser) {
      loadSettings();
    }
  }, [currentUser]);

  // Listen for real-time setting updates
  useEffect(() => {
    const handleSettingUpdate = (event: CustomEvent) => {
      const { key, value } = event.detail;
      
      switch (key) {
        case 'theme':
          setTheme(value);
          break;
        case 'fontSize':
          setFontSize(value);
          break;
        case 'primaryLanguage':
          setPrimaryLanguage(value);
          break;
        case 'autoTranslate':
          setAutoTranslate(value);
          break;
        case 'incognitoMode':
          setIncognitoMode(value);
          break;
        case 'privacy':
          setPrivacy(value);
          break;
        case 'notifications':
          setNotifications(value);
          break;
        case 'timeManagement':
          setTimeManagement(value);
          break;
        case 'security':
          setSecurity(value);
          break;
        case 'activity':
          setActivity(value);
          break;
      }
    };

    window.addEventListener('settingUpdated', handleSettingUpdate as EventListener);
    return () => window.removeEventListener('settingUpdated', handleSettingUpdate as EventListener);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const actualTheme = theme === 'system' ? currentDisplayTheme : theme;
    
    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
    root.setAttribute('data-theme', actualTheme);
  }, [theme, currentDisplayTheme]);

  const value: SettingsContextType = useMemo(() => ({
    // General Settings
    theme,
    setTheme: handleThemeChange,
    fontSize,
    setFontSize: handleFontSizeChange,
    primaryLanguage,
    setPrimaryLanguage: handleLanguageChange,
    autoTranslate,
    setAutoTranslate: handleAutoTranslateChange,
    incognitoMode,
    setIncognitoMode: handleIncognitoModeChange,
    currentDisplayTheme,

    // Privacy Settings
    privacy,
    updatePrivacy,

    // Notification Settings
    notifications,
    updateNotifications,

    // Time Management
    timeManagement,
    updateTimeManagement,

    // Security Settings
    security,
    updateSecurity,

    // Activity Settings
    activity,
    updateActivity,

    // Subscriptions
    subscriptions,
    refreshSubscriptions,

    // Loading states
    loading,
    saving,

    // Utility functions
    resetToDefaults,
    exportSettings,
  }), [
    theme,
    fontSize,
    primaryLanguage,
    autoTranslate,
    incognitoMode,
    privacy,
    notifications,
    timeManagement,
    security,
    activity,
    subscriptions,
    loading,
    saving,
  ]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};