import express from 'express';
import rateLimit from 'express-rate-limit';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbac.js';

const router = express.Router();

const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

// GET /api/admin/audit-logs?cursor=0&limit=50&action=&userId=
router.get('/audit-logs', requireAuth, requireRoles(['admin']), adminLimiter, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const cursor = Math.max(parseInt(req.query.cursor || '0', 10), 0);
    const action = (req.query.action || '').toString();
    const userId = (req.query.userId || '').toString();

    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('ts', { ascending: false })
      .range(cursor, cursor + limit - 1);

    if (action) query = query.eq('action', action);
    if (userId) query = query.eq('user_id', userId);

    const { data, error, count } = await query;
    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }

    const nextCursor = data && data.length === limit ? cursor + limit : null;
    return res.json({ success: true, data, nextCursor });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;


