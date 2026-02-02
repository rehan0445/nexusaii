/**
 * Fix Supabase Site URL Configuration
 * This script updates the Supabase auth configuration to use Railway production URL
 */

const https = require('https');

const SUPABASE_PROJECT_REF = 'dswuotsdaltsomyqqykn';
const RAILWAY_URL = 'https://nexuschats.up.railway.app';

console.log('🔧 Supabase Site URL Configuration Fixer');
console.log('==========================================');
console.log(`Project: ${SUPABASE_PROJECT_REF}`);
console.log(`Target URL: ${RAILWAY_URL}`);
console.log('');

console.log('⚠️  IMPORTANT: This script requires your Supabase Personal Access Token');
console.log('');
console.log('📋 How to get your Personal Access Token:');
console.log('   1. Go to: https://app.supabase.com/account/tokens');
console.log('   2. Click "Generate New Token"');
console.log('   3. Name it "CLI Access" and copy the token');
console.log('   4. Run this script with the token:');
console.log('');
console.log('   node fix-supabase-site-url.js YOUR_ACCESS_TOKEN');
console.log('');

const accessToken = process.argv[2];

if (!accessToken) {
  console.error('❌ Error: No access token provided');
  console.log('');
  console.log('Usage: node fix-supabase-site-url.js YOUR_ACCESS_TOKEN');
  process.exit(1);
}

// Configuration to update
const authConfig = {
  SITE_URL: RAILWAY_URL,
  URI_ALLOW_LIST: [
    `${RAILWAY_URL}/auth/callback`,
    `${RAILWAY_URL}/companion`,
    RAILWAY_URL,
    'http://localhost:5173/auth/callback',
    'http://localhost:5173'
  ].join(',')
};

console.log('📝 Configuration to apply:');
console.log(`   Site URL: ${authConfig.SITE_URL}`);
console.log(`   Redirect URLs: ${authConfig.URI_ALLOW_LIST}`);
console.log('');

// Make API request to update configuration
const data = JSON.stringify(authConfig);

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🚀 Updating Supabase configuration...');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Success! Supabase configuration updated');
      console.log('');
      console.log('📧 Email verification links will now use:');
      console.log(`   ${RAILWAY_URL}/auth/callback`);
      console.log('');
      console.log('⏰ Wait 30-60 seconds for changes to propagate');
      console.log('');
      console.log('🧪 Test by registering a new user at:');
      console.log(`   ${RAILWAY_URL}/register`);
    } else {
      console.error(`❌ Error: ${res.statusCode} - ${res.statusMessage}`);
      console.error('Response:', responseData);
      
      if (res.statusCode === 401) {
        console.log('');
        console.log('🔑 Token issue detected. Please:');
        console.log('   1. Generate a new token at: https://app.supabase.com/account/tokens');
        console.log('   2. Make sure the token has full project access');
        console.log('   3. Run the script again with the new token');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(data);
req.end();


