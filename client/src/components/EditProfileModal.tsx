// src/components/EditProfileModal.tsx
import React, { useState, useEffect } from "react";
import { X, Camera, Save } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: any;
  providerData: any[];
  refreshToken: string;
  tenantId: string | null;
  delete: () => Promise<void>;
  getIdToken: () => Promise<string>;
  getIdTokenResult: () => Promise<any>;
  reload: () => Promise<void>;
  toJSON: () => any;
  phoneNumber: string | null;
  providerId: string;
}

interface ProfileData {
  name: string;
  username: string;
  bio: string;
  location: string;
  email: string;
  profileImage: string;
  bannerImage: string;
  interests: string[];
}

interface EditProfileModalProps {
  profileData: ProfileData;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileData>>;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  profileData,
  setProfileData,
  onClose,
}) => {
  const [localProfileData, setLocalProfileData] = useState<ProfileData>(profileData);
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string>('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Update local state when profileData prop changes
  useEffect(() => {
    setLocalProfileData(profileData);
  }, [profileData]);

  // Debounced username validation
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (!localProfileData.username || localProfileData.username.length < 2) {
        setUsernameError('');
        return;
      }

      const cleanUsername = localProfileData.username.startsWith('@') 
        ? localProfileData.username.substring(1) 
        : localProfileData.username;

      if (cleanUsername.length < 2) {
        setUsernameError('Username must be at least 2 characters');
        return;
      }

      if (cleanUsername.length > 30) {
        setUsernameError('Username must be no more than 30 characters');
        return;
      }

      setCheckingUsername(true);
      setUsernameError('');

      try {
        const { supabase } = await import('../lib/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        const { data: existingProfile, error: checkError } = await supabase
          .from('user_profiles')
          .select('user_id, username')
          .eq('username', cleanUsername)
          .neq('user_id', user.id)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking username:', checkError);
          setUsernameError('Error checking username availability');
        } else if (existingProfile) {
          setUsernameError('Username is already taken');
        } else {
          setUsernameError('');
        }
      } catch (error) {
        console.error('Username validation error:', error);
        setUsernameError('Error checking username');
      } finally {
        setCheckingUsername(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [localProfileData.username, currentUser]);


  const handleInputChange = (field: keyof ProfileData, value: string) => {
    if (field === 'username') {
      let updated = value;
      if (!updated.startsWith('@')) {
        updated = '@' + updated.replace(/@/g, '');
      } else {
        updated = '@' + updated.slice(1).replace(/@/g, '');
      }
      setLocalProfileData(prev => ({ ...prev, [field]: updated }));
    } else {
      setLocalProfileData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleImageUpload = (field: 'profileImage' | 'bannerImage', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalProfileData(prev => ({
          ...prev,
          [field]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSave = async () => {
    setLoading(true);
    try {
      // Validate required fields
      if (!localProfileData.name.trim()) {
        alert('Name is required');
        setLoading(false);
        return;
      }

      if (!localProfileData.username.trim()) {
        alert('Username is required');
        setLoading(false);
        return;
      }

      if (usernameError) {
        alert(`Please fix the username error: ${usernameError}`);
        setLoading(false);
        return;
      }

      if (!currentUser) throw new Error('Not authenticated');

      // Import Supabase
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please log in to update your profile');
        setLoading(false);
        return;
      }

      // Check username uniqueness
      const cleanUsername = localProfileData.username.startsWith('@') 
        ? localProfileData.username.substring(1) 
        : localProfileData.username;

      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('user_id, username')
        .eq('username', cleanUsername)
        .neq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking username uniqueness:', checkError);
        alert('Error checking username availability. Please try again.');
        setLoading(false);
        return;
      }

      if (existingProfile) {
        alert('Username is already taken. Please choose a different username.');
        setLoading(false);
        return;
      }

      let profileImageUrl = localProfileData.profileImage;
      let bannerImageUrl = localProfileData.bannerImage;

      // Upload profile image if it's a data URL
      if (localProfileData.profileImage?.startsWith('data:')) {
        const res = await fetch(localProfileData.profileImage);
        const blob = await res.blob();
        const fileExt = blob.type.split('/')[1];
        const fileName = `${user.id}/profile_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('nexus-profile-images')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Profile image upload error:', uploadError);
          throw new Error(`Failed to upload profile image: ${uploadError.message}`);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('nexus-profile-images')
            .getPublicUrl(fileName);
          profileImageUrl = publicUrl;
        }
      }

      // Upload banner image if it's a data URL
      if (localProfileData.bannerImage?.startsWith('data:')) {
        const res = await fetch(localProfileData.bannerImage);
        const blob = await res.blob();
        const fileExt = blob.type.split('/')[1];
        const fileName = `${user.id}/banner_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('nexus-profile-images')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Banner image upload error:', uploadError);
          throw new Error(`Failed to upload banner image: ${uploadError.message}`);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('nexus-profile-images')
            .getPublicUrl(fileName);
          bannerImageUrl = publicUrl;
        }
      }

      // Prepare profile data (cleanUsername already calculated above)
      const profilePayload = {
        user_id: user.id,
        username: cleanUsername,
        display_name: localProfileData.name,
        email: localProfileData.email,
        profile_image_url: profileImageUrl,
        banner_image_url: bannerImageUrl,
        updated_at: new Date().toISOString()
      };

      // Upsert profile data
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profilePayload, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (profileError) {
        console.error('Profile save error:', profileError);

        // Handle specific database errors
        if (profileError.message?.includes('Username') && profileError.message?.includes('already taken')) {
          throw new Error('Username is already taken. Please choose a different username.');
        }

        throw new Error(profileError.message || 'Failed to save profile');
      }

      // Update parent state
      setProfileData(prev => ({
        ...prev,
        name: localProfileData.name,
        username: localProfileData.username,
        email: localProfileData.email,
        profileImage: profileImageUrl,
        bannerImage: bannerImageUrl
      }));

      alert('Profile updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('Username') && error.message.includes('already taken')) {
          alert(error.message);
          return;
        }
        if (error.message.includes('Username') && error.message.includes('must be at least')) {
          alert(error.message);
          return;
        }
      }

      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-black border border-zinc-700 rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative text-white">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-zinc-400 hover:text-white p-1">
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 pr-8">Edit Profile</h2>

        {/* Banner Image */}
        <div className="mb-4 sm:mb-6">
          <label htmlFor="banner-image" className="block mb-2 font-medium text-sm sm:text-base">Banner Image</label>
          <div className="relative h-24 sm:h-32 rounded-lg overflow-hidden bg-black">
            <img
              src={localProfileData.bannerImage}
              className="w-full h-full object-cover"
              alt="Banner"
            />
            <label htmlFor="banner-input" className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer hover:bg-black/60 transition-colors">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              <input
                id="banner-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload("bannerImage", e)}
              />
            </label>
          </div>
        </div>

        {/* Profile Image */}
        <div className="mb-4 sm:mb-6">
          <label htmlFor="profile-image" className="block mb-2 font-medium text-sm sm:text-base">Profile Image</label>
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-black">
            <img
              src={localProfileData.profileImage}
              className="w-full h-full object-cover"
              alt="Profile"
            />
            <label htmlFor="profile-input" className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer hover:bg-black/60 transition-colors">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <input
                id="profile-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload("profileImage", e)}
              />
            </label>
          </div>
        </div>

        {/* Name */}
        <div className="mb-3 sm:mb-4">
          <label htmlFor="name-input" className="block mb-2 font-medium text-sm sm:text-base">Name</label>
          <input
            id="name-input"
            type="text"
            value={localProfileData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-black border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-softgold-500 text-sm sm:text-base"
            placeholder="Enter your name"
          />
        </div>

        {/* Username */}
        <div className="mb-3 sm:mb-4">
          <label htmlFor="username-input" className="block mb-2 font-medium text-sm sm:text-base">Username</label>
          <div className="relative">
            <input
              id="username-input"
              type="text"
              value={localProfileData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className={`w-full py-2 sm:py-3 px-3 sm:px-4 bg-black border rounded-lg text-white focus:outline-none focus:ring-2 text-sm sm:text-base ${
                (() => {
                  if (usernameError) return 'border-red-500 focus:ring-red-500';
                  if (usernameError === '' && localProfileData.username.length > 1) return 'border-green-500 focus:ring-green-500';
                  return 'border-zinc-600 focus:ring-softgold-500';
                })()
              }`}
              placeholder="@username"
            />
            {checkingUsername && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">Usernames always start with "@"</p>
          {usernameError && (
            <p className="text-xs sm:text-sm text-red-400 mt-1">{usernameError}</p>
          )}
          {!usernameError && localProfileData.username.length > 1 && (
            <p className="text-xs sm:text-sm text-green-400 mt-1">✓ Username is available</p>
          )}
        </div>


        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white transition-colors text-sm sm:text-base order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !!usernameError || checkingUsername}
            className="px-3 sm:px-4 py-2 bg-gold hover:bg-yellow-500 disabled:bg-zinc-600 rounded-lg text-black font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Saving...</span>
                <span className="sm:hidden">Save</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save Changes</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
