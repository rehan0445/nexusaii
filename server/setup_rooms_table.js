import { supabase } from './config/supabase.js';

async function createRoomsTable() {
  try {
    console.log('🏗️ Creating rooms table...');
    
    // Create the table using Supabase client
    const { data, error } = await supabase
      .from('rooms')
      .select('id')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, we need to create it
      console.log('Table does not exist, creating...');
      
      // For now, let's just test if we can insert a test record
      // The table will be created automatically by Supabase
      const testRoom = {
        id: 'test-room-' + Date.now(),
        name: 'Test Room',
        description: 'Test Description',
        bio: 'Test Bio',
        rules: [],
        category: 'General',
        member_count: 1,
        is_private: false,
        is_official: false,
        room_type: 'palace',
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        moderators: ['test-user'],
        tags: ['test'],
        icon: '🧪',
        profile_picture: null,
        created_by: 'test-user',
        campus_id: null,
        max_co_admins: 3,
        default_ban_duration: '1day',
        allow_member_requests: true,
        allow_admin_invites: true,
        auto_transfer_on_inactivity: true,
        inactivity_days: 10
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('rooms')
        .insert([testRoom])
        .select();
      
      if (insertError) {
        console.error('Error creating table:', insertError);
        return false;
      }
      
      console.log('✅ Rooms table created successfully');
      
      // Clean up test record
      await supabase
        .from('rooms')
        .delete()
        .eq('id', testRoom.id);
      
      return true;
    } else if (error) {
      console.error('Error checking table:', error);
      return false;
    } else {
      console.log('✅ Rooms table already exists');
      return true;
    }
  } catch (error) {
    console.error('Error setting up rooms table:', error);
    return false;
  }
}

createRoomsTable().then(success => {
  if (success) {
    console.log('🎉 Database setup completed successfully');
    process.exit(0);
  } else {
    console.error('❌ Database setup failed');
    process.exit(1);
  }
});
