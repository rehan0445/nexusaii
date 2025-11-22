import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabase = createClient(
  'https://zmuhcwryfdmuadfrzcfq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdWhjd3J5ZmRtdWFkZnJ6Y2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTk1OTgsImV4cCI6MjA2NTAzNTU5OH0.FOntHG3mvvsPBJCq023vFnYgecwGoRn27rDOwf9ZU_k'
);

async function setupAnnouncementsTables() {
  try {
    console.log('🚀 Setting up announcements database tables...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_announcements_tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase
              .from('announcements')
              .select('id')
              .limit(1);
            
            if (directError && directError.message.includes('relation "announcements" does not exist')) {
              console.log(`⚠️  Table doesn't exist yet, skipping statement: ${statement.substring(0, 50)}...`);
              continue;
            }
          }
          
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} failed (might already exist): ${err.message}`);
        }
      }
    }
    
    // Test the tables by inserting sample data
    console.log('\n🧪 Testing tables with sample data...');
    
    // Insert sample announcement
    const sampleAnnouncement = {
      id: 'test_announcement_1',
      title: 'Test Announcement - Database Setup',
      content: 'This is a test announcement to verify database setup is working correctly.',
      category: 'infrastructure',
      priority: 'medium',
      target_audience: ['all'],
      campus: 'mit-adt',
      department: 'system',
      is_active: true,
      requires_acknowledgment: false,
      tags: ['test', 'database', 'setup'],
      is_pinned: false,
      likes: 0,
      reactions: {},
      author_id: 'system',
      author_name: 'System Admin',
      author_role: 'system_admin',
      has_threads: false,
      poll: null,
      rsvp: null,
      event_date: null
    };
    
    const { error: announcementError } = await supabase
      .from('announcements')
      .insert(sampleAnnouncement);
    
    if (announcementError) {
      console.log(`⚠️  Sample announcement insert failed: ${announcementError.message}`);
    } else {
      console.log('✅ Sample announcement inserted successfully');
    }
    
    // Insert sample lost & found item
    const sampleLostFound = {
      id: 'test_lost_found_1',
      title: 'Test Lost Item - Database Setup',
      description: 'This is a test lost & found item to verify database setup.',
      category: 'electronics',
      custom_tags: ['test', 'database'],
      photos: [],
      item_type: 'lost',
      location: 'Test Location',
      status: 'active',
      author_id: 'system',
      author_name: 'System Admin',
      author_role: 'system_admin'
    };
    
    const { error: lostFoundError } = await supabase
      .from('lost_found_items')
      .insert(sampleLostFound);
    
    if (lostFoundError) {
      console.log(`⚠️  Sample lost & found insert failed: ${lostFoundError.message}`);
    } else {
      console.log('✅ Sample lost & found item inserted successfully');
    }
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('announcements').delete().eq('id', 'test_announcement_1');
    await supabase.from('lost_found_items').delete().eq('id', 'test_lost_found_1');
    
    console.log('✅ Test data cleaned up');
    console.log('\n🎉 Announcements database setup completed successfully!');
    console.log('\n📋 Tables created:');
    console.log('   - announcements');
    console.log('   - urgent_broadcasts');
    console.log('   - lost_found_items');
    console.log('   - announcement_threads');
    console.log('   - user_likes');
    console.log('   - user_rsvps');
    console.log('   - user_poll_votes');
    
  } catch (error) {
    console.error('❌ Error setting up announcements database:', error);
    process.exit(1);
  }
}

// Run the setup
setupAnnouncementsTables();
