import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import affectionService from '../services/affectionService.js';

const router = express.Router();

// Get chat history for a character
router.post('/history', requireAuth, async (req, res) => {
  try {
    const { character_id } = req.body;
    const user_id = req.userId || req.user?.id || req.body?.user_id;

    if (!user_id || !character_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id and character_id are required' 
      });
    }

    // Fetch messages from Supabase
    const { data, error } = await supabase
      .from('companion_chat_messages')
      .select('*')
      .eq('user_id', user_id)
      .eq('character_id', character_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch chat history',
        details: error.message 
      });
    }

    console.log(`✅ Fetched ${data?.length || 0} messages for user ${user_id}, character ${character_id}`);

    res.json({ 
      success: true, 
      messages: data || [] 
    });

  } catch (error) {
    console.error('Error in /history:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Store a message
router.post('/store-message', requireAuth, async (req, res) => {
  try {
    const { character_id, message_type, content, user_thoughts } = req.body;
    const user_id = req.userId || req.user?.id || req.body?.user_id;

    console.log(`📝 Storing message: user=${user_id}, character=${character_id}, type=${message_type}`);

    if (!user_id || !character_id || !message_type || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id, character_id, message_type, and content are required' 
      });
    }

    // Validate message_type
    const validTypes = ['user', 'ai_thought', 'ai_speech'];
    if (!validTypes.includes(message_type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid message_type' 
      });
    }

    // Update last interaction timestamp and increment message count (only for user messages)
    if (message_type === 'user') {
      await affectionService.updateLastInteraction(user_id, character_id);
      await affectionService.incrementMessageCount(user_id, character_id);
    }

    // Insert message into Supabase
    const { data, error } = await supabase
      .from('companion_chat_messages')
      .insert([
        {
          user_id,
          character_id,
          message_type,
          content,
          user_thoughts,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('❌ Error storing message:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to store message',
        details: error.message 
      });
    }

    console.log(`✅ Message stored successfully: ${data?.[0]?.id}`);

    res.json({ 
      success: true, 
      message: data?.[0] 
    });

  } catch (error) {
    console.error('❌ Error in /store-message:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Store incognito message
router.post('/store-incognito', requireAuth, async (req, res) => {
  try {
    const { user_profile_name, character_id, message_type, content, user_thoughts } = req.body;

    if (!user_profile_name || !character_id || !message_type || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_profile_name, character_id, message_type, and content are required' 
      });
    }

    // Validate message_type
    const validTypes = ['user', 'ai_thought', 'ai_speech'];
    if (!validTypes.includes(message_type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid message_type' 
      });
    }

    // Insert message into incognito table
    const { data, error } = await supabase
      .from('incognito_user_secrets')
      .insert([
        {
          user_profile_name,
          character_id,
          message_type,
          content,
          user_thoughts,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error storing incognito message:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to store incognito message' 
      });
    }

    res.json({ 
      success: true, 
      message: data?.[0] 
    });

  } catch (error) {
    console.error('Error in /store-incognito:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Generate hints based on last 15 messages
router.post('/generate-hints', requireAuth, async (req, res) => {
  try {
    const { user_id, character_id, context_messages, character_name } = req.body;

    if (!user_id || !character_id || !context_messages) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id, character_id, and context_messages are required' 
      });
    }

    // Get last 15 messages
    const last15 = context_messages.slice(-15);

    // Generate context-based hints using AI
    // For now, return smart context-based hints
    const hints = generateContextBasedHints(last15, character_name);

    // Try to store hints in database (gracefully handle if table doesn't exist)
    try {
      await supabase
        .from('companion_chat_hints')
        .insert([
          {
            user_id,
            character_id,
            hint_text: hints.join('|'),
            context_messages: JSON.stringify(last15),
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
          }
        ]);
      console.log('✅ Hints stored successfully in database');
    } catch (dbError) {
      // If table doesn't exist, log warning but don't fail the request
      console.warn('⚠️ Could not store hints in database (table may not exist):', dbError.message);
      console.log('💡 Run FIX_COMPANION_HINTS_TABLE.sql to create the table');
    }

    // Always return hints even if storage fails
    res.json({ 
      success: true, 
      hints 
    });

  } catch (error) {
    console.error('Error in /generate-hints:', error);
    
    // Return fallback hints even on error
    const fallbackHints = [
      "Tell me more about that",
      "That's interesting!",
      "How does that make you feel?",
      "What happened next?",
      "I'd love to hear more"
    ];
    
    res.json({ 
      success: true, 
      hints: fallbackHints,
      fallback: true
    });
  }
});

// Helper function to generate context-based hints
function generateContextBasedHints(messages, characterName) {
  if (messages.length === 0) {
    return [
      "Tell me about yourself",
      "What's your favorite hobby?",
      "How are you feeling today?",
      "What's on your mind?",
      "Share something interesting"
    ];
  }

  const hints = [];
  const lastAiMessage = [...messages].reverse().find(msg => msg.sender === 'ai');

  if (lastAiMessage) {
    const content = (lastAiMessage.content || '').toLowerCase();

    // Question-based hints
    if (content.includes('?')) {
      hints.push("Yes, absolutely!");
      hints.push("I'm not sure about that");
      hints.push("Can you explain more?");
    }

    // Emotion-based hints
    if (content.includes('feel') || content.includes('emotion')) {
      hints.push("How does that make you feel?");
      hints.push("I understand");
      hints.push("Tell me more about your feelings");
    }

    // Interest-based hints
    if (content.includes('like') || content.includes('enjoy') || content.includes('love')) {
      hints.push("I love that too!");
      hints.push("What else do you like?");
      hints.push("That sounds amazing!");
    }

    // Agreement/disagreement hints
    if (content.includes('think') || content.includes('believe')) {
      hints.push("I agree with you");
      hints.push("That's an interesting perspective");
      hints.push("What makes you think that?");
    }

    // Story continuation hints
    if (content.includes('story') || content.includes('happened') || content.includes('time')) {
      hints.push("Tell me more about that");
      hints.push("What happened next?");
      hints.push("That sounds fascinating");
    }
  }

  // Add generic hints if we don't have enough
  const genericHints = [
    "That's interesting",
    "Can you elaborate?",
    "I'd love to hear more",
    `What do you think, ${characterName}?`,
    "Tell me your thoughts on this"
  ];

  hints.push(...genericHints);

  // Return unique hints, max 5
  return [...new Set(hints)].slice(0, 5);
}

export default router;

