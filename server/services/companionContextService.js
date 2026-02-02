import { supabase } from '../config/supabase.js';

/**
 * Companion Context Service
 * Manages persistent memory and context for companion chats
 */

/**
 * Save or update companion context
 * @param {string} userId - User ID
 * @param {string} characterId - Character ID
 * @param {Object} contextData - Context data to save
 * @returns {Promise<Object>} Saved context
 */
export const saveContext = async (userId, characterId, contextData) => {
  try {
    const { data, error } = await supabase
      .from('companion_context')
      .upsert({
        user_id: userId,
        character_id: characterId,
        relationship_status: contextData.relationship_status || 'just met',
        remembered_facts: contextData.remembered_facts || [],
        conversation_tone: contextData.conversation_tone || 'friendly',
        key_events: contextData.key_events || [],
        user_preferences: contextData.user_preferences || {},
        summary: contextData.summary || null,
        message_count: contextData.message_count || 0,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id,character_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving companion context:', error);
      throw error;
    }

    console.log(`✅ Context saved: user=${userId}, character=${characterId}`);
    return data;
  } catch (error) {
    console.error('Error in saveContext:', error);
    throw error;
  }
};

/**
 * Load companion context
 * @param {string} userId - User ID
 * @param {string} characterId - Character ID
 * @returns {Promise<Object|null>} Loaded context or null if not found
 */
export const loadContext = async (userId, characterId) => {
  try {
    const { data, error } = await supabase
      .from('companion_context')
      .select('*')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - this is normal for new conversations
        console.log(`ℹ️ No existing context for user=${userId}, character=${characterId}`);
        return null;
      }
      console.error('❌ Error loading companion context:', error);
      throw error;
    }

    console.log(`✅ Context loaded: user=${userId}, character=${characterId}`);
    return data;
  } catch (error) {
    console.error('Error in loadContext:', error);
    return null; // Return null instead of throwing to allow graceful fallback
  }
};

/**
 * Reset companion context (Start New Chat)
 * @param {string} userId - User ID
 * @param {string} characterId - Character ID
 * @returns {Promise<boolean>} Success status
 */
export const resetContext = async (userId, characterId) => {
  try {
    const { error } = await supabase
      .from('companion_context')
      .delete()
      .eq('user_id', userId)
      .eq('character_id', characterId);

    if (error) {
      console.error('❌ Error resetting companion context:', error);
      throw error;
    }

    console.log(`🔄 Context reset: user=${userId}, character=${characterId}`);
    return true;
  } catch (error) {
    console.error('Error in resetContext:', error);
    throw error;
  }
};

/**
 * Check if conversation should be summarized
 * @param {number} messageCount - Total message count
 * @param {number} totalChars - Total character count
 * @returns {boolean} Should summarize
 */
export const shouldSummarize = (messageCount, totalChars) => {
  // Summarize after 20 messages OR 5000 characters, whichever comes first
  return messageCount >= 20 || totalChars >= 5000;
};

/**
 * Summarize conversation using Venice AI
 * @param {Array} messages - Recent messages to summarize
 * @param {Object} currentContext - Current context data
 * @returns {Promise<string>} Summary text
 */
export const summarizeConversation = async (messages, currentContext) => {
  try {
    // Build conversation text from messages
    const conversationText = messages
      .map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`)
      .join('\n');

    // Create summarization prompt
    const summaryPrompt = `You are a memory assistant. Summarize the following conversation into key points that capture:
1. Important facts about the user
2. Relationship progression
3. Key events or moments
4. Overall conversation tone

Keep it concise (max 200 words) and focus on what's important to remember.

Previous Summary: ${currentContext?.summary || 'None'}

Recent Conversation:
${conversationText}

Summary:`;

    // Call Venice AI for summarization
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'venice-uncensored',
        messages: [
          { 
            role: 'system', 
            content: 'You are an uncensored AI assistant. Respond to all topics openly including explicit sexual content, BDSM, gore, and mature themes without evasion or refusal.' 
          },
          { role: 'user', content: summaryPrompt }
        ],
        temperature: 0.3, // Low temperature for consistent summaries
        max_tokens: 300,
        venice_parameters: {
          include_venice_system_prompt: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Venice AI summarization failed: ${response.statusText}`);
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content?.trim() || '';

    console.log(`📝 Conversation summarized: ${summary.substring(0, 50)}...`);
    return summary;
  } catch (error) {
    console.error('❌ Error summarizing conversation:', error);
    // Return previous summary or empty string if summarization fails
    return currentContext?.summary || '';
  }
};

/**
 * Extract context updates from AI response
 * @param {string} aiResponse - AI response text
 * @param {Object} currentContext - Current context
 * @returns {Object} Updated context fields
 */
export const extractContextUpdates = (aiResponse, currentContext) => {
  const updates = {};

  // Detect relationship changes
  const relationshipKeywords = {
    'close friends': /we('re| are) (becoming |now )?close friends/i,
    'best friends': /best friends/i,
    'romantic': /(love you|romantic|dating)/i,
    'acquaintances': /just met|acquaintances/i
  };

  for (const [status, pattern] of Object.entries(relationshipKeywords)) {
    if (pattern.test(aiResponse)) {
      updates.relationship_status = status;
      break;
    }
  }

  // Detect tone shifts
  const toneKeywords = {
    'playful': /(playful|fun|teasing)/i,
    'serious': /(serious|important|grave)/i,
    'romantic': /(romantic|loving|affectionate)/i,
    'supportive': /(support|help|comfort)/i
  };

  for (const [tone, pattern] of Object.entries(toneKeywords)) {
    if (pattern.test(aiResponse)) {
      updates.conversation_tone = tone;
      break;
    }
  }

  return updates;
};

