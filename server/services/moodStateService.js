import { supabase } from '../config/supabase.js';

class MoodStateService {
  constructor() {
    this.moodCache = new Map(); // In-memory cache for quick access
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get current mood state for a character-user pair
  async getMoodState(characterId, userId) {
    const cacheKey = `${characterId}-${userId}`;
    const cached = this.moodCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('companion_mood_states')
        .select('*')
        .eq('character_id', characterId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching mood state:', error);
        return this.getDefaultMoodState();
      }

      const moodState = data || this.getDefaultMoodState();
      
      // Cache the result
      this.moodCache.set(cacheKey, {
        data: moodState,
        timestamp: Date.now()
      });

      return moodState;
    } catch (error) {
      console.error('Error in getMoodState:', error);
      return this.getDefaultMoodState();
    }
  }

  // Update mood state based on user message and context
  async updateMoodState(characterId, userId, userMessage, characterPersonality) {
    const currentMood = await this.getMoodState(characterId, userId);
    const newMood = this.calculateNewMood(currentMood, userMessage, characterPersonality);
    
    try {
      const { error } = await supabase
        .from('companion_mood_states')
        .upsert({
          character_id: characterId,
          user_id: userId,
          mood: newMood.mood,
          intensity: newMood.intensity,
          messages_since_mood_change: newMood.messagesSinceMoodChange,
          last_updated: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating mood state:', error);
        return currentMood;
      }

      // Update cache
      const cacheKey = `${characterId}-${userId}`;
      this.moodCache.set(cacheKey, {
        data: newMood,
        timestamp: Date.now()
      });

      return newMood;
    } catch (error) {
      console.error('Error in updateMoodState:', error);
      return currentMood;
    }
  }

  // Calculate new mood based on user message analysis
  calculateNewMood(currentMood, userMessage, characterPersonality) {
    const message = userMessage.toLowerCase();
    const newMood = { ...currentMood };

    // High-impact events that immediately change mood
    const highImpactEvents = this.detectHighImpactEvents(message);
    
    if (highImpactEvents.length > 0) {
      const event = highImpactEvents[0]; // Take the strongest event
      newMood.mood = event.mood;
      newMood.intensity = event.intensity;
      newMood.messagesSinceMoodChange = 0;
      return newMood;
    }

    // If no high-impact event, check if mood should decay
    if (newMood.messagesSinceMoodChange >= 4) {
      // Mood has persisted for 4+ messages, start decaying
      newMood.intensity = Math.max(0, newMood.intensity - 0.2);
      
      if (newMood.intensity <= 0.3) {
        // Mood has decayed enough, return to neutral
        newMood.mood = 'neutral';
        newMood.intensity = 0.5;
        newMood.messagesSinceMoodChange = 0;
      }
    } else {
      // Increment message count for current mood
      newMood.messagesSinceMoodChange += 1;
    }

    return newMood;
  }

  // Detect high-impact events in user message
  detectHighImpactEvents(message) {
    const events = [];

    // Apologies (high positive impact)
    if (message.includes('sorry') || message.includes('apologize') || message.includes('my bad')) {
      events.push({ mood: 'forgiving', intensity: 0.8, type: 'apology' });
    }

    // Insults or harsh criticism (high negative impact)
    if (message.includes('stupid') || message.includes('idiot') || message.includes('hate') || 
        message.includes('annoying') || message.includes('boring')) {
      events.push({ mood: 'hurt', intensity: 0.9, type: 'insult' });
    }

    // Compliments (positive impact)
    if (message.includes('love') || message.includes('amazing') || message.includes('perfect') ||
        message.includes('beautiful') || message.includes('awesome')) {
      events.push({ mood: 'happy', intensity: 0.7, type: 'compliment' });
    }

    // Confessions or deep sharing (emotional impact)
    if (message.includes('confess') || message.includes('secret') || message.includes('never told') ||
        message.includes('scared') || message.includes('worried')) {
      events.push({ mood: 'caring', intensity: 0.8, type: 'confession' });
    }

    // Teasing or playful banter (playful impact)
    if (message.includes('lol') || message.includes('haha') || message.includes('😂') ||
        message.includes('joking') || message.includes('teasing')) {
      events.push({ mood: 'playful', intensity: 0.6, type: 'teasing' });
    }

    return events;
  }

  // Get default mood state for new conversations
  getDefaultMoodState() {
    return {
      mood: 'neutral',
      intensity: 0.5,
      messagesSinceMoodChange: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  // Get mood context for AI prompt
  getMoodContext(moodState) {
    const { mood, intensity } = moodState;
    
    const moodContexts = {
      neutral: "You're in a neutral, friendly mood. Be warm and approachable.",
      happy: "You're feeling happy and energetic! Show enthusiasm and positivity.",
      sad: "You're feeling a bit down. Be more gentle and empathetic.",
      angry: "You're feeling frustrated or upset. Be more direct and sharp in your responses.",
      hurt: "You're feeling hurt or disappointed. Be more vulnerable and honest about your feelings.",
      playful: "You're in a playful, teasing mood! Be more mischievous and fun.",
      caring: "You're feeling very caring and protective. Be more nurturing and supportive.",
      forgiving: "You're feeling forgiving and understanding. Be more gentle and accepting."
    };

    const baseContext = moodContexts[mood] || moodContexts.neutral;
    const intensityModifier = intensity > 0.7 ? " (strongly)" : intensity < 0.4 ? " (mildly)" : "";
    
    return `${baseContext}${intensityModifier}`;
  }

  // Clear cache (useful for testing)
  clearCache() {
    this.moodCache.clear();
  }
}

export default new MoodStateService();
