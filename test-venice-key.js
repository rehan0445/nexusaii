#!/usr/bin/env node
// Quick script to test Venice API key validity

import { config } from 'dotenv';
config({ path: './server/.env' });

const API_KEY = process.env.VENICE_API_KEY;

console.log('\n═══════════════════════════════════════════');
console.log('🔑 Venice API Key Test');
console.log('═══════════════════════════════════════════\n');

if (!API_KEY) {
  console.log('❌ VENICE_API_KEY not found in environment');
  console.log('   Add it to server/.env file\n');
  process.exit(1);
}

console.log('✅ API Key loaded from environment');
console.log(`   Length: ${API_KEY.length} characters`);
console.log(`   Preview: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 6)}`);
console.log(`   Has spaces: ${API_KEY.includes(' ') ? '❌ YES (REMOVE THEM!)' : '✅ No'}`);
console.log(`   Has newlines: ${API_KEY.includes('\n') ? '❌ YES (REMOVE THEM!)' : '✅ No'}`);
console.log(`   Has tabs: ${API_KEY.includes('\t') ? '❌ YES (REMOVE THEM!)' : '✅ No'}\n`);

console.log('🧪 Testing Venice API connection...\n');

async function testVeniceAPI() {
  try {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen3-4b',
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Say "API key is valid!" if you can read this.' }
        ],
        max_tokens: 50,
        temperature: 0.7
      })
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);

    if (response.status === 401) {
      console.log('❌ 401 UNAUTHORIZED');
      console.log('   The API key is INVALID or EXPIRED\n');
      console.log('📋 To fix:');
      console.log('   1. Go to https://venice.ai/');
      console.log('   2. Login to your account');
      console.log('   3. Go to Settings → API Keys');
      console.log('   4. Generate a NEW API key');
      console.log('   5. Copy the new key');
      console.log('   6. Update VENICE_API_KEY in Railway\n');
      
      const errorText = await response.text();
      console.log('Error details:', errorText, '\n');
      process.exit(1);
    }

    if (response.status === 403) {
      console.log('❌ 403 FORBIDDEN');
      console.log('   Your API key does not have access to model: qwen3-4b\n');
      console.log('📋 To fix:');
      console.log('   1. Check your Venice.ai plan/subscription');
      console.log('   2. Or try a different model (llama-3.2-3b, venice-uncensored)\n');
      process.exit(1);
    }

    if (response.status === 429) {
      console.log('❌ 429 RATE LIMIT EXCEEDED');
      console.log('   Too many requests. Wait a few minutes and try again.\n');
      process.exit(1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error ${response.status}:`, errorText, '\n');
      process.exit(1);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('✅ SUCCESS! Venice API Key is VALID!\n');
    console.log('🤖 AI Response:', aiResponse, '\n');
    console.log('📊 Usage:', data.usage, '\n');
    console.log('═══════════════════════════════════════════');
    console.log('✅ Your Venice API key is working correctly!');
    console.log('   You can now use it in production.');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.log('❌ Network Error:', error.message, '\n');
    process.exit(1);
  }
}

testVeniceAPI();
