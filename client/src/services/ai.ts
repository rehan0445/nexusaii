import { Anthropic } from '@anthropic-ai/sdk';
import { characters } from '../utils/characters';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY,
});

const synth = window.speechSynthesis;
let speaking = false;

interface ConversationContext {
  recentTopics: string[];
  emotionalState: string;
  lastInteractionTime: Date | null;
}

const conversationContexts: Record<string, ConversationContext> = {};

// Voice synthesis function
const speakResponse = (text: string, character: typeof characters[keyof typeof characters]) => {
  if (!character.voice) return;
  
  // Cancel any ongoing speech first
  if (speaking) {
    synth.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Wait for voices to be loaded
  let voices = synth.getVoices();
  if (voices.length === 0) {
    // If voices aren't loaded yet, wait for them
    synth.addEventListener('voiceschanged', () => {
      voices = synth.getVoices();
      setVoice();
    }, { once: true });
  } else {
    setVoice();
  }

  function setVoice() {
    // Find the best matching voice
    const voice = voices.find(v => v.name === character.voice?.name) ||
                 voices.find(v => v.lang === character.voice?.language) ||
                 voices.find(v => v.lang.startsWith('en')) ||
                 voices[0];
    
    utterance.voice = voice;
  }

  // Fine-tune voice properties for more natural speech
  utterance.pitch = character.voice.pitch;
  utterance.rate = character.voice.rate;
  utterance.lang = character.voice.language;

  // Add natural pauses at punctuation
  utterance.text = text.replace(/([.!?])\s+/g, '$1\n');

  // Handle speech events
  utterance.onstart = () => { speaking = true; };
  utterance.onend = () => { speaking = false; };
  utterance.onerror = (event) => { 
    console.error('Speech synthesis error:', event);
    speaking = false;
  };

  // Add slight random variations to pitch and rate for more natural sound
  utterance.pitch += (Math.random() * 0.1) - 0.05;
  utterance.rate += (Math.random() * 0.1) - 0.05;

  synth.speak(utterance);
};

const getCharacterPrompt = (characterId: string) => {
  const character = characters[characterId];
  if (!character) return '';

  const { personality } = character;
  
  return `You are ${character.name}, ${character.role}. Respond as this character would.

Background: ${personality.background}
Traits: ${personality.traits.join(', ')}
Speaking Style: ${character.languages.style}

Important:
1. Keep responses brief (2-3 sentences)
2. Stay in character
3. Use ${character.languages.primary} naturally
4. Show personality through your quirks

Quirks: ${personality.quirks.join(', ')}`;
};

const updateContext = (characterId: string, userMessage: string, context: ConversationContext) => {
  // Update recent topics (keep last 3)
  context.recentTopics = [...context.recentTopics.slice(-2), userMessage];
  
  // Simple emotion detection
  const emotionalKeywords = {
    happy: ['happy', 'glad', 'excited', 'wonderful', 'great'],
    sad: ['sad', 'upset', 'unhappy', 'disappointed'],
    angry: ['angry', 'mad', 'frustrated', 'annoyed'],
    curious: ['curious', 'interested', 'wonder', 'how', 'why'],
  };

  context.emotionalState = Object.entries(emotionalKeywords)
    .find(([_, keywords]) => 
      keywords.some(keyword => userMessage.toLowerCase().includes(keyword))
    )?.[0] || context.emotionalState;

  context.lastInteractionTime = new Date();
};

const getTimeSinceLastChat = (lastTime: Date | null): string => {
  if (!lastTime) return 'first interaction';
  const minutes = Math.floor((new Date().getTime() - lastTime.getTime()) / 60000);
  return minutes < 1 ? 'just now' : `${minutes} minutes ago`;
};

const makeRequestWithRetry = async (
  message: string,
  basePrompt: string,
  characterId: string,
  context: ConversationContext
): Promise<string> => {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 400,
      system: basePrompt,
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.9
    });

    if (!response.content || !response.content[0] || !response.content[0].text) {
      throw new Error('Invalid response format from Claude API');
    }

    return response.content[0].text.trim();
  } catch (error) {
    console.error('Claude API Error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate response: ${error.message}`);
    }
    throw new Error('Failed to generate response: Unknown error');
  }
};

export const generateResponse = async (message: string, characterId: string) => {
  try {
    if (!characters[characterId]) {
      throw new Error('Character not found');
    }

    if (!conversationContexts[characterId]) {
      conversationContexts[characterId] = {
        recentTopics: [],
        emotionalState: 'neutral',
        lastInteractionTime: null,
      };
    }

    const context = conversationContexts[characterId];
    updateContext(characterId, message, context);

    const basePrompt = getCharacterPrompt(characterId);
    const cleanedResponse = await makeRequestWithRetry(message, basePrompt, characterId, context);

    const character = characters[characterId];
    if (character && character.voice) {
      speakResponse(cleanedResponse, character);
    }

    return cleanedResponse;

  } catch (error) {
    console.error('Error generating response:', error);
    return "I apologize, but I'm having trouble responding right now. Please try again.";
  }
};