/**
 * Execute fake_views column migration using Supabase
 * This script runs the SQL migration to add fake_views column
 */

import 'dotenv/config';
import { supabase } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function executeMigration() {
  console.log('🚀 Executing fake_views column migration...\n');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'migrations', '017_add_fake_views_column.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL file loaded successfully\n');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        // Extract statement type for logging
        const statementType = statement
          .replace(/\s+/g, ' ')
          .substring(0, 60)
          .trim();
        
        console.log(`[${i + 1}/${statements.length}] Executing: ${statementType}...`);
        
        try {
          // Execute using Supabase RPC (if available) or direct query
          // Note: Some DDL statements may need to be run in Supabase SQL Editor
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          }).catch(async () => {
            // Fallback: Try to verify table structure instead
            // For ALTER TABLE, we'll verify it worked by checking the table
            if (statement.toUpperCase().includes('ALTER TABLE')) {
              // Check if column exists by trying to select it
              const { error: checkError } = await supabase
                .from('character_view_counts')
                .select('fake_views')
                .limit(1);
              
              if (!checkError) {
                return { data: null, error: null }; // Column exists, success
              }
            }
            
            // For CREATE statements, we can't easily verify via client
            // These should be run in Supabase SQL Editor
            return { 
              data: null, 
              error: { 
                message: 'DDL statements should be run in Supabase SQL Editor' 
              } 
            };
          });
          
          if (error) {
            console.log(`⚠️  Statement may need to be run in Supabase SQL Editor`);
            console.log(`   Error: ${error.message}`);
            console.log(`   This is normal for DDL statements (ALTER TABLE, CREATE INDEX, etc.)`);
            console.log(`   Please run this SQL in Supabase Dashboard → SQL Editor\n`);
          } else {
            console.log(`✅ Statement executed successfully\n`);
          }
        } catch (err) {
          console.log(`⚠️  Statement execution note:`);
          console.log(`   ${err.message}`);
          console.log(`   DDL statements (ALTER TABLE, CREATE INDEX) should be run in Supabase SQL Editor\n`);
        }
      }
    }
    
    // Verify the migration by checking if column exists
    console.log('🔍 Verifying migration...');
    const { data: testData, error: testError } = await supabase
      .from('character_view_counts')
      .select('fake_views')
      .limit(1);
    
    if (testError) {
      if (testError.message.includes('column "fake_views" does not exist')) {
        console.log('❌ Column does not exist yet');
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Open Supabase Dashboard: https://app.supabase.com');
        console.log('2. Go to SQL Editor');
        console.log('3. Copy and paste the contents of:');
        console.log('   server/scripts/migrations/017_add_fake_views_column.sql');
        console.log('4. Click "Run" to execute');
        console.log('5. Then run the population script:');
        console.log('   node server/scripts/migrations/018_populate_fake_views.js\n');
      } else {
        console.log(`⚠️  Verification error: ${testError.message}`);
      }
    } else {
      console.log('✅ Migration verified! Column "fake_views" exists in character_view_counts table');
      console.log('\n🎉 Migration complete! You can now run the population script:');
      console.log('   node server/scripts/migrations/018_populate_fake_views.js\n');
    }
    
  } catch (error) {
    console.error('❌ Migration execution failed:', error);
    console.error('\n📋 MANUAL STEPS REQUIRED:');
    console.log('DDL statements (ALTER TABLE, CREATE INDEX) must be run in Supabase SQL Editor:');
    console.log('1. Open: https://app.supabase.com/project/YOUR_PROJECT/sql');
    console.log('2. Copy contents of: server/scripts/migrations/017_add_fake_views_column.sql');
    console.log('3. Paste and click "Run"');
    console.log('4. Then run: node server/scripts/migrations/018_populate_fake_views.js\n');
    process.exit(1);
  }
}

// Run migration
executeMigration()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

