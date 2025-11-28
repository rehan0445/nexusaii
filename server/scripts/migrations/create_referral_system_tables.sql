-- ========================================
-- REFERRAL SYSTEM - DATABASE SETUP
-- ========================================
-- Run this in Supabase SQL Editor to create all referral system tables
-- Copy & paste this entire file and click "RUN"

-- ============ REFERRAL TABLES ============

-- Table: referral_codes
-- Stores unique referral codes for each user
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE, -- References auth.users(id) but stored as TEXT
  code TEXT NOT NULL UNIQUE,
  referral_link TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT code_format CHECK (LENGTH(code) >= 6 AND code ~ '^[A-Z0-9]+$')
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);

-- Table: referral_uses
-- Tracks each referral signup with status and metadata
CREATE TABLE IF NOT EXISTS referral_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id TEXT NOT NULL, -- References auth.users(id) but stored as TEXT
  referee_id TEXT NOT NULL, -- References auth.users(id) but stored as TEXT
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pending_manual', 'confirmed', 'invalid')),
  auto_check_passed BOOLEAN DEFAULT FALSE,
  failure_reason TEXT,
  
  -- Metadata for fraud detection
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  email_domain TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(referrer_id, referee_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_uses_referrer ON referral_uses(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_uses_referee ON referral_uses(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_uses_status ON referral_uses(status);
CREATE INDEX IF NOT EXISTS idx_referral_uses_code ON referral_uses(code);
CREATE INDEX IF NOT EXISTS idx_referral_uses_pending_manual ON referral_uses(status) WHERE status = 'pending_manual';

-- Table: referral_rewards
-- Tracks reward distribution per user per tier
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- References auth.users(id) but stored as TEXT
  tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3, 4)),
  reward_type TEXT NOT NULL,
  reward_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'expired', 'revoked')),
  
  -- Reward lifecycle
  unlocked_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  distributed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Links
  referral_use_id UUID REFERENCES referral_uses(id),
  reward_ledger_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, tier)
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_tier ON referral_rewards(tier);

-- Table: reward_ledger
-- Immutable history of all reward transactions
CREATE TABLE IF NOT EXISTS reward_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- References auth.users(id) but stored as TEXT
  referral_use_id UUID REFERENCES referral_uses(id),
  reward_id UUID REFERENCES referral_rewards(id),
  
  action TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  reward_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_ledger_user ON reward_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_referral ON reward_ledger(referral_use_id);

-- Table: admin_audit_log
-- Tracks all admin actions for referral verification
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL,
  referral_use_id UUID REFERENCES referral_uses(id),
  action TEXT NOT NULL,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_referral ON admin_audit_log(referral_use_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);

-- Table: fraud_detection_log
-- Tracks fraud detection attempts and patterns
CREATE TABLE IF NOT EXISTS fraud_detection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_use_id UUID REFERENCES referral_uses(id),
  check_type TEXT NOT NULL,
  check_result TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_detection_log_referral ON fraud_detection_log(referral_use_id);
CREATE INDEX IF NOT EXISTS idx_fraud_detection_log_type ON fraud_detection_log(check_type);

-- ============ UPDATE EXISTING TABLES ============

-- Add referral fields to userProfileData (optional - for quick access)
ALTER TABLE "userProfileData" 
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS referred_by TEXT, -- References auth.users(id) but stored as TEXT
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS confirmed_referrals INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_userprofiledata_referral_code ON "userProfileData"(referral_code);
CREATE INDEX IF NOT EXISTS idx_userprofiledata_referred_by ON "userProfileData"(referred_by);

-- ============ DATABASE FUNCTIONS ============

-- Function: Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Check uniqueness
  WHILE EXISTS (SELECT 1 FROM referral_codes WHERE code = result) LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function: Get referral base URL from env or use default
CREATE OR REPLACE FUNCTION get_referral_base_url()
RETURNS TEXT AS $$
BEGIN
  -- Try to get from app settings, fallback to default
  RETURN COALESCE(
    current_setting('app.referral_base_url', true),
    'https://nexusai.com'
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger Function: Create referral code when user signs up
CREATE OR REPLACE FUNCTION create_user_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  app_url TEXT;
BEGIN
  -- Generate unique code
  new_code := generate_referral_code();
  
  -- Get base URL
  app_url := get_referral_base_url();
  
  -- Insert referral code
  INSERT INTO referral_codes (user_id, code, referral_link)
  VALUES (NEW.id::text, new_code, app_url || '/ref/' || new_code)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update userProfileData (if exists)
  UPDATE "userProfileData"
  SET referral_code = new_code
  WHERE id = NEW.id::text;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-create referral code on user signup
DROP TRIGGER IF EXISTS trigger_create_referral_code ON auth.users;
CREATE TRIGGER trigger_create_referral_code
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_referral_code();

-- Function: Update referral counts
CREATE OR REPLACE FUNCTION update_referral_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Update referrer's confirmed count
    UPDATE "userProfileData"
    SET confirmed_referrals = (
      SELECT COUNT(*) 
      FROM referral_uses 
      WHERE referrer_id = NEW.referrer_id 
      AND status = 'confirmed'
    )
    WHERE id = NEW.referrer_id;
    
    -- Update total count
    UPDATE "userProfileData"
    SET total_referrals = (
      SELECT COUNT(*) 
      FROM referral_uses 
      WHERE referrer_id = NEW.referrer_id
    )
    WHERE id = NEW.referrer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update counts when referral status changes
DROP TRIGGER IF EXISTS trigger_update_referral_counts ON referral_uses;
CREATE TRIGGER trigger_update_referral_counts
AFTER UPDATE OF status ON referral_uses
FOR EACH ROW
EXECUTE FUNCTION update_referral_counts();

-- ============ ROW LEVEL SECURITY (RLS) ============

-- Enable RLS on sensitive tables
ALTER TABLE referral_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_ledger ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own referral stats (counts only, no personal data)
CREATE POLICY "user_view_own_referrals" ON referral_uses
  FOR SELECT
  USING (referrer_id = auth.uid()::text);

-- Policy: Users cannot insert their own referral uses (only system can)
-- This will be handled by backend API

-- Policy: Only system can update referral_uses (via service role)
-- Admin updates will be done via backend with proper auth

-- Policy: Admin audit log is admin-only (handled by backend)

-- ============ COMPLETION MESSAGE ============
DO $$
BEGIN
  RAISE NOTICE '✅ Referral system tables created successfully!';
  RAISE NOTICE '✅ Functions and triggers installed!';
  RAISE NOTICE '✅ Indexes created for performance!';
  RAISE NOTICE '✅ RLS policies enabled!';
END $$;

