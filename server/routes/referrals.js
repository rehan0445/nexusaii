import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getMyReferralCode,
  getReferralStats,
  trackReferralClick,
  validateReferralCode,
  createReferralUse,
} from '../controllers/referralController.js';

const router = express.Router();

// Get current user's referral code and link
router.get('/my-code', requireAuth, getMyReferralCode);

// Get referral statistics (counts, tiers, statuses)
router.get('/stats', requireAuth, getReferralStats);

// Track referral link click (for analytics)
router.post('/track-click', trackReferralClick);

// Validate referral code (during registration)
router.post('/validate-code', validateReferralCode);

// Create referral use record (called after successful registration)
// Note: This endpoint is called right after registration, so we validate the user_id in the request body instead
router.post('/use', createReferralUse);

export default router;

