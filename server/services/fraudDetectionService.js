import { supabase } from '../config/supabase.js';

// Disposable email domains list (sample - should be comprehensive)
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'throwaway.email', 'temp-mail.org',
  'getnada.com', 'maildrop.cc', 'mohmal.com', 'fakeinbox.com',
  'yopmail.com', 'sharklasers.com', 'grr.la', 'guerrillamailblock.com',
  'pokemail.net', 'spam4.me', 'bccto.me', 'chammy.info',
  'dispostable.com', 'emailondeck.com', 'fakemailgenerator.com',
  'getairmail.com', 'mailcatch.com', 'mintemail.com', 'mytrashmail.com',
  'tempail.com', 'trashmail.com', 'trashmailer.com', 'tempinbox.co.uk',
  'tempmailaddress.com', 'throwawaymail.com', 'tmpmail.org',
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

  try {
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
    if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
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
    if (refereeData.device_fingerprint) {
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
    }

    // Check 5: Rate Limiting (max 5 referrals per IP per 24 hours)
    if (refereeData.ip_address) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentReferrals } = await supabase
        .from('referral_uses')
        .select('id')
        .eq('ip_address', refereeData.ip_address)
        .gte('created_at', oneDayAgo);

      const rateLimit = parseInt(process.env.REFERRAL_RATE_LIMIT_PER_IP || '5', 10);
      if (recentReferrals && recentReferrals.length >= rateLimit) {
        checks.rateLimitExceeded = true;
        results.passed = false;
        results.failedChecks.push('rate_limit');
        results.details.rate_limit = `Too many signups from this IP (max ${rateLimit} per 24h)`;
      }
    }

    // Check 6: Suspicious Pattern (100+ from same device)
    if (refereeData.device_fingerprint) {
      const { count } = await supabase
        .from('referral_uses')
        .select('*', { count: 'exact', head: true })
        .eq('device_fingerprint', refereeData.device_fingerprint);

      if (count && count >= 100) {
        checks.suspiciousPattern = true;
        results.passed = false;
        results.failedChecks.push('suspicious_pattern');
        results.details.suspicious_pattern = 'Suspicious activity pattern detected';
      }
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
  } catch (error) {
    console.error('Error in fraud detection:', error);
    // On error, fail safe - mark as failed
    results.passed = false;
    results.failedChecks.push('system_error');
    results.details.system_error = 'System error during fraud detection';
    return results;
  }
};

