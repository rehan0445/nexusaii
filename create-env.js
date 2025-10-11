import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate a secure JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

const envTemplate = `# ===================================
# NEXUS SERVER ENVIRONMENT VARIABLES
# ===================================

# === REQUIRED: Database (Supabase) ===
# PASTE YOUR SUPABASE CREDENTIALS BELOW:
SUPABASE_URL=PASTE_YOUR_SUPABASE_URL_HERE
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE

# === REQUIRED: Security ===
# This is auto-generated for you - keep this secret!
JWT_SECRET=${jwtSecret}

# === Server Configuration ===
PORT=8002
HOST=0.0.0.0
NODE_ENV=development

# === CORS Configuration ===
# Comma-separated list of allowed origins (add your network IP here)
CORS_ALLOWLIST=http://localhost:3000,http://localhost:5173,http://localhost:8080,http://192.168.1.1:3000,http://192.168.1.1:5173

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
  writeFileSync(envPath, envTemplate, 'utf8');
  console.log('✅ Created server/.env file');
  console.log('📝 Please edit server/.env and add your Supabase credentials');
  console.log('\n🔐 A secure JWT_SECRET has been generated for you');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n📝 Please create server/.env manually with the following content:\n');
  console.log(envTemplate);
}

