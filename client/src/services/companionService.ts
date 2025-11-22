// companionService.ts - Optimized Venice AI Integration
import { animeCharacters } from "../utils/animeCharacters";
import { v4 as uuidv4 } from "uuid";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
  userName?: string; // for group roleplay
  timestamp?: number;
};

interface ChatSession {
  id: string;
  characterSlug: string;
  conversation: Message[];
  model: "llama-3.2-3b" | "venice-uncensored" | "qwen3-4b";
  emotion: "neutral" | "happy" | "sad" | "angry" | "flirty";
  participants?: string[]; // for multi-user/group
  lastActivity: number;
}

interface CachedResponse {
  response: string;
  timestamp: number;
  emotion: ChatSession["emotion"];
}

interface QueuedRequest {
  sessionId: string;
  message: string;
  userName?: string;
  resolve: (value: string) => void;
  reject: (reason: Error) => void;
  priority: number;
}

// ============================================
// 🎯 CONFIGURATION
// ============================================
const activeChats: Record<string, ChatSession> = {};
const responseCache = new Map<string, CachedResponse>();
const requestQueue: QueuedRequest[] = [];

const CONFIG = {
  BACKEND_API_URL: "/api/v1/chat/companion/venice", // Use backend proxy instead of direct Venice call
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_MEMORY: 20, // Maximum conversation turns to keep
  MAX_CONCURRENT: 3, // Max concurrent requests
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
  TIMEOUT: 30000, // 30 seconds
  STREAM_ENABLED: false, // Enable streaming responses
} as const;

let activeRequests = 0;

// ============================================
// 🔧 UTILITY FUNCTIONS
// ============================================

/**
 * Advanced emotion analysis with intensity scoring
 */
function analyzeEmotion(text: string): ChatSession["emotion"] {
  const t = text.toLowerCase();
  const emotionScores = {
    flirty: (t.match(/love|cute|sweet|kiss|adorable|heart|blush|wink|tease/gi) || []).length * 2,
    angry: (t.match(/hate|angry|annoyed|mad|rage|furious|pissed/gi) || []).length * 2,
    sad: (t.match(/sad|cry|lonely|miss|depress|hurt|pain/gi) || []).length * 2,
    happy: (t.match(/haha|lol|funny|awesome|great|yay|love|happy/gi) || []).length,
  };

  const maxEmotion = Object.entries(emotionScores).reduce((max, [emotion, score]) =>
    score > max.score ? { emotion, score } : max,
    { emotion: "neutral", score: 0 }
  );

  return (maxEmotion.score > 0 ? maxEmotion.emotion : "neutral") as ChatSession["emotion"];
}

/**
 * Smart memory compression with context preservation
 */
function compressMemory(conversation: Message[], max?: number): Message[] {
  const maxMessages = max || CONFIG.MAX_MEMORY;
  if (conversation.length <= maxMessages) return conversation;

  const systemMsg = conversation.find((m) => m.role === "system");
  const messages = conversation.filter((m) => m.role !== "system");

  // Prioritize recent + emotionally significant messages
  const recentMessages = messages.slice(-maxMessages);
  
  return systemMsg ? [systemMsg, ...recentMessages] : recentMessages;
}

/**
 * Generate cache key for response caching
 */
function generateCacheKey(sessionId: string, message: string, emotion: string): string {
  const normalizedMsg = message.toLowerCase().trim().slice(0, 100);
  return `${sessionId}-${normalizedMsg}-${emotion}`;
}

/**
 * Smart model selection based on context
 */
function selectModel(message: string, conversationLength: number): ChatSession["model"] {
  const isExplicit = /flirt|sexy|kiss|nsfw|nude|bed|horny|moan|intimate|seduce/i.test(message);
  const isComplex = message.length > 200 || conversationLength > 30;

  if (isExplicit) return "venice-uncensored";
  if (isComplex) return "llama-3.2-3b";
  return "qwen3-4b"; // Fastest for general use
}

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  attempts = CONFIG.RETRY_ATTEMPTS
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      const delay = CONFIG.RETRY_DELAY * Math.pow(2, i);
      console.log(`⏳ Retry attempt ${i + 1}/${attempts} after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retry attempts exceeded");
}

/**
 * Request queue processor with concurrency control
 */
async function processQueue() {
  if (requestQueue.length === 0 || activeRequests >= CONFIG.MAX_CONCURRENT) return;

  // Sort by priority (higher first)
  requestQueue.sort((a, b) => b.priority - a.priority);
  const request = requestQueue.shift();
  if (!request) return;

  activeRequests++;
  console.log(`📊 Queue: ${requestQueue.length} pending, ${activeRequests}/${CONFIG.MAX_CONCURRENT} active`);

  try {
    const response = await executeRequest(request.sessionId, request.message, request.userName);
    request.resolve(response);
  } catch (error) {
    request.reject(error as Error);
  } finally {
    activeRequests--;
    processQueue(); // Process next in queue
  }
}

/**
 * Build system message for character context
 */
function buildSystemMessage(character: any, emotion: ChatSession["emotion"]): string {
  const emotionalCues = {
    happy: "Respond with joy, enthusiasm, and playful energy.",
    sad: "Be gentle, empathetic, and comforting in your tone.",
    angry: "Show intensity and directness without being hurtful.",
    flirty: "Be playful, charming, and subtly seductive.",
    neutral: "Respond naturally in your authentic voice.",
  };

  const quirks = Array.isArray(character.personality.quirks) ? character.personality.quirks.join(", ") : "";
  return `${character.personality.background}

You are ${character.name}, ${character.role}.
Personality: ${character.personality.traits.join(", ")}
Speaking Style: ${character.personality.speakingStyle}
Quirks: ${quirks}

${emotionalCues[emotion]}

IMPORTANT:
- Use natural dialogue, not narration or asterisks
- Keep responses concise but expressive
- Stay true to your character
- Show emotion through words, not descriptions`;
}

/**
 * Update session with new message and metadata
 */
function updateSessionWithMessage(
  session: ChatSession,
  userMessage: string,
  userName: string
): void {
  const emotionDetected = analyzeEmotion(userMessage);
  session.model = selectModel(userMessage, session.conversation.length);
  session.emotion = emotionDetected;
  session.lastActivity = Date.now();

  session.conversation.push({
    role: "user",
    content: userMessage,
    userName,
    timestamp: Date.now(),
  });

  session.conversation = compressMemory(session.conversation);
}

/**
 * Execute Venice AI request with timeout
 */
async function executeRequest(sessionId: string, userMessage: string, userName = "User"): Promise<string> {
  const session = activeChats[sessionId];
  if (!session) throw new Error(`Chat session not found: ${sessionId}`);

  // Check cache first
  const cacheKey = generateCacheKey(sessionId, userMessage, session.emotion);
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_TTL) {
    console.log("📦 Returning cached response");
    return cached.response;
  }

  // Update session with message
  updateSessionWithMessage(session, userMessage, userName);

  // Build context
  const character = animeCharacters[session.characterSlug];
  const systemMessage = buildSystemMessage(character, session.emotion);

  const fullConversation: Message[] = [
    { role: "system", content: systemMessage },
    ...session.conversation.filter((m) => m.role !== "system"),
  ];

  const payload = {
    model: session.model,
    messages: fullConversation,
    max_tokens: 400,
    temperature: 0.8,
    venice_parameters: {
      include_venice_system_prompt: false,
    },
  };

  // Execute with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

  try {
    const response = await retryWithBackoff(() =>
      fetch(CONFIG.BACKEND_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include credentials for authentication
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Backend API error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    
    // Handle new backend response format
    if (!responseData.success) {
      throw new Error(responseData.message || "Request failed");
    }
    
    const data = responseData.data;
    const assistantReply = data?.choices?.[0]?.message?.content?.trim() || "…";

    // Save to session
    session.conversation.push({
      role: "assistant",
      content: assistantReply,
      timestamp: Date.now(),
    });

    // Cache response
    responseCache.set(cacheKey, {
      response: assistantReply,
      timestamp: Date.now(),
      emotion: session.emotion,
    });

    // Clean old cache entries
    cleanCache();

    return assistantReply;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timeout - please try again");
    }
    console.error("Venice AI request error:", error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Clean expired cache entries
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CONFIG.CACHE_TTL) {
      responseCache.delete(key);
    }
  }
}

// ============================================
// 🧠 PUBLIC API
// ============================================

/**
 * Create a new chat session
 */
export function createChatSession(characterSlug: string, participants: string[] = []): ChatSession {
  const character = animeCharacters[characterSlug];
  if (!character) throw new Error(`Character not found: ${characterSlug}`);

  const newSession: ChatSession = {
    id: uuidv4(),
    characterSlug,
    model: "qwen3-4b", // Start with fastest model
    emotion: "neutral",
    participants,
    lastActivity: Date.now(),
    conversation: [],
  };

  activeChats[newSession.id] = newSession;
  console.log(`✨ Created chat session: ${newSession.id} for ${character.name}`);
  return newSession;
}

/**
 * Send message with queue management
 */
export async function sendMessage(
  sessionId: string,
  userMessage: string,
  userName = "User",
  priority = 5
): Promise<string> {
  return new Promise((resolve, reject) => {
    requestQueue.push({
      sessionId,
      message: userMessage,
      userName,
      resolve,
      reject,
      priority,
    });
    processQueue();
  });
}

/**
 * Process streaming data chunks
 */
async function processStreamingChunks(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (chunk: string) => void
): Promise<string> {
  const decoder = new TextDecoder();
  let fullResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter((line) => line.trim().startsWith("data: "));

    for (const line of lines) {
      const data = line.replace("data: ", "");
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      } catch (e) {
        // Skip invalid JSON - streaming chunks may be incomplete
        console.debug("Skipping invalid streaming chunk:", e);
      }
    }
  }

  return fullResponse;
}

/**
 * Streaming message response (experimental)
 */
export async function sendMessageStreaming(
  sessionId: string,
  userMessage: string,
  onChunk: (chunk: string) => void,
  userName = "User"
): Promise<string> {
  const session = activeChats[sessionId];
  if (!session) throw new Error(`Chat session not found: ${sessionId}`);

  // Update session with message
  updateSessionWithMessage(session, userMessage, userName);

  const payload = {
    model: session.model,
    messages: compressMemory(session.conversation),
    stream: true,
    max_tokens: 150,
    venice_parameters: {
      include_venice_system_prompt: false,
    },
  };

  const response = await fetch(CONFIG.BACKEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Backend API error: ${response.status}`);
  }
  
  // For streaming, we need to handle the response differently
  // Backend streaming support would need to be implemented separately
  const responseData = await response.json();
  if (!responseData.success) {
    throw new Error(responseData.message || "Request failed");
  }
  
  const data = responseData.data;
  const fullResponse = data?.choices?.[0]?.message?.content?.trim() || "";
  
  // Simulate streaming by chunking the response
  if (fullResponse && onChunk) {
    const words = fullResponse.split(' ');
    for (const word of words) {
      onChunk(word + ' ');
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for streaming effect
    }
  }

  session.conversation.push({
    role: "assistant",
    content: fullResponse,
    timestamp: Date.now(),
  });

  return fullResponse;
}

/**
 * Group chat with batched processing
 */
export async function groupChat(
  sessionId: string,
  userMessages: { name: string; text: string }[]
): Promise<string> {
  const session = activeChats[sessionId];
  if (!session) throw new Error(`Chat session not found: ${sessionId}`);

  // Batch all messages together for single API call
  const combinedInput = userMessages.map((m) => `${m.name}: ${m.text}`).join("\n");

  // Add all messages to conversation
  userMessages.forEach((msg) => {
    session.conversation.push({
      role: "user",
      content: msg.text,
      userName: msg.name,
      timestamp: Date.now(),
    });
  });

  // Use high priority for group messages
  return sendMessage(sessionId, combinedInput, "Group", 8);
}

/**
 * Save conversation to localStorage
 */
export function saveConversation(sessionId: string) {
  const session = activeChats[sessionId];
  if (!session) return;

  const saveData = {
    ...session,
    conversation: compressMemory(session.conversation, 50), // Save more for persistence
  };

  localStorage.setItem(`chat_${session.characterSlug}`, JSON.stringify(saveData));
  console.log(`💾 Saved conversation for ${session.characterSlug}`);
}

/**
 * Restore conversation from localStorage
 */
export function restoreConversation(characterSlug: string): ChatSession | null {
  const data = localStorage.getItem(`chat_${characterSlug}`);
  if (!data) return null;

  try {
    const parsed: ChatSession = JSON.parse(data);
    parsed.lastActivity = Date.now();
    activeChats[parsed.id] = parsed;
    console.log(`📂 Restored conversation for ${characterSlug}`);
    return parsed;
  } catch (error) {
    console.error("❌ Failed to restore conversation:", error);
    return null;
  }
}

/**
 * Get session statistics
 */
export function getSessionStats(sessionId: string) {
  const session = activeChats[sessionId];
  if (!session) return null;

  return {
    messageCount: session.conversation.filter((m) => m.role !== "system").length,
    userMessages: session.conversation.filter((m) => m.role === "user").length,
    assistantMessages: session.conversation.filter((m) => m.role === "assistant").length,
    currentEmotion: session.emotion,
    currentModel: session.model,
    lastActivity: new Date(session.lastActivity).toLocaleString(),
    cacheSize: responseCache.size,
    queueSize: requestQueue.length,
    activeRequests,
  };
}

/**
 * Clear session
 */
export function clearSession(sessionId: string) {
  delete activeChats[sessionId];
  console.log(`🗑️ Cleared session: ${sessionId}`);
}

/**
 * Get all active sessions
 */
export function getActiveSessions(): ChatSession[] {
  return Object.values(activeChats);
}

/**
 * Cleanup inactive sessions (older than 30 minutes)
 */
export function cleanupInactiveSessions() {
  const now = Date.now();
  const timeout = 30 * 60 * 1000; // 30 minutes

  Object.entries(activeChats).forEach(([id, session]) => {
    if (now - session.lastActivity > timeout) {
      saveConversation(id);
      delete activeChats[id];
      console.log(`🧹 Cleaned up inactive session: ${id}`);
    }
  });
}

// Auto-cleanup every 10 minutes
setInterval(cleanupInactiveSessions, 10 * 60 * 1000);

// Export configuration for external use
export const getConfig = () => ({ ...CONFIG });

