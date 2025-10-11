import React, { useState } from 'react';
import { X, Upload, MapPin, Tag, Plus, Minus } from 'lucide-react';

interface LostFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LostFoundFormData) => void;
}

interface LostFoundFormData {
  title: string;
  description: string;
  category: string;
  customTags: string[];
  photos: string[];
  itemType: 'lost' | 'found';
  location: string;
  photoFiles?: File[];
}

const CATEGORIES = [
  { id: 'electronics', label: 'Electronics', icon: '📱' },
  { id: 'books', label: 'Books', icon: '📚' },
  { id: 'personal', label: 'Personal Items', icon: '👜' },
  { id: 'clothing', label: 'Clothing', icon: '👕' },
  { id: 'accessories', label: 'Accessories', icon: '⌚' },
  { id: 'other', label: 'Other', icon: '📦' }
];

const COMMON_LOCATIONS = [
  'Main Library',
  'CS Building',
  'Cafeteria',
  'Student Center',
  'Parking Lot',
  'Gymnasium',
  'Auditorium',
  'Lab Complex'
];

export function LostFoundModal({ isOpen, onClose, onSubmit }: Readonly<LostFoundModalProps>) {
  const [formData, setFormData] = useState<LostFoundFormData>({
    title: '',
    description: '',
    category: 'other',
    customTags: [],
    photos: [],
    itemType: 'lost',
    location: '',
    photoFiles: []
  });
  
  const [newTag, setNewTag] = useState('');
  const [showCustomLocation, setShowCustomLocation] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in both title and description');
      return;
    }
    
    try {
      onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        category: 'other',
        customTags: [],
        photos: [],
        itemType: 'lost',
        location: '',
        photoFiles: []
      });
      setNewTag('');
      setShowCustomLocation(false);
    } catch (error) {
      console.error('Error submitting lost & found item:', error);
      alert('Failed to submit item. Please try again.');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.customTags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        customTags: [...prev.customTags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      customTags: prev.customTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Store the actual File objects for upload
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files.map(file => file.name)] // Store filenames for display
    }));

    // Store files for actual upload
    setFormData(prev => ({
      ...prev,
      photoFiles: files
    }));
  };

  const removePhoto = (photoToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo !== photoToRemove)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#000000] border border-[#F4E3B5]/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Post Lost & Found Item</h2>
          <button
            onClick={onClose}
            className="text-[#a1a1aa] hover:text-[#F4E3B5] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Type */}
          <div>
            <label className="block text-white font-medium mb-3">Item Type</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, itemType: 'lost' }))}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  formData.itemType === 'lost'
                    ? 'border-red-500/50 bg-red-500/10 text-red-400'
                    : 'border-[#F4E3B5]/20 text-[#a1a1aa] hover:border-[#F4E3B5]/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">😢</div>
                  <div className="font-semibold">Lost</div>
                  <div className="text-sm opacity-75">I lost something</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, itemType: 'found' }))}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  formData.itemType === 'found'
                    ? 'border-green-500/50 bg-green-500/10 text-green-400'
                    : 'border-[#F4E3B5]/20 text-[#a1a1aa] hover:border-[#F4E3B5]/40'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🎉</div>
                  <div className="font-semibold">Found</div>
                  <div className="text-sm opacity-75">I found something</div>
                </div>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-white font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={formData.itemType === 'lost' ? 'e.g., Lost iPhone 14 Pro - Black' : 'e.g., Found Blue Water Bottle'}
              className="w-full p-3 bg-[#000000]/50 border border-[#F4E3B5]/20 rounded-xl text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#F4E3B5]/40 focus:ring-2 focus:ring-[#F4E3B5]/20 transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-medium mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide details about the item, where/when it was lost/found, distinctive features, etc."
              rows={4}
              className="w-full p-3 bg-[#000000]/50 border border-[#F4E3B5]/20 rounded-xl text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#F4E3B5]/40 focus:ring-2 focus:ring-[#F4E3B5]/20 transition-all resize-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-white font-medium mb-3">Category</label>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                  className={`p-3 rounded-xl border transition-all ${
                    formData.category === category.id
                      ? 'border-[#F4E3B5]/50 bg-[#F4E3B5]/10 text-[#F4E3B5]'
                      : 'border-[#F4E3B5]/20 text-[#a1a1aa] hover:border-[#F4E3B5]/40'
                  }`}
                >
                  <div className="text-2xl mb-1">{category.icon}</div>
                  <div className="text-sm font-medium">{category.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-white font-medium mb-3">Location</label>
            {!showCustomLocation ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {COMMON_LOCATIONS.map((location) => (
                    <button
                      key={location}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, location }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formData.location === location
                          ? 'border-[#F4E3B5]/50 bg-[#F4E3B5]/10 text-[#F4E3B5]'
                          : 'border-[#F4E3B5]/20 text-[#a1a1aa] hover:border-[#F4E3B5]/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm font-medium">{location}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomLocation(true)}
                  className="text-[#F4E3B5] hover:text-[#F4E3B5]/80 text-sm transition-colors"
                >
                  + Add custom location
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter custom location"
                  className="flex-1 p-3 bg-[#000000]/50 border border-[#F4E3B5]/20 rounded-xl text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#F4E3B5]/40 focus:ring-2 focus:ring-[#F4E3B5]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCustomLocation(false)}
                  className="px-3 text-[#a1a1aa] hover:text-[#F4E3B5] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Custom Tags */}
          <div>
            <label className="block text-white font-medium mb-3">Custom Tags</label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag (e.g., urgent, reward, etc.)"
                  className="flex-1 p-3 bg-[#000000]/50 border border-[#F4E3B5]/20 rounded-xl text-white placeholder-[#a1a1aa] focus:outline-none focus:border-[#F4E3B5]/40 focus:ring-2 focus:ring-[#F4E3B5]/20 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-3 bg-[#F4E3B5]/20 text-[#F4E3B5] rounded-xl hover:bg-[#F4E3B5]/30 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {formData.customTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.customTags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-2 bg-[#F4E3B5]/10 text-[#F4E3B5] px-3 py-1 rounded-lg"
                    >
                      <Tag className="w-3 h-3" />
                      <span className="text-sm">#{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-[#F4E3B5]/60 hover:text-[#F4E3B5] transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-white font-medium mb-3">Photos (Optional)</label>
            <div className="space-y-3">
              <div className="border-2 border-dashed border-[#F4E3B5]/20 rounded-xl p-6 text-center hover:border-[#F4E3B5]/40 transition-colors">
                <Upload className="w-8 h-8 text-[#F4E3B5] mx-auto mb-2" />
                <p className="text-[#a1a1aa] text-sm mb-2">
                  Upload photos to help identify the item
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="inline-block bg-[#F4E3B5]/20 text-[#F4E3B5] px-4 py-2 rounded-lg hover:bg-[#F4E3B5]/30 transition-all cursor-pointer"
                >
                  Choose Photos
                </label>
              </div>
              
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {formData.photos.map((photo, index) => (
                    <div
                      key={`photo-${photo}-${index}`}
                      className="relative bg-[#F4E3B5]/10 rounded-lg p-3 text-center"
                    >
                      <div className="text-[#F4E3B5] text-xs mb-2">Photo {index + 1}</div>
                      <button
                        type="button"
                        onClick={() => removePhoto(photo)}
                        className="absolute top-1 right-1 bg-red-500/20 text-red-400 rounded-full p-1 hover:bg-red-500/30 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
              disabled={!formData.title.trim() || !formData.description.trim()}
              className="px-6 py-3 bg-[#F4E3B5] text-black rounded-xl font-medium hover:bg-[#F4E3B5]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post {formData.itemType === 'lost' ? 'Lost' : 'Found'} Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
