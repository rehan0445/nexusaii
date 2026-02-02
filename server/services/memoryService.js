// Memory Service: Extract and manage dynamic conversation memories
import { supabase } from '../config/supabase.js';

class MemoryService {
  /**
   * Extract key facts from a conversation message
   * Uses simple pattern matching to identify important information
   * @param {string} userMessage - User's message
   * @param {string} aiResponse - AI's response
   * @param {Array} existingFacts - Previously remembered facts
   * @returns {Array} New facts to remember
   */
  extractFacts(userMessage, aiResponse = '', existingFacts = []) {
    const newFacts = [];
    const message = userMessage.toLowerCase();

    // Pattern 1: "My name is X" or "I'm X" or "Call me X"
    const namePatterns = [
      /(?:my name is|i'm|i am|call me)\s+([a-z]+)/i,
      /(?:people call me|everyone calls me)\s+([a-z]+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        const name = match[1];
        // Don't add if we already have a name fact
        const hasNameFact = existingFacts.some(f => 
          f.toLowerCase().includes('name is') || f.toLowerCase().includes('called')
        );
        if (!hasNameFact) {
          newFacts.push(`User's name is ${name}`);
        }
      }
    }

    // Pattern 2: "I love/like/enjoy X"
    const interestPatterns = [
      /i (?:love|really love|really like|like|enjoy|adore)\s+([a-z\s]+?)(?:\.|!|,|$)/i,
      /(?:i'm into|i'm really into)\s+([a-z\s]+?)(?:\.|!|,|$)/i
    ];
    
    for (const pattern of interestPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        const interest = match[1].trim();
        if (interest.length > 2 && interest.length < 30) {
          newFacts.push(`User likes ${interest}`);
        }
      }
    }

    // Pattern 3: "I'm feeling/I feel X"
    const emotionPatterns = [
      /i(?:'m| am) (?:feeling|feel)\s+(tired|happy|sad|anxious|excited|stressed|worried|great|terrible|awful|amazing)/i,
      /i(?:'m| am)\s+(tired|happy|sad|anxious|excited|stressed|worried)/i
    ];
    
    for (const pattern of emotionPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        const emotion = match[1];
        newFacts.push(`User was feeling ${emotion}`);
      }
    }

    // Pattern 4: "I'm a/an X" (occupation, role)
    const rolePattern = /i(?:'m| am) (?:a|an)\s+(student|teacher|developer|engineer|artist|writer|doctor|nurse|programmer|designer)/i;
    const roleMatch = userMessage.match(rolePattern);
    if (roleMatch && roleMatch[1]) {
      const role = roleMatch[1];
      const hasRoleFact = existingFacts.some(f => 
        f.toLowerCase().includes('student') || f.toLowerCase().includes('teacher') || 
        f.toLowerCase().includes('developer') || f.toLowerCase().includes('engineer')
      );
      if (!hasRoleFact) {
        newFacts.push(`User is a ${role}`);
      }
    }

    // Pattern 5: "I have X" (pets, siblings, etc.)
    const possessionPatterns = [
      /i have (?:a|an|two|three|\d+)\s+(dog|cat|pet|brother|sister|sibling)/i,
      /i(?:'ve| have) got (?:a|an|two|three|\d+)\s+(dog|cat|pet|brother|sister|sibling)/i
    ];
    
    for (const pattern of possessionPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        newFacts.push(`User has a ${match[1]}`);
      }
    }

    // Pattern 6: "I'm from X" or "I live in X"
    const locationPatterns = [
      /i(?:'m| am) from\s+([a-z\s]+?)(?:\.|!|,|$)/i,
      /i live in\s+([a-z\s]+?)(?:\.|!|,|$)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        const location = match[1].trim();
        if (location.length > 2 && location.length < 30) {
          const hasLocationFact = existingFacts.some(f => 
            f.toLowerCase().includes('from') || f.toLowerCase().includes('lives in')
          );
          if (!hasLocationFact) {
            newFacts.push(`User is from ${location}`);
          }
        }
      }
    }

    return newFacts;
  }

  /**
   * Store new facts in database
   * @param {string} userId 
   * @param {string} characterId 
   * @param {Array} newFacts 
   * @returns {Object}
   */
  async storeFacts(userId, characterId, newFacts) {
    if (!newFacts || newFacts.length === 0) {
      return { success: true, factsAdded: 0 };
    }

    try {
      // Get existing facts
      const { data: existing } = await supabase
        .from('companion_context')
        .select('remembered_facts')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .single();

      const existingFacts = existing?.remembered_facts || [];
      
      // Merge new facts (avoid duplicates)
      const allFacts = [...existingFacts];
      let factsAdded = 0;
      
      for (const fact of newFacts) {
        // Check if similar fact already exists
        const isDuplicate = allFacts.some(existing => 
          this.areSimilarFacts(existing, fact)
        );
        
        if (!isDuplicate) {
          allFacts.push(fact);
          factsAdded++;
        }
      }

      // Limit to last 20 facts
      const limitedFacts = allFacts.slice(-20);

      // Update database
      const { error } = await supabase
        .from('companion_context')
        .upsert({
          user_id: userId,
          character_id: characterId,
          remembered_facts: limitedFacts,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id,character_id'
        });

      if (error) {
        console.error('Error storing facts:', error);
        return { success: false, error };
      }

      console.log(`🧠 Memory updated: ${factsAdded} new facts stored`);
      return { success: true, factsAdded, totalFacts: limitedFacts.length };
    } catch (err) {
      console.error('Error in storeFacts:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Check if two facts are similar (avoid duplicates)
   * @param {string} fact1 
   * @param {string} fact2 
   * @returns {boolean}
   */
  areSimilarFacts(fact1, fact2) {
    const normalized1 = fact1.toLowerCase().trim();
    const normalized2 = fact2.toLowerCase().trim();
    
    // Exact match
    if (normalized1 === normalized2) return true;
    
    // Check if one contains the other
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return true;
    }
    
    return false;
  }

  /**
   * Generate contextual greeting based on remembered facts
   * @param {string} characterName 
   * @param {Array} rememberedFacts 
   * @param {Object} lastInteraction 
   * @returns {string}
   */
  generateContextualGreeting(characterName, rememberedFacts = [], lastInteraction = null) {
    // No memories yet - simple greeting
    if (!rememberedFacts || rememberedFacts.length === 0) {
      return null; // Let character use default greeting
    }

    // Extract user's name if we know it
    const nameFact = rememberedFacts.find(f => f.toLowerCase().includes("name is"));
    const userName = nameFact ? nameFact.split("name is ")[1]?.trim() : null;

    // Get most recent interesting facts (last 3)
    const recentFacts = rememberedFacts.slice(-3);
    
    // Check if returning after a while
    const hoursSinceLastInteraction = lastInteraction 
      ? (new Date() - new Date(lastInteraction)) / (1000 * 60 * 60)
      : 0;

    // Generate greeting based on context
    if (hoursSinceLastInteraction > 24) {
      // Long time away
      const greetings = [
        `Hey${userName ? ' ' + userName : ''}! It's been a while! How have you been? 😊`,
        `Welcome back${userName ? ', ' + userName : ''}! I've missed our chats! What's new with you?`,
        `${userName ? userName + '!' : 'Hey there!'} Long time no see! I hope you've been doing well! 💭`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    } else if (hoursSinceLastInteraction > 1) {
      // Few hours away - reference last conversation
      const lastFact = recentFacts[recentFacts.length - 1];
      
      if (lastFact && lastFact.includes('feeling')) {
        const emotion = lastFact.split('feeling ')[1]?.replace('.', '');
        const greetings = [
          `Hey${userName ? ' ' + userName : ''}! I remember you said you were feeling ${emotion}. How are you doing now?`,
          `Welcome back! You mentioned feeling ${emotion} earlier. Feeling any better?`
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
      } else if (lastFact) {
        return `Hey${userName ? ' ' + userName : ''}! I remember you mentioned ${lastFact.toLowerCase().replace('user ', '')}. How's that going? 😊`;
      }
    }

    // Just came back - friendly greeting
    return `Hey${userName ? ' ' + userName : ''}! Good to see you again! 😊`;
  }

  /**
   * Get memory context for AI prompts
   * @param {Array} rememberedFacts 
   * @returns {string}
   */
  getMemoryContext(rememberedFacts = []) {
    if (!rememberedFacts || rememberedFacts.length === 0) {
      return '';
    }

    const recentFacts = rememberedFacts.slice(-10); // Last 10 facts
    
    return `
IMPORTANT MEMORIES ABOUT THIS USER:
${recentFacts.map((fact, i) => `${i + 1}. ${fact}`).join('\n')}

Use these memories naturally in conversation. Reference them when relevant to show you remember and care.
`;
  }

  /**
   * Process message and extract new memories
   * @param {string} userId 
   * @param {string} characterId 
   * @param {string} userMessage 
   * @param {string} aiResponse 
   * @returns {Object}
   */
  async processMessage(userId, characterId, userMessage, aiResponse = '') {
    try {
      // Get existing facts
      const { data } = await supabase
        .from('companion_context')
        .select('remembered_facts')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .single();

      const existingFacts = data?.remembered_facts || [];

      // Extract new facts
      const newFacts = this.extractFacts(userMessage, aiResponse, existingFacts);

      // Store if any new facts found
      if (newFacts.length > 0) {
        return await this.storeFacts(userId, characterId, newFacts);
      }

      return { success: true, factsAdded: 0 };
    } catch (err) {
      console.error('Error processing message for memories:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get all remembered facts for a user-character pair
   * @param {string} userId 
   * @param {string} characterId 
   * @returns {Array}
   */
  async getFacts(userId, characterId) {
    try {
      const { data } = await supabase
        .from('companion_context')
        .select('remembered_facts')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .single();

      return data?.remembered_facts || [];
    } catch (err) {
      console.error('Error getting facts:', err);
      return [];
    }
  }
}

export default new MemoryService();

