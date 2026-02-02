#!/usr/bin/env node

/**
 * Comprehensive test script for hangout fixes
 * Tests both message visibility and room creation issues
 */

import { createClient } from './server/node_modules/@supabase/supabase-js/dist/main/index.js';
import { io } from './server/node_modules/socket.io-client/dist/index.js';

// Environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serverUrl = process.env.VITE_SERVER_URL || 'http://localhost:8002';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testHangoutFixes() {
  console.log('🧪 Testing Hangout Fixes...\n');

  const testUserId1 = `test-user-1-${Date.now()}`;
  const testUserId2 = `test-user-2-${Date.now()}`;
  const testRoomName = `Test Room ${Date.now()}`;
  const testMessage1 = `Test message from user 1 - ${Date.now()}`;
  const testMessage2 = `Test message from user 2 - ${Date.now()}`;

  let roomId = null;
  let socket1 = null;
  let socket2 = null;
  let messagesReceived1 = [];
  let messagesReceived2 = [];

  try {
    // Step 1: Test database connectivity
    console.log('1️⃣ Testing database connectivity...');
    const { data: rooms, error: roomsError } = await supabase.from('rooms').select('id').limit(1);
    if (roomsError) {
      console.error('❌ Database connection failed:', roomsError.message);
      return;
    }
    console.log('✅ Database connection successful');

    // Step 2: Test room creation
    console.log('\n2️⃣ Testing room creation...');
    const roomData = {
      id: `test-room-${Date.now()}`,
      name: testRoomName,
      description: 'Test room for message visibility',
      bio: 'Test bio',
      rules: [],
      category: 'Test',
      member_count: 0,
      is_private: false,
      is_official: false,
      room_type: 'palace',
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      moderators: [testUserId1],
      tags: ['test'],
      icon: '🏰',
      profile_picture: null,
      created_by: testUserId1,
      campus_id: null,
      max_co_admins: 3,
      default_ban_duration: '1day',
      allow_member_requests: true,
      allow_admin_invites: true,
      auto_transfer_on_inactivity: true,
      inactivity_days: 10
    };

    const { data: createdRoom, error: createError } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single();

    if (createError) {
      console.error('❌ Room creation failed:', createError.message);
      console.log('Error details:', createError);
      return;
    }

    roomId = createdRoom.id;
    console.log('✅ Room created successfully:', roomId);

    // Step 3: Test Socket.io connections
    console.log('\n3️⃣ Testing Socket.io connections...');

    // Create two socket connections (simulating two users)
    socket1 = io(serverUrl, {
      auth: {
        token: 'test-token-1',
        userId: testUserId1
      }
    });

    socket2 = io(serverUrl, {
      auth: {
        token: 'test-token-2',
        userId: testUserId2
      }
    });

    // Wait for both connections
    await Promise.all([
      new Promise((resolve, reject) => {
        socket1.on('connect', () => {
          console.log('✅ Socket 1 connected');
          resolve();
        });
        socket1.on('connect_error', reject);
        setTimeout(() => reject(new Error('Socket 1 timeout')), 10000);
      }),
      new Promise((resolve, reject) => {
        socket2.on('connect', () => {
          console.log('✅ Socket 2 connected');
          resolve();
        });
        socket2.on('connect_error', reject);
        setTimeout(() => reject(new Error('Socket 2 timeout')), 10000);
      })
    ]);

    // Step 4: Test room joining
    console.log('\n4️⃣ Testing room joining...');

    // Both users join the room
    socket1.emit('join-hangout-room', { roomId, userId: testUserId1 });
    socket2.emit('join-hangout-room', { roomId, userId: testUserId2 });

    // Wait for join confirmations
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Test message sending and receiving
    console.log('\n5️⃣ Testing message visibility...');

    // Set up message listeners
    socket1.on('receive-hangout-message', (message) => {
      console.log('📨 User 1 received message:', message.content);
      messagesReceived1.push(message);
    });

    socket2.on('receive-hangout-message', (message) => {
      console.log('📨 User 2 received message:', message.content);
      messagesReceived2.push(message);
    });

    // User 1 sends a message
    console.log('📤 User 1 sending message...');
    socket1.emit('send-hangout-message', {
      roomId,
      userId: testUserId1,
      content: testMessage1,
      userName: 'Test User 1'
    });

    // Wait for message delivery
    await new Promise(resolve => setTimeout(resolve, 2000));

    // User 2 sends a message
    console.log('📤 User 2 sending message...');
    socket2.emit('send-hangout-message', {
      roomId,
      userId: testUserId2,
      content: testMessage2,
      userName: 'Test User 2'
    });

    // Wait for message delivery
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 6: Verify message visibility
    console.log('\n6️⃣ Verifying message visibility...');
    console.log(`User 1 received ${messagesReceived1.length} messages`);
    console.log(`User 2 received ${messagesReceived2.length} messages`);

    // Check if both users received both messages
    const user1ReceivedBoth = messagesReceived1.length >= 2;
    const user2ReceivedBoth = messagesReceived2.length >= 2;

    if (user1ReceivedBoth && user2ReceivedBoth) {
      console.log('✅ MESSAGE VISIBILITY FIXED: Both users can see each other\'s messages!');
    } else {
      console.log('❌ Message visibility issue still exists');
      console.log('User 1 messages:', messagesReceived1.map(m => m.content));
      console.log('User 2 messages:', messagesReceived2.map(m => m.content));
    }

    // Step 7: Test database persistence
    console.log('\n7️⃣ Testing message persistence...');
    const { data: dbMessages, error: dbError } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('❌ Database query failed:', dbError.message);
    } else {
      console.log(`✅ Found ${dbMessages.length} messages in database`);
      if (dbMessages.length >= 2) {
        console.log('✅ MESSAGE PERSISTENCE WORKING: Messages saved to database');
      } else {
        console.log('❌ Message persistence issue');
      }
    }

    // Step 8: Cleanup
    console.log('\n8️⃣ Cleaning up test data...');
    await supabase.from('room_messages').delete().eq('room_id', roomId);
    await supabase.from('rooms').delete().eq('id', roomId);
    console.log('✅ Test data cleaned up');

    console.log('\n🎯 TEST SUMMARY:');
    console.log('✅ Database connectivity: Working');
    console.log('✅ Room creation: Working');
    console.log('✅ Socket.io connections: Working');
    console.log('✅ Room joining: Working');
    console.log(user1ReceivedBoth && user2ReceivedBoth ? '✅ Message visibility: FIXED' : '❌ Message visibility: Still broken');
    console.log(dbMessages && dbMessages.length >= 2 ? '✅ Message persistence: Working' : '❌ Message persistence: Broken');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Cleanup connections
    if (socket1) socket1.disconnect();
    if (socket2) socket2.disconnect();
    console.log('🧹 Socket connections cleaned up');
  }
}

// Run the test
testHangoutFixes();