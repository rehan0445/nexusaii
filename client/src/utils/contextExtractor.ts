/**
 * Context Extractor
 * Automatically extracts memory updates from AI responses and user messages
 */

import { PersistentMemory } from './companionMemory';

/**
 * Extract facts from user message
 * Looks for personal information user shares
 */
export const extractUserFacts = (userMessage: string): string[] => {
  const facts: string[] = [];
  const lowerMsg = userMessage.toLowerCase();

  // Personal details patterns
  const patterns = [
    // Location
    { regex: /(?:i live in|i'm from|i'm in|my city is)\s+([a-z\s]+?)(?:\.|,|$)/i, type: 'location' },
    // Age
    { regex: /(?:i am|i'm|my age is)\s+(\d+)\s*(?:years old)?/i, type: 'age' },
    // Name
    { regex: /(?:my name is|i'm|call me)\s+([a-z]+)/i, type: 'name' },
    // Birthday
    { regex: /(?:my birthday|i was born|born on)\s+(?:is\s+)?([a-z]+\s+\d+|\d+\s+[a-z]+)/i, type: 'birthday' },
    // Occupation
    { regex: /(?:i work as|i'm a|my job is|i am a)\s+([a-z\s]+?)(?:\.|,|$)/i, type: 'occupation' },
    // Hobbies
    { regex: /(?:i like|i love|i enjoy|my hobby is)\s+([a-z\s]+?)(?:\.|,|$)/i, type: 'hobby' },
    // Family
    { regex: /(?:i have a|my)\s+(brother|sister|mother|father|parent|sibling|pet)/i, type: 'family' },
  ];

  patterns.forEach(({ regex, type }) => {
    const match = userMessage.match(regex);
    if (match && match[1]) {
      const value = match[1].trim();
      facts.push(`${type}: ${value}`);
    }
  });

  return facts;
};

/**
 * Detect relationship status from AI response
 */
export const detectRelationshipChange = (aiResponse: string): string | null => {
  const lowerResponse = aiResponse.toLowerCase();

  const relationships: Array<{ keywords: string[]; status: string }> = [
    { keywords: ['best friend', 'best pal', 'bestie'], status: 'best friends' },
    { keywords: ['close friend', 'good friend', 'really close'], status: 'close friends' },
    { keywords: ['friend', 'becoming friends'], status: 'friends' },
    { keywords: ['love you', 'romantic', 'dating', 'boyfriend', 'girlfriend'], status: 'romantic' },
    { keywords: ['stranger', 'just met', 'new here'], status: 'just met' },
  ];

  for (const { keywords, status } of relationships) {
    if (keywords.some(keyword => lowerResponse.includes(keyword))) {
      return status;
    }
  }

  return null;
};

/**
 * Detect conversation tone from AI response
 */
export const detectConversationTone = (aiResponse: string): string | null => {
  const lowerResponse = aiResponse.toLowerCase();

  const tones: Array<{ keywords: string[]; tone: string }> = [
    { keywords: ['playful', 'fun', 'teasing', 'haha', 'lol'], tone: 'playful' },
    { keywords: ['serious', 'important', 'grave', 'concerned'], tone: 'serious' },
    { keywords: ['romantic', 'loving', 'affectionate', 'dear', 'sweetheart'], tone: 'romantic' },
    { keywords: ['support', 'help', 'comfort', 'here for you'], tone: 'supportive' },
    { keywords: ['excited', 'amazing', 'wonderful', 'awesome'], tone: 'enthusiastic' },
  ];

  for (const { keywords, tone } of tones) {
    if (keywords.some(keyword => lowerResponse.includes(keyword))) {
      return tone;
    }
  }

  return null;
};

/**
 * Extract key events from conversation
 */
export const extractKeyEvent = (userMessage: string, aiResponse: string): { timestamp: number; description: string } | null => {
  const combinedText = `${userMessage} ${aiResponse}`.toLowerCase();

  // Event patterns
  const eventPatterns = [
    /(?:had a|went to|visited|celebrated|attended)\s+([a-z\s]+?)(?:\.|,|$)/i,
    /(?:feeling|felt)\s+(happy|sad|excited|worried|anxious|depressed)/i,
    /(?:achieved|accomplished|completed|finished)\s+([a-z\s]+?)(?:\.|,|$)/i,
    /(?:started|began)\s+([a-z\s]+?)(?:\.|,|$)/i,
  ];

  for (const pattern of eventPatterns) {
    const match = combinedText.match(pattern);
    if (match && match[1]) {
      return {
        timestamp: Date.now(),
        description: match[1].trim()
      };
    }
  }

  return null;
};

/**
 * Update persistent memory based on conversation
 */
export const updateContextFromConversation = (
  currentMemory: PersistentMemory,
  userMessage: string,
  aiResponse: string
): Partial<PersistentMemory> => {
  const updates: Partial<PersistentMemory> = {};

  // Extract user facts
  const newFacts = extractUserFacts(userMessage);
  if (newFacts.length > 0) {
    const existingFacts = currentMemory.remembered_facts || [];
    const uniqueNewFacts = newFacts.filter(fact => 
      !existingFacts.some(existing => existing.includes(fact.split(':')[0]))
    );
    
    if (uniqueNewFacts.length > 0) {
      updates.remembered_facts = [...existingFacts, ...uniqueNewFacts];
    }
  }

  // Detect relationship change
  const newRelationship = detectRelationshipChange(aiResponse);
  if (newRelationship && newRelationship !== currentMemory.relationship_status) {
    updates.relationship_status = newRelationship;
  }

  // Detect tone change
  const newTone = detectConversationTone(aiResponse);
  if (newTone && newTone !== currentMemory.conversation_tone) {
    updates.conversation_tone = newTone;
  }

  // Extract key event
  const keyEvent = extractKeyEvent(userMessage, aiResponse);
  if (keyEvent) {
    const existingEvents = currentMemory.key_events || [];
    updates.key_events = [...existingEvents, keyEvent].slice(-10); // Keep last 10 events
  }

  return updates;
};

/**
 * Extract user preferences from custom instructions
 */
export const extractUserPreferences = (customInstructions: any): Record<string, any> => {
  const preferences: Record<string, any> = {};

  if (customInstructions?.nickname) {
    preferences.preferred_name = customInstructions.nickname;
  }

  if (customInstructions?.userDescription) {
    preferences.user_description = customInstructions.userDescription;
  }

  if (customInstructions?.avoidTopics && customInstructions.avoidTopics.length > 0) {
    preferences.topics_to_avoid = customInstructions.avoidTopics;
  }

  return preferences;
};

