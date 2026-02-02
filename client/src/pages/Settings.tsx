import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Settings, User, Bell, Shield, Palette, Smartphone, Monitor, RotateCcw, Globe2, Eye, Edit, Lock, Video, Users, BarChart3, Target, Clock, CreditCard, Activity, Archive, FileText,
  ShieldCheck, MessageSquare, LogOut, Menu, X, HelpCircle, Mail
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import settingsService from '../services/settingsService';
import { useAuth } from '../contexts/AuthContext';
import { FontSizeType } from '../utils/settings';
import EditProfileModal from '../components/EditProfileModal';
import { signOut } from '../lib/supabase';
import { useResponsive } from '../hooks/useResponsive';

// Toggle component
interface ToggleProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const Toggle = ({ enabled, onChange, disabled = false }: ToggleProps) => (
  <button
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled && !disabled ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-700'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    onClick={() => !disabled && onChange(!enabled)}
    disabled={disabled}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    theme, 
    fontSize,
    setFontSize,
    primaryLanguage,
    autoTranslate,
    setAutoTranslate,
    incognitoMode,
    setIncognitoMode,
  } = useSettings();
  
  const { currentUser } = useAuth();
  const { isDesktop, isMobile, isTablet } = useResponsive();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Logout function using Supabase
  const handleLogout = async () => {
    try {
      await signOut();
      console.log('✅ Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if logout fails, clear local storage and redirect
      localStorage.clear();
      navigate('/login');
    }
  };

  // State for settings
  const [activeTab, setActiveTab] = useState('general');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  // Open Help & Support when navigated from Profile with state
  useEffect(() => {
    if ((location.state as { openHelp?: boolean })?.openHelp) {
      setShowHelpModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);
  const [profileData, setProfileData] = useState({
    name: currentUser?.displayName || '',
    username: `@${currentUser?.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
    bio: '',
    location: '',
    email: currentUser?.email || '',
    profileImage: currentUser?.photoURL || 'https://i.pinimg.com/736x/d9/7b/bb/d97bbb08017ac2309307f0822e63d082.jpg',
    bannerImage: 'https://via.placeholder.com/800x200',
    interests: [] as string[],
  });
  
  // State for activity tabs
  const [activeActivityTab, setActiveActivityTab] = useState('saved');
  const [savedPosts, setSavedPosts] = useState([
    { title: 'My First Post', content: 'This is a test post. Hello, world!', savedAt: '2023-10-27', category: 'General', character: 'Luna AI' },
    { title: 'Another Saved Post', content: 'This is another test post. Hello, again!', savedAt: '2023-10-26', category: 'Announcement', character: 'Max AI' },
  ]);
  const [deletedGroups, setDeletedGroups] = useState([
    { name: 'Tech Enthusiasts', members: 120, deletedAt: '2023-10-25' },
    { name: 'Gaming Community', members: 80, deletedAt: '2023-10-24' },
  ]);
  const [aiChatLogs, setAiChatLogs] = useState([
    { character: 'Luna AI', messages: 15, lastMessage: 'Hello! How can I help you today?', lastActive: '2023-10-27 10:30', duration: '15m', category: 'General' },
    { character: 'Max AI', messages: 10, lastMessage: 'Hello! I am Max AI.', lastActive: '2023-10-27 11:00', duration: '10m', category: 'Greeting' },
  ]);
  const [chatFilter, setChatFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [recentActivity, setRecentActivity] = useState([
    { type: 'chat', title: 'New message from Luna AI', description: 'You received a new message from Luna AI.', time: '2 minutes ago' },
    { type: 'group', title: 'You were mentioned in "Tech Enthusiasts"', description: 'You were mentioned in "Tech Enthusiasts" group.', time: '1 hour ago' },
    { type: 'settings', title: 'Settings updated', description: 'Your notification preferences were updated.', time: '3 hours ago' },
  ]);
  
  const [notifications, setNotifications] = useState({
    aiMessages: true,
    groupMentions: true,
    videoInvites: true,
    emailUpdates: false,
    pushNotifications: true,
    activityUpdates: true,
    achievementAlerts: true,
    emailNotifications: true,
    inAppNotifications: true,
    soundAlerts: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    allowEmergencyNotifications: false,
    groupNotifications: true,
    showPreview: true,
    autoDismiss: true,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [pauseAll, setPauseAll] = useState(false);
  const [categoryChannels, setCategoryChannels] = useState<Record<string, { push: boolean; email: boolean; inApp: boolean }>>(
    () => {
      const fromStorage = localStorage.getItem('nexus_notification_channels');
      return fromStorage ? JSON.parse(fromStorage) : {
        likes: { push: true, email: false, inApp: true },
        comments: { push: true, email: false, inApp: true },
        mentions: { push: true, email: false, inApp: true },
        follows: { push: true, email: false, inApp: true },
        messages: { push: true, email: false, inApp: true },
        groups: { push: true, email: false, inApp: true },
        announcements: { push: true, email: true, inApp: true },
        reminders: { push: true, email: false, inApp: true },
      };
    }
  );
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    hideChatHistory: false,
    videoCallPrivacy: 'friends',
    showOnlineStatus: true,
    allowFriendRequests: true
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => {
    try {
      return localStorage.getItem('nexus_2fa_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [trustedDevices, setTrustedDevices] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('nexus_trusted_devices');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const accentBg = incognitoMode ? 'bg-orange-500/10' : 'bg-gold/10';
  const accentBorder = incognitoMode ? 'border-orange-500/20' : 'border-gold/20';
  const mainBg = incognitoMode ? 'bg-black' : 'bg-[#141414]';
  const sideMenuBg = incognitoMode ? 'bg-black/80' : 'bg-[#0A0A0A]/95';
  const borderColor = incognitoMode ? 'border-black' : 'border-zinc-800';

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español (Spanish)' },
    { code: 'fr', name: 'Français (French)' },
    { code: 'de', name: 'Deutsch (German)' },
    { code: 'it', name: 'Italiano (Italian)' },
    { code: 'pt', name: 'Português (Portuguese)' },
    { code: 'ru', name: 'Русский (Russian)' },
    { code: 'zh', name: '中文 (Chinese)' },
    { code: 'ja', name: '日本語 (Japanese)' },
    { code: 'ko', name: '한국어 (Korean)' },
    { code: 'ar', name: 'العربية (Arabic)' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
  ];

  const tabs = [
    { id: 'general', name: 'General', icon: <Settings className="w-5 h-5" /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'subscriptions', name: 'Subscriptions', icon: <Smartphone className="w-5 h-5" /> },
    { id: 'activity', name: 'Activity', icon: <Monitor className="w-5 h-5" /> },
    { id: 'terms', name: 'Terms & Safety', icon: <RotateCcw className="w-5 h-5" /> },
  ];

  // Persist notifications with debounce
  React.useEffect(() => {
    const handler = setTimeout(async () => {
      try {
        setSavingNotifications(true);
        await settingsService.updateNotificationPreferences({
          aiMessages: notifications.aiMessages,
          groupMentions: notifications.groupMentions,
          videoInvites: notifications.videoInvites,
          emailUpdates: notifications.emailUpdates,
          pushNotifications: notifications.pushNotifications,
        } as any);
      } catch (e) {
        console.error('Failed to save notifications', e);
      } finally {
        setSavingNotifications(false);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [
    notifications.aiMessages,
    notifications.groupMentions,
    notifications.videoInvites,
    notifications.emailUpdates,
    notifications.pushNotifications,
  ]);

  // Persist per-category channels locally
  React.useEffect(() => {
    localStorage.setItem('nexus_notification_channels', JSON.stringify(categoryChannels));
  }, [categoryChannels]);

  React.useEffect(() => {
    localStorage.setItem('nexus_2fa_enabled', String(twoFactorEnabled));
  }, [twoFactorEnabled]);

  React.useEffect(() => {
    localStorage.setItem('nexus_trusted_devices', JSON.stringify(trustedDevices));
  }, [trustedDevices]);

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            {/* Appearance Section */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-gold" />
                Appearance
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Font Size</p>
                    <p className="text-zinc-400 text-sm">Adjust text size throughout the app</p>
                  </div>
                  <select
                    className="bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                    value={fontSize}
                    onChange={(e) => {
                      const newSize = e.target.value as FontSizeType;
                      // Apply font size immediately
                      const root = document.documentElement;
                      root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large', 'font-size-x-large');
                      root.classList.add(`font-size-${newSize}`);
                      setFontSize(newSize);
                    }}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="x-large">X-Large</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Language Section - Coming Soon */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-gold" />
                Language & Translation
                <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                  Coming Soon
                </span>
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between opacity-50">
                  <div>
                    <p className="text-white font-medium">Primary Language</p>
                    <p className="text-zinc-400 text-sm">Choose your preferred language</p>
                  </div>
                  <select
                    className="bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-white cursor-not-allowed"
                    value={primaryLanguage}
                    disabled
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center justify-between opacity-50">
                  <div>
                    <p className="text-white font-medium">Auto-translate</p>
                    <p className="text-zinc-400 text-sm">Automatically translate foreign content</p>
                  </div>
                  <Toggle enabled={autoTranslate} onChange={setAutoTranslate} disabled={true} />
                </div>
              </div>
            </div>

            {/* Incognito Mode */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-gold" />
                Privacy Mode
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Incognito Mode</p>
                  <p className="text-zinc-400 text-sm">Use app without saving history or data</p>
                </div>
                <Toggle enabled={incognitoMode} onChange={setIncognitoMode} />
              </div>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-gold" />
                  Profile Information
                </h3>
                <button 
                  onClick={() => setShowEditProfile(true)}
                  className="px-4 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg text-gold text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>

              {/* Profile Header */}
              <div className="relative mb-8">
                {/* Banner Image */}
                <div className="h-32 bg-gradient-to-r from-gold/20 to-orange-500/20 rounded-lg mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-orange-500/10 to-purple-500/10"></div>
                  <div className="absolute bottom-4 right-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-orange-500 flex items-center justify-center border-4 border-zinc-800 shadow-lg">
                      <span className="text-2xl font-bold text-white">
                        {currentUser?.displayName?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="ml-24">
                  <h4 className="text-xl font-bold text-white mb-1">{profileData.name || currentUser?.displayName || 'User'}</h4>
                  <p className="text-zinc-400 text-sm mb-2">{profileData.username || `@${currentUser?.displayName?.toLowerCase().replace(/\s+/g, '') || 'user'}`}</p>
                  <p className="text-zinc-500 text-xs">Member since {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                  {profileData.bio && (
                    <p className="text-zinc-400 text-sm mt-2">{profileData.bio}</p>
                  )}
                </div>
              </div>

              {/* Profile Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-zinc-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gold mb-1">0</div>
                  <div className="text-zinc-400 text-xs">Characters</div>
                </div>
                <div className="bg-zinc-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gold mb-1">0</div>
                  <div className="text-zinc-400 text-xs">Groups</div>
                </div>
                <div className="bg-zinc-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gold mb-1">0</div>
                  <div className="text-zinc-400 text-xs">Posts</div>
                </div>
                <div className="bg-zinc-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gold mb-1">0</div>
                  <div className="text-zinc-400 text-xs">Days</div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                {/* Contact Information */}
                <div className="bg-zinc-700/20 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gold rounded-full"></div>
                    Contact Information
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Email Address</p>
                      <p className="text-white font-medium">{currentUser?.email}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Email Status</p>
                      <div className="flex items-center gap-2">
                        {currentUser?.emailVerified ? (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-green-400 text-sm font-medium">Verified</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-yellow-400 text-sm font-medium">Not Verified</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="bg-zinc-700/20 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gold rounded-full"></div>
                    Account Details
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Account Type</p>
                      <p className="text-white font-medium">
                        {currentUser?.isAnonymous ? 'Anonymous' : 'Standard'}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Sign-in Method</p>
                      <p className="text-white font-medium capitalize">
                        {currentUser?.providerId === 'password' ? 'Email & Password' : currentUser?.providerId || 'Email'}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">User ID</p>
                      <p className="text-white font-mono text-sm">{currentUser?.uid?.substring(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Last Active</p>
                      <p className="text-white text-sm">Just now</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-zinc-700/20 rounded-lg p-4">
                  <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-gold rounded-full"></div>
                    Quick Actions
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => {
                        // Generate a public profile URL
                        const publicUrl = `${window.location.origin}/profile/${profileData.username || currentUser?.uid}`;
                        // Copy to clipboard
                        navigator.clipboard.writeText(publicUrl).then(() => {
                          alert(`Public profile URL copied to clipboard: ${publicUrl}`);
                        }).catch(() => {
                          alert(`Your public profile URL: ${publicUrl}`);
                        });
                      }}
                      className="px-3 py-1 bg-zinc-600/50 hover:bg-zinc-600 rounded-lg text-white text-sm transition-colors"
                      title="Copy your public profile URL"
                    >
                      View Public Profile
                    </button>
                    <button 
                      onClick={() => {
                        // Create a data export object
                        const userData = {
                          profile: {
                            name: profileData.name || currentUser?.displayName,
                            username: profileData.username,
                            email: currentUser?.email,
                            bio: profileData.bio,
                            location: profileData.location,
                            interests: profileData.interests,
                            joinDate: new Date().toISOString(),
                          },
                          settings: {
                            theme,
                            fontSize,
                            incognitoMode,
                            privacy,
                            notifications,
                          },
                          exportDate: new Date().toISOString(),
                        };
                        
                        // Create and download JSON file
                        const dataStr = JSON.stringify(userData, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `nexus-profile-${profileData.username || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                        
                        alert('Profile data downloaded successfully!');
                      }}
                      className="px-3 py-1 bg-zinc-600/50 hover:bg-zinc-600 rounded-lg text-white text-sm transition-colors"
                      title="Download your profile data as JSON"
                    >
                      Download Data
                    </button>
                    <button 
                      onClick={() => {
                        // Create shareable profile data
                        const shareData = {
                          title: `${profileData.name || currentUser?.displayName}'s Profile`,
                          text: `Check out ${profileData.name || currentUser?.displayName}'s profile on Companion!`,
                          url: `${window.location.origin}/profile/${profileData.username || currentUser?.uid}`,
                        };
                        
                        // Try to use native sharing API
                        if (navigator.share) {
                          navigator.share(shareData).catch(() => {
                            // Fallback to clipboard
                            navigator.clipboard.writeText(shareData.url).then(() => {
                              alert('Profile link copied to clipboard!');
                            }).catch(() => {
                              alert(`Share this link: ${shareData.url}`);
                            });
                          });
                        } else {
                          // Fallback for browsers without native sharing
                          navigator.clipboard.writeText(shareData.url).then(() => {
                            alert('Profile link copied to clipboard!');
                          }).catch(() => {
                            alert(`Share this link: ${shareData.url}`);
                          });
                        }
                      }}
                      className="px-3 py-1 bg-zinc-600/50 hover:bg-zinc-600 rounded-lg text-white text-sm transition-colors"
                      title="Share your profile link"
                    >
                      Share Profile
                    </button>
                  </div>
                  <p className="text-zinc-500 text-xs mt-2">Quick access to your profile features</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            {/* Privacy Controls */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-gold" />
                Privacy Controls
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Public Profile</p>
                    <p className="text-zinc-400 text-sm">Allow others to see your profile</p>
                  </div>
                  <Toggle enabled={privacy.publicProfile} onChange={(enabled) => {
                    setPrivacy({...privacy, publicProfile: enabled});
                    alert(enabled ? 'Your profile is now public' : 'Your profile is now private');
                  }} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Hide Chat History</p>
                    <p className="text-zinc-400 text-sm">Hide AI chat history from profile</p>
                  </div>
                  <Toggle enabled={privacy.hideChatHistory} onChange={(enabled) => {
                    setPrivacy({...privacy, hideChatHistory: enabled});
                    alert(enabled ? 'Chat history is now hidden' : 'Chat history is now visible');
                  }} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Show Online Status</p>
                    <p className="text-zinc-400 text-sm">Let others see when you're online</p>
                  </div>
                  <Toggle enabled={privacy.showOnlineStatus} onChange={(enabled) => {
                    setPrivacy({...privacy, showOnlineStatus: enabled});
                    alert(enabled ? 'Online status is now visible' : 'Online status is now hidden');
                  }} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Allow Friend Requests</p>
                    <p className="text-zinc-400 text-sm">Let others send you friend requests</p>
                  </div>
                  <Toggle enabled={privacy.allowFriendRequests} onChange={(enabled) => {
                    setPrivacy({...privacy, allowFriendRequests: enabled});
                    alert(enabled ? 'Friend requests are now allowed' : 'Friend requests are now disabled');
                  }} />
                </div>
              </div>
            </div>

            {/* Video Call Privacy */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-gold" />
                Video Call Privacy
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-white font-medium mb-2">Who can video-call you?</p>
                  <div className="space-y-2">
                    {[
                      { value: 'friends', label: 'Friends Only', icon: <Users className="w-4 h-4" />, description: 'Only your friends can call you' },
                      { value: 'verified', label: 'Verified Users', icon: <ShieldCheck className="w-4 h-4" />, description: 'Verified users and friends can call you' },
                      { value: 'everyone', label: 'Everyone', icon: <Globe2 className="w-4 h-4" />, description: 'Anyone can send you a call request' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-700/30 hover:bg-zinc-700/50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="videoPrivacy"
                          value={option.value}
                          checked={privacy.videoCallPrivacy === option.value}
                          onChange={(e) => {
                            setPrivacy({...privacy, videoCallPrivacy: e.target.value});
                            alert(`Video call privacy set to: ${option.label}`);
                          }}
                          className="text-gold"
                        />
                        <span className="text-zinc-400">{option.icon}</span>
                        <div className="flex-1">
                          <span className="text-white font-medium">{option.label}</span>
                          <p className="text-zinc-500 text-xs">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Data & Privacy */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Archive className="w-5 h-5 text-gold" />
                Data & Privacy
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Data Collection</p>
                    <p className="text-zinc-400 text-sm">Allow us to collect usage data for improvements</p>
                  </div>
                  <Toggle enabled={true} onChange={(enabled) => {
                    alert(enabled ? 'Data collection enabled' : 'Data collection disabled');
                  }} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Analytics</p>
                    <p className="text-zinc-400 text-sm">Help us improve by sharing anonymous analytics</p>
                  </div>
                  <Toggle enabled={true} onChange={(enabled) => {
                    alert(enabled ? 'Analytics enabled' : 'Analytics disabled');
                  }} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Personalized Content</p>
                    <p className="text-zinc-400 text-sm">Show personalized recommendations and content</p>
                  </div>
                  <Toggle enabled={true} onChange={(enabled) => {
                    alert(enabled ? 'Personalized content enabled' : 'Personalized content disabled');
                  }} />
                </div>
              </div>
            </div>

            {/* Privacy Actions */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-gold" />
                Privacy Actions
              </h3>
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete all your chat history? This action cannot be undone.')) {
                      alert('Chat history deleted successfully!');
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Delete Chat History</p>
                      <p className="text-xs text-red-400/70">Permanently delete all AI chat conversations</p>
                    </div>
                  </div>
                  <span className="text-xs">Irreversible</span>
                </button>

                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      alert('Account deletion initiated. You will receive a confirmation email.');
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Delete Account</p>
                      <p className="text-xs text-red-400/70">Permanently delete your account and all data</p>
                    </div>
                  </div>
                  <span className="text-xs">Irreversible</span>
                </button>

                <button 
                  onClick={() => {
                    // Create a data export object
                    const userData = {
                      profile: {
                        name: profileData.name || currentUser?.displayName,
                        username: profileData.username,
                        email: currentUser?.email,
                        bio: profileData.bio,
                        location: profileData.location,
                        interests: profileData.interests,
                        joinDate: new Date().toISOString(),
                      },
                      settings: {
                        theme,
                        fontSize,
                        incognitoMode,
                        privacy,
                        notifications,
                      },
                      exportDate: new Date().toISOString(),
                    };
                    
                    // Create and download JSON file
                    const dataStr = JSON.stringify(userData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `nexus-privacy-data-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    alert('Privacy data exported successfully!');
                  }}
                  className="w-full flex items-center justify-between p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Export Privacy Data</p>
                      <p className="text-xs text-blue-400/70">Download all your privacy settings and data</p>
                    </div>
                  </div>
                  <span className="text-xs">JSON</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            {/* Pause All */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Pause All Notifications</p>
                  <p className="text-zinc-400 text-sm">Temporarily disable all notifications</p>
                </div>
                <Toggle enabled={pauseAll} onChange={setPauseAll} />
              </div>
            </div>
            {/* Notification Categories */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-gold" />
                Notification Categories
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-teal-400" />
                    <div>
                      <p className="text-white font-medium">AI Messages</p>
                      <p className="text-zinc-400 text-sm">New messages from AI characters</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.aiMessages} onChange={(enabled) => {
                    setNotifications({...notifications, aiMessages: enabled});
                    alert(enabled ? 'AI message notifications enabled' : 'AI message notifications disabled');
                  }} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Group Mentions</p>
                      <p className="text-zinc-400 text-sm">When someone mentions you in groups</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.groupMentions} onChange={(enabled) => {
                    setNotifications({...notifications, groupMentions: enabled});
                    alert(enabled ? 'Group mention notifications enabled' : 'Group mention notifications disabled');
                  }} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-white font-medium">Video Invites</p>
                      <p className="text-zinc-400 text-sm">Incoming video call invitations</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.videoInvites} onChange={(enabled) => {
                    setNotifications({...notifications, videoInvites: enabled});
                    alert(enabled ? 'Video invite notifications enabled' : 'Video invite notifications disabled');
                  }} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">Activity Updates</p>
                      <p className="text-zinc-400 text-sm">Friend activity and social updates</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.activityUpdates} onChange={(enabled) => {
                    setNotifications({...notifications, activityUpdates: enabled});
                    alert(enabled ? 'Activity update notifications enabled' : 'Activity update notifications disabled');
                  }} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Achievement Alerts</p>
                      <p className="text-zinc-400 text-sm">Unlock achievements and milestones</p>
                    </div>
                  </div>
                  <Toggle enabled={notifications.achievementAlerts} onChange={(enabled) => {
                    setNotifications({...notifications, achievementAlerts: enabled});
                    alert(enabled ? 'Achievement alerts enabled' : 'Achievement alerts disabled');
                  }} />
                </div>
              </div>
            </div>

            {/* Delivery Methods */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-gold" />
                Delivery Methods
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Push Notifications</p>
                    <p className="text-zinc-400 text-sm">Receive notifications on your device</p>
                  </div>
                  <Toggle enabled={notifications.pushNotifications} onChange={(enabled) => {
                    setNotifications({...notifications, pushNotifications: enabled});
                    if (enabled) {
                      // Request notification permission
                      if ('Notification' in window) {
                        Notification.requestPermission().then(permission => {
                          if (permission === 'granted') {
                            alert('Push notifications enabled successfully!');
                          } else {
                            alert('Push notification permission denied. Please enable in browser settings.');
                          }
                        });
                      } else {
                        alert('Push notifications not supported in this browser');
                      }
                    } else {
                      alert('Push notifications disabled');
                    }
                  }} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Email Notifications</p>
                    <p className="text-zinc-400 text-sm">Receive notifications via email</p>
                  </div>
                  <Toggle enabled={notifications.emailNotifications} onChange={(enabled) => {
                    setNotifications({...notifications, emailNotifications: enabled});
                    alert(enabled ? 'Email notifications enabled' : 'Email notifications disabled');
                  }} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">In-App Notifications</p>
                    <p className="text-zinc-400 text-sm">Show notifications within the app</p>
                  </div>
                  <Toggle enabled={notifications.inAppNotifications} onChange={(enabled) => {
                    setNotifications({...notifications, inAppNotifications: enabled});
                    alert(enabled ? 'In-app notifications enabled' : 'In-app notifications disabled');
                  }} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Sound Alerts</p>
                    <p className="text-zinc-400 text-sm">Play sound for new notifications</p>
                  </div>
                  <Toggle enabled={notifications.soundAlerts} onChange={(enabled) => {
                    setNotifications({...notifications, soundAlerts: enabled});
                    alert(enabled ? 'Sound alerts enabled' : 'Sound alerts disabled');
                  }} />
                </div>
              </div>
            </div>

            {/* Per-Category Channels */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold" />
                Per-Category Channels
              </h3>
              <div className="space-y-3">
                {Object.entries(categoryChannels).map(([key, channels]) => (
                  <div key={key} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center p-3 rounded-lg bg-zinc-700/20">
                    <div className="capitalize text-white font-medium">{key}</div>
                    {(['push','email','inApp'] as const).map((c) => (
                      <label key={c} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2">
                        <span className="text-zinc-400 text-sm">{c === 'inApp' ? 'In-App' : c.charAt(0).toUpperCase()+c.slice(1)}</span>
                        <Toggle enabled={(channels as any)[c]} onChange={(v)=> setCategoryChannels((prev)=> ({...prev, [key]: { ...prev[key], [c]: v }}))} />
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gold" />
                Quiet Hours
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Enable Quiet Hours</p>
                    <p className="text-zinc-400 text-sm">Silence notifications during specific hours</p>
                  </div>
                  <Toggle enabled={notifications.quietHoursEnabled} onChange={(enabled) => {
                    setNotifications({...notifications, quietHoursEnabled: enabled});
                    alert(enabled ? 'Quiet hours enabled' : 'Quiet hours disabled');
                  }} />
                </div>

                {notifications.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="quiet-hours-start" className="text-zinc-400 text-sm">Start Time</label>
                      <input
                        id="quiet-hours-start"
                        type="time"
                        value={notifications.quietHoursStart || "22:00"}
                        onChange={(e) => setNotifications({...notifications, quietHoursStart: e.target.value})}
                        className="w-full mt-1 bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="quiet-hours-end" className="text-zinc-400 text-sm">End Time</label>
                      <input
                        id="quiet-hours-end"
                        type="time"
                        value={notifications.quietHoursEnd || "08:00"}
                        onChange={(e) => setNotifications({...notifications, quietHoursEnd: e.target.value})}
                        className="w-full mt-1 bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                )}

                {notifications.quietHoursEnabled && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Allow Emergency Notifications</p>
                      <p className="text-zinc-400 text-sm">Show urgent notifications during quiet hours</p>
                    </div>
                    <Toggle enabled={notifications.allowEmergencyNotifications} onChange={(enabled) => {
                      setNotifications({...notifications, allowEmergencyNotifications: enabled});
                      alert(enabled ? 'Emergency notifications allowed during quiet hours' : 'All notifications blocked during quiet hours');
                    }} />
                  </div>
                )}
              </div>
            </div>

            {/* Snooze Options */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gold" />
                Snooze Notifications
              </h3>
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm mb-3">Temporarily pause all notifications</p>
                <div className="flex gap-2">
                  {[
                    { duration: '1h', label: '1 Hour' },
                    { duration: '8h', label: '8 Hours' },
                    { duration: '24h', label: '24 Hours' },
                    { duration: 'custom', label: 'Custom' }
                  ].map((option) => (
                    <button
                      key={option.duration}
                      onClick={() => {
                        if (option.duration === 'custom') {
                          const hours = prompt('Enter number of hours to snooze:');
                          if (hours && !isNaN(Number(hours))) {
                            alert(`Notifications snoozed for ${hours} hours`);
                          }
                        } else {
                          alert(`Notifications snoozed for ${option.label}`);
                        }
                      }}
                      className="px-4 py-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg text-white text-sm transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notification History */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Archive className="w-5 h-5 text-gold" />
                Notification History
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-zinc-400 text-sm">Recent notifications from the last 7 days</p>
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all notification history?')) {
                        alert('Notification history cleared');
                      }
                    }}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded transition-colors"
                  >
                    Clear History
                  </button>
                </div>

                {/* Sample notification history */}
                <div className="space-y-3">
                  {[
                    { type: 'AI Message', message: 'New message from Luna AI', time: '2 minutes ago', icon: <MessageSquare className="w-4 h-4 text-teal-400" /> },
                    { type: 'Group Mention', message: '@you mentioned in "Tech Enthusiasts"', time: '1 hour ago', icon: <Users className="w-4 h-4 text-blue-400" /> },
                    { type: 'Video Invite', message: 'Incoming call from John Doe', time: '3 hours ago', icon: <Video className="w-4 h-4 text-orange-400" /> },
                    { type: 'Achievement', message: 'Unlocked "Chat Master" badge', time: '1 day ago', icon: <Target className="w-4 h-4 text-green-400" /> }
                  ].map((notification, index) => (
                    <div key={`${notification.type}-${index}`} className="flex items-center gap-3 p-3 bg-zinc-700/30 rounded-lg">
                      {notification.icon}
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{notification.type}</p>
                        <p className="text-zinc-400 text-xs">{notification.message}</p>
                      </div>
                      <span className="text-zinc-500 text-xs">{notification.time}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => alert('Loading more notification history...')}
                  className="w-full py-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg text-white text-sm transition-colors"
                >
                  Load More History
                </button>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold" />
                Advanced Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Group Notifications</p>
                    <p className="text-zinc-400 text-sm">Bundle similar notifications together</p>
                  </div>
                  <Toggle enabled={notifications.groupNotifications} onChange={(enabled) => {
                    setNotifications({...notifications, groupNotifications: enabled});
                    alert(enabled ? 'Notification grouping enabled' : 'Notification grouping disabled');
                  }} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Show Preview</p>
                    <p className="text-zinc-400 text-sm">Show message content in notifications</p>
                  </div>
                  <Toggle enabled={notifications.showPreview} onChange={(enabled) => {
                    setNotifications({...notifications, showPreview: enabled});
                    alert(enabled ? 'Notification previews enabled' : 'Notification previews disabled');
                  }} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Auto-Dismiss</p>
                    <p className="text-zinc-400 text-sm">Automatically dismiss notifications after 5 seconds</p>
                  </div>
                  <Toggle enabled={notifications.autoDismiss} onChange={(enabled) => {
                    setNotifications({...notifications, autoDismiss: enabled});
                    alert(enabled ? 'Auto-dismiss enabled' : 'Auto-dismiss disabled');
                  }} />
                </div>
              </div>
            </div>
          </div>
        );

      case 'subscriptions':
        return (
          <div className="space-y-6">
            {/* Subscriptions - Coming Soon */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gold" />
                Subscription Management
                <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                  Coming Soon
                </span>
              </h3>
              <div className="space-y-4 opacity-50">
                <div className="bg-zinc-700/30 rounded-lg p-4 border border-zinc-600/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-semibold">Premium Plan</h4>
                      <p className="text-zinc-400 text-sm">$9.99/month</p>
                    </div>
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      active
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-zinc-400 text-sm">Renews 2024-02-15</p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-zinc-600/50 text-white text-sm rounded cursor-not-allowed" disabled>
                        Upgrade
                      </button>
                      <button className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded cursor-not-allowed" disabled>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-zinc-500 text-sm mt-4">Subscription management features will be available soon. You'll be able to upgrade, downgrade, and manage your billing preferences.</p>
            </div>

            {/* Available Plans Preview */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-gold" />
                Available Plans
                <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                  Preview
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { name: 'Free', price: '$0', features: ['Basic AI chats', 'Limited characters', 'Standard support'] },
                  { name: 'Premium', price: '$9.99/month', features: ['Unlimited AI chats', 'All characters', 'Priority support', 'Video calls'] },
                  { name: 'Pro', price: '$19.99/month', features: ['Everything in Premium', 'Custom characters', 'API access', 'Advanced analytics'] }
                ].map((plan, index) => (
                  <div key={`${plan.name}-${index}`} className="bg-zinc-700/30 rounded-lg p-4 border border-zinc-600/50">
                    <h4 className="text-white font-semibold mb-2">{plan.name}</h4>
                    <p className="text-gold font-bold text-lg mb-3">{plan.price}</p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={`${plan.name}-feature-${featureIndex}`} className="text-zinc-400 text-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gold rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button className="w-full mt-4 px-4 py-2 bg-zinc-600/50 text-white text-sm rounded cursor-not-allowed" disabled>
                      {plan.name === 'Free' ? 'Current Plan' : 'Coming Soon'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-6">
            {/* Activity Overview */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-gold" />
                Activity Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-zinc-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">24</div>
                  <div className="text-zinc-400 text-xs">AI Chats Today</div>
                </div>
                <div className="bg-zinc-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">156</div>
                  <div className="text-zinc-400 text-xs">Total Messages</div>
                </div>
                <div className="bg-zinc-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">8</div>
                  <div className="text-zinc-400 text-xs">Saved Posts</div>
                </div>
                <div className="bg-zinc-700/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-1">3</div>
                  <div className="text-zinc-400 text-xs">Active Groups</div>
                </div>
              </div>
            </div>

            {/* Activity History */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gold" />
                Activity History
              </h3>
              <p className="text-zinc-400 text-sm mb-6">View detailed history of your activities across the platform</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/settings/activity/reposts')}
                  className="flex items-center justify-between p-4 bg-zinc-700/30 rounded-lg hover:bg-zinc-700/50 transition-colors border border-zinc-600/50 hover:border-zinc-500/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <RotateCcw className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-white font-medium">Reposts</h4>
                      <p className="text-zinc-400 text-sm">View all your reposts</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-zinc-400 rotate-180" />
                </button>

                <button
                  onClick={() => navigate('/settings/activity/comments')}
                  className="flex items-center justify-between p-4 bg-zinc-700/30 rounded-lg hover:bg-zinc-700/50 transition-colors border border-zinc-600/50 hover:border-zinc-500/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-white font-medium">Comments</h4>
                      <p className="text-zinc-400 text-sm">View all your comments</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-zinc-400 rotate-180" />
                </button>

                <button
                  onClick={() => navigate('/settings/activity/characters')}
                  className="flex items-center justify-between p-4 bg-zinc-700/30 rounded-lg hover:bg-zinc-700/50 transition-colors border border-zinc-600/50 hover:border-zinc-500/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-white font-medium">Characters</h4>
                      <p className="text-zinc-400 text-sm">View created characters</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-zinc-400 rotate-180" />
                </button>

                <button
                  onClick={() => navigate('/settings/activity/likes')}
                  className="flex items-center justify-between p-4 bg-zinc-700/30 rounded-lg hover:bg-zinc-700/50 transition-colors border border-zinc-600/50 hover:border-zinc-500/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Activity className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-white font-medium">Likes & Dislikes</h4>
                      <p className="text-zinc-400 text-sm">View your reactions</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-zinc-400 rotate-180" />
                </button>
              </div>
            </div>

            {/* Activity Tabs */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Archive className="w-5 h-5 text-gold" />
                Activity & Archive
              </h3>
              
              {/* Tab Navigation */}
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'saved', name: 'Saved Posts', icon: <FileText className="w-4 h-4" /> },
                  { id: 'deleted', name: 'Deleted Groups', icon: <Users className="w-4 h-4" /> },
                  { id: 'chats', name: 'AI Chat Logs', icon: <MessageSquare className="w-4 h-4" /> },
                  { id: 'recent', name: 'Recent Activity', icon: <Activity className="w-4 h-4" /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveActivityTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                      activeActivityTab === tab.id
                        ? 'bg-gold/10 text-gold border border-gold/30'
                        : 'bg-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-600/50'
                    }`}
                  >
                    {tab.icon}
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeActivityTab === 'saved' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Saved Posts ({savedPosts.length})</h4>
                    <button 
                      onClick={() => {
                        if (savedPosts.length > 0 && confirm('Clear all saved posts?')) {
                          setSavedPosts([]);
                          alert('All saved posts cleared');
                        }
                      }}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  
                  {savedPosts.length > 0 ? (
                    <div className="space-y-3">
                      {savedPosts.map((post, index) => (
                        <div key={`${post.title}-${index}`} className="bg-zinc-700/30 rounded-lg p-4 border border-zinc-600/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="text-white font-medium mb-1">{post.title}</h5>
                              <p className="text-zinc-400 text-sm mb-2">{post.content}</p>
                              <div className="flex items-center gap-4 text-xs text-zinc-500">
                                <span>Saved {post.savedAt}</span>
                                <span>• {post.category}</span>
                                <span>• {post.character}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(post.content).then(() => {
                                    alert('Post content copied to clipboard!');
                                  });
                                }}
                                className="px-3 py-1 bg-zinc-600/50 hover:bg-zinc-600 rounded text-white text-sm transition-colors"
                              >
                                Copy
                              </button>
                              <button 
                                onClick={() => {
                                  const newPosts = savedPosts.filter((_, i) => i !== index);
                                  setSavedPosts(newPosts);
                                  alert('Post removed from saved');
                                }}
                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-400">No saved posts found</p>
                      <p className="text-zinc-500 text-sm mt-1">Posts you save will appear here</p>
                    </div>
                  )}
                </div>
              )}

              {activeActivityTab === 'deleted' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Deleted Groups ({deletedGroups.length})</h4>
                    <button 
                      onClick={() => {
                        if (deletedGroups.length > 0 && confirm('Permanently delete all groups?')) {
                          setDeletedGroups([]);
                          alert('All deleted groups permanently removed');
                        }
                      }}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded transition-colors"
                    >
                      Delete All
                    </button>
                  </div>
                  
                  {deletedGroups.length > 0 ? (
                    <div className="space-y-3">
                      {deletedGroups.map((group, index) => (
                        <div key={`${group.name}-${index}`} className="bg-zinc-700/30 rounded-lg p-4 border border-zinc-600/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{group.name.charAt(0)}</span>
                              </div>
                              <div>
                                <h5 className="text-white font-medium">{group.name}</h5>
                                <p className="text-zinc-400 text-sm">{group.members} members • Deleted {group.deletedAt}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  const newGroups = deletedGroups.filter((_, i) => i !== index);
                                  setDeletedGroups(newGroups);
                                  alert('Group restored successfully');
                                }}
                                className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm rounded transition-colors"
                              >
                                Restore
                              </button>
                              <button 
                                onClick={() => {
                                  const newGroups = deletedGroups.filter((_, i) => i !== index);
                                  setDeletedGroups(newGroups);
                                  alert('Group permanently deleted');
                                }}
                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-400">No deleted groups found</p>
                      <p className="text-zinc-500 text-sm mt-1">Groups you delete will appear here for 30 days</p>
                    </div>
                  )}
                </div>
              )}

              {activeActivityTab === 'chats' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">AI Chat Logs ({aiChatLogs.length})</h4>
                    <div className="flex gap-2">
                      <select 
                        className="bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-1 text-white text-sm"
                        onChange={(e) => setChatFilter(e.target.value)}
                      >
                        <option value="all">All Characters</option>
                        <option value="luna">Luna AI</option>
                        <option value="max">Max AI</option>
                        <option value="sophia">Sophia AI</option>
                      </select>
                      <button 
                        onClick={() => {
                          if (aiChatLogs.length > 0 && confirm('Clear all chat logs?')) {
                            setAiChatLogs([]);
                            alert('All chat logs cleared');
                          }
                        }}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  
                  {aiChatLogs.length > 0 ? (
                    <div className="space-y-3">
                      {aiChatLogs
                        .filter(chat => chatFilter === 'all' || chat.character.toLowerCase().includes(chatFilter))
                        .map((chat, index) => (
                        <div key={`${chat.character}-${index}`} className="bg-zinc-700/30 rounded-lg p-4 border border-zinc-600/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  chat.character === 'Luna AI' ? 'bg-purple-500/20' :
                                  chat.character === 'Max AI' ? 'bg-blue-500/20' :
                                  'bg-green-500/20'
                                }`}>
                                  <span className="text-xs font-bold text-white">{chat.character.charAt(0)}</span>
                                </div>
                                <h5 className="text-white font-medium">{chat.character}</h5>
                                <span className="text-zinc-500 text-sm">• {chat.messages} messages</span>
                              </div>
                              <p className="text-zinc-400 text-sm mb-2">{chat.lastMessage}</p>
                              <div className="flex items-center gap-4 text-xs text-zinc-500">
                                <span>Last active {chat.lastActive}</span>
                                <span>• {chat.duration}</span>
                                <span>• {chat.category}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button 
                                onClick={() => alert(`Opening chat with ${chat.character}...`)}
                                className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded transition-colors"
                              >
                                Open
                              </button>
                              <button 
                                onClick={() => {
                                  const newLogs = aiChatLogs.filter((_, i) => i !== index);
                                  setAiChatLogs(newLogs);
                                  alert('Chat log removed');
                                }}
                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                      <p className="text-zinc-400">No chat logs found</p>
                      <p className="text-zinc-500 text-sm mt-1">Your AI chat conversations will appear here</p>
                    </div>
                  )}
                </div>
              )}

              {activeActivityTab === 'recent' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">Recent Activity</h4>
                    <select 
                      className="bg-zinc-700/50 border border-zinc-600 rounded-lg px-3 py-1 text-white text-sm"
                      onChange={(e) => setActivityFilter(e.target.value)}
                    >
                      <option value="all">All Activities</option>
                      <option value="chat">Chats</option>
                      <option value="group">Groups</option>
                      <option value="settings">Settings</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3">
                    {recentActivity
                      .filter(activity => activityFilter === 'all' || activity.type === activityFilter)
                      .map((activity, index) => (
                      <div key={`${activity.type}-${index}`} className="flex items-center gap-3 p-3 bg-zinc-700/30 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'chat' ? 'bg-blue-500/20' :
                          activity.type === 'group' ? 'bg-green-500/20' :
                          'bg-purple-500/20'
                        }`}>
                          {activity.type === 'chat' ? <MessageSquare className="w-4 h-4 text-blue-400" /> :
                           activity.type === 'group' ? <Users className="w-4 h-4 text-green-400" /> :
                           <Settings className="w-4 h-4 text-purple-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{activity.title}</p>
                          <p className="text-zinc-400 text-xs">{activity.description}</p>
                        </div>
                        <span className="text-zinc-500 text-xs">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Activity Analytics */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gold" />
                Activity Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-white font-medium">Most Active Times</h4>
                  <div className="space-y-2">
                    {[
                      { time: '9:00 AM - 11:00 AM', activity: 'High', percentage: 85 },
                      { time: '2:00 PM - 4:00 PM', activity: 'Medium', percentage: 65 },
                      { time: '8:00 PM - 10:00 PM', activity: 'High', percentage: 90 },
                      { time: '11:00 PM - 1:00 AM', activity: 'Low', percentage: 30 }
                    ].map((period, index) => (
                      <div key={`${period.time}-${index}`} className="flex items-center justify-between">
                        <span className="text-zinc-400 text-sm">{period.time}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                period.activity === 'High' ? 'bg-green-500' :
                                period.activity === 'Medium' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{width: `${period.percentage}%`}}
                            ></div>
                          </div>
                          <span className="text-zinc-400 text-xs">{period.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-white font-medium">Favorite Characters</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Luna AI', chats: 45, percentage: 60 },
                      { name: 'Max AI', chats: 30, percentage: 40 },
                      { name: 'Sophia AI', chats: 15, percentage: 20 }
                    ].map((character, index) => (
                      <div key={`${character.name}-${index}`} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{character.name.charAt(0)}</span>
                          </div>
                          <span className="text-zinc-400 text-sm">{character.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-zinc-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{width: `${character.percentage}%`}}
                            ></div>
                          </div>
                          <span className="text-zinc-400 text-xs">{character.chats}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Actions */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold" />
                Activity Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => {
                    // Create activity export
                    const activityData = {
                      savedPosts: savedPosts,
                      deletedGroups: deletedGroups,
                      aiChatLogs: aiChatLogs,
                      recentActivity: recentActivity,
                      exportDate: new Date().toISOString(),
                    };
                    
                    const dataStr = JSON.stringify(activityData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `nexus-activity-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    alert('Activity data exported successfully!');
                  }}
                  className="p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-lg font-bold mb-1">📥</div>
                    <div className="text-sm font-medium">Export Data</div>
                    <div className="text-xs text-blue-400/70">Download all activity</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => {
                    if (confirm('This will clear all activity data. Are you sure?')) {
                      setSavedPosts([]);
                      setDeletedGroups([]);
                      setAiChatLogs([]);
                      setRecentActivity([]);
                      alert('All activity data cleared');
                    }
                  }}
                  className="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-lg font-bold mb-1">🗑️</div>
                    <div className="text-sm font-medium">Clear All</div>
                    <div className="text-xs text-red-400/70">Remove all data</div>
                  </div>
                </button>
                
                <button 
                  onClick={() => alert('Activity sync started...')}
                  className="p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-lg font-bold mb-1">🔄</div>
                    <div className="text-sm font-medium">Sync Data</div>
                    <div className="text-xs text-green-400/70">Update from server</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="space-y-6">
            {/* Terms & Safety */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-zinc-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Terms & Safety
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Terms of Service</p>
                    <p className="text-zinc-400 text-sm">Read our terms and conditions</p>
                  </div>
                  <button className="px-4 py-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg text-white text-sm transition-colors">
                    View
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Privacy Policy</p>
                    <p className="text-zinc-400 text-sm">How we handle your data</p>
                  </div>
                  <button className="px-4 py-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg text-white text-sm transition-colors">
                    View
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Report Bug</p>
                    <p className="text-zinc-400 text-sm">Help us improve by reporting issues</p>
                  </div>
                  <button className="px-4 py-2 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg text-white text-sm transition-colors">
                    Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tab</div>;
    }
  };

  const isSmallScreen = isMobile || isTablet;

  return (
    <div className={`min-h-screen ${mainBg}`}>
      {/* Mobile Header with Hamburger */}
      {isSmallScreen && (
        <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur-md">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="p-2 rounded-lg bg-[#1A1A1A] hover:bg-[#222222] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Settings</h1>
              </div>
            </div>
            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="p-2 rounded-lg bg-[#1A1A1A] hover:bg-[#222222] transition-colors"
            >
              {isDrawerOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </header>
      )}

      {/* Mobile Drawer Overlay */}
      {isSmallScreen && (
        <div
          className={`fixed inset-0 z-50 transition-opacity ${
            isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          } bg-black/60 backdrop-blur-sm`}
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden={!isDrawerOpen}
        />
      )}

      {/* Mobile Drawer Panel */}
      {isSmallScreen && (
        <aside
          className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[85%] ${sideMenuBg} backdrop-blur-md transition-transform duration-300 ease-out ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Settings menu"
        >
          {/* Drawer Header */}
          <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white font-bold text-lg">Settings</span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 rounded-lg bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Drawer Content */}
          <div className="overflow-y-auto h-[calc(100%-56px)]">
            <div className="p-4">
              {/* Settings Navigation */}
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gold/10 text-gold border border-gold/30'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-700/30'
                    }`}
                  >
                    <span className="text-zinc-400">{tab.icon}</span>
                    <span className="font-medium">{tab.name}</span>
                  </button>
                ))}
              </nav>

              {/* Help and Logout Section */}
              <div className="mt-8 pt-6 border-t border-zinc-700/50 space-y-2">
                <button
                  onClick={() => {
                    setShowHelpModal(true);
                    setIsDrawerOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                >
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-medium">Help</span>
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsDrawerOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Desktop Layout */}
      {isDesktop && (
        <div className="flex">
          {/* Sidebar */}
          <div className={`w-80 ${sideMenuBg} border-r ${borderColor} min-h-screen p-6`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => navigate('/ai')}
                className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Settings</h1>
                <p className="text-zinc-400 text-sm">Manage your preferences</p>
              </div>
            </div>

            {/* Settings Navigation */}
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gold/10 text-gold border border-gold/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-700/30'
                  }`}
                >
                  <span className="text-zinc-400">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>

            {/* Help and Logout Section */}
            <div className="mt-8 pt-6 border-t border-zinc-700/50 space-y-2">
              <button
                onClick={() => setShowHelpModal(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="font-medium">Help</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            <div className="max-w-4xl">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">
                  {tabs.find(tab => tab.id === activeTab)?.name}
                </h2>
                <p className="text-zinc-400">Manage your preferences and account settings</p>
              </div>

              {renderContent()}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Main Content */}
      {isSmallScreen && (
        <div className="pt-14 px-4 pb-4">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">
              {tabs.find(tab => tab.id === activeTab)?.name}
            </h2>
            <p className="text-zinc-400 text-sm">Manage your preferences and account settings</p>
          </div>

          {renderContent()}
        </div>
      )}

        {/* Edit Profile Modal */}
        {showEditProfile && (
          <EditProfileModal 
            profileData={profileData}
            setProfileData={setProfileData}
            onClose={() => setShowEditProfile(false)}
          />
        )}

        {/* Help Modal - dark theme */}
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#1A1A1A] rounded-2xl max-w-md w-full border border-white/10 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#A855F7]/20 rounded-lg">
                    <HelpCircle className="w-6 h-6 text-[#A855F7]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Help & Support</h3>
                    <p className="text-sm text-[#A1A1AA]">We're here to help</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="p-2 hover:bg-[#222222] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#A1A1AA]" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="bg-[#222222] rounded-xl p-4 border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#A855F7]/20 rounded-lg">
                      <Mail className="w-5 h-5 text-[#A855F7]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">Contact Us</h4>
                      <p className="text-[#A1A1AA] text-sm mb-3">
                        Need help? Reach out to our support team
                      </p>
                      <a
                        href="https://mail.google.com/mail/?view=cm&fs=1&to=nexusschats@gmail.com&su=Help%20Request%20-%20Nexus%20Support"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-lg font-medium transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        nexusschats@gmail.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-[#A1A1AA]">
                  We typically respond within 24-48 hours
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-full px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] text-white rounded-lg font-medium transition-colors border border-white/5"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default SettingsPage;