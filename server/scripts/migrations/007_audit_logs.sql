-- Audit logs table

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  ts TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NULL,
  action TEXT NOT NULL,
  resource TEXT NULL,
  resource_id TEXT NULL,
  ip TEXT NULL,
  user_agent TEXT NULL,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_ts ON audit_logs(ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_read ON audit_logs;
CREATE POLICY audit_logs_read ON audit_logs FOR SELECT USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS audit_logs_write ON audit_logs;
CREATE POLICY audit_logs_write ON audit_logs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


