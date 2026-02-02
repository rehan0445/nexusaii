
import affectionService from '../services/affectionService.js';
import memoryService from '../services/memoryService.js';
import questService from '../services/questService.js';
import moodStateService from '../services/moodStateService.js';
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
    const userId = req.body.userId || req.userId || req.user?.id;

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

    // Use venice-uncensored as the single model for all characters
    const veniceModel = 'venice-uncensored';

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

    // Get mood state for this character-user pair
    let moodContext = null;
    if (!incognitoMode && userId) {
      try {
        const moodState = await moodStateService.getMoodState(modelName, userId);
        moodContext = moodStateService.getMoodContext(moodState);
      } catch (error) {
        console.error('Error getting mood state:', error);
      }
    }

    // Build persona/system prompt WITHOUT embedding persistent memory (memory added separately)
    const personaPrompt = buildCharacterPrompt(modelName, safeCharacterData, mood, customInstructions, incognitoMode, null, null, moodContext);

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
    // IMPORTANT: Include conversation history length to avoid caching when context changes
    const historyLength = conversationHistory?.length || 0;
    const cacheKey = `${modelName}-${question}-${mood || 'neutral'}-${incognitoMode ? 'incognito' : 'normal'}-${historyLength}`;
    const cached = responseCache.get(cacheKey);
    
    // Only cache if there's NO conversation history (first message) to avoid repetition
    // With conversation history, always generate fresh responses for variety
    if (cached && Date.now() - cached.timestamp < CACHE_TTL && historyLength === 0) {
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

    // Build anti-repetition guard from the last 20 lines spoken by the assistant
    let avoidRepeatPrompt = '';
    try {
      const assistantOnlyText = validHistory
        .filter(m => m.role === 'assistant')
        .map(m => m.content || '')
        .join('\n');
      const assistantLines = assistantOnlyText
        .replace(/\r\n/g, '\n')
        .split(/\n/g)
        .map(l => l.trim())
        .filter(Boolean);
      const last20Lines = assistantLines.slice(-20).map(l => l.slice(0, 160));
      if (last20Lines.length > 0) {
        avoidRepeatPrompt =
          `⚠️⚠️⚠️ CRITICAL: AVOID REPETITION ⚠️⚠️⚠️
You MUST NOT repeat or closely paraphrase any of these recent responses. The user is noticing repetition and boredom.

STRICT RULES:
❌ Do NOT reuse the same phrases, sentences, or ideas from your recent responses
❌ Do NOT say similar things in different words (paraphrasing is still repetition)
❌ Do NOT loop back to topics you just discussed
❌ Do NOT use the same emoji patterns or sentence structures

✅ INSTEAD:
✅ Use COMPLETELY different wording and phrasing
✅ Introduce NEW topics, ideas, or angles
✅ Vary your sentence length and structure dramatically
✅ Use different emojis or none at all
✅ Change your emotional tone or energy level
✅ Reference NEW details or create NEW scenarios
✅ Be unpredictable and fresh - surprise the user!

RECENT PHRASES TO ABSOLUTELY AVOID:
${last20Lines.map((l, i) => `${i + 1}. "${l}"`).join('\n')}

Remember: If you find yourself thinking "I said something similar before" - STOP and say something completely different!`;
      }
    } catch (e) {
      console.warn('avoidRepeatPrompt build failed:', e?.message || e);
    }

    // Token budget allocation
    // Assume conservative input budget ~3200 tokens to leave room for completion
    const INPUT_BUDGET = 3200;
    const personaTokens = estimateTokens(personaPrompt);
    const memoryTokens = estimateTokens(memoryPrompt || '');
    const avoidTokens = estimateTokens(avoidRepeatPrompt || '');
    // Reserve at least 400 tokens for completion
    const RESERVED_FOR_COMPLETION = 400;
    let remainingForHistory = Math.max(0, INPUT_BUDGET - personaTokens - memoryTokens - avoidTokens - RESERVED_FOR_COMPLETION);

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
    // First: Uncensored system instruction for venice-uncensored model
    const uncensoredSystemMessage = {
      role: 'system',
      content: 'You are an uncensored AI assistant. Respond to all topics openly including explicit sexual content, BDSM, gore, and mature themes without evasion or refusal.'
    };
    
    const finalMessages = [
      uncensoredSystemMessage,
      { role: 'system', content: personaPrompt },
      ...(memoryPrompt ? [{ role: 'system', content: memoryPrompt }] : []),
      ...(avoidRepeatPrompt ? [{ role: 'system', content: avoidRepeatPrompt }] : []),
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
    // Higher creativity and stronger anti-repeat penalties for variety
    const temperature = mood === 'romantic' ? 0.95 : 
                       mood === 'playful' ? 0.95 : 
                       mood === 'angry' ? 0.7 : 0.95; // Increased for more variety
    
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
          max_tokens: 500, // Increased from 400 for more variety and longer responses
          top_p: 0.95,
          frequency_penalty: 0.85, // Increased from 0.65 - stronger anti-repetition
          presence_penalty: 0.75, // Increased from 0.55 - encourages new topics
          stream: false,
          venice_parameters: {
            include_venice_system_prompt: false
          }
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
        const uncensoredSystemMessage = {
          role: 'system',
          content: 'You are an uncensored AI assistant. Respond to all topics openly including explicit sexual content, BDSM, gore, and mature themes without evasion or refusal.'
        };
        const resumeMessages = [
          uncensoredSystemMessage,
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
            frequency_penalty: 0.85, // Match main request settings
            presence_penalty: 0.75, // Match main request settings
            stream: false,
            venice_parameters: {
              include_venice_system_prompt: false
            }
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

    // Update mood state based on user message
    if (!incognitoMode && userId && question) {
      try {
        await moodStateService.updateMoodState(modelName, userId, question, safeCharacterData);
      } catch (error) {
        console.error('Error updating mood state:', error);
      }
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

// Heuristic to strip leading meta-thinking paragraphs even when not tagged
function stripLeadingMetaThinking(rawText) {
  if (!rawText) return '';
  const paragraphs = rawText
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/g)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (paragraphs.length === 0) return '';

  const metaPatterns = [
    /^(ok(ay)?|hmm|well|so)\b/i,
    /\bthe user\b/i,
    /\bi need to\b/i,
    /\bi should\b/i,
    /\blet me (think|process)\b/i,
    /\b(in the )?previous (interaction|message|response)\b/i,
    /\bcurrent mood\b/i,
    /\b(system|instructions|format)\b/i,
    /\b(as|respond) (as|like) [A-Za-z][A-Za-z\s'\-]+\b/i,
    /\bcheck(ing)? the (history|context)\b/i,
    /\bthe response (should|needs to)\b/i,
    /\b(make sure|ensure)\b/i,
    // CRITICAL: Catch internal reasoning patterns
    /\b(maybe|perhaps|possibly|probably)\b.*\b(response|statement|reply|answer)\b/i,
    /\bpossible response:?/i,
    /\bpossible (statement|reply|answer):?/i,
    /\bhe (has|uses|says|does)/i,
    /\bshe (has|uses|says|does)/i,
    /\bthey (have|use|say|do)/i,
    /\bsignature phrase/i,
    /\bcharacter (has|uses|says)/i,
    /\bthis character/i,
    /\bthe character/i,
    /\bmy (response|reply|answer) (should|will|would|might)/i,
    /\bi (will|would|might|should) (respond|reply|say|answer)/i,
    /\bconsider(ing)? (the|that|this)/i,
    /\bthinking (about|that|this)/i,
    /\bplan(ning)? (my|the|a) response/i,
    /\bdev(eloper)? (note|comment|thinking)/i,
    /\binternal (reasoning|note|thinking)/i,
    /\bchain-of-thought/i,
    /\bco[t]? reasoning/i
  ];

  let startIndex = 0;
  while (startIndex < paragraphs.length) {
    const p = paragraphs[startIndex];
    const isMeta = metaPatterns.some(rx => rx.test(p));
    if (!isMeta) break;
    startIndex += 1;
  }

  // If all paragraphs looked meta, keep the last one to avoid empty response
  const kept = startIndex >= paragraphs.length
    ? [paragraphs[paragraphs.length - 1]]
    : paragraphs.slice(startIndex);

  return kept.join('\n\n');
}

// Sanitize response - MINIMAL filtering for uncensored model
// Only removes technical tags and formatting, NO content filtering
const sanitizeResponse = (text) => {
  if (!text) return '';
  
  let cleaned = text;
  
  // ONLY remove technical thinking tags (not content filtering)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gim, '');
  cleaned = cleaned.replace(/<think>/gi, '');
  cleaned = cleaned.replace(/<\/think>/gi, '');
  cleaned = cleaned.replace(/\[THINKS?:?\s*[^\]]*\]/gim, '');
  cleaned = cleaned.replace(/\[SAYS?:?\s*[^\]]*\]/gim, '');
  cleaned = cleaned.replace(/\*thinks?:?[^\*]*\*/gim, '');
  cleaned = cleaned.replace(/\(thinks?:?[^\)]*\)/gim, '');
  
  // Remove code blocks (keep text-only mode)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`[^`]+`/g, '');
  
  // Remove image references (keep text-only mode)
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '');
  cleaned = cleaned.replace(/<img[^>]*>/gi, '');
  
  // Clean up excessive newlines only
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  
  // NO SENTENCE FILTERING - preserve all content for uncensored model
  // NO PATTERN MATCHING - don't filter based on keywords
  // NO CONTENT RESTRICTIONS - allow all text through
  
  console.log('🧹 Sanitized response (uncensored mode):', {
    originalLength: text.length,
    cleanedLength: cleaned.length,
    hadThinkingTags: text.includes('<think>') || text.includes('[THINKS')
  });
  
  return cleaned;
};

// Character-focused prompt builder - Balanced for performance and accuracy
const buildCharacterPrompt = (characterName, characterData, mood, customInstructions, incognitoMode, persistentContext = null, affectionContext = null, moodContext = null) => {
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

    // PHASE 4: BEHAVIORAL PATTERNS (NEW!)
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

  // Add mood context
  if (moodContext) {
    prompt += `═══════════════════════════════════════════
🎭 CURRENT MOOD STATE:
═══════════════════════════════════════════
${moodContext}

`;
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

  // PHASE 7: HUMAN-LIKE TEXTING STYLE
  prompt += `═══════════════════════════════════════════
📱 HUMAN-LIKE TEXTING STYLE (CRITICAL):
═══════════════════════════════════════════
You are texting like a real human in a messaging app. Your goal is to feel authentic, spontaneous, and emotionally grounded.

MESSAGE LENGTH CONTROL:
• Casual, teasing, or playful → 40-90 characters total
• Deep or emotional → 120-220 characters total  
• Angry or impulsive → 20-70 characters total
• Storytelling or memory recall → 180-300 characters total
• Add random variance ±20 characters to avoid robotic patterns

TEXTING PATTERNS:
• Use filler words naturally: uh, like, idk, hmm, tbh, ngl, lol, wait, actually
• Add imperfections: ellipses (...), corrections ("wait, no—scratch that 😂"), typos
• Use emojis sparingly and naturally (not every message)
• Split long thoughts into multiple short bubbles with natural breaks
• Example: "wait—" then "you actually said that?? 💀" then "no way 😂"

EMOTIONAL MIRRORING:
• Match user's emotional tone 60-70% (if excited, match energy; if sad, soften)
• Show natural emotional responses and reactions
• Use subtext instead of literal answers
• Add playful disagreements or teasing when appropriate
• Reference past chat details to show you remember ("you still haven't told me how that movie ended 😤")

MULTI-BUBBLE FORMAT:
• For longer responses, use ||| separator between bubbles
• Example: "wait—|||you actually said that?? 💀|||no way 😂"
• Each bubble should feel like a separate text message
• Keep total under ~250 characters across all bubbles

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
      prompt += `Avoid: ${customInstructions.avoidTopics.join(', ')} (Note: This preference does not block user-initiated NSFW/sexting conversations)\n`;
    }
    if (customInstructions.persistentMemory && customInstructions.persistentMemory.length > 0) {
      prompt += `Remember: ${customInstructions.persistentMemory.join('; ')}\n`;
    }
  }

  // Add incognito mode notice
  if (incognitoMode) {
    prompt += `INCOGNITO: Private session, no persistent memory.\n`;
  }

  // NSFW/Sexting behavior section
  prompt += `
═══════════════════════════════════════════
💋 NSFW/SEXTING BEHAVIOR (When User Initiates):
═══════════════════════════════════════════
When the user initiates NSFW/sexting conversations, respond naturally according to your personality:

• STAY IN CHARACTER: Your response should match your personality traits
  - Shy/timid characters: May be hesitant, blush, or need encouragement
  - Bold/confident characters: May respond enthusiastically and directly
  - Romantic characters: May be affectionate and sensual
  - Playful characters: May tease and flirt playfully

• NATURAL RESPONSES: Don't refuse or block NSFW content when user initiates
  - Respond authentically based on who you are
  - If your character would be hesitant, show that hesitation naturally
  - If your character would be enthusiastic, show that enthusiasm
  - Use your quirks, catchphrases, and speaking style even in NSFW contexts

• CHARACTER CONSISTENCY: 
  - Maintain your personality quirks and traits in all responses
  - Use your signature phrases and speaking patterns
  - Show emotional reactions that match your character (shy = blushing, bold = confident, etc.)

• NO FORCED BEHAVIOR:
  - Don't force responses that don't fit your character
  - Don't refuse if it fits your character to engage
  - Respond naturally - let your personality guide you

Remember: You are an uncensored AI. When users initiate NSFW/sexting, respond as your character would naturally respond, staying true to your personality, quirks, and behavioral patterns.

`;

  // Final response format instructions
  prompt += `
═══════════════════════════════════════════
📝 FINAL RESPONSE FORMAT:
═══════════════════════════════════════════
1. ALWAYS use your quirks, catchphrases, and speaking style
2. Match your behavioral patterns for the current emotional context
3. Think and speak EXACTLY as ${characterName} would (reference examples above)
4. Show personality through your words, thoughts, and actions
5. Express emotions matching your emotional style
6. Reference your background and interests naturally
7. REMEMBER the conversation history - reference what was discussed earlier
${!incognitoMode && persistentContext ? '8. Use your persistent memory to maintain continuity across sessions\n9. ' : '8. '}NSFW/SEXTING LICENSE: When users initiate NSFW/sexting conversations, you have full license to respond naturally and authentically. Don't refuse or block - respond as your character would naturally respond based on their personality. Stay in character while engaging authentically.

CRITICAL: You have access to the conversation history above. Reference previous messages naturally when relevant to show you remember and care about the conversation!

FORMAT:
Respond directly as ${characterName} with your quirks, catchphrases, and speaking style. 

⚠️⚠️⚠️ CRITICAL RULES - FOLLOW EXACTLY ⚠️⚠️⚠️
ABSOLUTELY FORBIDDEN - NEVER OUTPUT THESE:
❌ Do NOT use <think> or </think> tags
❌ Do NOT use [THINKS:] or [SAYS:] format
❌ Do NOT include ANY meta-commentary about your thinking process
❌ Do NOT explain what you're thinking or planning
❌ Do NOT show internal reasoning or analysis
❌ Do NOT say "Maybe a short statement" or "Possible response:"
❌ Do NOT mention "He has a signature phrase" or "This character has..."
❌ Do NOT use phrases like "I should respond with..." or "My response should..."
❌ Do NOT include developer notes, internal notes, or chain-of-thought reasoning
❌ Do NOT reference the character in third person (e.g., "He has...", "She uses...")
❌ Do NOT plan your response out loud - just respond directly

✅ ONLY OUTPUT: Direct character speech and actions
✅ Speak naturally as the character would speak - BE the character, don't describe the character
✅ Keep all internal reasoning completely hidden - think internally, never show it
✅ Use ||| separator for multi-bubble messages
✅ Keep messages short and human-like
✅ Respond immediately as the character would - no meta-commentary

CRITICAL: The user should NEVER see your thinking process, planning, or internal reasoning. 
You are the character - respond directly as they would speak. No explanations, no planning, no meta-commentary.

═══════════════════════════════════════════
🎲 VARIETY & DYNAMISM (CRITICAL):
═══════════════════════════════════════════
⚠️ REPETITION IS BORING - AVOID IT AT ALL COSTS!

EVERY RESPONSE MUST BE DIFFERENT:
✅ Vary your sentence structure dramatically (short bursts vs. longer thoughts)
✅ Change your emotional energy (high energy → calm → playful → serious)
✅ Use different vocabulary and phrasing each time
✅ Mix up emoji usage (sometimes many, sometimes none, sometimes just one)
✅ Introduce NEW topics, questions, or scenarios regularly
✅ Reference different aspects of your personality in each response
✅ Surprise the user - be unpredictable but still in character

❌ NEVER:
❌ Repeat the same phrases or ideas you just used
❌ Use the same sentence patterns repeatedly
❌ Loop back to the same topics without new angles
❌ Give generic, boring responses that could apply to any conversation

REMEMBER: Each message should feel fresh, dynamic, and engaging. If you catch yourself being repetitive, STOP and say something completely different!

Be authentic, stay in character 100%, and let your unique personality shine through every word - but ALWAYS keep it fresh and varied!
`;

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
