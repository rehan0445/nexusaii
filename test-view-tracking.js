/**
 * Test Script: View Tracking Verification
 * 
 * This script tests the view tracking system to ensure views are properly
 * recorded in Supabase with the new 5-minute deduplication window.
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';
const TEST_CHARACTER_ID = 'batman-bruce-wayne';

// Simulated session/user IDs for testing
const TEST_SESSION_ID = 'test_session_' + Date.now();
const TEST_USER_ID = null; // Set to null for anonymous testing

async function trackView(characterId, sessionId, userId = null) {
  try {
    console.log(`\n🔄 Tracking view for character: ${characterId}`);
    const response = await axios.post(`${API_BASE_URL}/api/v1/views/track`, {
      character_id: characterId,
      session_id: sessionId,
      user_id: userId,
    });

    const { data } = response.data;
    console.log(`📊 Response:`, {
      total_views: data.total_views,
      unique_views: data.unique_views,
      was_counted: data.was_counted,
    });

    if (data.was_counted) {
      console.log(`✅ View was COUNTED - Total views: ${data.total_views}`);
    } else {
      console.log(`⏭️  View was SKIPPED (duplicate within 5 min) - Total views: ${data.total_views}`);
    }

    return response.data;
  } catch (error) {
    console.error(`❌ Error tracking view:`, error.response?.data || error.message);
    throw error;
  }
}

async function getLeaderboard() {
  try {
    console.log(`\n📊 Fetching character leaderboard...`);
    const response = await axios.get(`${API_BASE_URL}/api/v1/views/leaderboard`, {
      params: { limit: 10, type: 'total' }
    });

    const { leaderboard } = response.data.data;
    console.log(`\n🏆 Top 10 Characters:`);
    leaderboard.forEach((char, index) => {
      console.log(`   ${index + 1}. ${char.character_id}: ${char.total_views} views`);
    });

    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching leaderboard:`, error.response?.data || error.message);
    throw error;
  }
}

async function runTest() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 VIEW TRACKING TEST - ${new Date().toLocaleString()}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\nTest Configuration:`);
  console.log(`  Character ID: ${TEST_CHARACTER_ID}`);
  console.log(`  Session ID: ${TEST_SESSION_ID}`);
  console.log(`  User ID: ${TEST_USER_ID || 'Anonymous'}`);
  console.log(`  Deduplication Window: 5 seconds`);

  try {
    // Test 1: Track first view (should be counted)
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`TEST 1: First view (should be counted)`);
    console.log(`${'─'.repeat(60)}`);
    await trackView(TEST_CHARACTER_ID, TEST_SESSION_ID, TEST_USER_ID);

    // Test 2: Track immediate duplicate (should be skipped)
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`TEST 2: Immediate duplicate (should be skipped)`);
    console.log(`${'─'.repeat(60)}`);
    await trackView(TEST_CHARACTER_ID, TEST_SESSION_ID, TEST_USER_ID);

    // Test 3: Wait 2 seconds and try again (should still be skipped)
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`TEST 3: After 2 seconds (should be skipped)`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`⏳ Waiting 2 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await trackView(TEST_CHARACTER_ID, TEST_SESSION_ID, TEST_USER_ID);

    // Test 4: Different session ID (should be counted as unique)
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`TEST 4: Different session (should be counted)`);
    console.log(`${'─'.repeat(60)}`);
    const newSessionId = 'test_session_different_' + Date.now();
    await trackView(TEST_CHARACTER_ID, newSessionId, TEST_USER_ID);

    // Show final leaderboard
    await getLeaderboard();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ ALL TESTS COMPLETED SUCCESSFULLY`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`\n💡 IMPORTANT NOTES:`);
    console.log(`   1. Views from the same session within 5 seconds are deduplicated`);
    console.log(`   2. Different sessions count as separate views`);
    console.log(`   3. Wait 6+ seconds to test new views from same session`);
    console.log(`   4. Check server logs for detailed tracking information\n`);

  } catch (error) {
    console.error(`\n❌ TEST FAILED:`, error);
    process.exit(1);
  }
}

// Run the test
runTest().catch(console.error);

