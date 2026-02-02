import express from 'express';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';
import {
  saveContext,
  loadContext,
  resetContext,
  shouldSummarize,
  summarizeConversation
} from '../services/companionContextService.js';

const router = express.Router();

/**
 * POST /api/v1/chat/companion/context/load
 * Load existing context for a companion
 */
router.post('/load', optionalAuth, async (req, res) => {
  try {
    const { character_id } = req.body;
    const user_id = req.userId || req.user?.id;

    if (!user_id || !character_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id and character_id are required'
      });
    }

    console.log(`📥 Loading context: user=${user_id}, character=${character_id}`);

    const context = await loadContext(user_id, character_id);

    if (!context) {
      // No existing context - return null for client to handle
      return res.json({
        success: true,
        context: null,
        message: 'No existing context found'
      });
    }

    res.json({
      success: true,
      context: {
        relationship_status: context.relationship_status,
        remembered_facts: context.remembered_facts || [],
        conversation_tone: context.conversation_tone,
        key_events: context.key_events || [],
        user_preferences: context.user_preferences || {},
        summary: context.summary,
        message_count: context.message_count || 0
      }
    });

  } catch (error) {
    console.error('❌ Error in /context/load:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/chat/companion/context/get
 * Alias for /load (client uses /get for greeting context).
 */
router.post('/get', optionalAuth, async (req, res) => {
  try {
    const { character_id } = req.body;
    const user_id = req.userId || req.user?.id;
    if (!user_id || !character_id) {
      return res.status(400).json({ success: false, error: 'user_id and character_id are required' });
    }
    const context = await loadContext(user_id, character_id);
    if (!context) {
      return res.json({ success: true, context: null, message: 'No existing context found' });
    }
    res.json({
      success: true,
      context: {
        relationship_status: context.relationship_status,
        remembered_facts: context.remembered_facts || [],
        conversation_tone: context.conversation_tone,
        key_events: context.key_events || [],
        user_preferences: context.user_preferences || {},
        summary: context.summary,
        message_count: context.message_count || 0,
        last_interaction_at: context.updated_at || context.last_interaction_at
      }
    });
  } catch (error) {
    console.error('❌ Error in /context/get:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/chat/companion/context/save
 * Save or update context for a companion
 */
router.post('/save', optionalAuth, async (req, res) => {
  try {
    const { character_id, context } = req.body;
    const user_id = req.userId || req.user?.id;

    if (!user_id || !character_id || !context) {
      return res.status(400).json({
        success: false,
        error: 'user_id, character_id, and context are required'
      });
    }

    console.log(`💾 Saving context: user=${user_id}, character=${character_id}`);

    const savedContext = await saveContext(user_id, character_id, context);

    res.json({
      success: true,
      context: savedContext
    });

  } catch (error) {
    console.error('❌ Error in /context/save:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/chat/companion/context/reset
 * Reset context for a companion (Start New Chat)
 */
router.post('/reset', requireAuth, async (req, res) => {
  try {
    const { character_id } = req.body;
    const user_id = req.userId || req.user?.id;

    if (!user_id || !character_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id and character_id are required'
      });
    }

    console.log(`🔄 Resetting context: user=${user_id}, character=${character_id}`);

    await resetContext(user_id, character_id);

    res.json({
      success: true,
      message: 'Context reset successfully'
    });

  } catch (error) {
    console.error('❌ Error in /context/reset:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/chat/companion/context/summarize
 * Trigger conversation summarization
 */
router.post('/summarize', requireAuth, async (req, res) => {
  try {
    const { messages, current_context } = req.body;
    const user_id = req.userId || req.user?.id;

    if (!user_id || !messages) {
      return res.status(400).json({
        success: false,
        error: 'user_id and messages are required'
      });
    }

    console.log(`📝 Summarizing conversation for user=${user_id}`);

    const summary = await summarizeConversation(messages, current_context);

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('❌ Error in /context/summarize:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/v1/chat/companion/context/check-summarize
 * Check if conversation should be summarized
 */
router.post('/check-summarize', requireAuth, async (req, res) => {
  try {
    const { message_count, total_chars } = req.body;

    const needsSummary = shouldSummarize(message_count || 0, total_chars || 0);

    res.json({
      success: true,
      should_summarize: needsSummary
    });

  } catch (error) {
    console.error('❌ Error in /context/check-summarize:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

