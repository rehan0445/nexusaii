import { supabase } from '../config/supabase.js';
import fs from 'fs';
import path from 'path';

async function setupRoomsTable() {
  try {
    console.log('🏗️ Setting up rooms table...');
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts', 'create_rooms_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error creating rooms table:', error);
      return false;
    }
    
    console.log('✅ Rooms table created successfully');
    return true;
  } catch (error) {
    console.error('Error setting up rooms table:', error);
    return false;
  }
}

// Run the setup
setupRoomsTable().then(success => {
  if (success) {
    console.log('🎉 Database setup completed successfully');
    process.exit(0);
  } else {
    console.error('❌ Database setup failed');
    process.exit(1);
  }
});
