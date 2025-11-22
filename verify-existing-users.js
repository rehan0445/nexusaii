/**
 * Verify Existing Unverified Users
 * 
 * This script updates all existing unverified users in Supabase Auth
 * to give them immediate access to the platform.
 * 
 * Run this after disabling email verification in Supabase dashboard.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  console.error('\nPlease check your server/.env file');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyExistingUsers() {
  console.log('🔍 Finding unverified users...\n');

  try {
    // Get all users using admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error fetching users:', listError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('ℹ️  No users found in the system.');
      return;
    }

    console.log(`📊 Total users in system: ${users.length}`);

    // Filter unverified users
    const unverifiedUsers = users.filter(user => !user.email_confirmed_at);

    if (unverifiedUsers.length === 0) {
      console.log('✅ All users are already verified! No action needed.');
      return;
    }

    console.log(`\n🔧 Found ${unverifiedUsers.length} unverified users:`);
    unverifiedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    console.log('\n⏳ Updating users to verified status...\n');

    let successCount = 0;
    let errorCount = 0;

    // Update each unverified user
    for (const user of unverifiedUsers) {
      try {
        const { data, error } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            email_confirm: true
          }
        );

        if (error) {
          console.error(`   ❌ Failed to verify ${user.email}: ${error.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Verified: ${user.email}`);
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ Error updating ${user.email}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully verified: ${successCount} users`);
    if (errorCount > 0) {
      console.log(`❌ Failed: ${errorCount} users`);
    }
    console.log('='.repeat(60));

    if (successCount > 0) {
      console.log('\n🎉 All existing users can now access the platform!');
      console.log('   They can login with their email and password immediately.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
  }
}

// Run the script
console.log('🚀 Starting user verification process...');
console.log('='.repeat(60) + '\n');

verifyExistingUsers()
  .then(() => {
    console.log('\n✅ Process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Process failed:', error);
    process.exit(1);
  });

