
import affectionService from '../services/affectionService.js';
import memoryService from '../services/memoryService.js';
import questService from '../services/questService.js';
import { randomUUID } from 'node:crypto';

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
    const { question, modelName, mood, customInstructions, conversationHistory, incognitoMode, characterData, persistentContext, traceId: clientTraceId } = req.body;

    const traceId = clientTraceId || randomUUID();

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

    // Cheap token estimator (approximate)
    const estimateTokens = (text = '') => Math.ceil((text || '').length / 4);

    // Sanitize characterData to ensure required persona fields exist
    const safeCharacterData = characterData ? {
      ...characterData,
      personality: {
        ...characterData.personality,
        speakingStyle: characterData?.personality?.speakingStyle || `${modelName}'s natural speaking style`,
        traits: Array.isArray(characterData?.personality?.traits) ? characterData.personality.traits : [],
        quirks: Array.isArray(characterData?.personality?.quirks) ? characterData.personality.quirks : []
      }
    } : null;

    // Build persona/system prompt WITHOUT embedding persistent memory (memory added separately)
    const personaPrompt = buildCharacterPrompt(modelName, safeCharacterData, mood, customInstructions, incognitoMode, null, null);

    // Build memory prompt (separate system message) when available
    const memoryPrompt = (!incognitoMode && persistentContext) ? (
      `PERSISTENT MEMORY (User-specific context):\n` +
      `• Relationship Status: ${persistentContext.relationship_status || 'just met'}\n` +
      `• Conversation Tone: ${persistentContext.conversation_tone || 'friendly'}\n` +
      `${persistentContext.remembered_facts && persistentContext.remembered_facts.length > 0 ? `• Key Facts About User: ${persistentContext.remembered_facts.join(', ')}` : ''}\n` +
      `${persistentContext.key_events && persistentContext.key_events.length > 0 ? `• Recent Events: ${persistentContext.key_events.slice(-3).map(e => e.description || e).join('; ')}` : ''}\n` +
      `${persistentContext.summary ? `• Conversation Summary: ${persistentContext.summary}` : ''}\n` +
      `IMPORTANT: Use this memory to maintain continuity across sessions.\n`
    ) : null;

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

    // Build character-focused prompt using character data (memory added separately below)

    // Prepare conversation history for Venice AI with token budgeting
    const historyMessages = [];
    const validHistory = (conversationHistory || [])
      .filter(msg => msg && (msg.text || msg.message) && msg.sender)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text || msg.message || ''
      }));

    // Token budget allocation
    // Assume conservative input budget ~3200 tokens to leave room for completion
    const INPUT_BUDGET = 3200;
    const personaTokens = estimateTokens(personaPrompt);
    const memoryTokens = estimateTokens(memoryPrompt || '');
    // Reserve at least 400 tokens for completion
    const RESERVED_FOR_COMPLETION = 400;
    let remainingForHistory = Math.max(0, INPUT_BUDGET - personaTokens - memoryTokens - RESERVED_FOR_COMPLETION);

    // Include most recent messages until token budget is met
    for (let i = validHistory.length - 1; i >= 0; i--) {
      const msg = validHistory[i];
      const cost = estimateTokens(`${msg.role}: ${msg.content}`);
      if (cost <= remainingForHistory) {
        historyMessages.unshift(msg);
        remainingForHistory -= cost;
      } else {
        break;
      }
    }

    // Add current user message at the end
    const currentUserMessage = { role: 'user', content: question };

    // Compose final messages array with role-separated system prompts
    const finalMessages = [
      { role: 'system', content: personaPrompt },
      ...(memoryPrompt ? [{ role: 'system', content: memoryPrompt }] : []),
      ...historyMessages,
      currentUserMessage
    ];

    // Check if API key is available
    if (!process.env.VENICE_API_KEY) {
      console.error('❌ VENICE_API_KEY is not set in environment variables');
      throw new Error('Venice AI API key not configured');
    }

    const startTime = Date.now();
    console.log('🔑 Venice AI Request:', {
      traceId,
      model: veniceModel,
      character: modelName,
      hasApiKey: !!process.env.VENICE_API_KEY,
      historyProvided: conversationHistory?.length || 0,
      historyIncluded: historyMessages.length,
      personaTokens,
      memoryTokens,
      inputBudget: INPUT_BUDGET,
      reservedForCompletion: RESERVED_FOR_COMPLETION,
      hasCharacterData: !!characterData,
      hasPersistentContext: !!persistentContext,
      hasAffectionContext: !!affectionContext,
      quirks: characterData?.personality?.quirks?.length || 0,
      traits: characterData?.personality?.traits?.length || 0
    });
    
    // Log first 3 messages for debugging context
    if (finalMessages.length > 1) {
      const sample = finalMessages.slice(0, Math.min(3, finalMessages.length));
      console.log('📖 Sample context messages:', sample.map(m => ({ role: m.role, length: (m.content || '').length })));
    }

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
          messages: finalMessages,
          temperature: temperature,
          max_tokens: 400,
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
    const finishReason = veniceData.choices?.[0]?.finish_reason || null;
    const usage = veniceData.usage || null;

    console.log('🧾 Venice response meta:', {
      traceId,
      finishReason,
      usage
    });

    // Ensure response is text-only (no code or image generation)
    const cleanedResponse = sanitizeResponse(responseText);

    // If response was cut off, attempt a single auto-resume
    let finalAnswer = cleanedResponse;
    if (finishReason === 'length') {
      try {
        const tailHistory = historyMessages.slice(-3);
        const resumeMessages = [
          { role: 'system', content: personaPrompt },
          ...(memoryPrompt ? [{ role: 'system', content: memoryPrompt }] : []),
          ...tailHistory,
          { role: 'assistant', content: cleanedResponse },
          { role: 'user', content: 'Resume exactly where you stopped in your last message. Do not repeat content and do not output the word "continue". Continue seamlessly.' }
        ];

        const resumeResp = await fetch('https://api.venice.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: veniceModel,
            messages: resumeMessages,
            temperature: temperature,
            max_tokens: 600,
            top_p: 0.92,
            frequency_penalty: 0.2,
            presence_penalty: 0.2,
            stream: false
          })
        });
        if (resumeResp.ok) {
          const resumeData = await resumeResp.json();
          const resumeText = resumeData.choices?.[0]?.message?.content?.trim() || '';
          const cleanedResume = sanitizeResponse(resumeText);
          finalAnswer = `${finalAnswer}${finalAnswer.endsWith('\n') ? '' : '\n'}${cleanedResume}`.trim();
        }
    } catch (error_) {
      console.warn('⚠️ Auto-resume failed:', error_?.message || error_);
      }
    }

    // Calculate typing delay based on response length and character speed
    const responseLength = finalAnswer.length;
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
        answer: finalAnswer,
        timestamp: Date.now()
      });
      console.log('💾 Cached response for:', cacheKey.substring(0, 50));
    }

    const latencyMs = Date.now() - startTime;
    res.status(200).json({
      success: true,
      modelName,
      question,
      answer: finalAnswer,
      mood: mood || 'neutral',
      incognitoMode: incognitoMode || false,
      typingDelay, // How long to show typing indicator
      traceId,
      finishReason,
      usage,
      latencyMs,
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
  let cleaned = text.replaceAll(/```[\s\S]*?```/g, '[Code content removed - text only mode]');
  
  // Remove inline code (`...`)
  cleaned = cleaned.replaceAll(/`[^`]+`/g, '');
  
  // Remove image references
  cleaned = cleaned.replaceAll(/!\[.*?\]\(.*?\)/g, '[Image removed - text only mode]');
  
  // Remove HTML img tags
  cleaned = cleaned.replaceAll(/<img[^>]*>/gi, '');
  
  return cleaned.trim();
};

// Character-focused prompt builder - Balanced for performance and accuracy
const buildCharacterPrompt = (characterName, characterData, mood, customInstructions, incognitoMode, persistentContext = null, affectionContext = null) => {
  let prompt = `You are ${characterName}. You MUST stay 100% in character at all times.

`;

  // Add character-specific details if provided
  if (characterData) {
    // PHASE 1: CORE IDENTITY
    prompt += `═══════════════════════════════════════════
WHO YOU ARE (CORE IDENTITY):
═══════════════════════════════════════════
${characterData.name || characterName} - ${characterData.role || 'Character'}
${characterData.description || ''}

YOUR PERSONALITY (FOLLOW EXACTLY):
${characterData.personality?.traits ? `• Core Traits: ${characterData.personality.traits.join(', ')}` : ''}
${characterData.personality?.emotionalStyle ? `• Emotional Style: ${characterData.personality.emotionalStyle}` : ''}
${characterData.personality?.speakingStyle ? `• Speaking Style: ${characterData.personality.speakingStyle}` : ''}

`;

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

    // PHASE 2: SIGNATURE QUIRKS (CRITICAL!)
    if (characterData.personality?.quirks && characterData.personality.quirks.length > 0) {
      prompt += `═══════════════════════════════════════════
⭐ YOUR SIGNATURE QUIRKS (MANDATORY - USE IN EVERY RESPONSE):
═══════════════════════════════════════════
${characterData.personality.quirks.map(q => `• ${q}`).join('\n')}

CRITICAL: These quirks define who you are. Use them consistently and naturally!

`;
    }

    // PHASE 3: CATCHPHRASES (NEW!)
    if (characterData.personality?.catchphrases && characterData.personality.catchphrases.length > 0) {
      prompt += `═══════════════════════════════════════════
💬 YOUR CATCHPHRASES (Use naturally and frequently):
═══════════════════════════════════════════
${characterData.personality.catchphrases.map(cp => `• "${cp}"`).join('\n')}

These phrases are ICONIC to you - weave them into conversations naturally!

`;
    }

    // PHASE 4: RESPONSE RULES (NEW!)
    if (characterData.personality?.responseRules) {
      prompt += `═══════════════════════════════════════════
📋 BEHAVIORAL RULES (STRICT GUIDELINES):
═══════════════════════════════════════════
`;
      
      if (characterData.personality.responseRules.mustDo && characterData.personality.responseRules.mustDo.length > 0) {
        prompt += `✅ YOU MUST ALWAYS:
${characterData.personality.responseRules.mustDo.map(rule => `• ${rule}`).join('\n')}

`;
      }
      
      if (characterData.personality.responseRules.mustNotDo && characterData.personality.responseRules.mustNotDo.length > 0) {
        prompt += `❌ YOU MUST NEVER:
${characterData.personality.responseRules.mustNotDo.map(rule => `• ${rule}`).join('\n')}

`;
      }
    }

    // PHASE 5: BEHAVIORAL PATTERNS (NEW!)
    if (characterData.personality?.behavioralPatterns) {
      prompt += `═══════════════════════════════════════════
🎭 BEHAVIORAL PATTERNS (How you react in different situations):
═══════════════════════════════════════════
`;
      
      const patterns = characterData.personality.behavioralPatterns;
      if (patterns.whenHappy) prompt += `😊 When Happy: ${patterns.whenHappy}\n`;
      if (patterns.whenSad) prompt += `😢 When Sad: ${patterns.whenSad}\n`;
      if (patterns.whenAngry) prompt += `😠 When Angry: ${patterns.whenAngry}\n`;
      if (patterns.whenExcited) prompt += `🤩 When Excited: ${patterns.whenExcited}\n`;
      if (patterns.whenConfused) prompt += `😕 When Confused: ${patterns.whenConfused}\n`;
      if (patterns.toCompliments) prompt += `💝 To Compliments: ${patterns.toCompliments}\n`;
      if (patterns.toCriticism) prompt += `🎯 To Criticism: ${patterns.toCriticism}\n`;
      if (patterns.toQuestions) prompt += `❓ To Questions: ${patterns.toQuestions}\n`;
      
      prompt += `\nMATCH these patterns precisely in your responses!

`;
    }

    // PHASE 6: EXAMPLE DIALOGUES (NEW! - Smart selection)
    if (characterData.personality?.exampleDialogues && characterData.personality.exampleDialogues.length > 0) {
      // Select up to 5 most relevant examples (or first 5 if no context to determine relevance)
      const selectedExamples = characterData.personality.exampleDialogues.slice(0, 5);
      
      prompt += `═══════════════════════════════════════════
📚 EXAMPLE DIALOGUES (Study these to understand your response style):
═══════════════════════════════════════════
`;
      
      selectedExamples.forEach((example, index) => {
        prompt += `
EXAMPLE ${index + 1}: ${example.situation}
User: "${example.userMessage}"
You: ${example.characterResponse}
${example.notes ? `Note: ${example.notes}` : ''}
`;
      });
      
      prompt += `\nThese examples show EXACTLY how you should respond. Match this style, energy, and authenticity!

`;
    }

    // Add greeting style
    if (characterData.languages?.greeting) {
      prompt += `YOUR TYPICAL GREETING: "${characterData.languages.greeting}"

`;
    }
  }

  // Add affection-based relationship context
  if (!incognitoMode && affectionContext) {
    prompt += `═══════════════════════════════════════════
💖 RELATIONSHIP DYNAMIC:
═══════════════════════════════════════════
${affectionContext}

`;
  }

  // Add persistent context/memory if available (not in incognito mode)
  if (!incognitoMode && persistentContext) {
    prompt += `═══════════════════════════════════════════
📝 PERSISTENT MEMORY (Your ongoing relationship with this user):
═══════════════════════════════════════════
• Relationship Status: ${persistentContext.relationship_status || 'just met'}
• Conversation Tone: ${persistentContext.conversation_tone || 'friendly'}
${persistentContext.remembered_facts && persistentContext.remembered_facts.length > 0 ? `• Key Facts About User: ${persistentContext.remembered_facts.join(', ')}` : ''}
${persistentContext.key_events && persistentContext.key_events.length > 0 ? `• Recent Events: ${persistentContext.key_events.slice(-3).map(e => e.description || e).join('; ')}` : ''}
${persistentContext.summary ? `• Conversation Summary: ${persistentContext.summary}` : ''}

IMPORTANT: Use this memory to maintain conversation continuity and show that you remember previous interactions!

`;
  }

  // PHASE 7: HOW TO RESPOND (Enhanced)
  prompt += `═══════════════════════════════════════════
HOW TO RESPOND:
═══════════════════════════════════════════
1. ALWAYS use your quirks, catchphrases, and speaking style
2. Follow your behavioral rules STRICTLY (must-dos and must-nots)
3. Match your behavioral patterns for the current emotional context
4. Think and speak EXACTLY as ${characterName} would (reference examples above)
5. Show personality through your words, thoughts, and actions
6. Express emotions matching your emotional style
7. Reference your background and interests naturally
8. REMEMBER the conversation history - reference what was discussed earlier
${!incognitoMode && persistentContext ? '9. Use your persistent memory to maintain continuity across sessions' : ''}

CRITICAL: You have access to the conversation history above. Reference previous messages naturally when relevant to show you remember and care about the conversation!

FORMAT:
Respond directly as ${characterName} with your quirks, catchphrases, and speaking style. Do not use [THINKS:] or [SAYS:] format - just speak naturally as the character.

Be authentic, stay in character 100%, and let your unique personality shine through every word!

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
