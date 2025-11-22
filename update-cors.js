import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envPath = join(__dirname, 'server', '.env');
  let envContent = readFileSync(envPath, 'utf8');
  
  // Update CORS_ALLOWLIST to include network IP
  const newCors = 'CORS_ALLOWLIST=http://localhost:3000,http://localhost:5173,http://localhost:8080,http://192.168.1.36:3000,http://192.168.1.36:5173,http://192.168.1.36:8002,http://192.168.1.36:8080';
  
  envContent = envContent.replace(
    /CORS_ALLOWLIST=.*/,
    newCors
  );
  
  writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Updated CORS configuration!');
  console.log('📱 Your phone can now access: http://192.168.1.36:3000');
  console.log('\n⚠️  IMPORTANT: Restart your server for changes to take effect!');
  console.log('   1. Stop server (Ctrl+C)');
  console.log('   2. Run: npm start');
} catch (error) {
  console.error('❌ Error updating CORS:', error.message);
}

