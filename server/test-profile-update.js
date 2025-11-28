import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function testProfileUpdate() {
  console.log('🧪 Testing profile image update functionality...\n');
  console.log('='.repeat(60));

  try {
    // Get first user profile to test with
    const { data: profiles, error: fetchError } = await supabase
      .from('userProfileData')
      .select('id, name, username, profileImage, bannerImage')
      .limit(1);

    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No profiles found in table to test with');
      console.log('   Create a profile first before testing updates');
      return;
    }

    const testProfile = profiles[0];
    console.log(`📋 Testing with profile: ${testProfile.username} (ID: ${testProfile.id})\n`);

    // Test updating profileImage
    const testProfileImageUrl = 'https://i.pinimg.com/736x/d9/7b/bb/d97bbb08017ac2309307f0822e63d082.jpg';
    const testBannerImageUrl = 'https://via.placeholder.com/800x200';

    console.log('🔄 Testing profileImage update...');
    const { data: updateData, error: updateError } = await supabase
      .from('userProfileData')
      .update({ 
        profileImage: testProfileImageUrl,
        bannerImage: testBannerImageUrl 
      })
      .eq('id', testProfile.id)
      .select();

    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
      console.error('   Error details:', updateError);
      return;
    }

    if (!updateData || updateData.length === 0) {
      console.error('❌ No data returned from update');
      return;
    }

    console.log('✅ Update successful!');
    console.log('\n📊 Updated record:');
    const updated = updateData[0];
    console.log(`   - ProfileImage: ${updated.profileImage?.substring(0, 60)}...`);
    console.log(`   - BannerImage: ${updated.bannerImage?.substring(0, 60)}...`);

    // Verify the update was persisted
    console.log('\n🔍 Verifying update was persisted...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('userProfileData')
      .select('profileImage, bannerImage')
      .eq('id', testProfile.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      return;
    }

    if (verifyData?.profileImage === testProfileImageUrl && verifyData?.bannerImage === testBannerImageUrl) {
      console.log('✅ Verification passed! Images were successfully stored.\n');
    } else {
      console.log('⚠️  Verification mismatch:');
      console.log(`   Expected profileImage: ${testProfileImageUrl.substring(0, 60)}...`);
      console.log(`   Got: ${verifyData?.profileImage?.substring(0, 60)}...`);
    }

    console.log('='.repeat(60));
    console.log('✅ Profile update test complete!\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err);
  }
}

testProfileUpdate();

