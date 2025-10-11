import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  X,
  AlertTriangle,
  Lock,
  Globe,
  Upload
} from 'lucide-react';
import { useHangout } from '../../contexts/HangoutContext';
import { hangoutService } from '../../services/hangoutService';

interface AdminPanelProps {
  roomId: string;
  currentUserRole: 'admin' | 'co-admin' | 'member';
  roomData: {
    name: string;
    description: string;
    rules: string[];
    banner?: string;
    icon?: string;
    isPrivate: boolean;
  };
  onSettingsUpdate?: (settings: any) => void;
  onSaveHandlerSet?: (handler: (() => void) | null) => void;
  onSavingStateSet?: (saving: boolean) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  roomId,
  currentUserRole,
  roomData,
  onSettingsUpdate,
  onSaveHandlerSet,
  onSavingStateSet
}) => {
  const { updateRoom } = useHangout();
  const [settings, setSettings] = useState({
    name: roomData.name,
    description: roomData.description,
    rules: roomData.rules,
    banner: roomData.banner || '',
    icon: roomData.icon || '',
    isPrivate: roomData.isPrivate
  });
  const [newRule, setNewRule] = useState('');
  const [uploadedIcon, setUploadedIcon] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const canEditSettings = currentUserRole === 'admin' || currentUserRole === 'co-admin';

  const handleSave = async () => {
    if (!canEditSettings) return;
    
    onSavingStateSet?.(true);
    try {
      const success = await hangoutService.updateRoomSettings(roomId, {
        name: settings.name,
        description: settings.description,
        rules: settings.rules,
        banner: settings.banner,
        icon: settings.icon
      });
      
      if (success) {
        // Update the room in the context to reflect changes immediately
        updateRoom(roomId, {
          name: settings.name,
          description: settings.description,
          rules: settings.rules,
          banner: settings.banner,
          icon: settings.icon
        });
        
        onSettingsUpdate?.(settings);
        showToastNotification('Settings updated successfully!');
      } else {
        showToastNotification('Failed to update settings. Please try again.');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      showToastNotification('Failed to update settings. Please try again.');
    } finally {
      onSavingStateSet?.(false);
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

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedIcon(result);
        setSettings(prev => ({ ...prev, icon: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000); // Auto-dismiss after 3 seconds
  };

  // Disable parent save button and enable autosave
  useEffect(() => {
    onSaveHandlerSet?.(null);
  }, [onSaveHandlerSet]);

  // Auto-save with debounce on any settings change
  useEffect(() => {
    if (!canEditSettings) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 600); // debounce 600ms
    return () => clearTimeout(timer);
  }, [
    canEditSettings,
    settings.name,
    settings.description,
    settings.banner,
    settings.icon,
    settings.isPrivate,
    // stringify rules for dependency equality
    JSON.stringify(settings.rules)
  ]);

  return (
    <div className="space-y-8">
      {/* Room Settings Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
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
              disabled={!canEditSettings}
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
              disabled={!canEditSettings}
            />
            <p className="text-xs text-white/50 mt-1">{settings.description.length}/500 characters</p>
          </div>

          {/* Room Icon */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Room Icon</label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-softgold-500 to-softgold-600 rounded-xl flex items-center justify-center text-2xl overflow-hidden">
                {uploadedIcon ? (
                  <img src={uploadedIcon} alt="Room icon" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  settings.icon || '🏠'
                )}
              </div>
              {canEditSettings && (
                <label className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="hidden"
                  />
                </label>
              )}
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
                  disabled={!canEditSettings}
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
                  disabled={!canEditSettings}
                />
                <Lock className="w-4 h-4 text-white/70" />
                <span className="text-white">Private</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Room Rules Section */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
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
                disabled={!canEditSettings}
              />
              {canEditSettings && (
                <button
                  onClick={() => removeRule(index)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          
          {canEditSettings && (
            <div className="flex items-center gap-3">
              <span className="text-white/60 text-sm w-6">{settings.rules.length + 1}.</span>
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRule()}
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
          )}
        </div>
      </div>


      {/* View-Only Notice for Members */}
      {currentUserRole === 'member' && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-blue-400 font-medium mb-1">View-Only Access</p>
              <p className="text-white/70 text-sm">
                You can view the room settings but cannot make changes. Contact an admin or co-admin to modify settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-softgold-500 to-softgold-600 rounded-full flex items-center justify-center">
                <span className="text-black text-sm">✓</span>
              </div>
              <p className="text-white font-medium">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
