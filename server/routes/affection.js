// Affection Routes: API endpoints for relationship level management
import express from 'express';
import affectionService from '../services/affectionService.js';

const router = express.Router();

/**
 * Get affection status
 * GET /api/v1/affection/status/:userId/:characterId
 */
router.get('/status/:userId/:characterId', async (req, res) => {
  try {
    const { userId, characterId } = req.params;

    const status = await affectionService.getAffectionStatus(userId, characterId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Affection status not found'
      });
    }

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting affection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get affection status',
      error: error.message
    });
  }
});

/**
 * Update affection level
 * POST /api/v1/affection/update
 */
router.post('/update', async (req, res) => {
  try {
    const { userId, characterId, points, source = 'MESSAGE' } = req.body;

    if (!userId || !characterId || points === undefined) {
      return res.status(400).json({
        success: false,
        message: 'userId, characterId, and points are required'
      });
    }

    const result = await affectionService.updateAffection(userId, characterId, points, source);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update affection',
        error: result.error
      });
    }

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error updating affection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update affection',
      error: error.message
    });
  }
});

/**
 * Award daily check-in bonus
 * POST /api/v1/affection/daily-bonus
 */
router.post('/daily-bonus', async (req, res) => {
  try {
    const { userId, characterId } = req.body;

    if (!userId || !characterId) {
      return res.status(400).json({
        success: false,
        message: 'userId and characterId are required'
      });
    }

    const result = await affectionService.awardDailyBonus(userId, characterId);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error awarding daily bonus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award daily bonus',
      error: error.message
    });
  }
});

/**
 * Get affection context for AI prompt
 * GET /api/v1/affection/context/:affectionLevel/:visibleLevel
 */
router.get('/context/:affectionLevel/:visibleLevel', async (req, res) => {
  try {
    const { affectionLevel, visibleLevel } = req.params;

    const context = affectionService.getAffectionContext(
      parseInt(affectionLevel),
      parseInt(visibleLevel)
    );

    res.json({
      success: true,
      context
    });
  } catch (error) {
    console.error('Error getting affection context:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get affection context',
      error: error.message
    });
  }
});

/**
 * Update last interaction timestamp
 * POST /api/v1/affection/update-interaction
 */
router.post('/update-interaction', async (req, res) => {
  try {
    const { userId, characterId } = req.body;

    if (!userId || !characterId) {
      return res.status(400).json({
        success: false,
        message: 'userId and characterId are required'
      });
    }

    await affectionService.updateLastInteraction(userId, characterId);

    res.json({
      success: true,
      message: 'Interaction timestamp updated'
    });
  } catch (error) {
    console.error('Error updating interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update interaction',
      error: error.message
    });
  }
});

/**
 * Increment message count
 * POST /api/v1/affection/increment-messages
 */
router.post('/increment-messages', async (req, res) => {
  try {
    const { userId, characterId } = req.body;

    if (!userId || !characterId) {
      return res.status(400).json({
        success: false,
        message: 'userId and characterId are required'
      });
    }

    const newCount = await affectionService.incrementMessageCount(userId, characterId);

    res.json({
      success: true,
      messageCount: newCount
    });
  } catch (error) {
    console.error('Error incrementing messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to increment messages',
      error: error.message
    });
  }
});

export default router;

