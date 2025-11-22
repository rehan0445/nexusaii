import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// User's Supabase credentials
const SUPABASE_URL = 'https://dswuotsdaltsomyqqykn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzd3VvdHNkYWx0c29teXFxeWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM4MzgyNiwiZXhwIjoyMDc0OTU5ODI2fQ.BVCW6hzW6DCY9NFG-Vc4aiLk470A5_0eCVrfjjUxldw';

// Generate a secure JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

const envContent = `# ===================================
# NEXUS SERVER ENVIRONMENT VARIABLES
# ===================================

# === Database (Supabase) ===
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# === Security ===
JWT_SECRET=${jwtSecret}

# === Server Configuration ===
PORT=8002
HOST=0.0.0.0
NODE_ENV=development

# === CORS Configuration ===
# Comma-separated list of allowed origins (add your network IP here if needed)
CORS_ALLOWLIST=http://localhost:3000,http://localhost:5173,http://localhost:8080

# === Rate Limiting ===
RATE_LIMIT_MAX=300
JSON_LIMIT=512kb

# === CSRF Protection (disabled for local development) ===
CSRF_ENABLED=false

# === Authentication Rate Limiting ===
AUTH_MAX_ATTEMPTS=5
AUTH_WINDOW_MS=900000
AUTH_LOCKOUT_MS=600000

# === AI API Keys (Optional - for AI chat features) ===
# Add your API keys here if you have them
GEMINI_API_KEY=
ANTHROPIC_API_KEY=

# === Monitoring (Optional) ===
SENTRY_DSN=
SENTRY_ENABLED=false
`;

try {
  const envPath = join(__dirname, 'server', '.env');
  writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Successfully created server/.env with your Supabase credentials!');
  console.log('🔐 JWT_SECRET has been auto-generated');
  console.log('\n📋 Your configuration:');
  console.log(`   - Supabase URL: ${SUPABASE_URL}`);
  console.log(`   - Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 30)}...`);
  console.log(`   - JWT Secret: Generated (${jwtSecret.length} characters)`);
  console.log('\n✅ Ready to proceed with setup!');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  process.exit(1);
}

