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
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function checkProfileTable() {
  console.log('🔍 Checking userProfileData table structure...\n');
  console.log('='.repeat(60));

  try {
    // Check if table exists by trying to query it
    const { data, error } = await supabase
      .from('userProfileData')
      .select('*')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('❌ Table "userProfileData" does NOT exist\n');
      console.log('📝 You need to create the table first.');
      console.log('   Run SUPABASE_QUICK_SETUP.sql or FIX_MISSING_TABLES.sql in Supabase SQL Editor\n');
      return;
    }

    if (error) {
      console.error('⚠️  Error checking table:', error.message);
      console.error('   Error code:', error.code);
      return;
    }

    console.log('✅ Table "userProfileData" exists\n');

    // Try to get table schema by querying information_schema
    console.log('📋 Checking column structure...\n');

    // Check for profileImage column
    const { data: profileData, error: profileError } = await supabase
      .from('userProfileData')
      .select('profileImage')
      .limit(1);

    if (profileError) {
      console.log('❌ Column "profileImage" does NOT exist');
      console.log('   Error:', profileError.message);
    } else {
      console.log('✅ Column "profileImage" exists (TEXT type)');
    }

    // Check for bannerImage column
    const { data: bannerData, error: bannerError } = await supabase
      .from('userProfileData')
      .select('bannerImage')
      .limit(1);

    if (bannerError) {
      console.log('❌ Column "bannerImage" does NOT exist');
      console.log('   Error:', bannerError.message);
    } else {
      console.log('✅ Column "bannerImage" exists (TEXT type)');
    }

    // Get a sample record to see structure
    console.log('\n📊 Sample data structure:');
    const { data: sampleData, error: sampleError } = await supabase
      .from('userProfileData')
      .select('id, name, username, profileImage, bannerImage')
      .limit(1);

    if (!sampleError && sampleData && sampleData.length > 0) {
      console.log('   Sample record found:');
      const record = sampleData[0];
      console.log(`   - ID: ${record.id}`);
      console.log(`   - Name: ${record.name || 'null'}`);
      console.log(`   - Username: ${record.username || 'null'}`);
      console.log(`   - ProfileImage: ${record.profileImage ? record.profileImage.substring(0, 60) + '...' : 'null'}`);
      console.log(`   - BannerImage: ${record.bannerImage ? record.bannerImage.substring(0, 60) + '...' : 'null'}`);
    } else {
      console.log('   No records found in table (empty table)');
    }

    // Check storage bucket
    console.log('\n📦 Checking Supabase Storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError.message);
    } else {
      const profileBucket = buckets?.find(b => b.name === 'nexus-profile-images');
      if (profileBucket) {
        console.log('✅ Storage bucket "nexus-profile-images" exists');
        console.log(`   - Public: ${profileBucket.public ? 'Yes' : 'No'}`);
        console.log(`   - Created: ${profileBucket.created_at}`);
      } else {
        console.log('❌ Storage bucket "nexus-profile-images" does NOT exist');
        console.log('   You need to create it using setup-supabase.js or manually in Supabase Dashboard');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Profile table check complete!\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err);
  }
}

checkProfileTable();

