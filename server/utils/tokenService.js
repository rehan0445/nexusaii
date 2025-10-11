import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET;

export function signAccessToken(payload, expiresIn = '15m') {
  if (!JWT_SECRET) throw new Error('Missing JWT_SECRET');
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function generateOpaqueToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession({ userId, userAgent, ipAddress }) {
  try {
    const sessionId = crypto.randomUUID();
    const { error } = await supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        user_agent: userAgent || null,
        ip_address: ipAddress || null,
        created_at: new Date().toISOString(),
        revoked_at: null
      });

    if (error) {
      console.error('❌ Session creation error:', error);
      throw new Error(`Session creation failed: ${error.message}`);
    }

    return sessionId;
  } catch (error) {
    console.error('❌ Unexpected error in createSession:', error);
    throw error;
  }
}

export async function issueRefreshToken(sessionId, ttlDays = 30) {
  try {
    const token = generateOpaqueToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();

    const id = crypto.randomUUID();
    const { error } = await supabase
      .from('refresh_tokens')
      .insert({
        id,
        session_id: sessionId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
        revoked_at: null,
        rotated_at: null
      });

    if (error) {
      console.error('❌ Refresh token creation error:', error);
      throw new Error(`Refresh token creation failed: ${error.message}`);
    }

    return { token, expiresAt };
  } catch (error) {
    console.error('❌ Unexpected error in issueRefreshToken:', error);
    throw error;
  }
}

export async function rotateRefreshToken(oldToken) {
  const tokenHash = hashToken(oldToken);
  const { data, error } = await supabase
    .from('refresh_tokens')
    .select('id, session_id, expires_at, revoked_at, rotated_at')
    .eq('token_hash', tokenHash)
    .single();
  if (error || !data) throw new Error('Invalid refresh token');
  if (data.revoked_at || data.rotated_at) throw new Error('Token already used');
  if (new Date(data.expires_at) < new Date()) throw new Error('Token expired');

  // mark old token rotated
  const { error: updErr } = await supabase
    .from('refresh_tokens')
    .update({ rotated_at: new Date().toISOString() })
    .eq('id', data.id);
  if (updErr) throw new Error(updErr.message);

  // issue new token for same session
  return issueRefreshToken(data.session_id);
}

export async function revokeSession(sessionId) {
  await supabase.from('user_sessions').update({ revoked_at: new Date().toISOString() }).eq('id', sessionId);
  await supabase.from('refresh_tokens').update({ revoked_at: new Date().toISOString() }).eq('session_id', sessionId);
}


