-- MFA secrets per user

CREATE TABLE IF NOT EXISTS user_mfa (
  user_id TEXT PRIMARY KEY,
  secret_base32 TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS user_mfa ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_mfa_select ON user_mfa;
CREATE POLICY user_mfa_select ON user_mfa FOR SELECT USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS user_mfa_all ON user_mfa;
CREATE POLICY user_mfa_all ON user_mfa FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


