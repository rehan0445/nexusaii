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
  try {
    // Get confirmed referral count
    const { data: confirmedReferrals, error } = await supabase
      .from('referral_uses')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', userId)
      .eq('status', 'confirmed');

    if (error) throw error;

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
    const unlockedRewards = [];
    for (const tier of newTiers) {
      const reward = await createRewardEntry(userId, tier, count);
      unlockedRewards.push(reward);
    }

    return { unlocked: newTiers, totalCount: count, rewards: unlockedRewards };
  } catch (error) {
    console.error('Error checking tier unlocks:', error);
    throw error;
  }
};

export const createRewardEntry = async (userId, tier, triggerCount) => {
  try {
    const reward = TIER_REWARDS[tier];
    if (!reward) {
      throw new Error(`Invalid tier: ${tier}`);
    }

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
  } catch (error) {
    console.error('Error creating reward entry:', error);
    throw error;
  }
};

export const confirmReferralRewards = async (referralUseId) => {
  try {
    // Get referral use details
    const { data: referralUse, error } = await supabase
      .from('referral_uses')
      .select('referrer_id')
      .eq('id', referralUseId)
      .single();

    if (error || !referralUse) {
      console.error('Error fetching referral use:', error);
      return;
    }

    // Check and unlock tiers
    const { unlocked } = await checkTierUnlocks(referralUse.referrer_id);

    // If new tiers unlocked, they're already in 'pending' status
    // Admin confirmation will move them to 'confirmed' and trigger distribution
    return { unlocked };
  } catch (error) {
    console.error('Error confirming referral rewards:', error);
    throw error;
  }
};

export const distributeRewards = async (rewardId) => {
  try {
    const { data: reward, error: fetchError } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (fetchError || !reward) {
      throw new Error('Reward not found');
    }

    if (reward.status !== 'confirmed') {
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
    const { error: updateError } = await supabase
      .from('referral_rewards')
      .update({
        status: 'paid',
        distributed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', rewardId);

    if (updateError) throw updateError;

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

    return { success: true, reward };
  } catch (error) {
    console.error('Error distributing rewards:', error);
    throw error;
  }
};

// Helper functions for reward distribution
const grantPremiumMembership = async (userId, months) => {
  // TODO: Implement premium membership grant logic
  // This would update user's premium status in your system
  console.log(`[REWARD] Granting ${months} months premium to user ${userId}`);
  // Example: Update user_profile or create subscription record
};

const grantUltraPremiumAccess = async (userId) => {
  // TODO: Implement ultra premium access grant
  console.log(`[REWARD] Granting ultra premium access to user ${userId}`);
  // Example: Update user flags or permissions
};

const queueMerchandiseShipment = async (userId, items) => {
  // TODO: Queue merchandise for shipping
  console.log(`[REWARD] Queuing merchandise shipment for user ${userId}:`, items);
  // Example: Create shipping record or send notification to admin
};

const processCashPayout = async (userId, amount) => {
  // TODO: Process cash payout (integrate with payment system)
  console.log(`[REWARD] Processing cash payout of ${amount} to user ${userId}`);
  // Example: Integrate with Stripe, PayPal, or bank transfer
};

