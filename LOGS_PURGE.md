# Logs Purge and Credential Rotation

## Purge Sensitive Logs
- Search and remove any archived logs containing tokens, emails, phone numbers
- Rotate log storage keys and access tokens
- Ensure production logs exclude PII by default (redaction enabled)

## Rotate Credentials (Quick)
1. Set new values in secret manager (see SECRETS.md)
2. Deploy with new envs
3. Revoke sessions:
   - SQL: `server/scripts/revoke_all_refresh_tokens.sql`
   - Node: `node server/scripts/revoke_sessions.js`
4. Validate login and protected routes

## Ongoing Hygiene
- Set log retention period (e.g., 7–14 days)
- Enforce least privilege on log access
- Audit access to logs monthly
