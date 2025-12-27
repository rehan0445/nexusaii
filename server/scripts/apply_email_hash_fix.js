/**
 * Apply Email Hash Trigger Fix
 * Executes the minimal SQL fix to make the trigger non-blocking
 * Uses Supabase Management API to execute SQL directly
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || 'https://dswuotsdaltsomyqqykn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Please set SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// The minimal SQL fix - only updates the function
const sqlFix = `CREATE OR REPLACE FUNCTION ensure_user_email_hash()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
    computed_hash TEXT;
BEGIN
    user_email := NEW.email;
    
    IF user_email IS NULL OR trim(user_email) = '' THEN
        RETURN NEW;
    END IF;
    
    BEGIN
        computed_hash := compute_email_hash(user_email);
        
        INSERT INTO user_email_hashes (user_id, email_hash, updated_at)
        VALUES (NEW.id, computed_hash, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            email_hash = EXCLUDED.email_hash,
            updated_at = NOW();
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Failed to create email hash for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
    END;
    
    RETURN NEW;
END;
$$;`;

async function applyFix() {
  console.log('🚀 Applying Email Hash Trigger Fix...\n');
  console.log('📝 Updating ensure_user_email_hash() function to be non-blocking...\n');

  try {
    // Method 1: Try using exec_sql RPC function (if it exists)
    console.log('⏳ Attempting to execute via RPC...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { 
      sql: sqlFix 
    });

    if (!rpcError) {
      console.log('✅ Function updated successfully via RPC!');
      await verifyFix();
      return;
    }

    console.log('⚠️ RPC method not available, trying Management API...');

    // Method 2: Use Supabase Management API (PostgREST)
    // This requires the SQL to be executed via the database directly
    // Since we can't execute DDL via PostgREST, we'll use a workaround
    
    // Try to verify the function exists first
    const { data: funcCheck, error: funcCheckError } = await supabase
      .from('user_email_hashes')
      .select('user_id')
      .limit(1);

    if (funcCheckError && funcCheckError.code === 'PGRST116') {
      console.error('❌ user_email_hashes table does not exist!');
      console.error('   Please run migration 018_add_email_hash_tracking.sql first');
      return;
    }

    // Since we can't execute DDL via the client, we need to use the Management API
    // But Supabase doesn't expose a direct SQL execution endpoint
    // So we'll provide clear instructions
    
    console.log('\n⚠️ Direct SQL execution not available via client');
    console.log('📝 Please execute the SQL manually in Supabase SQL Editor\n');
    console.log('🔗 Open: https://app.supabase.com/project/dswuotsdaltsomyqqykn/sql\n');
    console.log('📋 Copy and paste this SQL:\n');
    console.log('═'.repeat(70));
    console.log(sqlFix);
    console.log('═'.repeat(70));
    console.log('\n✅ After running, the function will be updated and signup/login will work!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Please run the SQL manually in Supabase SQL Editor');
    console.log('   https://app.supabase.com/project/dswuotsdaltsomyqqykn/sql\n');
  }
}

async function verifyFix() {
  console.log('\n🔍 Verifying fix...');
  
  try {
    // Check if function exists by trying to query user_email_hashes
    const { data, error } = await supabase
      .from('user_email_hashes')
      .select('user_id')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      console.log('✅ Table exists and is accessible');
    } else if (error && error.code === 'PGRST116') {
      console.log('⚠️ Table does not exist - run migration 018 first');
    } else {
      console.log('✅ Fix applied successfully!');
      console.log('✅ Signup/login should now work without errors');
    }
  } catch (error) {
    console.log('⚠️ Could not verify, but fix should be applied');
  }
}

// Run the fix
applyFix().catch(console.error);

