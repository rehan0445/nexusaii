import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get local IP (default to 192.168.1.36 or ask user to update)
const networkIP = '192.168.1.36';

const envContent = `# Nexus Client Environment Variables

# Backend API URL - CHANGE THIS TO YOUR NETWORK IP
# For local: http://localhost:8002
# For network: http://YOUR_IP:8002
VITE_API_URL=http://${networkIP}:8002
VITE_SERVER_URL=http://${networkIP}:8002
`;

const envLocalContent = `# Nexus Client - Localhost Only
VITE_API_URL=http://localhost:8002
VITE_SERVER_URL=http://localhost:8002
`;

try {
  const envPath = join(__dirname, 'client', '.env');
  const envLocalPath = join(__dirname, 'client', '.env.local');
  
  writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Created client/.env with network IP:', networkIP);
  
  writeFileSync(envLocalPath, envLocalContent, 'utf8');
  console.log('✅ Created client/.env.local for localhost');
  
  console.log('\n📝 Your frontend will now use:');
  console.log(`   Network: http://${networkIP}:8002`);
  console.log(`   Localhost: http://localhost:8002`);
  console.log('\n⚠️  If your IP is different, edit client/.env and update VITE_API_URL');
} catch (error) {
  console.error('❌ Error:', error.message);
}

