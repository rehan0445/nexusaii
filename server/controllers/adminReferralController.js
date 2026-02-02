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
    
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
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
        ip_address,
        user_agent,
        device_fingerprint
      `, { count: 'exact' })
      .eq('status', 'pending_manual')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    // Get referrer and referee details (admin only - full data)
    const enrichedData = await Promise.all(
      (data || []).map(async (referral) => {
        try {
          const [referrerData, refereeData] = await Promise.all([
            supabase.auth.admin.getUserById(referral.referrer_id).catch(() => ({ data: { user: null } })),
            supabase.auth.admin.getUserById(referral.referee_id).catch(() => ({ data: { user: null } })),
          ]);
          
          return {
            ...referral,
            referrer: referrerData.data?.user ? {
              id: referrerData.data.user.id,
              email: referrerData.data.user.email,
              name: referrerData.data.user.user_metadata?.name || referrerData.data.user.user_metadata?.full_name,
            } : null,
            referee: refereeData.data?.user ? {
              id: refereeData.data.user.id,
              email: refereeData.data.user.email,
              name: refereeData.data.user.user_metadata?.name || refereeData.data.user.user_metadata?.full_name,
              email_confirmed_at: refereeData.data.user.email_confirmed_at,
            } : null,
          };
        } catch (error) {
          console.error('Error enriching referral data:', error);
          return referral;
        }
      })
    );
    
    res.json({ 
      success: true, 
      data: enrichedData, 
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      } 
    });
  } catch (error) {
    console.error('Error getting pending referrals:', error);
    res.status(error.message === 'Admin access required' ? 403 : 500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getReferralDetails = async (req, res) => {
  try {
    // 🔒 Additional security check
    verifyAdminAccess(req);
    
    const { referralUseId } = req.params;
    
    const { data, error } = await supabase
      .from('referral_uses')
      .select(`
        *,
        fraud_checks:fraud_detection_log (*)
      `)
      .eq('id', referralUseId)
      .single();
    
    if (error) throw error;
    
    // Get full user details (admin only)
    const [referrerData, refereeData] = await Promise.all([
      supabase.auth.admin.getUserById(data.referrer_id).catch(() => ({ data: { user: null } })),
      supabase.auth.admin.getUserById(data.referee_id).catch(() => ({ data: { user: null } })),
    ]);
    
    res.json({ 
      success: true, 
      data: {
        ...data,
        referrer: referrerData.data?.user || null,
        referee: refereeData.data?.user || null,
      }
    });
  } catch (error) {
    console.error('Error getting referral details:', error);
    res.status(error.message === 'Admin access required' ? 403 : 500).json({ 
      success: false, 
      message: error.message 
    });
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
        notes: notes || 'Referral confirmed by admin',
      });
    
    // Trigger reward distribution
    await confirmReferralRewards(referralUseId);
    
    res.json({ success: true, message: 'Referral confirmed and rewards triggered' });
  } catch (error) {
    console.error('Error confirming referral:', error);
    res.status(error.message === 'Admin access required' ? 403 : 500).json({ 
      success: false, 
      message: error.message 
    });
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
        notes: notes || reason || 'Rejected by admin',
      });
    
    res.json({ success: true, message: 'Referral rejected' });
  } catch (error) {
    console.error('Error rejecting referral:', error);
    res.status(error.message === 'Admin access required' ? 403 : 500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    // 🔒 Additional security check
    verifyAdminAccess(req);
    
    // Get overall stats
    const [pendingCount, confirmedCount, invalidCount, totalCount] = await Promise.all([
      supabase.from('referral_uses').select('id', { count: 'exact', head: true }).eq('status', 'pending_manual'),
      supabase.from('referral_uses').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabase.from('referral_uses').select('id', { count: 'exact', head: true }).eq('status', 'invalid'),
      supabase.from('referral_uses').select('id', { count: 'exact', head: true }),
    ]);
    
    res.json({
      success: true,
      data: {
        pending: pendingCount.count || 0,
        confirmed: confirmedCount.count || 0,
        invalid: invalidCount.count || 0,
        total: totalCount.count || 0,
      }
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(error.message === 'Admin access required' ? 403 : 500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

