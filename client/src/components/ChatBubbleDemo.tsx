import React, { useState } from 'react';
import { EnhancedChatBubble } from './EnhancedChatBubble';
import { themePresets, genreConfigs } from './EnhancedChatBubble';

export const ChatBubbleDemo: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<string>('heroic');
  const [selectedGenre, setSelectedGenre] = useState<string>('modern');
  const [selectedTexture, setSelectedTexture] = useState<string>('paper');

  const demoMessages = [
    {
      content: "Hello! I'm a heroic character with amazing powers!",
      sender: 'ai' as const,
      theme: 'heroic',
      genre: 'fantasy',
      texture: 'energy',
      responseType: 'emotion' as const,
      cornerEmblem: 'crown',
    },
    {
      content: "What dark secrets lie in the shadows of this city?",
      sender: 'ai' as const,
      theme: 'villainous',
      genre: 'noir',
      texture: 'metal',
      responseType: 'question' as const,
      cornerEmblem: 'shield',
    },
    {
      content: "The quantum fluctuations in the temporal field are fascinating!",
      sender: 'ai' as const,
      theme: 'futuristic',
      genre: 'scifi',
      texture: 'hologram',
      responseType: 'statement' as const,
      cornerEmblem: 'zap',
    },
    {
      content: "I feel a deep connection to the ancient magic flowing through this realm.",
      sender: 'ai' as const,
      theme: 'mystical',
      genre: 'fantasy',
      texture: 'parchment',
      responseType: 'emotion' as const,
      cornerEmblem: 'star',
    },
    {
      content: "Let's discuss the quarterly business metrics and strategic planning.",
      sender: 'ai' as const,
      theme: 'neutral',
      genre: 'modern',
      texture: 'paper',
      responseType: 'action' as const,
      cornerEmblem: 'message',
    },
    {
      content: "This is a user message with a custom theme!",
      sender: 'user' as const,
      theme: selectedTheme,
      genre: selectedGenre,
      texture: selectedTexture,
      responseType: 'statement' as const,
      cornerEmblem: 'star',
    },
  ];

  const themes = Object.keys(themePresets);
  const genres = Object.keys(genreConfigs);
  const textures = ['paper', 'hologram', 'energy', 'parchment', 'metal'];

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Enhanced Chat Bubble System
        </h1>
        
        <p className="text-center text-zinc-400 mb-12 max-w-2xl mx-auto">
          Experience the next generation of chat interfaces with adaptive theming, 
          dynamic visual elements, and genre-sensitive styling.
        </p>

        {/* Controls */}
        <div className="bg-zinc-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Customize Your Bubble</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Theme
              </label>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {themes.map(theme => (
                  <option key={theme} value={theme}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Genre
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre.charAt(0).toUpperCase() + genre.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Texture
              </label>
              <select
                value={selectedTexture}
                onChange={(e) => setSelectedTexture(e.target.value)}
                className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                {textures.map(texture => (
                  <option key={texture} value={texture}>
                    {texture.charAt(0).toUpperCase() + texture.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Demo Messages */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Theme Presets</h2>
          
          {demoMessages.slice(0, 5).map((msg, index) => (
            <div key={index} className="flex justify-start">
              <EnhancedChatBubble
                content={msg.content}
                sender={msg.sender}
                theme={msg.theme as any}
                genre={msg.genre as any}
                texture={msg.texture as any}
                responseType={msg.responseType}
                cornerEmblem={msg.cornerEmblem}
                showMetadata={true}
                showActions={true}
                onLike={() => console.log('Like')}
                onReply={() => console.log('Reply')}
                onShare={() => console.log('Share')}
                className="max-w-md"
              />
            </div>
          ))}
          
          <h2 className="text-2xl font-semibold mb-4 mt-12">Custom Theme</h2>
          <div className="flex justify-end">
            <EnhancedChatBubble
              content={demoMessages[5].content}
              sender={demoMessages[5].sender}
              theme={selectedTheme as any}
              genre={selectedGenre as any}
              texture={selectedTexture as any}
              responseType={demoMessages[5].responseType}
              cornerEmblem={demoMessages[5].cornerEmblem}
              showMetadata={true}
              showActions={true}
              onLike={() => console.log('Like')}
              onReply={() => console.log('Reply')}
              onShare={() => console.log('Share')}
              className="max-w-md"
            />
          </div>
        </div>

        {/* Features Overview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3 text-blue-400">Adaptive Theming</h3>
            <p className="text-zinc-400">
              Dynamic color extraction from character avatars and intelligent theme detection based on content analysis.
            </p>
          </div>
          
          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3 text-purple-400">Visual Elements</h3>
            <p className="text-zinc-400">
              Corner emblems, response type indicators, and contextual border effects that adapt to the conversation.
            </p>
          </div>
          
          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3 text-green-400">Genre Styling</h3>
            <p className="text-zinc-400">
              Sci-fi glassmorphism, fantasy parchment textures, modern gradients, and noir high-contrast themes.
            </p>
          </div>
          
          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3 text-yellow-400">Interactive Elements</h3>
            <p className="text-zinc-400">
              Hover-triggered animations, ripple effects, and progressively enhanced button states.
            </p>
          </div>
          
          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3 text-red-400">Responsive Design</h3>
            <p className="text-zinc-400">
              Mobile-first approach with adaptive padding, collapsible metadata, and touch-friendly interactions.
            </p>
          </div>
          
          <div className="bg-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-3 text-cyan-400">Accessibility</h3>
            <p className="text-zinc-400">
              Reduced-motion support, high-contrast themes, and semantic HTML structure for screen readers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubbleDemo; 