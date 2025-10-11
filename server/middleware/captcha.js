import fetch from 'node-fetch';

// Verifies CAPTCHA tokens for hCaptcha or reCAPTCHA based on env configuration.
// Configure with:
// - CAPTCHA_PROVIDER=hcaptcha|recaptcha
// - HCAPTCHA_SECRET=... (for hCaptcha)
// - RECAPTCHA_SECRET=... (for reCAPTCHA v2/v3)
// - CAPTCHA_MIN_SCORE=0.5 (for reCAPTCHA v3 optional)
// Clients should send the token in req.body.captchaToken or header 'x-captcha-token'

export function captchaMiddleware(required = false) {
  return async function captchaVerify(req, res, next) {
    try {
      const provider = (process.env.CAPTCHA_PROVIDER || '').toLowerCase();
      const enabled = !!provider && (process.env.CAPTCHA_ENABLED || 'true') !== 'false';
      if (!enabled && !required) return next();

      const token = req.body?.captchaToken || req.headers['x-captcha-token'];
      if (!token) {
        if (required) return res.status(400).json({ success: false, message: 'CAPTCHA token missing' });
        return next();
      }

      if (provider === 'hcaptcha') {
        const secret = process.env.HCAPTCHA_SECRET;
        if (!secret) return res.status(500).json({ success: false, message: 'CAPTCHA misconfigured' });
        const resp = await fetch('https://hcaptcha.com/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ secret, response: token })
        });
        const data = await resp.json();
        if (!data.success) return res.status(400).json({ success: false, message: 'CAPTCHA failed' });
        return next();
      }

      if (provider === 'recaptcha') {
        const secret = process.env.RECAPTCHA_SECRET;
        if (!secret) return res.status(500).json({ success: false, message: 'CAPTCHA misconfigured' });
        const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ secret, response: token })
        });
        const data = await resp.json();
        if (!data.success) return res.status(400).json({ success: false, message: 'CAPTCHA failed' });
        const minScore = Number(process.env.CAPTCHA_MIN_SCORE || '0');
        if (typeof data.score === 'number' && data.score < minScore) {
          return res.status(400).json({ success: false, message: 'CAPTCHA score too low' });
        }
        return next();
      }

      // Unknown provider
      return res.status(500).json({ success: false, message: 'Unknown CAPTCHA provider' });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'CAPTCHA validation error' });
    }
  };
}


