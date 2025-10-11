import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client
const supabase = createClient(
  'https://zmuhcwryfdmuadfrzcfq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdWhjd3J5ZmRtdWFkZnJ6Y2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTk1OTgsImV4cCI6MjA2NTAzNTU5OH0.FOntHG3mvvsPBJCq023vFnYgecwGoRn27rDOwf9ZU_k'
);

async function setupDarkroomTables() {
  try {
    console.log('🚀 Setting up Dark Room database tables...');
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'create_darkroom_tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          console.error('❌ Error executing statement:', error);
          // Continue with other statements
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    console.log('🎉 Dark Room database setup completed!');
    
    // Test the setup
    console.log('🧪 Testing database connection...');
    
    const { data: rooms, error: roomsError } = await supabase
      .from('darkroom_rooms')
      .select('*')
      .limit(1);
    
    if (roomsError) {
      console.error('❌ Database test failed:', roomsError);
    } else {
      console.log('✅ Database connection successful!');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupDarkroomTables();
