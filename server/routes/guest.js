import express from 'express';
import {
  createGuestSession,
  getGuestSession,
  migrateGuestToUser,
  checkGuestSession
} from '../controllers/guestController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for guest endpoints
const guestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later'
});

// Guest session routes
router.post('/create-session', guestLimiter, createGuestSession);
router.get('/session/:sessionId', guestLimiter, getGuestSession);
router.post('/migrate-to-user', guestLimiter, migrateGuestToUser);
router.get('/check-session/:sessionId', guestLimiter, checkGuestSession);

export default router;

