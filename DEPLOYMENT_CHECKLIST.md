# Deployment Handoff Checklist

## 1) Secrets & Environment
- Configure provider env (Cloudflare/Netlify/Hostinger) and GitHub Actions secrets:
  - JWT_SECRET
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY (server-only)
  - SENTRY_DSN (optional)
  - CORS_ALLOWLIST (comma-separated exact origins)
  - COOKIE_DOMAIN (e.g., .nexusai.com)
  - CAPTCHA_PROVIDER + HCAPTCHA_SECRET or RECAPTCHA_SECRET
  - ROLE_ADMIN_EMAILS / ROLE_ADMIN_USER_IDS (optional)
  - CSRF_ENABLED=true (production)
- Verify `.env.example` matches required keys (no real values committed)

## 2) CI/CD Security Gates (GitHub)
- Ensure workflows enabled:
  - CodeQL (`.github/workflows/codeql.yml`)
  - Gitleaks (`.github/workflows/gitleaks.yml`)
  - ZAP Baseline (`.github/workflows/zap-baseline.yml`) with `ZAP_TARGET_URL` secret
- Protect branches (see `BRANCH_PROTECTION.md`): required checks + signed commits

## 3) Edge & Network
- Cloudflare WAF: apply OWASP rules, bot protection, rate limits (script and guidance present)
- TLS: use Nginx reverse proxy template (`server/scripts/nginx.conf`) for TLS hardening & DoS limits
- Set HSTS at the edge (include subdomains if applicable)

## 4) Backend Runtime (Express)
- Confirm environment flags in production:
  - CSRF_ENABLED=true
  - CORS_ALLOWLIST includes only trusted origins
  - RATE_LIMIT_MAX tuned for traffic
- Confirm Sentry DSN if monitoring desired (`server/utils/monitoring.js`)
- Run DB migrations: `npm run migrate` in `server/`

## 5) Database (Supabase)
- Ensure RLS is enabled; service role key used only server-side
- Run migrations through `server/scripts/migrations` (core + announcements, threads, broadcasts)
- Confirm storage buckets exist: `nexus-profile-images`, `nexus-room-images`, `nexus-character-image`, `nexus-lost-found`

## 6) Secrets Rotation & Sessions
- Follow `RUNBOOK_SECRET_ROTATION.md`
- After secret changes, revoke sessions:
  - SQL: `server/scripts/revoke_all_refresh_tokens.sql`
  - Node: `node server/scripts/revoke_sessions.js`

## 7) Frontend (Vite/React)
- CSP in `client/index.html` is strict; keep assets self-hosted
- API calls use `credentials: 'include'` and no localStorage tokens

## 8) File Upload Security
- Signed URLs only; strict MIME/extension whitelist; AV scan enabled
- Public buckets avoided; short-lived signed URLs in use

## 9) Tests & Validation
- E2E security tests: `npm test` in `server/` (Vitest + Supertest)
- Fuzz tests: `server/tests/fuzz.input.test.js`
- Load test (optional): `server/tests/load.artillery.yml` (run via Artillery locally/CI)

## 10) Post-Deployment Checks
- Health endpoint `/` returns 200
- Login, refresh, logout flow works; cookies set with httpOnly + SameSite=Strict
- CSRF: state-changing requests fail without the header; succeed with header
- RBAC: admin routes require admin; non-admins get 403
- Announcements: create/read/like/react/RSVP/threads/broadcasts fully functional
- Uploads: profile/room/character uploads succeed and return signed URLs; malware blocked

## 11) Monitoring & Logging
- Sentry errors visible (if DSN set)
- Logs redact Authorization/PII; retention policy enforced (see `LOGS_PURGE.md`)

## 12) Incident Response
- Follow `SECURITY.md` for reporting
- Ensure on-call/notification path receives alerts from monitoring
