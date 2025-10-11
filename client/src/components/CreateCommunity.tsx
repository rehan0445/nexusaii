import React, { useState } from 'react';
import { X, Lock, Globe2 } from 'lucide-react';

interface CreateCommunityProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCommunity: (community: { 
    name: string; 
    description: string; 
    category: string; 
    isPrivate: boolean;
    tags: string[];
  }) => void;
}

export function CreateCommunity({ isOpen, onClose, onCreateCommunity }: CreateCommunityProps) {
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    category: 'General',
    isPrivate: false,
    tags: [] as string[]
  });
  
  const [customTag, setCustomTag] = useState('');
  
  const categories = ['Technology', 'Business', 'Art & Design', 'Gaming', 'Music', 'Education', 'Health', 'Sports', 'General'];
  const availableTags = [
    'Innovation', 'Collaboration', 'Learning', 'Networking', 'Creative', 'Professional',
    'Community', 'Support', 'Discussion', 'Events', 'Resources', 'Mentorship'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateCommunity(form);
    setForm({ 
      name: '', 
      description: '', 
      category: 'General',
      isPrivate: false,
      tags: []
    });
    onClose();
  };

  const handleTagToggle = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleAddCustomTag = () => {
    if (customTag && !form.tags.includes(customTag)) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, customTag]
      }));
      setCustomTag('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-md p-6 animate-fade-in max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Create New Community</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Community Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold"
              placeholder="Enter community name..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold resize-none"
              placeholder="Describe your community..."
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Category
            </label>
            <select
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-gold"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Privacy
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={!form.isPrivate}
                  onChange={() => setForm(prev => ({ ...prev, isPrivate: false }))}
                  className="text-gold focus:ring-gold"
                />
                <Globe2 className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300">Public - Anyone can join</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={form.isPrivate}
                  onChange={() => setForm(prev => ({ ...prev, isPrivate: true }))}
                  className="text-gold focus:ring-gold"
                />
                <Lock className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-300">Private - Approval required</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    form.tags.includes(tag)
                      ? 'bg-gold text-zinc-900'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                className="flex-1 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-gold text-sm"
                placeholder="Add custom tag..."
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gold hover:bg-gold/90 rounded-lg text-zinc-900 font-medium transition-colors"
            >
              Create Community
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 