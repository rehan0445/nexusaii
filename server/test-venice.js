import 'dotenv/config';

console.log('🧪 Testing Venice AI Configuration...\n');

// Check if API key is loaded
console.log('1. Checking environment variables:');
console.log('   VENICE_API_KEY:', process.env.VENICE_API_KEY ? '✅ Found' : '❌ Missing');
console.log('   Key length:', process.env.VENICE_API_KEY?.length || 0);
console.log('   First 10 chars:', process.env.VENICE_API_KEY?.substring(0, 10) || 'N/A');

// Test API call
console.log('\n2. Testing Venice AI API call...');

const testVeniceAPI = async () => {
  try {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen3-4b',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello, Venice AI is working!"' }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    console.log('   Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('   ❌ API Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('   ✅ API Response:', data.choices[0].message.content);
    
  } catch (error) {
    console.error('   ❌ Test failed:', error.message);
  }
};

testVeniceAPI();


