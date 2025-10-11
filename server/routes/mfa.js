import express from 'express';
import speakeasy from 'speakeasy';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const limiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

// Use DB table user_mfa for storage

router.post('/setup', requireAuth, limiter, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ success: false });
    const secret = speakeasy.generateSecret({ name: 'NexusAI' });
    await supabase.from('user_mfa').upsert({ user_id: userId, secret_base32: secret.base32, enabled: false });
    return res.json({ success: true, otpauth_url: secret.otpauth_url, base32: secret.base32 });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/verify', requireAuth, limiter, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { token } = req.body || {};
    const { data: rec, error } = await supabase.from('user_mfa').select('*').eq('user_id', userId).maybeSingle();
    if (error) return res.status(500).json({ success: false, message: 'Internal server error' });
    if (!rec || !rec.secret_base32) return res.status(400).json({ success: false, message: 'MFA not initialized' });
    const ok = speakeasy.totp.verify({ secret: rec.secret_base32, encoding: 'base32', token, window: 1 });
    if (!ok) return res.status(400).json({ success: false, message: 'Invalid token' });
    await supabase.from('user_mfa').update({ enabled: true, updated_at: new Date().toISOString() }).eq('user_id', userId);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/check', requireAuth, limiter, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { data: rec } = await supabase.from('user_mfa').select('enabled').eq('user_id', userId).maybeSingle();
    return res.json({ success: true, enabled: !!rec?.enabled });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;


