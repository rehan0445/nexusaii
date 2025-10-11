# Secret Rotation Runbook

## Scope
JWT secret, Supabase keys, OAuth credentials, Sentry DSN, Cloudflare API tokens.

## Prereqs
- All secrets stored in secret manager (e.g., Cloudflare/Netlify/Hostinger or GitHub Actions secrets)
- Admin access to deployment providers

## Steps
1. Prepare
   - List secrets to rotate and their consumers
   - Create new values; store in secret manager
   - Schedule maintenance window if needed
2. Update CI/CD
   - Replace secrets in GitHub, Netlify, Hostinger, Cloudflare
   - Commit no code changes containing secrets
3. Backend rollout
   - Set new secrets as primary env vars
   - Restart server with zero-downtime
4. Token/session handling
   - Invalidate old refresh tokens: set revoked_at now
   - Broadcast forced re-auth if necessary
5. Validation
   - Check health, login, refresh, protected routes
   - Monitor error rates and logs
6. Post-rotation
   - Remove old secrets from all locations
   - Update inventory and set calendar reminder for next rotation

## SQL Snippet (refresh revoke)
```sql
update refresh_tokens set revoked_at = now() where revoked_at is null;
```
