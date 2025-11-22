# Create server/.env file with all required environment variables

Write-Host "Creating server/.env file..." -ForegroundColor Cyan

# Generate a random JWT secret
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 128 | ForEach-Object {[char]$_})

$envContent = @"
# ===================================
# NEXUS SERVER ENVIRONMENT VARIABLES
# ===================================

# === REQUIRED: Database (Supabase) ===
# Get these from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
# IMPORTANT: You MUST replace these with your actual Supabase credentials!
SUPABASE_URL=PASTE_YOUR_SUPABASE_URL_HERE
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVICE_ROLE_KEY_HERE

# === REQUIRED: AI Configuration ===
# Get your Venice AI API key from: https://venice.ai/
# IMPORTANT: This is required for character chat to work!
VENICE_API_KEY=PASTE_YOUR_VENICE_API_KEY_HERE

# === REQUIRED: Security ===
# Auto-generated secure JWT secret - keep this secret!
JWT_SECRET=$jwtSecret

# === Server Configuration ===
PORT=8002
HOST=0.0.0.0
NODE_ENV=development

# === CORS Configuration ===
# Comma-separated list of allowed origins
CORS_ALLOWLIST=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,http://0.0.0.0:3000
ALLOW_ALL_ORIGINS=false

# === Rate Limiting ===
RATE_LIMIT_MAX=300
JSON_LIMIT=512kb
VENICE_MAX_CONCURRENT=50

# === CSRF Protection (disabled for local development) ===
CSRF_ENABLED=false

# === Authentication Rate Limiting ===
AUTH_MAX_ATTEMPTS=5
AUTH_WINDOW_MS=900000
AUTH_LOCKOUT_MS=600000

# === Monitoring (Optional) ===
SENTRY_DSN=
SENTRY_ENABLED=false

# === Other Optional AI Keys ===
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
"@

try {
    $envPath = Join-Path $PSScriptRoot "server\.env"
    $envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
    
    Write-Host ""
    Write-Host "SUCCESS: Created server/.env file" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT - You MUST edit server/.env and add:" -ForegroundColor Yellow
    Write-Host "  1. SUPABASE_URL (from Supabase dashboard)" -ForegroundColor Yellow
    Write-Host "  2. SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard)" -ForegroundColor Yellow
    Write-Host "  3. VENICE_API_KEY (from venice.ai)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Where to find these credentials:" -ForegroundColor Cyan
    Write-Host "  - Supabase: https://app.supabase.com/project/YOUR_PROJECT/settings/api" -ForegroundColor White
    Write-Host "  - Venice AI: https://venice.ai/ (sign up and get API key)" -ForegroundColor White
    Write-Host ""
    Write-Host "A secure JWT_SECRET has been auto-generated for you." -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Failed to create server/.env file" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

