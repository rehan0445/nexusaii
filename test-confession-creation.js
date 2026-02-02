/**
 * Test script to verify confession creation and visibility
 * Run this with: node test-confession-creation.js
 */

import 'dotenv/config';
import { supabase } from './server/config/supabase.js';
import fetch from 'node-fetch';

const SERVER_URL = process.env.VITE_SERVER_URL || 'http://localhost:8002';

console.log('🧪 Testing Confession Creation and Visibility\n');

// Test 1: Create a test confession
async function testConfessionCreation() {
  console.log('Test 1: Creating a test confession...');
  
  try {
    const testConfession = {
      content: 'This is a test confession to verify the system works properly!',
      alias: {
        name: 'TestUser',
        emoji: '🧪',
        color: '#3b82f6'
      },
      sessionId: `test-${Date.now()}`,
      poll: null
    };

    const response = await fetch(`${SERVER_URL}/api/confessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testConfession)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Confession created successfully!');
      console.log('📝 Confession ID:', result.data.id);
      console.log('📝 Content:', result.data.content.substring(0, 50) + '...');
      return result.data.id;
    } else {
      console.error('❌ Failed to create confession:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating confession:', error.message);
    return null;
  }
}

// Test 2: Verify confession is stored in Supabase
async function testSupabaseStorage(confessionId) {
  console.log('\nTest 2: Verifying confession in Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('confessions')
      .select('*')
      .eq('id', confessionId)
      .single();

    if (error) {
      console.error('❌ Error fetching from Supabase:', error.message);
      return false;
    }

    if (data) {
      console.log('✅ Confession found in Supabase!');
      console.log('📝 ID:', data.id);
      console.log('📝 Content:', data.content.substring(0, 50) + '...');
      console.log('📝 Created at:', data.created_at);
      return true;
    } else {
      console.error('❌ Confession not found in Supabase');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying Supabase storage:', error.message);
    return false;
  }
}

// Test 3: Verify confession is visible to all users (via API)
async function testConfessionVisibility() {
  console.log('\nTest 3: Checking confession visibility...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/confessions?cursor=0&limit=10`);
    const result = await response.json();

    if (result.success) {
      console.log('✅ Confessions API accessible!');
      console.log('📊 Total confessions fetched:', result.data.items.length);
      
      if (result.data.items.length > 0) {
        console.log('📝 Latest confession:', result.data.items[0].content.substring(0, 50) + '...');
        return true;
      } else {
        console.log('⚠️ No confessions found');
        return false;
      }
    } else {
      console.error('❌ Failed to fetch confessions:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking visibility:', error.message);
    return false;
  }
}

// Test 4: Check RLS policies
async function testRLSPolicies() {
  console.log('\nTest 4: Checking RLS policies...');
  
  try {
    const { data, error } = await supabase
      .from('confessions')
      .select('id')
      .limit(5);

    if (error) {
      console.error('❌ RLS policy error:', error.message);
      return false;
    }

    console.log('✅ RLS policies allow reading confessions!');
    console.log('📊 Accessible confessions:', data.length);
    return true;
  } catch (error) {
    console.error('❌ Error checking RLS:', error.message);
    return false;
  }
}

// Run all tests
(async () => {
  try {
    console.log('Starting tests...\n');
    console.log('========================================\n');

    const confessionId = await testConfessionCreation();
    
    if (confessionId) {
      await testSupabaseStorage(confessionId);
    }
    
    await testConfessionVisibility();
    await testRLSPolicies();

    console.log('\n========================================');
    console.log('✅ All tests completed!');
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
})();

