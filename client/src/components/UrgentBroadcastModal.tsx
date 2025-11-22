import React, { useState } from 'react';
import { X, AlertTriangle, AlertCircle, Zap, Siren } from 'lucide-react';

interface UrgentBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UrgentBroadcastData) => void;
  currentUser: {
    id: string;
    name: string;
    isAdmin?: boolean;
  };
}

interface UrgentBroadcastData {
  title: string;
  content: string;
  urgencyLevel: 'critical' | 'high_alert' | 'urgent';
  broadcastType: 'exam_postponed' | 'safety_alert' | 'holiday_declared' | 'emergency';
}

const URGENCY_LEVELS = [
  {
    id: 'critical' as const,
    label: 'CRITICAL',
    description: 'Immediate attention required - Campus-wide emergency',
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    animation: 'animate-pulse'
  },
  {
    id: 'high_alert' as const,
    label: 'HIGH ALERT',
    description: 'Urgent notification - Significant impact',
    icon: AlertTriangle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    animation: 'animate-bounce'
  },
  {
    id: 'urgent' as const,
    label: 'URGENT',
    description: 'Important update - Requires attention',
    icon: Zap,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    animation: ''
  }
];

const BROADCAST_TYPES = [
  {
    id: 'exam_postponed' as const,
    label: 'Exam Postponed',
    description: 'Examination schedule changes',
    icon: '📝'
  },
  {
    id: 'safety_alert' as const,
    label: 'Safety Alert',
    description: 'Campus safety and security updates',
    icon: '🚨'
  },
  {
    id: 'holiday_declared' as const,
    label: 'Holiday Declared',
    description: 'Unexpected holiday announcements',
    icon: '🎉'
  },
  {
    id: 'emergency' as const,
    label: 'Emergency',
    description: 'Emergency situations and responses',
    icon: '⚠️'
  }
];

export function UrgentBroadcastModal({ isOpen, onClose, onSubmit, currentUser }: Readonly<UrgentBroadcastModalProps>) {
  const [formData, setFormData] = useState<UrgentBroadcastData>({
    title: '',
    content: '',
    urgencyLevel: 'urgent',
    broadcastType: 'safety_alert'
  });

  if (!isOpen || !currentUser.isAdmin) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    onSubmit(formData);
    setFormData({
      title: '',
      content: '',
      urgencyLevel: 'urgent',
      broadcastType: 'safety_alert'
    });
  };

  const selectedUrgency = URGENCY_LEVELS.find(level => level.id === formData.urgencyLevel)!;
  const selectedType = BROADCAST_TYPES.find(type => type.id === formData.broadcastType)!;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#000000] border border-[#F4E3B5]/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Siren className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Create Urgent Broadcast</h2>
              <p className="text-[#a1a1aa] text-sm">Send critical updates to all campus users</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#a1a1aa] hover:text-[#F4E3B5] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning Notice */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Important Notice</h3>
              <p className="text-red-300 text-sm">
                Urgent broadcasts will be displayed prominently to all users and may trigger push notifications. 
                Please use responsibly and only for genuinely urgent matters.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Urgency Level */}
          <div>
            <label className="block text-white font-medium mb-3">Urgency Level *</label>
            <div className="space-y-3">
              {URGENCY_LEVELS.map((level) => {
                const IconComponent = level.icon;
                const isSelected = formData.urgencyLevel === level.id;
                
                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: level.id }))}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? `${level.borderColor} ${level.bgColor} ${level.color}`
                        : 'border-[#F4E3B5]/20 text-[#a1a1aa] hover:border-[#F4E3B5]/40'
                    } ${isSelected ? level.animation : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-6 h-6" />
                      <div className="flex-1">
                        <div className="font-semibold text-lg">{level.label}</div>
                        <div className="text-sm opacity-75">{level.description}</div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-current rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Broadcast Type */}
          <div>
            <label className="block text-white font-medium mb-3">Broadcast Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {BROADCAST_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, broadcastType: type.id }))}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    formData.broadcastType === type.id
                      ? 'border-[#F4E3B5]/50 bg-[#F4E3B5]/10 text-[#F4E3B5]'
                      : 'border-[#F4E3B5]/20 text-[#a1a1aa] hover:border-[#F4E3B5]/40'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="font-semibold">{type.label}</div>
                  <div className="text-xs opacity-75 mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-white font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., CRITICAL: Mid-Semester Exams Postponed"
              className="w-full p-3 bg-[#000000]/50 border border-[#F4E3B5]/20 rounded-xl text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#F4E3B5]/40 focus:ring-2 focus:ring-[#F4E3B5]/20 transition-all"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-white font-medium mb-2">Message *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Provide clear, concise information about the urgent situation. Include what happened, what actions are being taken, and what users should do."
              rows={5}
              className="w-full p-3 bg-[#000000]/50 border border-[#F4E3B5]/20 rounded-xl text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#F4E3B5]/40 focus:ring-2 focus:ring-[#F4E3B5]/20 transition-all resize-none"
              required
            />
          </div>

          {/* Preview */}
          <div>
            <label className="block text-white font-medium mb-3">Preview</label>
            <div className={`${selectedUrgency.bgColor} ${selectedUrgency.color} p-4 rounded-2xl border-2 ${selectedUrgency.borderColor} ${selectedUrgency.animation}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <selectedUrgency.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-sm">{selectedUrgency.label}</span>
                    <span className="text-xs opacity-75">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">
                    {formData.title || 'Your broadcast title will appear here'}
                  </h3>
                  <p className="text-sm opacity-90">
                    {formData.content || 'Your broadcast message will appear here'}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs opacity-75">
                      {currentUser.name} • Admin
                    </span>
                    <span className="text-xs bg-black/20 px-2 py-1 rounded-full">
                      {selectedType.label.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#F4E3B5]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-[#a1a1aa] hover:text-[#F4E3B5] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim() || !formData.content.trim()}
              className={`px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                formData.urgencyLevel === 'critical'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : formData.urgencyLevel === 'high_alert'
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-black'
              }`}
            >
              Send {selectedUrgency.label} Broadcast
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
