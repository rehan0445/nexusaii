import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbac.js';
import {
  getPendingReferrals,
  confirmReferral,
  rejectReferral,
  getReferralDetails,
  getAdminStats,
} from '../controllers/adminReferralController.js';

const router = express.Router();

// Rate limiting for admin endpoints (prevent brute force)
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many admin requests, please try again later.'
});

// 🔒 SECURITY LAYER 1: Authentication (must be logged in)
// 🔒 SECURITY LAYER 2: Authorization (must have 'admin' role)
// 🔒 SECURITY LAYER 3: Rate Limiting (prevent abuse)
// 🔒 SECURITY LAYER 4: Additional checks in controller

// Get all pending referrals for manual review
router.get('/pending', 
  requireAuth,                    // Layer 1: Must be authenticated
  requireRoles(['admin']),       // Layer 2: Must have admin role
  adminLimiter,                   // Layer 3: Rate limiting
  getPendingReferrals             // Layer 4: Additional checks in controller
);

// Get specific referral details
router.get('/:referralUseId', 
  requireAuth, 
  requireRoles(['admin']), 
  adminLimiter,
  getReferralDetails
);

// Confirm a referral (admin action)
router.post('/:referralUseId/confirm', 
  requireAuth, 
  requireRoles(['admin']), 
  adminLimiter,
  confirmReferral
);

// Reject a referral (admin action)
router.post('/:referralUseId/reject', 
  requireAuth, 
  requireRoles(['admin']), 
  adminLimiter,
  rejectReferral
);

// Get admin dashboard stats
router.get('/stats/overview', 
  requireAuth, 
  requireRoles(['admin']), 
  adminLimiter,
  getAdminStats
);

export default router;

