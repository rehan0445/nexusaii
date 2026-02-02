import React, { useState } from 'react';
import { X } from 'lucide-react';

function AIPersonalityModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('Companion');
  const [title, setTitle] = useState('AI Companion');
  const [greeting, setGreeting] = useState('Hello! How can I help you today?');
  const [definitionVisibility, setDefinitionVisibility] = useState('public');
  const [tone, setTone] = useState('friendly');
  const [avatar, setAvatar] = useState('default');
  const [interests, setInterests] = useState<string[]>([]);

  const handleSave = () => {
    // Logic to save personality settings
    console.log('Saving personality:', { name, title, greeting, definitionVisibility, tone, avatar, interests });
    onClose();
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-zinc-800 rounded-xl max-w-lg w-full p-6 relative animate-slide-up">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-gold mb-6">Customize AI Personality</h2>
        
        <div className="mb-4">
          <label className="block text-zinc-300 mb-2">Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full bg-zinc-700 text-white rounded p-2"
            placeholder="Enter AI name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-zinc-300 mb-2">Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="w-full bg-zinc-700 text-white rounded p-2"
            placeholder="Enter AI title"
          />
        </div>

        <div className="mb-4">
          <label className="block text-zinc-300 mb-2">Greeting</label>
          <textarea 
            value={greeting} 
            onChange={(e) => setGreeting(e.target.value)} 
            className="w-full bg-zinc-700 text-white rounded p-2"
            placeholder="What will they say to start a conversation?"
            rows={3}
          />
        </div>

        <div className="mb-4">
          <label className="block text-zinc-300 mb-2">Definition Visibility</label>
          <select 
            value={definitionVisibility} 
            onChange={(e) => setDefinitionVisibility(e.target.value)} 
            className="w-full bg-zinc-700 text-white rounded p-2"
          >
            <option value="public">Public - Everyone can see</option>
            <option value="private">Private - Only I can see</option>
            <option value="friends">Friends - Only my friends can see</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-zinc-300 mb-2">Conversation Tone</label>
          <select 
            value={tone} 
            onChange={(e) => setTone(e.target.value)} 
            className="w-full bg-zinc-700 text-white rounded p-2"
          >
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="witty">Witty</option>
            <option value="casual">Casual</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-zinc-300 mb-2">Avatar</label>
          <select 
            value={avatar} 
            onChange={(e) => setAvatar(e.target.value)} 
            className="w-full bg-zinc-700 text-white rounded p-2"
          >
            <option value="default">Default Avatar</option>
            <option value="robot">Robot</option>
            <option value="human">Human</option>
            <option value="anime">Anime Style</option>
          </select>
          <p className="text-zinc-400 text-sm mt-1">Choose an avatar for your chatbot.</p>
        </div>

        <div className="mb-6">
          <label className="block text-zinc-300 mb-2">Interests</label>
          <div className="flex flex-wrap gap-2">
            {['Technology', 'Art', 'Music', 'Gaming', 'Science', 'History'].map(interest => (
              <button 
                key={interest} 
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1 rounded-full text-sm ${interests.includes(interest) ? 'bg-gold text-zinc-900' : 'bg-zinc-700 text-white'}`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={handleSave} 
            className="flex-1 bg-gold text-zinc-900 rounded-lg py-3 hover:bg-gold/90 transition-colors font-medium"
          >
            Save Personality
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 bg-zinc-700 text-white rounded-lg py-3 hover:bg-zinc-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIPersonalityModal; 