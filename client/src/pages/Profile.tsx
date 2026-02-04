import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import EditProfileModal from "../components/EditProfileModal";
import MobileSettingsPanel from "../components/MobileSettingsPanel";
import ReferralSection from "../components/ReferralSection";
import settingsService from "../services/settingsService";
import { User as UserIcon, LogOut, HelpCircle, Mail, Camera, Edit3, Settings, Copy } from "lucide-react";

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
  const { currentUser, guestDisplayName, logout } = useAuth();
  const displayName = currentUser?.displayName ?? guestDisplayName ?? 'Anonymous User';
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


  // Color scheme - Dark Room Theme
  const colorScheme = {
    primaryButton: incognitoMode ? 'bg-orange-500 hover:bg-orange-400' : 'bg-green-500 hover:bg-green-600',
    accentText: incognitoMode ? 'text-orange-400' : 'text-green-500',
    dotColor: incognitoMode ? 'bg-orange-400' : 'bg-green-500',
    bgMain: 'bg-black',
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Support both logged-in user and guest (effectiveUserId = currentUser.uid or guest session id)
        if (!currentUser && !guestDisplayName) {
          setLoading(false);
          return;
        }

        if (currentUser) {
        // Try backend profile for logged-in user
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

        // Fallback mock for logged-in user
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
        } else {
          // Guest: show minimal profile with name from onboarding form
          setProfileData({
            name: displayName,
            username: `@${(displayName || 'user').toLowerCase().replace(/\s+/g, '')}`,
            bio: '',
            location: 'Digital World',
            email: '',
            profileImage: 'https://i.pinimg.com/736x/d9/7b/bb/d97bbb08017ac2309307f0822e63d082.jpg',
            bannerImage: 'https://i.pinimg.com/1200x/9e/99/c9/9e99c92270b3926f7ef59b1f8f828999.jpg',
            interests: []
          });
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [currentUser, guestDisplayName]);


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
        <button onClick={onToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-green-500' : 'bg-zinc-600'}`}>
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
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
        <button
          onClick={() => setShowEditModal(true)}
          className="absolute inset-0 w-full h-full group cursor-pointer"
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${profileData.bannerImage})`,
            }}
          />
          <div className={`absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 ${incognitoMode ? 'to-black' : 'to-zinc-900'} group-hover:bg-black/30 transition-colors`} />
          
          {/* Edit overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm text-white">
              <Camera className="w-4 h-4" />
              <span className="text-sm">Edit Banner</span>
            </div>
          </div>
        </button>

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
          {/* Profile Avatar - Clickable */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowEditModal(true)}
              className="relative group w-32 h-32 rounded-2xl overflow-hidden border-4 border-zinc-800 bg-zinc-800 cursor-pointer"
            >
              <img
                src={profileData.profileImage}
                alt={profileData.name}
                className="w-full h-full object-cover group-hover:opacity-70 transition-opacity"
              />
              {/* Edit overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </button>
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

          {/* Referral Section */}
          <div className="mb-6">
            <ReferralSection />
          </div>

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
              id: 'help',
              title: 'Help',
              icon: HelpCircle,
              children: (
                <div className="pt-4 space-y-4">
                  <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <Mail className="w-5 h-5 text-green-500" />
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
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-black rounded-lg font-medium transition-colors"
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
                        navigate('/');
                      } catch (error) {
                        // Even if logout fails, still redirect to login
                        console.error('Logout error:', error);
                        navigate('/');
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