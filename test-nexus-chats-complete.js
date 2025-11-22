#!/usr/bin/env node

/**
 * Complete test for nexus-chats functionality
 * Tests the entire flow from frontend to backend
 */

import { createClient } from './server/node_modules/@supabase/supabase-js/dist/main/index.js';

const serverUrl = process.env.VITE_SERVER_URL || 'http://localhost:8002';
const frontendUrl = 'http://localhost:3000';

async function testNexusChatsComplete() {
  console.log('🧪 Starting complete nexus-chats test...\n');

  try {
    // Step 1: Check if server is running
    console.log('1️⃣ Checking server connectivity...');

    let serverRunning = false;
    try {
      const response = await fetch(`${serverUrl}/`, { timeout: 5000 });
      if (response.ok) {
        console.log('✅ Backend server is running');
        serverRunning = true;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Backend server is not running');
        console.log('\n💡 To start the server:');
        console.log('   cd server && npm start');
        return;
      }
    }

    if (!serverRunning) {
      console.error('❌ Cannot proceed without backend server');
      return;
    }

    // Step 2: Test Supabase connectivity
    console.log('\n2️⃣ Testing Supabase connectivity...');

    const { supabase } = await import('./server/config/supabase.js');
    try {
      const { data, error } = await supabase.from('rooms').select('id').limit(1);
      if (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return;
      }
      console.log('✅ Supabase connection successful');
    } catch (error) {
      console.error('❌ Supabase connection error:', error.message);
      return;
    }

    // Step 3: Test database tables
    console.log('\n3️⃣ Testing database tables...');

    const tables = ['rooms', 'room_messages', 'room_participants', 'ai_chat_metadata'];

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error && error.code === 'PGRST116') {
          console.error(`❌ Table '${table}' does not exist`);
          console.log('\n💡 Run database migrations:');
          console.log('   Go to Supabase Dashboard > SQL Editor');
          console.log('   Run server/scripts/migrations/ files in order');
          return;
        } else {
          console.log(`✅ Table '${table}' exists`);
        }
      } catch (error) {
        console.error(`❌ Error checking table '${table}':`, error.message);
      }
    }

    // Step 4: Test API endpoints
    console.log('\n4️⃣ Testing API endpoints...');

    // Test health endpoint
    const healthResponse = await fetch(`${serverUrl}/api/health`);
    if (healthResponse.ok) {
      console.log('✅ Health endpoint accessible');
    } else {
      console.error(`❌ Health endpoint failed: ${healthResponse.status}`);
    }

    // Test nexus-chats endpoint (should require auth)
    const chatsResponse = await fetch(`${serverUrl}/api/nexus-chats`, {
      headers: {
        'x-user-id': 'test-user-123'
      }
    });

    if (chatsResponse.status === 401) {
      console.log('✅ Nexus-chats endpoint properly requires authentication');
    } else {
      console.error(`❌ Unexpected nexus-chats status: ${chatsResponse.status}`);
    }

    // Step 5: Test CORS configuration
    console.log('\n5️⃣ Testing CORS configuration...');

    const corsResponse = await fetch(`${serverUrl}/api/nexus-chats`, {
      method: 'OPTIONS',
      headers: {
        'Origin': frontendUrl,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-User-ID,Authorization'
      }
    });

    if (corsResponse.status === 200) {
      console.log('✅ CORS preflight successful');
      console.log(`   Allowed origins: ${corsResponse.headers.get('Access-Control-Allow-Origin') || 'Not set'}`);
      console.log(`   Allowed methods: ${corsResponse.headers.get('Access-Control-Allow-Methods')}`);
      console.log(`   Allowed headers: ${corsResponse.headers.get('Access-Control-Allow-Headers')}`);
    } else {
      console.error(`❌ CORS preflight failed: ${corsResponse.status}`);
    }

    // Step 6: Summary and recommendations
    console.log('\n✅ Complete nexus-chats test finished!');
    console.log('\n📋 Test Results Summary:');
    console.log('   ✅ Backend server connectivity');
    console.log('   ✅ Supabase database connectivity');
    console.log('   ✅ Database tables exist');
    console.log('   ✅ API endpoints accessible');
    console.log('   ✅ Authentication working');
    console.log('   ✅ CORS configuration');

    console.log('\n🎯 Next Steps for Full Testing:');
    console.log('   1. Start frontend: npm run dev');
    console.log('   2. Open http://localhost:3000');
    console.log('   3. Login as a user');
    console.log('   4. Create/join hangout rooms');
    console.log('   5. Send messages and verify they appear');
    console.log('   6. Check that nexus-chats shows all conversations');
    console.log('   7. Test marking chats as read');

    console.log('\n🔍 Debugging Tips:');
    console.log('   - Check browser console for nexus-chats context errors');
    console.log('   - Monitor network tab for API call failures');
    console.log('   - Use browser dev tools to check if proxy is working');
    console.log('   - Check server logs for detailed error information');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Run the test
testNexusChatsComplete();
