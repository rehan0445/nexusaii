import express from 'express';
import {
  registerWithGmail,
  loginWithGmail,
  sendPhoneVerification,
  verifyPhoneAndAuth,
  getUserProfile,
  logout
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { signAccessToken, createSession, issueRefreshToken, rotateRefreshToken, revokeSession } from '../utils/tokenService.js';
import { captchaMiddleware } from '../middleware/captcha.js';
import { bruteForcePrecheck, recordAuthFailure, recordAuthSuccess } from '../middleware/bruteforce.js';
import { issueCsrfToken } from '../middleware/csrf.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Per-route rate limits (stricter on auth endpoints)
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

// Schemas
const emailSchema = z.string().trim().email();
const passwordSchema = z.string().min(6).max(128);
const nameSchema = z.string().min(2).max(64);
const phoneSchema = z.string().min(10).max(20);
const codeSchema = z.string().length(6);

// Gmail Authentication Routes
router.post('/register/gmail', authLimiter, bruteForcePrecheck('email'), captchaMiddleware(false), async (req, res, next) => {
  try {
    const { email, password, name } = z.object({ email: emailSchema, password: passwordSchema, name: nameSchema }).parse(req.body);
    req.body = { email, password, name };
    next();
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
}, async (req, res, next) => {
  try {
    await registerWithGmail(req, res);
    if (res.headersSent) recordAuthSuccess(req, req.body?.email);
  } catch (e) {
    recordAuthFailure(req, req.body?.email);
    next(e);
  }
});

router.post('/login/gmail', authLimiter, bruteForcePrecheck('email'), captchaMiddleware(false), async (req, res, next) => {
  try {
    const { email, password } = z.object({ email: emailSchema, password: passwordSchema }).parse(req.body);
    req.body = { email, password };
    next();
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
}, async (req, res, next) => {
  try {
    await loginWithGmail(req, res);
    if (res.headersSent) recordAuthSuccess(req, req.body?.email);
  } catch (e) {
    recordAuthFailure(req, req.body?.email);
    next(e);
  }
});

// Phone Authentication Routes
router.post('/send-verification', authLimiter, bruteForcePrecheck('phone'), captchaMiddleware(false), async (req, res, next) => {
  try {
    const { phone } = z.object({ phone: phoneSchema }).parse(req.body);
    req.body = { phone };
    next();
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
}, async (req, res, next) => {
  try {
    await sendPhoneVerification(req, res);
    if (res.headersSent) recordAuthSuccess(req, req.body?.phone);
  } catch (e) {
    recordAuthFailure(req, req.body?.phone);
    next(e);
  }
});

router.post('/verify-phone', authLimiter, bruteForcePrecheck('phone'), captchaMiddleware(false), async (req, res, next) => {
  try {
    const { phone, code, name } = z.object({ phone: phoneSchema, code: codeSchema, name: nameSchema.optional() }).parse(req.body);
    req.body = { phone, code, name };
    next();
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
}, async (req, res, next) => {
  try {
    await verifyPhoneAndAuth(req, res);
    if (res.headersSent) recordAuthSuccess(req, req.body?.phone);
  } catch (e) {
    recordAuthFailure(req, req.body?.phone);
    next(e);
  }
});

// Protected Routes
router.get('/profile', requireAuth, getUserProfile);
router.post('/logout', requireAuth, logout);

// Cookie-based session endpoints (feature-flagged rollout)
router.post('/session/login', authLimiter, async (req, res) => {
  try {
    const { userId, email } = req.body; // This expects you to validate credentials before calling here (to be wired)
    if (!userId) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const sessionId = await createSession({ userId, userAgent: req.headers['user-agent'], ipAddress: req.ip });
    const accessToken = signAccessToken({ userId, email });
    const { token: refreshToken, expiresAt } = await issueRefreshToken(sessionId);

    const isProd = process.env.NODE_ENV === 'production';
    const accessCookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    };
    const refreshCookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    };
    if (isProd && process.env.COOKIE_DOMAIN) {
      accessCookieOpts.domain = process.env.COOKIE_DOMAIN;
      refreshCookieOpts.domain = process.env.COOKIE_DOMAIN;
    }
    res.cookie('nxa_access', accessToken, accessCookieOpts);
    res.cookie('nxa_refresh', refreshToken, refreshCookieOpts);
    return res.json({ success: true, expiresAt });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Bridge Supabase session -> backend httpOnly cookies
router.post('/session/bridge', authLimiter, async (req, res) => {
  console.log('🔐 Session bridge attempt:', {
    hasAuth: !!req.headers['authorization'],
    userAgent: req.headers['user-agent']?.substring(0, 50),
    ip: req.ip
  });

  try {
    const header = req.headers['authorization'] || '';
    const supabaseJwt = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!supabaseJwt) {
      console.error('❌ Session bridge failed: No Supabase JWT provided');
      return res.status(401).json({
        success: false,
        message: 'Supabase token required',
        error: 'Missing Authorization header with Bearer token'
      });
    }

    console.log('🔍 Validating Supabase JWT...');
    const { data, error } = await supabase.auth.getUser(supabaseJwt);

    if (error) {
      console.error('❌ Session bridge failed: Supabase JWT validation error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid Supabase token',
        error: error.message
      });
    }

    if (!data?.user) {
      console.error('❌ Session bridge failed: No user data in Supabase response');
      return res.status(401).json({
        success: false,
        message: 'Invalid Supabase token',
        error: 'No user data returned from Supabase'
      });
    }

    const user = data.user;
    console.log('✅ Supabase user validated:', { id: user.id, email: user.email });

    // Check if required environment variables are set
    if (!process.env.JWT_SECRET) {
      console.error('❌ Session bridge failed: JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
        error: 'JWT_SECRET not configured'
      });
    }

    // Create backend session
    console.log('💾 Creating backend session...');
    let sessionId;
    try {
      sessionId = await createSession({
        userId: user.id,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });
      console.log('✅ Backend session created:', sessionId);
    } catch (sessionError) {
      console.error('❌ Session bridge failed: Session creation error:', sessionError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to create session',
        error: sessionError.message
      });
    }

    // Generate access token
    console.log('🔑 Generating access token...');
    let accessToken;
    try {
      accessToken = signAccessToken({ userId: user.id, email: user.email });
      console.log('✅ Access token generated');
    } catch (tokenError) {
      console.error('❌ Session bridge failed: Access token generation error:', tokenError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate access token',
        error: tokenError.message
      });
    }

    // Issue refresh token
    console.log('🔄 Issuing refresh token...');
    let refreshTokenResult;
    try {
      refreshTokenResult = await issueRefreshToken(sessionId);
      console.log('✅ Refresh token issued');
    } catch (refreshError) {
      console.error('❌ Session bridge failed: Refresh token issue error:', refreshError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to issue refresh token',
        error: refreshError.message
      });
    }

    // Set cookies
    console.log('🍪 Setting session cookies...');
    const isProd = process.env.NODE_ENV === 'production';
    const accessCookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax', // Changed from 'Strict' to allow cross-site cookies in production
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/'
    };
    const refreshCookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax', // Changed from 'Strict' to allow cross-site cookies in production
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/auth'
    };

    // Only set domain if COOKIE_DOMAIN is explicitly provided (don't default to .nexusai.com)
    if (isProd && process.env.COOKIE_DOMAIN) {
      accessCookieOpts.domain = process.env.COOKIE_DOMAIN;
      refreshCookieOpts.domain = process.env.COOKIE_DOMAIN;
    }

    res.cookie('nxa_access', accessToken, accessCookieOpts);
    res.cookie('nxa_refresh', refreshTokenResult.token, refreshCookieOpts);

    console.log('✅ Session bridge completed successfully for user:', user.id);
    return res.json({
      success: true,
      message: 'Session bridged successfully',
      userId: user.id,
      sessionId
    });

  } catch (e) {
    console.error('❌ Session bridge unexpected error:', e);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? e.message : 'Unexpected error occurred'
    });
  }
});

router.post('/session/refresh', authLimiter, async (req, res) => {
  try {
    const refresh = req.cookies?.nxa_refresh;
    if (!refresh) return res.status(401).json({ success: false, message: 'No refresh token' });
    const { token: newRefresh, expiresAt } = await rotateRefreshToken(refresh);
    const payload = req.user || {}; // optional: decode or store mapping by session
    const accessToken = signAccessToken({ userId: payload.userId, email: payload.email });

    const isProd = process.env.NODE_ENV === 'production';
    const accessCookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    };
    const refreshCookieOpts = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'None' : 'Lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    };
    if (isProd && process.env.COOKIE_DOMAIN) {
      accessCookieOpts.domain = process.env.COOKIE_DOMAIN;
      refreshCookieOpts.domain = process.env.COOKIE_DOMAIN;
    }
    res.cookie('nxa_access', accessToken, accessCookieOpts);
    res.cookie('nxa_refresh', newRefresh, refreshCookieOpts);
    return res.json({ success: true, expiresAt });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

router.post('/session/logout', requireAuth, async (req, res) => {
  try {
    const sessionId = req.body.sessionId;
    if (sessionId) await revokeSession(sessionId);
    const isProd = process.env.NODE_ENV === 'production';
    const clearAccess = { path: '/' };
    const clearRefresh = { path: '/api/auth' };
    if (isProd && process.env.COOKIE_DOMAIN) {
      clearAccess.domain = process.env.COOKIE_DOMAIN;
      clearRefresh.domain = process.env.COOKIE_DOMAIN;
    }
    res.clearCookie('nxa_access', clearAccess);
    res.clearCookie('nxa_refresh', clearRefresh);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// CSRF token issuance (double submit cookie)
router.get('/csrf', (req, res) => {
  const token = issueCsrfToken(res);
  return res.json({ success: true, token });
});

// List active sessions for the authenticated user
router.get('/session', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { data, error } = await (await import('../config/supabase.js')).supabase
      .from('user_sessions')
      .select('id, user_agent, ip_address, created_at, revoked_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Revoke a specific session by id
router.post('/session/revoke', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId required' });
    await revokeSession(sessionId);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get user email hash for GA4 tracking
// This endpoint returns the SHA-256 hashed email for the authenticated user
// Used for Google Analytics User-ID tracking (PII-safe)
router.get('/user-hash', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    // Query user_email_hashes table to get the hash
    const { data, error } = await supabase
      .from('user_email_hashes')
      .select('email_hash')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If hash doesn't exist, compute it on-the-fly
      // This handles edge cases where trigger didn't fire or hasn't completed yet
      console.warn('⚠️ Email hash not found for user, computing on-the-fly:', userId);
      
      try {
        // Get user email from auth.users (requires service role)
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError || !userData?.user?.email) {
          console.error('❌ Failed to get user email:', userError);
          // Return 404 but don't log as critical error - hash will be created by trigger eventually
          return res.status(404).json({ 
            success: false, 
            message: 'User email hash not available yet. Please try again in a moment.' 
          });
        }

        // Compute hash using the same function logic
        const crypto = await import('node:crypto');
        const normalizedEmail = userData.user.email.toLowerCase().trim();
        const emailHash = crypto.createHash('sha256').update(normalizedEmail).digest('hex');

        // Store it for future use (non-blocking - don't fail if this fails)
        try {
          await supabase
            .from('user_email_hashes')
            .upsert({ 
              user_id: userId, 
              email_hash: emailHash,
              updated_at: new Date().toISOString()
            });
        } catch (upsertError) {
          // Log but don't fail - hash computation succeeded
          console.warn('⚠️ Failed to store computed hash (will be created by trigger):', upsertError);
        }

        return res.json({
          success: true,
          emailHash: emailHash
        });
      } catch (computeError) {
        console.error('❌ Error computing email hash on-the-fly:', computeError);
        // Return 404 - hash will be available after trigger completes
        return res.status(404).json({ 
          success: false, 
          message: 'User email hash not available yet. Please try again in a moment.' 
        });
      }
    }

    return res.json({
      success: true,
      emailHash: data.email_hash
    });

  } catch (error) {
    console.error('❌ Error getting user email hash:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
