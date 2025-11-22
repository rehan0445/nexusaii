// Affection Service: Track and manage character-user relationship levels
import { supabase } from '../config/supabase.js';

// Affection tier thresholds (points needed to reach each tier)
const AFFECTION_TIERS = {
  1: { name: 'Acquaintance', minPoints: 0, maxPoints: 99, color: 'gray' },
  2: { name: 'Friend', minPoints: 100, maxPoints: 299, color: 'blue' },
  3: { name: 'Close Friend', minPoints: 300, maxPoints: 599, color: 'purple' },
  4: { name: 'Best Friend', minPoints: 600, maxPoints: 899, color: 'pink' },
  5: { name: 'Soulmate', minPoints: 900, maxPoints: 1000, color: 'gold' }
};

// Affection gain sources and amounts
const AFFECTION_GAINS = {
  MESSAGE: 1,           // Each message sent
  QUEST_COMPLETE: 5,    // Completing a quest (base, varies by difficulty)
  QUEST_ATTEMPT: 1,     // Attempting a quest even if wrong
  DAILY_CHECKIN: 3,     // First message of the day
  LONG_CONVERSATION: 2, // After 10+ messages in a session
  VOICE_MESSAGE: 2,     // Sending voice message
  RETURNING_USER: 5     // Coming back after 24+ hours
};

// Relationship status mapping based on affection tier
const RELATIONSHIP_STATUS_MAP = {
  1: 'just met',
  2: 'getting to know each other',
  3: 'friends',
  4: 'close friends',
  5: 'best friends'
};

class AffectionService {
  /**
   * Get current affection status for user-character pair
   * @param {string} userId 
   * @param {string} characterId 
   * @returns {Object} Affection data
   */
  async getAffectionStatus(userId, characterId) {
    try {
      const { data, error } = await supabase
        .from('companion_context')
        .select('affection_level, affection_visible_level, total_messages, relationship_status')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error fetching affection status:', error);
        return null;
      }

      if (!data) {
        // No relationship yet, return defaults
        return {
          affection_level: 0,
          affection_visible_level: 1,
          total_messages: 0,
          relationship_status: 'just met',
          tier: AFFECTION_TIERS[1]
        };
      }

      // Calculate tier info
      const visibleLevel = data.affection_visible_level || 1;
      const tier = AFFECTION_TIERS[visibleLevel];

      return {
        ...data,
        tier,
        pointsToNextLevel: this.getPointsToNextLevel(data.affection_level, visibleLevel),
        progressPercent: this.getProgressPercent(data.affection_level, visibleLevel)
      };
    } catch (err) {
      console.error('Error in getAffectionStatus:', err);
      return null;
    }
  }

  /**
   * Update affection level and check for tier upgrades
   * @param {string} userId 
   * @param {string} characterId 
   * @param {number} pointsGained 
   * @param {string} source - Source of affection gain
   * @returns {Object} Update result with level-up info
   */
  async updateAffection(userId, characterId, pointsGained, source = 'MESSAGE') {
    try {
      // Get current affection
      const current = await this.getAffectionStatus(userId, characterId);
      
      // Calculate new affection level (cap at 1000)
      const newAffectionLevel = Math.min((current?.affection_level || 0) + pointsGained, 1000);
      
      // Determine new visible tier
      const newVisibleLevel = this.calculateVisibleLevel(newAffectionLevel);
      const oldVisibleLevel = current?.affection_visible_level || 1;
      
      // Check for level-up
      const leveledUp = newVisibleLevel > oldVisibleLevel;
      
      // Update relationship status if leveled up
      const newRelationshipStatus = leveledUp 
        ? RELATIONSHIP_STATUS_MAP[newVisibleLevel]
        : current?.relationship_status || 'just met';

      // Upsert affection data
      const { data, error } = await supabase
        .from('companion_context')
        .upsert({
          user_id: userId,
          character_id: characterId,
          affection_level: newAffectionLevel,
          affection_visible_level: newVisibleLevel,
          relationship_status: newRelationshipStatus,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id,character_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating affection:', error);
        return { success: false, error };
      }

      console.log(`💖 Affection updated: ${current?.affection_level || 0} → ${newAffectionLevel} (${source})`);

      return {
        success: true,
        affection_level: newAffectionLevel,
        affection_visible_level: newVisibleLevel,
        leveledUp,
        oldLevel: oldVisibleLevel,
        newLevel: newVisibleLevel,
        tier: AFFECTION_TIERS[newVisibleLevel],
        pointsGained,
        source
      };
    } catch (err) {
      console.error('Error in updateAffection:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Calculate visible tier level from affection points
   * @param {number} points 
   * @returns {number} Tier level (1-5)
   */
  calculateVisibleLevel(points) {
    if (points >= 900) return 5;
    if (points >= 600) return 4;
    if (points >= 300) return 3;
    if (points >= 100) return 2;
    return 1;
  }

  /**
   * Get points needed to reach next level
   * @param {number} currentPoints 
   * @param {number} currentLevel 
   * @returns {number}
   */
  getPointsToNextLevel(currentPoints, currentLevel) {
    if (currentLevel >= 5) return 0; // Max level
    
    const nextTier = AFFECTION_TIERS[currentLevel + 1];
    return nextTier.minPoints - currentPoints;
  }

  /**
   * Get progress percentage within current tier
   * @param {number} currentPoints 
   * @param {number} currentLevel 
   * @returns {number} 0-100
   */
  getProgressPercent(currentPoints, currentLevel) {
    const tier = AFFECTION_TIERS[currentLevel];
    
    if (currentLevel >= 5) {
      // Max level, show progress to 1000
      return Math.min((currentPoints - tier.minPoints) / (1000 - tier.minPoints) * 100, 100);
    }
    
    const tierRange = tier.maxPoints - tier.minPoints + 1;
    const pointsInTier = currentPoints - tier.minPoints;
    
    return Math.min((pointsInTier / tierRange) * 100, 100);
  }

  /**
   * Get affection-based behavior context for AI prompts
   * @param {number} affectionLevel 
   * @param {number} visibleLevel 
   * @returns {string}
   */
  getAffectionContext(affectionLevel, visibleLevel) {
    const tier = AFFECTION_TIERS[visibleLevel];
    
    const contexts = {
      1: `You've just met this user. Be polite but slightly reserved. Show curiosity about getting to know them.`,
      2: `You're friends with this user. Be warm and friendly. Show you enjoy their company and remember past conversations.`,
      3: `You're close friends with this user. Be more personal and comfortable. Share deeper thoughts and show you care about them.`,
      4: `This user is your best friend. Be very comfortable, playful, and supportive. Show deep understanding and affection.`,
      5: `This user is your soulmate. Be completely open, deeply affectionate, and show that they're incredibly special to you. Use intimate language and express how much they mean to you.`
    };

    return contexts[visibleLevel] || contexts[1];
  }

  /**
   * Check if user should get daily check-in bonus
   * @param {string} userId 
   * @param {string} characterId 
   * @returns {boolean}
   */
  async shouldAwardDailyBonus(userId, characterId) {
    try {
      const { data } = await supabase
        .from('companion_context')
        .select('last_interaction_at')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .single();

      if (!data || !data.last_interaction_at) return true;

      const lastInteraction = new Date(data.last_interaction_at);
      const now = new Date();
      const hoursSince = (now - lastInteraction) / (1000 * 60 * 60);

      // Award bonus if more than 20 hours since last interaction
      return hoursSince >= 20;
    } catch (err) {
      console.error('Error checking daily bonus:', err);
      return false;
    }
  }

  /**
   * Award daily check-in bonus
   * @param {string} userId 
   * @param {string} characterId 
   * @returns {Object}
   */
  async awardDailyBonus(userId, characterId) {
    const shouldAward = await this.shouldAwardDailyBonus(userId, characterId);
    
    if (shouldAward) {
      return await this.updateAffection(userId, characterId, AFFECTION_GAINS.DAILY_CHECKIN, 'DAILY_CHECKIN');
    }
    
    return { success: false, message: 'Daily bonus already awarded' };
  }

  /**
   * Update last interaction timestamp
   * @param {string} userId 
   * @param {string} characterId 
   */
  async updateLastInteraction(userId, characterId) {
    try {
      const { error } = await supabase
        .from('companion_context')
        .upsert({
          user_id: userId,
          character_id: characterId,
          last_interaction_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id,character_id'
        });

      if (error) {
        console.error('Error updating last interaction:', error);
      }
    } catch (err) {
      console.error('Error in updateLastInteraction:', err);
    }
  }

  /**
   * Increment total message count
   * @param {string} userId 
   * @param {string} characterId 
   * @returns {number} New message count
   */
  async incrementMessageCount(userId, characterId) {
    try {
      // First get current count
      const { data: current } = await supabase
        .from('companion_context')
        .select('total_messages')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .single();

      const newCount = (current?.total_messages || 0) + 1;

      // Update count
      const { error } = await supabase
        .from('companion_context')
        .upsert({
          user_id: userId,
          character_id: characterId,
          total_messages: newCount,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id,character_id'
        });

      if (error) {
        console.error('Error incrementing message count:', error);
      }

      return newCount;
    } catch (err) {
      console.error('Error in incrementMessageCount:', err);
      return 0;
    }
  }
}

export default new AffectionService();

