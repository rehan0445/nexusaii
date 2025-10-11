import crypto from 'crypto';

export function issueCsrfToken(res) {
  try {
    const token = crypto.randomBytes(32).toString('base64url');
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: false,
      secure: isProd,
      sameSite: 'Strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
    // Only set an explicit domain in production. In development, omit domain so it works on localhost.
    if (isProd) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN || '.nexusai.com';
    }
    res.cookie('nxa_csrf', token, cookieOptions);
    return token;
  } catch {
    return null;
  }
}

export function verifyCsrf(req, res, next) {
  try {
    const enabled = (process.env.CSRF_ENABLED || 'false') === 'true';
    if (!enabled) return next();
    const method = (req.method || 'GET').toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return next();
    const header = req.headers['x-csrf-token'];
    const cookie = req.cookies?.nxa_csrf;
    if (!header || !cookie || header !== cookie) {
      return res.status(403).json({ success: false, message: 'CSRF token invalid' });
    }
    return next();
  } catch {
    return res.status(403).json({ success: false, message: 'CSRF validation failed' });
  }
}


