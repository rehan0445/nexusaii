/**
 * Fix Supabase Site URL Configuration (CommonJS)
 * Usage: node fix-supabase-site-url.cjs YOUR_ACCESS_TOKEN
 */

const https = require('https');

const SUPABASE_PROJECT_REF = 'dswuotsdaltsomyqqykn';
const RAILWAY_URL = 'https://nexuschats.up.railway.app';

console.log('🔧 Supabase Site URL Configuration Fixer (CJS)');
console.log('==============================================');
console.log(`Project: ${SUPABASE_PROJECT_REF}`);
console.log(`Target URL: ${RAILWAY_URL}`);
console.log('');

const accessToken = process.argv[2];

if (!accessToken) {
  console.error('❌ Error: No access token provided');
  console.log('Usage: node fix-supabase-site-url.cjs YOUR_ACCESS_TOKEN');
  process.exit(1);
}

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
      console.log(`📧 Email verification links will now use: ${RAILWAY_URL}/auth/callback`);
    } else {
      console.error(`❌ Error: ${res.statusCode} - ${res.statusMessage}`);
      console.error('Response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(data);
req.end();









