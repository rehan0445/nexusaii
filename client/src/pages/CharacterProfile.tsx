import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MessageCircle, 
  User,
  Palette,
  Brain,
  Play,
} from 'lucide-react';
import { useCharacterContext } from '../contexts/CharacterContext';
import { useSettings } from '../contexts/SettingsContext';
import FullPageLoader from '../components/FullPageLoader';
import { incrementView } from '../utils/viewsManager';

const CharacterProfile: React.FC = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { characters, loading: loadingCharacters } = useCharacterContext();
  const { incognitoMode } = useSettings();
  

  // Color scheme based on incognito mode
  const colorScheme = {
    primaryButton: incognitoMode ? 'bg-orange-500 hover:bg-orange-400' : 'bg-softgold-500 hover:bg-softgold-500',
    accentText: incognitoMode ? 'text-orange-400' : 'text-softgold-500',
    dotColor: incognitoMode ? 'bg-orange-400' : 'bg-softgold-500',
  };

  const character = characterId ? characters[characterId] : null;

  // Track view when profile is opened
  useEffect(() => {
    if (characterId) {
      const trackView = async () => {
        try {
          await incrementView(characterId);
          console.log(`✅ View tracked for character profile: ${characterId}`);
        } catch (error) {
          console.error('❌ Failed to track character profile view:', error);
        }
      };
      trackView();
    }
  }, [characterId]);

  // Ensure page starts at top when opened
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      // Also reset any scrollable containers
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch {}
  }, []);

  if (loadingCharacters) {
    return <FullPageLoader />;
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Character Not Found</h1>
          <p className="text-zinc-400 mb-6">The character you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/ai")}
            className={`px-6 py-2 ${colorScheme.primaryButton} text-zinc-900 rounded-lg transition-colors`}
          >
            Back to Characters
          </button>
        </div>
      </div>
    );
  }



  const profileSections = [
    {
      id: 'basic',
      title: 'Basic Information',
      icon: User,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-1">Name</h4>
            <p className="text-white">{character.name}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-1">Role</h4>
            <p className="text-white">{character.role || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-1">Age</h4>
            <p className="text-white">{character.age || 'Not specified'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-1">Background</h4>
            <p className="text-zinc-300">{character.personality?.background || 'No background provided.'}</p>
          </div>
        </div>
      )
    },
    {
      id: 'visual',
      title: 'Visual Identity',
      icon: Palette,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-1">Character Image</h4>
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-zinc-700">
              <img
                src={character.image}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-1">Visual Description</h4>
            <p className="text-zinc-300">{character.appearance || 'No visual description provided.'}</p>
          </div>
        </div>
      )
    },
    {
      id: 'emotional',
      title: 'Emotional State',
      icon: Brain,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-1">Current Mood</h4>
            <p className="text-white">{character.mood || 'Balanced'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-1">Emotional Range</h4>
            <p className="text-zinc-300">{character.emotionalRange || 'Expressive and dynamic emotional responses'}</p>
          </div>
        </div>
      )
    },
    {
      id: 'personality',
      title: 'Chatbot Personality',
      icon: Brain,
      content: (
        <div className="space-y-4">
          {character.personality?.traits && character.personality.traits.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-2">Personality Traits</h4>
              <div className="space-y-1">
                {character.personality.traits.map((trait) => (
                  <div key={trait} className="flex items-center space-x-2">
                    <div className={`w-2 h-2 ${colorScheme.dotColor} rounded-full`}></div>
                    <p className="text-zinc-300">{trait}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {character.personality?.interests && character.personality.interests.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-2">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {character.personality.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-2 py-1 bg-zinc-700/50 text-zinc-300 rounded-lg text-xs"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {character.personality?.quirks && character.personality.quirks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-2">Unique Quirks</h4>
              <div className="space-y-1">
                {character.personality.quirks.map((quirk) => (
                  <div key={quirk} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <p className="text-zinc-300">{quirk}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'scenario',
      title: 'Starting Scenario',
      icon: Play,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-1">Greeting</h4>
            <p className="text-zinc-300">{character.languages?.greeting || 'Hello! Nice to meet you!'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-zinc-400 mb-1">Initial Context</h4>
            <p className="text-zinc-300">{character.scenario || 'Ready to start a conversation with you!'}</p>
          </div>
          {character.tags && character.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-400 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {character.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-zinc-700/50 text-zinc-300 rounded-lg text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="companion-theme min-h-screen bg-zinc-900">
      {/* Character Image Header - 30% of screen */}
      <div className="relative h-[30vh] min-h-[300px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${character.image})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-zinc-900" />
        
        {/* Back Button */}
        <button
          onClick={() => navigate("/ai")}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Character Info Section */}
      <div className="relative -mt-16 z-10 px-4">
        <div className="w-full">
          {/* Character Avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-zinc-800 bg-zinc-800">
              <img
                src={character.image}
                alt={character.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Name and Creator */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2 serif-title">{character.name}</h1>
            {character.creator && (
              <button
                onClick={() => navigate(`/creator/${encodeURIComponent(character.creator)}`)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                by {character.creator}
              </button>
            )}
            {!character.creator && (
              <p className="text-zinc-400">by ginger3000</p>
            )}
          </div>


          {/* Start Chat Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => navigate(`/chat/${characterId}`)}
              className={`flex items-center space-x-2 px-8 py-3 ${colorScheme.primaryButton} text-black rounded-xl font-semibold transition-colors`}
            >
              <MessageCircle className="w-5 h-5" />
              <span>Start Chatting</span>
            </button>
          </div>

          {/* Character Information Sections */}
          <div className="space-y-6">
            {profileSections.map((section) => {
              const Icon = section.icon;
              
              return (
                <div key={section.id} className="bg-zinc-800/50 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Icon className={`w-6 h-6 ${colorScheme.accentText}`} />
                    <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                  </div>
                  <div className="pl-9">
                    {section.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Spacing */}
          <div className="h-8" />
        </div>
      </div>

    </div>
  );
};

export default CharacterProfile;
