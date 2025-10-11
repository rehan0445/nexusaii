/**
 * Companion Memory Management
 * Handles sessionStorage for short-term memory and merging with persistent context
 */

import { Character } from './characters';

export interface Message {
  id?: string;
  text: string;
  sender: "user" | "ai";
  timestamp?: number;
  thoughts?: string;
  speech?: string;
  user_thoughts?: string;
  message_type?: "user" | "ai_thought" | "ai_speech";
}

export interface PersistentMemory {
  relationship_status: string;
  remembered_facts: string[];
  conversation_tone: string;
  key_events: Array<{ timestamp: number; description: string }>;
  user_preferences: Record<string, any>;
  summary: string;
  message_count: number;
}

export interface CompanionContext {
  characterId: string;
  baseContext: Character;
  persistentMemory: PersistentMemory;
  conversationHistory: Message[];
  lastUpdated: number;
}

const STORAGE_PREFIX = 'companion_context_';
const STORAGE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check if sessionStorage is available
 */
const isSessionStorageAvailable = (): boolean => {
  try {
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('sessionStorage is not available:', e);
    return false;
  }
};

/**
 * Save context to sessionStorage
 */
export const saveToSession = (characterId: string, context: CompanionContext): boolean => {
  if (!isSessionStorageAvailable()) {
    console.warn('Cannot save to sessionStorage: not available');
    return false;
  }

  try {
    const storageKey = `${STORAGE_PREFIX}${characterId}`;
    const dataToStore = {
      ...context,
      lastUpdated: Date.now()
    };

    sessionStorage.setItem(storageKey, JSON.stringify(dataToStore));
    console.log(`💾 Context saved to session: ${characterId}`);
    return true;
  } catch (error) {
    console.error('Error saving to sessionStorage:', error);
    return false;
  }
};

/**
 * Load context from sessionStorage
 */
export const loadFromSession = (characterId: string): CompanionContext | null => {
  if (!isSessionStorageAvailable()) {
    console.warn('Cannot load from sessionStorage: not available');
    return null;
  }

  try {
    const storageKey = `${STORAGE_PREFIX}${characterId}`;
    const stored = sessionStorage.getItem(storageKey);

    if (!stored) {
      console.log(`ℹ️ No session context found for: ${characterId}`);
      return null;
    }

    const context = JSON.parse(stored) as CompanionContext;

    // Check if expired
    const age = Date.now() - (context.lastUpdated || 0);
    if (age > STORAGE_EXPIRY) {
      console.log(`⏰ Session context expired for: ${characterId}`);
      clearSession(characterId);
      return null;
    }

    console.log(`✅ Context loaded from session: ${characterId}`);
    return context;
  } catch (error) {
    console.error('Error loading from sessionStorage:', error);
    return null;
  }
};

/**
 * Clear context from sessionStorage
 */
export const clearSession = (characterId: string): void => {
  if (!isSessionStorageAvailable()) {
    return;
  }

  try {
    const storageKey = `${STORAGE_PREFIX}${characterId}`;
    sessionStorage.removeItem(storageKey);
    console.log(`🗑️ Session context cleared: ${characterId}`);
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
  }
};

/**
 * Clear all companion contexts from sessionStorage
 */
export const clearAllSessions = (): void => {
  if (!isSessionStorageAvailable()) {
    return;
  }

  try {
    const keys = Object.keys(sessionStorage);
    const companionKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));

    companionKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });

    console.log(`🗑️ All companion sessions cleared (${companionKeys.length} items)`);
  } catch (error) {
    console.error('Error clearing all sessions:', error);
  }
};

/**
 * Merge base character data with persistent memory
 */
export const mergeBaseWithPersistent = (
  baseCharacter: Character,
  persistentMemory: PersistentMemory | null
): CompanionContext => {
  const defaultMemory: PersistentMemory = {
    relationship_status: 'just met',
    remembered_facts: [],
    conversation_tone: 'friendly',
    key_events: [],
    user_preferences: {},
    summary: '',
    message_count: 0
  };

  return {
    characterId: baseCharacter.id?.toString() || '',
    baseContext: baseCharacter,
    persistentMemory: persistentMemory || defaultMemory,
    conversationHistory: [],
    lastUpdated: Date.now()
  };
};

/**
 * Calculate total character count in conversation
 */
export const getTotalCharCount = (messages: Message[]): number => {
  return messages.reduce((total, msg) => total + (msg.text?.length || 0), 0);
};

/**
 * Check if conversation should be summarized
 */
export const shouldSummarize = (messageCount: number, totalChars: number): boolean => {
  return messageCount >= 20 || totalChars >= 5000;
};

/**
 * Create initial context for new conversation
 */
export const createInitialContext = (baseCharacter: Character): CompanionContext => {
  return mergeBaseWithPersistent(baseCharacter, null);
};

