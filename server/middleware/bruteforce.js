// Simple in-memory brute-force protection with lockout by identifier and IP
// Configuration via env:
// AUTH_MAX_ATTEMPTS=5, AUTH_WINDOW_MS=900000 (15m), AUTH_LOCKOUT_MS=600000 (10m)

const attemptsByKey = new Map();

function keyFor(ip, id) {
  return `${ip || 'ip'}::${(id || '').toLowerCase()}`;
}

function getConfig() {
  return {
    max: Number(process.env.AUTH_MAX_ATTEMPTS || '5'),
    windowMs: Number(process.env.AUTH_WINDOW_MS || String(15 * 60 * 1000)),
    lockoutMs: Number(process.env.AUTH_LOCKOUT_MS || String(10 * 60 * 1000)),
  };
}

export function bruteForcePrecheck(identifierField = 'email') {
  return function precheck(req, res, next) {
    const id = req.body?.[identifierField] || req.body?.phone || req.body?.username;
    const k = keyFor(req.ip, id);
    const now = Date.now();
    const { windowMs } = getConfig();

    const entry = attemptsByKey.get(k) || { attempts: [], lockedUntil: 0 };
    if (entry.lockedUntil && now < entry.lockedUntil) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Try later.' });
    }

    // prune old
    entry.attempts = entry.attempts.filter((t) => now - t < windowMs);
    attemptsByKey.set(k, entry);
    next();
  };
}

export function recordAuthFailure(req, identifier) {
  const id = identifier || req.body?.email || req.body?.phone || req.body?.username;
  const k = keyFor(req.ip, id);
  const now = Date.now();
  const { max, windowMs, lockoutMs } = getConfig();
  const entry = attemptsByKey.get(k) || { attempts: [], lockedUntil: 0 };
  // prune and push
  entry.attempts = entry.attempts.filter((t) => now - t < windowMs);
  entry.attempts.push(now);
  if (entry.attempts.length >= max) {
    entry.lockedUntil = now + lockoutMs;
  }
  attemptsByKey.set(k, entry);
}

export function recordAuthSuccess(req, identifier) {
  const id = identifier || req.body?.email || req.body?.phone || req.body?.username;
  const k = keyFor(req.ip, id);
  // clear record on success
  attemptsByKey.delete(k);
}


