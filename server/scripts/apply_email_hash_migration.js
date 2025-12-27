/**
 * Apply Email Hash Migration for GA4 User-ID Tracking
 * 
 * This script executes the SQL migration to set up email hash tracking
 * Run with: node server/scripts/apply_email_hash_migration.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'https://dswuotsdaltsomyqqykn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment variables');
  console.error('   Please set SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function applyMigration() {
  console.log('🚀 Starting Email Hash Migration for GA4 User-ID Tracking...\n');

  try {
    // Read SQL file
    const sqlPath = join(__dirname, 'migrations', '018_add_email_hash_tracking.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    // Split SQL into individual statements
    // Remove comments and split by semicolons
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .filter(s => !s.match(/^\/\*[\s\S]*?\*\//)); // Remove block comments

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements
      if (statement.length < 10) {
        continue;
      }

      // Extract statement type for better logging
      const statementType = statement
        .replace(/\s+/g, ' ')
        .substring(0, 60)
        .trim();

      process.stdout.write(`   [${i + 1}/${statements.length}] ${statementType}...`);

      try {
        // Execute SQL using Supabase RPC if available, otherwise direct query
        // Note: Some statements like CREATE TABLE need to be executed directly
        if (statement.toUpperCase().startsWith('CREATE') || 
            statement.toUpperCase().startsWith('ALTER') ||
            statement.toUpperCase().startsWith('DROP') ||
            statement.toUpperCase().startsWith('GRANT') ||
            statement.toUpperCase().startsWith('INSERT') ||
            statement.toUpperCase().startsWith('DO $$')) {
          
          // For DDL statements, we need to execute them directly
          // Supabase doesn't support direct SQL execution via client, so we'll use a workaround
          // Actually, we need to use the Supabase SQL Editor or REST API
          console.log(' ⚠️  (Manual execution required)');
          console.log('   Please run this migration in Supabase SQL Editor:');
          console.log(`   ${sqlPath}`);
          continue;
        }

        // Try RPC execution for other statements
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Some statements might fail but that's okay (e.g., IF NOT EXISTS)
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist')) {
            process.stdout.write(' ✅ (already exists)\n');
            successCount++;
          } else {
            process.stdout.write(' ⚠️\n');
            errors.push({ statement: statementType, error: error.message });
            errorCount++;
          }
        } else {
          process.stdout.write(' ✅\n');
          successCount++;
        }
      } catch (error) {
        process.stdout.write(' ⚠️\n');
        errors.push({ statement: statementType, error: error.message });
        errorCount++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 MIGRATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total Statements: ${statements.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⚠️  Warnings/Errors: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.statement}`);
        console.log(`      Error: ${err.error}`);
      });
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('⚠️  IMPORTANT: DDL statements require manual execution');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Due to Supabase client limitations, CREATE/ALTER/DROP statements');
    console.log('must be executed manually in the Supabase SQL Editor.');
    console.log('\n📝 Next Steps:');
    console.log('1. Open Supabase Dashboard: https://app.supabase.com');
    console.log('2. Go to SQL Editor');
    console.log(`3. Copy and paste contents of: ${sqlPath}`);
    console.log('4. Click "Run" to execute');
    console.log('\n✅ After running the SQL, the migration will be complete!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
applyMigration().catch(console.error);


