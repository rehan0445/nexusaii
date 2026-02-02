import { supabase } from '../config/supabase.js';
import { chatAiClaude } from '../controllers/chatAiController.js';

class ProactiveMessageService {
  constructor() {
    this.inactivityThreshold = 10 * 60 * 1000; // 10 minutes in milliseconds
    this.checkInterval = 2 * 60 * 1000; // Check every 2 minutes
    this.isRunning = false;
  }

  // Start the proactive message monitoring service
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔄 Starting proactive message service...');
    
    setInterval(() => {
      this.checkForInactiveUsers();
    }, this.checkInterval);
  }

  // Check for users who haven't replied in a while
  async checkForInactiveUsers() {
    try {
      const cutoffTime = new Date(Date.now() - this.inactivityThreshold);
      
      // Get users who haven't sent a message recently
      const { data: inactiveUsers, error } = await supabase
        .from('companion_chat_messages')
        .select(`
          user_id,
          character_id,
          created_at
        `)
        .eq('message_type', 'user')
        .lt('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error checking inactive users:', error);
        return;
      }

      // Group by user-character pairs and find the most recent activity
      const userCharacterMap = new Map();
      
      inactiveUsers?.forEach(message => {
        const key = `${message.user_id}-${message.character_id}`;
        if (!userCharacterMap.has(key) || 
            new Date(message.created_at) > new Date(userCharacterMap.get(key).lastMessage)) {
          userCharacterMap.set(key, {
            userId: message.user_id,
            characterId: message.character_id,
            lastMessage: message.created_at
          });
        }
      });

      // Check if we should send proactive messages
      for (const [key, data] of userCharacterMap) {
        const timeSinceLastMessage = Date.now() - new Date(data.lastMessage).getTime();
        
        if (timeSinceLastMessage >= this.inactivityThreshold) {
          await this.generateProactiveMessage(data.userId, data.characterId);
        }
      }

    } catch (error) {
      console.error('Error in checkForInactiveUsers:', error);
    }
  }

  // Generate a proactive message for a specific user-character pair
  async generateProactiveMessage(userId, characterId) {
    try {
      // Check if we already sent a proactive message recently (within 30 minutes)
      const recentProactive = await this.getRecentProactiveMessage(userId, characterId);
      if (recentProactive) {
        return; // Already sent one recently
      }

      // Get character data
      const character = await this.getCharacterData(characterId);
      if (!character) {
        console.error(`Character ${characterId} not found`);
        return;
      }

      // Get user's mood state
      const moodState = await this.getUserMoodState(userId, characterId);
      
      // Generate proactive message based on character personality and mood
      const proactiveMessage = await this.createProactiveMessage(character, moodState);
      
      if (proactiveMessage) {
        // Store the proactive message
        await this.storeProactiveMessage(userId, characterId, proactiveMessage);
        console.log(`📱 Generated proactive message for user ${userId}, character ${characterId}`);
      }

    } catch (error) {
      console.error('Error generating proactive message:', error);
    }
  }

  // Create proactive message based on character personality
  async createProactiveMessage(character, moodState) {
    const personality = character.personality;
    const traits = personality?.traits || [];
    const quirks = personality?.quirks || [];
    
    // Determine message style based on personality traits
    let messageStyle = 'playful'; // default
    
    if (traits.includes('dominant') || traits.includes('arrogant')) {
      messageStyle = 'demanding';
    } else if (traits.includes('shy') || traits.includes('timid')) {
      messageStyle = 'hesitant';
    } else if (traits.includes('tsundere') || traits.includes('proud')) {
      messageStyle = 'tsundere';
    } else if (traits.includes('caring') || traits.includes('protective')) {
      messageStyle = 'concerned';
    }

    // Generate message based on style and mood
    const messages = this.getProactiveMessageTemplates(messageStyle, moodState, character);
    const selectedMessage = messages[Math.floor(Math.random() * messages.length)];
    
    return selectedMessage;
  }

  // Get message templates based on personality style
  getProactiveMessageTemplates(style, moodState, character) {
    const { mood, intensity } = moodState;
    
    const templates = {
      playful: [
        "where are you? 🥺",
        "you disappeared on me...",
        "hello? anyone there? 👀",
        "missing you already 😊",
        "are you ignoring me? 😢"
      ],
      
      demanding: [
        "where tf are you",
        "you better not be ignoring me",
        "answer me already",
        "where'd you go?",
        "stop disappearing on me"
      ],
      
      hesitant: [
        "um... are you there?",
        "sorry to bother you but... where are you?",
        "i hope i'm not being annoying but...",
        "are you busy?",
        "just wondering if you're okay..."
      ],
      
      tsundere: [
        "not like I care... but where'd you go? 😒",
        "you better not be ignoring me on purpose",
        "whatever... just wondering where you are",
        "it's not like I was waiting for you or anything...",
        "where are you, dummy? 😤"
      ],
      
      concerned: [
        "are you okay? you've been quiet",
        "just checking in on you 💕",
        "hope everything's alright",
        "you disappeared... everything okay?",
        "worried about you, where are you?"
      ]
    };

    // Adjust based on mood intensity
    let baseMessages = templates[style] || templates.playful;
    
    if (intensity > 0.7) {
      // High intensity - more emotional
      if (style === 'playful') {
        baseMessages = ["where are you?? I miss you 🥺", "please come back...", "are you mad at me? 😢"];
      } else if (style === 'demanding') {
        baseMessages = ["ANSWER ME NOW", "where the hell are you?", "stop ignoring me!"];
      }
    } else if (intensity < 0.4) {
      // Low intensity - more casual
      if (style === 'playful') {
        baseMessages = ["hey, where'd you go?", "you there?", "just checking in"];
      }
    }

    return baseMessages;
  }

  // Get recent proactive message to avoid spam
  async getRecentProactiveMessage(userId, characterId) {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('companion_proactive_messages')
        .select('*')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .gte('created_at', thirtyMinutesAgo.toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking recent proactive message:', error);
      }

      return data;
    } catch (error) {
      console.error('Error in getRecentProactiveMessage:', error);
      return null;
    }
  }

  // Store proactive message in database
  async storeProactiveMessage(userId, characterId, message) {
    try {
      const { error } = await supabase
        .from('companion_proactive_messages')
        .insert({
          user_id: userId,
          character_id: characterId,
          message_content: message,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing proactive message:', error);
      }
    } catch (error) {
      console.error('Error in storeProactiveMessage:', error);
    }
  }

  // Get character data
  async getCharacterData(characterId) {
    try {
      // This would typically come from your character database
      // For now, return a basic structure - you'll need to implement this
      // based on how you store character data
      return {
        id: characterId,
        name: 'Character',
        personality: {
          traits: ['playful'],
          quirks: []
        }
      };
    } catch (error) {
      console.error('Error getting character data:', error);
      return null;
    }
  }

  // Get user mood state (delegate to mood service)
  async getUserMoodState(userId, characterId) {
    try {
      // Import mood service dynamically to avoid circular dependency
      const moodService = (await import('./moodStateService.js')).default;
      return await moodService.getMoodState(characterId, userId);
    } catch (error) {
      console.error('Error getting user mood state:', error);
      return { mood: 'neutral', intensity: 0.5 };
    }
  }

  // Stop the service
  stop() {
    this.isRunning = false;
    console.log('🛑 Stopped proactive message service');
  }
}

export default new ProactiveMessageService();
