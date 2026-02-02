import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
const JWT_SECRET = process.env.JWT_SECRET;

const requireAuth = async (req, res, next) => {
  try {
    // Dev header auth fallback (for local dev/proxy without cookies)
    const devHeaderUserId = req.headers['x-user-id'] || req.query?.userId;
    if ((process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_HEADER_AUTH === 'true') && devHeaderUserId) {
      req.user = { id: String(devHeaderUserId), provider: 'header' };
      req.userId = String(devHeaderUserId);
      return next();
    }

    // Get token from header or httpOnly cookie
    const header = req.headers['authorization'] || '';
    let token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token && req.cookies && req.cookies.nxa_access) {
      token = req.cookies.nxa_access;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    // First, try to verify our own JWT
    if (JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        req.userId = decoded.userId || decoded.id;
        return next();
      } catch (e) {
        // fallthrough to Supabase verification
      }
    }

    // Fallback: accept Supabase JWTs (validate via Admin API)
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
      const sbUser = data.user;
      req.user = { id: sbUser.id, email: sbUser.email, provider: 'supabase' };
      req.userId = sbUser.id;
      return next();
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Optional auth: sets req.userId from token if present, or from x-user-id if it starts with "guest_"
 * (allows guest sessions for companion chat and confessions).
 */
const optionalAuth = async (req, res, next) => {
  try {
    const guestHeader = req.headers['x-user-id'];
    if (guestHeader && String(guestHeader).startsWith('guest_')) {
      req.userId = String(guestHeader);
      req.isGuest = true;
      req.user = { id: req.userId, provider: 'guest' };
      return next();
    }
    return requireAuth(req, res, next);
  } catch (e) {
    next(e);
  }
};

const rateLimitSimple = (limit = 30, windowMs = 60_000) => {
  const hits = new Map();
  return (req, res, next) => {
    const key = (req.ip || 'ip') + ':' + (req.headers['x-forwarded-for'] || '');
    const now = Date.now();
    const bucket = hits.get(key) || [];
    // remove old hits
    const recent = bucket.filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      return res.status(429).json({ success: false, message: 'Too many requests' });
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
};

const sanitizeInput = (fields = []) => (req, res, next) => {
  try {
    fields.forEach((f) => {
      if (typeof req.body?.[f] === 'string') {
        req.body[f] = req.body[f]
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/on\w+="[^"]*"/gi, '');
        // Note: Removed .trim() to preserve formatting including spaces and line breaks
      }
    });
    next();
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Bad input' });
  }
};

export {
  requireAuth,
  optionalAuth,
  rateLimitSimple,
  sanitizeInput
};
