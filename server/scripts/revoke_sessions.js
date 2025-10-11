import { supabase } from '../config/supabase.js';

async function main() {
  try {
    const now = new Date().toISOString();
    const { error: e1 } = await supabase.from('refresh_tokens').update({ revoked_at: now }).is('revoked_at', null);
    if (e1) throw e1;
    const { error: e2 } = await supabase.from('user_sessions').update({ revoked_at: now }).is('revoked_at', null);
    if (e2) throw e2;
    console.log('All active sessions and refresh tokens revoked at', now);
    process.exit(0);
  } catch (e) {
    console.error('Failed to revoke sessions:', e.message || e);
    process.exit(1);
  }
}

main();


