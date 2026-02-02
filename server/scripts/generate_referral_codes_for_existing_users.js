/**
 * Script to generate referral codes for existing users who don't have one
 * Run this once to backfill referral codes for all existing users
 */

import 'dotenv/config';
import { supabase } from '../config/supabase.js';

const REFERRAL_BASE_URL = process.env.REFERRAL_BASE_URL || 'https://nexuschat.in';

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function generateCodesForExistingUsers() {
  try {
    console.log('🔄 Starting referral code generation for existing users...');
    
    // Get all users from auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }
    
    console.log(`📊 Found ${users.users.length} users`);
    
    // Get existing referral codes
    const { data: existingCodes, error: codesError } = await supabase
      .from('referral_codes')
      .select('user_id');
    
    if (codesError) {
      throw codesError;
    }
    
    const existingUserIds = new Set(existingCodes?.map(c => c.user_id) || []);
    console.log(`✅ Found ${existingUserIds.size} users with existing codes`);
    
    // Find users without codes
    const usersWithoutCodes = users.users.filter(u => !existingUserIds.has(u.id));
    console.log(`📝 Need to create codes for ${usersWithoutCodes.length} users`);
    
    if (usersWithoutCodes.length === 0) {
      console.log('✅ All users already have referral codes!');
      return;
    }
    
    // Generate codes in batches
    const batchSize = 50;
    let created = 0;
    let failed = 0;
    
    for (let i = 0; i < usersWithoutCodes.length; i += batchSize) {
      const batch = usersWithoutCodes.slice(i, i + batchSize);
      const codesToInsert = [];
      
      for (const user of batch) {
        let code = generateReferralCode();
        let attempts = 0;
        
        // Ensure uniqueness
        while (existingUserIds.has(code) && attempts < 10) {
          code = generateReferralCode();
          attempts++;
        }
        
        if (attempts >= 10) {
          console.error(`⚠️  Could not generate unique code for user ${user.id}`);
          failed++;
          continue;
        }
        
        existingUserIds.add(code);
        codesToInsert.push({
          user_id: user.id,
          code: code,
          referral_link: `${REFERRAL_BASE_URL}/ref/${code}`,
        });
      }
      
      if (codesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('referral_codes')
          .insert(codesToInsert);
        
        if (insertError) {
          console.error('❌ Error inserting codes:', insertError);
          failed += codesToInsert.length;
        } else {
          created += codesToInsert.length;
          console.log(`✅ Created ${codesToInsert.length} codes (${created}/${usersWithoutCodes.length} total)`);
        }
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Created: ${created}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('🎉 Done!');
    
  } catch (error) {
    console.error('❌ Error generating referral codes:', error);
    process.exit(1);
  }
}

// Run the script
generateCodesForExistingUsers();

