/**
 * Script to apply RLS policies for confessions
 * Run this with: node apply-confession-rls.js
 */

import 'dotenv/config';
import { supabase } from './server/config/supabase.js';
import fs from 'fs/promises';

console.log('🔒 Applying RLS Policies for Confessions\n');

async function applySQLFile() {
  try {
    // Read the SQL file
    const sqlContent = await fs.readFile('./FIX_CONFESSIONS_RLS.sql', 'utf-8');
    
    console.log('📄 SQL file loaded successfully');
    console.log('⚠️  Note: You need to run this SQL manually in Supabase Dashboard');
    console.log('⚠️  This script will verify if policies are working after you apply them\n');
    
    console.log('========================================');
    console.log('SQL TO RUN IN SUPABASE DASHBOARD:');
    console.log('========================================\n');
    console.log(sqlContent);
    console.log('\n========================================\n');
    
    // Test if we can read confessions (this will work if RLS is configured correctly)
    console.log('Testing RLS policies...\n');
    
    const { data, error } = await supabase
      .from('confessions')
      .select('id, content, created_at')
      .limit(5);
    
    if (error) {
      console.error('❌ RLS Test Failed:', error.message);
      console.log('\n⚠️  Please apply the SQL above in Supabase Dashboard first!');
      process.exit(1);
    }
    
    console.log('✅ RLS policies are working correctly!');
    console.log(`📊 Successfully fetched ${data.length} confessions`);
    
    if (data.length > 0) {
      console.log('\nSample confession:');
      console.log('  ID:', data[0].id);
      console.log('  Content:', data[0].content.substring(0, 50) + '...');
      console.log('  Created:', data[0].created_at);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applySQLFile();

