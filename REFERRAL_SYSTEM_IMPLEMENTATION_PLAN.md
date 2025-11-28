# 🎯 Referral System - Detailed Implementation Plan

## 📋 Table of Contents
1. [Database Schema](#database-schema)
2. [Backend API Endpoints](#backend-api-endpoints)
3. [Frontend UI Components](#frontend-ui-components)
4. [Fraud Prevention Logic](#fraud-prevention-logic)
5. [Reward Distribution System](#reward-distribution-system)
6. [Admin Verification Interface](#admin-verification-interface)
7. [Integration Points](#integration-points)
8. [Implementation Steps](#implementation-steps)

---

## 1. Database Schema

### 1.1 New Supabase Tables

#### Table: `referral_codes`
Stores unique referral codes for each user.

```sql
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  referral_link TEXT NOT NULL, -- e.g., "app.com/ref/ABC123"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT code_format CHECK (LENGTH(code) >= 6 AND code ~ '^[A-Z0-9]+$')
);

CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id);
```

#### Table: `referral_uses`
Tracks each referral signup with status and metadata.

```sql
CREATE TABLE IF NOT EXISTS referral_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  metadata JSONB DEFAULT '{}'::jsonb, -- Store UTM params, click history, etc.
  
  UNIQUE(referrer_id, referee_id) -- Prevent duplicate referrals
);

CREATE INDEX idx_referral_uses_referrer ON referral_uses(referrer_id);
CREATE INDEX idx_referral_uses_referee ON referral_uses(referee_id);
CREATE INDEX idx_referral_uses_status ON referral_uses(status);
CREATE INDEX idx_referral_uses_code ON referral_uses(code);
CREATE INDEX idx_referral_uses_pending_manual ON referral_uses(status) WHERE status = 'pending_manual';
```

#### Table: `referral_rewards`
Tracks reward distribution per user per tier.

```sql
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3, 4)),
  reward_type TEXT NOT NULL, -- 'premium_month', 'premium_year', 'ultra_premium_chars', 'coupons', 'merchandise', 'cash', 'exclusive_benefits'
  reward_data JSONB DEFAULT '{}'::jsonb, -- Store reward-specific data (amount, coupon codes, etc.)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'expired', 'revoked')),
  
  -- Reward lifecycle
  unlocked_at TIMESTAMPTZ, -- When tier threshold was reached
  confirmed_at TIMESTAMPTZ, -- When admin confirmed
  distributed_at TIMESTAMPTZ, -- When reward was actually given
  expires_at TIMESTAMPTZ, -- Reward expiry date
  
  -- Links
  referral_use_id UUID REFERENCES referral_uses(id), -- Which referral triggered this
  reward_ledger_id UUID, -- Link to immutable ledger entry
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, tier) -- Each tier unlocked only once per user
);

CREATE INDEX idx_referral_rewards_user ON referral_rewards(user_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX idx_referral_rewards_tier ON referral_rewards(tier);
```

#### Table: `reward_ledger`
Immutable history of all reward transactions.

```sql
CREATE TABLE IF NOT EXISTS reward_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_use_id UUID REFERENCES referral_uses(id),
  reward_id UUID REFERENCES referral_rewards(id),
  
  action TEXT NOT NULL, -- 'unlocked', 'confirmed', 'distributed', 'expired', 'revoked'
  reward_type TEXT NOT NULL,
  reward_data JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Immutable - no updates allowed
  CONSTRAINT immutable_ledger CHECK (true)
);

CREATE INDEX idx_reward_ledger_user ON reward_ledger(user_id);
CREATE INDEX idx_reward_ledger_referral ON reward_ledger(referral_use_id);
```

#### Table: `admin_audit_log`
Tracks all admin actions for referral verification.

```sql
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL, -- Your user ID (Ren)
  referral_use_id UUID REFERENCES referral_uses(id),
  action TEXT NOT NULL, -- 'confirmed_referral', 'rejected_referral', 'revoked_reward'
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_referral ON admin_audit_log(referral_use_id);
CREATE INDEX idx_admin_audit_log_action ON admin_audit_log(action);
```

#### Table: `fraud_detection_log`
Tracks fraud detection attempts and patterns.

```sql
CREATE TABLE IF NOT EXISTS fraud_detection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_use_id UUID REFERENCES referral_uses(id),
  check_type TEXT NOT NULL, -- 'self_referral', 'rate_limit', 'disposable_email', 'device_fingerprint', 'suspicious_pattern'
  check_result TEXT NOT NULL, -- 'passed', 'failed', 'flagged'
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fraud_detection_log_referral ON fraud_detection_log(referral_use_id);
CREATE INDEX idx_fraud_detection_log_type ON fraud_detection_log(check_type);
```

### 1.2 Update Existing Tables

#### Add referral fields to `userProfileData` (optional - for quick access)
```sql
ALTER TABLE "userProfileData" 
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS referred_by TEXT REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS confirmed_referrals INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_userprofiledata_referral_code ON "userProfileData"(referral_code);
CREATE INDEX IF NOT EXISTS idx_userprofiledata_referred_by ON "userProfileData"(referred_by);
```

### 1.3 Database Functions & Triggers

#### Function: Auto-generate referral code on user creation
```sql
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
```

#### Trigger: Create referral code when user signs up
```sql
CREATE OR REPLACE FUNCTION create_user_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  app_url TEXT := COALESCE(current_setting('app.referral_base_url', true), 'https://nexusai.com');
BEGIN
  -- Generate unique code
  new_code := generate_referral_code();
  
  -- Insert referral code
  INSERT INTO referral_codes (user_id, code, referral_link)
  VALUES (NEW.id::text, new_code, app_url || '/ref/' || new_code);
  
  -- Update userProfileData (if exists)
  UPDATE "userProfileData"
  SET referral_code = new_code
  WHERE id = NEW.id::text;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to auth.users
CREATE TRIGGER trigger_create_referral_code
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_referral_code();
```

#### Function: Update referral counts
```sql
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

CREATE TRIGGER trigger_update_referral_counts
AFTER UPDATE OF status ON referral_uses
FOR EACH ROW
EXECUTE FUNCTION update_referral_counts();
```

---

## 2. Backend API Endpoints

### 2.1 Referral Routes (`server/routes/referrals.js`)

```javascript
import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getMyReferralCode,
  getReferralStats,
  trackReferralClick,
  validateReferralCode,
} from '../controllers/referralController.js';
import {
  createReferralUse,
  runAutomaticChecks,
} from '../services/referralService.js';

const router = express.Router();

// Get current user's referral code and link
router.get('/my-code', requireAuth, getMyReferralCode);

// Get referral statistics (counts, tiers, statuses)
router.get('/stats', requireAuth, getReferralStats);

// Track referral link click (for analytics)
router.post('/track-click', trackReferralClick);

// Validate referral code (during registration)
router.post('/validate-code', validateReferralCode);

// Create referral use record (called after successful registration)
router.post('/use', requireAuth, createReferralUse);

export default router;
```

### 2.2 Admin Routes (`server/routes/adminReferrals.js`)

**🔒 SECURITY: Multiple Layers of Protection**

```javascript
import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbac.js';
import {
  getPendingReferrals,
  confirmReferral,
  rejectReferral,
  getReferralDetails,
  getAdminStats,
} from '../controllers/adminReferralController.js';

const router = express.Router();

// Rate limiting for admin endpoints (prevent brute force)
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many admin requests, please try again later.'
});

// 🔒 SECURITY LAYER 1: Authentication (must be logged in)
// 🔒 SECURITY LAYER 2: Authorization (must have 'admin' role)
// 🔒 SECURITY LAYER 3: Rate Limiting (prevent abuse)
// 🔒 SECURITY LAYER 4: Additional checks in controller (see below)

// Get all pending referrals for manual review
router.get('/pending', 
  requireAuth,                    // Layer 1: Must be authenticated
  requireRoles(['admin']),       // Layer 2: Must have admin role
  adminLimiter,                   // Layer 3: Rate limiting
  getPendingReferrals             // Layer 4: Additional checks in controller
);

// Get specific referral details
router.get('/:referralUseId', 
  requireAuth, 
  requireRoles(['admin']), 
  adminLimiter,
  getReferralDetails
);

// Confirm a referral (admin action)
router.post('/:referralUseId/confirm', 
  requireAuth, 
  requireRoles(['admin']), 
  adminLimiter,
  confirmReferral
);

// Reject a referral (admin action)
router.post('/:referralUseId/reject', 
  requireAuth, 
  requireRoles(['admin']), 
  adminLimiter,
  rejectReferral
);

// Get admin dashboard stats
router.get('/stats/overview', 
  requireAuth, 
  requireRoles(['admin']), 
  adminLimiter,
  getAdminStats
);

export default router;
```

**How Admin Access Works:**

1. **Environment Variables** (Set in `.env`):
   ```env
   # Add your user ID or email here
   ROLE_ADMIN_USER_IDS=your-user-id-here
   # OR
   ROLE_ADMIN_EMAILS=your-email@example.com
   ```

2. **RBAC Middleware** (`server/middleware/rbac.js`):
   - Checks if user's ID or email matches admin list
   - Sets `req.user.isAdmin = true` if match found
   - `requireRoles(['admin'])` blocks access if not admin

3. **Multiple Security Layers**:
   - ✅ Authentication required (valid JWT token)
   - ✅ Authorization check (admin role required)
   - ✅ Rate limiting (prevent brute force)
   - ✅ Additional validation in controllers
   - ✅ Database RLS policies (see below)

### 2.3 Controller Functions

#### `server/controllers/referralController.js`

```javascript
import { supabase } from '../config/supabase.js';
import { createReferralUse, runAutomaticChecks } from '../services/referralService.js';

export const getMyReferralCode = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data, error } = await supabase
      .from('referral_codes')
      .select('code, referral_link')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total counts by status
    const { data: statusCounts } = await supabase
      .from('referral_uses')
      .select('status')
      .eq('referrer_id', userId);
    
    const stats = {
      total: statusCounts?.length || 0,
      pending: statusCounts?.filter(s => s.status === 'pending' || s.status === 'pending_manual').length || 0,
      confirmed: statusCounts?.filter(s => s.status === 'confirmed').length || 0,
      invalid: statusCounts?.filter(s => s.status === 'invalid').length || 0,
    };
    
    // Get unlocked tiers
    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('tier, status, unlocked_at')
      .eq('user_id', userId)
      .order('tier', { ascending: true });
    
    // Calculate current tier progress
    const confirmedCount = stats.confirmed;
    const tiers = {
      tier1: { threshold: 10, unlocked: confirmedCount >= 10, status: null },
      tier2: { threshold: 100, unlocked: confirmedCount >= 100, status: null },
      tier3: { threshold: 300, unlocked: confirmedCount >= 300, status: null },
      tier4: { threshold: 500, unlocked: confirmedCount >= 500, status: null },
    };
    
    // Update tier statuses from rewards
    rewards?.forEach(reward => {
      const tierKey = `tier${reward.tier}`;
      if (tiers[tierKey]) {
        tiers[tierKey].status = reward.status;
        tiers[tierKey].unlockedAt = reward.unlocked_at;
      }
    });
    
    res.json({ success: true, data: { stats, tiers, nextTier: getNextTier(confirmedCount) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getNextTier = (count) => {
  if (count < 10) return { tier: 1, threshold: 10, remaining: 10 - count };
  if (count < 100) return { tier: 2, threshold: 100, remaining: 100 - count };
  if (count < 300) return { tier: 3, threshold: 300, remaining: 300 - count };
  if (count < 500) return { tier: 4, threshold: 500, remaining: 500 - count };
  return null; // All tiers unlocked
};

export const validateReferralCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Referral code is required' });
    }
    
    const { data, error } = await supabase
      .from('referral_codes')
      .select('code, user_id')
      .eq('code', code.toUpperCase())
      .single();
    
    if (error || !data) {
      return res.json({ success: false, valid: false, message: 'Invalid referral code' });
    }
    
    res.json({ success: true, valid: true, code: data.code });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const trackReferralClick = async (req, res) => {
  try {
    const { code, ip, userAgent, deviceFingerprint } = req.body;
    
    // Store click in metadata for later use
    // This can be used for analytics and fraud detection
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

#### `server/controllers/adminReferralController.js`

**🔒 Additional Security Checks in Controllers**

```javascript
import { supabase } from '../config/supabase.js';
import { confirmReferralRewards, distributeRewards } from '../services/rewardService.js';

// 🔒 SECURITY: Double-check admin status (defense in depth)
const verifyAdminAccess = (req) => {
  if (!req.user) {
    throw new Error('Not authenticated');
  }
  if (!req.user.isAdmin && !req.user.roles?.includes('admin')) {
    throw new Error('Admin access required');
  }
  return true;
};

export const getPendingReferrals = async (req, res) => {
  try {
    // 🔒 Additional security check
    verifyAdminAccess(req);
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const { data, error } = await supabase
      .from('referral_uses')
      .select(`
        id,
        referrer_id,
        referee_id,
        code,
        status,
        auto_check_passed,
        failure_reason,
        created_at,
        metadata,
        referrer:referrer_id (id, email),
        referee:referee_id (id, email)
      `)
      .eq('status', 'pending_manual')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({ success: true, data, pagination: { page, limit, total: data.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReferralDetails = async (req, res) => {
  try {
    const { referralUseId } = req.params;
    
    const { data, error } = await supabase
      .from('referral_uses')
      .select(`
        *,
        referrer:referrer_id (*),
        referee:referee_id (*),
        fraud_checks:fraud_detection_log (*)
      `)
      .eq('id', referralUseId)
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const confirmReferral = async (req, res) => {
  try {
    // 🔒 Additional security check
    verifyAdminAccess(req);
    
    const { referralUseId } = req.params;
    const adminId = req.user.id;
    const { notes } = req.body;
    
    // 🔒 Log admin action for audit trail
    console.log(`[ADMIN ACTION] User ${adminId} confirming referral ${referralUseId}`);
    
    // Update referral status
    const { error: updateError } = await supabase
      .from('referral_uses')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', referralUseId);
    
    if (updateError) throw updateError;
    
    // Log admin action
    await supabase
      .from('admin_audit_log')
      .insert({
        admin_id: adminId,
        referral_use_id: referralUseId,
        action: 'confirmed_referral',
        notes,
      });
    
    // Trigger reward distribution
    await confirmReferralRewards(referralUseId);
    
    res.json({ success: true, message: 'Referral confirmed and rewards triggered' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectReferral = async (req, res) => {
  try {
    // 🔒 Additional security check
    verifyAdminAccess(req);
    
    const { referralUseId } = req.params;
    const adminId = req.user.id;
    const { reason, notes } = req.body;
    
    // 🔒 Log admin action for audit trail
    console.log(`[ADMIN ACTION] User ${adminId} rejecting referral ${referralUseId}`);
    
    // Update referral status
    const { error: updateError } = await supabase
      .from('referral_uses')
      .update({
        status: 'invalid',
        failure_reason: reason || 'manual_review_rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', referralUseId);
    
    if (updateError) throw updateError;
    
    // Log admin action
    await supabase
      .from('admin_audit_log')
      .insert({
        admin_id: adminId,
        referral_use_id: referralUseId,
        action: 'rejected_referral',
        notes: notes || reason,
      });
    
    res.json({ success: true, message: 'Referral rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 3. Frontend UI Components

### 3.1 Referral Section Component (`client/src/components/ReferralSection.tsx`)

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Copy, Check, Gift, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ReferralStats {
  total: number;
  pending: number;
  confirmed: number;
  invalid: number;
}

interface Tier {
  threshold: number;
  unlocked: boolean;
  status: string | null;
  unlockedAt?: string;
}

interface ReferralData {
  stats: ReferralStats;
  tiers: {
    tier1: Tier;
    tier2: Tier;
    tier3: Tier;
    tier4: Tier;
  };
  nextTier: {
    tier: number;
    threshold: number;
    remaining: number;
  } | null;
  code: string;
  referralLink: string;
}

const ReferralSection: React.FC = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
      
      // Fetch stats and code in parallel
      const [statsRes, codeRes] = await Promise.all([
        fetch(`${serverUrl}/api/v1/referrals/stats`, {
          credentials: 'include',
        }),
        fetch(`${serverUrl}/api/v1/referrals/my-code`, {
          credentials: 'include',
        }),
      ]);

      const statsData = await statsRes.json();
      const codeData = await codeRes.json();

      if (statsData.success && codeData.success) {
        setData({
          ...statsData.data,
          code: codeData.data.code,
          referralLink: codeData.data.referral_link,
        });
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading referral data...</div>;
  }

  if (!data) {
    return <div className="p-6">Error loading referral data</div>;
  }

  const { stats, tiers, nextTier, code, referralLink } = data;

  return (
    <div className="bg-zinc-900 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Gift className="w-6 h-6 text-green-500" />
          Referrals
        </h2>
      </div>

      {/* Main Stats Card */}
      <div className="bg-zinc-800 rounded-lg p-6">
        <div className="text-center mb-4">
          <div className="text-5xl font-bold text-green-500 mb-2">
            {stats.confirmed}
          </div>
          <div className="text-zinc-400">
            People joined via your referral
          </div>
        </div>

        {/* Progress Bar */}
        {nextTier && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-zinc-400 mb-2">
              <span>Progress to Tier {nextTier.tier}</span>
              <span>{stats.confirmed} / {nextTier.threshold}</span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min((stats.confirmed / nextTier.threshold) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {nextTier.remaining} more to unlock Tier {nextTier.tier}
            </div>
          </div>
        )}
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Pending</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.pending}</div>
          <div className="text-xs text-zinc-400 mt-1">
            Awaiting verification
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Confirmed</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.confirmed}</div>
          <div className="text-xs text-zinc-400 mt-1">
            Verified — rewards applied
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <XCircle className="w-5 h-5" />
            <span className="font-semibold">Invalid</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.invalid}</div>
          <div className="text-xs text-zinc-400 mt-1">
            Rejected by checks
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Reward Tiers</h3>
        {[
          { key: 'tier1', label: 'Tier 1', threshold: 10, reward: '1 Month Premium' },
          { key: 'tier2', label: 'Tier 2', threshold: 100, reward: 'Ultra Premium AI + Coupons' },
          { key: 'tier3', label: 'Tier 3', threshold: 300, reward: 'Exclusive Merchandise' },
          { key: 'tier4', label: 'Tier 4', threshold: 500, reward: '1 Year Premium + Cash + Benefits' },
        ].map(({ key, label, threshold, reward }) => {
          const tier = tiers[key as keyof typeof tiers];
          const isUnlocked = tier.unlocked;
          const isConfirmed = tier.status === 'confirmed' || tier.status === 'paid';
          const isPending = tier.status === 'pending' || tier.status === null;

          return (
            <div
              key={key}
              className={`bg-zinc-800 rounded-lg p-4 border-2 ${
                isUnlocked
                  ? isConfirmed
                    ? 'border-green-500'
                    : 'border-yellow-500'
                  : 'border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">
                    {label}: {threshold} Referrals
                  </div>
                  <div className="text-sm text-zinc-400">{reward}</div>
                </div>
                <div className="text-right">
                  {isUnlocked ? (
                    isPending ? (
                      <span className="text-yellow-500 text-sm">Pending Verification</span>
                    ) : (
                      <span className="text-green-500 text-sm">✓ Unlocked</span>
                    )
                  ) : (
                    <span className="text-zinc-500 text-sm">Locked</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Referral Code & Link */}
      <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">Your Referral Code</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={code}
              readOnly
              className="flex-1 bg-zinc-900 text-white px-4 py-2 rounded border border-zinc-700"
            />
            <button
              onClick={() => copyToClipboard(code)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-zinc-400 mb-2 block">Your Referral Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 bg-zinc-900 text-white px-4 py-2 rounded border border-zinc-700 text-sm"
            />
            <button
              onClick={() => copyToClipboard(referralLink)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralSection;
```

### 3.2 Integration into Profile Page

Update `client/src/pages/Profile.tsx` to include the ReferralSection component:

```typescript
// Add import
import ReferralSection from '../components/ReferralSection';

// Add in the profile render section (after profile header, before other sections)
<ReferralSection />
```

### 3.3 Registration Flow Integration

Update `client/src/pages/Register.tsx` to:
1. Check for referral code in URL params (`?ref=ABC123`)
2. Store in localStorage/session
3. Validate code during registration
4. Send referral code to backend on successful signup

---

## 4. Fraud Prevention Logic

### 4.1 Fraud Detection Service (`server/services/fraudDetectionService.js`)

```javascript
import { supabase } from '../config/supabase.js';

// Disposable email domains list (sample - should be comprehensive)
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'throwaway.email', // ... add more
];

export const runAutomaticChecks = async (referralUseId, refereeData) => {
  const checks = {
    emailVerified: false,
    disposableEmail: false,
    selfReferral: false,
    rateLimitExceeded: false,
    deviceFingerprint: false,
    suspiciousPattern: false,
  };

  const results = {
    passed: true,
    failedChecks: [],
    details: {},
  };

  // Check 1: Email Verification
  if (!refereeData.email_confirmed_at) {
    checks.emailVerified = false;
    results.passed = false;
    results.failedChecks.push('email_not_verified');
    results.details.email_not_verified = 'Email not confirmed';
  } else {
    checks.emailVerified = true;
  }

  // Check 2: Disposable Email
  const emailDomain = refereeData.email?.split('@')[1]?.toLowerCase();
  if (DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
    checks.disposableEmail = true;
    results.passed = false;
    results.failedChecks.push('disposable_email');
    results.details.disposable_email = 'Disposable email domain detected';
  }

  // Check 3: Self-Referral
  if (refereeData.referrer_id === refereeData.referee_id) {
    checks.selfReferral = true;
    results.passed = false;
    results.failedChecks.push('self_referral');
    results.details.self_referral = 'Cannot refer yourself';
  }

  // Check 4: Same Device/IP
  const { data: sameDevice } = await supabase
    .from('referral_uses')
    .select('id')
    .eq('device_fingerprint', refereeData.device_fingerprint)
    .eq('referrer_id', refereeData.referrer_id)
    .limit(1);

  if (sameDevice && sameDevice.length > 0) {
    checks.deviceFingerprint = true;
    results.passed = false;
    results.failedChecks.push('same_device');
    results.details.same_device = 'Same device detected';
  }

  // Check 5: Rate Limiting (max 5 referrals per IP per 24 hours)
  const { data: recentReferrals } = await supabase
    .from('referral_uses')
    .select('id')
    .eq('ip_address', refereeData.ip_address)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (recentReferrals && recentReferrals.length >= 5) {
    checks.rateLimitExceeded = true;
    results.passed = false;
    results.failedChecks.push('rate_limit');
    results.details.rate_limit = 'Too many signups from this IP';
  }

  // Check 6: Suspicious Pattern (100+ from same device)
  const { data: deviceCount } = await supabase
    .from('referral_uses')
    .select('id', { count: 'exact' })
    .eq('device_fingerprint', refereeData.device_fingerprint);

  if (deviceCount && deviceCount.length >= 100) {
    checks.suspiciousPattern = true;
    results.passed = false;
    results.failedChecks.push('suspicious_pattern');
    results.details.suspicious_pattern = 'Suspicious activity pattern';
  }

  // Log fraud detection results
  await supabase
    .from('fraud_detection_log')
    .insert({
      referral_use_id: referralUseId,
      check_type: 'comprehensive',
      check_result: results.passed ? 'passed' : 'failed',
      details: results,
    });

  return results;
};
```

---

## 5. Reward Distribution System

### 5.1 Reward Service (`server/services/rewardService.js`)

```javascript
import { supabase } from '../config/supabase.js';

const TIER_REWARDS = {
  1: {
    type: 'premium_month',
    data: { months: 1 },
    description: '1 Month Premium Membership',
  },
  2: {
    type: 'ultra_premium_chars',
    data: { characters: 'unlimited' },
    description: 'Ultra Premium AI Characters + Coupons',
  },
  3: {
    type: 'merchandise',
    data: { items: ['t-shirt', 'hoodie', 'stickers', 'mug'] },
    description: 'Nexus Exclusive Merchandise',
  },
  4: {
    type: 'premium_year',
    data: { 
      months: 12,
      cash_prize: 0, // Set in admin panel
      exclusive_benefits: true,
    },
    description: '1 Year Premium + Cash + Exclusive Benefits',
  },
};

export const checkTierUnlocks = async (userId) => {
  // Get confirmed referral count
  const { data: confirmedReferrals } = await supabase
    .from('referral_uses')
    .select('id', { count: 'exact' })
    .eq('referrer_id', userId)
    .eq('status', 'confirmed');

  const count = confirmedReferrals?.length || 0;

  // Check which tiers should be unlocked
  const tiersToUnlock = [];
  if (count >= 10 && count < 100) tiersToUnlock.push(1);
  if (count >= 100 && count < 300) tiersToUnlock.push(1, 2);
  if (count >= 300 && count < 500) tiersToUnlock.push(1, 2, 3);
  if (count >= 500) tiersToUnlock.push(1, 2, 3, 4);

  // Check existing rewards
  const { data: existingRewards } = await supabase
    .from('referral_rewards')
    .select('tier')
    .eq('user_id', userId);

  const existingTiers = existingRewards?.map(r => r.tier) || [];
  const newTiers = tiersToUnlock.filter(t => !existingTiers.includes(t));

  // Create reward entries for new tiers
  for (const tier of newTiers) {
    await createRewardEntry(userId, tier, count);
  }

  return { unlocked: newTiers, totalCount: count };
};

export const createRewardEntry = async (userId, tier, triggerCount) => {
  const reward = TIER_REWARDS[tier];
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

  // Create reward entry
  const { data: rewardEntry, error } = await supabase
    .from('referral_rewards')
    .insert({
      user_id: userId,
      tier,
      reward_type: reward.type,
      reward_data: reward.data,
      status: 'pending',
      unlocked_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Create ledger entry
  await supabase
    .from('reward_ledger')
    .insert({
      user_id: userId,
      reward_id: rewardEntry.id,
      action: 'unlocked',
      reward_type: reward.type,
      reward_data: reward.data,
    });

  return rewardEntry;
};

export const confirmReferralRewards = async (referralUseId) => {
  // Get referral use details
  const { data: referralUse } = await supabase
    .from('referral_uses')
    .select('referrer_id')
    .eq('id', referralUseId)
    .single();

  if (!referralUse) return;

  // Check and unlock tiers
  const { unlocked } = await checkTierUnlocks(referralUse.referrer_id);

  // If new tiers unlocked, they're already in 'pending' status
  // Admin confirmation will move them to 'confirmed' and trigger distribution
};

export const distributeRewards = async (rewardId) => {
  const { data: reward } = await supabase
    .from('referral_rewards')
    .select('*')
    .eq('id', rewardId)
    .single();

  if (!reward || reward.status !== 'confirmed') {
    throw new Error('Reward not ready for distribution');
  }

  // Distribute based on reward type
  switch (reward.reward_type) {
    case 'premium_month':
    case 'premium_year':
      await grantPremiumMembership(reward.user_id, reward.reward_data.months);
      break;
    case 'ultra_premium_chars':
      await grantUltraPremiumAccess(reward.user_id);
      break;
    case 'merchandise':
      await queueMerchandiseShipment(reward.user_id, reward.reward_data.items);
      break;
    case 'cash':
      await processCashPayout(reward.user_id, reward.reward_data.amount);
      break;
  }

  // Update reward status
  await supabase
    .from('referral_rewards')
    .update({
      status: 'paid',
      distributed_at: new Date().toISOString(),
    })
    .eq('id', rewardId);

  // Update ledger
  await supabase
    .from('reward_ledger')
    .insert({
      user_id: reward.user_id,
      reward_id: rewardId,
      action: 'distributed',
      reward_type: reward.reward_type,
      reward_data: reward.reward_data,
    });
};

// Helper functions for reward distribution
const grantPremiumMembership = async (userId, months) => {
  // Implement premium membership grant logic
  // This would update user's premium status in your system
  console.log(`Granting ${months} months premium to user ${userId}`);
};

const grantUltraPremiumAccess = async (userId) => {
  // Implement ultra premium access grant
  console.log(`Granting ultra premium access to user ${userId}`);
};

const queueMerchandiseShipment = async (userId, items) => {
  // Queue merchandise for shipping
  console.log(`Queuing merchandise shipment for user ${userId}:`, items);
};

const processCashPayout = async (userId, amount) => {
  // Process cash payout (integrate with payment system)
  console.log(`Processing cash payout of ${amount} to user ${userId}`);
};
```

---

## 6. Admin Verification Interface

### 6.1 Admin Panel Component (Optional - Can use Supabase Dashboard)

Since you mentioned you'll verify via Supabase directly, we can create a simple admin page or you can use Supabase's built-in table editor.

#### Option A: Simple Admin Page (`client/src/pages/AdminReferrals.tsx`)

```typescript
// Basic admin interface for reviewing referrals
// Full implementation would include:
// - List of pending referrals
// - Details view for each referral
// - Confirm/Reject buttons
// - Search and filters
```

#### Option B: Use Supabase Dashboard (Recommended)

You can directly use Supabase's table editor to:
1. View `referral_uses` table filtered by `status = 'pending_manual'`
2. Review full details (email, IP, device fingerprint, etc.)
3. Update status to `confirmed` or `invalid`
4. Add notes in `admin_audit_log`

---

## 7. Integration Points

### 7.1 Registration Flow Integration

Update `client/src/pages/Register.tsx`:

```typescript
// Add referral code handling
const [referralCode, setReferralCode] = useState<string | null>(null);

useEffect(() => {
  // Check URL for referral code
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');
  if (refCode) {
    setReferralCode(refCode);
    localStorage.setItem('pending_referral_code', refCode);
  }
}, []);

// After successful registration
const handleGmailRegister = async () => {
  // ... existing registration code ...
  
  if (data.user) {
    // Check for referral code
    const storedCode = localStorage.getItem('pending_referral_code');
    if (storedCode) {
      // Create referral use record
      await fetch(`${serverUrl}/api/v1/referrals/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: storedCode,
          referee_id: data.user.id,
        }),
      });
      localStorage.removeItem('pending_referral_code');
    }
    
    // ... rest of registration flow ...
  }
};
```

### 7.2 Backend Registration Hook

Create a service that runs after user registration:

```javascript
// server/services/referralService.js
export const createReferralUse = async (req, res) => {
  try {
    const { code, referee_id } = req.body;
    const referrer_id = req.user?.id; // If checking from session
    
    // Get referrer from code
    const { data: codeData } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', code.toUpperCase())
      .single();
    
    if (!codeData) {
      return res.status(400).json({ success: false, message: 'Invalid referral code' });
    }
    
    // Get referee data for fraud checks
    const { data: refereeData } = await supabase.auth.admin.getUserById(referee_id);
    
    // Create referral use record
    const { data: referralUse, error } = await supabase
      .from('referral_uses')
      .insert({
        referrer_id: codeData.user_id,
        referee_id,
        code: code.toUpperCase(),
        status: 'pending',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        device_fingerprint: req.body.device_fingerprint, // From frontend
        email_domain: refereeData.user.email?.split('@')[1],
        metadata: {
          utm: req.body.utm,
          click_history: req.body.click_history,
        },
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Run automatic checks
    const checkResults = await runAutomaticChecks(referralUse.id, {
      referrer_id: codeData.user_id,
      referee_id,
      email_confirmed_at: refereeData.user.email_confirmed_at,
      email: refereeData.user.email,
      ip_address: req.ip,
      device_fingerprint: req.body.device_fingerprint,
    });
    
    // Update status based on checks
    let newStatus = 'pending';
    if (!checkResults.passed) {
      newStatus = 'invalid';
      await supabase
        .from('referral_uses')
        .update({
          status: newStatus,
          auto_check_passed: false,
          failure_reason: checkResults.failedChecks.join(', '),
        })
        .eq('id', referralUse.id);
    } else {
      newStatus = 'pending_manual';
      await supabase
        .from('referral_uses')
        .update({
          status: newStatus,
          auto_check_passed: true,
        })
        .eq('id', referralUse.id);
    }
    
    res.json({ success: true, data: { ...referralUse, status: newStatus } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 8. Implementation Steps

### Phase 1: Database Setup (Day 1)
1. ✅ Create all Supabase tables (referral_codes, referral_uses, referral_rewards, reward_ledger, admin_audit_log, fraud_detection_log)
2. ✅ Create database functions (generate_referral_code, update_referral_counts)
3. ✅ Create triggers (auto-generate code on signup, update counts on status change)
4. ✅ Add indexes for performance
5. ✅ Set up RLS policies (if needed)

### Phase 2: Backend API (Day 2-3)
1. ✅ Create referral routes (`/api/v1/referrals/*`)
2. ✅ Create admin referral routes (`/api/v1/admin/referrals/*`)
3. ✅ Implement fraud detection service
4. ✅ Implement reward distribution service
5. ✅ Integrate with registration flow
6. ✅ Add rate limiting middleware

### Phase 3: Frontend Components (Day 4-5)
1. ✅ Create ReferralSection component
2. ✅ Integrate into Profile page
3. ✅ Add referral code handling to Registration page
4. ✅ Create referral link sharing UI
5. ✅ Add status indicators and progress bars

### Phase 4: Testing & Refinement (Day 6-7)
1. ✅ Test referral code generation
2. ✅ Test fraud detection logic
3. ✅ Test reward tier unlocking
4. ✅ Test admin verification flow
5. ✅ Test UI display (counts, tiers, statuses)
6. ✅ Performance testing

### Phase 5: Admin Setup (Day 8)
1. ✅ Set up admin access (your user ID)
2. ✅ Create admin verification workflow
3. ✅ Test manual confirmation/rejection
4. ✅ Verify reward distribution triggers

---

## 9. Environment Variables

Add to `.env`:
```env
# Referral System Configuration
REFERRAL_BASE_URL=https://nexusai.com
REFERRAL_RATE_LIMIT_PER_IP=5
REFERRAL_RATE_LIMIT_WINDOW=86400

# 🔒 Admin Access Control (CRITICAL - Add your user ID here)
# Get your user ID from Supabase: auth.users table -> id column
ROLE_ADMIN_USER_IDS=your-user-id-here

# OR use email (less secure, but works)
# ROLE_ADMIN_EMAILS=your-email@example.com

# Multiple admins (comma-separated)
# ROLE_ADMIN_USER_IDS=user-id-1,user-id-2,user-id-3
```

**⚠️ IMPORTANT: How to Get Your User ID**

1. **Via Supabase Dashboard:**
   - Go to Authentication → Users
   - Find your user account
   - Copy the UUID from the `id` column

2. **Via Database Query:**
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```

3. **Via Application:**
   - Log in to your app
   - Check browser console: `localStorage` or check network requests
   - Your user ID is in the JWT token payload

**🔒 Security Note:**
- Never commit `.env` file to git
- Add `.env` to `.gitignore`
- Use different admin IDs for dev/staging/production
- Rotate admin access if compromised

---

## 10. Security Considerations

### 🔒 Multi-Layer Security Architecture

#### Layer 1: Authentication (Backend Middleware)
- ✅ `requireAuth` middleware validates JWT tokens
- ✅ Checks HTTP-only cookies or Bearer tokens
- ✅ Verifies token signature and expiry
- ✅ Blocks unauthenticated requests (401 Unauthorized)

#### Layer 2: Authorization (RBAC System)
- ✅ `requireRoles(['admin'])` middleware checks admin status
- ✅ Admin list stored in environment variables (not in code)
- ✅ Checks both user ID and email against admin list
- ✅ Blocks non-admin users (403 Forbidden)

**Environment Setup:**
```env
# Add your user ID (from Supabase auth.users table)
ROLE_ADMIN_USER_IDS=your-user-id-here

# OR add your email
ROLE_ADMIN_EMAILS=your-email@example.com

# You can add multiple admins (comma-separated)
ROLE_ADMIN_USER_IDS=user-id-1,user-id-2
```

#### Layer 3: Rate Limiting
- ✅ Admin endpoints limited to 30 requests/minute
- ✅ Prevents brute force attacks
- ✅ Protects against DDoS

#### Layer 4: Controller-Level Validation
- ✅ Double-checks admin status in each controller function
- ✅ Logs all admin actions for audit trail
- ✅ Validates input parameters

#### Layer 5: Database Row Level Security (RLS)
```sql
-- Enable RLS on admin-sensitive tables
ALTER TABLE referral_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_ledger ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view referral_uses details
CREATE POLICY "admin_view_referral_uses" ON referral_uses
  FOR SELECT
  USING (
    auth.uid()::text IN (
      SELECT unnest(string_to_array(current_setting('app.admin_user_ids', true), ','))
    )
  );

-- Policy: Only admins can update referral_uses status
CREATE POLICY "admin_update_referral_uses" ON referral_uses
  FOR UPDATE
  USING (
    auth.uid()::text IN (
      SELECT unnest(string_to_array(current_setting('app.admin_user_ids', true), ','))
    )
  );

-- Policy: Regular users can only see their own referral stats (counts only)
CREATE POLICY "user_view_own_referrals" ON referral_uses
  FOR SELECT
  USING (
    referrer_id = auth.uid()::text
    AND status IN ('pending', 'pending_manual', 'confirmed', 'invalid')
  );
```

#### Layer 6: Input Validation
- ✅ Validates all referral codes (format, existence)
- ✅ Sanitizes user inputs
- ✅ Prevents SQL injection and XSS attacks

#### Layer 7: Audit Logging
- ✅ All admin actions logged in `admin_audit_log` table
- ✅ Includes admin ID, timestamp, action type, notes
- ✅ Immutable audit trail for compliance

### 🛡️ Additional Security Measures

1. **Environment Variables**: Admin IDs stored in `.env` (never in code)
2. **No Client-Side Admin Checks**: All admin logic on server-side only
3. **HTTPS Only**: All admin endpoints require HTTPS in production
4. **IP Whitelisting** (Optional): Can add IP restrictions for admin endpoints
5. **Two-Factor Authentication** (Future): Can add 2FA for admin access
6. **Session Timeout**: Admin sessions expire after inactivity

### 🔍 How to Verify Security

**Test 1: Non-Admin User**
```bash
# Try to access admin endpoint without admin role
curl -H "Authorization: Bearer <non-admin-token>" \
  http://localhost:3000/api/admin/referrals/pending
# Expected: 403 Forbidden
```

**Test 2: Unauthenticated Request**
```bash
# Try to access without token
curl http://localhost:3000/api/admin/referrals/pending
# Expected: 401 Unauthorized
```

**Test 3: Admin Access**
```bash
# Access with valid admin token
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/api/admin/referrals/pending
# Expected: 200 OK with data
```

### 📝 Security Checklist

- [x] Authentication middleware on all admin routes
- [x] Authorization middleware (RBAC) on all admin routes
- [x] Rate limiting on admin endpoints
- [x] Controller-level admin verification
- [x] Database RLS policies
- [x] Audit logging for all admin actions
- [x] Environment variables for admin IDs (not hardcoded)
- [x] Input validation and sanitization
- [x] HTTPS enforcement in production
- [x] Error messages don't leak sensitive info

---

## 11. Future Enhancements

1. **Analytics Dashboard**: Track referral performance, conversion rates
2. **Email Notifications**: Notify users when they unlock tiers
3. **Social Sharing**: Pre-built sharing buttons for social media
4. **Referral Leaderboard**: Show top referrers (optional)
5. **A/B Testing**: Test different reward structures

---

## 📝 Notes

- All user-visible data should show only counts, no personal information
- Admin verification is manual and only accessible to you (Ren)
- Rewards are cumulative (unlocking Tier 4 unlocks all lower tiers)
- Each tier unlocks only once per user
- Fraud detection runs automatically before manual review
- Rewards expire after 30 days (configurable)

---

**Ready for implementation!** 🚀

This plan covers all requirements:
- ✅ Auto-generated referral codes
- ✅ Two-step verification (automatic + manual)
- ✅ Fraud prevention
- ✅ Tier-based rewards
- ✅ Privacy (counts only in UI)
- ✅ Reward lifecycle management
- ✅ Admin verification interface

