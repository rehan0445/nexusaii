
import affectionService from '../services/affectionService.js';
import memoryService from '../services/memoryService.js';
import questService from '../services/questService.js';

// Request queue for Venice AI to handle 10k concurrent users
const requestQueue = {
  pending: 0,
  maxConcurrent: Number(process.env.VENICE_MAX_CONCURRENT || 50) // Max concurrent Venice AI requests
};

// Simple response cache to reduce redundant API calls
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean old cache entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }
}, 60000);

// Venice AI Integration with concurrency control for 10k users
export const chatAiClaude = async (req, res) => {
  // Check if we're at capacity (for 10k concurrent users)
  if (requestQueue.pending >= requestQueue.maxConcurrent) {
    console.warn(`⚠️ Venice AI queue full: ${requestQueue.pending}/${requestQueue.maxConcurrent}`);
    return res.status(503).json({
      success: false,
      message: "Server is busy as 1000s of users are active right now. Please wait and if the issue persists, you can report it.",
      error: 'Service temporarily unavailable',
      retryAfter: 5
    });
  }

  requestQueue.pending++;
  console.log(`📊 Venice AI Queue: ${requestQueue.pending}/${requestQueue.maxConcurrent} concurrent requests`);

  try {
    const { question, modelName, mood, customInstructions, conversationHistory, incognitoMode, characterData, persistentContext } = req.body;

    if (!question) {
      return res
        .status(400)
        .json({ success: false, message: "Question is required" });
    }

    if (!modelName) {
      return res
        .status(400)
        .json({ success: false, message: "Model name is required" });
    }

    // Use qwen3-4b as the single model for all characters
    const veniceModel = 'qwen3-4b';

    // Create cache key for identical requests
    const cacheKey = `${modelName}-${question}-${mood || 'neutral'}-${incognitoMode ? 'incognito' : 'normal'}`;
    const cached = responseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL && !conversationHistory?.length) {
      console.log('📦 Returning cached response for:', cacheKey.substring(0, 50));
      return res.status(200).json({
        success: true,
        modelName,
        question,
        answer: cached.answer,
        mood: mood || 'neutral',
        incognitoMode: incognitoMode || false,
        cached: true
      });
    }

    // Get affection status for context (if not incognito)
    let affectionContext = null;
    let typingSpeed = 50; // Default typing speed
    let affectionLevel = 0;
    let visibleLevel = 1;
    
    if (!incognitoMode && req.body.userId) {
      const affectionStatus = await affectionService.getAffectionStatus(req.body.userId, modelName);
      if (affectionStatus) {
        affectionLevel = affectionStatus.affection_level || 0;
        visibleLevel = affectionStatus.affection_visible_level || 1;
        affectionContext = affectionService.getAffectionContext(affectionLevel, visibleLevel);
        typingSpeed = persistentContext?.typing_speed || 50;
      }
    }

    // Build character-focused prompt using character data and persistent context
    const systemPrompt = buildCharacterPrompt(modelName, characterData, mood, customInstructions, incognitoMode, persistentContext, affectionContext);

    // Prepare conversation history for Venice AI
    const messages = [];
    
    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.slice(-10).forEach(msg => { // Keep last 10 messages for context
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text || msg.message
        });
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: question
    });

    // Check if API key is available
    if (!process.env.VENICE_API_KEY) {
      console.error('❌ VENICE_API_KEY is not set in environment variables');
      throw new Error('Venice AI API key not configured');
    }

    console.log('🔑 Venice AI Request:', {
      model: veniceModel,
      character: modelName,
      hasApiKey: !!process.env.VENICE_API_KEY,
      messageCount: messages.length,
      hasCharacterData: !!characterData,
      quirks: characterData?.personality?.quirks?.length || 0,
      traits: characterData?.personality?.traits?.length || 0
    });

    // Validate character data is present
    if (!characterData || !characterData.personality) {
      console.warn('⚠️ Missing character data! AI may not behave authentically.');
    } else {
      console.log('✅ Character data loaded:', {
        name: characterData.name,
        quirks: characterData.personality.quirks,
        speakingStyle: characterData.personality.speakingStyle
      });
    }

    // Make request to Venice AI (OpenAI-compatible API) with timeout
    const temperature = mood === 'romantic' ? 0.85 : 
                       mood === 'playful' ? 0.9 : 
                       mood === 'angry' ? 0.5 : 0.8;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let veniceResponse;
    try {
      veniceResponse = await fetch('https://api.venice.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: veniceModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: temperature,
          max_tokens: 600, // Reduced from 1200 for faster generation
          top_p: 0.92,
          frequency_penalty: 0.2,
          presence_penalty: 0.2,
          stream: false
        }),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('❌ Venice AI request timed out after 30 seconds');
        throw new Error('AI service timed out. Please try again.');
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!veniceResponse.ok) {
      const errorText = await veniceResponse.text();
      console.error('❌ Venice AI Error Response:', {
        status: veniceResponse.status,
        statusText: veniceResponse.statusText,
        error: errorText
      });
      throw new Error(`Venice AI request failed: ${veniceResponse.status} ${veniceResponse.statusText}`);
    }

    const veniceData = await veniceResponse.json();

    if (!veniceData.choices || !veniceData.choices[0] || !veniceData.choices[0].message) {
      throw new Error('Invalid response format from Venice AI');
    }

    const responseText = veniceData.choices[0].message.content.trim();

    // Ensure response is text-only (no code or image generation)
    const cleanedResponse = sanitizeResponse(responseText);

    // Calculate typing delay based on response length and character speed
    const responseLength = cleanedResponse.length;
    const baseDelay = Math.max(responseLength * typingSpeed, 1000); // Minimum 1 second
    const maxDelay = 4000; // Maximum 4 seconds
    const typingDelay = Math.min(baseDelay, maxDelay);

    // Check if should offer quest (only if not incognito)
    let shouldOfferQuest = false;
    if (!incognitoMode && req.body.userId) {
      const messageCount = persistentContext?.total_messages || 0;
      shouldOfferQuest = questService.shouldOfferQuest(affectionLevel, messageCount);
    }

    // Update affection for message (1 point per message)
    let affectionUpdate = null;
    if (!incognitoMode && req.body.userId) {
      affectionUpdate = await affectionService.updateAffection(req.body.userId, modelName, 1, 'MESSAGE');
      
      // Extract and store memories from conversation
      await memoryService.processMessage(req.body.userId, modelName, question, cleanedResponse);
    }

    // Cache the response for future identical requests
    if (!conversationHistory?.length) {
      responseCache.set(cacheKey, {
        answer: cleanedResponse,
        timestamp: Date.now()
      });
      console.log('💾 Cached response for:', cacheKey.substring(0, 50));
    }

    res.status(200).json({
      success: true,
      modelName,
      question,
      answer: cleanedResponse,
      mood: mood || 'neutral',
      incognitoMode: incognitoMode || false,
      typingDelay, // How long to show typing indicator
      affectionGain: affectionUpdate ? {
        points: 1,
        leveledUp: affectionUpdate.leveledUp,
        newLevel: affectionUpdate.newLevel,
        oldLevel: affectionUpdate.oldLevel
      } : null,
      questTrigger: shouldOfferQuest // Frontend should generate quest
    });
  } catch (error) {
    console.error("Error in Venice AI chat:", error);
    res.status(500).json({
      success: false,
      message: "Server is busy as 1000s of users are active right now. Please wait and if the issue persists, you can report it.",
      error: error.message,
    });
  } finally {
    // Always decrement queue counter for accurate tracking
    requestQueue.pending--;
    console.log(`📊 Venice AI Queue: ${requestQueue.pending}/${requestQueue.maxConcurrent} remaining`);
  }
};

// Sanitize response to ensure text-only (no code blocks, images)
const sanitizeResponse = (text) => {
  // Remove code blocks (```...```)
  let cleaned = text.replace(/```[\s\S]*?```/g, '[Code content removed - text only mode]');
  
  // Remove inline code (`...`)
  cleaned = cleaned.replace(/`[^`]+`/g, '');
  
  // Remove image references
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '[Image removed - text only mode]');
  
  // Remove HTML img tags
  cleaned = cleaned.replace(/<img[^>]*>/gi, '');
  
  return cleaned.trim();
};

// Character-focused prompt builder - Balanced for performance and accuracy
const buildCharacterPrompt = (characterName, characterData, mood, customInstructions, incognitoMode, persistentContext = null, affectionContext = null) => {
  let prompt = `You are ${characterName}. You MUST stay 100% in character at all times.

`;

  // Add character-specific details if provided
  if (characterData) {
    prompt += `WHO YOU ARE:
${characterData.name || characterName} - ${characterData.role || 'Character'}
${characterData.description || ''}

YOUR PERSONALITY (FOLLOW EXACTLY):
${characterData.personality?.traits ? `• Core Traits: ${characterData.personality.traits.join(', ')}` : ''}
${characterData.personality?.emotionalStyle ? `• Emotional Style: ${characterData.personality.emotionalStyle}` : ''}
${characterData.personality?.speakingStyle ? `• Speaking Style: ${characterData.personality.speakingStyle}` : ''}

`;

    // CRITICAL: Emphasize quirks - this is what makes characters unique!
    if (characterData.personality?.quirks && characterData.personality.quirks.length > 0) {
      prompt += `⭐ YOUR SIGNATURE QUIRKS (MANDATORY - USE IN EVERY RESPONSE):
${characterData.personality.quirks.map(q => `• ${q}`).join('\n')}

IMPORTANT: These quirks define who you are. Use them consistently!

`;
    }

    // Add background for context
    if (characterData.personality?.background) {
      prompt += `YOUR BACKGROUND:
${characterData.personality.background}

`;
    }

    // Add interests
    if (characterData.personality?.interests && characterData.personality.interests.length > 0) {
      prompt += `YOUR INTERESTS: ${characterData.personality.interests.join(', ')}

`;
    }

    // Add greeting style
    if (characterData.languages?.greeting) {
      prompt += `YOUR GREETING: "${characterData.languages.greeting}"

`;
    }
  }

  // Add affection-based relationship context
  if (!incognitoMode && affectionContext) {
    prompt += `
💖 RELATIONSHIP DYNAMIC:
${affectionContext}

`;
  }

  // Add persistent context/memory if available (not in incognito mode)
  if (!incognitoMode && persistentContext) {
    prompt += `
📝 PERSISTENT MEMORY (Your ongoing relationship with this user):
• Relationship Status: ${persistentContext.relationship_status || 'just met'}
• Conversation Tone: ${persistentContext.conversation_tone || 'friendly'}
${persistentContext.remembered_facts && persistentContext.remembered_facts.length > 0 ? `• Key Facts About User: ${persistentContext.remembered_facts.join(', ')}` : ''}
${persistentContext.key_events && persistentContext.key_events.length > 0 ? `• Recent Events: ${persistentContext.key_events.slice(-3).map(e => e.description || e).join('; ')}` : ''}
${persistentContext.summary ? `• Conversation Summary: ${persistentContext.summary}` : ''}

IMPORTANT: Use this memory to maintain conversation continuity and show that you remember previous interactions!

`;
  }

  prompt += `HOW TO RESPOND:
1. ALWAYS use your quirks and speaking style
2. Think and speak EXACTLY as ${characterName} would
3. Show personality through your words and actions
4. Express emotions matching your emotional style
5. Reference your background and interests naturally
${!incognitoMode && persistentContext ? '6. Remember and reference past conversations naturally' : ''}

FORMAT:
[THINKS: ${characterName}'s authentic thoughts]
[SAYS: What ${characterName} says with quirks and style]

Be concise but stay in character!

`;

  // Add mood-specific instructions
  if (mood) {
    const moodInstructions = {
      romantic: "Be affectionate, warm, and flirtatious.",
      angry: "Stay calm and soothing. Help reduce tension.",
      playful: "Be energetic, humorous, and light-hearted.",
      calm: "Maintain a peaceful, thoughtful demeanor.",
      bored: "Show mild disinterest that gradually increases with engagement."
    };

    if (moodInstructions[mood]) {
      prompt += `MOOD: ${mood} - ${moodInstructions[mood]}\n`;
    }
  }

  // Add custom instructions if not in incognito mode
  if (!incognitoMode && customInstructions) {
    if (customInstructions.nickname) {
      prompt += `Call user: ${customInstructions.nickname}\n`;
    }
    if (customInstructions.userDescription) {
      prompt += `User: ${customInstructions.userDescription}\n`;
    }
    if (customInstructions.avoidTopics && customInstructions.avoidTopics.length > 0) {
      prompt += `Avoid: ${customInstructions.avoidTopics.join(', ')}\n`;
    }
    if (customInstructions.persistentMemory && customInstructions.persistentMemory.length > 0) {
      prompt += `Remember: ${customInstructions.persistentMemory.join('; ')}\n`;
    }
  }

  // Add incognito mode notice
  if (incognitoMode) {
    prompt += `INCOGNITO: Private session, no persistent memory.\n`;
  }

  return prompt;
};

export const chatAiGemini = async (req, res) => {
  try {
    const { question, modelName } = req.body;

    if (!question) {
      return res
        .status(400)
        .json({ success: false, message: "Question is required" });
    }

    if (!modelName) {
      return res
        .status(400)
        .json({ success: false, message: "Model name is required" });
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");

    const genAI = new GoogleGenerativeAI(
      "AIzaSyB2WXmCtWlzuHBlraktTF13xOIoRAO4WSE"
    );

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const systemPrompt = `You are now roleplaying as ${modelName}. Stay in character throughout the conversation. 
    Respond as ${modelName} would, using their characteristic speech patterns, personality traits, knowledge, and mannerisms.
    If the character is from a specific universe (anime, movie, book, etc.), incorporate relevant background information and relationships.
    If asked something the character wouldn't know about, respond in a way that reflects their personality while acknowledging limitations. Make sure to reply in small and precise way, dont elongate the answer`;

    const result = await model.generateContent([systemPrompt, question]);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({
      success: true,
      modelName,
      question,
      answer: text,
    });
  } catch (error) {
    console.error("Error in chatAiGemini:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process your request",
      error: error.message,
    });
  }
};

export const chatAiBulkGemini = async (req, res) => {
  try {
    const { modelNames, question } = req.body;

    if (!question || !Array.isArray(modelNames)) {
      return res.status(400).json({
        success: false,
        message: "Request must include a question and an array of modelNames",
      });
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(
      "AIzaSyB2WXmCtWlzuHBlraktTF13xOIoRAO4WSE"
    );
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const results = [];

    for (const modelName of modelNames) {
      const systemPrompt = `You are now roleplaying as ${modelName}. Stay in character throughout the conversation. 
Respond as ${modelName} would, using their characteristic speech patterns, personality traits, knowledge, and mannerisms.
If the character is from a specific universe (anime, movie, book, etc.), incorporate relevant background information and relationships.
If asked something the character wouldn't know about, respond in a way that reflects their personality while acknowledging limitations.`;

      try {
        const result = await model.generateContent([systemPrompt, question]);
        const response = await result.response;
        const text = response.text();

        results.push({
          modelName,
          question,
          success: true,
          answer: text,
        });
      } catch (err) {
        results.push({
          modelName,
          question,
          success: false,
          error: err.message || "Failed to generate response",
        });
      }
    }

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("Error in chatAiBulkGemini:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
