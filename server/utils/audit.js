import crypto from 'crypto';
import { supabase } from '../config/supabase.js';

export async function audit(req, action, resource, resourceId, metadata = {}) {
  try {
    const id = crypto.randomUUID();
    const payload = {
      id,
      user_id: req.user?.userId || req.user?.id || null,
      action,
      resource: resource || null,
      resource_id: resourceId || null,
      ip: req.ip || null,
      user_agent: req.headers['user-agent'] || null,
      metadata,
    };
    await supabase.from('audit_logs').insert(payload);
  } catch (e) {
    // Avoid throwing from audit
  }
}


