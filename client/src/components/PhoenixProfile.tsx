import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Bookmark, HelpCircle, LogOut, Mic, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBookmarks } from '../contexts/BookmarksContext';
import { signOut } from '../lib/supabase';
import axios from 'axios';
import { apiFetch } from '../lib/utils';

interface ProfileStats {
  confessions: number;
  aiChats: number;
  bookmarks: number;
  level: number;
  xp: number;
  streak: number; // Now in hours
}

// Get the server URL for API calls
const getServerUrl = () => {
  return import.meta.env.VITE_SERVER_URL || globalThis.location.origin;
};

// Get session ID for filtering user's confessions
const getSessionId = () => {
  const SESSION_KEY = 'confession_session_id';
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      localStorage.setItem(SESSION_KEY, sessionId);
    } catch (e) {
      console.warn('Failed to save session ID:', e);
    }
  }
  return sessionId;
};

// Track hours spent on app (1 hour = 1 streak)
const getHoursSpent = (): number => {
  const STORAGE_KEY = 'app_hours_spent';
  const SESSION_START_KEY = 'session_start_time';
  
  try {
    // Get total hours from previous sessions
    const totalHours = parseFloat(localStorage.getItem(STORAGE_KEY) || '0');
    
    // Get current session start time
    const sessionStart = localStorage.getItem(SESSION_START_KEY);
    if (!sessionStart) {
      // First time in this session, set start time
      localStorage.setItem(SESSION_START_KEY, Date.now().toString());
      return Math.floor(totalHours);
    }
    
    // Calculate hours in current session
    const sessionStartTime = parseInt(sessionStart);
    const currentTime = Date.now();
    const sessionHours = (currentTime - sessionStartTime) / (1000 * 60 * 60); // Convert ms to hours
    
    // Total hours = previous hours + current session hours
    const total = totalHours + sessionHours;
    
    // Update stored total (we'll save this periodically)
    return Math.floor(total);
  } catch (e) {
    console.warn('Failed to calculate hours spent:', e);
    return 0;
  }
};

// Save hours periodically
const saveHoursSpent = () => {
  const STORAGE_KEY = 'app_hours_spent';
  const SESSION_START_KEY = 'session_start_time';
  
  try {
    const totalHours = parseFloat(localStorage.getItem(STORAGE_KEY) || '0');
    const sessionStart = localStorage.getItem(SESSION_START_KEY);
    
    if (sessionStart) {
      const sessionStartTime = parseInt(sessionStart);
      const currentTime = Date.now();
      const sessionHours = (currentTime - sessionStartTime) / (1000 * 60 * 60);
      const newTotal = totalHours + sessionHours;
      
      localStorage.setItem(STORAGE_KEY, newTotal.toString());
      localStorage.setItem(SESSION_START_KEY, currentTime.toString()); // Reset session start
    }
  } catch (e) {
    console.warn('Failed to save hours spent:', e);
  }
};

export function PhoenixProfile() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    confessions: 0,
    aiChats: 0,
    bookmarks: 0,
    level: 0,
    xp: 0,
    streak: 0
  });
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>('Anonymous User');
  const { bookmarksCount } = useBookmarks();
  const [ambassadorForm, setAmbassadorForm] = useState({ name: '', college: '' });
  const [showAmbassadorForm, setShowAmbassadorForm] = useState(false);

  // Initialize session tracking on mount
  useEffect(() => {
    const SESSION_START_KEY = 'session_start_time';
    if (!localStorage.getItem(SESSION_START_KEY)) {
      localStorage.setItem(SESSION_START_KEY, Date.now().toString());
    }
    
    // Save hours every 5 minutes
    const saveInterval = setInterval(saveHoursSpent, 5 * 60 * 1000);
    
    // Save hours on page unload
    const handleBeforeUnload = () => {
      saveHoursSpent();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveHoursSpent(); // Save one last time
    };
  }, []);

  useEffect(() => {
    fetchProfileStats();
    fetchUserProfile();
  }, [currentUser]);

  const fetchUserProfile = async () => {
    try {
      if (!currentUser) {
        setUsername('Anonymous User');
        return;
      }

      // Try to get username from profile data
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/api/v1/chat/get-profile-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ uid: currentUser.uid })
      });

      if (res.ok) {
        const result = await res.json();
        const row = (Array.isArray(result.data) ? result.data[0] : result.data) || {};
        const name = row.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous User';
        setUsername(name);
      } else {
        // Fallback to displayName or email
        setUsername(currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous User');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to displayName or email
      setUsername(currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Anonymous User');
    }
  };

  const fetchProfileStats = async () => {
    setLoading(true);
    try {
      // Fetch user's confessions count
      const sessionId = getSessionId();
      const confessionsResponse = await apiFetch(`${getServerUrl()}/api/confessions?limit=100&sessionId=${encodeURIComponent(sessionId)}`);
      const confessionsResult = await confessionsResponse.json();
      
      let confessionsCount = 0;
      if (confessionsResult.success) {
        const confessions = confessionsResult.data?.items || confessionsResult.data || [];
        confessionsCount = confessions.filter((c: any) => c.sessionId === sessionId).length;
      }

      // Fetch AI chats count
      let aiChatsCount = 0;
      try {
        const { API_CONFIG } = await import('../lib/config');
        const API_BASE_URL = API_CONFIG.getServerUrl();
        const chatsResponse = await axios.get(`${API_BASE_URL}/api/nexus-chats/`, {
          withCredentials: true
        });
        
        if (chatsResponse.data?.chats) {
          aiChatsCount = chatsResponse.data.chats.filter((chat: any) => chat?.type === 'companion').length;
        }
      } catch (error) {
        console.error('Error fetching AI chats:', error);
      }

      // Get hours spent (streak)
      const hoursSpent = getHoursSpent();

      // Level: 10 streak = 1 level, 20 streak = 2 level (level = floor(streak/10)); show at least 1
      const level = Math.max(1, Math.floor(hoursSpent / 10));
      // XP progress within current level (0–90, 10 hours = 100)
      const xp = (hoursSpent % 10) * 10;

      setStats({
        confessions: confessionsCount,
        aiChats: aiChatsCount,
        bookmarks: 0, // Shown from useBookmarks below
        level,
        xp,
        streak: hoursSpent
      });
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Progress to next level: 10 streak hours = 100%
  const xpForNextLevel = 100;
  const xpProgress = Math.min(100, (stats.xp / xpForNextLevel) * 100);

  const handleLogout = async () => {
    try {
      await signOut();
      console.log('✅ Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      localStorage.clear();
      navigate('/login');
    }
  };

  const handleAmbassadorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit to backend API
    console.log('Ambassador form submitted:', ambassadorForm);
    alert('Thank you for your interest! We\'ll contact you soon.');
    setShowAmbassadorForm(false);
    setAmbassadorForm({ name: '', college: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] text-white">
        <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 border-b border-white/10 backdrop-blur-md">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="h-7 w-40 bg-[#1A1A1A] rounded animate-pulse" />
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-24">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-[#1A1A1A] animate-pulse" />
            <div className="h-6 w-32 bg-[#1A1A1A] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/95 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold tracking-tight select-none">
            <span className="text-white">Nexus</span><span className="text-[#A855F7]">chat.in</span>
          </h1>
        </div>
      </header>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-24">
        {/* Anonymous Avatar with Gradient Ring */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#A855F7] via-[#9333EA] to-[#7C3AED] p-1">
              <div className="w-full h-full rounded-full bg-[#1A1A1A] flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#A855F7]/20 to-[#9333EA]/20 flex items-center justify-center">
                  <span className="text-4xl">👤</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-center">{username}</h2>
          </div>
        </div>

        {/* Level / XP */}
        <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#A1A1AA]">
              Level {stats.level} - {stats.xp} XP
            </span>
          </div>
          <div className="w-full h-2 bg-[#0A0A0A] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#A855F7] to-[#9333EA] transition-all duration-500"
              style={{ width: `${Math.min(xpProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Streaks (Hours Spent) */}
        <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-white font-medium">Streak: {stats.streak} hours</span>
          </div>
        </div>

        {/* Bookmarks */}
        <button
          type="button"
          onClick={() => navigate('/bookmarks')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/bookmarks'); } }}
          className="w-full bg-[#1A1A1A] rounded-xl p-4 border border-white/5 cursor-pointer hover:bg-[#222222] transition-all duration-200 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <Bookmark className="w-5 h-5 text-[#A855F7]" />
            <span className="text-white">Bookmarks</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#A1A1AA]">{bookmarksCount}</span>
          </div>
        </button>

        {/* Be Voice of Nexus */}
        <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <Mic className="w-5 h-5 text-[#A855F7]" />
            <span className="text-white font-medium">Be Voice of Nexus</span>
          </div>
          <p className="text-[#A1A1AA] text-sm mb-3">
            Become a Campus Ambassador! Promote Nexus in your campus. We've over 50 campus ambassadors in 23 colleges of India and USA.
          </p>
          {!showAmbassadorForm ? (
            <button
              onClick={() => setShowAmbassadorForm(true)}
              className="w-full px-4 py-2 bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-lg font-medium transition-colors"
            >
              Apply Now
            </button>
          ) : (
            <form onSubmit={handleAmbassadorSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your Name"
                value={ambassadorForm.name}
                onChange={(e) => setAmbassadorForm({ ...ambassadorForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#A855F7]"
              />
              <input
                type="text"
                placeholder="College Name"
                value={ambassadorForm.college}
                onChange={(e) => setAmbassadorForm({ ...ambassadorForm, college: e.target.value })}
                required
                className="w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#A855F7]"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#A855F7] hover:bg-[#9333EA] text-white rounded-lg font-medium transition-colors"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAmbassadorForm(false);
                    setAmbassadorForm({ name: '', college: '' });
                  }}
                  className="px-4 py-2 bg-[#222222] hover:bg-[#2A2A2A] text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* About Us */}
        <button
          type="button"
          onClick={() => navigate('/about-us')}
          className="w-full bg-[#1A1A1A] rounded-xl p-4 border border-white/5 cursor-pointer hover:bg-[#222222] transition-all duration-200 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-[#A855F7]" />
            <span className="text-white">About Us</span>
          </div>
        </button>

        {/* Help & Support - opens mailbox (Gmail compose) */}
        <a
          href="https://mail.google.com/mail/?view=cm&fs=1&to=nexusschats@gmail.com&su=Help%20Request%20-%20Nexus%20Support"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#1A1A1A] rounded-xl p-4 border border-white/5 cursor-pointer hover:bg-[#222222] transition-all duration-200 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-[#A855F7]" />
            <span className="text-white">Help & Support</span>
          </div>
        </a>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-[#1A1A1A] rounded-xl p-4 border border-white/5 cursor-pointer hover:bg-[#222222] transition-all duration-200 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-red-500" />
            <span className="text-white">Logout</span>
          </div>
        </button>
      </div>
    </div>
  );
}
