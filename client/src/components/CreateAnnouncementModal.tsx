import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    name: string;
    isAdmin?: boolean;
  };
  onSubmit: (data: any, type: string) => void;
  universityId?: string;
}

const MAX_CONTENT_LENGTH = 5000;


export function CreateAnnouncementModal({ isOpen, onClose, currentUser, onSubmit, universityId }: Readonly<CreateAnnouncementModalProps>) {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) return;
    if (formData.content.length > MAX_CONTENT_LENGTH) return;
    
    onSubmit(formData, 'announcement');
    
    // Reset form
    setFormData({
      title: '',
      content: ''
    });
  };

  const remainingChars = MAX_CONTENT_LENGTH - formData.content.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#000000] border border-[#F4E3B5]/20 rounded-2xl p-6 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Announcement</h2>
            <p className="text-sm text-[#a1a1aa] mt-1">Create a campus announcement</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#a1a1aa] hover:text-white transition-colors p-2 rounded-lg hover:bg-[#F4E3B5]/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="announcement-title" className="block text-white font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              id="announcement-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Tech Fest 2024 - Registration Open"
              className="w-full p-3 bg-[#000000]/50 border border-[#F4E3B5]/20 rounded-xl text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#F4E3B5]/40 focus:ring-2 focus:ring-[#F4E3B5]/20 transition-all"
              required
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="announcement-content" className="block text-white font-medium">
                Content *
              </label>
              <span className={`text-sm ${
                remainingChars < 0 
                  ? 'text-red-400' 
                  : remainingChars < 500 
                    ? 'text-yellow-400' 
                    : 'text-[#a1a1aa]'
              }`}>
                {remainingChars.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()} characters
              </span>
            </div>
            <textarea
              id="announcement-content"
              value={formData.content}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CONTENT_LENGTH) {
                  setFormData(prev => ({ ...prev, content: e.target.value }));
                }
              }}
              placeholder="Provide detailed information about your announcement..."
              rows={6}
              className={`w-full p-3 bg-[#000000]/50 border rounded-xl text-white placeholder-[#a1a1aa] focus:outline-none focus:ring-2 transition-all resize-none ${
                remainingChars < 0
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-[#F4E3B5]/20 focus:border-[#F4E3B5]/40 focus:ring-[#F4E3B5]/20'
              }`}
              required
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-[#a1a1aa] hover:text-[#F4E3B5] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.title.trim() || !formData.content.trim() || remainingChars < 0}
              className="px-6 py-2.5 bg-[#F4E3B5] hover:bg-[#F4E3B5]/80 text-black rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
