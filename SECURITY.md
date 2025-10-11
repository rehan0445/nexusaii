# Security Policy

## Supported Versions
All main branch deployments.

## Reporting a Vulnerability
Email security@nexusai.com with details, affected endpoints, and reproduction steps. We acknowledge within 48 hours.

## Hardening Highlights
- Cookie-based auth (httpOnly, SameSite=Strict), rotating refresh tokens
- Argon2id password hashing, MFA (TOTP)
- Zod validation, global sanitization, strict CORS, Helmet
- Per-route rate limits, brute-force lockout, optional CAPTCHA
- CSRF protection (double-submit cookie) for state-changing requests
- Supabase RLS, least-privilege, signed URLs, AV scan of uploads
- Audit logs for sensitive actions, structured logs with redaction
- SAST (CodeQL), secrets scanning, ZAP baseline in CI
- Cloudflare WAF and Nginx TLS/DoS templates

## Environment Expectations
- CSRF_ENABLED=true (production)
- CORS_ALLOWLIST set to exact origins
- COOKIE_DOMAIN=.nexusai.com
- ROLE_* envs for RBAC

## Secret Rotation
1. Rotate JWT_SECRET, Supabase service key, API tokens
2. Redeploy services with new secrets via secret manager
3. Invalidate old refresh tokens (revoke sessions)
4. Audit logs and monitor for anomalies post-rotation


