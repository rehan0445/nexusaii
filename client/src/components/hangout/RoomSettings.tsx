import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  X, 
  Image, 
  Upload, 
  Crown, 
  Shield,
  Users,
  Lock,
  Globe,
  AlertTriangle
} from 'lucide-react';
import { hangoutService } from '../../services/hangoutService';

interface RoomSettingsProps {
  roomId: string;
  currentUserRole: 'admin' | 'co-admin' | 'member';
  roomData: {
    name: string;
    description: string;
    rules: string[];
    banner?: string;
    icon?: string;
    isPrivate: boolean;
    maxCoAdmins?: number;
  };
  onSettingsUpdate?: (settings: any) => void;
}

const RoomSettings: React.FC<RoomSettingsProps> = ({ 
  roomId, 
  currentUserRole, 
  roomData, 
  onSettingsUpdate 
}) => {
  const [settings, setSettings] = useState({
    name: roomData.name,
    description: roomData.description,
    rules: roomData.rules,
    banner: roomData.banner || '',
    icon: roomData.icon || '',
    isPrivate: roomData.isPrivate,
    maxCoAdmins: roomData.maxCoAdmins || 3
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showBannerUpload, setShowBannerUpload] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const canEditSettings = currentUserRole === 'admin' || currentUserRole === 'co-admin';

  const iconOptions = [
    '💬', '🎮', '💻', '🏫', '📚', '⚽', '🎨', '🎵', '💼', '🌟',
    '🔥', '💡', '🚀', '🎯', '⭐', '❤️', '🎉', '🎊', '🏆', '🎭'
  ];

  const handleSave = async () => {
    if (!canEditSettings) return;
    
    setIsSaving(true);
    try {
      const success = await hangoutService.updateRoomSettings(roomId, {
        name: settings.name,
        description: settings.description,
        rules: settings.rules,
        banner: settings.banner,
        icon: settings.icon
      });
      
      if (success) {
        onSettingsUpdate?.(settings);
        alert('Settings updated successfully!');
      } else {
        alert('Failed to update settings. Please try again.');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setBannerFile(file);
      const preview = URL.createObjectURL(file);
      setBannerPreview(preview);
    }
  };

  const addRule = () => {
    if (newRule.trim()) {
      setSettings(prev => ({
        ...prev,
        rules: [...prev.rules, newRule.trim()]
      }));
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setSettings(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const updateRule = (index: number, value: string) => {
    setSettings(prev => ({
      ...prev,
      rules: prev.rules.map((rule, i) => i === index ? value : rule)
    }));
  };

  if (!canEditSettings) {
    return (
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
        <Shield className="w-12 h-12 text-white/50 mx-auto mb-4" />
        <p className="text-white/70">
          Only admins and co-admins can modify room settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Room Basic Info */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Room Settings
        </h3>
        
        <div className="space-y-4">
          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Room Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-softgold-400 focus:bg-white/15 transition-all duration-300"
              placeholder="Enter room name"
              maxLength={50}
            />
            <p className="text-xs text-white/50 mt-1">{settings.name.length}/50 characters</p>
          </div>

          {/* Room Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Description</label>
            <textarea
              value={settings.description}
              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-softgold-400 focus:bg-white/15 transition-all duration-300 resize-none"
              rows={3}
              placeholder="Describe what this room is about..."
              maxLength={500}
            />
            <p className="text-xs text-white/50 mt-1">{settings.description.length}/500 characters</p>
          </div>

          {/* Room Icon */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Room Icon</label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-softgold-500 to-softgold-600 rounded-xl flex items-center justify-center text-2xl">
                {settings.icon || '🏠'}
              </div>
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Choose Icon
              </button>
            </div>
            
            {showIconPicker && (
              <div className="mt-3 p-4 bg-white/5 rounded-xl">
                <div className="grid grid-cols-10 gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => {
                        setSettings(prev => ({ ...prev, icon }));
                        setShowIconPicker(false);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Room Banner */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Room Banner</label>
            <div className="space-y-3">
              {bannerPreview && (
                <div className="relative">
                  <img 
                    src={bannerPreview} 
                    alt="Banner preview" 
                    className="w-full h-32 object-cover rounded-xl"
                  />
                  <button
                    onClick={() => {
                      setBannerPreview(null);
                      setBannerFile(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => document.getElementById('banner-upload')?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Banner
                </button>
                
                <input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Privacy Setting */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Privacy</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={!settings.isPrivate}
                  onChange={() => setSettings(prev => ({ ...prev, isPrivate: false }))}
                  className="w-4 h-4 accent-softgold-500"
                />
                <Globe className="w-4 h-4 text-white/70" />
                <span className="text-white">Public</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={settings.isPrivate}
                  onChange={() => setSettings(prev => ({ ...prev, isPrivate: true }))}
                  className="w-4 h-4 accent-softgold-500"
                />
                <Lock className="w-4 h-4 text-white/70" />
                <span className="text-white">Private</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Room Rules */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Room Rules
        </h3>
        
        <div className="space-y-3">
          {settings.rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-white/60 text-sm w-6">{index + 1}.</span>
              <input
                type="text"
                value={rule}
                onChange={(e) => updateRule(index, e.target.value)}
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-softgold-400"
                placeholder="Enter a rule..."
              />
              <button
                onClick={() => removeRule(index)}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-sm w-6">{settings.rules.length + 1}.</span>
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addRule()}
              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-softgold-400"
              placeholder="Add a new rule..."
            />
            <button
              onClick={addRule}
              className="px-4 py-2 bg-softgold-500 hover:bg-softgold-600 text-black rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Co-Admin Limit (Admin Only) */}
      {currentUserRole === 'admin' && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Admin Settings
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">Maximum Co-Admins</label>
            <input
              type="number"
              value={settings.maxCoAdmins}
              onChange={(e) => setSettings(prev => ({ ...prev, maxCoAdmins: Number(e.target.value) }))}
              className="w-32 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-softgold-400"
              min="1"
              max="5"
            />
            <p className="text-xs text-white/50 mt-1">Maximum number of co-admins allowed (1-5)</p>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-gradient-to-r from-softgold-500 to-softgold-600 hover:from-softgold-600 hover:to-softgold-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-black rounded-xl transition-all duration-300 font-medium flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default RoomSettings;
