update refresh_tokens set revoked_at = now() where revoked_at is null;

