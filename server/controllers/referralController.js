import { supabase } from '../config/supabase.js';
import { runAutomaticChecks } from '../services/fraudDetectionService.js';

export const getMyReferralCode = async (req, res) => {
  try {
    // Try multiple ways to get user ID
    const userId = req.user?.id || req.user?.userId || req.userId || req.user?.uid;
    
    if (!userId) {
      console.error('❌ No user ID in request. Request details:', {
        hasUser: !!req.user,
        userKeys: req.user ? Object.keys(req.user) : [],
        userId: req.userId,
        headers: {
          authorization: req.headers.authorization ? 'present' : 'missing',
          cookie: req.cookies ? 'present' : 'missing'
        }
      });
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    console.log(`✅ Fetching referral code for user: ${userId} (type: ${typeof userId})`);
    
    // Try querying with the user ID as-is
    let { data, error } = await supabase
      .from('referral_codes')
      .select('code, referral_link')
      .eq('user_id', String(userId))
      .single();
    
    // If not found, try without string conversion (in case it's already a string)
    if (error && (error.code === 'PGRST116' || error.message?.includes('No rows'))) {
      console.log('Trying query without string conversion...');
      const { data: data2, error: error2 } = await supabase
        .from('referral_codes')
        .select('code, referral_link')
        .eq('user_id', userId)
        .single();
      
      if (!error2) {
        data = data2;
        error = null;
      }
    }
    
    console.log('📊 Referral code query result:', { 
      found: !!data, 
      code: data?.code, 
      link: data?.referral_link,
      error: error?.message,
      errorCode: error?.code,
      errorDetails: error
    });
    
    if (error) {
      // If code doesn't exist, try to create one for existing users
      if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found')) {
        console.log(`Referral code not found for user ${userId}, creating one...`);
        
        // Generate and create referral code for existing user
        // User is already authenticated, so we can create the code directly
        try {
          // Generate code
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
            
            if (!existing || existing.length === 0) {
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
          
          console.log(`🔨 Creating referral code for user ${userId}: ${newCode}`);
          
          // Insert referral code
          const { data: newCodeData, error: insertError } = await supabase
            .from('referral_codes')
            .insert({
              user_id: String(userId),
              code: newCode,
              referral_link: referralLink,
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('❌ Error inserting referral code:', insertError);
            // If it's a duplicate key error, try fetching again
            if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
              console.log('Code already exists, fetching...');
              const { data: existingData } = await supabase
                .from('referral_codes')
                .select('code, referral_link')
                .eq('user_id', String(userId))
                .single();
              
              if (existingData) {
                return res.json({ success: true, data: existingData });
              }
            }
            throw insertError;
          }
          
          console.log('✅ Created new referral code:', newCodeData);
          return res.json({ success: true, data: { code: newCode, referral_link: referralLink } });
        } catch (createError) {
          console.error('❌ Error creating referral code:', createError);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to create referral code. Please try again later.',
            error: createError.message 
          });
        }
      }
      console.error('Error fetching referral code:', error);
      throw error;
    }
    
    // Update referral link if it's using old domain
    if (data.referral_link && data.referral_link.includes('nexusai.com')) {
      const updatedLink = data.referral_link.replace('nexusai.com', 'nexuschat.in');
      await supabase
        .from('referral_codes')
        .update({ referral_link: updatedLink })
        .eq('user_id', String(userId));
      data.referral_link = updatedLink;
    }
    
    // Ensure link uses correct domain
    if (!data.referral_link || !data.referral_link.includes('nexuschat.in')) {
      const baseUrl = process.env.REFERRAL_BASE_URL || 'https://nexuschat.in';
      data.referral_link = `${baseUrl}/ref/${data.code}`;
    }
    
    console.log('✅ Returning referral code data:', { code: data.code, link: data.referral_link });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting referral code:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReferralStats = async (req, res) => {
  try {
    // Try multiple ways to get user ID
    const userId = req.user?.id || req.user?.userId || req.userId || req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    // Get total counts by status
    const { data: referralUses, error } = await supabase
      .from('referral_uses')
      .select('status')
      .eq('referrer_id', String(userId));
    
    // If no referrals exist, that's okay - return empty stats
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching referral uses:', error);
      // Don't throw, just use empty array
    }
    
    const referralList = referralUses || [];
    const stats = {
      total: referralList.length,
      pending: referralList.filter(s => s.status === 'pending' || s.status === 'pending_manual').length,
      confirmed: referralList.filter(s => s.status === 'confirmed').length,
      invalid: referralList.filter(s => s.status === 'invalid').length,
    };
    
    // Get unlocked tiers
    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('tier, status, unlocked_at')
      .eq('user_id', String(userId))
      .order('tier', { ascending: true });
    
    // Calculate current tier progress
    const confirmedCount = stats.confirmed;
    const tiers = {
      tier1: { threshold: 10, unlocked: confirmedCount >= 10, status: null },
      tier2: { threshold: 50, unlocked: confirmedCount >= 50, status: null },
      tier3: { threshold: 150, unlocked: confirmedCount >= 150, status: null },
      tier4: { threshold: 300, unlocked: confirmedCount >= 300, status: null },
    };
    
    // Update tier statuses from rewards
    if (rewards) {
      rewards.forEach(reward => {
        const tierKey = `tier${reward.tier}`;
        if (tiers[tierKey]) {
          tiers[tierKey].status = reward.status;
          tiers[tierKey].unlockedAt = reward.unlocked_at;
        }
      });
    }
    
    // Calculate next tier
    const nextTier = getNextTier(confirmedCount);
    
    res.json({ success: true, data: { stats, tiers, nextTier } });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

const getNextTier = (count) => {
  if (count < 10) return { tier: 1, threshold: 10, remaining: 10 - count };
  if (count < 50) return { tier: 2, threshold: 50, remaining: 50 - count };
  if (count < 150) return { tier: 3, threshold: 150, remaining: 150 - count };
  if (count < 300) return { tier: 4, threshold: 300, remaining: 300 - count };
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
    console.error('Error validating referral code:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const trackReferralClick = async (req, res) => {
  try {
    // Store click in metadata for later use
    // This can be used for analytics and fraud detection
    // For now, just acknowledge the click
    
    res.json({ success: true, message: 'Click tracked' });
  } catch (error) {
    console.error('Error tracking referral click:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createReferralUse = async (req, res) => {
  try {
    const { code, referee_id } = req.body;
    
    // Validate referee_id is provided
    if (!referee_id) {
      return res.status(400).json({ success: false, message: 'Referee ID is required' });
    }
    
    // Note: This endpoint can be called right after registration
    // so we don't require authentication, but validate referee_id from request body
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Referral code is required' });
    }
    
    if (!referee_id) {
      return res.status(400).json({ success: false, message: 'Referee ID is required' });
    }
    
    // Get referrer from code
    const { data: codeData, error: codeError } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', code.toUpperCase())
      .single();
    
    if (codeError || !codeData) {
      return res.status(400).json({ success: false, message: 'Invalid referral code' });
    }
    
    const referrerUserId = codeData.user_id;
    
    // Prevent self-referral (referrer cannot be the same as referee)
    if (referrerUserId === referee_id) {
      return res.status(400).json({ success: false, message: 'Cannot refer yourself' });
    }
    
    // Check if referral already exists
    const { data: existing } = await supabase
      .from('referral_uses')
      .select('id')
      .eq('referrer_id', referrerUserId)
      .eq('referee_id', referee_id)
      .single();
    
    if (existing) {
      return res.status(400).json({ success: false, message: 'Referral already exists' });
    }
    
    // Get referee data for fraud checks
    let refereeData;
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(referee_id);
      refereeData = userData?.user;
    } catch (error) {
      console.error('Error fetching referee data:', error);
    }
    
    // Get device fingerprint and IP from request
    const deviceFingerprint = req.body.device_fingerprint || req.headers['x-device-fingerprint'] || null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || null;
    const emailDomain = refereeData?.email?.split('@')[1] || null;
    
    // Create referral use record
    const { data: referralUse, error: insertError } = await supabase
      .from('referral_uses')
      .insert({
        referrer_id: referrerUserId,
        referee_id,
        code: code.toUpperCase(),
        status: 'pending',
        ip_address: ipAddress,
        user_agent: userAgent,
        device_fingerprint: deviceFingerprint,
        email_domain: emailDomain,
        metadata: {
          utm: req.body.utm || {},
          click_history: req.body.click_history || [],
        },
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    
    // Run automatic checks
    const checkResults = await runAutomaticChecks(referralUse.id, {
      referrer_id: referrerUserId,
      referee_id,
      email_confirmed_at: refereeData?.email_confirmed_at || null,
      email: refereeData?.email || null,
      ip_address: ipAddress,
      device_fingerprint: deviceFingerprint,
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', referralUse.id);
    } else {
      newStatus = 'pending_manual';
      await supabase
        .from('referral_uses')
        .update({
          status: newStatus,
          auto_check_passed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', referralUse.id);
    }
    
    res.json({ 
      success: true, 
      data: { ...referralUse, status: newStatus },
      checks: checkResults 
    });
  } catch (error) {
    console.error('Error creating referral use:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

