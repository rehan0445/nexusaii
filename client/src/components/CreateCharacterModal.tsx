import React, { useState } from 'react';
import { X, Upload, Plus, Lock, Globe2 } from 'lucide-react';

interface CreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (character: any) => void;
}

export function CreateCharacterModal({ isOpen, onClose, onSubmit }: CreateCharacterModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    description: '',
    greeting: '',
    visibility: 'public',
    tags: [] as string[],
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const availableTags = [
    'Friendly', 'Professional', 'Creative', 'Humorous',
    'Philosophical', 'Scientific', 'Historical', 'Artistic',
    'Technical', 'Educational', 'Entertainment', 'Motivational',
    'Adventurous', 'Mysterious', 'Wise', 'Playful'
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    if (customTag && !selectedTags.includes(customTag)) {
      setSelectedTags(prev => [...prev, customTag]);
      setCustomTag('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (e) e.preventDefault();
    onSubmit({ ...formData, tags: selectedTags });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-zinc-900 rounded-xl w-[600px] max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Create New Character</h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-gold' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Character Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold"
                    placeholder="Enter character name..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Profile Image
                  </label>
                  <div className="relative">
                    {formData.image ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden group">
                        <img
                          src={formData.image}
                          alt="Character"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <label className="cursor-pointer text-white">
                            <Upload className="w-6 h-6" />
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageSelect}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="block w-32 h-32 rounded-lg border-2 border-dashed border-zinc-700 hover:border-gold transition-colors cursor-pointer">
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 hover:text-gold">
                          <Upload className="w-6 h-6 mb-2" />
                          <span className="text-sm">Upload Image</span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageSelect}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold resize-none"
                    placeholder="Describe your character..."
                    rows={4}
                    required
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Greeting Message
                  </label>
                  <textarea
                    value={formData.greeting}
                    onChange={e => setFormData(prev => ({ ...prev, greeting: e.target.value }))}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold resize-none"
                    placeholder="Enter a greeting message..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Visibility
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibility: 'public' }))}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        formData.visibility === 'public'
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <Globe2 className="w-6 h-6 mx-auto mb-2" />
                      <span className="block text-sm font-medium">Public</span>
                      <span className="block text-xs opacity-75">Visible to everyone</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibility: 'private' }))}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        formData.visibility === 'private'
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <Lock className="w-6 h-6 mx-auto mb-2" />
                      <span className="block text-sm font-medium">Private</span>
                      <span className="block text-xs opacity-75">Only visible to you</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Character Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gold/20 text-gold rounded-lg text-sm flex items-center group"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className="ml-2 hover:text-gold/80"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex space-x-2 mb-4">
                    <input
                      type="text"
                      value={customTag}
                      onChange={e => setCustomTag(e.target.value)}
                      className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold"
                      placeholder="Add custom tag..."
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                          selectedTags.includes(tag)
                            ? 'bg-gold/20 text-gold'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800">
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(prev => Math.max(1, prev - 1))}
              className={`px-6 py-2 rounded-lg transition-colors ${
                step === 1
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
              disabled={step === 1}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (step < 3) {
                  setStep(prev => prev + 1);
                } else {
                  handleSubmit(new Event('submit'));
                }
              }}
              className="px-6 py-2 bg-gold text-zinc-900 rounded-lg hover:bg-gold/90 transition-colors font-medium"
            >
              {step === 3 ? 'Create Character' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}