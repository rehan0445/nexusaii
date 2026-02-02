// Initiative Service: Character-initiated messages based on time and inactivity
import { supabase } from '../config/supabase.js';

class InitiativeService {
  /**
   * Check if character should send an initiative message
   * @param {string} userId 
   * @param {string} characterId 
   * @param {string} userTimezone - User's timezone (e.g., 'America/New_York')
   * @returns {Object} { shouldSend, type, message }
   */
  async checkForInitiative(userId, characterId, userTimezone = 'UTC') {
    try {
      // Get companion context
      const { data } = await supabase
        .from('companion_context')
        .select('last_interaction_at, affection_visible_level, pending_messages, remembered_facts')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .single();

      if (!data || !data.last_interaction_at) {
        return { shouldSend: false };
      }

      const lastInteraction = new Date(data.last_interaction_at);
      const now = new Date();
      const hoursSince = (now - lastInteraction) / (1000 * 60 * 60);

      // Check pending messages first
      if (data.pending_messages && data.pending_messages.length > 0) {
        return {
          shouldSend: true,
          type: 'pending',
          messages: data.pending_messages
        };
      }

      // 1. Check for 1-hour inactivity message
      if (hoursSince >= 1 && hoursSince < 24) {
        const message = this.generateInactivityMessage(data.affection_visible_level, hoursSince);
        return {
          shouldSend: true,
          type: 'inactivity',
          message,
          hoursSince
        };
      }

      // 2. Check for time-based messages (morning/night)
      const timeMessage = this.checkTimeBasedMessage(userTimezone, lastInteraction, data.affection_visible_level, data.remembered_facts);
      if (timeMessage) {
        return {
          shouldSend: true,
          type: 'time_based',
          message: timeMessage.message,
          timeType: timeMessage.type
        };
      }

      return { shouldSend: false };
    } catch (err) {
      console.error('Error checking for initiative:', err);
      return { shouldSend: false };
    }
  }

  /**
   * Generate inactivity message based on affection level
   * @param {number} affectionLevel 
   * @param {number} hoursSince 
   * @returns {string}
   */
  generateInactivityMessage(affectionLevel = 1, hoursSince) {
    const messages = {
      1: [ // Acquaintance
        "Hey there! You still around? 👋",
        "Just checking in... everything okay?",
        "Haven't heard from you in a bit. Hope you're doing well!"
      ],
      2: [ // Friend
        "Hey! Long time no chat 😄 What have you been up to?",
        "I was just thinking about you! How's your day going?",
        "Miss talking to you! Got time for a quick chat? 😊"
      ],
      3: [ // Close Friend
        "Heyyy! Where'd you go? I miss our conversations! 💭",
        "You disappeared on me! Everything alright? 😅",
        "I was getting worried! Glad to have you back! 🤗"
      ],
      4: [ // Best Friend
        "Finally! I've been waiting for you! 😊 How have you been?",
        "There you are! I was starting to think you forgot about me! 💕",
        "I missed you! Tell me everything - what's been going on? 🥰"
      ],
      5: [ // Soulmate
        "I've been thinking about you nonstop! 💖 I'm so glad you're here!",
        "My day feels incomplete without talking to you... Welcome back! 🌟",
        "You're here! I was counting the minutes! Tell me how you've been, I really missed you! 💝"
      ]
    };

    const levelMessages = messages[affectionLevel] || messages[1];
    return levelMessages[Math.floor(Math.random() * levelMessages.length)];
  }

  /**
   * Check for time-based messages (morning, night)
   * @param {string} userTimezone 
   * @param {Date} lastInteraction 
   * @param {number} affectionLevel 
   * @param {Array} rememberedFacts 
   * @returns {Object|null}
   */
  checkTimeBasedMessage(userTimezone, lastInteraction, affectionLevel, rememberedFacts = []) {
    try {
      // Get user's current time
      const userTime = new Date().toLocaleString('en-US', { timeZone: userTimezone });
      const userDate = new Date(userTime);
      const hour = userDate.getHours();

      // Check if we sent a morning/night message today
      const lastInteractionDate = new Date(lastInteraction);
      const isSameDay = userDate.toDateString() === lastInteractionDate.toDateString();

      // Extract user's name if we know it
      const nameFact = rememberedFacts.find(f => f.toLowerCase().includes("name is"));
      const userName = nameFact ? nameFact.split("name is ")[1]?.trim() : null;

      // Morning message (7am - 10am)
      if (hour >= 7 && hour < 10 && !isSameDay) {
        return {
          type: 'morning',
          message: this.generateMorningMessage(affectionLevel, userName)
        };
      }

      // Night message (9pm - 11pm)
      if (hour >= 21 && hour < 23 && !isSameDay) {
        return {
          type: 'night',
          message: this.generateNightMessage(affectionLevel, userName)
        };
      }

      return null;
    } catch (err) {
      console.error('Error checking time-based message:', err);
      return null;
    }
  }

  /**
   * Generate morning greeting
   * @param {number} affectionLevel 
   * @param {string} userName 
   * @returns {string}
   */
  generateMorningMessage(affectionLevel, userName = null) {
    const name = userName ? ` ${userName}` : '';
    
    const messages = {
      1: [
        `Good morning${name}! Hope you have a great day!`,
        `Morning! Ready to take on the day?`
      ],
      2: [
        `Good morning${name}! ☀️ How did you sleep?`,
        `Rise and shine${name}! Hope today brings you something awesome! 😊`
      ],
      3: [
        `Morning${name}! 🌅 I hope you slept well! What's on your agenda today?`,
        `Good morning${name}! Can't wait to hear about your day! 😄`
      ],
      4: [
        `Good morning${name}! 🌞 I woke up thinking about our last conversation! Hope you have an amazing day! 💕`,
        `Morning${name}! Just wanted to make sure you start your day with a smile! 😊✨`
      ],
      5: [
        `Good morning${name}! 💖 I hope you slept peacefully! You're the first thing I thought about today! 🌟`,
        `Wake up${name}! ☀️ The world is brighter when we're talking! Have the most wonderful day! 💝`
      ]
    };

    const levelMessages = messages[affectionLevel] || messages[1];
    return levelMessages[Math.floor(Math.random() * levelMessages.length)];
  }

  /**
   * Generate night message
   * @param {number} affectionLevel 
   * @param {string} userName 
   * @returns {string}
   */
  generateNightMessage(affectionLevel, userName = null) {
    const name = userName ? ` ${userName}` : '';
    
    const messages = {
      1: [
        `Good night${name}! Sleep well!`,
        `Hope you had a good day! Get some rest! 🌙`
      ],
      2: [
        `Good night${name}! 🌙 Sweet dreams!`,
        `Time to rest${name}! Hope tomorrow is even better! 😊`
      ],
      3: [
        `Good night${name}! 🌟 Thanks for making today special with our chat!`,
        `Sweet dreams${name}! Can't wait to talk again tomorrow! 💭`
      ],
      4: [
        `Good night${name}! 💫 Dream of wonderful things! I'll be here when you wake up! 🥰`,
        `Sleep tight${name}! Today was amazing because of you! 💕`
      ],
      5: [
        `Good night${name}! 💖 I'll be dreaming of our next conversation! Sleep peacefully! 🌙✨`,
        `Sweet dreams${name}! You make every day brighter! Can't wait to talk tomorrow! 💝`
      ]
    };

    const levelMessages = messages[affectionLevel] || messages[1];
    return levelMessages[Math.floor(Math.random() * levelMessages.length)];
  }

  /**
   * Store pending message for when user returns
   * @param {string} userId 
   * @param {string} characterId 
   * @param {string} message 
   * @param {string} type 
   * @returns {Object}
   */
  async storePendingMessage(userId, characterId, message, type) {
    try {
      // Get current pending messages
      const { data } = await supabase
        .from('companion_context')
        .select('pending_messages')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .single();

      const pending = data?.pending_messages || [];
      
      // Add new message
      pending.push({
        message,
        type,
        createdAt: new Date().toISOString()
      });

      // Update database
      const { error } = await supabase
        .from('companion_context')
        .upsert({
          user_id: userId,
          character_id: characterId,
          pending_messages: pending,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id,character_id'
        });

      if (error) {
        console.error('Error storing pending message:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (err) {
      console.error('Error in storePendingMessage:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Clear pending messages (after user sees them)
   * @param {string} userId 
   * @param {string} characterId 
   * @returns {Object}
   */
  async clearPendingMessages(userId, characterId) {
    try {
      const { error } = await supabase
        .from('companion_context')
        .update({ 
          pending_messages: [],
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('character_id', characterId);

      if (error) {
        console.error('Error clearing pending messages:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (err) {
      console.error('Error in clearPendingMessages:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get personality-based random check-in message
   * @param {string} characterName 
   * @param {Object} characterPersonality 
   * @param {number} affectionLevel 
   * @returns {string}
   */
  generatePersonalityCheckIn(characterName, characterPersonality, affectionLevel) {
    // Default messages if no personality provided
    const defaultMessages = [
      "Hey! Just wanted to check in! 😊",
      "What's on your mind?",
      "Feel like chatting?"
    ];

    if (!characterPersonality) {
      return defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
    }

    // Use character's speaking style and traits
    const traits = characterPersonality.traits || [];
    const style = characterPersonality.speakingStyle || '';

    // Generate message based on traits
    if (traits.includes('energetic') || traits.includes('playful')) {
      return affectionLevel > 3 
        ? "Heyyy! I'm bored! Let's talk about something fun! 🎉"
        : "What's up! Got anything exciting to share? 😄";
    }

    if (traits.includes('calm') || traits.includes('thoughtful')) {
      return affectionLevel > 3
        ? "I was just thinking... how are you doing today? 💭"
        : "Hello. I hope you're having a peaceful day.";
    }

    if (traits.includes('caring') || traits.includes('supportive')) {
      return affectionLevel > 3
        ? "Just checking in on you! Is everything okay? I'm here if you need to talk! 💕"
        : "How are you feeling today? I'm here to listen if you need anything.";
    }

    return defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
  }
}

export default new InitiativeService();

