import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 Checking if database tables exist...\n');
  
  const tablesToCheck = [
    'users',
    'userProfileData',
    'confessions',
    'ai_chat_history',
    'character_data',
    'rooms',
    'announcements'
  ];
  
  let allExist = true;
  
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log(`❌ Table '${table}' does NOT exist`);
        allExist = false;
      } else if (error) {
        console.log(`⚠️  Table '${table}' - Error: ${error.message}`);
        allExist = false;
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}' does NOT exist`);
      allExist = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  if (allExist) {
    console.log('✅ ALL TABLES EXIST! Your database is ready!');
    console.log('🚀 You can start your server now!');
  } else {
    console.log('❌ TABLES MISSING! You need to run the SQL setup.');
    console.log('\n📝 Next step: Run SUPABASE_QUICK_SETUP.sql in Supabase SQL Editor');
  }
  console.log('='.repeat(50));
}

checkTables();

