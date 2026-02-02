# Secrets Management

## Where to store
- GitHub Actions: repository secrets for CI (CodeQL, ZAP)
- Deployment provider (Cloudflare/Netlify/Hostinger): environment variables
- Never commit secrets to the repo; use `.env.example` template only

## Required Secrets
- JWT_SECRET
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (server-only)
- SENTRY_DSN (optional)
- CORS_ALLOWLIST
- COOKIE_DOMAIN
- CAPTCHA_PROVIDER / HCAPTCHA_SECRET or RECAPTCHA_SECRET
- ROLE_ADMIN_EMAILS / ROLE_ADMIN_USER_IDS (optional)

## Rotation
- Use `RUNBOOK_SECRET_ROTATION.md`
- Revoke all sessions: `node server/scripts/revoke_sessions.js` or run `server/scripts/revoke_all_refresh_tokens.sql`
- Redeploy after updating secrets

## Notes
- Do not expose SUPABASE_SERVICE_ROLE_KEY to client
- CSRF should be enabled in production: `CSRF_ENABLED=true`
