/**
 * Test script to verify Hangout Rooms & Palaces are working after RLS fix
 * Run this after executing FIX_HANGOUT_RLS_POLICIES.sql
 * 
 * Usage: node test-hangout-fix.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

console.log('🧪 Testing Hangout Rooms & Palaces Database Operations...\n');

async function runTests() {
  const testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Check if tables exist
  console.log('📋 Test 1: Checking if tables exist...');
  testResults.total++;
  try {
    const { data: roomsCheck, error: roomsError } = await supabase
      .from('rooms')
      .select('id')
      .limit(1);
    
    const { data: messagesCheck, error: messagesError } = await supabase
      .from('room_messages')
      .select('id')
      .limit(1);
    
    const { data: participantsCheck, error: participantsError } = await supabase
      .from('room_participants')
      .select('id')
      .limit(1);

    if (!roomsError && !messagesError && !participantsError) {
      console.log('✅ All tables exist\n');
      testResults.passed++;
    } else {
      console.log('❌ Some tables missing or inaccessible');
      if (roomsError) console.log('   - rooms table error:', roomsError.message);
      if (messagesError) console.log('   - room_messages table error:', messagesError.message);
      if (participantsError) console.log('   - room_participants table error:', participantsError.message);
      console.log();
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ Error checking tables:', error.message, '\n');
    testResults.failed++;
  }

  // Test 2: Test room creation (INSERT)
  console.log('📋 Test 2: Testing room creation...');
  testResults.total++;
  const testRoomId = `test-room-${Date.now()}`;
  try {
    const { data, error } = await supabase
      .from('rooms')
      .insert([{
        id: testRoomId,
        name: 'Test Palace',
        description: 'Automated test room',
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
        created_by: 'test-user'
      }])
      .select()
      .single();

    if (error) {
      console.log('❌ Room creation failed:', error.message);
      console.log('   This likely means RLS policies are blocking writes.');
      console.log('   Please run FIX_HANGOUT_RLS_POLICIES.sql\n');
      testResults.failed++;
    } else {
      console.log('✅ Room created successfully:', data.id, '\n');
      testResults.passed++;
    }
  } catch (error) {
    console.log('❌ Room creation error:', error.message, '\n');
    testResults.failed++;
  }

  // Test 3: Test message creation (INSERT)
  console.log('📋 Test 3: Testing message creation...');
  testResults.total++;
  const testMessageId = `test-msg-${Date.now()}`;
  try {
    const { data, error } = await supabase
      .from('room_messages')
      .insert([{
        id: testMessageId,
        room_id: testRoomId,
        user_id: 'test-user',
        content: 'Test message for automated testing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_edited: false,
        is_deleted: false,
        reactions: {}
      }])
      .select()
      .single();

    if (error) {
      console.log('❌ Message creation failed:', error.message);
      console.log('   This likely means RLS policies are blocking writes.');
      console.log('   Please run FIX_HANGOUT_RLS_POLICIES.sql\n');
      testResults.failed++;
    } else {
      console.log('✅ Message created successfully:', data.id, '\n');
      testResults.passed++;
    }
  } catch (error) {
    console.log('❌ Message creation error:', error.message, '\n');
    testResults.failed++;
  }

  // Test 4: Test participant creation (INSERT)
  console.log('📋 Test 4: Testing participant tracking...');
  testResults.total++;
  try {
    const { data, error } = await supabase
      .from('room_participants')
      .insert([{
        room_id: testRoomId,
        user_id: 'test-user',
        joined_at: new Date().toISOString(),
        last_read_at: new Date().toISOString(),
        unread_count: 0,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.log('❌ Participant tracking failed:', error.message);
      console.log('   This likely means RLS policies are blocking writes.');
      console.log('   Please run FIX_HANGOUT_RLS_POLICIES.sql\n');
      testResults.failed++;
    } else {
      console.log('✅ Participant tracked successfully\n');
      testResults.passed++;
    }
  } catch (error) {
    console.log('❌ Participant tracking error:', error.message, '\n');
    testResults.failed++;
  }

  // Test 5: Test reading data (SELECT)
  console.log('📋 Test 5: Testing data retrieval...');
  testResults.total++;
  try {
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', testRoomId)
      .single();

    const { data: messages, error: messagesError } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', testRoomId);

    if (!roomsError && !messagesError) {
      console.log('✅ Data retrieval successful');
      console.log(`   - Found room: ${rooms.name}`);
      console.log(`   - Found ${messages.length} message(s)\n`);
      testResults.passed++;
    } else {
      console.log('❌ Data retrieval failed');
      if (roomsError) console.log('   - Room fetch error:', roomsError.message);
      if (messagesError) console.log('   - Messages fetch error:', messagesError.message);
      console.log();
      testResults.failed++;
    }
  } catch (error) {
    console.log('❌ Data retrieval error:', error.message, '\n');
    testResults.failed++;
  }

  // Test 6: Test updating data (UPDATE)
  console.log('📋 Test 6: Testing data updates...');
  testResults.total++;
  try {
    const { data, error } = await supabase
      .from('rooms')
      .update({ member_count: 2 })
      .eq('id', testRoomId)
      .select()
      .single();

    if (error) {
      console.log('❌ Update failed:', error.message);
      console.log('   This likely means RLS policies are blocking updates.');
      console.log('   Please run FIX_HANGOUT_RLS_POLICIES.sql\n');
      testResults.failed++;
    } else {
      console.log('✅ Update successful:', `member_count = ${data.member_count}\n`);
      testResults.passed++;
    }
  } catch (error) {
    console.log('❌ Update error:', error.message, '\n');
    testResults.failed++;
  }

  // Cleanup: Delete test data
  console.log('🧹 Cleaning up test data...');
  try {
    await supabase.from('room_messages').delete().eq('room_id', testRoomId);
    await supabase.from('room_participants').delete().eq('room_id', testRoomId);
    await supabase.from('rooms').delete().eq('id', testRoomId);
    console.log('✅ Test data cleaned up\n');
  } catch (error) {
    console.log('⚠️  Warning: Could not clean up test data:', error.message, '\n');
  }

  // Print summary
  console.log('═══════════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log('═══════════════════════════════════════════\n');

  if (testResults.failed === 0) {
    console.log('🎉 All tests passed! Hangout rooms are working correctly.\n');
    console.log('Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Test room creation in the UI');
    console.log('3. Test messaging between different accounts\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.\n');
    console.log('Common fixes:');
    console.log('1. Run FIX_HANGOUT_RLS_POLICIES.sql in Supabase SQL Editor');
    console.log('2. Verify SUPABASE_SERVICE_ROLE_KEY is set correctly in server/.env');
    console.log('3. Check Supabase dashboard for any table issues\n');
    console.log('For detailed troubleshooting, see: HANGOUT_TROUBLESHOOTING_GUIDE.md\n');
  }

  process.exit(testResults.failed === 0 ? 0 : 1);
}

runTests().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

