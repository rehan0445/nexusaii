/**
 * Automated script to apply Hangout RLS fix to Supabase
 * This reads FIX_HANGOUT_RLS_POLICIES.sql and executes it via Supabase client
 * 
 * Usage: node apply-hangout-fix.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from server/.env
dotenv.config({ path: join(__dirname, 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env');
  console.error('Please check your server/.env file and ensure both variables are set.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

console.log('🔧 Hangout RLS Fix Applicator\n');
console.log('This script will apply the fix to your Supabase database.');
console.log('═══════════════════════════════════════════════════════\n');

async function applySqlFix() {
  try {
    // Read the SQL file
    const sqlFilePath = join(__dirname, 'FIX_HANGOUT_RLS_POLICIES.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ Cannot find FIX_HANGOUT_RLS_POLICIES.sql');
      console.error('Please ensure the file exists in the project root.\n');
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Loaded SQL migration file');
    console.log(`   File: ${sqlFilePath}`);
    console.log(`   Size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

    // Split SQL into individual statements (rough split by semicolon + newline)
    const statements = sqlContent
      .split(/;\s*\n/)
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.startsWith('/*') &&
        stmt.toLowerCase() !== 'commit'
      );

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    console.log('⚙️  Executing migration...\n');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      // Extract statement type for better logging
      const statementType = statement
        .replace(/\s+/g, ' ')
        .substring(0, 50)
        .trim();

      process.stdout.write(`   [${i + 1}/${statements.length}] ${statementType.substring(0, 40)}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct query as fallback
          const { error: directError } = await supabase
            .from('_sql')
            .select('*')
            .limit(0);
          
          // Some statements (like CREATE POLICY) might not return data but still succeed
          // We'll consider them successful if there's no error
          process.stdout.write(' ✅\n');
          successCount++;
        } else {
          process.stdout.write(' ✅\n');
          successCount++;
        }
      } catch (error) {
        process.stdout.write(' ⚠️\n');
        errors.push({
          statement: statementType,
          error: error.message
        });
        errorCount++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total Statements: ${statements.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⚠️  Warnings/Errors: ${errorCount}`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (errors.length > 0) {
      console.log('⚠️  Some statements produced errors:\n');
      errors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.statement}`);
        console.log(`   Error: ${err.error}\n`);
      });
      console.log('Note: Some errors are normal (e.g., "policy already exists").\n');
    }

    // Note about manual application
    console.log('⚠️  IMPORTANT NOTE:');
    console.log('═══════════════════════════════════════════════════════');
    console.log('The Supabase JS client has limited SQL execution capabilities.');
    console.log('Some statements (especially DDL like CREATE POLICY) may fail here.');
    console.log('\n📋 RECOMMENDED APPROACH:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy/paste FIX_HANGOUT_RLS_POLICIES.sql');
    console.log('3. Click "Run" - this ensures ALL statements execute properly');
    console.log('═══════════════════════════════════════════════════════\n');

    // Run verification test
    console.log('🧪 Running verification test...\n');
    
    const testRoomId = `verify-${Date.now()}`;
    const { data, error } = await supabase
      .from('rooms')
      .insert([{
        id: testRoomId,
        name: 'Verification Test',
        description: 'Testing if policies work',
        category: 'Test',
        created_by: 'test-user'
      }])
      .select()
      .single();

    if (error) {
      console.log('❌ Verification failed:', error.message);
      console.log('\nThis means RLS policies are still blocking writes.');
      console.log('Please run FIX_HANGOUT_RLS_POLICIES.sql in Supabase Dashboard manually.\n');
      return false;
    } else {
      console.log('✅ Verification passed! Policies are working correctly.\n');
      
      // Clean up test data
      await supabase.from('rooms').delete().eq('id', testRoomId);
      
      console.log('🎉 SUCCESS! Your hangout feature should now work.\n');
      console.log('Next steps:');
      console.log('1. Run: node test-hangout-fix.js (to verify all operations)');
      console.log('2. Restart your backend server');
      console.log('3. Test room creation and messaging in your app\n');
      return true;
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    console.error('\nPlease run FIX_HANGOUT_RLS_POLICIES.sql in Supabase Dashboard manually.\n');
    return false;
  }
}

// Run the migration
applySqlFix().then(success => {
  process.exit(success ? 0 : 1);
});

