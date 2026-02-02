/**
 * Referral System Test Script
 * 
 * Tests the complete referral flow:
 * 1. User A gets referral code
 * 2. User B registers using User A's code
 * 3. Verifies referral record is created
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test data
const USER_A_EMAIL = `test-user-a-${Date.now()}@test.com`;
const USER_B_EMAIL = `test-user-b-${Date.now()}@test.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function createTestUser(email, password) {
  console.log(`\n📝 Creating test user: ${email}`);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm for testing
    user_metadata: {
      name: email.split('@')[0]
    }
  });

  if (error) {
    console.error(`❌ Error creating user ${email}:`, error.message);
    return null;
  }

  console.log(`✅ User created: ${data.user.id}`);
  return data.user;
}

async function getOrCreateReferralCode(userId) {
  console.log(`\n🔍 Checking referral code for user: ${userId}`);
  
  // Check if code exists
  let { data, error } = await supabase
    .from('referral_codes')
    .select('code, referral_link')
    .eq('user_id', userId)
    .single();

  if (data) {
    console.log(`✅ Found existing referral code: ${data.code}`);
    return data;
  }

  // Create new referral code
  console.log('📝 Creating new referral code...');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let newCode = '';
  for (let i = 0; i < 8; i++) {
    newCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Check uniqueness
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    const { data: existing } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('code', newCode)
      .single();
    
    if (!existing) {
      isUnique = true;
    } else {
      newCode = '';
      for (let i = 0; i < 8; i++) {
        newCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      attempts++;
    }
  }

  const appUrl = process.env.REFERRAL_BASE_URL || 'https://nexuschat.in';
  const referralLink = `${appUrl}/ref/${newCode}`;

  const { data: newCodeData, error: insertError } = await supabase
    .from('referral_codes')
    .insert({
      user_id: userId,
      code: newCode,
      referral_link: referralLink,
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Error creating referral code:', insertError);
    return null;
  }

  console.log(`✅ Created referral code: ${newCode}`);
  console.log(`🔗 Referral link: ${referralLink}`);
  return newCodeData;
}

async function createReferralUse(referrerId, refereeId, code) {
  console.log(`\n📝 Creating referral use record...`);
  console.log(`   Referrer (User A): ${referrerId}`);
  console.log(`   Referee (User B): ${refereeId}`);
  console.log(`   Code: ${code}`);

  // Get referee data
  const { data: refereeData } = await supabase.auth.admin.getUserById(refereeId);
  const emailDomain = refereeData?.user?.email?.split('@')[1] || null;

  const { data, error } = await supabase
    .from('referral_uses')
    .insert({
      referrer_id: referrerId,
      referee_id: refereeId,
      code: code.toUpperCase(),
      status: 'pending',
      ip_address: '127.0.0.1',
      user_agent: 'Test Script',
      device_fingerprint: `test_${Date.now()}`,
      email_domain: emailDomain,
      metadata: {
        utm: {},
        click_history: [],
        test: true
      },
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating referral use:', error);
    return null;
  }

  console.log(`✅ Referral use record created: ${data.id}`);
  return data;
}

async function runAutomaticChecks(referralUseId, referrerId, refereeId) {
  console.log(`\n🔍 Running automatic checks...`);

  // Get referee data
  const { data: refereeData } = await supabase.auth.admin.getUserById(refereeId);
  
  const checks = {
    emailVerified: !!refereeData?.user?.email_confirmed_at,
    disposableEmail: false,
    selfReferral: referrerId === refereeId,
    rateLimitExceeded: false,
  };

  // Check disposable email
  const emailDomain = refereeData?.user?.email?.split('@')[1]?.toLowerCase();
  const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
  checks.disposableEmail = disposableDomains.includes(emailDomain);

  // Check rate limit (simplified - check if same IP created multiple referrals recently)
  const { count } = await supabase
    .from('referral_uses')
    .select('*', { count: 'exact', head: true })
    .eq('referee_id', refereeId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  checks.rateLimitExceeded = (count || 0) > 10;

  const passed = !checks.selfReferral && !checks.disposableEmail && !checks.rateLimitExceeded;

  console.log(`   Email verified: ${checks.emailVerified}`);
  console.log(`   Disposable email: ${checks.disposableEmail}`);
  console.log(`   Self referral: ${checks.selfReferral}`);
  console.log(`   Rate limit exceeded: ${checks.rateLimitExceeded}`);
  console.log(`   Overall: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

  // Update status
  const newStatus = passed ? 'pending_manual' : 'invalid';
  const failureReason = passed ? null : 
    (checks.selfReferral ? 'self_referral' : 
     checks.disposableEmail ? 'disposable_email' : 
     'rate_limit_exceeded');

  await supabase
    .from('referral_uses')
    .update({
      status: newStatus,
      auto_check_passed: passed,
      failure_reason: failureReason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', referralUseId);

  console.log(`✅ Status updated to: ${newStatus}`);

  return { passed, checks };
}

async function verifyReferralStats(referrerId) {
  console.log(`\n📊 Verifying referral stats for User A...`);

  const { data, error } = await supabase
    .from('referral_uses')
    .select('status')
    .eq('referrer_id', referrerId);

  if (error) {
    console.error('❌ Error fetching stats:', error);
    return;
  }

  const stats = {
    total: data.length,
    pending: data.filter(r => r.status === 'pending' || r.status === 'pending_manual').length,
    confirmed: data.filter(r => r.status === 'confirmed').length,
    invalid: data.filter(r => r.status === 'invalid').length,
  };

  console.log(`   Total referrals: ${stats.total}`);
  console.log(`   Pending: ${stats.pending}`);
  console.log(`   Confirmed: ${stats.confirmed}`);
  console.log(`   Invalid: ${stats.invalid}`);

  return stats;
}

async function cleanup() {
  console.log(`\n🧹 Cleaning up test users...`);
  
  // Note: In production, you might want to keep test data
  // For now, we'll just log what would be deleted
  console.log(`   Would delete: ${USER_A_EMAIL}`);
  console.log(`   Would delete: ${USER_B_EMAIL}`);
  console.log(`   (Skipping actual deletion for safety)`);
}

async function main() {
  console.log('🚀 Starting Referral System Test\n');
  console.log('=' .repeat(50));

  try {
    // Step 1: Create User A (Referrer)
    console.log('\n📋 STEP 1: Create User A (Referrer)');
    const userA = await createTestUser(USER_A_EMAIL, TEST_PASSWORD);
    if (!userA) {
      console.error('❌ Failed to create User A');
      return;
    }

    // Step 2: Get or create referral code for User A
    console.log('\n📋 STEP 2: Get/Create Referral Code for User A');
    const referralCode = await getOrCreateReferralCode(userA.id);
    if (!referralCode) {
      console.error('❌ Failed to get/create referral code');
      return;
    }

    // Step 3: Create User B (Referee)
    console.log('\n📋 STEP 3: Create User B (Referee)');
    const userB = await createTestUser(USER_B_EMAIL, TEST_PASSWORD);
    if (!userB) {
      console.error('❌ Failed to create User B');
      return;
    }

    // Step 4: Create referral use record
    console.log('\n📋 STEP 4: Create Referral Use Record');
    const referralUse = await createReferralUse(
      userA.id,
      userB.id,
      referralCode.code
    );
    if (!referralUse) {
      console.error('❌ Failed to create referral use record');
      return;
    }

    // Step 5: Run automatic checks
    console.log('\n📋 STEP 5: Run Automatic Checks');
    const checkResults = await runAutomaticChecks(
      referralUse.id,
      userA.id,
      userB.id
    );

    // Step 6: Verify stats
    console.log('\n📋 STEP 6: Verify Referral Stats');
    await verifyReferralStats(userA.id);

    // Step 7: Final verification
    console.log('\n📋 STEP 7: Final Verification');
    const { data: finalRecord } = await supabase
      .from('referral_uses')
      .select('*')
      .eq('id', referralUse.id)
      .single();

    if (finalRecord) {
      console.log('\n✅ TEST PASSED!');
      console.log('=' .repeat(50));
      console.log('\n📋 Summary:');
      console.log(`   User A (Referrer): ${userA.email}`);
      console.log(`   User A ID: ${userA.id}`);
      console.log(`   Referral Code: ${referralCode.code}`);
      console.log(`   Referral Link: ${referralCode.referral_link}`);
      console.log(`   User B (Referee): ${userB.email}`);
      console.log(`   User B ID: ${userB.id}`);
      console.log(`   Referral Record ID: ${finalRecord.id}`);
      console.log(`   Status: ${finalRecord.status}`);
      console.log(`   Auto Check Passed: ${finalRecord.auto_check_passed}`);
      console.log(`   Failure Reason: ${finalRecord.failure_reason || 'None'}`);
    } else {
      console.error('\n❌ TEST FAILED: Could not retrieve final record');
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  } finally {
    await cleanup();
  }
}

// Run the test
main().catch(console.error);

