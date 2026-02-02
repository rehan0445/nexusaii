#!/usr/bin/env node

/**
 * Dark Room User Count Fix
 * This script cleans up stale user sessions and resets user counts to accurate values
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, 'server', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupStaleUsers() {
  console.log('🧹 Starting Dark Room user count cleanup...\n');

  try {
    // Step 1: Remove all stale user sessions (older than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    console.log('1️⃣ Removing stale user sessions (older than 5 minutes)...');
    const { data: staleUsers, error: deleteError } = await supabase
      .from('darkroom_room_users')
      .delete()
      .lt('last_activity', fiveMinutesAgo)
      .select();

    if (deleteError) {
      console.error('❌ Error removing stale users:', deleteError);
    } else {
      console.log(`   ✅ Removed ${staleUsers?.length || 0} stale user sessions\n`);
    }

    // Step 2: Get all active rooms
    console.log('2️⃣ Getting all active rooms...');
    const { data: rooms, error: roomsError } = await supabase
      .from('darkroom_rooms')
      .select('id, name')
      .eq('is_active', true);

    if (roomsError) {
      console.error('❌ Error getting rooms:', roomsError);
      return;
    }

    console.log(`   ✅ Found ${rooms?.length || 0} active rooms\n`);

    // Step 3: Update user count for each room
    console.log('3️⃣ Updating user counts for all rooms...');
    for (const room of rooms || []) {
      // Count current active users
      const { data: users, error: countError } = await supabase
        .from('darkroom_room_users')
        .select('id')
        .eq('room_id', room.id);

      if (countError) {
        console.error(`   ❌ Error counting users for room ${room.id}:`, countError);
        continue;
      }

      const userCount = users?.length || 0;

      // Update room user count
      const { error: updateError } = await supabase
        .from('darkroom_rooms')
        .update({ user_count: userCount })
        .eq('id', room.id);

      if (updateError) {
        console.error(`   ❌ Error updating room ${room.id}:`, updateError);
      } else {
        console.log(`   ✅ ${room.name} (${room.id}): ${userCount} users`);
      }
    }

    console.log('\n✅ Dark Room cleanup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Cleaned up ${staleUsers?.length || 0} stale sessions`);
    console.log(`   - Updated user counts for ${rooms?.length || 0} rooms`);

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupStaleUsers()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
