import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Settings, Shield, Users, Palette, Bell, Volume2, Moon, Sun, X } from 'lucide-react';

interface SettingSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

interface MobileSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sections: SettingSection[];
}

const MobileSettingsPanel: React.FC<MobileSettingsPanelProps> = ({
  isOpen,
  onClose,
  sections
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-zinc-900 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md sm:rounded-t-2xl sm:rounded-b-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {sections.map((section) => (
              <div key={section.id} className="bg-zinc-800 rounded-xl border border-zinc-700">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <section.icon className="w-5 h-5 text-zinc-400" />
                    <span className="text-white font-medium">{section.title}</span>
                  </div>
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                  )}
                </button>
                
                {expandedSections.has(section.id) && (
                  <div className="px-4 pb-4 border-t border-zinc-700">
                    {section.children}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Example usage components
export const ThemeSettings: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('dark');

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-3">
        {[
          { value: 'light', label: 'Light', icon: Sun },
          { value: 'dark', label: 'Dark', icon: Moon },
          { value: 'auto', label: 'Auto', icon: Settings }
        ].map(({ value, label, icon: Icon }) => (
          <label key={value} className="flex items-center space-x-3">
            <input
              type="radio"
              name="theme"
              value={value}
              checked={theme === value}
              onChange={(e) => setTheme(e.target.value as any)}
              className="w-4 h-4 text-blue-500 bg-zinc-700 border-zinc-600 focus:ring-blue-500"
            />
            <Icon className="w-4 h-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export const NotificationSettings: React.FC = () => {
  const [notifications, setNotifications] = useState({
    messages: true,
    mentions: true,
    announcements: false,
    sounds: true
  });

  const toggleSetting = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4 pt-4">
      {Object.entries(notifications).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <span className="text-sm text-zinc-300 capitalize">{key}</span>
          <button
            onClick={() => toggleSetting(key as keyof typeof notifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value ? 'bg-blue-600' : 'bg-zinc-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  );
};

export const PrivacySettings: React.FC = () => {
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    messageHistory: '30days',
    allowDirectMessages: true
  });

  return (
    <div className="space-y-4 pt-4">
      <div>
        <label className="block text-sm text-zinc-300 mb-2">Profile Visibility</label>
        <select
          value={privacy.profileVisibility}
          onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }))}
          className="w-full px-3 py-2 bg-zinc-700 text-white rounded-lg border border-zinc-600 focus:outline-none focus:border-blue-500"
        >
          <option value="public">Public</option>
          <option value="friends">Friends Only</option>
          <option value="private">Private</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm text-zinc-300 mb-2">Message History</label>
        <select
          value={privacy.messageHistory}
          onChange={(e) => setPrivacy(prev => ({ ...prev, messageHistory: e.target.value }))}
          className="w-full px-3 py-2 bg-zinc-700 text-white rounded-lg border border-zinc-600 focus:outline-none focus:border-blue-500"
        >
          <option value="7days">7 Days</option>
          <option value="30days">30 Days</option>
          <option value="90days">90 Days</option>
          <option value="forever">Forever</option>
        </select>
      </div>
    </div>
  );
};

export default MobileSettingsPanel;
