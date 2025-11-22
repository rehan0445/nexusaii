import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Bot,
  Edit3,
  Settings,
  Copy,
  Users,
  LayoutGrid
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { apiClient } from "../lib/apiConfig";
import EditProfileModal from "../components/EditProfileModal";
import { hangoutService, ChatRoom } from "../services/hangoutService";
import MobileSettingsPanel from "../components/MobileSettingsPanel";
import settingsService from "../services/settingsService";
import { Bell, User as UserIcon, LogOut, HelpCircle, Mail } from "lucide-react";

interface ProfileData {
  name: string;
  username: string;
  bio: string;
  location: string;
  email: string;
  profileImage: string;
  bannerImage: string;
  creationDate?: string;
  charactersCreated?: any[];
  adminGroupChats?: any[];
  reposts?: any[];
  postsCreated?: any[];
  interests?: string[];
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { incognitoMode } = useSettings();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  // Logout function
  const handleLogout = async () => {
    try {
      await logout();
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Error logging out:', error);
      // Even if logout fails, we still want to redirect
      throw error;
    }
  };
  const [showEditModal, setShowEditModal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // UI state for new side-by-side boxes + lists
  const [activeBox, setActiveBox] = useState<"companions" | "hangouts" | null>(null);
  const [loadingCompanions, setLoadingCompanions] = useState(false);
  const [loadingHangouts, setLoadingHangouts] = useState(false);
  const [companions, setCompanions] = useState<any[]>([]);
  const [hangouts, setHangouts] = useState<ChatRoom[]>([]);
  const [companionsPage, setCompanionsPage] = useState(1);
  const [hangoutsPage, setHangoutsPage] = useState(1);
  const PAGE_SIZE = 6;

  // Color scheme based on incognito mode
  const colorScheme = {
    primaryButton: incognitoMode ? 'bg-orange-500 hover:bg-orange-400' : 'bg-softgold-500 hover:bg-softgold-500',
    accentText: incognitoMode ? 'text-orange-400' : 'text-softgold-500',
    dotColor: incognitoMode ? 'bg-orange-400' : 'bg-softgold-500',
    bgMain: incognitoMode ? 'bg-black' : 'bg-zinc-900',
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Try backend profile
        try {
          const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
          const res = await fetch(`${serverUrl}/api/v1/chat/get-profile-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ uid: currentUser.uid })
          });
          if (res.ok) {
            const result = await res.json();
            const row = (Array.isArray(result.data) ? result.data[0] : result.data) || {};
            const mapped: ProfileData = {
              name: row.name || currentUser.displayName || 'Anonymous User',
              username: row.username || (currentUser.email ? currentUser.email.split('@')[0] : 'user'),
              bio: row.bio || '',
              location: row.location || 'Digital World',
              email: row.email || currentUser.email || '',
              profileImage: row.profileImage || currentUser.photoURL || "D:\nexus_rehan\aadrikaa\client\src\assets\nexus-logo.png",
              bannerImage: row.bannerImage || "https://i.pinimg.com/1200x/9e/99/c9/9e99c92270b3926f7ef59b1f8f828999.jpg",
              creationDate: row.creationDate || undefined,
              charactersCreated: row.charactersCreated || [],
              adminGroupChats: row.adminGroupChats || [],
              reposts: row.reposts || [],
              postsCreated: row.postsCreated || [],
              interests: row.interests || []
            };
            setProfileData(mapped);
            setLoading(false);
            return;
          }
        } catch {}

        // Fallback mock
        setProfileData({
          name: currentUser.displayName ?? 'Anonymous User',
          username: currentUser.email?.split('@')[0] ?? 'user',
          bio: 'Welcome to my profile! I love chatting with AI companions and connecting with amazing communities.',
          location: 'Digital World',
          email: currentUser.email ?? '',
          profileImage: currentUser.photoURL ?? 'https://i.pinimg.com/736x/d9/7b/bb/d97bbb08017ac2309307f0822e63d082.jpg',
          bannerImage: 'https://i.pinimg.com/1200x/9e/99/c9/9e99c92270b3926f7ef59b1f8f828999.jpg',
          interests: []
        });
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [currentUser]);

  // Fetch user-created companions
  useEffect(() => {
    let mounted = true;
    let fetchAttempts = 0;
    const MAX_ATTEMPTS = 3;
    
    const fetchCompanions = async () => {
      try {
        // CRITICAL FIX: Wait for authentication to be ready
        if (!currentUser) {
          console.log('⏳ Waiting for authentication before fetching companions...');
          return;
        }
        
        // CRITICAL FIX: Verify session exists before making API call
        const { supabase } = await import('../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          console.error('❌ No active session - cannot fetch companions');
          console.error('⚠️ User may need to log in again');
          return;
        }
        
        // CRITICAL FIX: Guard against multiple simultaneous fetches
        if (loadingCompanions) {
          console.log('⏳ Already loading companions, skipping duplicate request');
          return;
        }
        
        if (!mounted) return;
        
        console.log('🔍 Fetching companions for user:', currentUser.uid);
        setLoadingCompanions(true);
        
        // Use centralized API configuration
        const { API_CONFIG } = await import('../lib/config');
        const API_BASE_URL = API_CONFIG.getServerUrl();
        
        // Small delay to ensure session bridge has completed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('📡 Making API request to:', `${API_BASE_URL}/api/v1/character/user`);
        // Use authenticated api client which attaches Supabase JWT + cookies
        const response = await apiClient.post(
          `/api/v1/character/user`,
          { user_id: currentUser.uid }
        );
        
        if (!mounted) return;
        
        if (response.data?.success && response.data?.data) {
          const list = Object.values(response.data.data as Record<string, any>);
          setCompanions(Array.isArray(list) ? list : []);
          console.log('✅ Successfully loaded companions:', list.length);
        } else {
          setCompanions([]);
          console.log('ℹ️ No companions found or invalid response structure');
        }
      } catch (e: any) {
        fetchAttempts++;
        if (fetchAttempts < MAX_ATTEMPTS && mounted) {
          console.log(`⏳ Retrying companions fetch (attempt ${fetchAttempts + 1}/${MAX_ATTEMPTS})...`);
          setTimeout(() => {
            if (mounted) fetchCompanions();
          }, 1000 * fetchAttempts);
        } else {
          console.error("❌ Failed to load companions after max attempts:", e);
          console.error("❌ Error details:", {
            message: e.message,
            response: e.response?.data,
            status: e.response?.status,
            url: e.config?.url
          });
          if (mounted) {
            setCompanions([]);
            setLoadingCompanions(false);
          }
        }
      } finally {
        if (mounted && fetchAttempts >= MAX_ATTEMPTS) {
          setLoadingCompanions(false);
        }
      }
    };
    
    fetchCompanions();
    
    return () => {
      mounted = false;
    };
  }, [currentUser]); // Only depend on currentUser

  // Fetch user-created hangouts (palace + rooms)
  useEffect(() => {
    let mounted = true;
    
    const fetchHangouts = async () => {
      try {
        // CRITICAL FIX: Wait for authentication to be ready
        if (!currentUser) {
          console.log('⏳ Waiting for authentication before fetching hangouts...');
          return;
        }
        
        // CRITICAL FIX: Verify session exists before making API call
        const { supabase } = await import('../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          console.error('❌ No active session - cannot fetch hangouts');
          return;
        }
        
        // CRITICAL FIX: Guard against multiple simultaneous fetches
        if (loadingHangouts) {
          console.log('⏳ Already loading hangouts, skipping duplicate request');
          return;
        }
        
        if (!mounted) return;
        
        setLoadingHangouts(true);
        const rooms = await hangoutService.getRooms();
        
        if (!mounted) return;
        
        const mine = (rooms || []).filter(r => (r as any).createdBy === currentUser.uid);
        setHangouts(mine);
        console.log('✅ Successfully loaded hangouts:', mine.length);
      } catch (e) {
        console.error("❌ Failed to load hangouts:", e);
        if (mounted) {
          setHangouts([]);
        }
      } finally {
        if (mounted) {
          setLoadingHangouts(false);
        }
      }
    };
    
    fetchHangouts();
    
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${profileData?.name}'s profile on Nexus!`;
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
    }
    
    setShowShareModal(false);
  };

  const handleSettings = () => {
    setSettingsOpen(true);
  };

  // Mini panels for MobileSettingsPanel
  const NotificationsMini: React.FC = () => {
    const [state, setState] = useState({
      aiMessages: true,
      groupMentions: true,
      videoInvites: true,
      emailUpdates: false,
      pushNotifications: true,
    });

    React.useEffect(() => {
      const t = setTimeout(async () => {
        try { await settingsService.updateNotificationPreferences(state as any); } catch (e) { /* ignore */ }
      }, 400);
      return () => clearTimeout(t);
    }, [state]);

    const Row = ({ label, value, onToggle }: { label: string; value: boolean; onToggle: ()=>void }) => (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-zinc-300">{label}</span>
        <button onClick={onToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-softgold-500' : 'bg-zinc-600'}`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    );

    return (
      <div className="pt-2">
        <Row label="AI Messages" value={state.aiMessages} onToggle={() => setState(s=>({...s, aiMessages: !s.aiMessages}))} />
        <Row label="Group Mentions" value={state.groupMentions} onToggle={() => setState(s=>({...s, groupMentions: !s.groupMentions}))} />
        <Row label="Video Invites" value={state.videoInvites} onToggle={() => setState(s=>({...s, videoInvites: !s.videoInvites}))} />
        <Row label="Email Updates" value={state.emailUpdates} onToggle={() => setState(s=>({...s, emailUpdates: !s.emailUpdates}))} />
        <Row label="Push Notifications" value={state.pushNotifications} onToggle={() => {
          const next = !state.pushNotifications;
          if (next && 'Notification' in window) { Notification.requestPermission().catch(()=>{}); }
          setState(s=>({...s, pushNotifications: next}));
        }} />
        <p className="text-xs text-zinc-500 mt-2">Saved automatically.</p>
      </div>
    );
  };

  const profileSections: any[] = [];

  if (loading) {
    return (
      <div className={`min-h-screen ${colorScheme.bgMain} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-softgold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className={`min-h-screen ${colorScheme.bgMain} flex items-center justify-center`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-zinc-400 mb-6">Unable to load profile data.</p>
          <button
            onClick={() => navigate("/")}
            className={`px-6 py-2 ${colorScheme.primaryButton} text-white rounded-lg transition-colors`}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colorScheme.bgMain}`}>
      {/* Banner Header - 30% of screen */}
      <div className="relative h-[30vh] min-h-[300px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${profileData.bannerImage})`,
          }}
        />
        <div className={`absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 ${incognitoMode ? 'to-black' : 'to-zinc-900'}`} />
        
        {/* Back Button removed as per design update */}

        {/* Top Right Buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={handleSettings}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-zinc-700/80 backdrop-blur-sm text-white hover:bg-zinc-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="relative -mt-16 z-10 px-4">
        <div className="w-full">
          {/* Profile Avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-zinc-800 bg-zinc-800">
              <img
                src={profileData.profileImage}
                alt={profileData.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Name and Username */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">{profileData.name}</h1>
            <p className="text-zinc-400">@{profileData.username}</p>
          </div>


          {/* Edit Profile Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setShowEditModal(true)}
              className={`flex items-center space-x-2 px-8 py-3 ${colorScheme.primaryButton} text-black rounded-xl font-semibold transition-colors`}
            >
              <Edit3 className="w-5 h-5" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Side-by-side boxes: Companions and Hangouts */}
          <div className="px-2 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveBox(activeBox === "companions" ? null : "companions")}
                className={`flex items-center justify-between rounded-2xl px-4 py-5 bg-zinc-800/60 border border-white/10 hover:bg-zinc-700/60 transition-all ${activeBox === "companions" ? "ring-2 ring-softgold-500" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6 text-softgold-500" />
                  <div className="text-left">
                    <div className="text-white font-semibold">Companions</div>
                    <div className="text-zinc-400 text-sm">{companions.length} created</div>
                  </div>
                </div>
                <LayoutGrid className="w-5 h-5 text-zinc-400" />
              </button>

              <button
                onClick={() => setActiveBox(activeBox === "hangouts" ? null : "hangouts")}
                className={`flex items-center justify-between rounded-2xl px-4 py-5 bg-zinc-800/60 border border-white/10 hover:bg-zinc-700/60 transition-all ${activeBox === "hangouts" ? "ring-2 ring-softgold-500" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-softgold-500" />
                  <div className="text-left">
                    <div className="text-white font-semibold">Hangouts</div>
                    <div className="text-zinc-400 text-sm">{hangouts.length} created</div>
                  </div>
                </div>
                <LayoutGrid className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
          </div>

          {/* Expandable panes */}
          {activeBox === "companions" && (
            <div className="mb-8 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
              {loadingCompanions ? (
                <div className="py-8 text-center text-zinc-400">Loading companions...</div>
              ) : companions.length === 0 ? (
                <div className="py-8 text-center text-zinc-500">You haven't created any companions yet.</div>
              ) : (
                <div className="space-y-3">
                  {companions
                    .slice((companionsPage - 1) * PAGE_SIZE, companionsPage * PAGE_SIZE)
                    .map((c: any) => (
                      <div key={c.id || c.name} className="flex items-center justify-between rounded-xl bg-zinc-800/60 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={c.image} alt={c.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <div className="text-white font-medium">{c.name}</div>
                            <div className="text-xs text-zinc-400">{c.role || "AI Companion"}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/character/${(c.slug) || c.id || ''}`)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => navigate('/create-buddy', { state: { characterId: c.id } })}
                            className="px-3 py-1.5 text-sm rounded-lg bg-softgold-500 text-black hover:opacity-90"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  {/* Pagination */}
                  {companions.length > PAGE_SIZE && (
                    <div className="flex justify-center items-center gap-3 pt-2">
                      <button
                        onClick={() => setCompanionsPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-50"
                        disabled={companionsPage === 1}
                      >
                        Prev
                      </button>
                      <span className="text-zinc-400 text-sm">
                        Page {companionsPage} / {Math.ceil(companions.length / PAGE_SIZE)}
                      </span>
                      <button
                        onClick={() => setCompanionsPage(p => Math.min(Math.ceil(companions.length / PAGE_SIZE), p + 1))}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-50"
                        disabled={companionsPage >= Math.ceil(companions.length / PAGE_SIZE)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeBox === "hangouts" && (
            <div className="mb-8 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
              {loadingHangouts ? (
                <div className="py-8 text-center text-zinc-400">Loading hangouts...</div>
              ) : hangouts.length === 0 ? (
                <div className="py-8 text-center text-zinc-500">You haven't created any hangouts yet.</div>
              ) : (
                <div className="space-y-3">
                  {hangouts
                    .slice((hangoutsPage - 1) * PAGE_SIZE, hangoutsPage * PAGE_SIZE)
                    .map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-xl bg-zinc-800/60 px-4 py-3">
                        <div>
                          <div className="text-white font-medium">{r.name}</div>
                          <div className="text-xs text-zinc-400 capitalize">{r.roomType} • {r.memberCount} members</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/arena/hangout/chat/${r.id}`)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => navigate(`/arena/hangout/admin/${r.id}`)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-softgold-500 text-black hover:opacity-90"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  {/* Pagination */}
                  {hangouts.length > PAGE_SIZE && (
                    <div className="flex justify-center items-center gap-3 pt-2">
                      <button
                        onClick={() => setHangoutsPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-50"
                        disabled={hangoutsPage === 1}
                      >
                        Prev
                      </button>
                      <span className="text-zinc-400 text-sm">
                        Page {hangoutsPage} / {Math.ceil(hangouts.length / PAGE_SIZE)}
                      </span>
                      <button
                        onClick={() => setHangoutsPage(p => Math.min(Math.ceil(hangouts.length / PAGE_SIZE), p + 1))}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 disabled:opacity-50"
                        disabled={hangoutsPage >= Math.ceil(hangouts.length / PAGE_SIZE)}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Profile Information Sections */}
          <div className="space-y-6">
            {profileSections.map((section) => {
              const Icon = section.icon;
              
              return (
                <div key={section.id} className="bg-zinc-800/50 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Icon className={`w-6 h-6 ${colorScheme.accentText}`} />
                    <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                  </div>
                  <div className="pl-9">
                    {section.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Spacing */}
          <div className="h-8" />
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-800 rounded-2xl w-full max-w-sm mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Share Profile</h2>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-zinc-400 hover:text-zinc-300"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleShare('copy')}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg bg-zinc-700/50 hover:bg-zinc-600/50 transition-colors"
                >
                  <Copy className="w-5 h-5 text-zinc-400" />
                  <span className="text-white">Copy Profile Link</span>
                </button>

                <div className="pt-3 border-t border-zinc-700">
                  <p className="text-xs text-zinc-500 mb-2">User ID</p>
                  <div className="flex items-center space-x-2 p-2 bg-zinc-700/50 rounded-lg">
                    <code className="flex-1 text-sm text-zinc-300 font-mono">{currentUser?.uid}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentUser?.uid || '');
                        setShowShareModal(false);
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-300"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && profileData && (
        <EditProfileModal
          profileData={{
            name: profileData.name,
            username: profileData.username,
            bio: profileData.bio,
            location: profileData.location,
            email: profileData.email,
            profileImage: profileData.profileImage,
            bannerImage: profileData.bannerImage,
            interests: profileData.interests || []
          }}
          setProfileData={(updatedData) => {
            if (typeof updatedData === 'function') {
              setProfileData(prev => {
                if (!prev) return null;
                const updated = updatedData({
                  name: prev.name,
                  username: prev.username,
                  bio: prev.bio,
                  location: prev.location,
                  email: prev.email,
                  profileImage: prev.profileImage,
                  bannerImage: prev.bannerImage,
                  interests: prev.interests || []
                });
                return { ...prev, ...updated };
              });
            } else {
              setProfileData(prev => prev ? { ...prev, ...updatedData } : null);
            }
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Settings Modal/Sheet */}
      {settingsOpen && (
        <MobileSettingsPanel
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          sections={[
            {
              id: 'profile',
              title: 'Profile Details',
              icon: UserIcon,
              children: (
                <div className="space-y-3 pt-4">
                  <div className="grid grid-cols-1 gap-3">
                    <label className="text-sm text-zinc-300">Display name
                      <input className="mt-1 w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white" value={profileData?.name || ''} onChange={(e)=> setProfileData(p=> p? { ...p, name: e.target.value } : p)} onBlur={async()=>{
                        // auto-save name via existing update API
                        try { await fetch(`${import.meta.env.VITE_SERVER_URL || window.location.origin}/api/v1/chat/update-profile`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ uid: currentUser?.uid, name: profileData?.name }) }); } catch {}
                      }} />
                    </label>
                    <label className="text-sm text-zinc-300">Username
                      <input className="mt-1 w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white" value={profileData?.username || ''} onChange={(e)=> setProfileData(p=> p? { ...p, username: e.target.value } : p)} onBlur={async()=>{
                        try { await fetch(`${import.meta.env.VITE_SERVER_URL || window.location.origin}/api/v1/chat/update-profile`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ uid: currentUser?.uid, username: profileData?.username }) }); } catch {}
                      }} />
                    </label>
                    <label className="text-sm text-zinc-300">Bio
                      <textarea className="mt-1 w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white" rows={3} value={profileData?.bio || ''} onChange={(e)=> setProfileData(p=> p? { ...p, bio: e.target.value } : p)} onBlur={async()=>{
                        try { await fetch(`${import.meta.env.VITE_SERVER_URL || window.location.origin}/api/v1/chat/update-profile`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ uid: currentUser?.uid, bio: profileData?.bio }) }); } catch {}
                      }} />
                    </label>
                  </div>
                </div>
              )
            },
            {
              id: 'notifications',
              title: 'Notifications',
              icon: Bell,
              children: (
                <NotificationsMini />
              )
            },
            {
              id: 'help',
              title: 'Help',
              icon: HelpCircle,
              children: (
                <div className="pt-4 space-y-4">
                  <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-softgold-500/10 rounded-lg">
                        <Mail className="w-5 h-5 text-softgold-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">Contact Us</h4>
                        <p className="text-zinc-400 text-sm mb-3">
                          Need help? Reach out to our support team
                        </p>
                        <a
                          href="https://mail.google.com/mail/?view=cm&fs=1&to=nexusschats@gmail.com&su=Help%20Request%20-%20Nexus%20Support"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-softgold-500 hover:bg-softgold-600 text-black rounded-lg font-medium transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          nexusschats@gmail.com
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-zinc-500">
                    We typically respond within 24-48 hours
                  </div>
                </div>
              )
            },
            {
              id: 'logout',
              title: 'Logout',
              icon: LogOut,
              children: (
                <div className="pt-4">
                  <button
                    onClick={async () => {
                      try {
                        await handleLogout();
                        navigate('/login');
                      } catch (error) {
                        // Even if logout fails, still redirect to login
                        console.error('Logout error:', error);
                        navigate('/login');
                      }
                    }}
                    className="w-full py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )
            }
          ]}
        />
      )}
      
    </div>
  );
};

export default Profile;