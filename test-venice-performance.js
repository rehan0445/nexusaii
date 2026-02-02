// Test script to verify Venice API performance improvements
import fetch from 'node-fetch';

const API_URL = 'http://localhost:8002/api/v1/chat/ai/claude';

const testMessage = {
  question: "Hey, how are you doing today?",
  modelName: "Captain Marvel",
  mood: "playful",
  customInstructions: null,
  conversationHistory: [],
  incognitoMode: false,
  characterData: {
    name: "Captain Marvel",
    role: "Superhero",
    description: "Powerful and confident hero",
    personality: {
      traits: ["confident", "powerful", "heroic"],
      speakingStyle: "Direct and confident"
    }
  }
};

async function testPerformance() {
  console.log('🧪 Testing Venice API Performance...\n');

  // Test 1: First request (no cache)
  console.log('Test 1: First request (uncached)');
  const start1 = Date.now();
  try {
    const response1 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });
    const data1 = await response1.json();
    const duration1 = Date.now() - start1;
    
    console.log(`✅ Response time: ${duration1}ms (${(duration1/1000).toFixed(2)}s)`);
    console.log(`📝 Response: ${data1.answer?.substring(0, 100)}...`);
    console.log(`📦 Cached: ${data1.cached || false}\n`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
  }

  // Wait 1 second
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Same request (should be cached)
  console.log('Test 2: Identical request (should be cached)');
  const start2 = Date.now();
  try {
    const response2 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testMessage)
    });
    const data2 = await response2.json();
    const duration2 = Date.now() - start2;
    
    console.log(`✅ Response time: ${duration2}ms (${(duration2/1000).toFixed(2)}s)`);
    console.log(`📝 Response: ${data2.answer?.substring(0, 100)}...`);
    console.log(`📦 Cached: ${data2.cached || false}\n`);
    
    if (data2.cached) {
      const speedup = ((duration1 - duration2) / duration1 * 100).toFixed(0);
      console.log(`🚀 Cache speedup: ${speedup}% faster!\n`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
  }

  // Test 3: Different message (new cache entry)
  console.log('Test 3: Different message (new cache entry)');
  const start3 = Date.now();
  try {
    const response3 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...testMessage,
        question: "What's your favorite thing to do?"
      })
    });
    const data3 = await response3.json();
    const duration3 = Date.now() - start3;
    
    console.log(`✅ Response time: ${duration3}ms (${(duration3/1000).toFixed(2)}s)`);
    console.log(`📝 Response: ${data3.answer?.substring(0, 100)}...`);
    console.log(`📦 Cached: ${data3.cached || false}\n`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}\n`);
  }

  console.log('✅ Performance test complete!');
  console.log('\n📊 Expected Results:');
  console.log('  - Test 1: 3-8 seconds (uncached)');
  console.log('  - Test 2: < 100ms (cached)');
  console.log('  - Test 3: 3-8 seconds (new message)');
}

// Run the test
console.log('🚀 Starting Venice API Performance Test\n');
console.log('Make sure the server is running on http://localhost:8002\n');

testPerformance().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});

