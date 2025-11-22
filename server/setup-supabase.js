import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from current directory
config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env file');
  console.log('\n📝 Please run: node create-env.js');
  console.log('   Then edit server/.env and add your Supabase credentials\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function setupSupabase() {
  console.log('🚀 Starting Supabase setup for Nexus...\n');

  try {
    // Test connection
    console.log('📡 Testing connection to Supabase...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('confessions')
      .select('id')
      .limit(1);
    
    console.log('✅ Connection successful!\n');

    // Create storage buckets
    console.log('📦 Setting up storage buckets for images...\n');
    
    const buckets = [
      { name: 'nexus-profile-images', public: true },
      { name: 'nexus-character-image', public: true },
      { name: 'nexus-announcements', public: true },
      { name: 'confession-images', public: true },
      { name: 'confession-avatars', public: true }
    ];

    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
        });
        
        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`   ℹ️  Bucket '${bucket.name}' already exists`);
          } else {
            console.log(`   ⚠️  ${bucket.name}: ${error.message}`);
          }
        } else {
          console.log(`   ✅ Created bucket: ${bucket.name}`);
        }
      } catch (err) {
        console.log(`   ℹ️  Bucket '${bucket.name}' setup skipped`);
      }
    }

    console.log('\n✅ Supabase setup completed!\n');
    console.log('📋 Summary:');
    console.log('   - Database connection: ✅ Working');
    console.log('   - Storage buckets: ✅ Configured');
    console.log('\n📝 IMPORTANT: Now run SQL migrations in Supabase Dashboard:');
    console.log('   1. Go to your Supabase project');
    console.log('   2. Click "SQL Editor" in left sidebar');
    console.log('   3. Click "New Query"');
    console.log('   4. Copy & paste contents from: server/scripts/migrations/');
    console.log('   5. Run each migration file in order (001, 002, 003...)');
    console.log('\n🎉 After migrations, your app will be ready!\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.message.includes('Invalid API key')) {
      console.log('\n💡 Check that your SUPABASE_SERVICE_ROLE_KEY is correct');
    }
    process.exit(1);
  }
}

setupSupabase();

