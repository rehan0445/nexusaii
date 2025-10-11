// Quick test for Venice API key
import 'dotenv/config';

const API_KEY = process.env.VENICE_API_KEY;

console.log('🔑 Testing Venice API Key...');
console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

async function testVeniceAPI() {
  if (!API_KEY) {
    console.error('❌ VENICE_API_KEY not found in environment');
    process.exit(1);
  }

  try {
    console.log('\n📡 Sending test request to Venice AI...');
    
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen3-4b',
        messages: [
          { role: 'user', content: 'Say "Hello from Venice AI!" in one sentence.' }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log('\n✅ Venice AI Response:');
    console.log(data.choices[0]?.message?.content || 'No response');
    console.log('\n🎉 Venice API key is working!');
    
  } catch (error) {
    console.error('❌ Error testing Venice API:', error.message);
    process.exit(1);
  }
}

testVeniceAPI();

