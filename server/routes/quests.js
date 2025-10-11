// Quest Routes: API endpoints for mini-games and challenges
import express from 'express';
import questService from '../services/questService.js';
import affectionService from '../services/affectionService.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * Generate a new quest for character
 * POST /api/v1/quests/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { userId, characterId, characterName, characterPersonality } = req.body;

    if (!userId || !characterId) {
      return res.status(400).json({
        success: false,
        message: 'userId and characterId are required'
      });
    }

    // Get current affection level
    const affectionStatus = await affectionService.getAffectionStatus(userId, characterId);
    const affectionLevel = affectionStatus?.affection_level || 0;

    // Generate quest
    const quest = questService.generateQuest(
      characterName || 'Character',
      characterPersonality,
      affectionLevel
    );

    // Store active quest in database
    const { error } = await supabase
      .from('companion_context')
      .upsert({
        user_id: userId,
        character_id: characterId,
        active_quest: quest,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id,character_id'
      });

    if (error) {
      console.error('Error storing quest:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to store quest',
        error: error.message
      });
    }

    console.log(`🎮 Quest generated: ${quest.type} for ${characterName}`);

    res.json({
      success: true,
      quest
    });
  } catch (error) {
    console.error('Error generating quest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quest',
      error: error.message
    });
  }
});

/**
 * Submit quest answer
 * POST /api/v1/quests/submit
 */
router.post('/submit', async (req, res) => {
  try {
    const { userId, characterId, answer } = req.body;

    if (!userId || !characterId || !answer) {
      return res.status(400).json({
        success: false,
        message: 'userId, characterId, and answer are required'
      });
    }

    // Get active quest
    const { data, error: fetchError } = await supabase
      .from('companion_context')
      .select('active_quest, quest_progress')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .single();

    if (fetchError || !data || !data.active_quest) {
      return res.status(404).json({
        success: false,
        message: 'No active quest found'
      });
    }

    const quest = data.active_quest;

    // Validate answer
    const result = questService.validateAnswer(answer, quest);

    // Update affection based on result
    const affectionUpdate = await affectionService.updateAffection(
      userId,
      characterId,
      result.reward,
      result.success ? 'QUEST_COMPLETE' : 'QUEST_ATTEMPT'
    );

    // Add to quest progress
    const questProgress = data.quest_progress || [];
    questProgress.push({
      id: quest.id,
      type: quest.type,
      status: result.success ? 'completed' : 'attempted',
      reward: result.reward,
      completedAt: new Date().toISOString(),
      answer: answer,
      correctAnswer: quest.solution
    });

    // Clear active quest and update progress
    const { error: updateError } = await supabase
      .from('companion_context')
      .update({
        active_quest: null,
        quest_progress: questProgress,
        last_updated: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('character_id', characterId);

    if (updateError) {
      console.error('Error updating quest progress:', updateError);
    }

    console.log(`🎮 Quest ${result.success ? 'completed' : 'attempted'}: +${result.reward} affection`);

    res.json({
      success: true,
      result: {
        ...result,
        affectionUpdate
      }
    });
  } catch (error) {
    console.error('Error submitting quest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quest answer',
      error: error.message
    });
  }
});

/**
 * Get active quest
 * GET /api/v1/quests/active/:userId/:characterId
 */
router.get('/active/:userId/:characterId', async (req, res) => {
  try {
    const { userId, characterId } = req.params;

    const { data, error } = await supabase
      .from('companion_context')
      .select('active_quest')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching active quest:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch active quest'
      });
    }

    res.json({
      success: true,
      quest: data?.active_quest || null
    });
  } catch (error) {
    console.error('Error getting active quest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active quest',
      error: error.message
    });
  }
});

/**
 * Get quest hint
 * POST /api/v1/quests/hint
 */
router.post('/hint', async (req, res) => {
  try {
    const { userId, characterId, hintIndex = 0 } = req.body;

    // Get active quest
    const { data } = await supabase
      .from('companion_context')
      .select('active_quest')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .single();

    if (!data || !data.active_quest) {
      return res.status(404).json({
        success: false,
        message: 'No active quest found'
      });
    }

    const hint = questService.getHint(data.active_quest, hintIndex);

    res.json({
      success: true,
      hint,
      hasMoreHints: data.active_quest.hints && hintIndex < data.active_quest.hints.length - 1
    });
  } catch (error) {
    console.error('Error getting hint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hint',
      error: error.message
    });
  }
});

/**
 * Get quest history
 * GET /api/v1/quests/history/:userId/:characterId
 */
router.get('/history/:userId/:characterId', async (req, res) => {
  try {
    const { userId, characterId } = req.params;

    const { data } = await supabase
      .from('companion_context')
      .select('quest_progress')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .single();

    res.json({
      success: true,
      history: data?.quest_progress || []
    });
  } catch (error) {
    console.error('Error getting quest history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quest history',
      error: error.message
    });
  }
});

export default router;

